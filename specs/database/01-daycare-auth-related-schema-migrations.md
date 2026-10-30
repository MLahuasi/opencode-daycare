# SPEC DATABASE 01 — Daycare y módulos auth, rooms y children

> **Status:** Implemented
> **Depends on:** SPEC 26
> **Date:** 2026-10-30
> **Objective:** Crear y poblar mediante exactamente dos migraciones versionadas las tablas raíz `daycares` y las tablas relacionadas de `auth`, `rooms` y `children`, conforme a `schema_db.md`, aplicándolas y verificándolas en Supabase.

## Scope

**In:**

- Crear exactamente dos scripts SQL versionados en `src/infrastructure/persistence/migrations/`.
- Seguir el patrón de migraciones imperativo del proyecto y conservar el orden de aplicación.
- Crear los enums `person_role`, `person_status`, `parent_relationship` y `kid_status` definidos en `schema_db.md`.
- Crear `public.daycares` como raíz del aislamiento multi-guardería.
- Crear `public.people`, `public.credential` y `public.invitation`.
- Crear `public.rooms` y `public.staff_rooms`.
- Crear `public.kids` y `public.parent_kids`.
- Crear todos los UUID, claves primarias, claves foráneas, restricciones, índices y columnas de auditoría definidos en `schema_db.md`.
- Crear las restricciones `UNIQUE (id, daycare_id)` necesarias para las claves foráneas compuestas entre registros del mismo daycare.
- Aplicar las relaciones con `daycare_id` para impedir referencias entre guarderías.
- Habilitar RLS en las ocho tablas sin crear políticas para `anon` o `authenticated`.
- Crear un seed transaccional e idempotente para la guardería `Guardería Sala Soles` y los siete archivos JSON relacionados:
  - `people.json` → `people`.
  - `credential.json` → `credential`.
  - `invitation.json` → `invitation`.
  - `rooms.json` → `rooms`.
  - `staff-rooms.json` → `staff_rooms`.
  - `kids.json` → `kids`.
  - `parent-kids.json` → `parent_kids`.
- Generar UUID nuevos para todas las filas sembradas, incluso cuando el ID fuente tenga formato UUID.
- Resolver todas las relaciones mediante mapas de IDs fuente a UUID nuevos.
- Preservar valores, fechas, hashes, cadenas vacías, valores booleanos y `NULL` definidos por los JSON.
- Aplicar y verificar las migraciones en el proyecto Supabase configurado.
- Mantener sin cambios los JSON fuente y el runtime de la aplicación.

**Out of scope:**

- Crear tablas o seeds del módulo `social-media`.
- Cargar `feed.json`, `feed-comments.json`, `feed-overview.json` o `feed-reactions.json`.
- Crear políticas RLS de negocio.
- Crear grants adicionales para `anon` o `authenticated`.
- Integrar estas tablas con `auth.users` de Supabase.
- Crear repositorios, adaptadores o clientes Supabase en el runtime.
- Cambiar la persistencia JSON de la aplicación.
- Crear triggers de autorización, jobs de expiración o funciones de negocio.
- Persistir IDs legacy de los JSON como claves primarias o foráneas.

## Data model

Todas las tablas pertenecen a `public`. Cada tabla tiene un UUID como clave primaria; todas las tablas de negocio excepto la raíz `daycares` tienen un `daycare_id uuid NOT NULL`. Las tablas usan `created_at`/`updated_at` como `timestamptz NOT NULL DEFAULT now()`, salvo que la tabla requiera otra definición explícita en `schema_db.md`.

### Enums

- `person_role`: `parent`, `personal`.
- `person_status`: `active`, `inactive`, `pending`.
- `parent_relationship`: `mother`, `father`, `guardian`.
- `kid_status`: `active`, `inactive`.

### Tablas

#### `public.daycares`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `name text NOT NULL`.
- `created_at timestamptz NOT NULL DEFAULT now()`.
- `updated_at timestamptz NOT NULL DEFAULT now()`.

El seed crea de forma idempotente `Guardería Sala Soles`.

#### `public.people`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL REFERENCES daycares(id)`.
- `name text NOT NULL`.
- `email text NOT NULL`.
- `role person_role NOT NULL`.
- `status person_status NOT NULL`.
- `created_at` y `updated_at` con defaults de auditoría.

Crear unicidad por guardería sobre `lower(email)` mediante un índice único sobre `(daycare_id, lower(email))`.

#### `public.credential`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL REFERENCES daycares(id)`.
- `person_id uuid NOT NULL` con FK compuesta a `people(id, daycare_id)`.
- `password_hash text NOT NULL`.
- `created_at` y `updated_at` con defaults de auditoría.

