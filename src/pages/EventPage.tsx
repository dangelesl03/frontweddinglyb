import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import ImageCarousel from '../components/ImageCarousel';
import MapWithMarker from '../components/MapWithMarker';
import DressCodeSlider from '../components/DressCodeSlider';
import { config } from '../config';

interface EventData {
  title: string;
  coupleNames: string;
  weddingDate: string;
  location: string;
  address: string;
  dressCode: string;
  dressCodeDescription: string;
  bannerImageUrl?: string;
  additionalInfo?: string;
  carouselImages?: string[];
  ourStory?: {
    title?: string;
    content: string;
    images?: string[];
  };
}

// Datos de las ubicaciones con marcadores rojos
const CEREMONY_LOCATION = config.locations.ceremony;
const RECEPTION_LOCATION = config.locations.reception;

// Imágenes de ejemplo para Dress Code (combinadas: mujeres y hombres)
// Usando las imágenes proporcionadas por el usuario
const DRESS_CODE_EXAMPLES = [
  '/images/dress-code/vestido1.webp', // Vestido largo elegante
  '/images/dress-code/vestido2.webp', // Vestido largo elegante
  '/images/dress-code/ejemplo-hombre-1.png' // Terno gris elegante
];

// Fecha de la boda obtenida de config
const WEDDING_DATE = config.wedding.weddingDate;

