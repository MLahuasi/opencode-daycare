# SPEC DATABASE 02 — Esquema y seeds del módulo social-media

> **Status:** Approved
> **Depends on:** SPEC DATABASE 01, SPEC 26
> **Date:** 2026-10-30
> **Objective:** Crear, poblar y verificar en Supabase las tablas del módulo `social-media` mediante exactamente dos migraciones, sin modificar el runtime JSON existente.

## Why this spec exists

El módulo `social-media` ya está implementado en dominio, aplicación, presentación y fixtures JSON, pero todavía no existe en la persistencia PostgreSQL creada por SPEC DATABASE 01. Esta spec completa únicamente esa parte pendiente.

## Scope

**In:**

- Crear exactamente dos scripts SQL versionados en `src/infrastructure/persistence/migrations/`.
- Seguir el patrón imperativo existente y aplicar las migraciones mediante el flujo versionado de Supabase.
- Crear los enums `post_type`, `post_reaction_type`, `post_media_format`, `post_media_resource_type` y `post_media_delivery_type`.
- Crear `public.feed`, `public.feed_kids`, `public.feed_media`, `public.feed_comments`, `public.feed_overview` y `public.feed_reactions`.
- Crear UUID, claves primarias, columnas de auditoría, índices, restricciones únicas y FKs compuestas con `daycare_id` según `schema_db.md`.
- Habilitar RLS en las seis tablas sin crear políticas ni grants para `anon` o `authenticated`.
- Crear un seed transaccional e idempotente para `Guardería Sala Soles` usando exactamente estos archivos:
  - `feed.json` → `feed`, `feed_kids` y `feed_media`.
  - `feed-comments.json` → `feed_comments`.
  - `feed-overview.json` → `feed_overview`.
  - `feed-reactions.json` → `feed_reactions`.
- Generar un UUID nuevo para cada registro persistido, incluidos los IDs fuente que ya tienen formato UUID.
- Resolver autores, destinatarios, salas, publicaciones y personas mediante mapas de IDs fuente a UUID nuevos.
- Preservar contenido, timestamps, valores `NULL`, metadatos de media y orden cero-based de `media`.
- Aplicar y verificar las migraciones en el proyecto Supabase remoto configurado.
- Mantener sin cambios el runtime y los JSON fuente.

**Out of scope (for future specs):**

- Reemplazar los repositorios JSON de la aplicación por repositorios Supabase.
- Modificar dominio, casos de uso, componentes, rutas o Server Actions existentes.
- Crear políticas RLS de negocio o grants para clientes.
- Integrar `people` con `auth.users`.
- Crear nuevas capacidades de publicaciones, comentarios, reacciones o moderación.
- Crear triggers para validar que una publicación tenga sala o niños, pero no ambos.
- Modificar, normalizar manualmente o eliminar cualquiera de los JSON fuente.

## Data model

Todas las tablas pertenecen a `public`. Cada tabla tiene una PK UUID con `DEFAULT gen_random_uuid()` y un `daycare_id uuid NOT NULL`, además de `created_at` y `updated_at` como `timestamptz`. Las excepciones documentadas son `feed_comments.updated_at`, que es nullable, y los timestamps canónicos de `feed`, `feed_comments` y `feed_reactions`, que provienen del JSON.

### Enums

- `post_type`: `food`, `nap`, `activity`, `achievement`, `mood`, `announcement`.
- `post_reaction_type`: `love`.
- `post_media_format`: `jpg`, `jpeg`, `png`, `webp`.
- `post_media_resource_type`: `image`.
- `post_media_delivery_type`: `authenticated`.

### `public.feed`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL` con FK a `daycares(id)`.
- `type post_type NOT NULL`.
- `author_id uuid NOT NULL` con FK compuesta a `people(id, daycare_id)`.
- `created_at timestamptz NOT NULL`.
- `updated_at timestamptz NOT NULL`.
- `body text NOT NULL`.
- `room_id uuid NULL` con FK compuesta a `rooms(id, daycare_id)`.
- Restricción `UNIQUE (id, daycare_id)` para FKs compuestas dependientes.

