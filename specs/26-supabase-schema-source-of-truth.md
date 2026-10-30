# SPEC 26 — Fuente de verdad del esquema Supabase

> **Status:** Implement
> **Depends on:** SPEC 24
> **Date:** 2026-10-30
> **Objective:** Definir en `src/schemas/schema_db.md` el modelo relacional multi-guardería y el procedimiento reproducible para migrar los fixtures JSON a Supabase.

## Why this spec exists

La aplicación utiliza colecciones JSON como persistencia y todavía no tiene un modelo multi-guardería. Esta spec establece el contrato de base de datos que deberán reutilizar las futuras specs de persistencia, migración e integración con Supabase.

## Scope

**In:**

- Crear `src/schemas/schema_db.md` como fuente de verdad del esquema de datos.
- Documentar tablas PostgreSQL dentro del schema `public` y su agrupación lógica por módulos.
- Definir la tabla `daycares` y agregar `daycare_id` a todas las tablas de negocio.
- Definir enums PostgreSQL a partir de los contratos de dominio y valores soportados.
- Definir claves primarias UUID, claves foráneas, relaciones compuestas y restricciones mínimas.
- Normalizar `feed.kidIds` y `feed.media` mediante las tablas auxiliares `feed_kids` y `feed_media`.
- Especificar la lectura de los 11 archivos JSON de `src/infrastructure/persistence/json/data/`.
- Especificar la regeneración de todos los IDs y la conservación de relaciones mediante un mapa `old_id -> new_uuid`.
- Documentar la carga inicial en la guardería `Guardería Sala Soles`.
- Documentar una migración estructural y una migración de seeds separadas para Supabase CLI.
- Documentar RLS habilitado con comportamiento deny-by-default.
- Documentar la verificación de referencias, conteos y preservación de los JSON originales.

**Out of scope (for future specs):**

- Crear o aplicar migraciones SQL.
- Modificar el proyecto remoto de Supabase mediante MCP.
- Reemplazar los repositorios JSON de la aplicación.
- Reescribir, eliminar o mover los archivos JSON fuente.
- Integrar `public.people` con `auth.users` o migrar credenciales a Supabase Auth.
- Definir políticas RLS de lectura o escritura por usuario y guardería.
- Implementar el proceso de cutover de la aplicación hacia PostgreSQL.
- Agregar restricciones de negocio no presentes en los JSON o contratos actuales.

## Data model

Todas las tablas se crearán en `public`. Los módulos son agrupaciones lógicas para documentación y migraciones, no schemas PostgreSQL independientes.

### Conventions

- Todos los identificadores persistidos son `uuid` y tienen `DEFAULT gen_random_uuid()` cuando se crean en la base.
- La migración de datos genera un UUID nuevo para cada registro, incluso cuando el ID JSON original ya tiene formato UUID.
- Todas las tablas tienen `daycare_id uuid NOT NULL` y columnas `created_at timestamptz NOT NULL DEFAULT now()` y `updated_at timestamptz NOT NULL DEFAULT now()`, salvo `feed_comments.updated_at`, que es nullable para conservar `updatedAt: null`.
- Las cadenas vacías de los JSON se conservan como cadenas vacías y no se transforman a `NULL`.
- Las tablas referenciadas exponen una restricción `UNIQUE (id, daycare_id)` para permitir FKs compuestas y evitar referencias cruzadas entre guarderías.
- Las relaciones que no pueden expresarse con una FK sobre arrays se normalizan en tablas auxiliares.
- La regla de negocio de que un feed tiene una sala o uno o más niños, pero nunca ambos, se mantiene en la aplicación y no se agrega como trigger en esta spec.

### Enums

El documento debe definir estos enums PostgreSQL con los valores de los contratos de dominio:

```sql
person_role: parent, personal
person_status: active, inactive, pending
parent_relationship: mother, father, guardian
kid_status: active, inactive
post_type: food, nap, activity, achievement, mood, announcement
post_reaction_type: love
post_media_format: jpg, jpeg, png, webp
post_media_resource_type: image
post_media_delivery_type: authenticated
```

El estado `pending`, `expired` o `accepted` de una invitación se deriva de sus fechas y no se persiste como enum.

### Module `global`

#### `daycares`

