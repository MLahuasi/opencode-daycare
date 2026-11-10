# SPEC 38 — Rol runtime PostgreSQL y RLS por tenant

> **Status:** Draft
> **Depends on:** SPEC 37
> **Date:** 2026-11-10
> **Objective:** Ejecutar la aplicación con `open_daycare_runtime` y aplicar aislamiento RLS por guardería a todas las tablas operativas con `daycare_id`.

## Why this spec exists

El usuario PostgreSQL de runtime no debe poder modificar el esquema ni saltarse RLS. El aislamiento por guardería debe existir en la base de datos como segunda barrera cuando un repositorio omita accidentalmente un filtro.

## Scope

**In:**

- Crear mediante migración el rol `open_daycare_runtime` con `LOGIN`, `NOBYPASSRLS` y sin contraseña versionada.
- Conceder únicamente los permisos DML necesarios para runtime y las funciones privadas requeridas.
- Crear una función privada singleton para resolver la guardería operativa durante el login previo a sesión.
- Aplicar políticas tenant-scoped a todas las tablas operativas que contengan `daycare_id`.
- Usar contexto transaccional explícito para la guardería y persona autenticadas.
- Añadir índices y funciones `SECURITY DEFINER` solo donde sean imprescindibles, con `search_path` seguro.
- Probar migraciones y RLS desde cero con Docker Desktop antes del dry-run remoto.
- Documentar la provisión manual de contraseña con `psql` y secretos de Vercel.
- Revisar y actualizar de forma acumulada `README.md`, `AGENTS.md` y `architecture.md`.

**Out of scope (for future specs):**

- Contraseña, token o secreto dentro de SQL versionado, Git o `opencode.json`.
- Cambio de proveedor de PostgreSQL o de Supavisor.
- Cambios de Cloudinary.
- Aplicación remota automática sin confirmación explícita posterior al dry-run.

## Data model

El rol y el contexto esperado son:

```sql
-- La contraseña se asigna fuera de la migración.
create role open_daycare_runtime with login nobypassrls;

-- Contexto por transacción, nunca como estado global de una conexión pooled.
set local app.daycare_id = '<uuid>';
set local app.person_id = '<uuid>';
```

Cada política debe impedir acceso cuando el contexto no exista y debe comparar la fila con `(select current_setting('app.daycare_id', true)::uuid)` de forma segura. Las tablas sin `daycare_id` directo deben quedar cubiertas mediante una relación controlada o una función privada equivalente.

## Implementation plan

1. Inventariar tablas, claves foráneas, grants existentes y todas las tablas con `daycare_id`.
2. Crear la migración del rol sin contraseña utilizable, revocar grants amplios y conceder el mínimo necesario.
3. Crear la función privada singleton de daycare operativo para el login pre-sesión.
4. Crear funciones auxiliares de contexto y políticas RLS con `search_path` fijo y consultas indexables.
5. Añadir índices para columnas usadas por políticas y verificar que no se introducen bypasses mediante `SECURITY DEFINER`.
6. Adaptar `databaseClient`, repositorios y composición para usar el rol dedicado y transacciones con `SET LOCAL`.
7. Arrancar Supabase local mediante Docker Desktop, aplicar todas las migraciones desde cero y probar lecturas/escrituras cross-tenant.
8. Ejecutar `npm run db:migrate:dry-run`, revisar el proyecto remoto enlazado y detenerse para confirmación explícita.
9. Tras autorización separada, aplicar `npm run db:migrate` y comprobar grants, rol, RLS y readiness sin imprimir secretos.
10. Asignar la contraseña fuera de Git con `psql`, guardar `SUPABASE_DB_PASSWORD` en secretos de Vercel y usar `open_daycare_runtime.<project-ref>` en Shared Pooler.
11. Completar la revisión acumulada de `README.md`, `AGENTS.md` y `architecture.md`.

## Acceptance criteria

- [ ] Existe `open_daycare_runtime` con `LOGIN` y `NOBYPASSRLS`.
- [ ] Ninguna migración, semilla, log o documentación contiene la contraseña del rol.
- [ ] El rol no puede crear, alterar o eliminar tablas, funciones o roles.
- [ ] Las tablas con `daycare_id` tienen RLS habilitado y políticas tenant-scoped.
- [ ] Una consulta sin contexto de daycare no devuelve datos operativos.
- [ ] Un contexto de daycare no puede leer ni modificar filas de otra guardería.
- [ ] Las funciones `SECURITY DEFINER` tienen propietario, `search_path` y grants mínimos.
- [ ] El login previo a sesión puede resolver únicamente la guardería operativa mediante la función privada.
- [ ] El contexto se limpia al finalizar cada transacción y no se filtra entre conexiones pooled.
- [ ] Docker local aplica todas las migraciones desde cero y ejecuta las pruebas RLS.
- [ ] `npm run db:migrate:dry-run` se ejecuta antes de cualquier migración remota.
- [ ] La aplicación remota queda condicionada a confirmación explícita posterior al dry-run.
- [ ] SQL, Playwright, ESLint, TypeScript y build terminan correctamente.
- [ ] `README.md`, `AGENTS.md` y `architecture.md` describen el flujo final sin secretos.

## Decisions

- **Sí:** `open_daycare_runtime`. Nombre estable para grants, pooler y operación.
- **Sí:** `NOBYPASSRLS`. La aplicación debe estar protegida por las políticas.
- **Sí:** función privada singleton. Resuelve el login inicial sin permitir listar guarderías.
- **Sí:** RLS en todas las tablas con `daycare_id`. Es defensa en profundidad completa.
- **Sí:** contraseña operativa por entorno. Se asigna con `psql` y se guarda en secretos de Vercel.
- **No:** contraseña en migraciones. Las migraciones son públicas y versionadas.
- **No:** ejecutar migración remota automáticamente. Primero se revisa destino y dry-run.

## Risks

| Risk | Mitigation |
| --- | --- |
| Una política bloquea una ruta legítima | Probar cada repositorio con fixtures de dos guarderías en Docker. |
| Estado de sesión queda en una conexión pooled | Usar `sql.begin` y `SET LOCAL` dentro de la misma transacción. |
| Una función privilegiada amplía el acceso | Mantenerla privada, fijar `search_path` y probar grants negativos. |
| La contraseña operativa queda desincronizada | Rotarla con procedimiento documentado y verificar readiness después del despliegue. |

## What is **not** in this spec

- Contraseñas o secretos versionados.
- Docker en Vercel o producción.
- Aplicación remota sin confirmación explícita.
- Cambios de Cloudinary o URLs de imágenes.

**Siguiente paso tras aprobación:** `/spec-impl 38-postgres-runtime-role-and-tenant-rls`
