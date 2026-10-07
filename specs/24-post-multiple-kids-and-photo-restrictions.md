# SPEC 24 — Publicaciones para varios niños y restricciones de fotos

> **Status:** Implemented
> **Depends on:** SPEC 12, SPEC 15, SPEC 19, SPEC 20, SPEC 22
> **Date:** 2026-10-07
> **Objective:** Permitir que el personal cree y edite una publicación para uno, varios o todos los niños autorizados, excluyendo con confirmación previa a los niños con restricciones cuando existan fotos.

## Why this spec exists

El formulario actual admite un único niño por publicación y persiste `kidId`. Esta spec define el modelo final de destinatarios infantiles antes de llevar los datos a una futura base de datos. También corrige la visibilidad familiar para que coincida con los destinatarios directos de una publicación.

## Scope

**In:**

- Seleccionar uno o varios niños activos autorizados en `/posts/new` y `/posts/[postId]/edit`.
- Agregar un botón `Todos` que alterne entre todos los niños autorizados y ningún niño seleccionado.
- Iniciar una publicación nueva sin niños seleccionados.
- Mantener las salas como destinos excluyentes de los niños.
- Persistir una única publicación compartida con una lista `kidIds`.
- Permitir cambiar los destinatarios infantiles durante la edición.
- Evaluar restricciones de fotos para fotos nuevas y fotos retenidas durante la edición.
- Mostrar antes de guardar el mensaje exacto `Existen niños con restricciones: Nombre, Nombre`.
- Permitir volver al formulario o continuar excluyendo los niños restringidos.
- Bloquear el guardado cuando todos los niños seleccionados están restringidos y existen fotos.
- Permitir publicaciones sin fotos para niños restringidos.
- Aplicar la regla actual de Posts: todos los padres o tutores activos del niño deben tener consentimiento.
- Mantener el comportamiento actual de las publicaciones dirigidas a una sala.
- Autorizar el feed familiar, el detalle, comentarios y reacciones de una publicación infantil por vínculo directo con al menos un `kidIds`.
- Migrar los datos JSON al modelo final y conservar únicamente campos con funcionalidad real.
- Conservar engagement compatible y eliminar registros de comentarios o reacciones incompatibles con la autorización final.

**Out of scope (for future specs):**

- Crear publicaciones independientes por niño.
- Combinar una sala con uno o varios niños como destinatarios.
- Asociar cada foto con un niño individual.
- Crear o modificar una interfaz para administrar consentimientos familiares.
- Cambiar la regla de consentimiento vigente para publicaciones de sala.
- Añadir moderación, notificaciones, respuestas o nuevos tipos de reacción.
- Añadir lectores duales o compatibilidad temporal con `kidId`.
- Implementar la futura base de datos.
- Cambiar la alternancia visual de avatares infantiles, definida en SPEC 25.

## Data model

El contrato persistido final de una publicación será:

```ts
type PersistedPost = {
  id: string;
  type: PostType;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  media: PostMedia[];
  kidIds: string[];
  roomId: string | null;
};
```

Convenciones:

- `kidIds` contiene IDs únicos de niños activos y autorizados.
- `kidIds` no tiene significado de orden.
- Una publicación tiene uno o más `kidIds` o un `roomId`, pero nunca ambos.
- Una publicación infantil no puede tener una lista vacía de `kidIds`.
- `subject` se deriva al proyectar: nombre del niño, `Varios niños` o nombre de la sala.
- `dateTime` se elimina; el feed y el orden usan `createdAt`.
- `updatedAt` representa la última edición y no altera la antigüedad de la publicación.
- `initial`, `time`, `authorLabel`, `recipient`, `hasMedia` y `mediaLabel` dejan de persistirse porque son datos derivados de presentación.
- `feed-comments.json` y `feed-reactions.json` conservan sus contratos actuales y continúan referenciando posts mediante `postId`.

La acción de guardado podrá incluir un indicador de confirmación emitido por el servidor. Ese indicador no se persiste y solo autoriza la segunda fase del mismo envío.

