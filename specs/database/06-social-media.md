# SPEC DATABASE 06 — Módulo social-media: publicaciones y engagement

> **Status:** Implemented
> **Depends on:** SPEC DATABASE 01, SPEC DATABASE 02, SPEC DATABASE 03, SPEC DATABASE 04, SPEC DATABASE 05, SPEC 26
> **Date:** 2026-10-29
> **Objective:** Crear las tablas sociales `posts`, `post_children`, `post_media`, `reactions` y `comments` con sus enums, relaciones, restricciones, índices y RLS mediante migraciones versionadas aplicadas a Supabase.

## Scope

**In:**

- Crear migraciones SQL versionadas en `src/infrastructure/persistence/migrations/`.
- Seguir el patrón imperativo existente: un archivo SQL por cambio, nombres versionados secuenciales y aplicación ordenada mediante Supabase.
- Crear los enums `post_type`, `reaction_type`, `media_resource_type`, `media_delivery_type` y `media_format`.
- Crear `public.posts` conforme al diccionario PostgreSQL del proyecto.
- Crear `public.post_children` como relación entre publicaciones y niños.
- Crear `public.post_media` para metadata autenticada de medios asociados a publicaciones.
- Crear `public.reactions` para reacciones únicas por usuario y publicación.
- Crear `public.comments` para comentarios asociados a publicaciones y autores.
- Mantener las acciones referenciales definidas en el diccionario PostgreSQL.
- Crear checks de dimensiones, bytes, posición y longitud normalizada de comentarios.
- Crear índices recomendados y los índices necesarios para las claves foráneas no cubiertas por restricciones existentes.
- Habilitar RLS en las cinco tablas sin políticas públicas iniciales.
- No insertar filas iniciales en ninguna tabla social.
- Aplicar las migraciones al proyecto Supabase configurado.
- Verificar estructura, enums, relaciones, restricciones, índices, RLS y ausencia de filas iniciales.
- Mantener intactos los archivos JSON y el runtime de la aplicación.

**Out of scope (for future specs):**

- Sembrar datos desde `feed.json`.
- Sembrar datos desde `feed-reactions.json`.
- Sembrar datos desde `feed-comments.json`.
- Migrar usuarios parent desde `people.json` para resolver autores de reacciones o comentarios.
- Migrar relaciones desde `parent-kids.json`.
- Crear filas iniciales en `posts`, `post_children`, `post_media`, `reactions` o `comments`.
- Crear `feed_overviews` o migrar `feed-overview.json`.
- Crear políticas RLS de negocio.
- Crear grants nuevos para `anon` o `authenticated`.
- Crear triggers, funciones o procedimientos para autorización, tenant isolation, destinos de publicaciones o límites de medios.
- Enforzar mediante PostgreSQL la regla cruzada de destino exclusivo entre `room_id` y `post_children`.
- Enforzar mediante PostgreSQL el máximo de cuatro medios por publicación.
- Validar mediante PostgreSQL que todas las relaciones pertenezcan al mismo `daycare_id`.
- Crear repositorios, clientes Supabase o adaptadores PostgreSQL en el runtime.
- Modificar la persistencia JSON o conectar el runtime a Supabase.
- Crear otras tablas del modelo PostgreSQL.

## Data model

### Enums

#### `post_type`

```text
food
nap
activity
achievement
mood
announcement
```

#### `reaction_type`

```text
love
```

#### `media_resource_type`

```text
image
```

#### `media_delivery_type`

```text
authenticated
```

#### `media_format`

```text
jpg
jpeg
png
webp
```

### `public.posts`

