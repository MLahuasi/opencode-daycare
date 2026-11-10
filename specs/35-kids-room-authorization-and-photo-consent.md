# SPEC 35 — Autorización de Kids por sala y consentimiento fotográfico

> **Status:** Draft
> **Depends on:** SPEC 34
> **Date:** 2026-11-10
> **Objective:** Restringir Kids a docentes asignados a las salas correspondientes y aplicar consentimiento fotográfico unánime de los progenitores activos.

## Why this spec exists

La aplicación puede comprobar el rol general, pero todavía no garantiza que una persona docente solo gestione niños de sus salas. La política de fotos también debe tratar el desacuerdo y la ausencia de progenitores como una denegación segura.

## Scope

**In:**

- Autorizar listar, consultar, crear, editar e invitar progenitores únicamente a personas con rol `teacher` y asignación a la sala del niño.
- Ocultar el enlace de Kids para personas sin esa capacidad.
- Responder con `notFound()` en páginas, acciones y recursos Kids sin autorización, sin revelar si existe el niño o la sala.
- Reutilizar una política única de consentimiento fotográfico.
- Permitir fotos solo si existe al menos un progenitor activo y todos los progenitores activos han consentido.
- Añadir pruebas de aplicación, persistencia y Playwright.
- Actualizar `README.md`, `AGENTS.md` y `architecture.md` con la regla de autorización y privacidad.

**Out of scope (for future specs):**

- Cambios en Cloudinary, URLs permanentes o URLs temporales.
- Cambios de esquema no necesarios para esta autorización.
- Límites individuales para alergias o notas.

## Data model

No se introducen nuevas tablas. Se reutilizan `people`, `kids`, `rooms`, las asignaciones de persona a sala y las relaciones progenitor-niño existentes.

La decisión de consentimiento debe equivaler a:

```text
activeParents.length > 0 && activeParents.every(parent => parent.photoConsent === true)
```

## Implementation plan

1. Centralizar la capacidad `manage-kids` para exigir rol `teacher` y sala asignada.
2. Aplicar la comprobación en layouts, páginas, acciones y repositorios de `src/app/(staff)/kids/`.
3. Proyectar la navegación sin el enlace Kids cuando la persona carezca de la capacidad.
4. Sustituir la comprobación de consentimiento de posts por la política compartida de `src/application/kid/utils/consent.ts`.
5. Añadir pruebas para docente asignado, docente no asignado, personal sin `teacher`, cero progenitores activos y consentimiento parcial.
6. Ejecutar Supabase local con Docker Desktop y verificar los recorridos autorizados y denegados con Playwright.
7. Actualizar `README.md`, `AGENTS.md` y `architecture.md` sin documentar secretos ni URLs de proveedores.

## Acceptance criteria

- [ ] Una persona con rol `teacher` solo puede operar sobre niños de sus salas asignadas.
- [ ] Una persona sin rol `teacher` no ve Kids y recibe 404 al acceder directamente.
- [ ] Una persona docente no puede inferir la existencia de una sala o niño no autorizado mediante acciones o errores.
- [ ] La navegación de Staff refleja la capacidad efectiva de la sesión.
- [ ] Cero progenitores activos impide publicar o adjuntar una foto.
- [ ] Un progenitor activo sin consentimiento impide publicar o adjuntar una foto.
- [ ] Todos los progenitores activos con consentimiento permiten la operación.
- [ ] Las pruebas SQL y de aplicación cubren los casos positivos y negativos.
- [ ] Playwright verifica navegación, acceso directo y consentimiento.
- [ ] `npx eslint src`, `npx tsc --noEmit --incremental false` y `npm run build` terminan correctamente.

## Decisions

- **Sí:** solo `teacher` con sala asignada. Evita que el rol general `personal` otorgue acceso excesivo.
- **Sí:** ocultar navegación y devolver 404. Reduce enumeración y mantiene una respuesta uniforme.
- **Sí:** progenitores activos y unanimidad. Un desacuerdo protege al menor.
- **No:** consentimiento de relaciones inactivas o pendientes. No representan una autorización vigente.
- **No:** cambios de Cloudinary. Se excluyeron expresamente del paquete.

## What is **not** in this spec

- URLs firmadas, temporales o permanentes de Cloudinary.
- Cambios en almacenamiento de imágenes.
- RLS global y rol PostgreSQL, que pertenecen a SPEC 38.

**Siguiente paso tras aprobación:** `/spec-impl 35-kids-room-authorization-and-photo-consent`
