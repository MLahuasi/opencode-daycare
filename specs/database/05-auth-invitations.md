# SPEC DATABASE 05 — Módulo auth: `invitations`

> **Status:** Approved
> **Depends on:** SPEC DATABASE 01, SPEC DATABASE 02, SPEC DATABASE 03, SPEC DATABASE 04, SPEC 26
> **Date:** 2026-10-29
> **Objective:** Crear la tabla `invitations` del módulo Auth con sus relaciones, restricciones, índices, RLS y asignaciones de sala necesarias para que la aplicación gestione la creación y aceptación de cuentas parent.

## Scope

**In:**

- Crear migraciones SQL versionadas en `src/infrastructure/persistence/migrations/`.
- Seguir el patrón imperativo existente: un archivo SQL por cambio y aplicación ordenada mediante Supabase.
- Crear el enum `invitation_status` con los valores `pending`, `accepted` y `expired`.
- Crear `public.invitations` conforme al diccionario PostgreSQL del proyecto.
- Reutilizar `relationship_type` para el parentesco de la invitación.
- Relacionar la invitación con `daycares`, `children` y `users` mediante claves foráneas.
- Mantener `invited_by_user_id` como el usuario que origina la invitación.
- Mantener `accepted_user_id` nullable hasta la aceptación.
- Rechazar invitaciones cuyo niño no tenga una sala asignada mediante el contrato de aplicación.
- Habilitar RLS en `invitations` sin políticas públicas iniciales.
- Crear los índices necesarios para las consultas por guardería, niño, emisor, usuario aceptado, email, estado y código.
- Crear una migración idempotente que asigne a Caro Giménez a las tres salas actuales: `Soles`, `Girasoles` y `Patitos`.
- Aplicar las migraciones al proyecto Supabase configurado.
- Verificar estructura, relaciones, restricciones, índices, RLS y asignaciones de sala.
- Mantener intactos los archivos JSON y el runtime de la aplicación.

**Out of scope (for future specs):**

- Sembrar filas en `invitations` desde `invitation.json`.
- Migrar usuarios desde `people.json`.
- Migrar credenciales desde `credential.json`.
- Migrar relaciones desde `parent-kids.json`.
- Crear o aceptar invitaciones desde SQL.
- Crear funciones PostgreSQL para activar usuarios o crear `parent_children`.
- Integrar repositorios, clientes Supabase o adaptadores PostgreSQL en el runtime.
- Cambiar la autenticación propia de la aplicación.
- Crear políticas RLS de negocio.
- Crear triggers para validar el rol o la asignación del emisor.
- Crear jobs para marcar invitaciones expiradas.
- Modificar `invitation.json`, `people.json`, `credential.json`, `parent-kids.json` u otros JSON.
- Cambiar las reglas de negocio existentes del flujo de invitaciones.

## Data model

### Enum `invitation_status`

```text
pending
accepted
expired
```

El estado `expired` será persistido por la aplicación cuando detecte que `expires_at` quedó en el pasado. PostgreSQL no ejecutará tareas programadas para actualizarlo automáticamente.

### `public.invitations`

| Column               | PostgreSQL type     | Null/default/constraint                         |
| -------------------- | ------------------- | ----------------------------------------------- |
| `id`                 | `uuid`              | PK, NOT NULL, default `gen_random_uuid()`       |
| `daycare_id`         | `uuid`              | NOT NULL, FK → `daycares.id` ON DELETE RESTRICT |
| `child_id`           | `uuid`              | NOT NULL, FK → `children.id` ON DELETE RESTRICT |
| `invited_by_user_id` | `uuid`              | NOT NULL, FK → `users.id` ON DELETE RESTRICT    |
| `accepted_user_id`   | `uuid`              | nullable, FK → `users.id` ON DELETE RESTRICT    |
| `full_name`          | `text`              | NOT NULL                                        |
| `email`              | `text`              | NOT NULL                                        |
| `relationship`       | `relationship_type` | NOT NULL                                        |
| `code`               | `text`              | NOT NULL, UNIQUE                                |
| `status`             | `invitation_status` | NOT NULL, default `pending`                     |
| `expires_at`         | `timestamptz`       | NOT NULL                                        |
| `sent_at`            | `timestamptz`       | nullable                                        |
| `accepted_at`        | `timestamptz`       | nullable                                        |
| `created_at`         | `timestamptz`       | NOT NULL, default `now()`                       |

La tabla conserva los datos del destinatario antes de que exista un usuario parent. El código es único para todas las invitaciones, incluyendo las aceptadas y expiradas.

### Restricciones de estado

La tabla debe impedir estados incompatibles:

- `accepted` exige `accepted_user_id IS NOT NULL` y `accepted_at IS NOT NULL`.
- `pending` exige `accepted_user_id IS NULL` y `accepted_at IS NULL`.
- `expired` exige `accepted_user_id IS NULL` y `accepted_at IS NULL`.
- Una invitación no puede tener `accepted_user_id` sin `accepted_at`.
- Una invitación no puede tener `accepted_at` sin `accepted_user_id`.

