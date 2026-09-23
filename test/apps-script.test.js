// Tests del Apps Script (apps-script/Code.gs) con dobles de los servicios de Google.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8');
let filas, cache, gs;

beforeEach(() => {
  filas = [];
  cache = {};
  const hoja = { appendRow: (r) => filas.push(r), setFrozenRows() {} };
  gs = {
    console: { error() {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => (filas.length ? hoja : null), insertSheet: () => hoja }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ setMimeType: () => JSON.parse(t) }) }
  };
  vm.createContext(gs);
  vm.runInContext(codigo, gs);
});

const enviar = (obj) => gs.doPost({ postData: { contents: typeof obj === 'string' ? obj : JSON.stringify(obj) } });
const valido = { recurso: 'plantilla-presupuesto', nombre: 'Ana María', email: 'Ana@Ejemplo.com', acepto: 'si' };
const guardadas = () => filas.slice(1); // la primera fila son los encabezados

test('guarda una suscripción válida', () => {
  assert.deepEqual(enviar(valido), { ok: true });
  const [fila] = guardadas();
  assert.deepEqual(JSON.parse(JSON.stringify(fila.slice(1))), ['plantilla-presupuesto', 'Ana María', 'ana@ejemplo.com', 'Sí']);
});

test('también acepta datos como formulario normal (sin JavaScript)', () => {
  assert.deepEqual(gs.doPost({ parameter: valido }), { ok: true });
  assert.equal(guardadas().length, 1);
});

// ---------- Casos negativos: deben fallar sin guardar ----------
for (const [caso, cambio] of [
  ['email inválido', { email: 'no-es-email' }],
  ['sin autorización', { acepto: '' }],
  ['nombre con símbolos', { nombre: '<script>' }],
  ['recurso con ruta rara', { recurso: '../../hoja' }],
  ['email demasiado largo', { email: 'a'.repeat(250) + '@x.co' }]
]) {
  test(`rechaza ${caso}`, () => {
    assert.equal(enviar({ ...valido, ...cambio }).ok, false);
    assert.equal(guardadas().length, 0);
  });
}

test('rechaza JSON roto y cuerpos gigantes', () => {
  assert.equal(enviar('{roto').ok, false);
  assert.equal(enviar('x'.repeat(6000)).ok, false);
  assert.equal(gs.doPost(undefined).ok, false);
});

test('honeypot: responde ok pero no guarda', () => {
  assert.deepEqual(enviar({ ...valido, sitio_web: 'http://spam' }), { ok: true });
  assert.equal(guardadas().length, 0);
});

test('neutraliza fórmulas de hoja de cálculo', () => {
  assert.equal(gs.seguro_('=HYPERLINK("http://x")'), '\'=HYPERLINK("http://x")');
  assert.equal(gs.seguro_('+1'), "'+1");
  assert.equal(gs.seguro_('ana'), 'ana');
});

test('frena el spam masivo por minuto', () => {
  for (let i = 0; i < 30; i++) assert.equal(enviar(valido).ok, true);
  assert.deepEqual(enviar(valido), { ok: false, error: 'intenta_mas_tarde' });
});
