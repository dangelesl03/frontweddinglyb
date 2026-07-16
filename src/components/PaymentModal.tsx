import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAlert } from '../contexts/AlertContext';
import { apiService } from '../services/api';
import { config } from '../config';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { items, totalPrice, clearCart } = useCart();
  const { showAlert } = useAlert();
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | undefined>(undefined);
  const [receiptBase64, setReceiptBase64] = useState<string | undefined>(undefined);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ receipt?: string; note?: string }>({});

  // Información de pago
  // Función helper para obtener la URL del QR (intenta varias rutas)
  const getQRImage = (type: 'yape' | 'plin'): string => {
    // Intentar diferentes rutas posibles
    const paths = [
      `/qr-codes/${type}-qr.png`,
      `/qr-codes/${type}-qr.jpg`,
      `/qr-codes/${type}-qr.jpeg`,
      `/images/${type}-qr.png`,
      `/images/${type}-qr.jpg`
    ];
    
    // Por ahora usar las rutas públicas, puedes cambiar esto cuando subas las imágenes
    return paths[0]; // Retornar la primera ruta por defecto
  };

  const paymentInfo = {
    yape: {
      number: config.payment.yape.number,
      qr: getQRImage('yape')
    },
    plin: {
      number: config.payment.plin.number,
      qr: getQRImage('plin')
    },
    bankAccounts: config.payment.bankAccounts,
    accountHolder: config.payment.accountHolder
  };

  // Función para comprimir imagen
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Si es PDF, convertir directamente a Base64 sin comprimir
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calcular nuevas dimensiones manteniendo la proporción
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a Base64 con compresión
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Función para convertir archivo a Base64
  const convertFileToBase64 = async (file: File): Promise<string> => {
    // Para PDFs, convertir directamente sin comprimir
    if (file.type === 'application/pdf') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Para imágenes, comprimir
    const maxBase64Size = 3 * 1024 * 1024; // 3MB
    let quality = 0.8;
    let maxWidth = 1920;
    let maxHeight = 1080;
    
    while (quality > 0.3) {
      const compressed = await compressImage(file, maxWidth, maxHeight, quality);
      const base64Size = compressed.length;
      
      if (base64Size < maxBase64Size) {
        return compressed;
      }
      
      quality -= 0.1;
      maxWidth = Math.floor(maxWidth * 0.9);
      maxHeight = Math.floor(maxHeight * 0.9);
    }
    
    const finalCompressed = await compressImage(file, 1200, 800, 0.4);
    
    if (finalCompressed.length > maxBase64Size) {
      throw new Error(`La imagen es demasiado grande incluso después de comprimir. Por favor, usa una imagen más pequeña.`);
    }
    
    return finalCompressed;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo (imágenes y PDFs)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, receipt: 'Por favor sube una imagen (JPG, PNG, GIF) o un PDF' });
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, receipt: 'El archivo es demasiado grande. Máximo 5MB' });
        return;
      }
      
      try {
        // Convertir a Base64 (se comprimirá automáticamente si es imagen)
        const base64 = await convertFileToBase64(file);
        // Guardar el archivo original para mostrar preview y el Base64 para enviar
        setReceiptFile(file);
        setReceiptBase64(base64);
        setErrors({ ...errors, receipt: undefined });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error al procesar el archivo';
        setErrors({ ...errors, receipt: errorMessage });
      }
    }
  };

  const handleConfirm = async () => {
    // Validar campos obligatorios
    const newErrors: { receipt?: string; note?: string } = {};
    
    if (!receiptFile) {
      newErrors.receipt = 'Por favor sube el comprobante de pago';
    }
    
    if (!note || note.trim() === '') {
      newErrors.note = 'Por favor ingresa tu nombre de invitado';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showAlert('error', 'Por favor completa todos los campos obligatorios', 4000);
      return;
    }

    setIsProcessing(true);
    try {
      // Obtener IDs de los regalos del carrito y los montos pagados
      const giftIds = items.map(item => item._id);
      const amounts = items.map(item => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        const quantity = item.quantity || 1;
        return price * quantity;
      });
      
      // Usar Base64 almacenado o convertir si no está disponible
      const base64ToSend = receiptBase64 || await convertFileToBase64(receiptFile!);
      
      await apiService.confirmPayment(
        giftIds,
        'Transferencia',
        note.trim(),
        amounts,
        base64ToSend // Enviar Base64 en lugar del archivo
      );
      
      // Limpiar carrito y formulario después de confirmar
      clearCart();
      setReceiptFile(undefined);
      setReceiptBase64(undefined);
      setNote('');
      setErrors({});
      onConfirm();
      onClose();
      
      showAlert('success', '¡Pago confirmado! Tu contribución ha sido registrada. Gracias por tu aporte.', 4000);
      
      localStorage.setItem('activeTab', 'regalos');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al procesar el pago. Por favor intenta nuevamente.';
      showAlert('error', errorMessage, 6000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setReceiptFile(undefined);
    setReceiptBase64(undefined);
    setNote('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Información de Pago</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resumen */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Resumen de tu compra:</h3>
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>S/ {((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t">
              <span>Total:</span>
              <span>S/ {(typeof totalPrice === 'string' ? parseFloat(totalPrice) : totalPrice).toFixed(2)}</span>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-6">
            {/* Yape */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2">YAPE</span>
                Número: {paymentInfo.yape.number}
              </h3>
              <div className="flex items-center space-x-4">
                <div className="bg-white p-2 rounded border flex-shrink-0">
                  <img
                    src={paymentInfo.yape.qr}
                    alt="QR Yape"
                    className="w-40 h-40 object-contain"
                    onError={(e) => {
                      // Si la imagen no se encuentra, usar QR genérico
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentInfo.yape.number}&margin=10`;
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Escanea el código QR con la app de Yape o transfiere al número:
                  </p>
                  <p className="text-lg font-mono font-bold">{paymentInfo.yape.number}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentInfo.yape.number);
                      alert('Número de Yape copiado al portapapeles');
                    }}
                    className="mt-2 text-sm text-aqua-600 hover:text-aqua-700"
                  >
                    📋 Copiar número
                  </button>
                </div>
              </div>
            </div>

            {/* Plin */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2">PLIN</span>
                Número: {paymentInfo.plin.number}
              </h3>
              <div className="flex items-center space-x-4">
                <div className="bg-white p-2 rounded border flex-shrink-0">
                  <img
                    src={paymentInfo.plin.qr}
                    alt="QR Plin"
                    className="w-40 h-40 object-contain"
                    onError={(e) => {
                      // Si la imagen no se encuentra, usar QR genérico
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentInfo.plin.number}&margin=10`;
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Escanea el código QR con la app de Plin o transfiere al número:
                  </p>
                  <p className="text-lg font-mono font-bold">{paymentInfo.plin.number}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentInfo.plin.number);
                      alert('Número de Plin copiado al portapapeles');
                    }}
                    className="mt-2 text-sm text-aqua-600 hover:text-aqua-700"
                  >
                    📋 Copiar número
                  </button>
                </div>
              </div>
            </div>

            {/* Cuentas Bancarias */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Transferencia Bancaria</h3>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">Titular:</span> {paymentInfo.accountHolder}
              </p>
              
              <div className="space-y-6">
                {paymentInfo.bankAccounts.map((bankAccount, index) => (
                  <div key={index} className={`${index > 0 ? 'pt-4 border-t border-gray-200' : ''}`}>
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">Banco:</span>
                      <p className="font-semibold text-lg">{bankAccount.bank}</p>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">
                        {bankAccount.bank === 'BCP' ? 'Cuenta Soles:' : 'Cuenta Ahorro Sueldo Soles:'}
                      </span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold">{bankAccount.account}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(bankAccount.account);
                            alert(`Número de cuenta ${bankAccount.bank} copiado al portapapeles`);
                          }}
                          className="text-sm text-aqua-600 hover:text-aqua-700"
                        >
                          📋 Copiar
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        {bankAccount.bank === 'BCP' ? 'CCI (Interbancario):' : 'CCI (Cuenta Interbancario):'}
                      </span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-semibold">{bankAccount.cci}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(bankAccount.cci);
                            alert(`CCI ${bankAccount.bank} copiado al portapapeles`);
                          }}
                          className="text-sm text-aqua-600 hover:text-aqua-700"
                        >
                          📋 Copiar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Campos obligatorios: Comprobante y Nota */}
          <div className="mt-6 pt-6 border-t space-y-4">
            <div>
              <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante de Pago <span className="text-red-500">*</span>
              </label>
              <input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
              />
              {errors.receipt && (
                <p className="mt-1 text-sm text-red-600">{errors.receipt}</p>
              )}
              {receiptFile && (
                <p className="mt-1 text-sm text-green-600">
                  ✓ Archivo seleccionado: {receiptFile.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Formatos aceptados: JPG, PNG, GIF, PDF (máximo 5MB)
              </p>
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de invitado <span className="text-red-500">*</span>
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (errors.note) {
                    setErrors({ ...errors, note: undefined });
                  }
                }}
                placeholder="Por favor ingresa tu nombre completo para identificar tu pago"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500 ${
                  errors.note ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.note && (
                <p className="mt-1 text-sm text-red-600">{errors.note}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                💡 Sugerencia: Incluye tu nombre completo para facilitar la identificación de tu pago
              </p>
            </div>
          </div>

          {/* Botón de confirmar */}
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="w-full bg-aqua-600 text-white py-3 px-6 rounded-md hover:bg-aqua-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
            >
              {isProcessing ? 'Procesando...' : '✓ Confirmar Pago'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Al confirmar, marcarás estos regalos como pagados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
