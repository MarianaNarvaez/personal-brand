// Servidor local para ver el sitio: npm run dev → http://localhost:3000
// - Reconstruye dist/ cuando cambias views/, content/ o public/
// - Simula el formulario: los registros de prueba van a data/suscriptores-local.txt (NO a Google Sheets)
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { build, ENDPOINT_DEV } = require('./build');
const { cabeceras } = require('../lib/headers');

const RAIZ = path.join(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const ARCHIVO_LOCAL = path.join(RAIZ, 'data', 'suscriptores-local.txt');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon'
};
const HEADERS = cabeceras({ produccion: false });

function reconstruir() {
  try {
    build({ dev: true });
    console.log(`[dev] sitio actualizado ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error(`[dev] error al construir: ${err.message}`);
  }
}

function resolver(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  const destino = path.normalize(path.join(DIST, p));
  if (!destino.startsWith(DIST)) return null; // evita salir de dist/
  for (const c of [destino, path.join(destino, 'index.html'), `${destino}.html`]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

function simularSuscripcion(req, res) {
  let body = '';
  req.on('data', (c) => { body += c; if (body.length > 10_000) req.destroy(); });
  req.on('end', () => {
    let datos = {};
    try { datos = JSON.parse(body); } catch { /* vacío */ }
    const limpio = (v) => String(v ?? '').replace(/[\t\r\n]/g, ' ').slice(0, 254);
    if (!datos.sitio_web) {
      fs.mkdirSync(path.dirname(ARCHIVO_LOCAL), { recursive: true });
      fs.appendFileSync(ARCHIVO_LOCAL, [new Date().toISOString(), limpio(datos.recurso), limpio(datos.nombre), limpio(datos.email)].join('\t') + '\n', { mode: 0o600 });
      console.log('[dev] suscripción de prueba guardada en data/suscriptores-local.txt');
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
}

reconstruir();
for (const carpeta of ['views', 'content', 'public']) {
  let espera;
  fs.watch(path.join(RAIZ, carpeta), { recursive: true }, () => {
    clearTimeout(espera);
    espera = setTimeout(reconstruir, 150);
  });
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === ENDPOINT_DEV) return simularSuscripcion(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }

  const archivo = resolver(req.url);
  const estado = archivo ? 200 : 404;
  const servir = archivo || path.join(DIST, '404.html');
  res.writeHead(estado, { ...HEADERS, 'Content-Type': TIPOS[path.extname(servir)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(servir).pipe(res);
}).listen(PORT, () => {
  console.log(`\nSitio local en http://localhost:${PORT}`);
  console.log('El formulario está en modo prueba: guarda en data/suscriptores-local.txt\n');
});
