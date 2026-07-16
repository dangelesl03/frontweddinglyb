import React from 'react';
import { config } from '../config';

interface Milestone {
  date: string;
  title: string;
  description: string;
  image?: string;
}

const NuestraHistoriaPage: React.FC = () => {
  const milestones: Milestone[] = config.story.milestones;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-white">
      {/* Sección: Un sí para toda la vida */}
      <div className="mb-12 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-8">
          <h2 
            className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 text-center"
            style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", "Georgia", serif' }}
          >
            {config.story.proposalTitle}
          </h2>
          <p className="text-gray-700 text-center leading-relaxed max-w-3xl mx-auto">
            {config.story.proposalText}
          </p>
        </div>
      </div>

      {/* Imagen central */}
      <div 
        className="mb-12 rounded-xl shadow-lg relative flex items-center justify-center p-4 md:p-8 bg-gray-50 md:bg-transparent"
        style={{
          background: 'linear-gradient(135deg, #f5f3f0 0%, #e8e5e2 50%, #f5f3f0 100%)',
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Texto decorativo - Izquierda */}
        <div className="hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90 origin-center opacity-25">
          <span className="text-xl font-serif text-[#8B7355] tracking-widest font-light">{config.story.decorativeLabel}</span>
        </div>

        {/* Texto decorativo - Derecha */}
        <div className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90 origin-center opacity-25">
          <span className="text-xl font-serif text-[#8B7355] tracking-widest font-light">{config.story.decorativeLabel}</span>
        </div>

        {/* Texto decorativo Alt - Izquierda arriba */}
        <div className="hidden md:block absolute left-6 top-1/4 transform -rotate-90 origin-left opacity-20">
          <span className="text-base font-serif text-[#8B7355] tracking-wide">{config.story.decorativeLabelAlt}</span>
        </div>

        {/* Texto decorativo Alt - Derecha arriba */}
        <div className="hidden md:block absolute right-6 top-1/4 transform rotate-90 origin-right opacity-20">
          <span className="text-base font-serif text-[#8B7355] tracking-wide">{config.story.decorativeLabelAlt}</span>
        </div>

        {/* Bandera decorativa opcional - Izquierda */}
        <div className="hidden md:block absolute left-8 top-1/3 transform -translate-y-1/2 opacity-20">
          <div className="flex flex-col" style={{ width: '20px', height: '40px' }}>
            <div className="flex-1" style={{ backgroundColor: '#002654' }}></div>
            <div className="flex-1" style={{ backgroundColor: '#FFFFFF' }}></div>
            <div className="flex-1" style={{ backgroundColor: '#ED2939' }}></div>
          </div>
        </div>

        {/* Bandera decorativa opcional - Derecha */}
        <div className="hidden md:block absolute right-8 top-1/3 transform -translate-y-1/2 opacity-20">
          <div className="flex flex-col" style={{ width: '20px', height: '40px' }}>
            <div className="flex-1" style={{ backgroundColor: '#002654' }}></div>
            <div className="flex-1" style={{ backgroundColor: '#FFFFFF' }}></div>
            <div className="flex-1" style={{ backgroundColor: '#ED2939' }}></div>
          </div>
        </div>

        {/* Corazones decorativos sutiles */}
        <div className="hidden md:block absolute left-10 top-1/4 opacity-15">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#d4a574">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div className="hidden md:block absolute right-10 top-1/4 opacity-15">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#d4a574">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div className="hidden md:block absolute left-10 bottom-1/4 opacity-15">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#d4a574">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div className="hidden md:block absolute right-10 bottom-1/4 opacity-15">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#d4a574">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>

        <div className="relative w-full rounded-lg overflow-hidden shadow-xl z-10">
          <img 
            src={config.story.proposalMainImage}
            alt="Nuestra historia"
            className="w-full rounded-lg object-cover md:object-contain md:max-h-[600px]"
            style={{ 
              maxHeight: '600px',
              height: 'auto',
              width: '100%',
              display: 'block',
              objectPosition: 'center'
            }}
          />
          {/* Overlay sutil en los bordes */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.03)'
            }}
          />
        </div>
      </div>

      {/* Sección: Nuestros hitos */}
      <div className="mb-12 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-8">
          {/* Título "Nuestros hitos" - bajado en mobile y desktop */}
          <h2 
            className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6 text-center mt-8 md:mt-8"
            style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", "Georgia", serif' }}
          >
            Nuestros hitos
          </h2>
          
          {/* Timeline vertical para mobile - visible solo hasta 768px */}
          <div className="relative py-4 md:hidden">
            {/* Línea conectora vertical */}
            <div className="absolute left-8 top-12 bottom-12 w-0.5" style={{ backgroundColor: '#c8b39c' }}></div>

            {/* Milestones en formato vertical */}
            <div className="space-y-8 relative">
              {milestones.map((milestone, index) => (
                <div key={`mobile-${index}`} className="relative flex items-start">
                  {/* Círculo verde olivo con número */}
                  <div className="relative z-10 mr-6 flex-shrink-0">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2" style={{ borderColor: '#8E7051' }}>
                      <span className="font-bold text-xl" style={{ color: '#8E7051' }}>{index + 1}</span>
                    </div>
                  </div>

                  {/* Contenido del milestone */}
                  <div className="flex-1 pt-2">
                    <div className="font-semibold text-lg mb-1" style={{ color: '#8E7051' }}>
                      {milestone.date}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>
                      {milestone.title}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline horizontal para desktop - visible solo desde 768px */}
          <div className="relative py-8 hidden md:block">
            {/* Línea conectora horizontal */}
            <div className="absolute top-16 left-1/4 right-1/4 h-1" style={{ backgroundColor: '#c8b39c' }}></div>

            {/* Milestones en formato horizontal */}
            <div className="grid grid-cols-3 gap-4 relative items-stretch">
              {milestones.map((milestone, index) => (
                <div key={`desktop-${index}`} className="relative flex flex-col items-center">
                  {/* Círculo verde olivo con número */}
                  <div className="relative z-10 mb-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-2" style={{ borderColor: '#8E7051' }}>
                      <span className="font-bold text-xl" style={{ color: '#8E7051' }}>{index + 1}</span>
                    </div>
                  </div>

                  {/* Contenido del milestone */}
                  <div className="text-center max-w-xs flex flex-col h-full">
                    <div className="font-semibold text-lg mb-2" style={{ color: '#8E7051' }}>
                      {milestone.date}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>
                      {milestone.title}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Galería de imágenes de nuestros hitos */}
      <div className="mb-12 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-8">
          <h2 
            className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4 text-center"
            style={{ fontFamily: '"Playfair Display", "Cormorant Garamond", "Georgia", serif' }}
          >
            {config.story.gallerySubtitle}
          </h2>
          
          <p className="text-gray-700 text-center text-lg mb-6 leading-relaxed max-w-3xl mx-auto" style={{ fontFamily: 'serif' }}>
            {config.story.galleryDescription}
          </p>
          
          {/* Galería móvil - vertical */}
          <div className="md:hidden space-y-6">
            {milestones.map((milestone, index) => (
              milestone.image && (
                <div key={`gallery-mobile-${index}`} className="rounded-lg overflow-hidden shadow-md" style={{ width: 'calc(100% + 6rem)', marginLeft: '-3rem', marginRight: '-3rem' }}>
                  <img 
                    src={milestone.image}
                    alt={milestone.title}
                    className="w-full h-auto object-cover"
                    style={{ 
                      maxHeight: '500px', 
                      minHeight: '450px', 
                      objectFit: 'cover',
                      objectPosition: index === 0 ? 'left center' : 'center center',
                      width: '100%'
                    }}
                  />
                </div>
              )
            ))}
          </div>

          {/* Galería desktop - horizontal */}
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {milestones.map((milestone, index) => (
              milestone.image && (
                <div key={`gallery-desktop-${index}`} className="rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={milestone.image}
                    alt={milestone.title}
                    className="w-full object-cover"
                    style={{ height: '450px', objectFit: 'cover' }}
                  />
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuestraHistoriaPage;
