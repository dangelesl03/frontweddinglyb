export const config = {
  // URL de la API del backend
  API_URL: process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://backweddinglyb.vercel.app/api'  // URL del backend en producción
      : '/api'),  // Usar proxy en desarrollo (se conecta a http://localhost:5000/api)

  // =========================================================================
  // CONFIGURACIÓN DE LA BODA (Modificar estos datos para personalizar la página)
  // =========================================================================
  
  // Información General
  wedding: {
    coupleNames: 'Lisset & Braulio',             // Nombres que se muestran en el sitio
    weddingDate: '2026-09-19',                 // Formato: AAAA-MM-DD para el contador (19 de setiembre de 2026)
    title: 'Lisset & Braulio - Boda 2026',       // Título de la pestaña
    shortName: 'Lisset & Braulio',               // Nombre corto para el manifiesto
  },

  // Datos de Contacto y Wedding Planner
  contact: {
    plannerName: 'Yislenia - Wedding Planner',
    phoneNumber: '934976466',                  // Teléfono de contacto / WhatsApp
    whatsappUrl: 'https://w.app/lissetybraulio', // Link de WhatsApp personalizado
  },

  // Ubicación de la Ceremonia y Recepción (Ambos en Villa Illariy)
  locations: {
    ceremony: {
      name: 'Ceremonia Religiosa (Capilla de la Villa)',
      address: 'Villa Illariy, Pachacámac, Lima, Perú',
      date: '19 de setiembre de 2026',
      time: '03:30 p.m.',
      googleMapsUrl: 'https://maps.app.goo.gl/NhMvWfEoMqisto11A',
      wazeUrl: 'https://waze.com/ul?q=Villa+Illariy,+Pachacamac',
      mapEmbedUrl: 'https://maps.google.com/maps?q=Villa Illariy, Pachacamac&t=&z=15&ie=UTF8&iwloc=&output=embed'
    },
    reception: {
      name: 'Local de Recepción (Jardín de la Villa)',
      address: 'Villa Illariy, Pachacámac, Lima, Perú',
      date: '19 de setiembre de 2026',
      time: '06:00 p.m.',
      googleMapsUrl: 'https://maps.app.goo.gl/NhMvWfEoMqisto11A',
      wazeUrl: 'https://waze.com/ul?q=Villa+Illariy,+Pachacamac',
      mapEmbedUrl: 'https://maps.google.com/maps?q=Villa Illariy, Pachacamac&t=&z=15&ie=UTF8&iwloc=&output=embed'
    }
  },

  // Detalles de Dress Code y Preguntas Frecuentes
  details: {
    dressCodeType: 'Elegante',
    dressCodeWomen: 'Vestido largo. Evitar prendas en color blanco, crema, beige o similares.',
    dressCodeMen: 'Traje formal.',
    faq: {
      childrenAllowed: 'Queremos que disfruten plenamente de esta ocasión tan especial, por ella nuestra boda será una celebración exclusivamente para adultos.',
      parking: 'Contaremos con un estacionamiento para 40 vehículos y un bus de retorno a Lima a partir de la media noche con paradas en Javier Prado, Acho y Plaza Norte, para lo cual se requiere precisar el servicio del cuál harán uso al momento de confirmar asistencia.'
    }
  },

  // Historia de la Pareja (Sección: Nuestra Historia)
  story: {
    proposalTitle: 'Un sí para toda la vida',
    proposalText: 'Nos comprometimos el 9 de septiembre de 2023. Era nuestra última noche de viaje. Caminábamos contemplando las luces de la ciudad cuando Braulio —sabiendo cuánto amo las fotos—, había preparado en secreto una sesión para inmortalizar ese instante tan especial. En una de esas tomas, Braulio se arrodilló, sacó un anillo y me preguntó: "¿Quieres ser mi compañera en este viaje llamado vida?" Y así, comenzó nuestro para siempre.',
    proposalMainImage: '/images/history.webp',              // Foto central de la propuesta
    decorativeLabel: 'AMOR',                                // Etiqueta decorativa para el fondo de la foto
    decorativeLabelAlt: 'SIEMPRE',                           // Etiqueta decorativa secundaria
    gallerySubtitle: 'Momentos especiales',
    galleryDescription: 'Hoy emprendemos el viaje más importante de todos: aquel que se camina sin mapas, pero con el corazón',
    
    // Hitos cronológicos de la relación
    milestones: [
      {
        date: '2016',
        title: 'El comienzo',
        description: 'Una noche mientras cenábamos viendo el mar decidimos comenzar nuestra relación, por allá en julio del 2016.',
        image: '/images/evento/izqhist2.jpg'
      },
      {
        date: '2023',
        title: 'El compromiso',
        description: 'Luego, en setiembre del 2023, Braulio se arrodilló, sacó un anillo y preguntó ¿Quieres ser mi compañera en este viaje llamado vida?',
        image: '/images/evento/midhist2.jpg'
      },
      {
        date: '2024',
        title: 'Nuestro hogar',
        description: 'El año siguiente decidimos asumir un siguiente reto: comprar un departamento, el cual a base de mucho amor y esfuerzo lo hemos convertido en nuestro hogar',
        image: '/images/evento/derhist2.jpg'
      }
    ]
  },

  // Datos para Transferencia de Aportes / Regalos
  payment: {
    accountHolder: 'Braulio Espinoza',          // Titular de la cuenta
    yape: {
      number: 'Ver QR Plin',                   // Nombre/Número para Yape
    },
    plin: {
      number: 'Lisset Piscoya (Ver QR)',       // Nombre/Número para Plin
    },
    bankAccounts: [
      {
        bank: 'BBVA',
        account: '0011-0814-0217305662',
        cci: '01181400021730566219'
      }
    ]
  }
};
