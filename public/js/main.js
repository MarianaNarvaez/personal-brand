// JavaScript del sitio (sin dependencias).
(function () {
  'use strict';

  var CLAVE = function (slug) { return 'mn-acceso-' + slug; };
  var EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
  var NOMBRE_RE = /^[\p{L}\p{M}\p{N}' .-]{1,60}$/u;

  function guardarAcceso(slug) {
    try { sessionStorage.setItem(CLAVE(slug), String(Date.now())); } catch (e) { /* modo privado: seguimos igual */ }
  }
  function tieneAcceso(slug) {
    try { return sessionStorage.getItem(CLAVE(slug)) !== null; } catch (e) { return true; }
  }

  // ---------- Página de gracias: solo si viene del formulario ----------
  var gate = document.querySelector('[data-acceso]');
  if (gate && !tieneAcceso(gate.getAttribute('data-acceso'))) {
    window.location.replace(gate.getAttribute('data-formulario'));
  }

  // ---------- Formulario de suscripción ----------
  var form = document.querySelector('form[data-suscripcion]');
  if (!form) return;

  var boton = form.querySelector('button[type="submit"]');
  var textoBoton = boton.textContent;
  var estado = form.querySelector('.form__estado');

  function mostrarError(campo, mensaje) {
    var p = form.querySelector('#err-' + campo);
    var input = form.querySelector('[name="' + campo + '"]');
    var contenedor = input.closest('.campo, .check');
    p.textContent = mensaje || '';
    p.hidden = !mensaje;
    if (contenedor) contenedor.classList.toggle('campo--error', Boolean(mensaje));
    input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  }

  function mostrarEstado(mensaje) {
    estado.textContent = mensaje || '';
    estado.hidden = !mensaje;
  }

  function validar(datos) {
    var errores = {};
    if (!datos.nombre) errores.nombre = 'Escribe tu nombre.';
    else if (!NOMBRE_RE.test(datos.nombre)) errores.nombre = 'Revisa tu nombre (máx. 60 caracteres, sin símbolos).';
    if (!datos.email) errores.email = 'Escribe tu email.';
    else if (datos.email.length > 254 || !EMAIL_RE.test(datos.email)) errores.email = 'Ese email no parece válido.';
    if (datos.acepto !== 'si') errores.acepto = 'Necesito tu autorización para enviarte contenido.';
    return errores;
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    mostrarEstado('');

    var datos = {
      recurso: form.getAttribute('data-recurso'),
      nombre: form.nombre.value.trim().replace(/\s+/g, ' '),
      email: form.email.value.trim().toLowerCase(),
      acepto: form.acepto.checked ? 'si' : '',
      sitio_web: form.sitio_web.value
    };

    var errores = validar(datos);
    ['nombre', 'email', 'acepto'].forEach(function (c) { mostrarError(c, errores[c]); });
    var primero = Object.keys(errores)[0];
    if (primero) { form.querySelector('[name="' + primero + '"]').focus(); return; }

    boton.disabled = true;
    boton.textContent = 'Enviando…';

    // Sin cabeceras personalizadas: así el navegador no hace "preflight" y Apps Script acepta la petición
    fetch(form.getAttribute('data-endpoint'), { method: 'POST', body: JSON.stringify(datos) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || res.ok !== true) throw new Error('rechazado');
        guardarAcceso(datos.recurso);
        window.location.href = form.getAttribute('data-gracias');
      })
      .catch(function () {
        mostrarEstado('No pudimos registrar tu email. Revisa tu conexión e inténtalo de nuevo.');
        boton.disabled = false;
        boton.textContent = textoBoton;
      });
  });
})();
