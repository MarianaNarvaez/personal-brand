/**
 * Apps Script que recibe las suscripciones de la landing y las guarda en esta Google Sheet.
 *
 * Instalación (una sola vez), ver README → "Google Sheets":
 *   1. En la Google Sheet: Extensiones → Apps Script.
 *   2. Pega este archivo completo en Code.gs y guarda.
 *   3. Implementar → Nueva implementación → Tipo: Aplicación web
 *      Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario
 *   4. Copia la URL que termina en /exec y pégala en content/site.js → formularioUrl
 *
 * Si cambias este código: Implementar → Gestionar implementaciones → editar → Versión: nueva.
 */

var HOJA = 'Suscriptores';
var ENCABEZADOS = ['Fecha', 'Recurso', 'Nombre', 'Email', 'Autorizó contenido'];
var LIMITE_POR_MINUTO = 30; // freno simple contra spam masivo

var SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
var NOMBRE_RE = /^[\p{L}\p{M}\p{N}' .-]{1,60}$/u;

function doPost(e) {
  try {
    var datos = leerDatos_(e);
    if (!datos) return responder_({ ok: false, error: 'datos_invalidos' });

    // Honeypot: si un bot llenó el campo oculto, respondemos "ok" pero no guardamos nada
    if (datos.sitio_web) return responder_({ ok: true });

    var limpio = validar_(datos);
    if (!limpio) return responder_({ ok: false, error: 'datos_invalidos' });

    if (!dentroDelLimite_()) return responder_({ ok: false, error: 'intenta_mas_tarde' });

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      hoja_().appendRow([new Date(), limpio.recurso, limpio.nombre, limpio.email, 'Sí']);
    } finally {
      lock.releaseLock();
    }
    return responder_({ ok: true });
  } catch (err) {
    console.error('Error guardando suscripción: ' + (err && err.message)); // sin datos personales
    return responder_({ ok: false, error: 'error_interno' });
  }
}

// Para probar que la implementación está activa: abre la URL /exec en el navegador
function doGet() {
  return responder_({ ok: true, servicio: 'suscripciones activo' });
}

function leerDatos_(e) {
  if (!e) return null;
  if (e.postData && e.postData.contents) {
    if (e.postData.contents.length > 5000) return null;
    try {
      var json = JSON.parse(e.postData.contents);
      if (json && typeof json === 'object') return json;
    } catch (err) { /* puede venir como formulario normal */ }
  }
  return e.parameter || null;
}

function texto_(v) {
  return typeof v === 'string' ? v.normalize('NFC').trim() : '';
}

function validar_(d) {
  var recurso = texto_(d.recurso);
  var nombre = texto_(d.nombre).replace(/\s+/g, ' ');
  var email = texto_(d.email).toLowerCase();
  if (!SLUG_RE.test(recurso) || recurso.length > 80) return null;
  if (!NOMBRE_RE.test(nombre)) return null;
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  if (d.acepto !== 'si' && d.acepto !== true) return null;
  return { recurso: seguro_(recurso), nombre: seguro_(nombre), email: seguro_(email) };
}

// Evita "inyección de fórmulas": un valor que empieza con = + - @ se guarda como texto
function seguro_(v) {
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function dentroDelLimite_() {
  var cache = CacheService.getScriptCache();
  var clave = 'min-' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(clave) || 0) + 1;
  cache.put(clave, String(n), 120);
  return n <= LIMITE_POR_MINUTO;
}

function hoja_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
    hoja.appendRow(ENCABEZADOS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
