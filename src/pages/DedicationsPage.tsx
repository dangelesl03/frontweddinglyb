import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAlert } from '../contexts/AlertContext';
import { config } from '../config';

interface Dedication {
  id: number;
  message: string;
  sender_name: string;
  is_approved: boolean;
  created_at: string;
}

const DedicationsPage: React.FC = () => {
  const { showAlert } = useAlert();
  const [dedications, setDedications] = useState<Dedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDedications();
  }, []);

  const loadDedications = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDedications();
      setDedications(data);
    } catch (error: any) {
      console.error('Error loading dedicatorias:', error);
      showAlert('error', 'Error al cargar las dedicatorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      showAlert('warning', 'Por favor ingresa un mensaje');
      return;
    }

    if (!senderName.trim()) {
      showAlert('warning', 'Por favor ingresa tu nombre');
      return;
    }

    if (message.length > 1000) {
      showAlert('warning', 'El mensaje no puede exceder 1000 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createDedication({
        message: message.trim(),
        senderName: senderName.trim()
      });
      
      showAlert('success', '¡Dedicatoria enviada exitosamente!');
      setMessage('');
      setSenderName('');
      setIsModalOpen(false);
      loadDedications(); // Recargar dedicatorias
    } catch (error: any) {
      console.error('Error creating dedication:', error);
      showAlert('error', error.message || 'Error al enviar la dedicatoria');
    } finally {
      setSubmitting(false);
    }
  };

  const getRandomRotation = () => {
    return Math.random() * 10 - 5; // Entre -5 y 5 grados
  };

  const getRandomColor = () => {
    const colors = [
      'bg-pink-50 border-pink-200',
      'bg-blue-50 border-blue-200',
      'bg-purple-50 border-purple-200',
      'bg-yellow-50 border-yellow-200',
      'bg-green-50 border-green-200',
      'bg-orange-50 border-orange-200',
      'bg-indigo-50 border-indigo-200',
      'bg-teal-50 border-teal-200'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 
          className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4"
          style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", "Georgia", serif' }}
        >
          Dedicatorias
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Comparte tus mejores deseos y mensajes para {config.wedding.coupleNames}
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-aqua-600 text-white px-8 py-3 rounded-lg hover:bg-aqua-700 transition-colors font-medium text-lg shadow-md"
        >
          ✨ Agregar Dedicatoria
        </button>
      </div>

      {/* Modal para agregar dedicatoria */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
          style={{ backgroundColor: 'rgba(142, 112, 81, 0.3)' }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 hover:opacity-70 transition-opacity"
              style={{ color: '#8E7051' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
 
            {/* Título */}
            <h2 
              className="text-2xl font-semibold mb-6 text-center"
              style={{ color: '#8E7051', fontFamily: 'serif' }}
            >
              Agregar dedicatoria
            </h2>
 
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Textarea para mensaje */}
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu dedicatoria aquí..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500 resize-none"
                  rows={6}
                  maxLength={1000}
                  required
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {String(message.length).padStart(2, '0')}/1000
                </div>
              </div>
 
              {/* Input para nombre */}
              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  De parte de: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                  required
                />
              </div>
 
              {/* Botón enviar */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full text-white py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium text-lg"
                style={{ backgroundColor: '#8E7051' }}
              >
                {submitting ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lista de dedicatorias */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-500"></div>
        </div>
      ) : dedications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💌</div>
          <p className="text-gray-500 text-lg">Aún no hay dedicatorias. ¡Sé el primero en compartir tus deseos!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dedications.map((dedication, index) => {
            const rotation = getRandomRotation();
            const colorClass = getRandomColor();
            const emojis = ['💝', '💕', '💖', '💗', '💓', '💞', '💟', '✨', '🌟', '💫', '🎉', '🎊'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            
            return (
              <div
                key={dedication.id}
                className={`${colorClass} border-2 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `rotate(0deg) scale(1.05)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `rotate(${rotation}deg) scale(1)`;
                }}
              >
                <div className="relative">
                  {/* Decoración de esquina con emoji aleatorio */}
                  <div className="absolute top-0 right-0 text-4xl opacity-30 animate-bounce" style={{ animationDuration: '2s', animationDelay: `${index * 0.2}s` }}>
                    {randomEmoji}
                  </div>
                  
                  {/* Mensaje */}
                  <p className="text-gray-800 mb-4 leading-relaxed text-base" style={{ fontFamily: 'serif', minHeight: '80px' }}>
                    "{dedication.message}"
                  </p>

                  {/* Información del remitente */}
                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <p className="text-sm font-semibold text-gray-700 flex items-center">
                      <span className="mr-2">👤</span>
                      {dedication.sender_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <span className="mr-1">📅</span>
                      {formatDate(dedication.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default DedicationsPage;