Los arrays `kidIds` y `media` no se almacenan directamente en esta tabla.

### `public.feed_kids`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL` con FK a `daycares(id)`.
- `feed_id uuid NOT NULL` con FK compuesta a `feed(id, daycare_id)`.
- `kid_id uuid NOT NULL` con FK compuesta a `kids(id, daycare_id)`.
- `created_at timestamptz NOT NULL DEFAULT now()`.
- `updated_at timestamptz NOT NULL DEFAULT now()`.
- `UNIQUE (feed_id, kid_id)`.

Cada elemento de `feed.kidIds` produce una fila.

### `public.feed_media`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL` con FK a `daycares(id)`.
- `feed_id uuid NOT NULL` con FK compuesta a `feed(id, daycare_id)`.
- `position integer NOT NULL`.
- `public_id text NOT NULL`.
- `asset_id text NOT NULL`.
- `resource_type post_media_resource_type NOT NULL`.
- `delivery_type post_media_delivery_type NOT NULL`.
- `format post_media_format NOT NULL`.
- `width integer NOT NULL`.
- `height integer NOT NULL`.
- `bytes integer NOT NULL`.
- `original_name text NOT NULL`.
- `alt text NULL`.
- `created_at timestamptz NOT NULL DEFAULT now()`.
- `updated_at timestamptz NOT NULL DEFAULT now()`.
- `UNIQUE (feed_id, position)`.

Cada elemento de `feed.media` produce una fila y conserva su posición comenzando en cero.

### `public.feed_comments`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL` con FK a `daycares(id)`.
- `feed_id uuid NOT NULL` con FK compuesta a `feed(id, daycare_id)`.
- `author_id uuid NOT NULL` con FK compuesta a `people(id, daycare_id)`.
- `body text NOT NULL`.
- `created_at timestamptz NOT NULL`.
- `updated_at timestamptz NULL`.

`updated_at` conserva `updatedAt: null` del fixture.

### `public.feed_overview`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL UNIQUE` con FK a `daycares(id)`.
- `room_label text NOT NULL`.
- `greeting text NOT NULL`.
- `attendance text NOT NULL`.
- `date text NOT NULL`.
- `composer_prompt text NOT NULL`.
- `published_today_label text NOT NULL`.
- `created_at timestamptz NOT NULL DEFAULT now()`.
- `updated_at timestamptz NOT NULL DEFAULT now()`.

Existe como máximo una fila de resumen por guardería.

### `public.feed_reactions`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL` con FK a `daycares(id)`.
- `feed_id uuid NOT NULL` con FK compuesta a `feed(id, daycare_id)`.
- `person_id uuid NOT NULL` con FK compuesta a `people(id, daycare_id)`.
- `type post_reaction_type NOT NULL`.
- `created_at timestamptz NOT NULL`.
- `updated_at timestamptz NOT NULL DEFAULT now()`.

## JSON source and migration mapping

La migración debe leer exactamente estos cuatro archivos y resolver las relaciones con los mapas generados por SPEC DATABASE 01:

| JSON                  | Destino                           | Registros esperados |
| --------------------- | --------------------------------- | ------------------: |
| `feed.json`           | `feed`, `feed_kids`, `feed_media` |           8, 25, 11 |
| `feed-comments.json`  | `feed_comments`                   |                  20 |
| `feed-overview.json`  | `feed_overview`                   |                   1 |
| `feed-reactions.json` | `feed_reactions`                  |                  18 |

Las referencias se resuelven así:

- `feed.authorId` → `people`.
- `feed.roomId` → `rooms`.
- `feed.kidIds[]` → `feed_kids` y `kids`.
- `feed.media[]` → `feed_media`.
- `feed-comments.postId` → `feed`.
- `feed-comments.authorId` → `people`.
- `feed-reactions.postId` → `feed`.
- `feed-reactions.personId` → `people`.

La carga debe:

1. Localizar o crear de forma idempotente `Guardería Sala Soles`.
2. Leer los cuatro JSON antes de insertar registros dependientes.
3. Generar UUID nuevos para publicaciones, media, comentarios, reacciones y resumen.
4. Usar mapas independientes para `feed`, `feed_media`, `feed_comments`, `feed_reactions` y las referencias existentes de personas, niños y salas.
5. Abortar la transacción si alguna referencia no puede resolverse.
6. Insertar primero `feed` y después `feed_kids`, `feed_media`, comentarios y reacciones.
7. Preservar los 8 posts, 20 comentarios, 18 reacciones, 1 overview, 25 destinatarios y 11 media.
8. Verificar ausencia de huérfanos antes de confirmar la transacción.

## Migration files

La implementación debe crear dos archivos posteriores a las migraciones existentes y sin colisiones con el historial remoto:

1. `<version>_create_social_media_schema.sql`:
   - Crea los cinco enums.
   - Crea las seis tablas en orden de dependencia.
   - Crea PK, restricciones `UNIQUE (id, daycare_id)`, índices y FKs compuestas.
   - Habilita RLS en las seis tablas.
   - Revoca acceso cliente sin crear políticas.

2. `<version>_seed_social_media_json.sql`:
   - Ejecuta la carga dentro de una transacción.
   - Resuelve referencias mediante mapas UUID.
   - Normaliza `kidIds` y `media`.
   - Es idempotente sin duplicar registros ni cambiar UUID existentes.
   - Verifica conteos, referencias, aislamiento por `daycare_id` y ausencia de huérfanos.

## Implementation plan

1. Consultar migraciones, tablas, enums, índices, restricciones, RLS y advisors de Supabase para confirmar que `social-media` continúa ausente y que no existe colisión de versiones.
2. Crear la migración estructural con los cinco enums, seis tablas, restricciones, índices, FKs compuestas y RLS.
3. Crear la migración de seed para los cuatro JSON, reutilizando la guardería, personas, niños y salas creados por SPEC DATABASE 01.
4. Revisar que todos los IDs fuente se transformen en UUID nuevos y que ninguna relación cruce `daycare_id`.
5. Aplicar ambas migraciones mediante el flujo versionado del proyecto y `supabase db push`.
6. Verificar en Supabase columnas, defaults, enums, PK, FKs, índices, restricciones únicas, RLS y ausencia de políticas cliente.
7. Verificar los conteos 8/20/18/1/25/11, las referencias y la preservación de `NULL` y del orden de media.
8. Ejecutar nuevamente el seed en una verificación controlada y confirmar idempotencia, UUID estables y ausencia de duplicados.
9. Ejecutar advisors de seguridad y rendimiento, documentando los avisos esperados por RLS sin políticas y cualquier índice no utilizado.
10. Confirmar que los cuatro JSON, el runtime y el estado funcional previo no fueron modificados.

## Acceptance criteria

- [ ] Existen exactamente dos migraciones nuevas versionadas en `src/infrastructure/persistence/migrations/`.
- [ ] Las versiones nuevas no colisionan con migraciones locales ni remotas.
- [ ] Existen los cinco enums con exactamente los valores definidos en `schema_db.md`.
- [ ] Existen exactamente las seis tablas `feed`, `feed_kids`, `feed_media`, `feed_comments`, `feed_overview` y `feed_reactions`.
- [ ] Cada tabla tiene PK UUID, `daycare_id NOT NULL` y columnas de auditoría según el contrato.
- [ ] Las FKs entre tablas del módulo incluyen `daycare_id`.
- [ ] `feed_kids` aplica `UNIQUE (feed_id, kid_id)`.
- [ ] `feed_media` aplica `UNIQUE (feed_id, position)` y conserva posiciones zero-based.
- [ ] `feed_overview` aplica unicidad sobre `daycare_id`.
- [ ] `feed_comments.updated_at` permite `NULL`.
- [ ] RLS está habilitado en las seis tablas.
- [ ] No existen políticas ni grants nuevos para `anon` o `authenticated`.
- [ ] El seed usa exactamente los cuatro JSON definidos y no modifica sus contenidos.
- [ ] El seed crea o reutiliza exactamente una guardería llamada `Guardería Sala Soles`.
- [ ] El seed genera UUID nuevos para todos los registros sociales.
- [ ] Ningún ID fuente queda persistido como PK o FK.
- [ ] El seed crea 8 filas `feed`, 25 `feed_kids`, 11 `feed_media`, 20 `feed_comments`, 1 `feed_overview` y 18 `feed_reactions`.
- [ ] Todas las referencias a personas, niños, salas y publicaciones se resuelven correctamente.
- [ ] El seed falla y revierte la transacción ante una referencia no resuelta.
- [ ] El seed es idempotente y conserva UUID existentes al repetirse.
- [ ] No existen relaciones huérfanas ni referencias entre guarderías.
- [ ] Se conserva `feed_comments.updated_at = NULL` cuando el JSON lo indica.
- [ ] Se conserva el orden zero-based de todos los elementos de media.
- [ ] Las migraciones aparecen aplicadas en el historial remoto de Supabase.
- [ ] Los advisors se revisan y no reportan una exposición cliente no intencionada ni FKs sociales sin índices requeridos.
- [ ] `git diff --check` termina correctamente.
- [ ] Los JSON fuente permanecen byte a byte sin modificaciones.
- [ ] El runtime de la aplicación no cambia.

