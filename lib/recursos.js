// Carga los recursos descargables desde content/recursos/*.json
// Para agregar un recurso nuevo basta con crear otro .json en esa carpeta.
const fs = require('node:fs');
const path = require('node:path');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CARPETA = path.join(__dirname, '..', 'content', 'recursos');

function validarRecurso(r, archivo) {
  const errores = [];
  if (!r.slug || !SLUG_RE.test(r.slug)) errores.push('slug inválido (usa minúsculas y guiones)');
  if (!r.titulo) errores.push('falta "titulo"');
  if (!r.descargas || Object.keys(r.descargas).length === 0) errores.push('falta "descargas"');
  for (const [clave, d] of Object.entries(r.descargas || {})) {
    if (!/^[a-z0-9-]+$/.test(clave)) errores.push(`clave de descarga inválida: ${clave}`);
    try {
      if (new URL(d.url).protocol !== 'https:') errores.push(`la descarga "${clave}" debe usar https`);
    } catch {
      errores.push(`url inválida en descarga "${clave}"`);
    }
  }
  if (errores.length) throw new Error(`Recurso ${archivo}: ${errores.join('; ')}`);
}

function cargarRecursos(carpeta = CARPETA) {
  const recursos = new Map();
  for (const archivo of fs.readdirSync(carpeta).filter((f) => f.endsWith('.json'))) {
    const r = JSON.parse(fs.readFileSync(path.join(carpeta, archivo), 'utf8'));
    validarRecurso(r, archivo);
    if (recursos.has(r.slug)) throw new Error(`Slug duplicado: ${r.slug}`);
    recursos.set(r.slug, r);
  }
  return recursos;
}

function listarActivos(recursos) {
  return [...recursos.values()]
    .filter((r) => r.activo !== false)
    .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
}

module.exports = { cargarRecursos, listarActivos, SLUG_RE };