## Implementation plan

1. Registrar los campos persistidos, las referencias de engagement y las reglas actuales de autorización antes de la migración.
2. Cambiar los contratos de dominio, DTO, repositorio y proyecciones de `kidId` a `kidIds`, manteniendo la exclusividad con `roomId`.
3. Eliminar de las proyecciones y adaptadores los campos derivados `subject`, `dateTime` y los campos legacy de presentación, calculándolos desde el modelo canónico.
4. Migrar `feed.json` atómicamente: convertir cada `kidId` en un array de un elemento, usar `kidIds: []` para el post de sala y conservar IDs, contenido, media y timestamps canónicos.
5. Auditar `feed-comments.json` y `feed-reactions.json` contra la nueva autorización directa, conservando registros compatibles y eliminando los inconsistentes sin cambiar los IDs de posts válidos.
6. Adaptar `/posts/new` y `/posts/[postId]/edit` para recibir y enviar múltiples `kidIds`, iniciar creación sin selección y mantener la sala como destino alternativo.
7. Implementar la selección individual, el botón `Todos` como alternancia todos/ninguno y la edición de destinatarios autorizados.
8. Implementar la primera fase server-side que detecta niños restringidos antes de subir imágenes o persistir la publicación.
9. Mostrar un diálogo accesible con el mensaje requerido y acciones para volver al formulario o continuar excluyendo las restricciones.
10. Implementar la segunda fase server-side con revalidación de sesión, destinatarios, consentimientos, media y confirmación para evitar omisiones manipuladas.
11. Actualizar la autorización de feed, detalle, comentarios y reacciones para permitir acceso familiar únicamente a personas vinculadas directamente con al menos un niño destinatario.
12. Mantener las reglas actuales de salas, incluyendo su visibilidad por sala y la prohibición de fotos.
13. Verificar creación, edición, migración, exclusión por consentimiento, acceso familiar, engagement, errores, responsive y accesibilidad.

## Acceptance criteria

- [x] `/posts/new` inicia sin niños seleccionados.
- [x] El formulario permite seleccionar y deseleccionar varios niños activos autorizados.
- [x] El botón `Todos` selecciona todos los niños autorizados cuando no están todos seleccionados.
- [x] El botón `Todos` deselecciona todos los niños cuando ya están todos seleccionados.
- [x] Seleccionar un niño limpia la sala seleccionada.
- [x] Seleccionar una sala limpia todos los niños seleccionados.
- [x] Una publicación infantil se persiste como un único registro con `kidIds` únicos.
- [x] Una publicación nunca persiste simultáneamente `kidIds` y `roomId` con valores activos.
- [x] El formulario de edición carga todos los `kidIds` persistidos.
- [x] La edición permite agregar y quitar niños autorizados.
- [x] Una publicación sin fotos puede incluir niños con o sin consentimiento.
- [x] El servidor evalúa restricciones para fotos nuevas y retenidas antes de subir o guardar media.
- [x] El mensaje previo usa exactamente el formato `Existen niños con restricciones: Nombre, Nombre` con nombres completos.
- [x] El diálogo permite volver al formulario sin persistir ni subir fotos.
- [x] Continuar excluye los niños restringidos y guarda la publicación restante.
- [x] Si todos los niños están restringidos y existen fotos, continuar no guarda y devuelve un error recuperable al formulario.
- [x] El servidor revalida la confirmación y los destinatarios en la segunda fase.
- [x] Las publicaciones familiares infantiles solo son visibles para personas vinculadas directamente con al menos un `kidIds`.
- [x] Una familia autorizada para un destinatario puede ver e interactuar con la publicación compartida.
- [x] Al editar destinatarios se conserva el engagement compatible con la autorización actual.
- [x] Los comentarios o reacciones incompatibles con la autorización final se eliminan de los JSON relacionados.
- [x] Las publicaciones de sala conservan su visibilidad, exclusividad y prohibición de fotos actuales.
- [x] `feed.json` no contiene `kidId`, `subject`, `dateTime` ni campos derivados de presentación.
- [x] `feed.json` conserva todos los IDs, cuerpos, autores, media y timestamps canónicos válidos.
- [x] Los JSON no contienen lectores duales ni parches de compatibilidad para el modelo anterior.
- [x] Los contratos de `kidId` de `parent-kids.json` e invitaciones no se modifican por esta migración.
- [x] El flujo funciona en viewport de escritorio y móvil.
- [x] `npx eslint src` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] `git diff --check` termina correctamente.
- [x] Playwright verifica creación, edición, consentimiento, acceso familiar y engagement.

