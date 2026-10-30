# SPEC DATABASE 07 — Módulo social-media: `feed_overviews`

> **Status:** Implemented
> **Depends on:** SPEC DATABASE 01, SPEC DATABASE 03, SPEC DATABASE 06, SPEC 26
> **Date:** 2026-10-29
> **Objective:** Crear y sembrar la tabla `feed_overviews` mediante una migración versionada, idempotente y aplicada al proyecto Supabase configurado.

## Why this spec exists

La tabla `feed_overviews` quedó fuera de SPEC DATABASE 06 aunque forma parte del modelo social-media definido en SPEC 26. Esta spec completa esa proyección persistida sin recrear las tablas sociales ni sus enums ya aplicados.

## Scope

**In:**

- Crear una migración SQL versionada en `src/infrastructure/persistence/migrations/`.
- Seguir el patrón imperativo existente con la versión `20261029000037`.
- Crear `public.feed_overviews` conforme al diccionario PostgreSQL del proyecto.
- Crear las relaciones con `daycares` y `rooms`.
- Crear el check `attendance_count >= 0`.
- Crear una restricción única por guardería, sala y fecha tratando los valores `NULL` de `room_id` como iguales.
- Crear los índices necesarios para consultas por guardería/fecha y sala.
- Habilitar RLS sin políticas de negocio iniciales.
- Sembrar la fila actual de `feed-overview.json` con valores normalizados en inglés.
- Persistir también literalmente los valores visibles originales del JSON.
- Hacer que el seed sea idempotente y actualice los valores existentes sin cambiar su UUID.
- Aplicar la migración al proyecto Supabase configurado.
- Verificar estructura, relaciones, checks, unicidad, índices, RLS, seed, idempotencia e historial remoto.
- Ejecutar los advisors de seguridad y rendimiento de Supabase.
- Mantener intactos el runtime y los JSON existentes.

**Out of scope (for future specs):**

- Recrear o modificar `posts`, `post_children`, `post_media`, `reactions` o `comments`.
- Crear o modificar enums sociales existentes.
- Sembrar `feed.json`, `feed-reactions.json` o `feed-comments.json`.
- Migrar usuarios parent desde `people.json`.
- Migrar relaciones desde `parent-kids.json`.
- Crear políticas RLS de negocio.
- Crear grants nuevos para `anon` o `authenticated`.
- Crear triggers, funciones, jobs o procedimientos de autorización.
- Conectar el runtime a Supabase.
- Modificar `feed-overview.json` u otros fixtures JSON.
- Crear tablas `daily_summaries` o `devices`.

## Data model

### `public.feed_overviews`

