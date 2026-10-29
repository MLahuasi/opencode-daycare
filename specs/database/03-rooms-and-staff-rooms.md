# SPEC DATABASE 03 — Módulo rooms: `rooms` y `staff_rooms`

> **Status:** Approved
> **Depends on:** SPEC DATABASE 01, SPEC DATABASE 02, SPEC 26
> **Date:** 2026-10-29
> **Objective:** Crear las tablas `rooms` y `staff_rooms` con sus relaciones, RLS y seeds idempotentes basados en `rooms.json` y `staff-rooms.json` mediante migraciones versionadas aplicadas a Supabase.

## Scope

**In:**

- Crear scripts SQL versionados en `src/infrastructure/persistence/migrations/`.
- Reutilizar el enum existente `user_role`; no crear enums nuevos para este módulo.
- Crear `public.rooms`.
- Crear `public.staff_rooms` como relación many-to-many entre usuarios y salas.
- Relacionar las salas con `Guardería Sala Soles` mediante `daycare_id`.
- Habilitar RLS en ambas tablas sin políticas públicas iniciales.
- Sembrar las tres salas de `rooms.json`: `Soles`, `Girasoles` y `Patitos`.
- Sembrar la asignación de `staff-rooms.json` entre Caro Giménez y `Soles`.
- Generar UUID nuevos para las filas persistidas.
- Aplicar migraciones y seed al proyecto Supabase configurado.
- Verificar estructura, relaciones, RLS, datos e idempotencia.
- Mantener intactos los JSON y el runtime.

**Out of scope (for future specs):**

- Migrar o crear otras tablas del modelo PostgreSQL.
- Crear enums nuevos.
- Crear políticas RLS de negocio.
- Validar mediante constraint o trigger que `staff_rooms.staff_id` tenga rol `staff` o `admin`.
- Validar mediante constraint o trigger la pertenencia común a `daycare_id` entre usuario y sala.
- Conservar los IDs legacy `room-soles`, `room-girasoles`, `room-patitos` o `staff-room-caro-soles`.
- Crear mapas de IDs legacy.
- Crear repositorios, clientes o adaptadores Supabase.
- Modificar la persistencia JSON o conectar el runtime a Supabase.

## Data model

### `public.rooms`

| Column                     | PostgreSQL type | Null/default/constraint                         |
| -------------------------- | --------------- | ----------------------------------------------- |
| `id`                       | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`       |
| `daycare_id`               | `uuid`          | NOT NULL, FK → `daycares.id` ON DELETE RESTRICT |
| `name`                     | `text`          | NOT NULL, UNIQUE (`daycare_id`, `name`)         |
| `created_at`, `updated_at` | `timestamptz`   | NOT NULL, default `now()`                       |

La unicidad de `name` se limita a cada guardería.

### `public.staff_rooms`

| Column       | PostgreSQL type | Null/default/constraint                              |
| ------------ | --------------- | ---------------------------------------------------- |
| `staff_id`   | `uuid`          | PK part, NOT NULL, FK → `users.id` ON DELETE CASCADE |
| `room_id`    | `uuid`          | PK part, NOT NULL, FK → `rooms.id` ON DELETE CASCADE |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`                            |

La clave primaria compuesta (`staff_id`, `room_id`) impide asignaciones duplicadas.

La relación representa asignaciones de usuarios de staff a salas. La compatibilidad del rol y la pertenencia al mismo tenant se validarán en una especificación posterior.

### Enums

Este módulo no introduce enums. Reutiliza `public.user_role` existente para la relación con `users`; el seed únicamente asigna a Caro Giménez, cuyo rol persistido es `staff`.

### Seed inicial

El seed debe localizar la guardería por:

```text
name: Guardería Sala Soles
address: Av. Principal 123, Centro
```

Debe fallar explícitamente si la guardería no existe.

Debe insertar o actualizar de forma idempotente estas salas:

```text
Soles
Girasoles
Patitos
```

Cada sala recibe un UUID nuevo. Los valores `room-soles`, `room-girasoles` y `room-patitos` solo se usan como referencias del JSON y no se persisten.

Para `staff_rooms`, el seed debe:

1. Localizar a Caro por `caro@opendaycare.com` dentro de la guardería encontrada.
2. Localizar la sala `Soles` dentro de la misma guardería.
3. Crear la relación sin duplicarla.
4. Fallar explícitamente si no existe Caro o no existe la sala `Soles`.

El ID legacy `staff-room-caro-soles` no se persiste.

## Implementation plan

