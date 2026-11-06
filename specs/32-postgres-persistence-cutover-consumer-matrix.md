# SPEC 32 — Matriz de consumidores de persistencia JSON

Esta matriz documenta la revisión realizada en el Paso 1 del cutover. El
resultado distingue los snapshots JSON históricos, sus antiguos adapters y los
consumidores runtime actuales.

## Resultado ejecutivo

**No se encontraron consumidores runtime actuales de repositorios JSON.** El
árbol versionado no contiene `src/infrastructure/persistence/json/`, sus 11
snapshots ni imports desde ese módulo. Las apariciones de `JSON.parse` y
`JSON.stringify` restantes corresponden a payloads de formularios o tokens,
no a persistencia de entidades de negocio.

## Inventario de snapshots JSON conservados como referencia de migración

| Snapshot | Consumidor histórico | Sustituto runtime PostgreSQL |
| --- | --- | --- |
| `credential.json` | Auth: credenciales | `PostgresCredentialRepository` |
| `people.json` | Auth, Family, Kids, Posts | `PostgresPersonRepository` |
| `invitation.json` | Family: invitaciones | `PostgresInvitationRepository` |
| `rooms.json` | Kids, Posts | `PostgresRoomRepository` |
| `staff-rooms.json` | Staff: autorización por sala | `PostgresPostAccessRepository` y relaciones PostgreSQL |
| `kids.json` | Kids, Family, Posts | `PostgresKidRepository` |
| `parent-kids.json` | Family, Kids, Posts | `PostgresParentKidRepository` |
| `feed.json` | Staff/General: publicaciones y media | `PostgresPostRepository` |
| `feed-comments.json` | General: comentarios | `PostgresPostCommentRepository` |
| `feed-overview.json` | Staff: encabezado del feed | `PostgresFeedOverviewRepository` |
| `feed-reactions.json` | General: reacciones | `PostgresPostReactionRepository` |

## Matriz de consumidores runtime

| Área / entrada | Necesidades de persistencia | Composición runtime actual | Estado JSON |
| --- | --- | --- | --- |
| Auth / login | Credenciales, personas, `daycareId` | `src/composition/auth/auth-composition.ts` → `PostgresCredentialRepository`; resolución de tenant mediante runtime PostgreSQL | Sin consumidor JSON |
| Family / invitaciones | Invitaciones, personas, Kids, ParentKids, transacción de Auth | `src/composition/family/family-composition.ts` → repositorios PostgreSQL y `PostgresAuthTransactionRunner` | Sin consumidor JSON |
| Kids | Kids, People, Rooms, ParentKids | `src/composition/kid/kid-composition.ts` → `PostgresKidRepository`, `PostgresPersonRepository`, `PostgresRoomRepository`, `PostgresParentKidRepository` | Sin consumidor JSON |
| Staff / posts | Personas, Kids, Rooms, autorización, posts, media | `src/composition/post/post-composition.ts` → `createPostgresPostComposition` | Sin consumidor JSON |
| General / feed | Posts, destinatarios, media, comentarios, reacciones | `src/composition/post/post-composition.ts` y `src/composition/family/family-feed-composition-postgres.ts` → repositorios PostgreSQL | Sin consumidor JSON |
| Feed overview | Encabezado del feed por tenant | `src/composition/feed/feed-overview-composition.ts` → `PostgresFeedOverviewRepository` | Sin consumidor JSON |

## Adapters JSON históricos

El historial del repositorio identifica estos módulos bajo el antiguo
`src/infrastructure/persistence/json/`:

- `index.ts`
- `json-collection.ts`
- `json-daycare.ts`
- `json-transaction-runner.ts`
- `data/` con los 11 snapshots enumerados arriba

Ninguno está presente en el árbol runtime actual ni es importado por
`src/app`, `src/composition`, `src/application` o `src/infrastructure`.

## Falsos positivos excluidos

Estas serializaciones no son consumidores de repositorios JSON y quedan fuera
del cutover de persistencia:

- `src/app/_actions/posts/post-action.ts`: parseo de campos ocultos del
  formulario.
- `src/app/_actions/posts/restriction-confirmation.ts`: payload firmado de
  confirmación.
- `src/presentation/post/post-form.tsx`: serialización de valores de campos
  ocultos enviados al servidor.
- `src/infrastructure/persistence/postgres/types/database.types.ts`: tipo
  `Json` generado para PostgreSQL.

## Evidencia de verificación

La matriz se verificó mediante:

1. Inventario de archivos versionados bajo `src/infrastructure/persistence/json`.
2. Búsqueda de imports y referencias a `persistence/json`, adapters JSON y
   repositorios JSON en TypeScript, TSX y documentación runtime.
3. Inspección de las composiciones Auth, Family, Kids, Posts y Feed.

**Conclusión del Paso 1:** no queda ningún consumidor runtime JSON pendiente de
desconectar; los pasos posteriores deben validar sesiones, smoke tests,
documentación y ausencia de regresiones sin reintroducir un fallback JSON.