| Column       | PostgreSQL type | Null/default/constraint                   |
| ------------ | --------------- | ----------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()` |
| `name`       | `text`          | NOT NULL                                  |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`                 |
| `updated_at` | `timestamptz`   | NOT NULL, default `now()`                 |

La migración inicial inserta una fila con `name = 'Guardería Sala Soles'`.

### Module `auth`

#### `people`

| Column       | PostgreSQL type | Null/default/constraint                   |
| ------------ | --------------- | ----------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()` |
| `daycare_id` | `uuid`          | NOT NULL, FK a `daycares(id)`             |
| `name`       | `text`          | NOT NULL                                  |
| `email`      | `text`          | NOT NULL                                  |
| `role`       | `person_role`   | NOT NULL                                  |
| `status`     | `person_status` | NOT NULL                                  |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`                 |
| `updated_at` | `timestamptz`   | NOT NULL, default `now()`                 |

La unicidad de email se limita a cada guardería mediante `UNIQUE (daycare_id, lower(email))`. Una misma persona puede aparecer en guarderías distintas como registros independientes.

#### `credential`

| Column          | PostgreSQL type | Null/default/constraint                           |
| --------------- | --------------- | ------------------------------------------------- |
| `id`            | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`         |
| `daycare_id`    | `uuid`          | NOT NULL, FK a `daycares(id)`                     |
| `person_id`     | `uuid`          | NOT NULL, FK compuesta a `people(id, daycare_id)` |
| `password_hash` | `text`          | NOT NULL                                          |
| `created_at`    | `timestamptz`   | NOT NULL, default `now()`                         |
| `updated_at`    | `timestamptz`   | NOT NULL, default `now()`                         |

`credential` conserva los hashes actuales y permanece separada de `auth.users`.

#### `invitation`

| Column         | PostgreSQL type       | Null/default/constraint                           |
| -------------- | --------------------- | ------------------------------------------------- |
| `id`           | `uuid`                | PK, NOT NULL, default `gen_random_uuid()`         |
| `daycare_id`   | `uuid`                | NOT NULL, FK a `daycares(id)`                     |
| `person_id`    | `uuid`                | NOT NULL, FK compuesta a `people(id, daycare_id)` |
| `kid_id`       | `uuid`                | NOT NULL, FK compuesta a `kids(id, daycare_id)`   |
| `relationship` | `parent_relationship` | NOT NULL                                          |
| `code`         | `text`                | NOT NULL                                          |
| `expires_at`   | `timestamptz`         | NOT NULL                                          |
| `sent_at`      | `timestamptz`         | NULL                                              |
| `accepted_at`  | `timestamptz`         | NULL                                              |
| `created_at`   | `timestamptz`         | NOT NULL, default `now()`                         |
| `updated_at`   | `timestamptz`         | NOT NULL, default `now()`                         |

### Module `rooms`

#### `rooms`

| Column       | PostgreSQL type | Null/default/constraint                   |
| ------------ | --------------- | ----------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()` |
| `daycare_id` | `uuid`          | NOT NULL, FK a `daycares(id)`             |
| `name`       | `text`          | NOT NULL                                  |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`                 |
| `updated_at` | `timestamptz`   | NOT NULL, default `now()`                 |

#### `staff_rooms`

| Column       | PostgreSQL type | Null/default/constraint                           |
| ------------ | --------------- | ------------------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`         |
| `daycare_id` | `uuid`          | NOT NULL, FK a `daycares(id)`                     |
| `person_id`  | `uuid`          | NOT NULL, FK compuesta a `people(id, daycare_id)` |
| `room_id`    | `uuid`          | NOT NULL, FK compuesta a `rooms(id, daycare_id)`  |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`                         |
| `updated_at` | `timestamptz`   | NOT NULL, default `now()`                         |

### Module `children`

#### `kids`

| Column            | PostgreSQL type | Null/default/constraint                          |
| ----------------- | --------------- | ------------------------------------------------ |
| `id`              | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`        |
| `daycare_id`      | `uuid`          | NOT NULL, FK a `daycares(id)`                    |
| `slug`            | `text`          | NOT NULL                                         |
| `name`            | `text`          | NOT NULL                                         |
| `birth_date`      | `date`          | NOT NULL                                         |
| `room_id`         | `uuid`          | NOT NULL, FK compuesta a `rooms(id, daycare_id)` |
| `enrollment_date` | `date`          | NOT NULL                                         |
| `medical_notes`   | `text`          | NOT NULL                                         |
| `allergies`       | `text`          | NOT NULL                                         |
| `status`          | `kid_status`    | NOT NULL                                         |
| `created_at`      | `timestamptz`   | NOT NULL, default `now()`                        |
| `updated_at`      | `timestamptz`   | NOT NULL, default `now()`                        |

