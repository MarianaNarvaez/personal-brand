// Datos generales del sitio. Cambia aquí textos, links y redes.
module.exports = {
  nombre: 'Mari Narváez',
  lema: 'Aprende a crear, mantener y multiplicar tu dinero',
  // Dominio público del sitio (se usa para la imagen al compartir en redes). Cámbialo cuando tengas dominio propio.
  urlBase: process.env.SITE_URL || 'https://mari-landing.pages.dev',

  // URL del Apps Script que guarda los emails en Google Sheets (ver README, paso "Google Sheets").
  // Tiene esta forma: https://script.google.com/macros/s/XXXXXXXX/exec
  formularioUrl: 'https://script.google.com/macros/s/AKfycbzZRplf-0GB4_IRWYjs78azQ8QgBB0M6od0nvaI5B2lgGQ5NHPDn-BSVudyiSHccKUs/exec',

  youtube: {
    canal: 'https://www.youtube.com/channel/UCuPndag82FWyAmxB5b_4fXg',
    suscribirse: 'https://www.youtube.com/channel/UCuPndag82FWyAmxB5b_4fXg?sub_confirmation=1',
    horario: 'Un nuevo video cada lunes 7:00 p.m.'
  },

  redes: [
    { nombre: 'Instagram', url: 'https://www.instagram.com/marinarvaez.co' }
    // Para agregar más, descomenta y pon el link real:
    // { nombre: 'TikTok', url: 'https://www.tiktok.com/@usuario' },
    // { nombre: 'LinkedIn', url: 'https://www.linkedin.com/in/usuario' }
  ],

  credenciales: [
    'Ingeniera de sistemas',
    'Coach financiera',
    'Conocimientos validados por el AMV',
    '3 años acompañando profesionales tech'
  ],

  // Enlace de política de privacidad (recomendado por la Ley 1581 de 2012 en Colombia)
  politicaPrivacidad: '/privacidad'
};
