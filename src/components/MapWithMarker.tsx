import React from 'react';

interface MapWithMarkerProps {
  address: string;
  mapEmbedUrl: string;
  locationName: string;
  locationReference: string;
  googleMapsUrl: string;
  wazeUrl: string;
}

const MapWithMarker: React.FC<MapWithMarkerProps> = ({
  address,
  mapEmbedUrl,
  locationName,
  locationReference,
  googleMapsUrl,
  wazeUrl
}) => {
  return (
    <div className="h-full flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-1 text-sm">{locationName}</h3>
      <p className="text-gray-700 mb-2 text-xs">{address}</p>

      {/* Contenedor del mapa con marcador rojo pre-cargado */}
      <div className="mb-2 rounded-lg overflow-hidden relative flex-1" style={{ height: '300px' }}>
        {/* Mapa con marcador rojo automático - URL de embed de Google Maps con marcador incluido */}
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapEmbedUrl}
          title={`Mapa de ${locationName}`}
        ></iframe>
      </div>

      <p className="text-xs text-gray-600 mb-2">
        {locationReference}
      </p>

      <div className="flex flex-wrap gap-2">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Google Maps
        </a>
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Waze
        </a>
      </div>
    </div>
  );
};

export default MapWithMarker;
