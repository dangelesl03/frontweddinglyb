import React from 'react';

const NuestraHistoriaPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title Header */}
      <div className="text-center mb-10">
        <h1 
          className="text-4xl md:text-5xl font-medium tracking-tight mb-2"
          style={{ 
            fontFamily: '"Cooper Lt BT", "Cooper", "Lora", "Georgia", serif',
            color: '#8E7051'
          }}
        >
          Nuestra Historia
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#8E7051]/75 font-semibold">
          El inicio de nuestro para siempre
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: Text Card */}
        <div className="md:col-span-7">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-center relative">
            {/* Elegant decorative flourish at the top */}
            <div className="text-center mb-5 text-[#8E7051]/40 text-xl font-serif select-none">
              ✦ ──── ⏳ ──── ✦
            </div>
            
            <div 
              className="space-y-5 text-[#4E443C] text-sm md:text-base leading-relaxed text-left"
              style={{ fontFamily: '"Lora", "Georgia", "Times New Roman", serif' }}
            >
              <p className="indent-4">
                Nuestros caminos se cruzaron en el 2019, gracias a un amigo en común, quién fue el artífice de que nos conociéramos en persona.
              </p>
              <p className="indent-4">
                Después de varias salidas y conversaciones, un 15 de febrero de 2020, llegó el primer beso, el cual marcó el inicio de una bonita historia que seguimos construyendo a base de respeto, confianza y mucho amor.
              </p>
              <p className="indent-4">
                Somos verdaderos amantes de la naturaleza y hemos entendido que, al igual que un ecosistema, nuestra historia necesita de la lluvia y del sol para crecer.
              </p>
              <p className="indent-4">
                También hemos aprendido que las subidas nos han dado fuerza para llegar a contemplar la vista de los valles y las bajadas nos han enseñado a echar raíces más profundas, y que después de cada invierno siempre llega la primavera.
              </p>
              <p 
                className="text-center font-bold text-[#8E7051] not-italic mt-6 pt-5 border-t border-gray-150 text-base md:text-lg leading-normal"
                style={{ fontFamily: '"Cooper Lt BT", "Cooper", "Lora", serif' }}
              >
                "Es por ello que confirmamos que nuestra historia es nuestro paisaje favorito y nuestra boda, será un bello recuerdo que contemplaremos siempre en nuestro corazón."
              </p>
            </div>
            
            {/* Elegant decorative flourish at the bottom */}
            <div className="text-center mt-5 text-[#8E7051]/40 text-lg font-serif select-none">
              ❦
            </div>
          </div>
        </div>

        {/* Right: Polaroid Image Card */}
        <div className="md:col-span-5">
          <div className="relative group">
            {/* Decorative background frame */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#bda68d] to-[#8E7051] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            
            {/* Main Image Container */}
            <div className="relative bg-white p-4 rounded-2xl shadow-md border border-gray-200">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-50">
                <img 
                  src="/images/preboda5.jpg" 
                  alt="Nuestra historia" 
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="text-center mt-4">
                <span 
                  className="text-sm font-semibold tracking-wider text-[#8E7051]/80"
                  style={{ fontFamily: '"Cooper Lt BT", "Cooper", "Lora", serif' }}
                >
                  Lisset & Braulio
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuestraHistoriaPage;
