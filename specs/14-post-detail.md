# SPEC 14 — Detalle de publicación

> **Status:** Implemented
> **Depends on:** SPEC 09, SPEC 12, SPEC 13
> **Date:** 2026-09-23
> **Objective:** Implementar `/post-detail?id=<id>` para mostrar publicaciones autorizadas, imágenes Cloudinary, comentarios y reacciones en modo lectura.

## Scope

**In:**

- Crear `/post-detail?id=<id>` basado en `references/screens/detalle-publicacion.dc.html`.
- Hacer navegables las tarjetas de `/home` y `/family-feed`.
- Autorizar al personal según sus salas asignadas.
- Autorizar a padres según las salas de sus hijos vinculados.
- Mostrar autor, niño o sala, tipo, fecha, descripción e imágenes.
- Generar URLs firmadas permanentes de Cloudinary desde el servidor para imágenes autorizadas.
- Persistir comentarios en `feed-comments.json`.
- Persistir reacciones en `feed-reactions.json`.
- Mostrar comentarios y reacciones existentes en modo lectura.
- Sembrar datos equivalentes al ejemplo de la plantilla usando personas activas y relaciones válidas.
- Mantener navegación de retorno según el rol.
- Mostrar una respuesta equivalente a no encontrado para IDs inexistentes o no autorizados.
- Mantener responsive y accesibilidad.

**Out of scope (for future specs):**

- Crear, editar o eliminar comentarios.
- Crear o retirar reacciones.
- Moderación.
- Visor independiente o descarga de fotografías.
- Notificaciones.
- Edición o eliminación de publicaciones.
- URLs Cloudinary temporales.

## Data model

```ts
type FeedComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

type FeedReaction = {
  id: string;
  postId: string;
  personId: string;
  type: "love";
  createdAt: string;
};
```

Los contadores del detalle se derivarán de las colecciones relacionadas. Las URLs firmadas no se persistirán; se generan a partir del `publicId` almacenado en `feed.json` después de autorizar el acceso.

## Implementation plan

1. Crear los tipos de comentarios y reacciones, registrar sus colecciones en el adapter JSON y añadir fixtures iniciales.
2. Crear servicios server-only para consultar un post individual y sus relaciones sin exponer datos no autorizados.
3. Crear la proyección de detalle por rol, incluyendo autoría, destinatario, fecha, contadores y URLs Cloudinary autorizadas.
4. Crear el componente visual de detalle basado en la plantilla, con acciones mutables omitidas o deshabilitadas.
5. Crear `/post-detail?id=<id>` con retorno a `/home` para personal y `/family-feed` para padres.
6. Actualizar las tarjetas de ambos feeds para navegar mediante el ID persistido.
7. Añadir estados de no encontrado, no autorizado, sin comentarios y sin imágenes.
8. Verificar autorización, datos sembrados, URLs Cloudinary, navegación, responsive y accesibilidad.

## Acceptance criteria

- [x] Una tarjeta de `/home` navega a `/post-detail?id=<id>`.
- [x] Una tarjeta de `/family-feed` navega a `/post-detail?id=<id>`.
- [x] El detalle muestra la publicación correcta según el ID.
- [x] Personal solo puede consultar posts de sus salas asignadas.
- [x] Padres solo pueden consultar posts de sus salas autorizadas.
- [x] Un ID inexistente o no autorizado no revela información del post.
- [x] El detalle muestra autor, destino, tipo, descripción y fecha.
- [x] Las fechas se muestran con la zona horaria `America/Guayaquil`.
- [x] Las imágenes se muestran mediante URLs Cloudinary generadas server-side.
- [x] No se generan URLs de imágenes para posts no autorizados.
- [x] Los comentarios se cargan desde `feed-comments.json`.
- [x] Las reacciones se cargan desde `feed-reactions.json`.
- [x] Los contadores coinciden con los registros relacionados.
- [x] El ejemplo inicial contiene comentarios y reacciones con autores válidos.
- [x] No se ofrecen controles funcionales para comentar o reaccionar.
- [x] Volver al feed respeta el rol actual.
- [x] Existen estados accesibles para detalle sin comentarios y sin imágenes.
- [x] La pantalla funciona en escritorio y móvil.
- [x] `npx eslint app` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] `git diff --check` termina correctamente.

## Decisions

- **Sí:** usar `/post-detail?id=<id>` como ruta de detalle.
- **Sí:** autorizar por rol y sala en servidor.
- **Sí:** permitir a padres consultar posts de otros niños de sus salas autorizadas.
- **Sí:** mantener comentarios y reacciones en colecciones JSON separadas.
- **Sí:** implementar el detalle como lectura únicamente.
- **No:** persistir URLs firmadas; se regeneran desde `publicId`.
- **Sí:** usar assets Cloudinary autenticados.
- **No:** permitir que una URL del cliente decida el acceso al post o a la imagen.
- **No:** implementar comentarios, reacciones o descarga en esta spec.

## Risks

| Risk                                                            | Mitigation                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Una consulta directa puede omitir el filtro familiar.           | El servicio de detalle debe resolver autorización antes de cargar media o relaciones. |
| Los contadores pueden diferir del contenido persistido.         | Derivar contadores exclusivamente de `feed-comments.json` y `feed-reactions.json`.    |
| Una URL Cloudinary puede ser compartida fuera de la plataforma. | Usar assets autenticados y firmar URLs solo tras autorización de la aplicación.       |

## What is **not** in this spec

- Creación o edición de publicaciones.
- Comentarios o reacciones mutables.
- Moderación.
- Visor o descarga independiente de fotos.
- URLs temporales Cloudinary.
