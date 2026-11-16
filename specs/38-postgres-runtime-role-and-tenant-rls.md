# SPEC 38 — Rol runtime PostgreSQL y RLS por tenant

> **Status:** Approved
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

| Risk                                          | Mitigation                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| Una política bloquea una ruta legítima        | Probar cada repositorio con fixtures de dos guarderías en Docker.                   |
| Estado de sesión queda en una conexión pooled | Usar `sql.begin` y `SET LOCAL` dentro de la misma transacción.                      |
| Una función privilegiada amplía el acceso     | Mantenerla privada, fijar `search_path` y probar grants negativos.                  |
| La contraseña operativa queda desincronizada  | Rotarla con procedimiento documentado y verificar readiness después del despliegue. |

## What is **not** in this spec

- Contraseñas o secretos versionados.
- Docker en Vercel o producción.
- Aplicación remota sin confirmación explícita.
- Cambios de Cloudinary o URLs de imágenes.

**Siguiente paso tras aprobación:** `/spec-impl 38-postgres-runtime-role-and-tenant-rls`

---

Para validar manualmente las cinco specs, usa este orden. Haz las pruebas destructivas de login/RLS únicamente en local o staging, nunca contra tráfico real.

1. Preparar entorno

Configura fuera de Git:
SUPABASE_DB_HOST=...
SUPABASE_DB_PORT=...
SUPABASE_DB_USERNAME=open_daycare_runtime.<PROJECT_REF>
SUPABASE_DB_PASSWORD=...
SUPABASE_DB_SSL_MODE=require
Para Playwright:
E2E_DAYCARE_ID=...
E2E_STAFF_EMAIL=...
E2E_STAFF_PASSWORD=...
No imprimas las contraseñas ni las incluyas en comandos guardados.

2. Validación técnica común
   Ejecuta:
   npx eslint src
   npx tsc --noEmit --incremental false
   npm run build
   Para la base local:
   npx supabase start
   npx supabase status
   npx supabase db reset --no-seed
   npx supabase db lint --level error --fail-on error
   Después, si hay credenciales E2E configuradas:
   npm run test:e2e
   Artefactos esperados:
   .playwright-mcp/http-security/

SPEC 34 — Auth multirol y Staff Shell
Datos necesarios
Usa una persona de prueba con:

- Roles admin, personal y teacher.
- Tres salas asignadas.
- Un segundo usuario con solo parent.
- Un usuario activo sin roles en ese daycare.
- Usuarios equivalentes en otro daycare.
  Comprobar

1.  Iniciar sesión con el usuario multirol.
2.  Confirmar que puede entrar al Staff Shell.
3.  Confirmar que aparecen:

- Branding desde daycares.brand_name.
- Nombre y cargo desde people.
- Salas ordenadas determinísticamente.

4.  Confirmar que los roles no forman parte de la identidad de sesión/JWT.
5.  Quitar temporalmente todos los roles del usuario y comprobar que el login falla.
6.  Verificar que teacher permite Kids y Posts.
7.  Verificar que parent conserva únicamente Family Feed.
8.  Confirmar que un rol de otro daycare no concede capacidades en el daycare actual.
9.  Probar Home con:

- Cero niños.
- Cero posts.
- Varias salas.

10. Confirmar que aparece asistencia 0 niños y no se consulta feed_overview.
    Importante: esta spec todavía tiene criterios pendientes relacionados con proyecto nuevo, seed y smoke tests. El proyecto remoto actual contiene información, por lo que no debe considerarse válido como “proyecto nuevo y vacío”.
    SPEC 35 — Kids y consentimiento fotográfico
    Usuarios necesarios

- teacher asignado a la sala del niño.
- teacher no asignado a esa sala.
- Usuario sin rol teacher.
- Usuario parent.
  Autorización Kids
  Para cada usuario:

1. Abrir /kids.
2. Abrir directamente el perfil de un niño.
3. Intentar editarlo.
4. Intentar crear un niño.
5. Intentar invitar a un progenitor.
6. Intentar acceder usando un ID o slug de otro daycare.
   Resultados esperados:
   Usuario Resultado
   Teacher asignado Acceso permitido
   Teacher no asignado 404 o rechazo uniforme
   Sin teacher Sin enlace Kids y 404 directo
   Otro daycare 404, sin revelar existencia
   Confirmar que los errores no muestran si la sala o el niño existen.
   Consentimiento fotográfico
   Probar estas tres situaciones:
7. Cero progenitores activos → operación denegada.
8. Un progenitor activo sin consentimiento → operación denegada.
9. Todos los progenitores activos con consentimiento → operación permitida.
   Repetir la prueba al:

- Crear un post con foto.
- Adjuntar una foto a un post existente.
  Las relaciones inactivas o pendientes no deben contar como consentimiento vigente.
  SPEC 36 — Seguridad HTTP
  Ejecuta:
  npm run test:e2e
  Verifica manualmente con el navegador o curl:
  curl -I http://127.0.0.1:3000/auth/login
  Comprobar:
