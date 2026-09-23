// Tests del sitio estático: npm test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build } = require('../scripts/build');

const salida = fs.mkdtempSync(path.join(os.tmpdir(), 'mari-build-'));
build({ dev: true, salida });
const leer = (p) => fs.readFileSync(path.join(salida, p), 'utf8');

test('genera todas las páginas', () => {
  for (const p of ['index.html', '404.html', 'privacidad/index.html', 'recursos/plantilla-presupuesto/index.html', 'recursos/plantilla-presupuesto/gracias/index.html', '_headers', '_redirects']) {
    assert.ok(fs.existsSync(path.join(salida, p)), `falta ${p}`);
  }
});

test('las cabeceras de seguridad restringen scripts y marcos', () => {
  const h = leer('_headers');
  assert.match(h, /default-src 'self'/);
  assert.match(h, /script-src 'self'(;|$)/m);
  assert.match(h, /frame-ancestors 'none'/);
  assert.match(h, /X-Frame-Options: DENY/);
});

test('el formulario apunta al endpoint y el recurso correctos', () => {
  const html = leer('recursos/plantilla-presupuesto/index.html');
  assert.match(html, /data-endpoint="\/__dev\/suscribir"/);
  assert.match(html, /data-recurso="plantilla-presupuesto"/);
  assert.match(html, /name="sitio_web"/); // honeypot presente
});

test('la página de gracias no se indexa y exige pasar por el formulario', () => {
  const html = leer('recursos/plantilla-presupuesto/gracias/index.html');
  assert.match(html, /name="robots" content="noindex/);
  assert.match(html, /data-acceso="plantilla-presupuesto"/);
});

test('no hay scripts inline ni guiones largos en el contenido', () => {
  for (const p of ['index.html', 'recursos/plantilla-presupuesto/index.html', 'recursos/plantilla-presupuesto/gracias/index.html', 'privacidad/index.html']) {
    const html = leer(p);
    assert.ok(!/<script(?![^>]*\ssrc=)[^>]*>/.test(html), `script inline en ${p}`);
    assert.ok(!html.includes('—'), `guion largo en ${p}`);
  }
});

// ---------- Casos negativos ----------
test('el build de producción falla si falta la URL del Apps Script', () => {
  const site = require('../content/site');
  const original = site.formularioUrl;
  for (const url of ['', 'http://script.google.com/x', 'https://evil.example.com/exec']) {
    site.formularioUrl = url;
    assert.throws(() => build({ dev: false, salida: path.join(salida, 'prod') }), /formularioUrl/);
  }
  site.formularioUrl = original;
});