1. Crear `20261029000008_create_rooms.sql` con `public.rooms`, su FK a `daycares` y la restricción única por guardería y nombre.
2. Crear `20261029000009_enable_rooms_rls.sql` y habilitar RLS sin políticas públicas.
3. Crear `20261029000010_create_staff_rooms.sql` con la PK compuesta y FKs `ON DELETE CASCADE` hacia `users` y `rooms`.
4. Crear `20261029000011_enable_staff_rooms_rls.sql` y habilitar RLS sin políticas públicas.
5. Crear `20261029000012_seed_rooms_and_staff_rooms.sql` con el seed idempotente de las tres salas y la asignación de Caro a `Soles`.
6. Revisar que los scripts no creen enums innecesarios, políticas públicas, IDs legacy ni modificaciones sobre JSON o runtime.
7. Consultar el estado remoto de tablas e historial de migraciones antes de aplicar los scripts para evitar colisiones de versión.
8. Aplicar las migraciones de estructura en orden al proyecto Supabase.
9. Aplicar el seed y verificar que las dependencias faltantes produzcan un error explícito.
10. Verificar columnas, restricciones, FKs, acciones referenciales, RLS, ausencia de políticas, las tres salas y la asignación de Caro.
11. Ejecutar nuevamente el seed y confirmar que no duplica salas ni asignaciones.
12. Confirmar que no se modificaron los JSON ni el runtime.

## Acceptance criteria

- [ ] Existe una spec en `specs/database/03-rooms-and-staff-rooms.md` en estado `Draft`.
- [x] Existen migraciones versionadas para `rooms`, `staff_rooms` y sus seeds.
- [x] No se crean enums nuevos para este módulo.
- [x] `public.rooms` existe con las columnas especificadas.
- [x] `rooms.id` es UUID con default `gen_random_uuid()`.
- [x] `rooms.daycare_id` referencia `daycares.id` con `ON DELETE RESTRICT`.
- [x] `(rooms.daycare_id, rooms.name)` es único.
- [x] `public.staff_rooms` existe con las columnas especificadas.
- [x] La PK de `staff_rooms` es `(staff_id, room_id)`.
- [x] `staff_rooms.staff_id` referencia `users.id` con `ON DELETE CASCADE`.
- [x] `staff_rooms.room_id` referencia `rooms.id` con `ON DELETE CASCADE`.
- [x] RLS está habilitado en `rooms` y `staff_rooms`.
- [x] No existen políticas públicas permisivas en las tablas nuevas.
- [x] Existe exactamente una sala `Soles` para `Guardería Sala Soles`.
- [x] Existe exactamente una sala `Girasoles` para `Guardería Sala Soles`.
- [x] Existe exactamente una sala `Patitos` para `Guardería Sala Soles`.
- [x] Existe exactamente una asignación entre Caro Giménez y `Soles`.
- [x] La asignación se resuelve usando UUID nuevos y no IDs legacy.
- [ ] El seed falla si falta la guardería, Caro o la sala `Soles` requerida.
- [x] Ejecutar el seed nuevamente no duplica salas ni asignaciones.
- [x] No se modifican `rooms.json`, `staff-rooms.json` ni otros JSON existentes.
- [x] No se modifica el runtime de la aplicación.

## Decisions

- **Sí:** crear `rooms` y `staff_rooms` como tablas independientes.
- **Sí:** reutilizar `user_role`; el modelo no define enums propios para salas.
- **Sí:** cargar las tres salas presentes en `rooms.json`.
- **Sí:** cargar la asignación de Caro a `Soles` presente en `staff-rooms.json`.
- **Sí:** generar UUID nuevos para todas las filas persistidas.
- **Sí:** resolver Caro por email y salas por nombre.
- **Sí:** fallar explícitamente si faltan la guardería, Caro o `Soles`.
- **Sí:** hacer el seed idempotente mediante las restricciones únicas y la PK compuesta.
- **Sí:** usar `ON DELETE RESTRICT` para la pertenencia de salas a la guardería.
- **Sí:** usar `ON DELETE CASCADE` para retirar asignaciones al eliminar usuarios o salas.
- **Sí:** habilitar RLS sin políticas públicas iniciales.
- **No:** conservar IDs legacy del JSON.
- **No:** imponer todavía que `staff_rooms.staff_id` tenga rol `staff` o `admin`.
- **No:** imponer todavía validación transaccional de pertenencia común a `daycare_id`.
- **No:** modificar los JSON ni conectar el runtime a Supabase.

## Risks

| Risk                                                   | Mitigation                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| No existe la guardería inicial.                        | Fallar el seed antes de crear salas o asignaciones.                                                         |
| No existe Caro porque la spec de auth no fue aplicada. | Fallar el seed indicando la dependencia faltante.                                                           |
| El seed crea salas duplicadas.                         | Usar la restricción única `(daycare_id, name)` y upsert idempotente.                                        |
| Se crean asignaciones duplicadas.                      | Usar la PK compuesta `(staff_id, room_id)` y upsert idempotente.                                            |
| Una asignación cruza tenants.                          | Resolver usuario y sala dentro de la misma guardería; la validación completa queda para una spec posterior. |
| Colisión en el historial remoto de migraciones.        | Consultar el historial antes de aplicar y usar versiones posteriores a `20261029000007`.                    |
| Las tablas quedan inaccesibles para clientes.          | Es intencional hasta definir las políticas RLS basadas en claims confiables.                                |

## What is **not** in this spec

- Enums nuevos.
- Validación de roles compatibles mediante triggers o constraints.
- Validación completa de tenant en todas las FKs.
- Políticas RLS de negocio.
- Migración de IDs legacy.
- Migración de otros registros JSON.
- Repositorios, clientes o adaptadores Supabase.
- Cambios en la persistencia JSON.
- Cambios en el runtime de la aplicación.
