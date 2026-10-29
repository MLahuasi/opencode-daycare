# SPEC DATABASE 02 — Módulo auth: `users` y `credentials`

> **Status:** Implemented
> **Depends on:** SPEC DATABASE 01, SPEC 26
> **Date:** 2026-10-29
> **Objective:** Crear las tablas `users` y `credentials` con sus enums, relación y seed de ejemplo para Caro Giménez mediante migraciones versionadas aplicadas a Supabase.

## Scope

**In:**

- Crear scripts SQL versionados en `src/infrastructure/persistence/migrations/`.
- Crear los enums `user_role` y `user_status`.
- Crear `public.users`.
- Crear `public.credentials`.
- Relacionar `credentials.user_id` con `users.id`.
- Vincular el usuario a `Guardería Sala Soles`.
- Habilitar RLS en ambas tablas.
- Crear un seed idempotente únicamente para Caro Giménez.
- Aplicar migraciones y seed a Supabase.
- Mantener intactos los JSON y el runtime.

**Out of scope (for future specs):**

- Migrar todos los registros de `people.json`.
- Migrar todos los registros de `credential.json`.
- Crear políticas RLS de negocio.
- Cambiar la autenticación propia.
- Vincular usuarios con `auth.users`.
- Crear repositorios o clientes Supabase.
- Crear mapas de IDs legacy.
- Crear recuperación, login o sesiones.

## Data model

### Enum `user_role`

```text
parent
staff
admin
```

El valor JSON `personal` se normaliza a `staff`.

### Enum `user_status`

```text
pending
active
inactive
```

### `public.users`

| Column                     | PostgreSQL type | Null/default/constraint                         |
| -------------------------- | --------------- | ----------------------------------------------- |
| `id`                       | `uuid`          | PK, NOT NULL; generado por seed/auth            |
| `daycare_id`               | `uuid`          | NOT NULL, FK → `daycares.id` ON DELETE RESTRICT |
| `role`                     | `user_role`     | NOT NULL                                        |
| `status`                   | `user_status`   | NOT NULL, default `active`                      |
| `full_name`                | `text`          | NOT NULL                                        |
| `email`                    | `text`          | NOT NULL, UNIQUE (`daycare_id`, `email`)        |
| `avatar_url`               | `text`          | nullable                                        |
| `notify_on_post`           | `boolean`       | NOT NULL, default `true`                        |
| `daily_summary_enabled`    | `boolean`       | NOT NULL, default `true`                        |
| `created_at`, `updated_at` | `timestamptz`   | NOT NULL, default `now()`                       |

### `public.credentials`

| Column                     | PostgreSQL type | Null/default/constraint                             |
| -------------------------- | --------------- | --------------------------------------------------- |
| `id`                       | `uuid`          | PK, NOT NULL, default `gen_random_uuid()`           |
| `user_id`                  | `uuid`          | NOT NULL, UNIQUE, FK → `users.id` ON DELETE CASCADE |
| `password_hash`            | `text`          | NOT NULL                                            |
| `created_at`, `updated_at` | `timestamptz`   | NOT NULL, default `now()`                           |

`credentials` solo será accesible por el backend privilegiado de autenticación.

## Seed inicial

Se insertará únicamente:

```json
{
  "id": "person-caro-gimenez",
  "name": "Caro Giménez",
  "email": "caro@opendaycare.com",
  "role": "personal",
  "status": "active"
}
```

Normalización:

```text
personal → staff
```

Credencial asociada, identificada en `credential.json`:

```text
credential-caro-gimenez
personId: person-caro-gimenez
passwordHash: $2a$12$w/T4K04U1TSrCv5CGhh8meKTRdE7wG0/wWnW1Jbj8tylt5k6FyA6a
```

El hash del JSON fuente no validaba la contraseña de prueba en PostgreSQL. Para este seed se generó un nuevo hash bcrypt compatible con `crypt()`; el JSON fuente no se modifica.

Credencial funcional para pruebas:

```text
email: caro@opendaycare.com
password: OpenDayCare1!
```

