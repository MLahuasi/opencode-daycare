# SPEC 32 — Cutover global de persistencia PostgreSQL

> **Status:** Draft
> **Depends on:** SPEC 28, SPEC 29, SPEC 30, SPEC 31
> **Date:** 2026-11-05
> **Objective:** Activar PostgreSQL como única fuente runtime de datos, retirar los adapters JSON del runtime y conservar los JSON únicamente como snapshot inmutable de migración.

## Why this spec exists

Las specs anteriores implementan y prueban adapters por módulo sin mezclar IDs. Esta spec coordina el cambio final para que Auth, Staff y General usen el mismo `daycareId`, las mismas identidades PostgreSQL y las mismas relaciones.

## Scope

**In:**

- Cambiar Composition para ensamblar adapters PostgreSQL en Auth, Staff y General.
- Activar la resolución de tenant en login y sesión.
- Invalidar sesiones NextAuth que contengan IDs JSON incompatibles.
- Retirar imports y repositorios JSON del runtime productivo.
- Mantener intactos los 11 JSON como snapshot no editable.
- Verificar la aplicación completa con PostgreSQL remoto.
- Documentar el nuevo origen runtime y el procedimiento de rollback operativo.

**Out of scope (for future specs):**

- Crear o modificar tablas, constraints, funciones, policies, grants o seeds.
- Eliminar físicamente los JSON.
- Eliminar inmediatamente el código JSON si todavía se necesita para migraciones futuras.
- Crear administración de guarderías.
- Migrar a Supabase Auth.
- Cambiar reglas funcionales, UI o navegación.

## Data model

Después del cutover, toda entidad runtime persistida debe contener `daycareId` y usar IDs de PostgreSQL.

La configuración y documentación deben distinguir:

```text
Runtime source: PostgreSQL/Supabase
Migration snapshot: src/infrastructure/persistence/json/data/*.json
```

No se debe mantener un modo híbrido por módulo.

## Implementation plan

1. Crear una matriz de verificación de todos los consumidores de repositorios JSON.
2. Confirmar que SPEC 29, 30 y 31 tienen pruebas PostgreSQL exitosas y rollback validado.
3. Cambiar las composiciones de Auth, Staff y General para usar adapters PostgreSQL.
4. Cambiar Auth para crear y validar sesiones con IDs PostgreSQL y `daycareId`.
5. Ejecutar una invalidación controlada de sesiones antiguas antes de aceptar tráfico autenticado.
6. Verificar login, invitaciones, Kids, Rooms, ParentKids, Posts, Family Feed, comentarios y reacciones.
7. Buscar imports runtime de `@/infrastructure/persistence/json` y eliminarlos de rutas, Composition y Auth.
8. Mantener los JSON byte a byte sin escrituras durante la ejecución de la aplicación.
9. Actualizar README y documentación de arquitectura para declarar PostgreSQL como fuente runtime.
10. Ejecutar validación final de lint, typecheck, build, pruebas remotas opt-in y smoke tests de rutas.

## Acceptance criteria

- [ ] Auth, Staff y General usan adapters PostgreSQL en runtime.
- [ ] Ninguna ruta productiva lee JSON para obtener datos de negocio.
- [ ] Ningún repositorio runtime combina una entidad JSON con una entidad PostgreSQL.
- [ ] Las sesiones activas anteriores al cutover no permiten acceder con IDs JSON.
- [ ] Login exige y conserva el `daycareId` seleccionado.
- [ ] Invitaciones usan `daycareId` para crear, consultar y aceptar relaciones.
- [ ] Kids, Rooms, People, ParentKids y StaffRooms se aíslan por tenant.
- [ ] Posts reconstruyen correctamente destinatarios y media desde tablas normalizadas.
- [ ] Family Feed, detalle, comentarios y reacciones usan datos PostgreSQL.
- [ ] Las reglas funcionales existentes permanecen sin cambios.
- [ ] Los 11 JSON permanecen sin modificar byte a byte.
- [ ] Los adapters JSON no forman parte del camino runtime productivo.
- [ ] La aplicación inicia sin errores usando las credenciales existentes.
- [ ] Las pruebas remotas requieren `RUN_REMOTE_DB_TESTS` y revierten sus escrituras.
- [ ] Las rutas Auth, Staff y General pasan smoke tests con datos PostgreSQL.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.

## Decisions

- **Sí:** realizar un cutover global porque los IDs JSON y PostgreSQL no son compatibles.
- **No:** activar por separado Auth, Staff o General en producción.
- **Sí:** conservar los JSON como snapshot de migración.
- **No:** mantener un flag de fallback JSON en runtime.
- **Sí:** invalidar sesiones antiguas para evitar referencias a personas inexistentes en PostgreSQL.
- **No:** modificar el esquema remoto durante el cutover.
- **Sí:** considerar PostgreSQL la única fuente runtime después de esta spec.

## Risks

| Risk | Mitigation |
| --- | --- |
| Sesiones antiguas apuntan a IDs JSON. | Invalidarlas antes de activar el tráfico PostgreSQL. |
| Un consumidor olvidado sigue leyendo JSON. | Buscar imports, ejecutar smoke tests y revisar el grafo de Composition. |
| La app queda parcialmente migrada. | Cambiar las composiciones en una única operación coordinada. |
| Se modifican accidentalmente los snapshots. | Verificar hashes antes y después del cutover. |

## What is **not** in this spec

- DDL o cambios remotos de Supabase.
- Políticas RLS o grants.
- Eliminación física de los JSON.
- Administración de guarderías.
- Supabase Auth.
