# SPEC 29 — Persistencia PostgreSQL de Auth e invitaciones

> **Status:** Draft
> **Depends on:** SPEC 28
> **Date:** 2026-11-05
> **Objective:** Implementar los adapters PostgreSQL de personas, credenciales e invitaciones y transportar `daycareId` por login, sesión y aceptación de invitaciones sin activar todavía PostgreSQL en el runtime normal.

## Why this spec exists

El email puede repetirse en distintas guarderías. La autenticación debe seleccionar el tenant antes de buscar la persona, mientras los IDs PostgreSQL deben permanecer separados de los IDs JSON hasta el cutover global.

## Scope

**In:**

- Implementar repositorios PostgreSQL de `people`, `credential`, `invitation`.
- Implementar el flujo de aceptación de invitación usando una transacción PostgreSQL.
- Añadir `daycareId` al formulario/login mediante query string.
- Transportar y validar `daycareId` en JWT y sesión NextAuth.
- Añadir `daycareId` a los enlaces de invitación.
- Crear pruebas remotas opt-in con rollback para Auth e invitaciones.
- Mantener runtime productivo en JSON hasta SPEC 32.

**Out of scope (for future specs):**

- Supabase Auth o migración a `auth.users`.
- Crear o modificar restricciones o funciones en la base.
- Cambiar bcrypt, cookies, estrategia JWT o reglas de sesión fuera del tenant.
- Activar repositorios PostgreSQL en rutas productivas antes del cutover.
- Crear administración de guarderías.

## Data model

```ts
type AuthenticatedPerson = {
  personId: string;
  daycareId: string;
  role: PersonRole;
};
```

El login utilizará una URL equivalente a:

```text
/auth/login?daycareId=<uuid>
```

El enlace de invitación utilizará:

```text
/auth/parent-invitation/<token>?daycareId=<uuid>
```

Las búsquedas deberán usar siempre:

```text
(daycare_id, lower(email))
(daycare_id, id)
(daycare_id, code)
```

## Implementation plan

1. Crear los mappers PostgreSQL de `Person`, `Credential` e `Invitation`.
2. Implementar `PostgresPersonRepository`, incluyendo búsqueda por `daycareId + email`.
3. Implementar `PostgresCredentialRepository`, incluyendo búsqueda por `daycareId + personId` y upsert seguro.
4. Implementar `PostgresInvitationRepository`, incluyendo búsqueda, creación y timestamps de envío/aceptación.
5. Crear el port de transacción de Auth que ejecute la aceptación dentro de una transacción PostgreSQL.
6. Implementar la aceptación atómica de invitación: relación, credential, activación de persona y `acceptedAt`.
7. Añadir `daycareId` al formulario de login y validarlo antes de autenticar.
8. Añadir `daycareId` a los callbacks JWT/session y validar que coincida con la persona recuperada.
9. Añadir `daycareId` a la creación y navegación de invitaciones.
10. Probar login, aceptación, rollback y aislamiento tenant contra PostgreSQL remoto con opt-in y rollback.
11. Verificar que la app normal continúa usando JSON y que las rutas existentes siguen funcionando.

## Acceptance criteria

- [ ] No existe búsqueda de persona por email sin `daycareId`.
- [ ] Dos personas con el mismo email en distintas guarderías pueden autenticarse seleccionando tenants distintos.
- [ ] Un email correcto con `daycareId` incorrecto no autentica.
- [ ] JWT y sesión contienen `daycareId`.
- [ ] Una sesión con `personId` y `daycareId` incompatibles se rechaza.
- [ ] Los enlaces de invitación incluyen el tenant.
- [ ] Un token consultado con otro `daycareId` no devuelve la invitación.
- [ ] La aceptación actualiza todas las entidades relacionadas dentro de una transacción.
- [ ] Un error durante aceptación revierte relación, credential, persona e invitación.
- [ ] Las pruebas PostgreSQL no usan los JSON del módulo.
- [ ] Las pruebas remotas requieren `RUN_REMOTE_DB_TESTS`.
- [ ] Las pruebas remotas revierten todas sus escrituras.
- [ ] El login y la aceptación JSON existentes continúan funcionando antes del cutover.
- [ ] No se modifica Supabase Auth ni la lógica de passwords.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.

## Decisions

- **Sí:** usar `daycareId` en la query string para conservar las rutas actuales.
- **Sí:** seleccionar el tenant antes de buscar por email.
- **No:** buscar globalmente por email, porque puede repetirse entre guarderías.
- **Sí:** mantener NextAuth como proveedor de autenticación.
- **Sí:** probar PostgreSQL mediante adapters dedicados sin cambiar el runtime JSON.
- **No:** añadir una traducción temporal de IDs entre JSON y PostgreSQL.

## Risks

| Risk | Mitigation |
| --- | --- |
| El usuario omite o manipula `daycareId`. | Validar UUID, consultar la guardería y comprobar pertenencia en cada operación. |
| Aceptaciones concurrentes duplican la relación. | Transacción, lectura bloqueada y manejo del error de unicidad existente. |
| Las sesiones existentes contienen IDs JSON. | Invalidarlas durante SPEC 32 antes de activar PostgreSQL. |

## What is **not** in this spec

- Migración a Supabase Auth.
- Cambios de esquema, RLS, grants o funciones SQL.
- Activación productiva de Auth PostgreSQL antes del cutover.
- Administración de guarderías.