La contraseña anterior es exclusivamente de prueba para desarrollo y QA. El seed debe persistir únicamente el `password_hash`; nunca debe insertar ni registrar la contraseña en texto plano en la base de datos.

El seed debe:

- Buscar `Guardería Sala Soles`.
- Generar un UUID nuevo para `users.id`.
- Insertar el usuario de forma idempotente por `(daycare_id, email)`.
- Insertar la credencial asociada sin duplicarla por `user_id`.
- No persistir el ID legacy `person-caro-gimenez`.

## Implementation plan

1. Crear los enums `user_role` y `user_status`.
2. Crear `public.users` con sus restricciones e índice único.
3. Habilitar RLS en `users`.
4. Crear `public.credentials` con su FK y unicidad por usuario.
5. Habilitar RLS en `credentials`.
6. Crear un seed SQL idempotente para Caro Giménez.
7. Revisar que `password_hash` no quede expuesto mediante políticas públicas.
8. Aplicar la migración a Supabase.
9. Aplicar el seed a Supabase.
10. Verificar tablas, enums, relación, RLS, usuario y credencial.
11. Confirmar que no se modificaron JSON ni runtime.

## Acceptance criteria

- [x] Existe una migración versionada en `src/infrastructure/persistence/migrations/`.
- [x] Existe un seed versionado en el mismo directorio.
- [x] Existen `user_role` y `user_status`.
- [x] `public.users` existe con las columnas especificadas.
- [x] `public.credentials` existe con las columnas especificadas.
- [x] `users.daycare_id` referencia `daycares.id`.
- [x] `credentials.user_id` referencia `users.id`.
- [x] `credentials.user_id` es único.
- [x] `(users.daycare_id, users.email)` es único.
- [x] RLS está habilitado en ambas tablas.
- [x] No existen políticas públicas permisivas.
- [x] Existe Caro Giménez vinculada a `Guardería Sala Soles`.
- [x] El rol persistido es `staff`.
- [x] El estado persistido es `active`.
- [x] Existe su credencial con el hash indicado.
- [x] La credencial de prueba permite autenticarse con `caro@opendaycare.com` y `OpenDayCare1!`.
- [x] Ejecutar el seed nuevamente no duplica usuario ni credencial.
- [x] `password_hash` no es accesible mediante políticas de cliente.
- [x] No se modificaron los JSON existentes.
- [x] No se modificó el runtime.

## Decisions

- **Sí:** cargar únicamente Caro Giménez como ejemplo.
- **Sí:** vincularla a `Guardería Sala Soles`.
- **Sí:** generar un UUID nuevo para `users.id`.
- **Sí:** normalizar `personal` a `staff`.
- **Sí:** crear enums PostgreSQL para rol y estado.
- **Sí:** habilitar RLS sin políticas públicas iniciales.
- **Sí:** hacer el seed idempotente.
- **Sí:** documentar `OpenDayCare1!` como contraseña de prueba para validar el flujo de autenticación.
- **Sí:** usar un hash bcrypt compatible con PostgreSQL para el seed, porque el hash original del JSON no validaba la contraseña de prueba.
- **No:** conservar IDs legacy.
- **No:** vincular `users` con `auth.users`.
- **No:** cargar todos los usuarios o credenciales JSON.

## Risks

| Risk                             | Mitigation                                                             |
| -------------------------------- | ---------------------------------------------------------------------- |
| No existe la guardería esperada. | Fallar el seed explícitamente y no crear usuarios huérfanos.           |
| Se expone `password_hash`.       | Mantener RLS sin políticas de cliente y acceso solo backend.           |
| El seed duplica registros.       | Usar las restricciones únicas de tenant/email y user/credential.       |
| Los enums divergen del dominio.  | Usar exclusivamente los valores definidos en `open-daycare-schema.md`. |

## What is **not** in this spec

- Los demás usuarios y credenciales de los JSON.
- Políticas RLS de negocio.
- Claims o integración con la autenticación propia.
- Migración de datos JSON.
- Repositorios, clientes o adaptadores Supabase.
- Recuperación de contraseña, login o sesiones.
- Contraseñas reales de producción o secretos fuera del usuario de prueba.
