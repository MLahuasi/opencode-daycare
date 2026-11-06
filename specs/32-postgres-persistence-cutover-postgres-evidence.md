# SPEC 32 — Evidencia previa de pruebas PostgreSQL

Este registro corresponde al Paso 2 del cutover y consolida la evidencia de
SPEC 29, SPEC 30 y SPEC 31 antes de cambiar el runtime productivo.

## Matriz de confirmación

| Spec | Módulo | Evidencia ejecutable | Escenarios cubiertos | JSON consumido | Rollback |
| --- | --- | --- | --- | --- | --- |
| 29 | Auth | `runRemoteAuthPersistenceTests` en `remote-auth-tests.ts` | Búsqueda por tenant, mismo email en dos guarderías, credenciales aisladas y rollback de persona, credential, relación e invitación | No | Sí, `withRemoteDbTestTransaction` y verificación posterior de cero filas |
| 30 | Staff | `runRemoteStaffPersistenceTests` en `remote-staff-tests.ts` | Rooms/Kids/ParentKids tenant-scoped, StaffRooms, creación y edición de Post, media ordenada, autorización y rollback de agregado | No | Sí, transacción externa y verificación posterior de cero filas en `feed` |
| 31 | General | `runRemoteGeneralPersistenceTests` en `remote-general-tests.ts` | Family Feed, aislamiento tenant, autorización Staff/padre, detalle, comentarios, reacciones, engagement, edición/borrado y toggle concurrente | No | Sí, `withRemoteDbTestTransaction` para todo el escenario |

## Confirmaciones técnicas

- Los tres entry points están exportados desde
  `src/infrastructure/persistence/postgres/index.ts`.
- Todos usan IDs UUID generados durante la prueba; no dependen de IDs de
  snapshots JSON.
- Los imports de los tres escenarios apuntan exclusivamente a repositorios,
  composiciones y transacciones PostgreSQL.
- `withRemoteDbTestTransaction` no ejecuta nada salvo que
  `RUN_REMOTE_DB_TESTS=true` y fuerza `ROLLBACK` incluso después de un
  escenario exitoso.
- Los errores de escenario también provocan rollback y se propagan sin
  confirmar datos.
- La verificación de Auth y Staff consulta después de la transacción que las
  filas de prueba no persisten.

## Validación realizada en este paso

- Se revisaron los criterios de aceptación de SPEC 29, SPEC 30 y SPEC 31.
- Se inspeccionaron los tres entry points y el helper transaccional remoto.
- `npx tsc --noEmit --incremental false` terminó correctamente.

La ejecución contra la base remota permanece explícitamente opt-in: no se
lanza desde el flujo normal ni se habilita sin `RUN_REMOTE_DB_TESTS=true`.

**Conclusión del Paso 2:** existe evidencia PostgreSQL por Auth, Staff y
General; los escenarios no consumen JSON y sus escrituras se revierten antes
del cutover.