- Content-Security-Policy presente.
- script-src contiene nonce.
- No contiene 'unsafe-inline'.
- Dos respuestas consecutivas usan nonces diferentes.
- X-Content-Type-Options: nosniff.
- Referrer-Policy correcto.
- Permissions-Policy bloquea cámara y micrófono.
- HSTS no aparece en HTTP local.
- / responde con redirect 308 a /home.
  Con usuario autenticado:

1. Subir una imagen de más de 5 MB → rechazada.
2. Subir una imagen de tipo inválido → rechazada.
3. Subir cinco imágenes → rechazada.
4. Enviar un Server Action superior a 22 MB → rechazada.
5. Enviar headers falsos x-forwarded-for → no deben controlar la IP usada por Auth/rate limiter.
6. Confirmar que solo x-open-daycare-client-ip generado por el proxy llega al runtime.
   La spec tiene pendiente explícito el criterio de Playwright para CSP, headers, IP y límites; no debe marcarse como completo solo con build y lint.
   SPEC 37 — Protección contra abuso del login
   Usa local o staging. No ejecutes estos intentos contra producción.
   Pruebas manuales
7. Login con email inexistente.
8. Login con email válido y contraseña incorrecta.
9. Login bloqueado.
10. Comparar mensajes, códigos y comportamiento: deben ser genéricos.
11. Usar una contraseña superior a 72 bytes UTF-8 → rechazada.
12. Ejecutar cinco fallos para una cuenta → bloqueo de 15 minutos.
13. Ejecutar veinte fallos desde una IP → bloqueo de 15 minutos.
14. Confirmar que el contador expira después de 15 minutos.
15. Login exitoso → limpiar el límite de cuenta.
16. Simular indisponibilidad de PostgreSQL → login rechazado, nunca permitido.
17. Verificar que no aparecen email ni IP en claro en la tabla privada ni en logs.
    La prueba transaccional existente se documenta como:
    runRemoteLoginAbusePersistenceTests
    Debe ejecutarse solo con:
    RUN_REMOTE_DB_TESTS=true
    y contra una base autorizada; las operaciones usan rollback.
    SPEC 38 — Rol runtime y RLS tenant-scoped
    Migraciones
    npm run db:migrate:dry-run
    Debe indicar que no hay migraciones pendientes después de aplicar las migraciones autorizadas.
    Verificación del rol
    Con una consulta administrativa de solo lectura, comprobar:
    select rolname,
    rolcanlogin,
    rolsuper,
    rolcreatedb,
    rolcreaterole,
    rolbypassrls
    from pg_roles
    where rolname = 'open_daycare_runtime';
    Esperado:
    rolcanlogin = true
    rolsuper = false
    rolcreatedb = false
    rolcreaterole = false
    rolbypassrls = false
    Verificación RLS
    Comprobar que las tablas públicas operativas tienen RLS habilitado:
    select count(\*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relrowsecurity;
    Esperado actualmente: 15.
    Aislamiento tenant
    Con el usuario runtime:
18. Consultar sin app.daycare_id → cero filas.
19. Establecer el contexto del daycare A → solo filas de A.
20. Intentar leer filas del daycare B → cero resultados.
21. Intentar actualizar una fila de B → ningún cambio.
22. Intentar insertar una fila con daycare_id de B → bloqueada.
23. Finalizar la transacción.
24. Abrir otra transacción sin contexto → el contexto anterior no debe existir.
25. Intentar crear o alterar tablas → permiso denegado.
26. Verificar que SELECT 1 funciona mediante el cliente runtime.
    No ejecutes estas pruebas de escritura sobre datos reales sin una transacción reversible y autorización.
    Contraseña y Vercel
27. Asignar la contraseña con psql usando:
    \password open_daycare_runtime
28. Configurar en Vercel:
    SUPABASE_DB_HOST
    SUPABASE_DB_PORT
    SUPABASE_DB_USERNAME=open_daycare_runtime.<PROJECT_REF>
    SUPABASE_DB_PASSWORD
    SUPABASE_DB_SSL_MODE=require
29. Desplegar.
30. Revisar readiness.
31. Probar login y una ruta autenticada.
32. Confirmar que no se imprimen secretos.
    Actualmente la migración remota y la verificación del rol/RLS ya fueron realizadas; la configuración de Vercel sigue pendiente porque el CLI estaba desconectado.
    Orden recomendado final
33. Validación técnica común.
34. SPEC 38 en local/staging.
35. SPEC 37 con pruebas de abuso controladas.
36. SPEC 36 con Playwright.
37. SPEC 35 con usuarios y consentimiento.
38. SPEC 34 con escenarios multirol y Home vacío.
39. Revisar cada checkbox de las specs únicamente con evidencia de la prueba correspondiente.