La aplicación será responsable de actualizar `status` a `expired` cuando corresponda y de coordinar la aceptación con la creación o activación del usuario parent y su relación `parent_children`.

### Relaciones y autorización de aplicación

- `daycare_id` identifica el tenant de la invitación.
- `child_id` debe referenciar un niño del mismo daycare y con `room_id` no nulo.
- `invited_by_user_id` debe referenciar un usuario del mismo daycare.
- Un parent no puede emitir invitaciones.
- Un usuario `staff` o `admin` activo puede emitir una invitación únicamente cuando está asignado mediante `staff_rooms` a la sala del niño.
- `accepted_user_id` debe referenciar al usuario parent creado o activado por la aceptación.
- La validación de rol, estado, tenant y asignación de sala pertenece a la aplicación y no se implementará con triggers en esta spec.

### Índices

Se crearán los índices no cubiertos por restricciones únicas y claves primarias:

- `invitations(daycare_id, status)`.
- `invitations(child_id, status)`.
- `invitations(invited_by_user_id)`.
- `invitations(accepted_user_id)`.
- `invitations(email, status)`.
- `invitations(expires_at, status)`.

La restricción única de `code` cubrirá las búsquedas exactas por código.

### Asignaciones de Caro

La migración de datos idempotente debe:

1. Localizar `Guardería Sala Soles` por nombre y dirección.
2. Localizar a Caro Giménez por `caro@opendaycare.com` dentro de esa guardería.
3. Localizar las salas `Soles`, `Girasoles` y `Patitos` dentro de la misma guardería.
4. Insertar las tres filas en `staff_rooms` sin duplicar las existentes.
5. Fallar explícitamente si falta la guardería, Caro o cualquiera de las salas.

Esta migración no crea invitaciones ni modifica otras filas de usuarios, niños o relaciones parentales.

## Implementation plan

1. Crear `20261029000020_create_invitation_enum.sql` con el enum `invitation_status`.
2. Crear `20261029000021_create_invitations.sql` con la tabla, defaults, claves foráneas, unicidad del código y checks de consistencia de estado.
3. Crear `20261029000022_enable_invitations_rls.sql` y habilitar RLS sin políticas públicas.
4. Crear `20261029000023_create_invitation_indexes.sql` con los índices de consulta definidos.
5. Crear `20261029000024_assign_caro_to_rooms.sql` con la asignación idempotente de Caro a `Soles`, `Girasoles` y `Patitos`.
6. Revisar que las migraciones no siembren invitaciones, no migren JSON, no creen triggers de autorización y no concedan grants adicionales a `anon` o `authenticated`.
7. Consultar el historial remoto y el catálogo de tablas antes de aplicar los scripts para confirmar que las versiones no colisionan.
8. Aplicar las migraciones versionadas al proyecto Supabase configurado.
9. Verificar el enum, las columnas, defaults, checks, claves foráneas, acciones referenciales, índices y RLS.
10. Verificar que `public.invitations` no contiene filas iniciales.
11. Verificar que Caro tiene exactamente una asignación a cada una de las tres salas.
12. Ejecutar nuevamente la migración de asignaciones en una verificación controlada y confirmar que no duplica filas.
13. Ejecutar advisors de seguridad y rendimiento y revisar especialmente RLS sin políticas y claves foráneas sin índices.
14. Confirmar que no se modificaron los JSON ni el runtime de la aplicación.

## Acceptance criteria

