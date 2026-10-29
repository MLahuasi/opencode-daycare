# SPEC 26 — Diccionario de esquema PostgreSQL para OpenDayCare

> **Status:** Approved
> **Depends on:** SPEC 10, SPEC 15, SPEC 19, SPEC 20, SPEC 24
> **Date:** 2026-10-29
> **Objective:** Definir un diccionario PostgreSQL orientado a Supabase para reemplazar conceptualmente la persistencia JSON actual sin migrar todavía sus datos ni modificar el runtime.

## Why this spec exists

La aplicación persiste actualmente personas, credenciales, niños, salas, relaciones familiares, invitaciones, publicaciones y engagement en colecciones JSON. Esta spec define el modelo relacional futuro a partir de esas estructuras y conserva las reglas de dominio actuales antes de implementar una migración o nuevos adaptadores.

## Scope

**In:**

- Crear el diccionario documental `src/infrastructure/persistence/schemas/open-daycare-schema.md` durante la implementación de esta spec.
- Definir enums, tablas, tipos PostgreSQL, nulabilidad, defaults, claves, restricciones, índices y acciones referenciales.
- Modelar los datos funcionales de `credential.json`, `feed-comments.json`, `feed-overview.json`, `feed-reactions.json`, `feed.json`, `invitation.json`, `kids.json`, `parent-kids.json`, `people.json`, `rooms.json` y `staff-rooms.json`.
- Definir las tablas `daycares`, `users`, `credentials`, `rooms`, `children`, `parent_children`, `invitations`, `staff_rooms`, `posts`, `post_children`, `post_media`, `reactions`, `comments` y `feed_overviews`.
- Usar UUID como identificador de las entidades nuevas, con `gen_random_uuid()` como default cuando la entidad no reutilice una identidad externa.
- Mantener todos los valores persistidos en inglés: enums, estados, códigos, tipos de post y tags.
- Documentar la correspondencia conceptual entre cada colección JSON y sus tablas destino.
- Documentar una estrategia de aislamiento multi-tenant mediante `daycare_id` explícito.
- Documentar RLS y políticas objetivo basadas en claims confiables `sub`, `daycare_id` y `role`.
- Mantener autenticación propia con la tabla `credentials`; Supabase se considera el proveedor PostgreSQL y no se crea una dependencia con `auth.users`.
- Conservar las reglas actuales de autorización: staff limitado a salas asignadas y familias limitadas a niños vinculados, sus salas y publicaciones autorizadas.
- Exigir que una publicación tenga niños o una sala, pero nunca ambos.
- Conservar la metadata completa de media autenticada de Cloudinary.

**Out of scope (for future specs):**

- Crear SQL DDL, migraciones, seeds o scripts de transformación.
- Migrar los JSON actuales o crear mapas de IDs legacy.
- Cambiar IDs existentes en `src/infrastructure/persistence/json/data/`.
- Implementar repositorios PostgreSQL, clientes Supabase o nuevos adapters de persistencia.
- Cambiar la autenticación actual de la aplicación o mover credenciales a `auth.users`.
- Implementar la emisión o inyección de claims para RLS.
- Crear tablas `daily_summaries` o `devices`, porque no existen en las estructuras JSON actuales.
- Cambiar reglas de negocio, autorización, consentimiento, engagement o rutas existentes.
- Crear una interfaz administrativa para guarderías, usuarios, permisos o traducciones.

## Data model

### Conventions

- Todos los nombres de tablas y columnas están en `snake_case` y en inglés.
- Las tablas de entidad usan `id uuid primary key default gen_random_uuid()` salvo `users.id`, que debe ser generado por la capa de autenticación propia.
- Las columnas `created_at` y `updated_at` son `timestamptz` cuando la entidad necesita ambas marcas.
- Las fechas de negocio sin hora usan `date`.
- Las relaciones many-to-many usan claves primarias compuestas cuando no tienen atributos propios; usan UUID cuando tienen atributos adicionales.
- Las claves foráneas pertenecen a la misma guardería mediante restricciones o triggers documentados en la implementación posterior.
- Los textos visibles se resuelven en la UI; no se almacenan etiquetas españolas en enums ni tags.