#### `parent_kids`

| Column                  | PostgreSQL type       | Null/default/constraint                           |
| ----------------------- | --------------------- | ------------------------------------------------- |
| `id`                    | `uuid`                | PK, NOT NULL, default `gen_random_uuid()`         |
| `daycare_id`            | `uuid`                | NOT NULL, FK a `daycares(id)`                     |
| `parent_id`             | `uuid`                | NOT NULL, FK compuesta a `people(id, daycare_id)` |
| `kid_id`                | `uuid`                | NOT NULL, FK compuesta a `kids(id, daycare_id)`   |
| `relationship`          | `parent_relationship` | NOT NULL                                          |
| `photo_sharing_consent` | `boolean`             | NOT NULL                                          |
| `created_at`            | `timestamptz`         | NOT NULL, default `now()`                         |
| `updated_at`            | `timestamptz`         | NOT NULL, default `now()`                         |

### Module `social-media`

#### `feed`

| Column       | PostgreSQL type | Null/default/constraint                           |
| ------------ | --------------- | ------------------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`         |
| `daycare_id` | `uuid`          | NOT NULL, FK a `daycares(id)`                     |
| `type`       | `post_type`     | NOT NULL                                          |
| `author_id`  | `uuid`          | NOT NULL, FK compuesta a `people(id, daycare_id)` |
| `created_at` | `timestamptz`   | NOT NULL                                          |
| `updated_at` | `timestamptz`   | NOT NULL                                          |
| `body`       | `text`          | NOT NULL                                          |
| `room_id`    | `uuid`          | NULL, FK compuesta a `rooms(id, daycare_id)`      |

Los arrays `kidIds` y `media` no se almacenan directamente en `feed`.

#### `feed_kids`

| Column       | PostgreSQL type | Null/default/constraint                         |
| ------------ | --------------- | ----------------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`       |
| `daycare_id` | `uuid`          | NOT NULL, FK a `daycares(id)`                   |
| `feed_id`    | `uuid`          | NOT NULL, FK compuesta a `feed(id, daycare_id)` |
| `kid_id`     | `uuid`          | NOT NULL, FK compuesta a `kids(id, daycare_id)` |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`                       |
| `updated_at` | `timestamptz`   | NOT NULL, default `now()`                       |

Debe existir `UNIQUE (feed_id, kid_id)`.

#### `feed_media`

| Column          | PostgreSQL type            | Null/default/constraint                         |
| --------------- | -------------------------- | ----------------------------------------------- |
| `id`            | `uuid`                     | PK, NOT NULL, default `gen_random_uuid()`       |
| `daycare_id`    | `uuid`                     | NOT NULL, FK a `daycares(id)`                   |
| `feed_id`       | `uuid`                     | NOT NULL, FK compuesta a `feed(id, daycare_id)` |
| `position`      | `integer`                  | NOT NULL                                        |
| `public_id`     | `text`                     | NOT NULL                                        |
| `asset_id`      | `text`                     | NOT NULL                                        |
| `resource_type` | `post_media_resource_type` | NOT NULL                                        |
| `delivery_type` | `post_media_delivery_type` | NOT NULL                                        |
| `format`        | `post_media_format`        | NOT NULL                                        |
| `width`         | `integer`                  | NOT NULL                                        |
| `height`        | `integer`                  | NOT NULL                                        |
| `bytes`         | `integer`                  | NOT NULL                                        |
| `original_name` | `text`                     | NOT NULL                                        |
| `alt`           | `text`                     | NULL                                            |
| `created_at`    | `timestamptz`              | NOT NULL, default `now()`                       |
| `updated_at`    | `timestamptz`              | NOT NULL, default `now()`                       |

Debe existir `UNIQUE (feed_id, position)` y `position` conserva el orden del array `media` comenzando en cero.

#### `feed_comments`

| Column       | PostgreSQL type | Null/default/constraint                           |
| ------------ | --------------- | ------------------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`         |
| `daycare_id` | `uuid`          | NOT NULL, FK a `daycares(id)`                     |
| `feed_id`    | `uuid`          | NOT NULL, FK compuesta a `feed(id, daycare_id)`   |
| `author_id`  | `uuid`          | NOT NULL, FK compuesta a `people(id, daycare_id)` |
| `body`       | `text`          | NOT NULL                                          |
| `created_at` | `timestamptz`   | NOT NULL                                          |
| `updated_at` | `timestamptz`   | NULL                                              |

