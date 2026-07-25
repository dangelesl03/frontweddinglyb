import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAlert } from '../contexts/AlertContext';

interface AddGiftFormProps {
  onSuccess?: () => void;
}

const AddGiftForm: React.FC<AddGiftFormProps> = ({ onSuccess }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState<'url' | 'file'>('url');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'PEN',
    category: 'Otro',
    available: '1',
    total: '1',
    imageUrl: ''
  });

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiService.getCategories();
        setCategories(data.map((cat: any) => cat.name));
        // Si no hay categorías, usar las por defecto
        if (data.length === 0) {
          setCategories(['Luna de Miel', 'Arte y Deco', 'Otro']);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback a categorías por defecto
        setCategories(['Luna de Miel', 'Arte y Deco', 'Otro']);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach((file) => {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showAlert('warning', `${file.name} no es un archivo de imagen válido`);
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('warning', `${file.name} es demasiado grande. Máximo 5MB`);
        return;
      }

      validFiles.push(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          setImagePreviews([...imagePreviews, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
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

  const convertFileToBase64 = async (file: File): Promise<string> => {
    // Siempre comprimir imágenes para mantener el tamaño bajo control
    // Límite máximo: 3MB de Base64 (aprox 2.25MB de imagen original)
    const maxBase64Size = 3 * 1024 * 1024; // 3MB
    
    // Intentar compresión progresiva hasta que el tamaño sea aceptable
    let quality = 0.8;
    let maxWidth = 1920;
    let maxHeight = 1080;
    
    while (quality > 0.3) {
      const compressed = await compressImage(file, maxWidth, maxHeight, quality);
      const base64Size = compressed.length;
      
      // Si el tamaño es aceptable, retornar
      if (base64Size < maxBase64Size) {
        return compressed;
      }
      
      // Reducir calidad y tamaño progresivamente
      quality -= 0.1;
      maxWidth = Math.floor(maxWidth * 0.9);
      maxHeight = Math.floor(maxHeight * 0.9);
    }
    
    // Si aún es muy grande después de comprimir, usar la última versión comprimida
    const finalCompressed = await compressImage(file, 1200, 800, 0.4);
    
    // Validar tamaño final
    if (finalCompressed.length > maxBase64Size) {
      throw new Error(`La imagen es demasiado grande incluso después de comprimir. Por favor, usa una imagen más pequeña o una URL externa.`);
    }
    
    return finalCompressed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name.trim()) {
      showAlert('warning', 'El nombre del regalo es requerido');
      return;
    }

    const price = parseFloat(formData.price);
    if (!price || price <= 0) {
      showAlert('warning', 'El precio debe ser mayor a 0');
      return;
    }

    if (parseInt(formData.available) < 0 || parseInt(formData.total) < 1) {
      showAlert('warning', 'La cantidad disponible y total deben ser válidas');
      return;
    }

    if (parseInt(formData.available) > parseInt(formData.total)) {
      showAlert('warning', 'La cantidad disponible no puede ser mayor al total');
      return;
    }

    setLoading(true);
    try {
      // Obtener la URL de la imagen (ya sea de URL o del archivo subido)
      let finalImageUrl: string | undefined;
      
      if (imageSource === 'file' && selectedFiles.length > 0) {
        // Usar la primera imagen si hay múltiples
        try {
          finalImageUrl = await convertFileToBase64(selectedFiles[0]);
          
          // Validar tamaño del Base64 antes de enviar (máximo 3MB)
          const maxSize = 3 * 1024 * 1024; // 3MB
          if (finalImageUrl.length > maxSize) {
            showAlert('error', `La imagen comprimida es demasiado grande (${(finalImageUrl.length / 1024 / 1024).toFixed(2)}MB). Por favor, usa una imagen más pequeña o una URL externa.`);
            setLoading(false);
            return;
          }
        } catch (error: any) {
          showAlert('error', error.message || 'Error al procesar la imagen. Por favor, intenta con otra imagen o usa una URL.');
          setLoading(false);
          return;
        }
      } else if (imageSource === 'url' && formData.imageUrl.trim()) {
        finalImageUrl = formData.imageUrl.trim();
      } else if (imagePreviews.length > 0 && imageSource === 'url') {
        // Validar tamaño si es Base64
        const preview = imagePreviews[0];
        if (preview.startsWith('data:')) {
          const previewSize = preview.length;
          const maxSize = 3 * 1024 * 1024;
          if (previewSize > maxSize) {
            showAlert('error', `La imagen es demasiado grande (${(previewSize / 1024 / 1024).toFixed(2)}MB). Por favor, comprime la imagen o usa una URL externa.`);
            setLoading(false);
            return;
          }
        }
        finalImageUrl = preview;
      }

      const giftData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: parseFloat(formData.price),
        currency: formData.currency,
        category: formData.category,
        available: parseInt(formData.available),
        total: parseInt(formData.total),
        imageUrl: finalImageUrl
      };

      await apiService.createGift(giftData);
      showAlert('success', 'Regalo creado exitosamente');
      
      // Resetear formulario
      setFormData({
        name: '',
        description: '',
        price: '',
        currency: 'PEN',
        category: 'Otro',
        available: '1',
        total: '1',
        imageUrl: ''
      });
      setSelectedFiles([]);
      setImagePreviews([]);
      setImageSource('url');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear el regalo';
      showAlert('error', errorMessage);
      console.error('Error creating gift:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Agregar Nuevo Regalo</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Regalo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
            placeholder="Ej: Pasajes aéreos para luna de miel"
          />
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
            placeholder="Descripción detallada del regalo..."
          />
        </div>

        {/* Precio y Moneda */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Precio (S/) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
            >
              <option value="PEN">PEN (Soles)</option>
              <option value="USD">USD (Dólares)</option>
            </select>
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Cantidad Disponible y Total */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="available" className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad Disponible <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="available"
              name="available"
              value={formData.available}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
            />
          </div>

          <div>
            <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad Total <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="total"
              name="total"
              value={formData.total}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
            />
          </div>
        </div>

        {/* Imagen - URL o Archivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen del Regalo
          </label>
          
          {/* Selector de método */}
          <div className="mb-3 flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="imageSource"
                value="url"
                checked={imageSource === 'url'}
                onChange={() => {
                  setImageSource('url');
                  setSelectedFiles([]);
                  setImagePreviews([]);
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Usar URL</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="imageSource"
                value="file"
                checked={imageSource === 'file'}
                onChange={() => {
                  setImageSource('file');
                  setFormData(prev => ({ ...prev, imageUrl: '' }));
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Subir archivo</span>
            </label>
          </div>

          {/* Input según el método seleccionado */}
          {imageSource === 'url' ? (
            <div>
              <input
                type="text"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Puedes usar URLs de Imgur, Cloudinary, Unsplash, etc.
              </p>
            </div>
          ) : (
            <div>
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Formatos aceptados: JPG, PNG, GIF, WEBP. Tamaño máximo: 5MB por imagen. Puedes seleccionar múltiples imágenes.
              </p>
              
              {/* Vista previa de las imágenes */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Vista previa ({imagePreviews.length} {imagePreviews.length === 1 ? 'imagen' : 'imágenes'}):
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-full h-32 border border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={preview}
                          alt={`Vista previa ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Eliminar imagen"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1">
                          {selectedFiles[index]?.name || `Imagen ${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 italic">
                    Nota: Solo se usará la primera imagen para el regalo. Las demás se ignorarán.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                price: '',
                currency: 'PEN',
                category: 'Otro',
                available: '1',
                total: '1',
                imageUrl: ''
              });
              setSelectedFiles([]);
              setImagePreviews([]);
              setImageSource('url');
              const fileInput = document.getElementById('imageFile') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-aqua-600 text-white rounded-md hover:bg-aqua-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Creando...' : 'Crear Regalo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddGiftForm;
