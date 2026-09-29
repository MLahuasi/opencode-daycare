# SPEC 15 — Interacciones del feed familiar

> **Status:** Implemented
> **Depends on:** SPEC 08, SPEC 09, SPEC 13, SPEC 14
> **Date:** 2026-09-29
> **Objective:** Permitir que padres autorizados agreguen o retiren likes y creen, editen o eliminen sus comentarios en publicaciones del feed familiar.

## Scope

**In:**

- Hacer interactivo el corazón de cada tarjeta en `/family-feed`.
- Agregar o retirar una reacción `love` mediante un toggle.
- Garantizar como máximo una reacción por `postId` y `personId`.
- Mantener el corazón del detalle sin interacción nueva.
- Reutilizar `CommentIcon` y crear `HeartIcon` en `app/components/ui/`.
- Exportar ambos iconos desde `app/components/ui/index.ts`.
- Navegar desde el icono de comentario del feed y del detalle hacia `/post-comment/new?postId=<postId>`.
- Crear `/post-comment/edit?id=<commentId>`.
- Permitir que padres y personal editen y eliminen únicamente sus propios comentarios.
- Mostrar Editar y Eliminar junto a comentarios propios en `/post-detail`.
- Solicitar confirmación antes de eliminar físicamente un comentario.
- Volver a `/post-detail?id=<postId>` después de crear, editar, eliminar o cancelar.
- Permitir interacción con cualquier post visible de las salas autorizadas, incluidos posts de otros niños y anuncios de sala.
- Derivar todos los contadores desde `feed-reactions.json` y `feed-comments.json`.
- Mostrar los comentarios más recientes primero.
- Permitir que padres y personal interactúen con publicaciones visibles para su sesión.

**Out of scope:**

- Likes interactivos dentro de `/post-detail`.
- Moderación de comentarios ajenos.
- Eliminación lógica o recuperación de comentarios.
- Respuestas anidadas, menciones o adjuntos.
- Más tipos de reacción.
- Notificaciones y rate limiting.
- Rediseño estructural de `/post-detail`.
- Incorporación de un framework de pruebas unitarias.

## Data model

```ts
type FeedComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string | null;
};

type FeedReaction = {
  id: string;
  postId: string;
  personId: string;
  type: "love";
  createdAt: string;
};

type FeedEngagement = {
  reactionCount: number;
  commentCount: number;
  viewerHasLoved: boolean;
};
```

Convenciones:

- `FeedEngagement` es una proyección y no se persiste.
- `feed.json` deja de contener `reactions` y `comments`.
- Los contadores se calculan desde las colecciones relacionadas.
- `updatedAt` será `null` al crear y contendrá una fecha UTC después de editar.
- Los comentarios existentes migrarán con `updatedAt: null`.
- El cuerpo se normaliza con `trim()` y acepta entre 1 y 500 caracteres.
- La identidad procede exclusivamente de `session.user.personId`.
- La eliminación quita físicamente el registro de `feed-comments.json`.
- Las mutaciones deben comprobar nuevamente autorización y propiedad en el servidor.

## Implementation plan

1. Crear `HeartIcon` en `app/components/ui/`, exportarlo desde el barrel y reemplazar los iconos privados de `FeedPostCard` por los componentes UI públicos.
2. Ampliar `FeedComment` con `updatedAt`, migrar `feed-comments.json` y agregar validación server-side para comentarios de hasta 500 caracteres.
3. Crear servicios de engagement para proyectar contadores desde las colecciones relacionadas y retirar los campos duplicados de `FeedPost` y `feed.json`.
4. Actualizar las proyecciones del feed familiar, feed de personal y detalle para consumir los contadores derivados.
5. Implementar el toggle atómico de `love` bajo el lock de escritura JSON, comprobando sesión autenticada, acceso al post y unicidad por persona.
6. Conectar el corazón de `/family-feed` con estado activo, pending, disabled y error recuperable, conservando el filtro actual.
7. Implementar la creación de comentarios y `/post-comment/new?postId=<postId>` con un formulario reutilizable.
8. Implementar la actualización de comentarios propios y `/post-comment/edit?id=<commentId>`, preservando identidad, asociación y fecha de creación.
9. Implementar la eliminación física mediante Server Action y confirmación accesible.
10. Actualizar `/post-detail` para ordenar comentarios por fecha descendente, enlazar la creación y mostrar Editar/Eliminar únicamente al autor.
11. Revalidar `/family-feed`, `/home` y `/post-detail` después de cada mutación y verificar autorización, accesibilidad y responsive.