### ENUMs

```text
user_role: parent, staff, admin
user_status: pending, active, inactive
relationship_type: father, mother, guardian
invitation_status: pending, accepted, expired
post_type: food, nap, activity, achievement, mood, announcement
child_status: active, inactive
reaction_type: love
media_resource_type: image
media_delivery_type: authenticated
media_format: jpg, jpeg, png, webp
device_platform: ios, android, web
```

`personal` del JSON se normaliza a `staff`. `inactive` de personas y niños se conserva como estado de dominio. El estado de invitación se deriva de `accepted_at` y `expires_at`, pero se expone como `invitation_status` para consultas y políticas.

### `daycares`

| Campo        | Tipo          | Restricciones y notas           |
| ------------ | ------------- | ------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()` |
| `name`       | `text`        | NOT NULL                        |
| `created_at` | `timestamptz` | NOT NULL, default `now()`       |
| `updated_at` | `timestamptz` | NOT NULL, default `now()`       |

### `users`

Perfil de aplicación para padres, staff y administradores. No contiene contraseña ni email como fuente de autenticación; la autenticación propia puede resolver el email en su registro de identidad asociado.

| Campo                   | Tipo          | Restricciones y notas                   |
| ----------------------- | ------------- | --------------------------------------- |
| `id`                    | `uuid`        | PK                                      |
| `daycare_id`            | `uuid`        | FK `daycares.id`, NOT NULL              |
| `role`                  | `user_role`   | NOT NULL                                |
| `status`                | `user_status` | NOT NULL, default `active`              |
| `full_name`             | `text`        | NOT NULL                                |
| `email`                 | `text`        | NOT NULL, unique dentro de la guardería |
| `avatar_url`            | `text`        | Nullable                                |
| `notify_on_post`        | `boolean`     | NOT NULL, default `true`                |
| `daily_summary_enabled` | `boolean`     | NOT NULL, default `true`                |
| `created_at`            | `timestamptz` | NOT NULL, default `now()`               |
| `updated_at`            | `timestamptz` | NOT NULL, default `now()`               |

Un usuario `pending` puede existir solo cuando el flujo de aplicación lo requiera; las invitaciones conservan además los datos del destinatario antes de crear el usuario.

### `credentials`

Representa `credential.json` y mantiene la autenticación propia.

| Campo           | Tipo          | Restricciones y notas           |
| --------------- | ------------- | ------------------------------- |
| `id`            | `uuid`        | PK, default `gen_random_uuid()` |
| `user_id`       | `uuid`        | FK `users.id`, NOT NULL, UNIQUE |
| `password_hash` | `text`        | NOT NULL                        |
| `created_at`    | `timestamptz` | NOT NULL, default `now()`       |
| `updated_at`    | `timestamptz` | NOT NULL, default `now()`       |

La tabla solo es accesible para el backend privilegiado de autenticación. Ninguna política de usuario permite leer `password_hash`.

### `rooms`

| Campo        | Tipo          | Restricciones y notas           |
| ------------ | ------------- | ------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()` |
| `daycare_id` | `uuid`        | FK `daycares.id`, NOT NULL      |
| `name`       | `text`        | NOT NULL                        |
| `created_at` | `timestamptz` | NOT NULL, default `now()`       |
| `updated_at` | `timestamptz` | NOT NULL, default `now()`       |

UNIQUE (`daycare_id`, `name`).

### `children`