## Decisions taken and discarded

- **Sí:** limitar la spec a la persistencia PostgreSQL, porque el dominio, la aplicación, la presentación y los fixtures sociales ya están implementados.
- **Sí:** usar `schema_db.md` como fuente de verdad, porque las specs históricas contienen modelos anteriores y nombres legacy.
- **Sí:** crear exactamente dos migraciones, porque conserva la separación entre estructura y seed establecida por SPEC DATABASE 01.
- **Sí:** normalizar `kidIds` y `media`, porque las relaciones de arrays requieren FKs por elemento y el orden de media debe preservarse.
- **Sí:** generar UUID nuevos, porque los IDs JSON son claves de migración y no deben convertirse en IDs persistidos.
- **Sí:** aplicar y verificar en Supabase remoto, porque la feature completa requiere comprobar el esquema y los datos reales.
- **Sí:** habilitar RLS sin políticas, porque la autorización de identidad y guardería pertenece a una spec posterior.
- **No:** cambiar repositorios JSON o hacer cutover runtime, porque no forma parte de la persistencia estructural solicitada.
- **No:** crear políticas RLS de negocio, porque todavía no está definido el vínculo entre `auth.users` y `people`.
- **No:** agregar triggers para exclusividad entre sala y niños, porque `schema_db.md` deja esa regla en validación de aplicación.
- **No:** modificar los JSON fuente, porque son el snapshot reproducible de entrada.

## Risks

| Risk                                                        | Mitigation                                                                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Una referencia de feed apunta a un ID inexistente.          | Resolver todos los mapas antes de insertar y abortar la transacción ante cualquier ausencia.                    |
| Se mezclan filas de distintas guarderías.                   | Propagar un único `daycare_id` y usar FKs compuestas en todas las relaciones internas.                          |
| Se pierde el orden de las imágenes.                         | Insertar `feed_media.position` con el índice zero-based del array original y verificarlo.                       |
| El seed duplica publicaciones o engagement.                 | Usar claves funcionales deterministas para upsert y verificar conteos e UUID estables en una segunda ejecución. |
| RLS deja avisos de seguridad.                               | Mantener el deny-by-default intencional y documentar los avisos hasta que exista la spec de autorización.       |
| La migración estructural queda desacoplada del seed previo. | Verificar primero las tablas y mapas de `people`, `kids`, `rooms` y `daycares` creados por SPEC DATABASE 01.    |

## What is **not** in this spec

- Sustituir la persistencia JSON del runtime.
- Crear repositorios, adapters o clientes Supabase para la aplicación.
- Modificar UI, rutas, dominio, casos de uso o Server Actions.
- Crear políticas RLS de negocio o integrar `auth.users`.
- Modificar los cuatro JSON fuente.
- Crear triggers de autorización o de exclusividad de destinos.
- Añadir nuevas funciones de social media.