#### `public.invitation`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL REFERENCES daycares(id)`.
- `person_id uuid NOT NULL` con FK compuesta a `people(id, daycare_id)`.
- `kid_id uuid NOT NULL` con FK compuesta a `kids(id, daycare_id)`.
- `relationship parent_relationship NOT NULL`.
- `code text NOT NULL`.
- `expires_at timestamptz NOT NULL`.
- `sent_at timestamptz NULL`.
- `accepted_at timestamptz NULL`.
- `created_at` y `updated_at` con defaults de auditoría.

El estado de la invitación se deriva de `expires_at` y `accepted_at`; no se crea un enum de estado.

#### `public.rooms`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL REFERENCES daycares(id)`.
- `name text NOT NULL`.
- `created_at` y `updated_at` con defaults de auditoría.

Crear unicidad por guardería sobre `(daycare_id, name)`.

#### `public.staff_rooms`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL REFERENCES daycares(id)`.
- `person_id uuid NOT NULL` con FK compuesta a `people(id, daycare_id)`.
- `room_id uuid NOT NULL` con FK compuesta a `rooms(id, daycare_id)`.
- `created_at` y `updated_at` con defaults de auditoría.

#### `public.kids`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL REFERENCES daycares(id)`.
- `slug text NOT NULL`.
- `name text NOT NULL`.
- `birth_date date NOT NULL`.
- `room_id uuid NOT NULL` con FK compuesta a `rooms(id, daycare_id)`.
- `enrollment_date date NOT NULL`.
- `medical_notes text NOT NULL`.
- `allergies text NOT NULL`.
- `status kid_status NOT NULL`.
- `created_at` y `updated_at` con defaults de auditoría.

#### `public.parent_kids`

- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- `daycare_id uuid NOT NULL REFERENCES daycares(id)`.
- `parent_id uuid NOT NULL` con FK compuesta a `people(id, daycare_id)`.
- `kid_id uuid NOT NULL` con FK compuesta a `kids(id, daycare_id)`.
- `relationship parent_relationship NOT NULL`.
- `photo_sharing_consent boolean NOT NULL`.
- `created_at` y `updated_at` con defaults de auditoría.

La combinación funcional `(parent_id, kid_id)` debe impedir vínculos duplicados mediante una restricción única.

### Relaciones referenciales

- Las relaciones entre registros del mismo daycare deben usar claves foráneas compuestas con `(id, daycare_id)`.
- `daycares`, `people`, `rooms` y `kids` son registros raíz y no deben eliminarse en cascada desde dependientes.
- Las tablas puente y dependientes podrán usar `ON DELETE CASCADE` solo cuando no contradiga la protección de los registros raíz.
- La validación de reglas de negocio adicionales, como roles autorizados o coherencia temporal de invitaciones, queda fuera de esta migración.

## Migration files

La implementación debe crear exactamente estos dos archivos, con una versión posterior a las migraciones existentes y sin colisiones con el historial remoto:

1. `<version>_create_daycare_auth_rooms_children_schema.sql`
   - Habilita las extensiones requeridas, incluyendo `pgcrypto` si aún no está habilitada.
   - Crea los cuatro enums.
   - Crea las ocho tablas en orden de dependencia.
   - Crea claves primarias, restricciones únicas, soporte para FKs compuestas, índices y FKs.
   - Habilita RLS en todas las tablas.
   - No crea políticas ni grants cliente.

2. `<version>_seed_daycare_auth_rooms_children_json.sql`
   - Ejecuta toda la carga dentro de una transacción.
   - Inserta o localiza `Guardería Sala Soles`.
   - Lee las siete colecciones JSON antes de insertar relaciones.
   - Genera un UUID nuevo por registro y mantiene un mapa independiente por colección.
   - Inserta primero `people`, `rooms` y `kids`, y después las tablas dependientes.
   - Resuelve `personId`, `kidId`, `parentId` y `roomId` mediante los mapas generados.
   - Aborta si falta cualquier referencia.
   - Verifica conteos, referencias y ausencia de huérfanos antes de completar la transacción.

Los scripts no deben modificar, mover ni eliminar los archivos JSON fuente.

## Implementation plan

1. Consultar el historial remoto y el catálogo de tablas, enums, índices, restricciones y RLS de Supabase.
2. Confirmar la siguiente versión disponible y que no colisione con migraciones locales o remotas.
3. Crear la migración estructural con extensiones, enums, las ocho tablas, restricciones, índices, FKs y RLS.
4. Crear la migración de seed con la guardería raíz, los siete JSON, mapas de UUID y carga transaccional.
5. Revisar que ningún ID fuente se persista y que las relaciones estén limitadas por `daycare_id`.
6. Aplicar las migraciones mediante el flujo versionado del proyecto y `supabase db push`.
7. Verificar enums, columnas, defaults, índices, FKs, acciones referenciales y RLS en Supabase.
8. Verificar los conteos cargados, las relaciones y la idempotencia del seed.
9. Ejecutar nuevamente el seed en una verificación controlada y confirmar que no duplica filas ni cambia UUID existentes.
10. Ejecutar los advisors de seguridad y rendimiento, revisando especialmente RLS y FKs sin índices.
11. Confirmar que los JSON y el runtime permanecen sin cambios.