| Campo           | Tipo           | Restricciones y notas                       |
| --------------- | -------------- | ------------------------------------------- |
| `id`            | `uuid`         | PK, default `gen_random_uuid()`             |
| `daycare_id`    | `uuid`         | FK `daycares.id`, NOT NULL                  |
| `room_id`       | `uuid`         | FK `rooms.id`, Nullable                     |
| `slug`          | `text`         | NOT NULL, unique dentro de la guardería     |
| `full_name`     | `text`         | NOT NULL                                    |
| `birth_date`    | `date`         | NOT NULL                                    |
| `enrolled_at`   | `date`         | NOT NULL                                    |
| `medical_notes` | `text`         | NOT NULL, default `''`                      |
| `allergy_tags`  | `text[]`       | NOT NULL, default `'{}'`, códigos en inglés |
| `status`        | `child_status` | NOT NULL, default `active`                  |
| `created_at`    | `timestamptz`  | NOT NULL, default `now()`                   |
| `updated_at`    | `timestamptz`  | NOT NULL, default `now()`                   |

`allergy_tags` reemplaza la cadena libre `allergies`; `medical_notes` conserva la información médica no estructurada. La UI traduce tags como `peanut`, `lactose`, `gluten` y `pollen`.

### `parent_children`

| Campo                   | Tipo                | Restricciones y notas           |
| ----------------------- | ------------------- | ------------------------------- |
| `id`                    | `uuid`              | PK, default `gen_random_uuid()` |
| `parent_id`             | `uuid`              | FK `users.id`, NOT NULL         |
| `child_id`              | `uuid`              | FK `children.id`, NOT NULL      |
| `relationship`          | `relationship_type` | NOT NULL                        |
| `photo_sharing_consent` | `boolean`           | NOT NULL, default `false`       |
| `created_at`            | `timestamptz`       | NOT NULL, default `now()`       |
| `updated_at`            | `timestamptz`       | NOT NULL, default `now()`       |

UNIQUE (`parent_id`, `child_id`). El consentimiento pertenece al vínculo porque la autorización actual exige evaluar a cada tutor activo.

### `staff_rooms`

| Campo        | Tipo          | Restricciones y notas     |
| ------------ | ------------- | ------------------------- |
| `staff_id`   | `uuid`        | FK `users.id`, NOT NULL   |
| `room_id`    | `uuid`        | FK `rooms.id`, NOT NULL   |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

PK (`staff_id`, `room_id`). Solo usuarios con rol `staff` o `admin` pueden participar, según la política de administración posterior.

### `invitations`

| Campo                | Tipo                | Restricciones y notas           |
| -------------------- | ------------------- | ------------------------------- |
| `id`                 | `uuid`              | PK, default `gen_random_uuid()` |
| `daycare_id`         | `uuid`              | FK `daycares.id`, NOT NULL      |
| `child_id`           | `uuid`              | FK `children.id`, NOT NULL      |
| `invited_by_user_id` | `uuid`              | FK `users.id`, NOT NULL         |
| `accepted_user_id`   | `uuid`              | FK `users.id`, Nullable         |
| `full_name`          | `text`              | NOT NULL                        |
| `email`              | `text`              | NOT NULL                        |
| `relationship`       | `relationship_type` | NOT NULL                        |
| `code`               | `text`              | NOT NULL, UNIQUE                |
| `status`             | `invitation_status` | NOT NULL, default `pending`     |
| `expires_at`         | `timestamptz`       | NOT NULL                        |
| `sent_at`            | `timestamptz`       | Nullable                        |
| `accepted_at`        | `timestamptz`       | Nullable                        |
| `created_at`         | `timestamptz`       | NOT NULL, default `now()`       |

`status` debe ser consistente con `accepted_at` y `expires_at`. Los datos de `people.json` en estado pendiente se conservan aquí hasta la activación.

### `posts`

