# Contexto para Claude Code

Sitio de **Mari Narváez**: ingeniera de sistemas y coach financiera (conocimientos validados por el AMV). Audiencia: profesionales del sector tech en Latam (principalmente Colombia) que ganan bien pero viven al día. Tono: cercano, directo, práctico, en español neutro-colombiano ("plata", "gusticos"), tuteando. Nada de promesas de rentabilidad ni "fórmulas mágicas".

## Arquitectura
- **Sitio estático** generado con EJS → `dist/`, publicado en **Cloudflare Pages** (build: `npm run build`, salida: `dist`). No hay servidor Node en producción.
- **Formulario → Google Apps Script → Google Sheet.** `public/js/main.js` hace `fetch` POST (JSON, sin cabeceras personalizadas para evitar preflight CORS) a `site.formularioUrl`. El script está en `apps-script/Code.gs` y se pega manualmente en la Sheet.
- `scripts/build.js`: renderiza vistas y escribe `_headers` (CSP) y `_redirects`. Falla si `formularioUrl` no es una URL https de script.google.com.
- `scripts/dev.js`: servidor local con recarga; simula el Apps Script en `/__dev/suscribir` y guarda en `data/suscriptores-local.txt`.
- `lib/recursos.js` carga `content/recursos/*.json` (una página de descarga por archivo). `lib/headers.js` define las cabeceras de seguridad.
- `content/site.js` datos globales (links, redes, formularioUrl). `views/` plantillas; `views/partials/` head, header, footer, logo.
- Páginas: `/`, `/privacidad`, `/recursos/<slug>`, `/recursos/<slug>/gracias` (noindex, requiere sessionStorage `mn-acceso-<slug>` o redirige al formulario), `404.html`.

## Marca
- Azul marino `#1B2545`, naranja `#EE7D3B`, crema `#FBF4EE`, gris puntos `#B9C1CE`. Variables en `:root` de `public/css/styles.css`.
- Títulos: Bebas Neue en mayúsculas (clase `.display`), una parte destacada en naranja (`.acento`). Texto: Montserrat.
- Motivos: círculo naranja detrás de la foto, grilla de puntos grises, botones píldora naranjas.
- Páginas de recurso/gracias usan el "panel" azul oscuro redondeado (inspirado en tengounplanpodcast.com).

## Reglas
- Para un recurso nuevo: crear JSON en `content/recursos/`. No hardcodear recursos en vistas.
- Validación en dos lados: navegador (`main.js`, solo UX) y **Apps Script (autoritativa)**. Si cambias reglas, cámbialas en ambos y en los tests.
- En EJS usar `<%= %>` (escapado). Nada de scripts inline ni CDNs nuevos sin actualizar `lib/headers.js` (y con SRI si es script).
- Si cambias `apps-script/Code.gs`, recuérdale a Mari publicar una **nueva versión** de la implementación.
- No commitear `data/*.txt`, `.env` ni `dist/`. No loguear emails/nombres.
- Agregar tests en `test/` (incluyendo casos negativos). Correr `npm test`.
- Responsive: probar en 390px de ancho, sin scroll horizontal.
- Estilo de contenido: no usar el guion largo (—) en textos visibles de la página. Usa coma, dos puntos o paréntesis.