## Acceptance criteria

- [x] `HeartIcon` y `CommentIcon` se consumen desde `@/app/components/ui`.
- [x] Ambos componentes aceptan y combinan atributos SVG, incluido `className`.
- [x] El corazón de `/family-feed` indica mediante `aria-pressed` si el padre reaccionó.
- [x] El primer clic agrega una reacción asociada al post y persona correctos.
- [x] El siguiente clic elimina esa reacción.
- [x] Nunca existe más de una reacción por `postId` y `personId`.
- [x] El botón se deshabilita mientras se persiste la reacción.
- [x] Un error de persistencia deja la interfaz en un estado recuperable.
- [x] El corazón no adquiere comportamiento interactivo en `/post-detail`.
- [x] El icono de comentario del feed navega a `/post-comment/new?postId=<postId>`.
- [x] La acción de comentario del detalle navega a la misma ruta.
- [x] Crear un comentario agrega un registro a `feed-comments.json`.
- [x] El comentario usa la persona autenticada como `authorId`.
- [x] Se rechazan comentarios vacíos o con más de 500 caracteres.
- [x] Guardar o cancelar vuelve al detalle del post correspondiente.
- [x] `/post-comment/edit?id=<commentId>` carga únicamente comentarios propios autorizados.
- [x] Editar conserva `id`, `postId`, `authorId` y `createdAt`.
- [x] Editar actualiza `body` y asigna `updatedAt` en UTC.
- [x] Los comentarios editados muestran una indicación de edición.
- [x] Eliminar requiere confirmación y quita físicamente el registro.
- [x] Una persona no puede editar ni eliminar comentarios ajenos.
- [x] Un post inexistente o no autorizado no revela información.
- [x] Padres pueden interactuar con posts y anuncios de todas sus salas autorizadas.
- [x] Personal puede ver e interactuar con comentarios y reacciones de posts visibles.
- [x] Los comentarios se muestran del más reciente al más antiguo.
- [x] Los totales del feed y del detalle coinciden con los JSON relacionados.
- [x] `feed.json` ya no almacena contadores duplicados.
- [x] Las mutaciones actualizan feed y detalle sin perder el filtro activo.
- [x] Los controles funcionan con teclado y en viewport móvil.
- [x] `npx eslint app` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] `git diff --check` termina correctamente.
- [x] Los flujos funcionales se verifican con Playwright.

## Decisions

- **Sí:** usar query params en `/post-comment/new` y `/post-comment/edit`.
- **No:** crear una ruta independiente para eliminar.
- **Sí:** limitar las mutaciones a padres y personal activos.
- **Sí:** permitir que cada persona administre únicamente sus comentarios.
- **Sí:** autorizar interacciones sobre todo post visible de sus salas.
- **Sí:** eliminar comentarios físicamente.
- **Sí:** persistir `updatedAt` nullable.
- **Sí:** limitar comentarios a 500 caracteres.
- **Sí:** volver al detalle después de las acciones de comentario.
- **Sí:** mostrar Editar y Eliminar en comentarios propios del detalle.
- **Sí:** solicitar confirmación antes de eliminar.
- **Sí:** usar las colecciones relacionadas como única fuente de contadores.
- **Sí:** implementar un toggle único de `love`.
- **Sí:** mostrar comentarios nuevos primero.
- **No:** hacer interactivo el corazón del detalle.
- **No:** introducir pruebas unitarias en esta entrega.

## Risks

| Risk                                                                | Mitigation                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Clics concurrentes pueden duplicar reacciones.                      | Ejecutar el toggle bajo el lock de escritura y comprobar unicidad dentro de la sección crítica.   |
| Un identificador manipulado puede apuntar a otro post o comentario. | Revalidar sesión, acceso al post y propiedad en cada Server Action.                               |
| El feed y el detalle pueden mostrar contadores distintos.           | Derivar ambos exclusivamente de las colecciones relacionadas.                                     |
| Retirar contadores de `FeedPost` puede afectar el feed de personal. | Migrar todas las proyecciones y tarjetas en el mismo paso funcional.                              |
| La persistencia JSON solo coordina un proceso Node.                 | Mantener el alcance actual y registrar la limitación para una futura persistencia multiinstancia. |

## What is **not** in this spec

- Likes interactivos en el detalle.
- Moderación o recuperación de comentarios.
- Respuestas, menciones, archivos adjuntos o notificaciones.
- Nuevos tipos de reacción.
- Rediseño general del detalle.
- Framework de pruebas unitarias.
