# SPEC 19 — Dominio Post y rutas canónicas

> **Status:** Approved
> **Depends on:** SPEC 12, SPEC 14, SPEC 15, SPEC 18
> **Date:** 2026-09-30
> **Objective:** Integrar publicaciones, detalle, comentarios, reacciones y media bajo Post y reemplazar las rutas legacy por la jerarquía oficial `/posts`.

## Scope

**In:**

- Crear `src/domain/post/` para entidades, reglas y modelos puros de publicaciones.
- Crear `src/application/post/` para comandos, consultas, DTOs, autorización y proyecciones.
- Integrar post-detail, comentarios y reacciones bajo Post.
- Definir ports de persistencia y `ImageStorage` según casos de uso reales.
- Implementar Cloudinary bajo `src/infrastructure/adapters/cloudinary/`.
- Crear `src/infrastructure/composition/post/`.
- Crear las rutas oficiales `/posts/new`, `/posts/[postId]`, `/posts/[postId]/edit`, `/posts/[postId]/comments/new` y `/posts/[postId]/comments/[commentId]/edit`.
- Separar rutas de staff y general mediante `(staff)` y `(general)` sin cambiar las URLs públicas.
- Mantener layouts locales cuando exista responsabilidad real.
- Mover componentes reutilizables de Posts a `src/components/domain/post/`.
- Mantener componentes exclusivos de una ruta en sus `_components`.
- Mantener Server Actions de entrada junto a las rutas en `_actions`.
- Actualizar todos los enlaces, cancelaciones, redirects y `revalidatePath`.
- Eliminar las rutas `/post`, `/post-detail`, `/post-comment/new` y `/post-comment/edit`.

**Out of scope (for future specs):**

- Cerrar los criterios externos pendientes de Cloudinary de SPEC 12.
- Cambiar reglas de autorización, contenido, media o engagement.
- Añadir likes en el detalle, moderación, notificaciones o nuevas reacciones.
- Crear aliases legacy para Posts.

## Data model

No se modifican campos, relaciones ni datos persistidos.

Los contratos actuales de `PersistedFeedPost`, `FeedComment`, `FeedReaction`, `FeedMedia` y `FeedEngagement` se reubican bajo `domain/post` o `application/post` según sean modelo persistido, regla o proyección.

Los ports se diseñan para consultas y mutaciones necesarias, no para cada archivo físico.

## Implementation plan

1. Registrar todas las rutas, enlaces, redirects, cancelaciones y revalidaciones actuales de Posts.
2. Crear los modelos y reglas puras de Post, media, comentarios y reacciones.
3. Crear los casos de uso y proyecciones de creación, edición, detalle, comentarios y reacciones.
4. Definir ports de persistencia, media y autorización, e implementarlos mediante la composición de Post.
5. Mover Cloudinary al adapter de Infrastructure sin alterar el contrato de assets autenticados.
6. Mover `FeedPostCard`, iconos y componentes reutilizables ligados a Post a `components/domain/post`.
7. Crear `/posts/new` y `/posts/[postId]/edit` bajo `(staff)` con sus adapters de entrada.
8. Crear `/posts/[postId]` y la jerarquía de comentarios bajo `(general)`.
9. Actualizar tarjetas, formularios, destinos de cancelación, redirects y `revalidatePath` exclusivamente a `/posts/...`.
10. Eliminar features y rutas legacy de Posts después de búsquedas estáticas y smoke tests.
11. Ejecutar checks completos y pruebas Playwright de staff, familia, autorización, creación, edición, comentario y reacción.

## Acceptance criteria

- [ ] Existen exactamente las cinco rutas oficiales `/posts/...` definidas por esta spec.
- [ ] `/posts/new` y `/posts/[postId]/edit` pertenecen al área `(staff)`.
- [ ] `/posts/[postId]` y sus comentarios pertenecen al área `(general)`.
- [ ] `domain/post` no depende de Application, Infrastructure, Next.js, React ni SDKs.
- [ ] `application/post` no importa Cloudinary, filesystem ni APIs de navegación.
- [ ] La composición de Post conecta todos los ports requeridos.
- [ ] Cloudinary se implementa en `src/infrastructure/adapters/cloudinary`.
- [ ] Los componentes Post compartidos viven en `src/components/domain/post`.
- [ ] Las páginas y Server Actions no construyen adapters concretos.
- [ ] Todos los enlaces internos usan exclusivamente `/posts/...`.
- [ ] Todos los `revalidatePath` usan exclusivamente las nuevas rutas.
- [ ] `/post`, `/post-detail`, `/post-comment/new` y `/post-comment/edit` responden 404.
- [ ] Se conserva autorización por rol, sala, autoría y propiedad de comentarios.
- [ ] Los contadores siguen derivados de las colecciones relacionadas.
- [ ] Los JSON de Posts conservan sus registros y estructura.
- [ ] `npx eslint app src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] Playwright verifica todas las rutas oficiales en escritorio y móvil.

## Decisions

- **Sí:** unificar feed, detalle, comentarios y reacciones bajo Post.
- **Sí:** separar físicamente staff y general mediante Route Groups.
- **No:** crear una ruta única con query params para sustituir la jerarquía oficial.
- **Sí:** usar `[postId]` y `[commentId]` como nombres canónicos.
- **No:** mantener aliases internos o redirects legacy para Posts.
- **Sí:** preservar los contratos Cloudinary existentes.
- **No:** cerrar en esta spec las pruebas externas pendientes de Cloudinary.

## Risks

| Risk                                                       | Mitigation                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Un enlace antiguo permanece en un componente o acción.     | Buscar literalmente todos los segmentos legacy antes de eliminar las rutas.   |
| La separación de detalle y comentarios rompe autorización. | Reutilizar casos de uso de Application y verificar cada mutación en servidor. |
| Route Groups producen paths duplicados.                    | Validar que cada URL pública tenga una sola página física.                    |

## What is **not** in this spec

- Nuevas capacidades funcionales de Posts.
- Compatibilidad interna con rutas legacy.
- Pruebas reales adicionales de proveedores externos.