| Column                  | PostgreSQL type | Null/default/constraint                         |
| ----------------------- | --------------- | ----------------------------------------------- |
| `id`                    | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`       |
| `daycare_id`            | `uuid`          | NOT NULL, FK → `daycares.id` ON DELETE RESTRICT |
| `room_id`               | `uuid`          | nullable, FK → `rooms.id` ON DELETE RESTRICT    |
| `attendance_count`      | `integer`       | NOT NULL, CHECK `>= 0`                          |
| `date`                  | `date`          | NOT NULL                                        |
| `room_label`            | `text`          | NOT NULL                                        |
| `greeting`              | `text`          | NOT NULL                                        |
| `attendance`            | `text`          | NOT NULL                                        |
| `display_date`          | `text`          | NOT NULL                                        |
| `composer_prompt`       | `text`          | NOT NULL                                        |
| `published_today_label` | `text`          | NOT NULL                                        |
| `created_at`            | `timestamptz`   | NOT NULL, default `now()`                       |
| `updated_at`            | `timestamptz`   | NOT NULL, default `now()`                       |

La restricción única debe usar `UNIQUE NULLS NOT DISTINCT (daycare_id, room_id, date)` para impedir más de una proyección general por guardería y fecha cuando `room_id` sea `NULL`. PostgreSQL remoto usa la versión 17.11 y soporta esta sintaxis.

### Relaciones

- `feed_overviews.daycare_id` referencia `public.daycares(id)` con `ON DELETE RESTRICT`.
- `feed_overviews.room_id` referencia `public.rooms(id)` con `ON DELETE RESTRICT`.
- La validación de que `room_id` pertenezca al mismo `daycare_id` queda documentada como responsabilidad futura de la capa transaccional o de una restricción compuesta.

### Normalización de `feed-overview.json`

La única fila actual se normaliza así:

| JSON key     | Valor persistido                        |
| ------------ | --------------------------------------- |
| `roomLabel`  | `room_label = 'Guardería · Sala Soles'` |
| `attendance` | `attendance_count = 12`                 |
| `date`       | `date = '2026-06-17'`                   |

La fila se relaciona con la guardería `Guardería Sala Soles`, ubicada en `Av. Principal 123, Centro`, y con la sala `Soles`.

Los textos visibles originales también se persisten literalmente para conservar el contenido funcional actual del JSON.

```text
room_label = 'Guardería · Sala Soles'
greeting = 'Buenas, Caro'
attendance = '12 niños'
display_date = 'martes 17 jun'
composer_prompt = 'Comparte un momento…'
published_today_label = 'Publicado hoy'
```

## Migration contract

La implementación inicial creó este archivo:

```text
src/infrastructure/persistence/migrations/20261029000037_create_and_seed_feed_overviews.sql
```

El archivo contendrá, en este orden:

1. Creación de `public.feed_overviews` con columnas, defaults, claves foráneas y checks.
2. Restricción única `NULLS NOT DISTINCT` para guardería, sala y fecha.
3. Habilitación de RLS sin políticas.
4. Índice `feed_overviews_daycare_date_idx` sobre `(daycare_id, date DESC)`.
5. Índice `feed_overviews_room_id_idx` sobre `(room_id)`.
6. Bloque transaccional de seed que:
   - falla explícitamente si falta la guardería esperada;
   - falla explícitamente si falta la sala `Soles`;
   - inserta o actualiza la fila por `(daycare_id, room_id, date)`;
   - conserva el UUID existente en conflictos;
   - actualiza el contador, la sala y `updated_at`;
   - no crea filas duplicadas al repetirse.

No se usarán IDs legacy del JSON como identificadores de la tabla.

La corrección posterior se implementa mediante:

```text
src/infrastructure/persistence/migrations/20261029000038_add_feed_overview_display_values.sql
```

## Implementation plan

1. Crear `specs/database/07-feed-overviews.md` con el contrato de esta entrega.
2. Consultar nuevamente el historial remoto y el catálogo de Supabase para confirmar que no existe la versión `20261029000037` ni la tabla `feed_overviews`.
3. Crear `20261029000037_create_and_seed_feed_overviews.sql` siguiendo el patrón imperativo de las migraciones actuales.
4. Revisar que la migración no cree enums, no modifique tablas sociales existentes, no agregue grants ni cambie JSON o runtime.
5. Aplicar la migración versionada al proyecto Supabase configurado.
6. Verificar columnas, tipos, defaults, FKs, acciones referenciales, check, unicidad `NULLS NOT DISTINCT`, índices y RLS.
7. Verificar que no existen políticas públicas permisivas en `feed_overviews`.
8. Verificar que existe una sola fila normalizada para la guardería, la sala `Soles` y la fecha `2026-06-17`.
9. Ejecutar nuevamente el seed de forma controlada y confirmar que no duplica filas ni cambia el UUID existente.
10. Ejecutar advisors de seguridad y rendimiento y revisar especialmente RLS, índices de FKs y exposición del Data API.
11. Confirmar que no se modificaron los fixtures JSON ni el runtime de la aplicación.
12. Crear la migración correctiva `20261029000038_add_feed_overview_display_values.sql`.
13. Agregar y poblar las columnas de presentación literal sin eliminar los valores normalizados.
14. Aplicar y verificar la migración correctiva y su seed idempotente.
15. Crear `20261029000039_remove_unused_feed_overview_keys.sql` para eliminar las tres columnas de keys no utilizadas.
16. Aplicar y verificar la migración final y confirmar que los valores literales siguen disponibles.
17. Crear `20261029000040_remove_room_label_key.sql` para eliminar la última columna de key no utilizada.
18. Aplicar y verificar el esquema final de `feed_overviews`.

## Acceptance criteria

- [x] Existe `20261029000037_create_and_seed_feed_overviews.sql`.
- [x] La migración es posterior a las migraciones sociales existentes y no colisiona con el historial remoto.
- [x] `public.feed_overviews` existe.
- [x] `feed_overviews.id` es UUID con default `gen_random_uuid()`.
- [x] `feed_overviews.daycare_id` referencia `daycares.id` con `ON DELETE RESTRICT`.
- [x] `feed_overviews.room_id` referencia `rooms.id` con `ON DELETE RESTRICT` y acepta `NULL`.
- [x] Existen `room_label`, `greeting`, `attendance`, `display_date`, `composer_prompt` y `published_today_label` como `text NOT NULL`.
- [x] `attendance_count` es `integer NOT NULL` y rechaza valores menores que cero.
- [x] `date` es `date NOT NULL`.
- [x] `created_at` y `updated_at` son `timestamptz NOT NULL` con default `now()`.
- [x] La unicidad trata dos valores `NULL` de `room_id` como iguales dentro de la misma guardería y fecha.
- [x] Existe el índice `(daycare_id, date DESC)`.
- [x] Existe un índice sobre `room_id` para cubrir la FK.
- [x] RLS está habilitado en `feed_overviews`.
- [x] No existen políticas públicas permisivas en `feed_overviews`.
- [x] No se crean enums nuevos ni se modifican enums sociales existentes.
- [x] El seed localiza `Guardería Sala Soles` por nombre y dirección.
- [x] El seed localiza la sala `Soles` dentro de esa guardería.
- [x] El seed falla explícitamente si falta la guardería o la sala requerida.
- [x] El seed crea una fila con `attendance_count = 12` y `date = '2026-06-17'`.
- [x] El seed persiste los valores literales definidos por el JSON.
- [x] No existe `room_label_key`.
- [x] No existen `greeting_key`, `composer_prompt_key` ni `published_today_label_key`.
- [x] El seed persiste literalmente `Guardería · Sala Soles`, `Buenas, Caro`, `12 niños`, `martes 17 jun`, `Comparte un momento…` y `Publicado hoy`.
- [x] Ejecutar nuevamente el seed no duplica la fila.
- [x] Ejecutar nuevamente el seed conserva el UUID de la fila existente.
- [x] No se siembran posts, media, reacciones, comentarios ni usuarios parent.
- [x] No se conceden grants nuevos a `anon` o `authenticated`.
- [x] No se modifican los JSON existentes.
- [x] No se modifica el runtime de la aplicación.
- [x] La migración aplicada aparece en el historial remoto de Supabase.
- [x] Los advisors de seguridad y rendimiento no reportan nuevas FKs sin índices ni exposición no prevista.

## Decisions

- **Sí:** crear una spec incremental DB 07, porque las cinco tablas sociales y sus enums ya fueron aplicados por SPEC DATABASE 06.
- **Sí:** incluir únicamente `feed_overviews` y su seed, porque el usuario decidió diferir los seeds de feed y engagement.
- **Sí:** usar una única migración para DDL, RLS, índices y seed, porque el usuario confirmó esa organización aunque las specs sociales previas separen cada cambio.
- **Sí:** usar `gen_random_uuid()` para `feed_overviews.id`, porque la tabla no necesita conservar IDs legacy del JSON.
- **Sí:** hacer upsert por guardería, sala y fecha, porque esa combinación representa la identidad funcional de la proyección.
- **Sí:** usar `UNIQUE NULLS NOT DISTINCT`, porque `room_id` nullable debe permitir una sola vista general por guardería y fecha.
- **Sí:** persistir los textos visibles literalmente, porque son el contenido que utilizará la tabla.
- **Sí:** persistir también los valores visibles originales, porque el JSON funcional debe quedar representado literalmente en la tabla.
- **Sí:** habilitar RLS sin políticas iniciales, porque los claims confiables y las políticas de negocio pertenecen a una spec posterior.
- **No:** crear enums para las UI keys, porque el diccionario define esos campos como `text` y las keys pueden evolucionar sin DDL.
- **No:** sembrar `feed.json`, `feed-reactions.json` o `feed-comments.json`, porque las FKs de autores y usuarios parent no están completas en el remoto.
- **No:** migrar `people.json` o `parent-kids.json`, porque esa dependencia requiere una spec separada de usuarios y vínculos parentales.
- **No:** recrear tablas sociales existentes, porque produciría colisiones y excedería el alcance incremental.
- **Sí:** agregar una migración correctiva posterior, porque `20261029000037` ya fue aplicada y no debe editarse.
- **Sí:** eliminar las tres keys no utilizadas mediante una migración posterior, porque ya no forman parte del modelo final.
- **Sí:** eliminar también `room_label_key` mediante una migración posterior, porque `room_label` es la única representación de sala que se utilizará.

## Risks

| Risk                                                                    | Mitigation                                                                              |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Falta la guardería o la sala requerida en Supabase.                     | El seed valida ambas dependencias y falla con un mensaje explícito.                     |
| El seed crea duplicados al repetirse.                                   | Usar la identidad funcional `(daycare_id, room_id, date)` y un upsert completo.         |
| `room_id` nullable permite varios overviews generales.                  | Usar `UNIQUE NULLS NOT DISTINCT` sobre guardería, sala y fecha.                         |
| `room_id` pertenece a otra guardería.                                   | Mantener la validación tenant como requisito explícito para la implementación futura.   |
| La tabla queda inaccesible para clientes antes de existir autorización. | Habilitar RLS sin políticas ni grants adicionales.                                      |
| La migración colisiona con una ejecución remota previa.                 | Consultar historial y catálogo antes de aplicar y respetar la versión `20261029000037`. |
| Los advisors reportan exposición automática del Data API.               | Revisar Data API, RLS y grants después de aplicar la migración.                         |

## What is **not** in this spec

- Seeds de `feed.json`, `feed-reactions.json` o `feed-comments.json`.
- Migración de usuarios parent o relaciones `parent_children`.
- Recreación de tablas o enums del módulo social ya implementados.
- Políticas RLS de negocio.
- Grants nuevos para clientes.
- Triggers, funciones, jobs o procedimientos de autorización.
- Validación completa de tenant mediante claves compuestas o triggers.
- Repositorios, clientes o adaptadores Supabase.
- Cambios en `src/infrastructure/persistence/json/data/`.
- Cambios en el runtime de la aplicación.
- Tablas `daily_summaries` o `devices`.