## Acceptance criteria

- [x] Existe una migración estructural y una migración de seed, ambas versionadas en `src/infrastructure/persistence/migrations/`.
- [x] Las dos versiones no colisionan con el historial local o remoto.
- [x] Existen los enums `person_role`, `person_status`, `parent_relationship` y `kid_status` con exactamente los valores de `schema_db.md`.
- [x] Existen exactamente las ocho tablas `daycares`, `people`, `credential`, `invitation`, `rooms`, `staff_rooms`, `kids` y `parent_kids`.
- [x] Cada tabla tiene una PK UUID y cada tabla de negocio tiene un `daycare_id NOT NULL`.
- [x] `people` aplica unicidad por guardería sobre `lower(email)`.
- [x] `rooms` aplica unicidad por guardería sobre `name`.
- [x] Las relaciones entre tablas del mismo daycare usan FKs compuestas con `daycare_id`.
- [x] Las tablas raíz no tienen acciones referenciales en cascada que permitan borrado accidental desde dependientes.
- [x] RLS está habilitado en las ocho tablas.
- [x] No existen políticas ni grants nuevos para `anon` o `authenticated`.
- [x] El seed crea o reutiliza exactamente una guardería llamada `Guardería Sala Soles`.
- [x] El seed carga los siete JSON definidos y conserva los valores requeridos, incluidos strings vacíos y `NULL`.
- [x] Cada registro fuente recibe un UUID nuevo y ningún ID legacy queda persistido.
- [x] Todas las referencias de `credential`, `invitation`, `staff_rooms`, `kids` y `parent_kids` se resuelven correctamente.
- [x] El seed falla y revierte la transacción cuando una referencia no existe.
- [x] El seed es idempotente y no duplica registros al ejecutarse nuevamente.
- [x] Los conteos cargados coinciden con los registros presentes en los siete JSON y no existen relaciones huérfanas.
- [x] Las migraciones aparecen aplicadas en el historial remoto de Supabase.
- [x] Los advisors de seguridad y rendimiento no reportan nuevas FKs sin índices ni exposición RLS no intencionada.
- [x] Los JSON fuente permanecen byte a byte sin modificaciones.
- [x] No se modifica el runtime de la aplicación.

## Decisions taken and discarded

- **Sí:** usar `schema_db.md` como contrato principal, aunque existan specs históricas con nombres legacy como `users`, `credentials` o `children`.
- **Sí:** crear `daycares` en esta feature porque es la raíz requerida por todas las relaciones multi-tenant.
- **Sí:** incluir `rooms`, `staff_rooms`, `kids` y `parent_kids` para que el seed de `invitation` pueda resolver sus referencias.
- **Sí:** limitar la feature a los módulos `global`, `auth`, `rooms` y `children`.
- **Sí:** usar exactamente dos archivos SQL: uno estructural y uno de seed.
- **Sí:** generar UUID nuevos y usar mapas por colección para resolver relaciones.
- **Sí:** habilitar RLS sin políticas iniciales.
- **Sí:** aplicar y verificar las migraciones en Supabase remoto.
- **No:** crear el módulo `social-media` en esta feature.
- **No:** persistir IDs legacy de los JSON.
- **No:** conectar estas tablas con `auth.users`.
- **No:** crear políticas RLS de negocio, triggers de autorización o cambios en el runtime.

## Risks

| Risk                                                                     | Mitigation                                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Los nombres o versiones de migración colisionan con el historial remoto. | Consultar el historial antes de crear y aplicar los archivos.                                       |
| `invitation` referencia un `kid_id` no cargado.                          | Insertar `kids` antes de `invitation`, resolver mediante mapa y abortar ante referencias faltantes. |
| Se cruzan registros de distintas guarderías.                             | Propagar el mismo `daycare_id` y usar FKs compuestas.                                               |
| El seed deja una carga parcial.                                          | Ejecutar todo dentro de una transacción y validar antes de confirmar.                               |
| Se duplican filas al repetir el seed.                                    | Usar restricciones únicas y claves funcionales deterministas para el upsert.                        |
| Las tablas quedan inaccesibles para clientes.                            | Mantener RLS habilitado sin políticas; el deny-by-default es intencional.                           |
| Se expone `password_hash`.                                               | No crear políticas ni grants cliente y mantener la tabla protegida por RLS.                         |
| Las specs históricas contradicen el esquema actual.                      | Tratar `schema_db.md` como fuente de verdad y documentar la decisión.                               |

## What is **not** in this spec

- Tablas, enums o seeds del módulo `social-media`.
- Migración de los cuatro JSON del feed.
- Integración con `auth.users`.
- Políticas RLS de negocio o grants a clientes.
- Repositorios, adaptadores, clientes Supabase o cutover del runtime.
- Modificación de JSON fuente.
- Triggers, funciones o jobs de autorización y expiración.
