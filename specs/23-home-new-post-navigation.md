# SPEC 23 — Navegación a nueva publicación desde Home

> **Status:** Approved
> **Depends on:** SPEC 22
> **Date:** 2026-10-06
> **Objective:** Permitir que el personal autenticado navegue desde el botón “Nueva publicación” de `/home` hasta `/posts/new` conservando la apariencia y autorización actuales.

## Scope

**In:**

- Verificar y mantener el botón “Nueva publicación” en el feed de personal de `/home`.
- Navegar internamente a `/posts/new` al activar el botón.
- Mantener la presentación, el texto y el comportamiento responsive actuales del botón.
- Mantener la autorización existente de `/posts/new` mediante `requireStaffSession`.
- Verificar la navegación en escritorio y móvil con una sesión de personal autenticada.

**Out of scope (for future specs):**

- Cambiar el formulario o el flujo de creación de publicaciones.
- Permitir la creación de publicaciones a familias o personas no autenticadas.
- Realizar una petición `fetch` contra `/posts/new` en lugar de navegar.
- Abrir la ruta en una pestaña nueva.
- Cambiar estilos, copy, persistencia, datos o reglas de negocio.

## Data model

Esta spec no introduce ni modifica estructuras de negocio, datos persistidos ni contratos de API.

## Implementation plan

1. Confirmar que el composer del feed de personal vive en `src/presentation/feed/feed-content.tsx` y que la ruta destino es `/posts/new`.
2. Conservar el control como `LinkButton` basado en `next/link`, sin añadir una Server Action ni una petición HTTP adicional.
3. Confirmar que `src/app/(staff)/posts/new/page.tsx` conserva `requireStaffSession` y el formulario actual.
4. Verificar con Playwright que una persona de personal autenticada puede activar “Nueva publicación” desde `/home` en escritorio y móvil y termina en `/posts/new`.
5. Ejecutar ESLint, TypeScript, build y `git diff --check` cuando existan cambios de implementación.

## Acceptance criteria

- [x] Una persona de personal autenticada ve el control “Nueva publicación” en `/home`.
- [x] El control conserva el texto, la apariencia y el comportamiento responsive actuales.
- [x] Al activar el control, la URL final es `http://localhost:3000/posts/new`.
- [x] La navegación usa la ruta interna `/posts/new` y no una petición `fetch` ni una pestaña nueva.
- [x] `/posts/new` renderiza el encabezado y formulario de nueva publicación después de la navegación.
- [x] `/posts/new` conserva la autorización actual para personal autenticado.
- [x] El flujo funciona en viewport de escritorio y móvil.
- [x] No se crean estructuras de datos, fixtures, persistencia ni reglas de negocio nuevas.

## Decisions

- **Sí:** usar `LinkButton` con `href="/posts/new"` porque el control representa una navegación y ya comparte la apariencia de botón.
- **No:** usar `fetch` contra `/posts/new` porque la ruta es una página, no una operación de datos.
- **No:** abrir una pestaña nueva porque el usuario espera continuar el flujo dentro de la aplicación.
- **Sí:** conservar `requireStaffSession` porque esta spec solo conecta la navegación y no cambia permisos.
- **No:** rediseñar el composer porque el alcance se limita al destino del botón.

## Risks

| Risk                                                          | Mitigation                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| La sesión no está autenticada durante la prueba.              | Iniciar sesión con la credencial demo antes de probar el click y verificar también el guard de `/posts/new`. |
| El Route Group `(staff)` se confunde con una parte de la URL. | Validar la URL pública `/posts/new`, sin el segmento físico `(staff)`.                                       |

## What is **not** in this spec

- Cambios en el formulario de Posts o en sus Server Actions.
- Nuevos permisos o acceso para familias.
- Peticiones HTTP manuales, pestañas nuevas o rediseño visual.
