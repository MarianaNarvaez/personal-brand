// Genera el sitio estático en dist/ a partir de las vistas EJS y los JSON de content/.
//   npm run build            → build de producción (requiere formularioUrl en content/site.js)
//   node scripts/build.js --dev   → build local (el formulario usa el endpoint de prueba)
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const { cargarRecursos, listarActivos } = require('../lib/recursos');
const { cabeceras, politicaCSP } = require('../lib/headers');

const RAIZ = path.join(__dirname, '..');
const ENDPOINT_DEV = '/__dev/suscribir';

function cargarSite() {
  const ruta = require.resolve('../content/site');
  delete require.cache[ruta]; // para que el modo dev tome los cambios
  return require(ruta);
}

// Normaliza la ruta base: '' para un dominio propio, '/mari-landing' para usuario.github.io/mari-landing
function normalizarBase(base = '') {
  const limpio = String(base).trim().replace(/\/+$/, '');
  if (limpio && !/^\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(limpio)) throw new Error(`BASE_PATH inválido: ${base}`);
  return limpio;
}

function build({ dev = false, salida = path.join(RAIZ, 'dist'), basePath = process.env.BASE_PATH || '', formularioUrl } = {}) {
  const site = cargarSite();
  const base_ = dev ? '' : normalizarBase(basePath);
  const ruta = (p) => base_ + p;
  const recursos = cargarRecursos();
  const activos = listarActivos(recursos);

  const endpoint = dev ? ENDPOINT_DEV : (formularioUrl ?? site.formularioUrl);
  if (!dev) {
    let valido = false;
    try {
      const u = new URL(endpoint);
      valido = u.protocol === 'https:' && u.hostname === 'script.google.com';
    } catch { /* inválido */ }
    if (!valido) {
      throw new Error('Falta "formularioUrl" en content/site.js (la URL del Apps Script, https://script.google.com/macros/s/.../exec). Revisa el README.');
    }
  }

  fs.rmSync(salida, { recursive: true, force: true });
  fs.cpSync(path.join(RAIZ, 'public'), salida, { recursive: true });

  const csp = politicaCSP({ produccion: !dev, meta: true });
  const base = { site, anio: new Date().getFullYear(), endpoint, noindex: false, ruta, csp };
  const vistas = path.join(RAIZ, 'views');

  function pagina(vista, destino, datos = {}) {
    const archivo = path.join(vistas, `${vista}.ejs`);
    const html = ejs.render(fs.readFileSync(archivo, 'utf8'), { ...base, ...datos }, { filename: archivo });
    const out = path.join(salida, destino);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html);
  }

  pagina('home', 'index.html', { recursos: activos });
  pagina('privacidad', 'privacidad/index.html');
  pagina('error', '404.html', { titulo: 'Página no encontrada', mensaje: 'La página que buscas no existe.' });
  for (const r of activos) {
    pagina('recurso', `recursos/${r.slug}/index.html`, { recurso: r });
    pagina('gracias', `recursos/${r.slug}/gracias/index.html`, { recurso: r, noindex: true });
  }

  // Cabeceras de seguridad en formato Cloudflare Pages / Netlify (GitHub Pages las ignora; ahí se usa el <meta> CSP)
  const h = cabeceras({ produccion: !dev });
  fs.writeFileSync(path.join(salida, '_headers'), '/*\n' + Object.entries(h).map(([k, v]) => `  ${k}: ${v}`).join('\n') + '\n');

  // /recursos → sección de recursos de la home (GitHub Pages no tiene redirecciones del servidor)
  const destino = ruta('/#recursos');
  fs.mkdirSync(path.join(salida, 'recursos'), { recursive: true });
  fs.writeFileSync(path.join(salida, 'recursos', 'index.html'),
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${destino}"><title>Recursos</title></head><body><a href="${destino}">Ver recursos</a></body></html>\n`);

  return { salida, paginas: 4 + activos.length * 2 };
}

if (require.main === module) {
  const dev = process.argv.includes('--dev');
  try {
    const { salida, paginas } = build({ dev });
    console.log(`Listo: ${paginas} páginas en ${path.relative(RAIZ, salida)}/${dev ? ' (modo local)' : ''}`);
  } catch (err) {
    console.error(`\nNo se pudo construir el sitio:\n  ${err.message}\n`);
    process.exit(1);
  }
}

module.exports = { build, ENDPOINT_DEV, normalizarBase };
