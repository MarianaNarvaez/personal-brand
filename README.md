# Landing Mari Narváez (v1: Cloudflare Pages + Google Sheets)

> Versión gratuita y estática. La versión anterior con servidor Express está en la carpeta `mari-landing`.

Landing principal + páginas de recursos descargables (plantillas). Antes de descargar, la persona deja nombre y email, que se guardan en una **Google Sheet**.

**Cómo funciona:** el sitio es estático (HTML/CSS/JS generado desde `views/` y `content/`), se publica gratis en **Cloudflare Pages** y carga instantáneo. El formulario envía los datos a un **Google Apps Script** que los agrega como fila en tu Google Sheet.

```
Visitante → página en Cloudflare Pages → formulario → Apps Script → Google Sheet
                                                        ↓ ok
                                              página de descarga
```

## Correr en tu Mac

Necesitas Node.js 20 o superior (`node -v`).

```bash
cd ~/Documents/mari-landing-v1
npm install
npm run dev        # abre http://localhost:3000
```

En local el formulario está en **modo prueba**: no toca tu Google Sheet, guarda en `data/suscriptores-local.txt`.

- `npm test`: pruebas del sitio y del Apps Script.
- `npm run build`: genera la versión final en `dist/` (necesita la URL del Apps Script, ver abajo).

## Paso 1: Google Sheets (una sola vez)

1. Crea una Google Sheet nueva, por ejemplo "Suscriptores landing".
2. Menú **Extensiones → Apps Script**.
3. Borra lo que haya en `Code.gs`, pega todo el contenido de `apps-script/Code.gs` de este proyecto y guarda (ícono de disquete).
4. Botón **Implementar → Nueva implementación**. En el engranaje elige **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
5. Autoriza los permisos (Google te avisará que la app no está verificada: es tu propio script, dale "Configuración avanzada → Ir a…").
6. Copia la **URL de la aplicación web** (termina en `/exec`) y pégala en `content/site.js`, en `formularioUrl`.
7. Prueba: abre esa URL en el navegador, debe decir `{"ok":true,"servicio":"suscripciones activo"}`.

La pestaña "Suscriptores" se crea sola con el primer registro.

Si algún día cambias `Code.gs`: **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión**. Así la URL no cambia.

## Paso 2: GitHub

Crea un repositorio **privado** llamado `mari-landing` en github.com y luego:

```bash
cd ~/Documents/mari-landing-v1
git init
git add .
git commit -m "Landing inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mari-landing.git
git push -u origin main
```

## Paso 3: Cloudflare Pages (gratis)

1. Crea cuenta en dash.cloudflare.com.
2. **Workers & Pages → Create → Pages → Connect to Git** y elige `mari-landing`.
3. Configuración del build:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Save and Deploy**. En 1 o 2 minutos tendrás una URL tipo `mari-landing.pages.dev`.
5. Si Cloudflare te asigna otro nombre, actualiza `urlBase` en `content/site.js`.

Cada `git push` a `main` vuelve a publicar la página sola.

**Dominio propio (opcional):** en el proyecto de Pages → **Custom domains → Set up a domain**. HTTPS es automático.

## Agregar una plantilla nueva

1. Copia `content/recursos/plantilla-presupuesto.json` con otro nombre, p. ej. `plantilla-deudas.json`.
2. Cambia `slug` (será la URL: `/recursos/plantilla-deudas`), textos, `imagen` y los links de `descargas`.
3. `git push`. La tarjeta aparece sola en la home y los emails llegan a la misma Sheet con el nombre del recurso.

El archivo en Google Drive debe estar compartido como **"Cualquier persona con el enlace: Lector"**.

## Seguridad y datos

- La Sheet tiene datos personales: no la compartas públicamente.
- El Apps Script valida todo de nuevo (no confía en el navegador), ignora bots (campo oculto), neutraliza fórmulas y limita a 30 registros por minuto.
- La página de descarga no aparece en Google y redirige al formulario si alguien entra directo. Ojo: es un filtro "suave"; alguien técnico podría ver los links en el código. Para plantillas gratuitas es suficiente.
- Cabeceras de seguridad (CSP, etc.) en `dist/_headers`, generado desde `lib/headers.js`.
- Recomendado: `npm audit` y generar SBOM con `npx @cyclonedx/cyclonedx-npm --output-file sbom.json`.

## Pendientes

- Revisión legal de `views/privacidad.ejs` (Ley 1581 de 2012).
- Revisar la plantilla en Drive: tiene datos de ejemplo personales que quizá quieras limpiar.