| Campo        | Tipo          | Restricciones y notas           |
| ------------ | ------------- | ------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()` |
| `daycare_id` | `uuid`        | FK `daycares.id`, NOT NULL      |
| `author_id`  | `uuid`        | FK `users.id`, NOT NULL         |
| `room_id`    | `uuid`        | FK `rooms.id`, Nullable         |
| `type`       | `post_type`   | NOT NULL                        |
| `body`       | `text`        | NOT NULL                        |
| `created_at` | `timestamptz` | NOT NULL                        |
| `updated_at` | `timestamptz` | NOT NULL                        |

La publicación debe tener exactamente un destino: `room_id` o al menos una fila en `post_children`. Un constraint diferido, trigger o procedimiento transaccional debe hacer cumplir esta regla porque la exclusividad cruza tablas.

### `post_children`

| Campo      | Tipo   | Restricciones y notas               |
| ---------- | ------ | ----------------------------------- |
| `post_id`  | `uuid` | FK `posts.id` ON DELETE CASCADE     |
| `child_id` | `uuid` | FK `children.id` ON DELETE RESTRICT |

PK (`post_id`, `child_id`). Una publicación infantil puede tener uno o varios niños y no puede combinarse con `posts.room_id`.

### `post_media`

| Campo           | Tipo                  | Restricciones y notas                            |
| --------------- | --------------------- | ------------------------------------------------ |
| `id`            | `uuid`                | PK, default `gen_random_uuid()`                  |
| `post_id`       | `uuid`                | FK `posts.id` ON DELETE CASCADE                  |
| `asset_id`      | `text`                | NOT NULL                                         |
| `public_id`     | `text`                | NOT NULL                                         |
| `resource_type` | `media_resource_type` | NOT NULL, default `image`                        |
| `delivery_type` | `media_delivery_type` | NOT NULL, default `authenticated`                |
| `format`        | `media_format`        | NOT NULL                                         |
| `width`         | `integer`             | NOT NULL, `> 0`                                  |
| `height`        | `integer`             | NOT NULL, `> 0`                                  |
| `bytes`         | `integer`             | NOT NULL, `> 0`                                  |
| `position`      | `integer`             | NOT NULL, `>= 0`                                 |
| `original_name` | `text`                | NOT NULL                                         |
| `alt`           | `text`                | Nullable                                         |
| `url`           | `text`                | Nullable; no es necesaria para media autenticada |
| `created_at`    | `timestamptz`         | NOT NULL, default `now()`                        |

UNIQUE (`post_id`, `position`). Cada publicación admite como máximo cuatro media según la regla actual de dominio.

### `reactions`

| Campo        | Tipo            | Restricciones y notas           |
| ------------ | --------------- | ------------------------------- |
| `id`         | `uuid`          | PK, default `gen_random_uuid()` |
| `post_id`    | `uuid`          | FK `posts.id` ON DELETE CASCADE |
| `user_id`    | `uuid`          | FK `users.id` ON DELETE CASCADE |
| `type`       | `reaction_type` | NOT NULL, default `love`        |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`       |

UNIQUE (`post_id`, `user_id`). La autorización de inserción y eliminación debe comprobar que el usuario puede ver el post.

### `comments`

| Campo        | Tipo          | Restricciones y notas                            |
| ------------ | ------------- | ------------------------------------------------ |
| `id`         | `uuid`        | PK, default `gen_random_uuid()`                  |
| `post_id`    | `uuid`        | FK `posts.id` ON DELETE CASCADE                  |
| `author_id`  | `uuid`        | FK `users.id` ON DELETE CASCADE                  |
| `body`       | `text`        | NOT NULL, longitud de 1 a 500 tras normalización |
| `created_at` | `timestamptz` | NOT NULL, default `now()`                        |
| `updated_at` | `timestamptz` | Nullable                                         |

Solo el autor puede editar o eliminar su comentario. La creación requiere acceso autorizado al post.

### `feed_overviews`

Representa `feed-overview.json` como configuración/proyección persistida, usando claves en inglés y sin acoplar el esquema a etiquetas españolas.

