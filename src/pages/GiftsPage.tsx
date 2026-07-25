import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAlert } from '../contexts/AlertContext';

interface Gift {
  _id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category: string;
  available: number;
  total: number;
  imageUrl?: string;
  isActive: boolean;
  isContributed: boolean;
  isFullyContributed?: boolean;
  contributors: Array<{
    userId: string;
    amount: number;
    contributedAt: string;
  }>;
}

const isSpecialPartialGift = (name: string) => {
  const n = name.toLowerCase();
  return n.includes('frigobar') || 
         n.includes('parrilla levadiza') || 
         n.includes('juego de living') || 
         n.includes('carpa tienda') || 
         n.includes('panel de tv');
};

const GiftsPage: React.FC = () => {
  const { addToCart, items: cartItems } = useCart();
  const { showAlert } = useAlert();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas las categorías');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [contributingTo, setContributingTo] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [categories, setCategories] = useState<string[]>(['Todas las categorías']);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  // Cargar categorías desde la API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiService.getCategories();
        setCategories(['Todas las categorías', ...data.map((cat: any) => cat.name)]);
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback a categorías por defecto si hay error
        setCategories(['Todas las categorías', 'Luna de Miel', 'El gran día', 'Nuestro hogar', 'Otro']);
      }
    };
    loadCategories();
  }, []);

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedImage]);

  const loadGifts = useCallback(async () => {
    try {
      const params: any = {
        category: selectedCategory !== 'Todas las categorías' ? selectedCategory : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sortBy,
      };

      const giftsData = await apiService.getGifts(params);
      // Normalizar datos: asegurar que imageUrl y price estén correctos
      const giftsWithImageUrl = giftsData.map((gift: any) => {
        const price = typeof gift.price === 'string' ? parseFloat(gift.price) : gift.price;
        // El backend ahora incluye total_contributed en la respuesta
        const totalContributed = parseFloat(gift.total_contributed || 0);
        const isFullyContributed = totalContributed >= (price * (gift.total || 1));
        
        return {
          ...gift,
          imageUrl: gift.imageUrl || gift.image_url || null,
          price: price,
          // Solo marcar como contribuido si realmente alcanzó el precio completo
          isContributed: isFullyContributed,
          isFullyContributed: isFullyContributed
        };
      });
      setGifts(giftsWithImageUrl);
    } catch (error) {
      setError('Error al cargar los regalos');
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  const handleContribute = async (giftId: string) => {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      showAlert('warning', 'Por favor ingresa un monto válido');
      return;
    }

    try {
      const amount = parseFloat(contributionAmount);
      const gift = gifts.find(g => g._id === giftId);
      
      if (!gift) {
        showAlert('error', 'Regalo no encontrado');
        return;
      }

      // Validar que no sea Batidora (no permite contribución parcial)
      if (gift.name.toLowerCase().includes('batidora')) {
        showAlert('warning', 'Este regalo no permite contribución parcial');
        return;
      }

      const price = getPrice(gift);
      const availableAmount = getAvailableAmount(gift);

      // Validar mínimo para contribuciones parciales (o mitad del precio para regalos especiales)
      const isSpecial = isSpecialPartialGift(gift.name);
      const minContrib = isSpecial ? price / 2 : 500;
      const finalMin = Math.min(minContrib, availableAmount);

      if (amount < finalMin) {
        showAlert('warning', `El monto mínimo para contribuir es S/ ${finalMin.toFixed(2)}`);
        return;
      }

      // Validar que el monto no exceda el disponible
      if (amount > availableAmount) {
        showAlert('warning', `El monto máximo disponible es S/ ${availableAmount.toFixed(2)}`);
        return;
      }

      // Validar que el monto no exceda el precio del producto
      if (amount > price) {
        showAlert('warning', `El monto no puede exceder el precio del producto (S/ ${price.toFixed(2)})`);
        return;
      }
      
      // Validar que no esté ya en el carrito
      const alreadyInCart = cartItems.some(item => item._id === giftId);
      if (alreadyInCart) {
        showAlert('warning', 'Este producto ya está en el carrito. Elimínalo primero si deseas cambiar el monto.');
        return;
      }

      // Solo agregar al carrito, NO registrar la contribución todavía
      // La contribución se registrará cuando se confirme el pago
      const added = addToCart({
        _id: gift._id,
        name: gift.name,
        price: amount, // Usar el monto de contribución como precio
        quantity: 1,
        imageUrl: gift.imageUrl,
        total: gift.total
      }, availableAmount);

      if (added) {
        setContributingTo(null);
        setContributionAmount('');
        showAlert('success', 'Contribución agregada al carrito. Procede al pago cuando estés listo.');
      } else {
        showAlert('warning', 'No se puede agregar: excedería el monto disponible');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al agregar al carrito';
      showAlert('error', errorMessage);
      console.error('Error adding to cart:', error);
    }
  };

  const getTotalContributed = (gift: Gift) => {
    // Si el backend incluye total_contributed, usarlo (más preciso)
    if ((gift as any).total_contributed !== undefined) {
      const total = (gift as any).total_contributed;
      return typeof total === 'string' ? parseFloat(total) : (total || 0);
    }
    // Si hay contributors en el objeto, calcular desde ellos
    if (gift.contributors && gift.contributors.length > 0) {
      return gift.contributors.reduce((total, contributor) => {
        const amount = contributor.amount;
        const amountNum = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
        return total + amountNum;
      }, 0);
    }
    return 0;
  };

  const getProgressPercentage = (gift: Gift) => {
    const totalContributed = getTotalContributed(gift);
    const price = typeof gift.price === 'string' ? parseFloat(gift.price) : gift.price;
    const totalValue = price * (gift.total || 1);
    if (totalValue === 0) return 0;
    return Math.min((totalContributed / totalValue) * 100, 100);
  };

  const isGiftFullyContributed = (gift: Gift) => {
    const totalContributed = getTotalContributed(gift);
    const price = typeof gift.price === 'string' ? parseFloat(gift.price) : gift.price;
    return totalContributed >= (price * (gift.total || 1));
  };

  const getPrice = (gift: Gift) => {
    return typeof gift.price === 'string' ? parseFloat(gift.price) : gift.price;
  };

  const getAvailableAmount = (gift: Gift) => {
    const price = getPrice(gift);
    const totalContributed = getTotalContributed(gift);
    return Math.max(0, (price * (gift.total || 1)) - totalContributed);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Esta es nuestra lista de regalos
        </h1>
        <p className="text-gray-600">
          Elige tu regalo y sigue con la compra
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Categorías */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorías
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de precios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Mínimo
            </label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Máximo
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
            />
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
            >
              <option value="name">Nombre</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de regalos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gifts.map((gift) => (
          <div key={gift._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Imagen del regalo */}
            <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
              {(gift.imageUrl || (gift as any).image_url) ? (
                <img
                  src={gift.imageUrl || (gift as any).image_url}
                  alt={gift.name}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedImage({ 
                    url: gift.imageUrl || (gift as any).image_url, 
                    name: gift.name 
                  })}
                  onError={(e) => {
                    // Si la imagen falla al cargar, ocultar y mostrar placeholder
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : null}
              {!(gift.imageUrl || (gift as any).image_url) && (
                <div className="text-gray-400">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              )}
            </div>

            {/* Contenido */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {gift.name}
              </h3>

              {gift.description && (
                <p className="text-gray-600 text-sm mb-4">
                  {gift.description}
                </p>
              )}

              {/* Barra de progreso */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progreso</span>
                  <span>{Math.round(getProgressPercentage(gift))}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-aqua-500 h-2 rounded-full"
                    style={{ width: `${getProgressPercentage(gift)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>S/ {getTotalContributed(gift).toFixed(2)}</span>
                  <span>S/ {(getPrice(gift) * (gift.total || 1)).toFixed(2)}</span>
                </div>
              </div>

              {/* Estado */}
              <div className="mb-4 flex flex-wrap gap-2 items-center">
                {isGiftFullyContributed(gift) ? (
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">
                    VENDIDO
                  </span>
                ) : (
                  <>
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Disponible
                    </span>
                    {gift.total > 1 && (
                      <span className="inline-block bg-aqua-100 text-aqua-800 text-xs px-2 py-1 rounded-full font-semibold">
                        Quedan {gift.total - Math.floor(getTotalContributed(gift) / getPrice(gift))} de {gift.total} disponibles
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Acciones */}
              {contributingTo === gift._id ? (
                (() => {
                  const isSpecial = isSpecialPartialGift(gift.name);
                  const minContrib = isSpecial ? getPrice(gift) / 2 : 500;
                  const finalMin = Math.min(minContrib, getAvailableAmount(gift));
                  return (
                    <div className="space-y-3">
                      <div>
                        <input
                          type="number"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          placeholder={`Monto a contribuir (mín. S/ ${finalMin}, máx. S/ ${getAvailableAmount(gift).toFixed(2)})`}
                          max={getAvailableAmount(gift)}
                          min={finalMin}
                          step="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aqua-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Mínimo: S/ {finalMin.toFixed(2)} | Disponible: S/ {getAvailableAmount(gift).toFixed(2)} de S/ {getPrice(gift).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleContribute(gift._id)}
                          className="flex-1 bg-aqua-600 text-white py-2 px-4 rounded-md hover:bg-aqua-700 text-sm font-medium"
                        >
                          Contribuir
                        </button>
                        <button
                          onClick={() => {
                            setContributingTo(null);
                            setContributionAmount('');
                          }}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const availableAmount = getAvailableAmount(gift);
                      if (availableAmount <= 0) {
                        showAlert('warning', 'Este regalo ya está completamente contribuido');
                        return;
                      }

                      // Validar que no esté ya en el carrito
                      const alreadyInCart = cartItems.some(item => item._id === gift._id);
                      if (alreadyInCart) {
                        showAlert('warning', 'Este producto ya está en el carrito');
                        return;
                      }

                      // Intentar agregar con validación del monto máximo
                      const added = addToCart({
                        _id: gift._id,
                        name: gift.name,
                        price: getPrice(gift), // Usar el precio unitario del regalo
                        quantity: 1,
                        imageUrl: gift.imageUrl,
                        total: gift.total
                      }, availableAmount);

                      if (added) {
                        showAlert('success', `Agregado al carrito por S/ ${getPrice(gift).toFixed(2)}`);
                      } else {
                        showAlert('warning', 'No se puede agregar: excedería el monto disponible');
                      }
                    }}
                    disabled={isGiftFullyContributed(gift)}
                    className="w-full bg-aqua-600 text-white py-2 px-4 rounded-md hover:bg-aqua-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Agregar al Carrito
                  </button>
                  {!isGiftFullyContributed(gift) && (getPrice(gift) > 1000 || isSpecialPartialGift(gift.name)) && !gift.name.toLowerCase().includes('batidora') && (
                    <button
                      onClick={() => setContributingTo(gift._id)}
                      className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 text-sm font-medium"
                    >
                      Contribuir Parcialmente
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {gifts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron regalos con los filtros seleccionados</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Modal para imagen ampliada */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200 z-10"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Imagen ampliada */}
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />

            {/* Nombre del regalo */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">{selectedImage.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftsPage;