| Column                     | PostgreSQL type | Null/default/constraint                         |
| -------------------------- | --------------- | ----------------------------------------------- |
| `id`                       | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`       |
| `daycare_id`               | `uuid`          | NOT NULL, FK → `daycares.id` ON DELETE RESTRICT |
| `author_id`                | `uuid`          | NOT NULL, FK → `users.id` ON DELETE RESTRICT    |
| `room_id`                  | `uuid`          | nullable, FK → `rooms.id` ON DELETE RESTRICT    |
| `type`                     | `post_type`     | NOT NULL                                        |
| `body`                     | `text`          | NOT NULL                                        |
| `created_at`, `updated_at` | `timestamptz`   | NOT NULL                                        |

`created_at` y `updated_at` son obligatorios y no reciben default en esta spec, conforme al diccionario.

Una publicación tendrá como destino una sala o uno o más niños. La validación XOR entre `room_id` y las filas de `post_children` queda diferida a una operación transaccional futura.

### `public.post_children`

| Column     | PostgreSQL type | Null/default/constraint                                  |
| ---------- | --------------- | -------------------------------------------------------- |
| `post_id`  | `uuid`          | PK part, NOT NULL, FK → `posts.id` ON DELETE CASCADE     |
| `child_id` | `uuid`          | PK part, NOT NULL, FK → `children.id` ON DELETE RESTRICT |

La clave primaria compuesta `(post_id, child_id)` impide duplicar el mismo destino infantil.

### `public.post_media`

| Column          | PostgreSQL type       | Null/default/constraint                                |
| --------------- | --------------------- | ------------------------------------------------------ |
| `id`            | `uuid`                | PK, NOT NULL, default `gen_random_uuid()`              |
| `post_id`       | `uuid`                | NOT NULL, FK → `posts.id` ON DELETE CASCADE            |
| `asset_id`      | `text`                | NOT NULL                                               |
| `public_id`     | `text`                | NOT NULL                                               |
| `original_name` | `text`                | NOT NULL                                               |
| `resource_type` | `media_resource_type` | NOT NULL, default `image`                              |
| `delivery_type` | `media_delivery_type` | NOT NULL, default `authenticated`                      |
| `format`        | `media_format`        | NOT NULL                                               |
| `width`         | `integer`             | NOT NULL, CHECK `> 0`                                  |
| `height`        | `integer`             | NOT NULL, CHECK `> 0`                                  |
| `bytes`         | `integer`             | NOT NULL, CHECK `> 0`                                  |
| `position`      | `integer`             | NOT NULL, CHECK `>= 0`, UNIQUE (`post_id`, `position`) |
| `alt`           | `text`                | nullable                                               |
| `url`           | `text`                | nullable                                               |
| `created_at`    | `timestamptz`         | NOT NULL, default `now()`                              |

`url` es opcional porque la entrega autenticada no depende de una URL pública. El máximo de cuatro medios por publicación queda documentado para enforcement transaccional futuro.

### `public.reactions`

| Column       | PostgreSQL type | Null/default/constraint                     |
| ------------ | --------------- | ------------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`   |
| `post_id`    | `uuid`          | NOT NULL, FK → `posts.id` ON DELETE CASCADE |
| `user_id`    | `uuid`          | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `type`       | `reaction_type` | NOT NULL, default `love`                    |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`                   |

La restricción única `(post_id, user_id)` impone una reacción por usuario y publicación.

### `public.comments`

| Column       | PostgreSQL type | Null/default/constraint                     |
| ------------ | --------------- | ------------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`   |
| `post_id`    | `uuid`          | NOT NULL, FK → `posts.id` ON DELETE CASCADE |
| `author_id`  | `uuid`          | NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `body`       | `text`          | NOT NULL, CHECK normalized length 1–500     |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`                   |
| `updated_at` | `timestamptz`   | nullable                                    |

El check de `body` debe validar la longitud normalizada, excluyendo espacios iniciales y finales, en el rango de 1 a 500 caracteres.

### Índices

Se crearán los índices recomendados y los necesarios para cubrir las FKs no cubiertas por claves primarias o únicas:

- `posts(daycare_id, created_at desc)`.
- `posts(author_id)`.
- `posts(room_id)`.
- `post_children(child_id, post_id)`.
- `post_media(post_id, position)`.
- `reactions(post_id, created_at desc)`.
- `reactions(user_id)`.
- `comments(post_id, created_at desc)`.
- `comments(author_id)`.

Las restricciones primarias y únicas cubrirán los índices de `id`, `(post_id, child_id)`, `(post_id, position)` y `(post_id, user_id)`.

## Implementation plan

1. Crear `20261029000025_create_social_media_enums.sql` con `post_type`, `reaction_type`, `media_resource_type`, `media_delivery_type` y `media_format`.
2. Crear `20261029000026_create_posts.sql` con `public.posts`, sus defaults, FKs y columnas de auditoría.
3. Crear `20261029000027_enable_posts_rls.sql` y habilitar RLS sin políticas públicas.
4. Crear `20261029000028_create_post_children.sql` con la relación compuesta, FKs y acciones referenciales.
5. Crear `20261029000029_enable_post_children_rls.sql` y habilitar RLS sin políticas públicas.
6. Crear `20261029000030_create_post_media.sql` con metadata de medios, defaults, checks y unicidad de posición por publicación.
7. Crear `20261029000031_enable_post_media_rls.sql` y habilitar RLS sin políticas públicas.
8. Crear `20261029000032_create_reactions.sql` con la tabla, defaults, FKs y unicidad por publicación y usuario.
9. Crear `20261029000033_enable_reactions_rls.sql` y habilitar RLS sin políticas públicas.
10. Crear `20261029000034_create_comments.sql` con la tabla, FKs y check de longitud normalizada.
11. Crear `20261029000035_enable_comments_rls.sql` y habilitar RLS sin políticas públicas.
12. Crear `20261029000036_create_social_media_indexes.sql` con los índices de consulta y de claves foráneas definidos.
13. Revisar que las migraciones no contengan inserts, seeds JSON, grants públicos, funciones, triggers o jobs.
14. Consultar el historial remoto y el catálogo de tablas antes de aplicar los scripts para confirmar que no existan colisiones.
15. Aplicar las migraciones versionadas en orden al proyecto Supabase configurado.
16. Verificar enums, columnas, defaults, checks, unicidad, FKs, acciones referenciales, índices, RLS y ausencia de políticas.
17. Confirmar que las cinco tablas no contienen filas iniciales.
18. Ejecutar advisors de seguridad y rendimiento y revisar especialmente FKs sin índices y RLS sin políticas.
19. Confirmar que no se modificaron los JSON ni el runtime de la aplicación.

## Acceptance criteria

- [x] Existe `20261029000025_create_social_media_enums.sql`.
- [x] Existe `20261029000026_create_posts.sql`.
- [x] Existe `20261029000027_enable_posts_rls.sql`.
- [x] Existe `20261029000028_create_post_children.sql`.
- [x] Existe `20261029000029_enable_post_children_rls.sql`.
- [x] Existe `20261029000030_create_post_media.sql`.
- [x] Existe `20261029000031_enable_post_media_rls.sql`.
- [x] Existe `20261029000032_create_reactions.sql`.
- [x] Existe `20261029000033_enable_reactions_rls.sql`.
- [x] Existe `20261029000034_create_comments.sql`.
- [x] Existe `20261029000035_enable_comments_rls.sql`.
- [x] Existe `20261029000036_create_social_media_indexes.sql`.
- [x] Existe `post_type` con `food`, `nap`, `activity`, `achievement`, `mood` y `announcement`.
- [x] Existe `reaction_type` con `love`.
- [x] Existe `media_resource_type` con `image`.
- [x] Existe `media_delivery_type` con `authenticated`.
- [x] Existe `media_format` con `jpg`, `jpeg`, `png` y `webp`.
- [x] `public.posts` existe con las columnas especificadas.
- [x] `posts.id` es UUID con default `gen_random_uuid()`.
- [x] `posts.daycare_id` referencia `daycares.id` con `ON DELETE RESTRICT`.
- [x] `posts.author_id` referencia `users.id` con `ON DELETE RESTRICT`.
- [x] `posts.room_id` referencia `rooms.id` con `ON DELETE RESTRICT` y acepta `NULL`.
- [x] `posts.type` usa `post_type`.
- [x] `posts.created_at` y `posts.updated_at` son obligatorios sin default.
- [x] `public.post_children` existe con la PK compuesta `(post_id, child_id)`.
- [x] `post_children.post_id` referencia `posts.id` con `ON DELETE CASCADE`.
- [x] `post_children.child_id` referencia `children.id` con `ON DELETE RESTRICT`.
- [x] `public.post_media` existe con las columnas especificadas.
- [x] `post_media.post_id` referencia `posts.id` con `ON DELETE CASCADE`.
- [x] `post_media.resource_type` usa `media_resource_type` y tiene default `image`.
- [x] `post_media.delivery_type` usa `media_delivery_type` y tiene default `authenticated`.
- [x] `post_media.format` usa `media_format`.
- [x] `post_media.width`, `height` y `bytes` rechazan valores menores o iguales a cero.
- [x] `post_media.position` rechaza valores negativos.
- [x] `(post_media.post_id, post_media.position)` es único.
- [x] `public.reactions` existe con las columnas especificadas.
- [x] `reactions.post_id` referencia `posts.id` con `ON DELETE CASCADE`.
- [x] `reactions.user_id` referencia `users.id` con `ON DELETE CASCADE`.
- [x] `reactions.type` usa `reaction_type` y tiene default `love`.
- [x] `(reactions.post_id, reactions.user_id)` es único.
- [x] `public.comments` existe con las columnas especificadas.
- [x] `comments.post_id` referencia `posts.id` con `ON DELETE CASCADE`.
- [x] `comments.author_id` referencia `users.id` con `ON DELETE CASCADE`.
- [x] `comments.body` rechaza texto cuya longitud normalizada no esté entre 1 y 500.
- [x] RLS está habilitado en `posts`, `post_children`, `post_media`, `reactions` y `comments`.
- [x] No existen políticas públicas permisivas en las cinco tablas.
- [x] Existen los índices de publicaciones, destinos, medios, reacciones y comentarios definidos en la spec.
- [x] Toda FK no cubierta por una PK o restricción única tiene un índice adecuado.
- [x] No se insertan filas iniciales en ninguna tabla social.
- [x] No se migran filas desde `feed.json`.
- [x] No se migran filas desde `feed-reactions.json`.
- [x] No se migran filas desde `feed-comments.json`.
- [x] No se crean usuarios parent para resolver autores de engagement.
- [x] No se crean triggers, funciones ni jobs para enforcement de invariantes cruzadas.
- [x] No se conceden grants nuevos a `anon` o `authenticated`.
- [x] No se modifican los JSON existentes.
- [x] No se modifica el runtime de la aplicación.
- [x] Las migraciones aplicadas aparecen en el historial remoto de Supabase.
- [x] Los advisors no reportan nuevas FKs sin índices.

## Decisions

- **Sí:** crear cinco tablas independientes para publicaciones, destinos infantiles, medios, reacciones y comentarios.
- **Sí:** crear los cinco enums definidos por el diccionario PostgreSQL.
- **Sí:** seguir el patrón imperativo con una migración por cambio y por tabla.
- **Sí:** usar UUID generados por PostgreSQL para las entidades con identificador propio.
- **Sí:** mantener `post_children` como relación many-to-many con PK compuesta.
- **Sí:** usar `ON DELETE CASCADE` para datos dependientes del post y para autores de engagement, conforme al diccionario.
- **Sí:** usar `ON DELETE RESTRICT` para la pertenencia de posts y destinos a guardería, salas y niños.
- **Sí:** indexar todas las FKs no cubiertas por PK o UNIQUE.
- **Sí:** habilitar RLS sin políticas iniciales, porque aún no están implementados claims confiables y políticas de negocio.
- **Sí:** mantener timestamps de `posts` sin default, siguiendo exactamente el diccionario.
- **Sí:** mantener checks de fila para dimensiones, bytes, posición y longitud de comentarios.
- **No:** sembrar `posts`, `post_children`, `post_media`, `reactions` o `comments` desde JSON.
- **No:** migrar usuarios parent solo para satisfacer FKs de engagement.
- **No:** crear `feed_overviews` en esta spec.
- **No:** crear triggers o funciones para imponer el destino XOR de los posts.
- **No:** crear triggers o funciones para imponer el máximo de cuatro medios.
- **No:** imponer todavía la pertenencia común a `daycare_id` mediante triggers, claves compuestas o procedimientos.
- **No:** crear políticas RLS de negocio o grants para clientes.
- **No:** modificar JSON, runtime, repositorios o adaptadores.

## Risks

| Risk                                                                         | Mitigation                                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Las tablas permanecen sin políticas RLS y no son accesibles desde clientes.  | Es intencional hasta definir claims confiables y políticas de negocio en una spec posterior.  |
| Una publicación puede quedar sin destino o con sala y niños simultáneamente. | Documentar la regla XOR y diferir su enforcement a una operación transaccional futura.        |
| Una publicación puede superar cuatro medios.                                 | Mantener la validación como responsabilidad de una operación transaccional futura.            |
| Una FK puede cruzar guarderías.                                              | Documentar la validación tenant como requisito futuro; las FKs individuales no la garantizan. |
| Los JSON contienen autores y referencias que no existen en Supabase.         | No ejecutar seeds ni crear usuarios implícitos en esta spec.                                  |
| Una migración puede colisionar con el historial remoto.                      | Consultar el historial y el catálogo remoto antes de aplicar los scripts.                     |
| Los índices pueden parecer no usados con tablas vacías.                      | Verificar su existencia estructuralmente y no interpretar la ausencia de uso como fallo.      |

## What is **not** in this spec

- Seeds desde `feed.json`, `feed-reactions.json` o `feed-comments.json`.
- Migración de `people.json`, `parent-kids.json` o cualquier otro JSON.
- Creación de usuarios parent para reacciones o comentarios.
- `feed_overviews` y `feed-overview.json`.
- Políticas RLS de negocio.
- Grants nuevos a `anon` o `authenticated`.
- Triggers, funciones o jobs de autorización.
- Enforcement de destino XOR de las publicaciones.
- Enforcement del máximo de cuatro medios.
- Validación transaccional completa de tenant.
- Repositorios, clientes o adaptadores Supabase.
- Cambios en la persistencia JSON.
- Cambios en el runtime de la aplicación.
- Otras tablas del modelo PostgreSQL.