| Campo                       | Tipo          | Restricciones y notas           |
| --------------------------- | ------------- | ------------------------------- |
| `id`                        | `uuid`        | PK, default `gen_random_uuid()` |
| `daycare_id`                | `uuid`        | FK `daycares.id`, NOT NULL      |
| `room_id`                   | `uuid`        | FK `rooms.id`, Nullable         |
| `room_label_key`            | `text`        | NOT NULL                        |
| `greeting_key`              | `text`        | NOT NULL                        |
| `attendance_count`          | `integer`     | NOT NULL, `>= 0`                |
| `date`                      | `date`        | NOT NULL                        |
| `composer_prompt_key`       | `text`        | NOT NULL                        |
| `published_today_label_key` | `text`        | NOT NULL                        |
| `created_at`                | `timestamptz` | NOT NULL, default `now()`       |
| `updated_at`                | `timestamptz` | NOT NULL, default `now()`       |

UNIQUE (`daycare_id`, `room_id`, `date`).

### `devices` and `daily_summaries`

No se incluyen en esta versión porque no existe una colección JSON funcional que los alimente. Se reservan para una spec futura si aparecen requisitos persistidos.

## JSON-to-table mapping

| Colección JSON        | Tabla o tratamiento                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `credential.json`     | `credentials`                                                                                    |
| `people.json`         | `users`; perfiles pendientes se mantienen como datos de `invitations` antes de activar la cuenta |
| `rooms.json`          | `rooms`                                                                                          |
| `kids.json`           | `children`; `allergies` se normaliza conceptualmente a `allergy_tags`                            |
| `parent-kids.json`    | `parent_children`                                                                                |
| `invitation.json`     | `invitations`                                                                                    |
| `staff-rooms.json`    | `staff_rooms`                                                                                    |
| `feed.json`           | `posts`, `post_children` y `post_media`                                                          |
| `feed-reactions.json` | `reactions`; `person_id` pasa a `user_id`                                                        |
| `feed-comments.json`  | `comments`; `author_id` pasa a FK `users.id`                                                     |
| `feed-overview.json`  | `feed_overviews`, con claves UI en inglés                                                        |

No se define una tabla para IDs legacy ni se modifica ningún JSON actual durante esta spec.

## Authorization and RLS contract

La autenticación propia debe entregar a la capa de acceso claims confiables equivalentes a `sub`, `daycare_id` y `role`. La emisión, firma e inyección de esos claims queda fuera de esta spec.

- Todas las tablas tenant-scoped habilitan RLS y filtran por `daycare_id` directo o por una relación que pertenezca a la misma guardería.
- Un padre `active` solo puede leer su usuario, sus vínculos `parent_children`, sus niños vinculados, las salas de esos niños, publicaciones infantiles con intersección directa y anuncios de sus salas.
- Un padre puede insertar o eliminar únicamente sus propias `reactions` y crear, editar o eliminar únicamente sus propios `comments`, siempre sobre posts visibles.
- Staff `active` solo puede leer y modificar niños, posts y engagement de salas presentes en `staff_rooms`.
- Admin `active` puede administrar el tenant según las políticas futuras de administración.
- `credentials` no admite acceso directo de padres, staff ni clientes; solo backend privilegiado.
- Las invitaciones permiten lectura y mutación únicamente al staff emisor autorizado, al backend de activación y al destinatario durante su flujo de aceptación.
- La implementación posterior debe evitar que una relación entre filas de distintos `daycare_id` sea válida.

## Indexes

La implementación SQL posterior deberá crear índices para:

- `users(daycare_id, role, status)` y `users(daycare_id, email)`.
- `rooms(daycare_id)`.
- `children(daycare_id, status, room_id)` y `children(daycare_id, slug)`.
- `parent_children(parent_id, child_id)` y `parent_children(child_id)`.
- `staff_rooms(staff_id, room_id)` y `staff_rooms(room_id)`.
- `invitations(code)`, `invitations(email, status)` y `invitations(child_id, status)`.
- `posts(daycare_id, created_at desc)`, `posts(author_id)`, `posts(room_id)` y `post_children(child_id, post_id)`.
- `post_media(post_id, position)`.
- `reactions(post_id, created_at desc)` y `comments(post_id, created_at desc)`.
- `feed_overviews(daycare_id, date desc)`.

