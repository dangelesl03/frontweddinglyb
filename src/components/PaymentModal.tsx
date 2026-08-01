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
  
  // Estados para diseño premium
  const [activeMethod, setActiveMethod] = useState<'yape' | 'plin' | 'bank'>('yape');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Función helper para copiar número sin espacios
  const handleCopy = (text: string, key: string) => {
    const cleanedText = text.replace(/\s+/g, '');
    navigator.clipboard.writeText(cleanedText);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Función helper para obtener la URL del QR
  const getQRImage = (type: 'yape' | 'plin'): string => {
    if (type === 'yape') {
      return '/qr-codes/yape-qr-v2.jpg';
    }
    return '/qr-codes/plin-qr.png';
  };

  const paymentInfo = {
    yape: {
      number: config.payment.yape.number,
      qr: getQRImage('yape'),
      holder: 'Braulio Espinoza'
    },
    plin: {
      number: config.payment.plin.number,
      qr: getQRImage('plin'),
      holder: 'Lisset Piscoya'
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-[#faf8f5] rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-aqua-100 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-[#faf8f5]/95 backdrop-blur-md border-b border-aqua-100 p-5 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-serif text-aqua-800 font-semibold">Información de Pago</h2>
            <p className="text-xs text-aqua-600 mt-0.5">Elige tu método de pago preferido para registrar tu regalo</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-aqua-600 hover:bg-aqua-100 hover:text-aqua-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Resumen */}
          <div className="bg-white border border-aqua-100 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed border-aqua-100">
              <h3 className="font-serif text-aqua-800 font-medium">Resumen de tu contribución:</h3>
              <span className="text-xs text-aqua-500 bg-aqua-50 px-2 py-0.5 rounded-full border border-aqua-100">
                {items.length} {items.length === 1 ? 'regalo' : 'regalos'}
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
              {items.map((item) => (
                <div key={item._id} className="flex justify-between text-sm text-aqua-700">
                  <span className="font-light truncate max-w-[70%]">{item.name} <span className="text-aqua-400 font-normal">x{item.quantity}</span></span>
                  <span className="font-mono text-aqua-900 font-medium">S/ {((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-serif font-bold text-lg mt-3 pt-3 border-t border-aqua-100 text-aqua-900">
              <span>Total a Transferir:</span>
              <span className="font-mono">S/ {(typeof totalPrice === 'string' ? parseFloat(totalPrice) : totalPrice).toFixed(2)}</span>
            </div>
          </div>

          {/* Selector de métodos de pago (Pestañas) */}
          <div>
            <label className="block text-sm font-medium text-aqua-800 mb-2.5 font-serif">
              Elige cómo deseas realizar tu aporte:
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-aqua-100/50 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveMethod('yape')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                  activeMethod === 'yape'
                    ? 'bg-white text-purple-700 shadow-sm border border-purple-100'
                    : 'text-aqua-700 hover:bg-white/40 hover:text-aqua-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7a1fa2]"></span>
                  <span className="font-semibold">Yape</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveMethod('plin')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                  activeMethod === 'plin'
                    ? 'bg-white text-[#00bcd4] shadow-sm border border-cyan-100'
                    : 'text-aqua-700 hover:bg-white/40 hover:text-aqua-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00bcd4]"></span>
                  <span className="font-semibold">Plin</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveMethod('bank')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                  activeMethod === 'bank'
                    ? 'bg-white text-aqua-800 shadow-sm border border-aqua-200'
                    : 'text-aqua-700 hover:bg-white/40 hover:text-aqua-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-aqua-500"></span>
                  <span className="font-semibold">Transferencia</span>
                </div>
              </button>
            </div>
          </div>

          {/* Paneles de Contenido de Pago */}
          <div className="bg-white border border-aqua-100 rounded-xl p-5 shadow-sm transition-all duration-500 min-h-[220px] flex items-center justify-center">
            {activeMethod === 'yape' && (
              <div className="w-full flex flex-col md:flex-row gap-5 items-center animate-fade-in">
                {/* QR */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2 group">
                  <div className="bg-aqua-50/50 p-2.5 rounded-xl border border-aqua-100/80 shadow-inner overflow-hidden max-w-[150px] md:max-w-[170px]">
                    <img
                      src={paymentInfo.yape.qr}
                      alt="QR Yape"
                      className="w-full h-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentInfo.yape.number}&margin=10`;
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-aqua-400 font-light italic">Pasa el cursor para ampliar</span>
                </div>
                {/* Detalles */}
                <div className="flex-1 space-y-3 text-center md:text-left w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 border-b border-aqua-50 pb-2">
                    <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full self-center md:self-start">YAPE</span>
                    <div className="text-xs text-aqua-500">
                      Titular: <span className="font-semibold text-aqua-700">{paymentInfo.yape.holder}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-aqua-500 font-light">Escanea el QR o yapea al número:</p>
                    <p className="text-2xl font-mono font-bold text-aqua-900 tracking-wider mt-1">{paymentInfo.yape.number}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentInfo.yape.number, 'yape')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                      copiedKey === 'yape'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-aqua-200 text-aqua-700 hover:bg-aqua-50 hover:text-aqua-800'
                    }`}
                  >
                    {copiedKey === 'yape' ? '✓ ¡Número Copiado!' : '📋 Copiar número'}
                  </button>
                </div>
              </div>
            )}

            {activeMethod === 'plin' && (
              <div className="w-full flex flex-col md:flex-row gap-5 items-center animate-fade-in">
                {/* QR */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2 group">
                  <div className="bg-aqua-50/50 p-2.5 rounded-xl border border-aqua-100/80 shadow-inner overflow-hidden max-w-[150px] md:max-w-[170px]">
                    <img
                      src={paymentInfo.plin.qr}
                      alt="QR Plin"
                      className="w-full h-auto object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentInfo.plin.number}&margin=10`;
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-aqua-400 font-light italic">Pasa el cursor para ampliar</span>
                </div>
                {/* Detalles */}
                <div className="flex-1 space-y-3 text-center md:text-left w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 border-b border-aqua-50 pb-2">
                    <span className="text-xs font-semibold bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-full self-center md:self-start">PLIN</span>
                    <div className="text-xs text-aqua-500">
                      Titular: <span className="font-semibold text-aqua-700">{paymentInfo.plin.holder}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-aqua-500 font-light">Escanea el QR o transfiere al número:</p>
                    <p className="text-2xl font-mono font-bold text-aqua-900 tracking-wider mt-1">{paymentInfo.plin.number}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentInfo.plin.number, 'plin')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                      copiedKey === 'plin'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-aqua-200 text-aqua-700 hover:bg-aqua-50 hover:text-aqua-800'
                    }`}
                  >
                    {copiedKey === 'plin' ? '✓ ¡Número Copiado!' : '📋 Copiar número'}
                  </button>
                </div>
              </div>
            )}

            {activeMethod === 'bank' && (
              <div className="w-full space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-aqua-50 pb-2">
                  <span className="text-xs font-semibold bg-aqua-100 text-aqua-800 px-2.5 py-0.5 rounded-full">TRANSFERENCIA</span>
                  <div className="text-xs text-aqua-500">
                    Titular: <span className="font-semibold text-aqua-700">{paymentInfo.accountHolder}</span>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {paymentInfo.bankAccounts.map((bankAccount, index) => (
                    <div key={index} className="bg-aqua-50/30 p-3 rounded-lg border border-aqua-100/60 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-aqua-400 font-light">Banco</span>
                        <span className="font-serif font-bold text-aqua-800 text-base">{bankAccount.bank}</span>
                      </div>
                      
                      <div className="flex justify-between items-center gap-2">
                        <div className="text-left">
                          <span className="text-[10px] text-aqua-400 block font-light">Número de Cuenta</span>
                          <span className="font-mono text-sm font-semibold text-aqua-900">{bankAccount.account}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(bankAccount.account, `acc-${index}`)}
                          className={`px-2.5 py-1 rounded text-xs transition-all duration-300 ${
                            copiedKey === `acc-${index}`
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-white text-aqua-600 border border-aqua-200 hover:bg-aqua-50'
                          }`}
                        >
                          {copiedKey === `acc-${index}` ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>

                      <div className="flex justify-between items-center gap-2 pt-1 border-t border-dashed border-aqua-100/80">
                        <div className="text-left">
                          <span className="text-[10px] text-aqua-400 block font-light">Cuenta Interbancaria (CCI)</span>
                          <span className="font-mono text-xs font-semibold text-aqua-900">{bankAccount.cci}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(bankAccount.cci, `cci-${index}`)}
                          className={`px-2.5 py-1 rounded text-xs transition-all duration-300 ${
                            copiedKey === `cci-${index}`
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-white text-aqua-600 border border-aqua-200 hover:bg-aqua-50'
                          }`}
                        >
                          {copiedKey === `cci-${index}` ? '✓ Copiado' : '📋 Copiar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Formulario de confirmación */}
          <div className="space-y-4 pt-4 border-t border-aqua-100">
            <h4 className="font-serif text-aqua-800 font-medium text-sm">Confirma tu aporte subiendo tu comprobante:</h4>
            
            {/* Input de Invitado */}
            <div>
              <label htmlFor="note" className="block text-xs font-medium text-aqua-700 mb-1">
                Tu Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (errors.note) setErrors({ ...errors, note: undefined });
                }}
                placeholder="Ingresa tu nombre para saber quién envía el regalo"
                className={`w-full px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-aqua-400 focus:border-transparent text-sm transition-all bg-white ${
                  errors.note ? 'border-red-300 bg-red-50/20' : 'border-aqua-200 text-aqua-900'
                }`}
              />
              {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
            </div>

            {/* Input de Comprobante */}
            <div>
              <label htmlFor="receipt" className="block text-xs font-medium text-aqua-700 mb-1">
                Comprobante de Pago <span className="text-red-500">*</span>
              </label>
              
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all bg-white cursor-pointer relative ${
                errors.receipt 
                  ? 'border-red-300 hover:bg-red-50/10' 
                  : receiptFile 
                    ? 'border-green-300 bg-green-50/10' 
                    : 'border-aqua-200 hover:border-aqua-400 hover:bg-aqua-50/20'
              }`}>
                <input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-1.5 pointer-events-none">
                  {receiptFile ? (
                    <>
                      <svg className="w-8 h-8 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-green-700 font-medium">✓ {receiptFile.name}</p>
                      <p className="text-[10px] text-aqua-400 font-light">Haz clic o arrastra para cambiar de archivo</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mx-auto text-aqua-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="text-xs text-aqua-600 font-medium">Seleccionar o soltar comprobante</p>
                      <p className="text-[10px] text-aqua-400 font-light">Formatos JPG, PNG o PDF (máx. 5MB)</p>
                    </>
                  )}
                </div>
              </div>
              {errors.receipt && <p className="mt-1.5 text-xs text-red-500">{errors.receipt}</p>}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-aqua-100 bg-aqua-50/30 flex flex-col gap-2 mt-auto">
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="w-full bg-aqua-500 hover:bg-aqua-600 text-white py-2.5 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm font-serif font-semibold tracking-wide transition-all shadow-md shadow-aqua-500/10 hover:shadow-lg active:scale-[0.99]"
          >
            {isProcessing ? 'Procesando aporte...' : 'Confirmar Aporte'}
          </button>
          <p className="text-[10px] text-aqua-400 text-center font-light mt-0.5">
            Al confirmar, tus regalos seleccionados se marcarán como reservados hasta que validemos el comprobante. ¡Muchas gracias!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
