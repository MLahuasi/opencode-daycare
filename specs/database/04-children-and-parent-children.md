# SPEC DATABASE 04 — Módulo children: `children` y `parent_children`

> **Status:** Approved
> **Depends on:** SPEC DATABASE 01, SPEC DATABASE 02, SPEC DATABASE 03, SPEC 26
> **Date:** 2026-10-29
> **Objective:** Crear las tablas `children` y `parent_children` con sus enums, relaciones, índices, RLS y seed idempotente de los niños del módulo mediante migraciones versionadas aplicadas a Supabase.

## Scope

**In:**

- Crear migraciones SQL versionadas en `src/infrastructure/persistence/migrations/`.
- Seguir el patrón imperativo de migraciones existente: un archivo SQL por cambio, nombres versionados secuencialmente y aplicación ordenada mediante Supabase.
- Crear el enum `child_status` con los valores `active` e `inactive`.
- Crear el enum `relationship_type` con los valores `father`, `mother` y `guardian`.
- Crear `public.children` conforme al diccionario PostgreSQL del proyecto.
- Crear `public.parent_children` conforme al diccionario PostgreSQL del proyecto.
- Relacionar los niños con `daycares` y, opcionalmente, con `rooms`.
- Relacionar `parent_children.parent_id` con `users.id` y `child_id` con `children.id`.
- Habilitar RLS en ambas tablas sin políticas públicas iniciales.
- Crear los índices recomendados para consultas de niños y relaciones parentales.
- Sembrar los 12 registros actuales de `kids.json` mediante SQL literal versionado.
- Resolver las salas por nombre dentro de `Guardería Sala Soles`.
- Generar UUID nuevos para los niños y no persistir IDs legacy del JSON.
- Normalizar `allergies` a códigos ingleses en `allergy_tags`.
- Mantener el texto de `medicalNotes` como `medical_notes` sin alterar su contenido.
- Crear `parent_children` sin filas iniciales porque los usuarios parent no se migran en esta spec.
- Aplicar las migraciones al proyecto Supabase configurado.
- No aplicar cambios DDL directamente fuera de una migración versionada.
- Verificar estructura, relaciones, restricciones, RLS, índices, seed e idempotencia.
- Mantener intactos los JSON y el runtime.

**Out of scope (for future specs):**

- Migrar usuarios parent desde `people.json`.
- Sembrar filas en `parent_children`.
- Validar o crear manualmente las relaciones entre padres y niños.
- Crear credenciales para usuarios parent.
- Crear políticas RLS de negocio.
- Exponer las tablas mediante grants adicionales a `anon` o `authenticated`.
- Implementar claims, sesiones o autenticación.
- Imponer mediante triggers o claves compuestas la pertenencia común a `daycare_id`.
- Crear repositorios, clientes Supabase o adaptadores PostgreSQL.
- Modificar la persistencia JSON o conectar el runtime a Supabase.
- Crear otras tablas del modelo PostgreSQL.

## Data model

### Enum `child_status`

```text
active
inactive
```

### Enum `relationship_type`

```text
father
mother
guardian
```

### `public.children`

