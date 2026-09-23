// Genera el sitio estático en dist/ a partir de las vistas EJS y los JSON de content/.
//   npm run build            → build de producción (requiere formularioUrl en content/site.js)
//   node scripts/build.js --dev   → build local (el formulario usa el endpoint de prueba)
const fs = require('node:fs');
const path = require('node:path');
const ejs = require('ejs');
const { cargarRecursos, listarActivos } = require('../lib/recursos');
const { cabeceras } = require('../lib/headers');

const RAIZ = path.join(__dirname, '..');
const ENDPOINT_DEV = '/__dev/suscribir';

function cargarSite() {
  const ruta = require.resolve('../content/site');
  delete require.cache[ruta]; // para que el modo dev tome los cambios
  return require(ruta);
}

function build({ dev = false, salida = path.join(RAIZ, 'dist') } = {}) {
  const site = cargarSite();
  const recursos = cargarRecursos();
  const activos = listarActivos(recursos);

  const endpoint = dev ? ENDPOINT_DEV : site.formularioUrl;
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

  const base = { site, anio: new Date().getFullYear(), endpoint, noindex: false };
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

  // Cabeceras de seguridad y redirecciones para Cloudflare Pages (también sirven en Netlify)
  const h = cabeceras({ produccion: !dev });
  fs.writeFileSync(path.join(salida, '_headers'), '/*\n' + Object.entries(h).map(([k, v]) => `  ${k}: ${v}`).join('\n') + '\n');
  fs.writeFileSync(path.join(salida, '_redirects'), '/recursos /#recursos 301\n');

  return { salida, paginas: 3 + activos.length * 2 };
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

module.exports = { build, ENDPOINT_DEV };