#### `feed_overview`

| Column                  | PostgreSQL type | Null/default/constraint                   |
| ----------------------- | --------------- | ----------------------------------------- |
| `id`                    | `uuid`          | PK, NOT NULL, default `gen_random_uuid()` |
| `daycare_id`            | `uuid`          | NOT NULL, FK a `daycares(id)`, UNIQUE     |
| `room_label`            | `text`          | NOT NULL                                  |
| `greeting`              | `text`          | NOT NULL                                  |
| `attendance`            | `text`          | NOT NULL                                  |
| `date`                  | `text`          | NOT NULL                                  |
| `composer_prompt`       | `text`          | NOT NULL                                  |
| `published_today_label` | `text`          | NOT NULL                                  |
| `created_at`            | `timestamptz`   | NOT NULL, default `now()`                 |
| `updated_at`            | `timestamptz`   | NOT NULL, default `now()`                 |

`feed_overview` representa la información de resumen de una guardería y tiene una fila por `daycare_id`.

#### `feed_reactions`

| Column       | PostgreSQL type      | Null/default/constraint                           |
| ------------ | -------------------- | ------------------------------------------------- |
| `id`         | `uuid`               | PK, NOT NULL, default `gen_random_uuid()`         |
| `daycare_id` | `uuid`               | NOT NULL, FK a `daycares(id)`                     |
| `feed_id`    | `uuid`               | NOT NULL, FK compuesta a `feed(id, daycare_id)`   |
| `person_id`  | `uuid`               | NOT NULL, FK compuesta a `people(id, daycare_id)` |
| `type`       | `post_reaction_type` | NOT NULL                                          |
| `created_at` | `timestamptz`        | NOT NULL                                          |
| `updated_at` | `timestamptz`        | NOT NULL, default `now()`                         |

### Referential actions and RLS

- Las raíces `daycares`, `people`, `rooms` y `kids` no se eliminan en cascada desde sus relaciones dependientes.
- Las entidades hijas y tablas puente pueden eliminarse en cascada al eliminar su entidad propietaria cuando no contradiga la regla de protección de las raíces.
- Todas las tablas `public` tienen RLS habilitado en la migración estructural.
- No se crean políticas para `anon` o `authenticated` en esta spec; el acceso queda denegado hasta una spec de autorización.
- `service_role` podrá ser utilizado por el proceso de migración y seed según las capacidades administrativas de Supabase.

## JSON source and migration mapping

La migración de seeds debe leer exactamente estos archivos desde `src/infrastructure/persistence/json/data/`:

| JSON                  | Tabla destino                     |
| --------------------- | --------------------------------- |
| `credential.json`     | `credential`                      |
| `people.json`         | `people`                          |
| `invitation.json`     | `invitation`                      |
| `rooms.json`          | `rooms`                           |
| `staff-rooms.json`    | `staff_rooms`                     |
| `kids.json`           | `kids`                            |
| `parent-kids.json`    | `parent_kids`                     |
| `feed.json`           | `feed`, `feed_kids`, `feed_media` |
| `feed-comments.json`  | `feed_comments`                   |
| `feed-overview.json`  | `feed_overview`                   |
| `feed-reactions.json` | `feed_reactions`                  |

La carga debe:

1. Leer todos los JSON antes de insertar relaciones.
2. Crear la guardería `Guardería Sala Soles`.
3. Generar un UUID nuevo por cada registro de cada JSON.
4. Mantener un mapa independiente por colección, por ejemplo `people.old_id -> people.uuid`.
5. Resolver todos los campos `personId`, `parentId`, `authorId`, `person_id`, `kidId`, `kidIds`, `roomId` y `postId` mediante esos mapas.
6. Convertir cada elemento de `feed.media` en una fila de `feed_media` y cada elemento de `feed.kidIds` en una fila de `feed_kids`.
7. Conservar fechas, contenido, hashes, cadenas vacías, valores booleanos y `NULL` existentes.
8. Usar el timestamp de carga para columnas de auditoría agregadas cuando el JSON no contiene un timestamp equivalente.
9. Ejecutarse de forma transaccional y fallar si existe una referencia no resuelta.
10. No modificar los JSON fuente.

La auditoría actual de los fixtures espera 11 colecciones, 115 registros provenientes directamente de JSON, 25 relaciones `feed_kids`, 11 registros `feed_media`, una guardería seed y cero referencias huérfanas.

## Migration architecture

La futura implementación debe usar Supabase CLI y `supabase db push`, no operaciones manuales como fuente de verdad.

Debe crear dos archivos versionados en `supabase/migrations/`:

1. Una migración estructural para extensiones, enums, tablas, índices, FKs, restricciones y RLS.
2. Una migración de seeds para insertar la guardería y los datos transformados de los JSON.

La migración de seeds debe depender de la migración estructural y conservar el orden de inserción necesario para satisfacer las FKs. El seed debe ser reproducible desde el snapshot JSON y debe documentar cómo se generaron y aplicaron los UUID nuevos sin persistir IDs antiguos.

## Implementation plan

1. Crear `src/schemas/schema_db.md` con los módulos, convenciones y tabla `daycares` acordados.
2. Documentar enums, tablas, columnas, índices, FKs compuestas, acciones referenciales y RLS.
3. Documentar la tabla única `feed_overview` por guardería y las tablas auxiliares `feed_kids` y `feed_media`.
4. Añadir la matriz completa de los 11 JSON fuente y sus tablas destino.
5. Añadir el procedimiento de regeneración UUID, resolución de referencias y preservación de datos.
6. Añadir la arquitectura de dos migraciones para Supabase CLI y el orden de ejecución con `supabase db push`.
7. Añadir los criterios de verificación de conteos, referencias, aislamiento tenant y conservación de fuentes.

## Acceptance criteria

- [ ] Existe `src/schemas/schema_db.md` y es la única fuente documental de verdad de este esquema.
- [ ] El documento define `daycares` con las columnas, defaults y restricciones solicitadas.
- [ ] El documento define exactamente los módulos lógicos `global`, `auth`, `rooms`, `children` y `social-media`.
- [ ] El documento usa nombres PostgreSQL en `snake_case` sin cambiar la identidad funcional de las colecciones.
- [ ] `rooms` pertenece únicamente al módulo `rooms`.
- [ ] Las 14 tablas documentadas incluyen `daycare_id` y relaciones tenant compatibles.
- [ ] `people` permite el mismo email en guarderías distintas y aplica unicidad por guardería usando `lower(email)`.
- [ ] Todos los IDs persistidos se especifican como UUID y la migración genera UUID nuevos incluso para IDs UUID existentes.
- [ ] Los enums incluyen todos los valores soportados por los contratos de dominio identificados.
- [ ] `feed_kids` y `feed_media` documentan FKs, UUID propios y sus restricciones de unicidad.
- [ ] `feed_overview` se relaciona uno-a-uno con `daycares` mediante `daycare_id`.
- [ ] Las FKs compuestas impiden relacionar registros de distintas guarderías.
- [ ] La exclusividad entre `room_id` y destinatarios infantiles queda documentada como regla de aplicación, sin trigger en esta spec.
- [ ] Las tablas `public` tienen RLS habilitado y no tienen políticas para clientes en esta spec.
- [ ] La matriz de migración enumera los 11 archivos JSON exactos y sus destinos.
- [ ] El procedimiento de seed conserva todas las relaciones mediante mapas `old_id -> new_uuid`.
- [ ] El procedimiento conserva strings vacíos y `feed_comments.updated_at = NULL`.
- [ ] El procedimiento no modifica los JSON fuente.
- [ ] La arquitectura especifica dos migraciones separadas: estructura y seeds.
- [ ] La arquitectura especifica `supabase db push` como mecanismo futuro de despliegue.
- [ ] La verificación documenta 115 registros JSON, 25 relaciones `feed_kids`, 11 registros `feed_media`, una guardería y cero referencias huérfanas.
- [ ] El documento no incluye implementación SQL ejecutable ni modifica Supabase.

