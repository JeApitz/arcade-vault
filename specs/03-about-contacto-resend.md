# 03 — About + envío de correo de contacto (Resend)

**Estado:** Implementado
**Depende de:** SPEC 02
**Fecha:** 2026-08-13

**Objetivo:** Implementar la pantalla About en `/about`, replicando el diseño de `references/templates/home-about/about.jsx`, y conectar su formulario de contacto a un envío de correo real usando Resend.

## Alcance

**Incluye:**
- Nueva pantalla About en `/about`, portada de `about.jsx`: hero "ACERCA DE ARCADE VAULT" con misión y fila de 3 highlights (HECHO CON ❤️, JUEGOS EN HTML, PROYECTO EN CRECIMIENTO), separador decorativo animado, y sección de contacto con formulario (nombre, correo, mensaje).
- El link "Acerca de" del Nav (`app/components/nav.tsx`), que ya apunta a `/about` y ya tiene la lógica de estado activo (`isAcercaDe`) desde SPEC 02, deja de mostrar la 404 de Next.js.
- CSS portado tal cual de `references/templates/home-about/styles.css`, bloque `ABOUT PAGE` (líneas 1071–1149: `.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`, `.about-divider`, `.div-pixels`, `.about-contact`, `.contact-grid`, `.contact-form`, `.terminal-success`, etc.), agregado a `app/globals.css` sin modificar el resto del archivo.
- Envío real de correo al enviar el formulario: un Route Handler server-side (`app/api/contact/route.ts`) recibe `{ name, email, msg }`, valida que los tres campos no estén vacíos y que `email` tenga formato válido, y usa el SDK de Resend para enviar el mensaje.
- Configuración de Resend: dependencia `resend` en `package.json`, variable de entorno `RESEND_API_KEY` (el usuario coloca el valor real después), remitente `onboarding@resend.dev` (dirección de prueba sin dominio verificado), destinatario fijo `prueba@email.com`.
- Estado de error en el formulario: si el envío falla (red, API caída, respuesta no-OK del route handler), se muestra un estado de error con estética de terminal (línea roja) en vez del éxito, y el usuario puede reintentar sin perder lo escrito.
- Manejo de estado de carga: mientras se espera la respuesta del route handler, el botón de envío se deshabilita y muestra texto de "enviando" para evitar envíos duplicados.

**No incluye (fuera de alcance de este spec):**
- Verificación de dominio propio en Resend. Se usa `onboarding@resend.dev`, que Resend solo permite enviar al correo dueño de la cuenta API — asumido como suficiente porque el destinatario configurado (`prueba@email.com`) es esa misma cuenta. Migrar a un dominio verificado queda para un spec futuro si se necesita enviar a otras direcciones.
- Protección anti-spam (honeypot, CAPTCHA, rate limiting). No se pide y se considera fuera de alcance.
- Persistencia de los mensajes de contacto en base de datos: el mensaje solo viaja por correo, no se guarda en ningún lado.
- Cambios al Nav más allá de dejar de mostrar la 404 en `/about` (el link y su lógica de estado activo ya existen desde SPEC 02).

## Modelo de datos

No se introduce persistencia ni estructuras de datos nuevas más allá de tipos in-memory:

- Payload del formulario / Route Handler: `{ name: string, email: string, msg: string }`, tal como ya lo produce el estado `form` de `about.jsx`.
- Variable de entorno `RESEND_API_KEY` en `.env.local` (no versionada; `.env*` ya está en `.gitignore`).

## Plan de implementación

