// Cabeceras de seguridad. Se usan en el build (_headers para Cloudflare Pages) y en el servidor local.
function politicaCSP({ produccion, meta = false }) {
  const directivas = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    // El formulario envía los datos al Apps Script de Google
    "connect-src 'self' https://script.google.com https://script.googleusercontent.com",
    "form-action 'self' https://script.google.com",
    "base-uri 'self'",
    "object-src 'none'"
  ];
  // frame-ancestors solo funciona como cabecera HTTP (no en <meta>)
  if (!meta) directivas.push("frame-ancestors 'none'");
  if (produccion) directivas.push('upgrade-insecure-requests');
  return directivas.join('; ');
}

function cabeceras({ produccion }) {
  const h = {
    'Content-Security-Policy': politicaCSP({ produccion }),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
  if (produccion) h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return h;
}

module.exports = { cabeceras, politicaCSP };