const EventPage: React.FC = () => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    ubicaciones: true,
    detalles: true,
    adicional: true
  });


  useEffect(() => {
    loadEvent();
    // Calcular días restantes usando la fecha hardcoded
    calculateDaysLeft();
  }, []);

  useEffect(() => {
    // Recalcular cada minuto para mantener el contador actualizado
    const interval = setInterval(() => {
      calculateDaysLeft();
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, []);

  const loadEvent = async () => {
    try {
      const eventData = await apiService.getEvent();
      setEvent(eventData);
    } catch (error) {
      setError('Error al cargar la información del evento');
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = () => {
    // Fecha de la boda: 28 de marzo de 2026
    const [year, month, day] = WEDDING_DATE.split('-').map(Number);
    const wedding = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    // Obtener la fecha actual en hora de Perú (UTC-5)
    const now = new Date();
    const peruOffset = -5 * 60; // UTC-5 en minutos
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const peruTime = new Date(utc + (peruOffset * 60000));
    
    // Establecer hora a medianoche para comparar solo días
    peruTime.setHours(0, 0, 0, 0);
    wedding.setHours(0, 0, 0, 0);
    
    const diffTime = wedding.getTime() - peruTime.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    setDaysLeft(Math.max(0, diffDays));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  const formatDate = () => {
    // Usar la fecha hardcoded: 28 de marzo de 2026
    const [year, month, day] = WEDDING_DATE.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month es 0-indexed en Date
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-12 bg-white">
        <p className="text-gray-500">{error || 'No se encontró información del evento'}</p>
      </div>
    );
  }

  const carouselImages = event.carouselImages && event.carouselImages.length > 0
    ? event.carouselImages
    : event.bannerImageUrl
    ? [event.bannerImageUrl]
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Section con Carrusel */}
      {carouselImages.length > 0 && (
        <div className="mb-12">
          <ImageCarousel images={carouselImages} />
        </div>
      )}

      {/* Hero Section con la foto de los novios (Sin contenedor blanco, flotando con esquinas redondeadas y sombra premium) */}
      <div 
        className="relative rounded-2xl overflow-hidden w-full mb-8 shadow-md border border-gray-150"
        style={{
          aspectRatio: '21 / 9',
          minHeight: '200px',
          maxHeight: '380px',
        }}
      >
        <img 
          src="/images/event4.jpg"
          alt={event.coupleNames}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: '50% 72%'
          }}
        />
        {/* Gradiente sutil encima de la foto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent"></div>
      </div>

      {/* Tarjeta de Información de los Novios y Cuenta Regresiva */}
      <div className="mb-8 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Nombres de los novios debajo de la foto */}
        <div className="px-4 md:px-6 py-6 md:py-8 text-center border-b border-gray-100">
          <h1 
            className="text-3xl md:text-5xl"
            style={{ 
              fontFamily: '"Cooper Lt BT", "Cooper", "Lora", "Georgia", serif',
              fontStyle: 'normal',
              fontWeight: 100,
              fontSize: 'clamp(32px, 8vw, 57px)',
              lineHeight: 'clamp(40px, 10vw, 68px)',
              color: '#8E7051',
              letterSpacing: '-0.01em',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {event.coupleNames.split('&').map((name, index, array) => (
              <React.Fragment key={index}>
                <span>{name.trim()}</span>
                {index < array.length - 1 && (
                  <span className="mx-3" style={{ fontFamily: '"Cooper Lt BT", "Cooper", "Lora", serif' }}>
                    &amp;
                  </span>
                )}
              </React.Fragment>
            ))}
          </h1>
        </div>
        
        {/* Detalles compactos del evento */}
        <div className="bg-gray-50/50 px-6 py-5">
          <div className="flex flex-wrap justify-center items-center gap-5 md:gap-8 text-gray-700 mb-4">
            <div className="flex items-center text-sm font-medium">
              <svg className="w-4 h-4 mr-2 text-aqua-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-9 4h10m-9 4h10m-5-8v12" />
              </svg>
              <span>{formatDate()}</span>
            </div>
            <div className="flex items-center text-sm font-medium">
              <svg className="w-4 h-4 mr-2 text-aqua-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
            <div className="flex items-center text-sm font-medium">
              <svg className="w-4 h-4 mr-2 text-aqua-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>{event.dressCode}</span>
            </div>
          </div>
          
          {/* Contador de días */}
          <div className="flex items-center justify-center pt-3 border-t border-gray-150">
            <span className="text-xs font-semibold text-gray-500 mr-3 uppercase tracking-wider">Faltan</span>
            <div className="flex gap-1.5">
              <div className="bg-aqua-100 border border-aqua-200 rounded-lg px-3 py-1 shadow-sm">
                <span className="text-xl font-extrabold text-aqua-800">{Math.floor(daysLeft / 10)}</span>
              </div>
              <div className="bg-aqua-100 border border-aqua-200 rounded-lg px-3 py-1 shadow-sm">
                <span className="text-xl font-extrabold text-aqua-800">{daysLeft % 10}</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-500 ml-3 uppercase tracking-wider">Días</span>
          </div>
        </div>
      </div>

      {/* Sección: Ubicaciones - Ceremonia y Recepción */}
      <div className="mb-8 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('ubicaciones')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
        >
          <h2 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'serif' }}>
            Ubicaciones
          </h2>
          <svg
            className={`w-6 h-6 text-gray-400 transition-transform ${expandedSections.ubicaciones ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expandedSections.ubicaciones && (
          <div className="px-6 pb-6 pt-4">
            <div className="bg-gradient-to-br from-aqua-50 to-white border border-gray-200 rounded-lg p-5 md:p-6 flex flex-col shadow-sm">
              {/* Encabezado Principal */}
              <div className="mb-6 flex items-start space-x-4">
                <div className="bg-white rounded-full p-3 flex-shrink-0 shadow-md">
                  <svg className="w-6 h-6 text-aqua-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'serif' }}>Ceremonia y Recepción</h3>
                  <p className="text-sm text-gray-600 mb-2 font-medium">Villa Illariy, Pachacámac</p>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                    Toda la celebración se llevará a cabo en la misma villa, iniciando con la ceremonia religiosa en la capilla y continuando con la recepción social en los jardines.
                  </p>
                </div>
              </div>

              {/* Horarios e Información del Evento */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Cronograma del Evento</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Ceremonia Religiosa */}
                  <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-aqua-700 text-sm">⛪ Ceremonia Religiosa</span>
                      <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider">Puntualidad requerida</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mb-2">Capilla de la Villa</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-700">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-aqua-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-9 4h10m-9 4h10m-5-8v12" />
                        </svg>
                        <span>{CEREMONY_LOCATION.date}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-aqua-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{CEREMONY_LOCATION.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recepción */}
                  <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-aqua-700 text-sm">🥂 Civil y Recepción</span>
                      <span className="bg-aqua-100 text-aqua-700 text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider">Música y baile</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mb-2">Jardín de la Villa</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-700">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-aqua-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-9 4h10m-9 4h10m-5-8v12" />
                        </svg>
                        <span>{RECEPTION_LOCATION.date}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-aqua-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{RECEPTION_LOCATION.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fotos Referenciales lado a lado */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                  <img 
                    src="/images/capilla.jpg" 
                    alt="Capilla Referencial" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-700 border-t border-gray-100">
                    ⛪ Capilla de la Villa (Ceremonia)
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
                  <img 
                    src="/images/recepcion.jpg" 
                    alt="Local de Recepción Referencial" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-700 border-t border-gray-100">
                    🌳 Jardín de la Villa (Recepción)
                  </div>
                </div>
              </div>

              {/* Mapa */}
              <div className="min-h-[300px] rounded-lg overflow-hidden border border-gray-200 shadow-inner bg-white">
                <MapWithMarker
                  address={CEREMONY_LOCATION.address}
                  mapEmbedUrl={CEREMONY_LOCATION.mapEmbedUrl}
                  locationName="Villa Illariy"
                  locationReference="Villa Illariy - Pachacámac"
                  googleMapsUrl={CEREMONY_LOCATION.googleMapsUrl}
                  wazeUrl={CEREMONY_LOCATION.wazeUrl}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sección: Detalles Importantes del Evento */}
      <div className="space-y-6 mb-6">
        {/* Fila 1: Confirmación de Asistencia e Indicaciones side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Confirmación de Asistencia */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-aqua-50 rounded-full p-2.5 text-aqua-600 flex-shrink-0 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider" style={{ fontFamily: 'serif' }}>
                  Confirmación de Asistencia
                </h3>
              </div>
              
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                Confírmanos tu asistencia hasta el <strong className="text-aqua-800">22 de agosto</strong> al siguiente número:
              </p>
              
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-center border border-gray-100">
                <p className="text-sm font-bold text-gray-800">934-976-466</p>
                <p className="text-[10px] text-gray-500 font-medium">(Yislenia - Wedding Planner)</p>
              </div>
              
              <p className="text-[10px] text-red-600 italic font-medium leading-relaxed bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                * Queremos que disfruten plenamente de esta ocasión tan especial, por ello nuestra boda será una celebración exclusivamente para adultos.
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a 
                href="https://w.app/lissetybraulio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full py-2.5 px-4 bg-aqua-600 text-white rounded-xl text-center text-xs font-bold hover:bg-aqua-700 transition-colors shadow-sm"
              >
                Confirmar por WhatsApp
              </a>
            </div>
          </div>

          {/* Card 2: Indicaciones */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-aqua-50 rounded-full p-2.5 text-aqua-600 flex-shrink-0 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider" style={{ fontFamily: 'serif' }}>
                  Indicaciones
                </h3>
              </div>
              
              <div className="space-y-3.5 text-xs text-gray-700 leading-relaxed">
                <div className="flex items-start">
                  <span className="mr-2 mt-0.5 flex-shrink-0">🚗</span>
                  <p>Contaremos con estacionamiento privado para <strong>40 vehículos</strong>.</p>
                </div>
                <div className="flex items-start">
                  <span className="mr-2 mt-0.5 flex-shrink-0">🚌</span>
                  <p>
                    Ofreceremos un servicio de <strong>bus de retorno a Lima</strong> a partir de la media noche con paradas en <strong>Javier Prado, Acho y Plaza Norte</strong>.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-[10px] text-gray-600 font-medium">
                  * Se requiere precisar el servicio del cual harán uso al momento de confirmar asistencia.
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <span className="text-[10px] text-gray-400 font-medium">Villa Illariy, Pachacámac</span>
            </div>
          </div>
        </div>

        {/* Fila 2: Código de Vestimenta full-width */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Detalles text (Left Column) */}
            <div className="flex-1 w-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-aqua-50 rounded-full p-2.5 text-aqua-600 flex-shrink-0 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 16v2a1 1 0 001 1h4a1 1 0 001-1v-2M9 8h6M9 12h6M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider" style={{ fontFamily: 'serif' }}>
                  Código de Vestimenta
                </h3>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-aqua-50/50 rounded-xl py-2 px-6 text-center border border-aqua-100">
                  <span className="text-sm font-bold text-aqua-800 uppercase tracking-wider">Elegante</span>
                </div>
                <div className="text-xs text-gray-700 flex space-x-6">
                  <span className="flex items-center">
                    <span className="mr-1.5 flex-shrink-0">👔</span>
                    <span><strong>Ellos:</strong> Traje formal</span>
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1.5 flex-shrink-0">👗</span>
                    <span><strong>Ellas:</strong> Vestido largo</span>
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3 border border-amber-100/50 font-medium leading-relaxed">
                ⚠️ <strong className="text-amber-800">Importante:</strong> Se solicita <strong>EVITAR</strong> prendas en color blanco, crema, beige o similares.
              </p>
            </div>
            
            {/* Slider de imágenes (Right Column) */}
            <div className="w-full md:w-80 flex-shrink-0">
              <DressCodeSlider images={DRESS_CODE_EXAMPLES} />
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Mensaje especial */}
      {event.additionalInfo && (
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-6 text-center">
            <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line" style={{ fontFamily: 'serif' }}>
              {event.additionalInfo}
            </p>
          </div>
        </div>
      )}

      {/* Sección: Galería de 3 imágenes */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Imagen 1 */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div 
              className="relative w-full"
              style={{
                aspectRatio: '3 / 4',
                minHeight: '320px'
              }}
            >
              <img 
                src="/images/evento/izq2.jpg"
                alt="Galería 1"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  objectPosition: 'center top'
                }}
              />
            </div>
          </div>

          {/* Imagen 2 */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div 
              className="relative w-full"
              style={{
                aspectRatio: '3 / 4',
                minHeight: '320px'
              }}
            >
              <img 
                src="/images/evento/mid2.jpg"
                alt="Galería 2"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Imagen 3 */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div 
              className="relative w-full"
              style={{
                aspectRatio: '3 / 4',
                minHeight: '320px'
              }}
            >
              <img 
                src="/images/evento/der2.jpg"
                alt="Galería 3"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

        </div>
  );
};

export default EventPage;
