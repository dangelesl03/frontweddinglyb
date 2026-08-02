import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAlert } from '../contexts/AlertContext';
import { useAuth } from '../contexts/AuthContext';

interface Contribution {
  userId: string;
  username: string;
  amount: number;
  contributedAt: string;
  receiptFile?: string | null;
  note?: string | null;
}

interface GiftReport {
  giftId: string;
  giftName: string;
  giftPrice: number;
  isContributed: boolean;
  totalContributed: number;
  contributions: Contribution[];
}

const ReportsPage: React.FC = () => {
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const [gifts, setGifts] = useState<GiftReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedGift, setExpandedGift] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sold' | 'available' | 'with_contributions'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_desc' | 'price_asc' | 'contributed_desc' | 'progress_desc'>('name');

  // Verificar si es admin
  const isAdmin = user?.role === 'admin';

  const loadReports = useCallback(async () => {
    if (!isAdmin) return; // No cargar si no es admin
    
    try {
      setLoading(true);
      const data = await apiService.getContributionsReport();
      setGifts(data);
      setError('');
    } catch (error: any) {
      setError('Error al cargar los reportes');
      showAlert('error', `Error al cargar los reportes: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  }, [showAlert, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadReports();
    }
  }, [loadReports, isAdmin]);

  // Filtrado y ordenamiento de regalos
  const filteredGifts = gifts
    .filter((gift) => {
      // 1. Filtrar por término de búsqueda (nombre del regalo o nombre de invitado/username en contribuciones)
      const matchesSearchTerm =
        gift.giftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gift.contributions.some((c) =>
          (c.note || c.username || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

      // 2. Filtrar por estado
      const isCompleted = gift.isContributed || gift.totalContributed >= gift.giftPrice;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'sold' && isCompleted) ||
        (statusFilter === 'available' && !isCompleted) ||
        (statusFilter === 'with_contributions' && gift.contributions.length > 0);

      return matchesSearchTerm && matchesStatus;
    })
    .sort((a, b) => {
      // 3. Ordenar
      if (sortBy === 'name') {
        return a.giftName.localeCompare(b.giftName);
      }
      if (sortBy === 'price_desc') {
        return b.giftPrice - a.giftPrice;
      }
      if (sortBy === 'price_asc') {
        return a.giftPrice - b.giftPrice;
      }
      if (sortBy === 'contributed_desc') {
        return b.totalContributed - a.totalContributed;
      }
      if (sortBy === 'progress_desc') {
        const getProgress = (g: GiftReport) => g.giftPrice === 0 ? 0 : g.totalContributed / g.giftPrice;
        return getProgress(b) - getProgress(a);
      }
      return 0;
    });

  // Verificar acceso después de los hooks
  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-red-600">Solo los administradores pueden acceder a los reportes.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (gift: GiftReport) => {
    if (gift.giftPrice === 0) return 0;
    return Math.min((gift.totalContributed / gift.giftPrice) * 100, 100);
  };

  const toggleExpand = (giftId: string) => {
    setExpandedGift(expandedGift === giftId ? null : giftId);
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
          Reporte de Contribuciones
        </h1>
        <p className="text-gray-600">
          Detalle de aportes realizados a cada regalo
        </p>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Resumen General</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-aqua-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total de Regalos</p>
            <p className="text-2xl font-bold text-aqua-600">{gifts.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Regalos Completados</p>
            <p className="text-2xl font-bold text-green-600">
              {gifts.filter(g => g.isContributed || g.totalContributed >= g.giftPrice).length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Contribuido</p>
            <p className="text-2xl font-bold text-blue-600">
              S/ {gifts.reduce((sum, g) => sum + g.totalContributed, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros de Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-aqua-100/80">
        <h3 className="font-serif text-aqua-800 font-medium text-sm mb-3.5 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-aqua-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros de Búsqueda
        </h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Buscar por texto */}
          <div className="flex-1 w-full relative">
            <label className="block text-xs text-aqua-600 mb-1 font-medium">Buscar regalo o invitado:</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ej. Cafetera, Braulio, Lisset..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-aqua-200 focus:outline-none focus:ring-2 focus:ring-aqua-400 focus:border-transparent bg-white text-aqua-900"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-aqua-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-aqua-400 hover:text-aqua-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filtrar por Estado */}
          <div className="w-full md:w-48">
            <label className="block text-xs text-aqua-600 mb-1 font-medium">Estado del Regalo:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 pl-3 pr-8 text-sm rounded-xl border border-aqua-200 focus:outline-none focus:ring-2 focus:ring-aqua-400 bg-white text-aqua-900 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath stroke='%238E7051' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
            >
              <option value="all">Todos</option>
              <option value="sold">Vendidos</option>
              <option value="available">Disponibles</option>
              <option value="with_contributions">Con Contribuciones</option>
            </select>
          </div>

          {/* Ordenar por */}
          <div className="w-full md:w-56">
            <label className="block text-xs text-aqua-600 mb-1 font-medium">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 pl-3 pr-8 text-sm rounded-xl border border-aqua-200 focus:outline-none focus:ring-2 focus:ring-aqua-400 bg-white text-aqua-900 appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath stroke='%238E7051' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
            >
              <option value="name">Nombre (A - Z)</option>
              <option value="price_desc">Precio: Alto a Bajo</option>
              <option value="price_asc">Precio: Bajo a Alto</option>
              <option value="contributed_desc">Monto Contribuido: Mayor</option>
              <option value="progress_desc">Progreso (%): Mayor</option>
            </select>
          </div>
        </div>

        {/* Resumen de Filtros */}
        {(searchTerm || statusFilter !== 'all' || sortBy !== 'name') && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-dashed border-aqua-100">
            <div className="text-xs text-aqua-500 font-light">
              Mostrando <span className="font-semibold text-aqua-700">{filteredGifts.length}</span> de <span className="font-semibold text-aqua-700">{gifts.length}</span> regalos 
              {searchTerm && <> para "<span className="font-semibold text-aqua-700">{searchTerm}</span>"</>}
              {statusFilter !== 'all' && <> con estado "<span className="font-semibold text-aqua-700">{statusFilter === 'sold' ? 'vendido' : statusFilter === 'available' ? 'disponible' : 'con contribución'}</span>"</>}
              {filteredGifts.length > 0 && <> (Total filtrado: <span className="font-semibold text-aqua-700">S/ {filteredGifts.reduce((sum, g) => sum + g.totalContributed, 0).toFixed(2)}</span>)</>}
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSortBy('name');
              }}
              className="text-xs text-aqua-600 hover:text-aqua-800 hover:underline transition-colors font-medium"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de regalos */}
      <div className="space-y-4">
        {filteredGifts.map((gift) => (
          <div key={gift.giftId} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:border-aqua-200 transition-colors">
            {/* Header del regalo */}
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
              onClick={() => toggleExpand(gift.giftId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {gift.giftName}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Precio: <strong className="text-gray-900">S/ {gift.giftPrice.toFixed(2)}</strong></span>
                    <span>Contribuido: <strong className="text-gray-900">S/ {gift.totalContributed.toFixed(2)}</strong></span>
                    <span>Faltante: <strong className="text-gray-900">S/ {Math.max(0, gift.giftPrice - gift.totalContributed).toFixed(2)}</strong></span>
                  </div>
                  {/* Barra de progreso */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progreso</span>
                      <span>{Math.round(getProgressPercentage(gift))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-aqua-500 h-2 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(gift)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex items-center space-x-4">
                  {/* Estado */}
                  {gift.isContributed || gift.totalContributed >= gift.giftPrice ? (
                    <span className="inline-block bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-semibold">
                      VENDIDO
                    </span>
                  ) : (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full">
                      Disponible
                    </span>
                  )}
                  {/* Icono de expandir */}
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${
                      expandedGift === gift.giftId ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Detalle de contribuciones (expandible) */}
            {expandedGift === gift.giftId && (
              <div className="border-t bg-gray-50/50">
                <div className="p-6">
                  {gift.contributions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Este regalo aún no tiene contribuciones</p>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold text-gray-900 mb-4">
                        Contribuciones ({gift.contributions.length})
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden bg-white shadow-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Nota
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Monto
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Comprobante
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Fecha
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {gift.contributions.map((contribution, index) => {
                              const receiptBase64 = contribution.receiptFile;
                              
                              return (
                                <tr key={index} className="hover:bg-gray-50/55 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {contribution.note || 'Sin nota'}
                                    </div>
                                    {contribution.username && contribution.username !== contribution.note && (
                                      <div className="text-xs text-gray-400">Usuario: {contribution.username}</div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="text-sm font-semibold text-gray-900">
                                      S/ {contribution.amount.toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {receiptBase64 ? (
                                      <div className="flex items-center space-x-2">
                                        <img
                                          src={receiptBase64}
                                          alt="Comprobante"
                                          className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity shadow-sm"
                                          onClick={() => setSelectedReceipt(receiptBase64)}
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                              const span = document.createElement('span');
                                              span.className = 'text-sm text-gray-400 italic';
                                              span.textContent = 'Error al cargar';
                                              parent.appendChild(span);
                                            }
                                          }}
                                        />
                                        <button
                                          onClick={() => setSelectedReceipt(receiptBase64)}
                                          className="text-aqua-600 hover:text-aqua-700 text-xs font-medium"
                                        >
                                          Ver completo
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400 italic">Sin comprobante</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(contribution.contributedAt)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t">
                            <tr>
                              <td colSpan={4} className="px-4 py-3 text-right">
                                <span className="text-sm font-semibold text-gray-900">
                                  Total: S/ {gift.totalContributed.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {gifts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay regalos para mostrar</p>
        </div>
      )}

      {gifts.length > 0 && filteredGifts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 font-medium">No se encontraron resultados</p>
          <p className="text-xs text-gray-400 mt-1">Prueba a cambiar los términos de búsqueda o los filtros aplicados</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Modal para ver comprobante completo */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Comprobante de Pago</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <img
                src={selectedReceipt}
                alt="Comprobante completo"
                className="w-full h-auto rounded-lg shadow-lg max-h-[70vh] object-contain mx-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const span = document.createElement('span');
                    span.className = 'text-red-500 text-center block py-8';
                    span.textContent = 'Error al cargar el comprobante';
                    parent.appendChild(span);
                  }
                }}
              />
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedReceipt;
                    link.download = 'comprobante.png';
                    link.click();
                  }}
                  className="text-aqua-600 hover:text-aqua-700 text-sm font-medium"
                >
                  Descargar comprobante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