- [ ] Existe `20261029000020_create_invitation_enum.sql`.
- [ ] Existe `20261029000021_create_invitations.sql`.
- [ ] Existe `20261029000022_enable_invitations_rls.sql`.
- [ ] Existe `20261029000023_create_invitation_indexes.sql`.
- [ ] Existe `20261029000024_assign_caro_to_rooms.sql`.
- [ ] Existe el enum `invitation_status` con `pending`, `accepted` y `expired`.
- [ ] `public.invitations` existe con todas las columnas especificadas.
- [ ] `invitations.id` es UUID con default `gen_random_uuid()`.
- [ ] `invitations.daycare_id` referencia `daycares.id` con `ON DELETE RESTRICT`.
- [ ] `invitations.child_id` referencia `children.id` con `ON DELETE RESTRICT`.
- [ ] `invitations.invited_by_user_id` referencia `users.id` con `ON DELETE RESTRICT`.
- [ ] `invitations.accepted_user_id` referencia `users.id` con `ON DELETE RESTRICT` y acepta `NULL`.
- [ ] `invitations.relationship` usa `relationship_type`.
- [ ] `invitations.code` es único y obligatorio.
- [ ] `invitations.status` usa `invitation_status` y tiene default `pending`.
- [ ] Las invitaciones `accepted` requieren `accepted_user_id` y `accepted_at`.
- [ ] Las invitaciones `pending` y `expired` no admiten `accepted_user_id` ni `accepted_at`.
- [ ] RLS está habilitado en `invitations`.
- [ ] No existen políticas públicas permisivas en `invitations`.
- [ ] Existen índices para `daycare_id/status`, `child_id/status`, `invited_by_user_id`, `accepted_user_id`, `email/status` y `expires_at/status`.
- [ ] No se insertan filas iniciales en `invitations`.
- [ ] El seed o migración previa de asignaciones deja a Caro asignada a `Soles`, `Girasoles` y `Patitos`.
- [ ] La migración de asignaciones falla si falta la guardería, Caro o una sala requerida.
- [ ] Repetir la migración de asignaciones no duplica filas en `staff_rooms`.
- [ ] No se migran filas desde `invitation.json`.
- [ ] No se migran usuarios desde `people.json`.
- [ ] No se migran credenciales desde `credential.json`.
- [ ] No se migran relaciones desde `parent-kids.json`.
- [ ] No se crean funciones, triggers ni jobs para aceptar o expirar invitaciones.
- [ ] No se conceden grants nuevos a `anon` o `authenticated`.
- [ ] No se modifican los JSON existentes.
- [ ] No se modifica el runtime de la aplicación.
- [ ] Las migraciones aplicadas aparecen en el historial remoto de Supabase.
- [ ] Los advisors de seguridad y rendimiento no reportan nuevas claves foráneas sin índices.

## Decisions

- **Sí:** incluir `invitations` en el módulo Auth, porque la aceptación permite crear o activar un usuario parent.
- **Sí:** mantener `invitations` separada de `users`, porque el destinatario existe antes de completar la activación.
- **Sí:** usar `invitation_status` con `pending`, `accepted` y `expired`.
- **Sí:** persistir `status` y hacer que la aplicación marque las invitaciones expiradas.
- **Sí:** exigir consistencia entre `status`, `accepted_user_id` y `accepted_at` mediante checks de base de datos.
- **Sí:** mantener `invited_by_user_id` obligatorio para conservar la trazabilidad del emisor.
- **Sí:** exigir en el contrato de aplicación que tanto staff como admin estén asignados a la sala mediante `staff_rooms`.
- **Sí:** rechazar invitaciones para niños sin sala asignada.
- **No:** implementar autorización de roles o salas mediante triggers, porque la lógica de cambios de estado y autorización pertenece a la aplicación.
- **No:** permitir que un admin emita invitaciones sin asignación a una sala.
- **Sí:** habilitar RLS sin políticas iniciales, porque todavía no están definidos los claims confiables para las políticas de negocio.
- **No:** crear seeds de `invitations`, porque las invitaciones históricas no tienen todos los datos relacionales necesarios y el flujo debe producirlas desde la aplicación.
- **No:** migrar `people.json`, `credential.json` o `parent-kids.json`.
- **Sí:** crear únicamente una migración idempotente de datos para completar las tres asignaciones de Caro requeridas por el flujo.
- **No:** modificar la persistencia JSON ni conectar el runtime a Supabase.

## Risks

| Risk                                                                          | Mitigation                                                                                           |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Una invitación puede cruzar tenants si la aplicación envía IDs incompatibles. | Documentar la validación de tenant como requisito obligatorio del caso de uso futuro.                |
| Un parent podría intentar crear invitaciones mediante acceso directo.         | Mantener RLS habilitado sin políticas ni grants cliente hasta implementar claims y políticas.        |
| El estado `expired` puede quedar desactualizado.                              | Hacer que la aplicación lo actualice al validar o listar invitaciones; no depender solo de la fecha. |
| Un admin o staff podría no tener acceso a la sala del niño.                   | Exigir `staff_rooms` para ambos roles y asignar Caro a las tres salas actuales.                      |
| La asignación de Caro podría duplicarse.                                      | Usar la PK compuesta de `staff_rooms` y una inserción idempotente.                                   |
| Las FKs de invitaciones pueden ralentizar joins futuros.                      | Crear índices en todas las columnas de relación y validar advisors de rendimiento.                   |
| El código de invitación podría quedar expuesto mediante Data API.             | No crear políticas ni grants adicionales y mantener RLS habilitado.                                  |

## What is **not** in this spec

- Seed de `invitation.json`.
- Migración de `people.json`, `credential.json` o `parent-kids.json`.
- Creación o aceptación de invitaciones desde SQL.
- Creación de usuarios parent o credenciales.
- Creación de relaciones `parent_children`.
- Funciones, triggers o jobs de autorización, activación o expiración.
- Políticas RLS de negocio.
- Grants nuevos a clientes.
- Repositorios, clientes o adaptadores Supabase.
- Cambios en el runtime o en la persistencia JSON.