## Decisions

- **Sí:** una publicación compartida con `kidIds`, porque evita duplicar contenido, media y engagement.
- **No:** una publicación independiente por niño, porque produciría duplicación y conversaciones divergentes.
- **Sí:** mantener niños y salas como destinos excluyentes, porque una sala ya representa un grupo completo.
- **Sí:** iniciar creación sin destinatarios, porque obliga a una selección explícita y evita publicar accidentalmente al primer niño.
- **Sí:** hacer `Todos` una alternancia todos/ninguno, porque permite seleccionar y corregir el grupo con el mismo control.
- **Sí:** confirmar la exclusión antes de guardar, porque el personal debe poder tomar acciones sobre las restricciones.
- **No:** subir fotos antes de confirmar, porque puede transferir media que el personal decide retirar.
- **Sí:** excluir solo los niños restringidos y conservar los demás, porque una restricción individual no debe bloquear destinatarios permitidos.
- **Sí:** bloquear cuando todos están restringidos, porque guardar fotos sin ningún destinatario sería inconsistente.
- **Sí:** usar nombres completos en el aviso, porque el personal necesita identificar exactamente a cada niño.
- **Sí:** migrar de forma limpia a `kidIds`, porque los JSON son la base de futuras tablas y no deben conservar modelos obsoletos.
- **No:** mantener `kidId` y `kidIds` simultáneamente, porque crearía dos fuentes de verdad.
- **Sí:** derivar `subject`, fechas de presentación y etiquetas, porque son proyecciones y no datos funcionales.
- **Sí:** conservar engagement compatible y eliminar solo registros incompatibles, porque los IDs y el historial válido deben preservarse.
- **Sí:** autorizar por vínculo directo en publicaciones infantiles, porque evita mostrar a una familia información de otro niño de la misma sala.
- **Sí:** conservar el engagement histórico cuando los destinatarios cambian y bloquear nuevas mutaciones no autorizadas mediante las reglas existentes.
- **No:** crear una funcionalidad adicional de limpieza de engagement durante la edición, porque la spec define la estructura final y la autorización server-side existente controla nuevas acciones.

## Risks

| Risk                                                                  | Mitigation                                                                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Se suben fotos antes de confirmar restricciones.                      | Resolver restricciones en servidor antes de cualquier upload y persistencia.                                     |
| Un segundo envío omite niños restringidos mediante datos manipulados. | Revalidar sesión, destinatarios, consentimiento y token de confirmación en servidor.                             |
| La migración parcial rompe la lectura de posts existentes.            | Cambiar contratos y `feed.json` en el mismo paso y verificar referencias antes y después.                        |
| El feed y detalle exponen publicaciones a familias no destinatarias.  | Reutilizar una política directa de acceso para lectura y mutaciones de engagement.                               |
| Cambiar destinatarios deja engagement incompatible.                   | Auditar y eliminar registros incompatibles durante la migración; comprobar autorización en cada mutación futura. |
| Se eliminan datos canónicos junto con campos legacy.                  | Conservar IDs, autores, cuerpos, media y timestamps; retirar solo campos derivados explícitos.                   |

## What is **not** in this spec

- Publicaciones duplicadas por niño.
- Destinos mixtos de sala y niños.
- Fotos asignadas individualmente a destinatarios.
- Gestión de consentimiento familiar.
- Compatibilidad dual con `kidId`.
- Nuevas funciones de engagement o moderación.
- Alternancia de colores de avatares, que pertenece a SPEC 25.
