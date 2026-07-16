import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAlert } from '../contexts/AlertContext';
import EditGiftForm from './EditGiftForm';
import ConfirmDialog from './ConfirmDialog';

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
  isActive?: boolean;
  isContributed?: boolean;
  total_contributed?: number;
}

const ManageGifts: React.FC = () => {
  const { showAlert } = useAlert();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [deletingGift, setDeletingGift] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Todas las categorías');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>(['Todas las categorías']);
  
  // Estado para los precios editados en línea (ID -> valor de texto)
  const [editedPrices, setEditedPrices] = useState<{ [key: string]: string }>({});
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiService.getCategories();
        setCategories(['Todas las categorías', ...data.map((cat: any) => cat.name)]);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories(['Todas las categorías', 'Luna de Miel', 'Arte y Deco', 'Otro']);
      }
    };
    loadCategories();
  }, []);

  const loadGifts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getGifts();
      setGifts(data);
      // Limpiar precios editados al recargar
      setEditedPrices({});
    } catch (error: any) {
      showAlert('error', 'Error al cargar los regalos');
      console.error('Error loading gifts:', error);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  const handleEdit = (gift: Gift) => {
    setEditingGift(gift);
  };

  const handleCancelEdit = () => {
    setEditingGift(null);
  };

  const handleSaveSuccess = () => {
    setEditingGift(null);
    setTimeout(() => {
      loadGifts();
    }, 100);
  };

  const handleDeleteClick = (giftId: string) => {
    setDeletingGift(giftId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGift) return;

    try {
      await apiService.deleteGift(deletingGift);
      showAlert('success', 'Regalo eliminado exitosamente');
      setShowDeleteDialog(false);
      setDeletingGift(null);
      loadGifts();
    } catch (error: any) {
      showAlert('error', error?.message || 'Error al eliminar el regalo');
      console.error('Error deleting gift:', error);
    }
  };

  // Manejar el cambio de precio localmente en texto
  const handlePriceChange = (giftId: string, val: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [giftId]: val
    }));
  };

  // Guardar el precio editado en línea
  const handleSavePrice = async (gift: Gift) => {
    const priceText = editedPrices[gift._id];
    if (priceText === undefined) return;

    const newPrice = parseFloat(priceText);
    if (isNaN(newPrice) || newPrice < 0) {
      showAlert('error', 'Por favor ingresa un precio válido mayor o igual a 0');
      return;
    }

    try {
      setSavingPriceId(gift._id);
      
      // Llamar al endpoint para actualizar el precio del regalo
      await apiService.updateGift(gift._id, {
        ...gift,
        price: newPrice
      });

      showAlert('success', `Precio de "${gift.name}" actualizado a S/ ${newPrice.toFixed(2)}`);
      
      // Actualizar el estado local para reflejar el cambio de inmediato sin recarga completa
      setGifts(prev =>
        prev.map(g => (g._id === gift._id ? { ...g, price: newPrice } : g))
      );

      // Remover de la lista de modificados
      setEditedPrices(prev => {
        const copy = { ...prev };
        delete copy[gift._id];
        return copy;
      });
    } catch (error: any) {
      showAlert('error', error?.message || 'Error al actualizar el precio');
      console.error('Error updating price:', error);
    } finally {
      setSavingPriceId(null);
    }
  };

  const filteredGifts = gifts.filter(gift => {
    const matchesCategory = filterCategory === 'Todas las categorías' || gift.category === filterCategory;
    const matchesSearch = gift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (gift.description && gift.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-500"></div>
      </div>
    );
  }

  if (editingGift) {
    return (
      <EditGiftForm
        gift={editingGift}
        onSuccess={handleSaveSuccess}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'serif' }}>
              Gestionar Regalos
            </h2>
            <p className="text-xs text-gray-500">
              Vista compacta estilo Excel. Edita el precio y presiona <strong>Enter</strong> o haz clic en 💾 para guardar.
            </p>
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 self-start md:self-auto">
            Total filtrados: <strong>{filteredGifts.length}</strong> / Total general: <strong>{gifts.length}</strong>
          </div>
        </div>
        
        {/* Filtros compactos */}
        <div className="grid md:grid-cols-3 gap-3 mb-2">
          <div className="md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-aqua-500"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-aqua-500 bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla estilo Excel Compacta */}
      <div className="overflow-x-auto border border-gray-150 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
          <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-3 py-2 text-center w-10">#</th>
              <th className="px-3 py-2 w-14">Imagen</th>
              <th className="px-3 py-2 min-w-[200px]">Nombre del Regalo</th>
              <th className="px-3 py-2">Categoría</th>
              <th className="px-3 py-2 text-center w-36">Precio (S/)</th>
              <th className="px-3 py-2 text-center">Disp. / Total</th>
              <th className="px-3 py-2 text-center">Contribuido</th>
              <th className="px-3 py-2 text-center">Estado</th>
              <th className="px-3 py-2 text-center w-32">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredGifts.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-500 italic">
                  No se encontraron regalos
                </td>
              </tr>
            ) : (
              filteredGifts.map((gift, idx) => {
                const currentPriceText = editedPrices[gift._id] !== undefined ? editedPrices[gift._id] : gift.price.toString();
                const isModified = editedPrices[gift._id] !== undefined && parseFloat(editedPrices[gift._id]) !== gift.price;
                const isSaving = savingPriceId === gift._id;

                return (
                  <tr key={gift._id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Index */}
                    <td className="px-3 py-2 text-center text-gray-400 font-mono">
                      {idx + 1}
                    </td>

                    {/* Thumbnail */}
                    <td className="px-3 py-2">
                      <div className="w-8 h-8 rounded bg-gray-150 overflow-hidden border border-gray-200">
                        {gift.imageUrl ? (
                          <img
                            src={gift.imageUrl.includes('data:') ? gift.imageUrl : `${gift.imageUrl}?v=${gift._id}`}
                            alt={gift.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                            🖼️
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name & description tooltip */}
                    <td className="px-3 py-2 font-medium text-gray-900">
                      <div className="font-semibold">{gift.name}</div>
                      {gift.description && (
                        <div className="text-[10px] text-gray-400 line-clamp-1 max-w-sm" title={gift.description}>
                          {gift.description}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-3 py-2 text-gray-600">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-medium">
                        {gift.category}
                      </span>
                    </td>

                    {/* Price Input (Excel style) */}
                    <td className="px-3 py-1.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-gray-400 font-semibold text-[11px]">S/</span>
                        <input
                          type="text"
                          value={currentPriceText}
                          onChange={(e) => handlePriceChange(gift._id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSavePrice(gift);
                            }
                          }}
                          disabled={isSaving}
                          className={`w-20 px-1.5 py-0.5 text-right font-mono border rounded text-xs focus:outline-none transition-all ${
                            isModified 
                              ? 'border-amber-400 bg-amber-50/50 focus:ring-1 focus:ring-amber-500' 
                              : 'border-gray-200 hover:border-gray-300 focus:ring-1 focus:ring-aqua-500'
                          }`}
                        />
                        {isModified && (
                          <button
                            onClick={() => handleSavePrice(gift)}
                            disabled={isSaving}
                            className="p-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold shadow-sm transition-colors flex-shrink-0"
                            title="Guardar precio"
                          >
                            {isSaving ? '⏳' : '💾'}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Available / Total */}
                    <td className="px-3 py-2 text-center font-medium">
                      <span className={gift.available === 0 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                        {gift.available}
                      </span>
                      <span className="text-gray-400"> / {gift.total}</span>
                    </td>

                    {/* Contributed */}
                    <td className="px-3 py-2 text-center text-gray-700 font-mono">
                      {gift.total_contributed !== undefined && gift.total_contributed > 0 ? (
                        <span className="text-green-700 font-semibold">
                          S/ {gift.total_contributed.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 text-center">
                      {gift.isActive !== false ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-100">
                          Activo
                        </span>
                      ) : (
                        <span className="bg-gray-150 text-gray-500 px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200">
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-1.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleEdit(gift)}
                          className="px-2 py-1 bg-aqua-50 hover:bg-aqua-100 text-aqua-700 border border-aqua-200 rounded text-[10px] font-bold transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(gift._id)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que deseas eliminar este regalo? Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeletingGift(null);
        }}
      />
    </div>
  );
};

export default ManageGifts;