| Column                     | PostgreSQL type | Null/default/constraint                         |
| -------------------------- | --------------- | ----------------------------------------------- |
| `id`                       | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`       |
| `daycare_id`               | `uuid`          | NOT NULL, FK → `daycares.id` ON DELETE RESTRICT |
| `room_id`                  | `uuid`          | nullable, FK → `rooms.id` ON DELETE RESTRICT    |
| `slug`                     | `text`          | NOT NULL, UNIQUE (`daycare_id`, `slug`)         |
| `full_name`                | `text`          | NOT NULL                                        |
| `birth_date`               | `date`          | NOT NULL                                        |
| `enrolled_at`              | `date`          | NOT NULL                                        |
| `medical_notes`            | `text`          | NOT NULL, default `''`                          |
| `allergy_tags`             | `text[]`        | NOT NULL, default `'{}'`                        |
| `status`                   | `child_status`  | NOT NULL, default `active`                      |
| `created_at`, `updated_at` | `timestamptz`   | NOT NULL, default `now()`                       |

La unicidad de `slug` se limita a cada guardería.

`allergy_tags` contiene códigos ingleses. El texto de `allergies` del JSON se normaliza con este catálogo:

| Texto de origen | Código persistido |
| --------------- | ----------------- |
| Maní / mani     | `peanut`          |
| Lactosa         | `lactose`         |
| Queso           | `cheese`          |
| Polen           | `pollen`          |
| Ácaros          | `dust_mites`      |
| Gluten          | `gluten`          |
| Pollo           | `chicken`         |

Los valores vacíos se convierten en un array vacío.

### `public.parent_children`

| Column                     | PostgreSQL type     | Null/default/constraint                         |
| -------------------------- | ------------------- | ----------------------------------------------- |
| `id`                       | `uuid`              | PK, NOT NULL, default `gen_random_uuid()`       |
| `parent_id`                | `uuid`              | NOT NULL, FK → `users.id` ON DELETE RESTRICT    |
| `child_id`                 | `uuid`              | NOT NULL, FK → `children.id` ON DELETE RESTRICT |
| `relationship`             | `relationship_type` | NOT NULL                                        |
| `photo_sharing_consent`    | `boolean`           | NOT NULL, default `false`                       |
| `created_at`, `updated_at` | `timestamptz`       | NOT NULL, default `now()`                       |

La restricción única `(parent_id, child_id)` impide duplicar el vínculo.

Aunque `parent_children` se crea en esta spec, permanecerá vacía porque los usuarios parent de `people.json` no se migran. La validación manual de relaciones queda para una especificación posterior.

### Índices

Se crearán los índices no cubiertos por las restricciones únicas:

- `children(daycare_id, status, room_id)`.
- `parent_children(child_id)`.

Las restricciones primarias y únicas cubrirán los índices de `id`, `(daycare_id, slug)` y `(parent_id, child_id)`.

## Seed inicial

El seed debe localizar:

```text
name: Guardería Sala Soles
address: Av. Principal 123, Centro
```

Debe fallar explícitamente si la guardería no existe.

Debe sembrar los 12 registros actuales de `kids.json`:

- Mateo Fernández.
- Sofía Méndez.
- Benjamín Ruiz.
- Valentina Soto.
- Tomás Díaz.
- Emma Castro.
- Lucas Romero.
- Olivia Vega.
- Martina López Vega.
- Chewbacca Lahuasi.
- Leia Lahuasi.
- Terry Lahuasi.

El seed debe:

1. Resolver cada sala por su nombre dentro de la guardería encontrada.
2. Generar un UUID nuevo para `children.id` en la primera inserción.
3. Usar `(daycare_id, slug)` como clave funcional de upsert.
4. Actualizar los campos del niño si la fila ya existe.
5. Convertir `birthDate` y `enrollmentDate` a `date`.
6. Convertir `name` a `full_name`.
7. Convertir `medicalNotes` a `medical_notes` preservando el texto.
8. Convertir `allergies` a `allergy_tags` usando el catálogo definido.
9. Convertir `status` al enum `child_status`.
10. Resolver `roomId` mediante los nombres `Soles`, `Girasoles` y `Patitos`.
11. Fallar explícitamente si falta una sala referenciada.
12. No insertar filas en `parent_children`.
13. No persistir IDs legacy como `kid-mateo-fernandez` o IDs de sala del JSON.

## Implementation plan

1. Crear `20261029000013_create_children_enums.sql` con `child_status` y `relationship_type`.
2. Crear `20261029000014_create_children.sql` con `public.children`, sus defaults, FK y unicidad por guardería y slug.
3. Crear `20261029000015_enable_children_rls.sql` y habilitar RLS sin políticas públicas.
4. Crear `20261029000016_create_parent_children.sql` con la PK, FKs, unicidad y columnas de auditoría.
5. Crear `20261029000017_enable_parent_children_rls.sql` y habilitar RLS sin políticas públicas.
6. Crear `20261029000018_create_children_indexes.sql` con los índices de consulta definidos.
7. Crear `20261029000019_seed_children.sql` con los 12 niños, resolución de salas, normalización de alergias y upsert idempotente.
8. Revisar que las migraciones no modifiquen JSON, runtime, IDs legacy ni grants públicos.
9. Consultar el estado remoto de tablas, enums e historial de migraciones antes de aplicar los scripts.
10. Confirmar que los nombres y versiones locales no colisionan con el historial remoto.
11. Aplicar las migraciones versionadas en orden al proyecto Supabase configurado.
12. Verificar enums, columnas, defaults, restricciones, FKs, acciones referenciales, índices, RLS y ausencia de políticas.
13. Aplicar el seed y verificar que existen exactamente 12 niños y cero relaciones parentales.
14. Ejecutar nuevamente el seed y confirmar que no duplica filas ni cambia los UUID existentes.
15. Validar manualmente las FKs y la unicidad de `parent_children` dentro de una transacción temporal con rollback.
16. Confirmar que no se modificaron los JSON ni el runtime.

## Acceptance criteria

- [ ] Existe una spec en `specs/database/04-children-and-parent-children.md` en estado `Draft`.
- [ ] Existen migraciones versionadas para los enums, `children`, `parent_children`, RLS, índices y seed.
- [ ] Cada cambio DDL y de seed está contenido en una migración SQL versionada independiente y ordenada.
- [ ] No se aplican cambios DDL directos fuera del patrón de migraciones.
- [ ] Las migraciones locales no colisionan con el historial remoto de Supabase.
- [ ] Existe el enum `child_status` con `active` e `inactive`.
- [ ] Existe el enum `relationship_type` con `father`, `mother` y `guardian`.
- [ ] `public.children` existe con las columnas especificadas.
- [ ] `children.id` es UUID con default `gen_random_uuid()`.
- [ ] `children.daycare_id` referencia `daycares.id` con `ON DELETE RESTRICT`.
- [ ] `children.room_id` referencia `rooms.id` con `ON DELETE RESTRICT` y acepta `NULL`.
- [ ] `(children.daycare_id, children.slug)` es único.
- [ ] `allergy_tags` es `text[]`, no acepta `NULL` y tiene default array vacío.
- [ ] `status` usa `child_status` y tiene default `active`.
- [ ] `public.parent_children` existe con las columnas especificadas.
- [ ] `parent_children.id` es UUID con default `gen_random_uuid()`.
- [ ] `parent_children.parent_id` referencia `users.id` con `ON DELETE RESTRICT`.
- [ ] `parent_children.child_id` referencia `children.id` con `ON DELETE RESTRICT`.
- [ ] `(parent_children.parent_id, parent_children.child_id)` es único.
- [ ] RLS está habilitado en `children` y `parent_children`.
- [ ] No existen políticas públicas permisivas en las tablas nuevas.
- [ ] Existen los índices `children(daycare_id, status, room_id)` y `parent_children(child_id)`.
- [ ] El seed localiza `Guardería Sala Soles` por nombre y dirección.
- [ ] El seed falla explícitamente si falta la guardería.
- [ ] El seed falla explícitamente si falta una sala referenciada.
- [ ] El seed crea exactamente 12 niños correspondientes a `kids.json`.
- [ ] Cada niño usa un UUID nuevo y no persiste su ID legacy del JSON.
- [ ] Las salas de los niños se resuelven dentro de `Guardería Sala Soles`.
- [ ] Las alergias se persisten como códigos ingleses definidos en la spec.
- [ ] Los textos de `medicalNotes` se preservan en `medical_notes`.
- [ ] `parent_children` se crea sin filas porque no se migran usuarios parent.
- [ ] La validación manual confirma que las FKs de `parent_children` rechazan referencias inexistentes.
- [ ] La validación manual confirma que la unicidad de `parent_children` rechaza duplicados.
- [ ] Ejecutar nuevamente el seed no duplica niños.
- [ ] Ejecutar nuevamente el seed conserva los UUID existentes por `(daycare_id, slug)`.
- [ ] No se conceden grants nuevos a `anon` o `authenticated`.
- [ ] No se modifican `kids.json`, `parent-kids.json`, `people.json` ni otros JSON existentes.
- [ ] No se modifica el runtime de la aplicación.
- [ ] Las migraciones aplicadas aparecen en el historial remoto de Supabase.

## Decisions

- **Sí:** crear `children` y `parent_children` como tablas independientes.
- **Sí:** crear `child_status` y `relationship_type` según el diccionario PostgreSQL.
- **Sí:** migrar los 12 niños actuales de `kids.json`.
- **Sí:** generar UUID nuevos para los niños y no conservar IDs legacy.
- **Sí:** usar `(daycare_id, slug)` como clave funcional idempotente.
- **Sí:** resolver salas por nombre dentro de la guardería esperada.
- **Sí:** normalizar las alergias a códigos ingleses.
- **Sí:** preservar los textos de notas médicas como datos no estructurados.
- **Sí:** crear `parent_children` aunque quede vacía.
- **Sí:** no migrar usuarios parent en esta spec.
- **Sí:** validar manualmente las relaciones parentales sin insertar datos.
- **Sí:** usar `ON DELETE RESTRICT` en las relaciones de pertenencia.
- **Sí:** habilitar RLS sin políticas públicas iniciales.
- **Sí:** no conceder acceso adicional a clientes mediante grants.
- **Sí:** aplicar y verificar las migraciones en Supabase.
- **Sí:** seguir el patrón imperativo de migraciones existente, con un archivo versionado por cambio y aplicación ordenada.
- **No:** ejecutar DDL suelto o aplicar cambios directos que no queden representados en una migración.
- **No:** migrar `people.json` ni crear padres automáticamente.
- **No:** sembrar `parent_children` sin usuarios parent existentes.
- **No:** conservar IDs legacy del JSON.
- **No:** crear políticas RLS de negocio.
- **No:** imponer todavía la pertenencia común a `daycare_id` mediante triggers o claves compuestas.
- **No:** modificar JSON, runtime, repositorios o adaptadores.

## Risks

| Risk                                                     | Mitigation                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| No existe la guardería esperada.                         | Fallar el seed antes de crear niños.                                   |
| Falta una sala referenciada por `kids.json`.             | Resolver todas las salas previamente y fallar con un error explícito.  |
| El seed duplica niños.                                   | Usar la restricción única `(daycare_id, slug)` y upsert idempotente.   |
| Se intenta crear una relación con un parent inexistente. | Mantener `parent_children` vacía y validar las relaciones manualmente. |
| Se persiste una alergia en español o sin catálogo.       | Usar únicamente el mapeo de códigos definido en esta spec.             |
| Se exponen datos de niños a clientes.                    | Habilitar RLS sin políticas ni grants adicionales.                     |
| Colisión con migraciones remotas existentes.             | Consultar historial y catálogo remoto antes de aplicar.                |

## What is **not** in this spec

- Migración de usuarios parent desde `people.json`.
- Seed de `parent_children`.
- Validación manual de relaciones parentales con datos persistidos.
- Credenciales, login, sesiones o claims.
- Políticas RLS de negocio.
- Grants para `anon` o `authenticated`.
- Validación completa de tenant mediante triggers, claves compuestas o procedimientos.
- Repositorios, clientes o adaptadores Supabase.
- Cambios en la persistencia JSON.
- Cambios en el runtime de la aplicación.
- Otras tablas del modelo PostgreSQL.
