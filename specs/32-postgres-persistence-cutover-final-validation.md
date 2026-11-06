# SPEC 32 — Validación final

Registro del Paso 10.

## Resultados

| Validación | Resultado | Evidencia |
| --- | --- | --- |
| ESLint | PASS | `npx eslint src` |
| TypeScript | PASS | `npx tsc --noEmit --incremental false` |
| Build | PASS | `npm run build` |
| Pruebas remotas opt-in | SKIPPED | `RUN_REMOTE_DB_TESTS` no está habilitado en el entorno de ejecución |
| Smoke `/auth/login` | PASS | `.playwright-mcp/Spec32/auth-login.txt` |
| Smoke `/auth/parent-invitation` | PASS | Navegación pública sin error de servidor |
| Smoke `/home` | PASS | Redirige a `/auth/login` sin sesión |
| Smoke `/kids` | PASS | Redirige a `/auth/login` sin sesión |
| Smoke `/family-feed` | PASS | Redirige a `/auth/login` sin sesión |
| Smoke `/posts/new` | PASS | Redirige a `/auth/login` sin sesión |

## Pruebas remotas

Las pruebas remotas no se ejecutan implícitamente. Requieren habilitar
explícitamente `RUN_REMOTE_DB_TESTS=true` junto con las credenciales PostgreSQL
server-only. Los entry points y su rollback están documentados en
`specs/32-postgres-persistence-cutover-postgres-evidence.md`.

No se realizaron escrituras remotas en esta validación.

## Smoke tests autenticados

Los smoke tests de rutas protegidas validaron el guard de sesión y la
redirección sin sesión. La ejecución autenticada contra datos PostgreSQL queda
condicionada a habilitar las pruebas remotas opt-in y aportar una identidad de
prueba válida; no se inventaron credenciales ni se realizaron escrituras.