## Implementation plan

1. Crear `src/infrastructure/persistence/schemas/open-daycare-schema.md` con el modelo, convenciones y enums acordados.
2. Documentar cada tabla con campos, tipos, nulabilidad, defaults, PK, FK, unique, checks y acciones de borrado.
3. Documentar el mapa de las once colecciones JSON actuales sin modificar sus archivos ni agregar tablas para datos inexistentes.
4. Documentar la normalización de `personal`, estados, `allergy_tags`, `person_id` y metadata de media respetando los contratos actuales del dominio.
5. Documentar el contrato de RLS, las relaciones de tenant, los claims requeridos y los límites de acceso familiar, staff y backend privilegiado.
6. Documentar índices, reglas XOR de destinos de posts, límites de media y restricciones de engagement.
7. Verificar que la documentación no proponga migraciones, SQL ejecutable, dependencias a IDs legacy ni cambios en el runtime actual.

## Acceptance criteria

- [x] Existe `src/infrastructure/persistence/schemas/open-daycare-schema.md`.
- [x] El archivo está en inglés para nombres persistidos y conserva explicaciones en español según las convenciones del repositorio.
- [x] El documento define todos los enums usados por las tablas.
- [x] El documento define `daycares`, `users`, `credentials`, `rooms`, `children`, `parent_children`, `invitations`, `staff_rooms`, `posts`, `post_children`, `post_media`, `reactions`, `comments` y `feed_overviews`.
- [x] Cada tabla documenta tipos PostgreSQL, nulabilidad, defaults, PK y FK.
- [x] Las relaciones con atributos propios usan tablas intermedias con UUID y las relaciones puramente many-to-many usan PK compuesta.
- [x] `credentials` conserva `password_hash` y se limita al backend privilegiado.
- [x] `users` normaliza `personal` a `staff` y soporta `pending`, `active` e `inactive`.
- [x] `children` usa `child_status` con `active` e `inactive`, `room_id` nullable y `allergy_tags text[]`.
- [x] `photo_sharing_consent` permanece en `parent_children`.
- [x] `invitations` conserva datos del invitado y documenta `invited_by_user_id` y `accepted_user_id`.
- [x] `staff_rooms` representa la asignación de staff a salas.
- [x] `posts` usa los tipos actuales `food`, `nap`, `activity`, `achievement`, `mood` y `announcement`.
- [x] `posts` y `post_children` documentan la exclusividad entre sala y niños y la exigencia de un destino.
- [x] `post_media` conserva asset ID, public ID, recurso, entrega, formato, dimensiones, bytes, posición, nombre original, alt y URL opcional.
- [x] `post_media` documenta el máximo de cuatro elementos por publicación.
- [x] `reactions` impone una reacción por usuario y post.
- [x] `comments` documenta límite de 500 caracteres y propiedad del autor para mutaciones.
- [x] `feed_overviews` representa todos los campos del JSON mediante claves UI en inglés y valores derivados adecuados.
- [x] El mapa JSON→tabla cubre las once colecciones actuales.
- [x] El documento no incluye migración de datos ni mapa de IDs legacy.
- [x] El documento no incluye `daily_summaries` ni `devices` como tablas activas.
- [x] El documento define `daycare_id` y aislamiento multi-tenant.
- [x] El documento define el contrato RLS para padres, staff, admins, backend y engagement propio.
- [x] El documento declara que los claims `sub`, `daycare_id` y `role` son prerrequisitos de RLS.
- [x] El documento incluye índices recomendados y reglas de cascada o restricción relevantes.
- [x] La revisión documental confirma que no se modifica ningún archivo runtime ni JSON persistido.
- [x] `git diff --check` termina correctamente.