## Decisions

- **Sí:** usar `src/schemas/schema_db.md` como fuente de verdad, porque las futuras specs necesitan un contrato estable antes de cambiar la persistencia.
- **Sí:** mantener todas las tablas en `public`, porque los módulos solicitados son agrupaciones lógicas y `auth` es un schema administrado por Supabase.
- **Sí:** usar nombres PostgreSQL en `snake_case`, porque evita identificadores con guiones entrecomillados sin cambiar el significado de las colecciones.
- **Sí:** mantener `rooms` únicamente en el módulo `rooms`, porque una tabla no debe tener dos propietarios documentales.
- **Sí:** agregar `feed_kids` y `feed_media`, porque los arrays JSON no permiten FKs por elemento.
- **Sí:** agregar `daycare_id` a todas las tablas, porque el aislamiento tenant debe estar disponible en cada relación.
- **Sí:** limitar el email por `daycare_id`, porque una persona puede registrarse en varias guarderías.
- **No:** usar `(person_id, daycare_id)` como unicidad de personas, porque `person_id` ya identifica una fila y no resuelve la unicidad del email.
- **Sí:** generar UUID nuevos para todos los registros, porque la base no debe depender de los IDs semánticos o UUID previos de los fixtures.
- **Sí:** conservar los JSON sin modificaciones, porque son el snapshot de entrada y la migración debe ser una transformación reproducible.
- **Sí:** conservar strings vacíos y timestamps nulos, porque cambiar su semántica excede el objetivo del esquema.
- **Sí:** derivar el estado de invitación desde sus fechas, porque el dominio no persiste un campo de estado.
- **Sí:** mantener `credential` separado de `auth.users`, porque la migración de Supabase Auth requiere otra decisión de seguridad y de ciclo de vida.
- **Sí:** usar dos migraciones separadas, porque permite distinguir cambios estructurales de carga de datos y facilita el despliegue con CLI.
- **No:** definir políticas RLS de negocio, porque todavía no está definido el vínculo de identidad con una persona dentro de cada guardería.
- **No:** agregar uniques de negocio no observados, porque la spec debe respetar la estructura y cardinalidad de los JSON actuales.
- **No:** agregar un trigger para la exclusividad del destino de feed, porque esta decisión quedó limitada a FKs y validación de aplicación.

## Risks

| Risk                                           | Mitigation                                                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Una relación JSON apunta a un ID inexistente.  | Resolver todas las referencias antes de insertar y abortar la transacción si falta una entrada del mapa. |
| Un seed mezcla registros de guarderías.        | Propagar el mismo `daycare_id` a cada fila y usar FKs compuestas.                                        |
| Se conserva accidentalmente un ID antiguo.     | Generar mapas nuevos por colección y verificar que ningún ID JSON aparezca como PK insertada.            |
| Los arrays de feed pierden orden o relaciones. | Usar `feed_kids` y `feed_media`, guardar `position` para media y verificar los conteos esperados.        |
| Las tablas quedan expuestas sin autorización.  | Habilitar RLS en la migración estructural y no crear políticas cliente en esta spec.                     |
| El seed deja datos parciales.                  | Ejecutar la carga en una transacción y verificar conteos y referencias después de `db push`.             |
| Los futuros contratos agregan valores de enum. | Actualizar esta fuente de verdad antes de crear migraciones que dependan del enum.                       |

## What is **not** in this spec

- Aplicar DDL o seeds al proyecto Supabase.
- Crear archivos dentro de `supabase/migrations/`.
- Cambiar los repositorios o servicios de la aplicación.
- Reescribir los JSON de `src/infrastructure/persistence/json/data/`.
- Migrar usuarios a `auth.users`.
- Crear políticas RLS de negocio.
- Implementar el cutover desde JSON hacia PostgreSQL.
- Agregar reglas de unicidad o triggers que no estén definidos en esta spec.