1. **Dependencia y entorno.** Agregar `resend` a `package.json` (`npm install resend`). Crear `.env.local` con `RESEND_API_KEY=` vacío (el usuario completa el valor) y `.env.example` con la misma clave sin valor, como referencia para el repo.
2. **CSS de About.** Agregar a `app/globals.css` el bloque `ABOUT PAGE` de `references/templates/home-about/styles.css` (líneas 1071–1149), sin modificar el resto del archivo.
3. **Route Handler de contacto.** Crear `app/api/contact/route.ts` con un `POST` que: lee `{ name, email, msg }` del body, valida que ninguno esté vacío y que `email` tenga formato de correo válido (si falla, responde 400), y si es válido llama a Resend (`from: "onboarding@resend.dev"`, `to: "prueba@email.com"`, `subject` con el nombre del remitente, `text`/`html` con nombre, correo y mensaje). Responde 200 en éxito o 500 si Resend falla, sin filtrar detalles internos del error en la respuesta.
4. **Pantalla About.** Crear `app/about/page.tsx` como Client Component portado de `about.jsx`: hero, highlights (con los íconos SVG pixelados de `HighlightIcon`), separador animado con `IntersectionObserver` para las clases `reveal`, y formulario de contacto. El `onSubmit` valida los campos igual que el template (sacude el formulario si falta alguno) y, si son válidos, hace `fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })` en vez de simular el envío.
5. **Estados del formulario.** Mientras la petición está en curso, el botón muestra "ENVIANDO…" y se deshabilita. Si la respuesta es OK, se muestra el mismo bloque `terminal-success` del template (con la animación de líneas ya existente). Si falla, se muestra un bloque de error con la misma estética de terminal pero borde/texto rojo (reutilizando `.terminal-success` con una variante o clase nueva `.terminal-error` en el CSS portado) y un botón para reintentar sin perder los valores de `form`.
6. **Verificación funcional.** Levantar `next dev`, ir a `/about`, confirmar que el Nav resalta "Acerca de" y ya no muestra 404. Completar el formulario y enviarlo con `RESEND_API_KEY` configurada: confirmar que llega el correo a `prueba@email.com` y que la UI muestra el estado de éxito. Simular un fallo (API key inválida o vacía) y confirmar que la UI muestra el estado de error y permite reintentar. Revisar en desktop y viewport móvil.
7. **Build.** Correr `npm run build` y confirmar que compila sin errores de tipos ni de rutas.

## Criterios de aceptación

- [ ] `/about` muestra la pantalla About completa: hero con misión, fila de 3 highlights, separador animado y formulario de contacto, con animaciones `reveal` al hacer scroll.
- [ ] El link "Acerca de" del Nav navega a `/about` y ya no muestra la 404 de Next.js.
- [ ] Enviar el formulario con los 3 campos completos hace una petición real a `app/api/contact` que usa Resend para enviar un correo a `prueba@email.com` desde `onboarding@resend.dev`.
- [ ] Enviar el formulario con algún campo vacío sacude el formulario (`shake`) y no dispara ninguna petición, igual que en el template.
- [ ] Mientras la petición está en curso, el botón de envío queda deshabilitado y muestra un texto de carga.
- [ ] Si el envío tiene éxito, se muestra el bloque `terminal-success` con el nombre de quien envió el mensaje.
- [ ] Si el envío falla (por ejemplo, `RESEND_API_KEY` ausente o inválida), se muestra un estado de error con estética de terminal y un botón para reintentar sin perder lo escrito.
- [ ] `RESEND_API_KEY` se lee desde variables de entorno (`.env.local`), nunca queda hardcodeada en el código.
- [ ] `npm run build` compila sin errores de tipos ni de rutas.

## Decisiones tomadas y descartadas

- **Remitente `onboarding@resend.dev` en vez de dominio propio.** Decisión explícita del usuario: todavía no tiene un dominio verificado en Resend. Esta dirección de prueba solo puede enviar correos al dueño de la cuenta API, lo cual coincide con el destinatario fijo elegido (`prueba@email.com`). Migrar a un dominio propio queda para cuando exista uno verificado.
- **`RESEND_API_KEY` se deja vacía en `.env.local` y el usuario la completa después.** Decisión explícita del usuario: no se debe pegar la clave real en el código ni en este spec.
- **Se agrega un estado de error visual en vez de solo loguear en consola.** Decisión explícita del usuario, recomendada porque un envío real puede fallar (a diferencia de la simulación del template, que nunca falla) y el usuario del formulario necesita saber que su mensaje no llegó.
- **Sin protección anti-spam.** No se pidió y el formulario es de bajo tráfico esperado; se puede agregar en un spec futuro si se vuelve necesario.
- **Sin persistencia de mensajes.** El correo es el único registro del contacto, igual que un formulario de contacto simple; no se introduce base de datos para esto.

## Riesgos identificados

- **Límite de `onboarding@resend.dev`.** Resend restringe esta dirección de prueba a enviar solo al correo dueño de la cuenta API. Si en el futuro se quiere recibir contacto en una dirección distinta a `prueba@email.com`, hará falta verificar un dominio propio en Resend.
- **`RESEND_API_KEY` ausente en el entorno de desarrollo.** Hasta que el usuario complete el valor en `.env.local`, cualquier envío fallará y debe mostrar el estado de error definido en este spec — es el comportamiento esperado, no un bug.