## Decisions

- **Sí:** crear solo un diccionario Markdown en `src/infrastructure/persistence/schemas`, porque esta entrega define el contrato antes de implementar el adapter PostgreSQL.
- **No:** crear SQL o migrations, porque la persistencia JSON actual continúa siendo la fuente runtime.
- **Sí:** modelar las once colecciones JSON actuales, porque cada una contiene información funcional o una proyección persistida del sistema.
- **No:** incluir `daily_summaries` o `devices`, porque no tienen una fuente persistida actual.
- **Sí:** usar UUID en el modelo futuro, porque es el contrato objetivo de la base de datos.
- **No:** migrar IDs legacy ni crear un mapa de correspondencia, porque la migración de datos no pertenece a esta spec.
- **Sí:** mantener una tabla propia `credentials`, porque la aplicación conserva autenticación propia en esta fase.
- **No:** vincular `users` a `auth.users`, porque Supabase se usará como PostgreSQL alojado y no como autoridad de autenticación.
- **Sí:** normalizar `personal` como `staff`, porque es el término del modelo de base de datos.
- **Sí:** conservar los enums actuales del dominio, porque `food`, `mood`, `inactive` y el ciclo de invitaciones tienen comportamiento implementado.
- **Sí:** conservar consentimiento por vínculo padre-niño, porque todos los tutores activos deben consentir para autorizar fotos.
- **Sí:** usar `post_media`, porque la media actual contiene metadata de Cloudinary más amplia que una URL de foto.
- **Sí:** usar `feed_overviews`, porque el JSON correspondiente contiene una proyección persistida que debe quedar representada.
- **Sí:** documentar RLS, porque el aislamiento y la autorización son propiedades fundamentales del futuro esquema.
- **No:** resolver en esta spec la emisión de claims, porque requiere una decisión de integración de autenticación separada.
- **Sí:** limitar staff por `staff_rooms` y familias por vínculos directos, porque conserva las reglas de autorización actuales.

## Risks

| Risk                                                                | Mitigation                                                                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| La autenticación propia no entrega claims compatibles con RLS.      | Documentar `sub`, `daycare_id` y `role` como prerrequisitos antes de implementar las políticas.                               |
| Se mezclan filas de distintas guarderías mediante FKs individuales. | Validar pertenencia tenant con constraints compuestos, triggers o procedimientos transaccionales en la futura implementación. |
| La regla XOR de posts cruza `posts` y `post_children`.              | Implementar una operación transaccional o constraint diferido antes de migrar datos.                                          |
| Los enums nuevos divergen de los contratos actuales.                | Usar exclusivamente los valores del dominio actual y documentar las normalizaciones.                                          |
| Se pierde metadata de Cloudinary al pasar de JSON a tablas.         | Modelar explícitamente todos los campos de `PostMedia` y su posición.                                                         |
| Los textos españoles se convierten en datos rígidos.                | Persistir claves UI en inglés y resolver etiquetas en la capa de presentación.                                                |
| Las credenciales quedan expuestas mediante RLS permisivo.           | Mantener `credentials` fuera de las políticas de usuarios y limitarla a backend privilegiado.                                 |

## What is **not** in this spec

- SQL DDL, migrations, seeds o scripts de conversión.
- Migración de `src/infrastructure/persistence/json/data/`.
- Mapa o compatibilidad para IDs legacy.
- Repositorios, clientes o adapters PostgreSQL/Supabase.
- Cambio de la autenticación propia a Supabase Auth.
- Emisión e inyección de claims para RLS.
- Tablas `daily_summaries` y `devices`.
- Cambios en las reglas actuales de posts, consentimiento, autorización o engagement.
- Interfaz administrativa para configurar la base de datos.
