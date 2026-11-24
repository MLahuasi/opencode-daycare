# OpenDayCare

OpenDayCare es una aplicación Next.js para gestionar una guardería ficticia,
con feeds diferenciados para personal y familias, perfiles de niños,
invitaciones de padres y persistencia PostgreSQL tenant-scoped.

## Stack

- Next.js 16 con App Router y React 19.
- TypeScript estricto, Tailwind CSS 4 y CSS Modules.
- NextAuth con Credentials Provider y sesiones JWT.
- PostgreSQL mediante `postgres.js` y Supabase Session Pooler IPv4.
- npm como gestor de paquetes.

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Un proyecto Supabase para la base de datos.
- Credenciales SMTP y Cloudinary para las funcionalidades que las utilizan.

## Desarrollo local

```bash
npm install
copy .env.template .env.local
npm run dev
```

La aplicación se inicia en [http://localhost:3000](http://localhost:3000).
Completa `.env.local` con valores locales. Los archivos `.env*` están ignorados
por Git; solo `.env.template` se versiona. Nunca guardes secretos reales en Git.

### Dónde ejecutar los comandos

Todos los comandos `npm`, `npx supabase` y PowerShell de este documento se
ejecutan desde la raíz del repositorio, donde están `package.json`,
`supabase/config.toml` y la carpeta `supabase/`. En Windows se recomienda usar
PowerShell; en CI o Linux se puede usar un shell equivalente con las mismas
variables de entorno.

Las migraciones y consultas se ejecutan con **Supabase CLI 3.0.0**, invocada de
forma reproducible mediante `npx --yes supabase@3.0.0`. No se usa Supabase MCP,
el cliente JavaScript de Supabase ni `psql` para aplicar migraciones. Los
scripts `db:migrate*` de `package.json` son atajos sobre `supabase db push`:

- `db:migrate:local:*`: usa el proyecto Supabase local levantado por Docker.
- `db:migrate:*`: usa el proyecto remoto seleccionado con `supabase link`.
- `supabase db query --remote`: ejecuta consultas SQL remotas de lectura o
  prevalidación con el mismo cliente CLI.

La sentencia `ALTER ROLE` del usuario auditor no se ejecuta desde la aplicación
ni desde una migración: se ejecuta una sola vez en el SQL Editor autorizado de
Supabase, o mediante el procedimiento administrativo equivalente del proveedor.

### Variables de entorno

Las variables server-only requeridas por la aplicación son:

| Grupo | Variables |
| --- | --- |
| Aplicación | `APP_URL`, `APP_LOCALE`, `APP_TIME_ZONE` |
| Autenticación | `AUTH_SECRET`, `AUTH_SESSION_MAX_AGE_SECONDS`, `AUTH_SESSION_COOKIE_NAME`, `AUTH_SESSION_COOKIE_HTTP_ONLY`, `AUTH_SESSION_COOKIE_SECURE`, `AUTH_SESSION_COOKIE_SAME_SITE`, `AUTH_SESSION_COOKIE_PATH`, `AUTH_SIGN_IN_PATH`, `NEXTAUTH_URL` |
| Base de datos | `SUPABASE_DB_HOST`, `SUPABASE_DB_PORT`, `SUPABASE_DB_USERNAME`, `SUPABASE_DB_PASSWORD` |
| Correo | `MAILER_EMAIL`, `MAILER_SECRET_KEY`, `MAILER_FROM`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_TEMPLATE_EXTENSION` |
| Imágenes | `CLOUDINARY_URL` |

Para pruebas o herramientas se pueden configurar adicionalmente
`RUN_REMOTE_DB_TESTS`, `SECURITY_AUDITOR_DB_PASSWORD`,
`SECURITY_AUDITOR_DB_URL` y `CONTEXT7_API_KEY`. No son necesarias para arrancar
la aplicación en producción. Los límites HTTP y credenciales `E2E_*` pertenecen
al entorno local de pruebas y no deben publicarse.

`.env.template` es la referencia comentada y contiene también las variables
reservadas para herramientas o pruebas externas. La comparación con el `.env`
local usado durante las pruebas confirma que tiene el mismo conjunto de claves;
el `.env` local contiene repetidas `APP_LOCALE`, `APP_TIME_ZONE` y
`NEXTAUTH_URL`, que deben quedar definidas una sola vez para evitar valores
ambiguos.

`MAIL_TEMPLATE_PATH` no se configura en `.env`: se deriva de la carpeta
`templates/`, que debe existir en el directorio de ejecución.

### Docker y Supabase local

Docker solo se usa para ejecutar el stack local de Supabase. Instala y arranca
Docker Desktop antes de ejecutar estos comandos:

```bash
npx supabase start
npm run db:migrate:local:dry-run
npm run db:migrate:local
npx supabase status
```

Estos comandos se ejecutan desde la raíz del repositorio en una terminal local.
`supabase start` crea los contenedores; `db:migrate:local` usa ese stack y no
modifica el proyecto remoto.

Al terminar el trabajo local puedes detenerlo con:

```bash
npx supabase stop
```

`npm run dev` no requiere Docker si la aplicación apunta a una base PostgreSQL
accesible mediante las variables `SUPABASE_DB_*`. El despliegue de producción
tampoco usa Docker de este repositorio: utiliza el proyecto Supabase remoto y
el runtime Node.js del proveedor de hosting.

Usa `npm run db:seed` únicamente al aprovisionar una base remota nueva y vacía.
No lo ejecutes sobre una base con datos históricos.

Después de ejecutar el seed en una base nueva, el acceso inicial de desarrollo
es:

```text
Email: caro@opendaycare.com
Password: OpenDayCare1!
```

Estas credenciales están destinadas únicamente al bootstrap local o a una base
de demostración recién creada. Rota la contraseña y crea cuentas administradas
antes de permitir cualquier acceso real; nunca las uses en producción.

## Paso a producción

### 1. Preparar la base de datos

Enlaza explícitamente el proyecto Supabase de producción y revisa las
migraciones antes de aplicarlas. Primero confirma el proyecto destino:

Estos comandos se ejecutan en PowerShell desde la raíz del repositorio. El
cliente Supabase usa el proyecto asociado por `supabase link` y las credenciales
administrativas configuradas fuera de Git:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
```

Antes de aplicar cambios, ejecuta las prevalidaciones remotas de la sección
**Comandos PowerShell y cliente PostgreSQL/Supabase**. Si los contadores no son
`0`, detén el proceso y corrige los datos mediante una migración aprobada.

### Migración remota y usuario auditor

La migración `20261117230000_provision_security_auditor.sql` crea el rol
`security_auditor` como `NOLOGIN`, sin contraseña, con permisos de lectura
limitados y `BYPASSRLS` desactivado. Este rol es opcional y solo se usa para
auditorías remotas de lectura; no es la cuenta con la que el personal inicia
sesión en OpenDayCare.

#### Dónde ejecutar `ALTER ROLE`

Después de que `npm run db:migrate` termine correctamente, un administrador del
proyecto debe abrir el **Dashboard de Supabase del proyecto remoto autorizado**
y entrar en **SQL Editor → New query**. La sentencia se ejecuta allí, conectada
al proyecto remoto correcto:

```sql
alter role security_auditor
  login
  password '<auditor-password-managed-outside-git>';
```

#### Cómo generar y configurar la contraseña

Genera la contraseña en un gestor de secretos o temporalmente con PowerShell.
Este comando produce un valor aleatorio Base64URL sin comillas simples, para
que pueda usarse de forma segura en la sentencia SQL:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$auditorPassword = [Convert]::ToBase64String($bytes).TrimEnd('=')
$auditorPassword = $auditorPassword.Replace('+', '-').Replace('/', '_')
$auditorPassword
```

1. Copia el valor generado directamente al placeholder de la sentencia en
   **Supabase Dashboard → SQL Editor → New query** y pulsa **Run**:

   ```sql
   alter role security_auditor
     login
     password '<valor-generado>';
   ```

2. Guarda el mismo valor en el gestor de secretos del entorno que ejecutará las
   auditorías. Para una ejecución local, configúralo en `.env` (ignorado por
   Git) como:

   ```dotenv
   SECURITY_AUDITOR_DB_PASSWORD=<el-mismo-valor-generado>
   SECURITY_AUDITOR_DB_URL=postgresql://security_auditor.<PROJECT_REF>@<POOLER_HOST>:5432/postgres?sslmode=require
   ```

   En CI o producción, configura esas dos variables en el gestor de secretos
   del proveedor, no en un archivo versionado.

3. `SECURITY_AUDITOR_DB_PASSWORD` es únicamente para el cliente auditor. No es
   la contraseña de la aplicación, no reemplaza `SUPABASE_DB_PASSWORD` y no se
   necesita para que OpenDayCare arranque.

No ejecutes esta sentencia desde PowerShell, Docker local, `supabase db query`,
una migración versionada ni Supabase MCP.

No incluyas esta sentencia ni la contraseña en una migración, commit, log o
prompt. Guarda la contraseña fuera de Git y configura
`SECURITY_AUDITOR_DB_URL` y `SECURITY_AUDITOR_DB_PASSWORD` únicamente en el
entorno del auditor.

Verifica la sesión del auditor con una conexión remota de solo lectura:

```sql
select current_user,
       current_setting('transaction_read_only');
```

El resultado debe identificar `security_auditor` y mostrar `on`. Comprueba
también que no tenga privilegios `INSERT`, `UPDATE` o `DELETE`. El auditor no
usa Docker, Supabase MCP ni credenciales administrativas para sus consultas.

### Comandos PowerShell y cliente PostgreSQL/Supabase

No escribas contraseñas en scripts ni en la URL. Carga temporalmente los
valores desde `.env` en una sesión de PowerShell:

```powershell
function Get-DotEnvValue([string]$Name) {
  $line = Get-Content .env |
    Where-Object { $_ -match "^\s*$([regex]::Escape($Name))=" } |
    Select-Object -First 1

  if (-not $line) { throw "No se encontró $Name en .env" }
  return (($line -split "=", 2)[1]).Trim().Trim('"').Trim("'")
}

$adminPassword = Get-DotEnvValue "SUPABASE_DB_PASSWORD"
$adminDbHost = Get-DotEnvValue "SUPABASE_DB_HOST"
$adminDbPort = Get-DotEnvValue "SUPABASE_DB_PORT"
$adminDbUsername = Get-DotEnvValue "SUPABASE_DB_USERNAME"
$adminDbUrl = "postgresql://{0}@{1}:{2}/postgres?sslmode=require" -f `
  $adminDbUsername, $adminDbHost, $adminDbPort
$auditorPassword = Get-DotEnvValue "SECURITY_AUDITOR_DB_PASSWORD"
$auditorDbUrl = Get-DotEnvValue "SECURITY_AUDITOR_DB_URL"

foreach ($value in @($adminDbUrl, $auditorDbUrl)) {
  if ([string]::IsNullOrWhiteSpace($value) -or $value.Contains('<')) {
    throw "La URL contiene un placeholder o está vacía"
  }
}

$env:SUPABASE_DB_PASSWORD = $adminPassword
```

Genera `AUTH_SECRET` fuera del repositorio y guárdalo en el gestor de secretos:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Para ejecutar una prevalidación remota sin mostrar credenciales, crea un SQL
temporal y ejecútalo con el cliente Supabase en modo solo lectura:

```powershell
$env:PGPASSWORD = $adminPassword

$precheckSql = @'
select
  (
    select count(*)
    from (
      select daycare_id, person_id
      from public.credential
      group by daycare_id, person_id
      having count(*) > 1
    ) duplicates
  ) as credential_duplicate_groups,
  (
    select count(*)
    from (
      select daycare_id, code
      from public.invitation
      group by daycare_id, code
      having count(*) > 1
    ) duplicates
  ) as invitation_duplicate_groups;
'@

$precheckPath = Join-Path $env:LOCALAPPDATA "Temp\migration-prevalidation.sql"
[System.IO.File]::WriteAllText(
  $precheckPath,
  $precheckSql,
  [System.Text.UTF8Encoding]::new($false)
)

npx --yes supabase@3.0.0 db query `
  --remote="$adminDbUrl" `
  --read-only `
  --file="$precheckPath"

Remove-Item $precheckPath -ErrorAction SilentlyContinue
Remove-Variable precheckSql, precheckPath -ErrorAction SilentlyContinue
```

Los dos contadores deben ser `0`. Para verificar el usuario auditor usa su URL
remota y contraseña, siempre con `--read-only`:

```powershell
$env:PGPASSWORD = $auditorPassword

npx --yes supabase@3.0.0 db query `
  --remote="$auditorDbUrl" `
  --read-only `
  "select current_user, current_database(), current_setting('transaction_read_only');"

npx --yes supabase@3.0.0 db query `
  --remote="$auditorDbUrl" `
  --read-only `
  "select
     has_table_privilege(current_user, 'public.people', 'SELECT') as can_select,
     has_table_privilege(current_user, 'public.people', 'INSERT') as can_insert,
     has_table_privilege(current_user, 'public.people', 'UPDATE') as can_update,
     has_table_privilege(current_user, 'public.people', 'DELETE') as can_delete;"
```

Limpia las variables temporales al terminar:

```powershell
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:SUPABASE_DB_PASSWORD -ErrorAction SilentlyContinue
Remove-Variable adminPassword, adminDbHost, adminDbPort, adminDbUsername, `
  adminDbUrl, auditorPassword, auditorDbUrl `
  -ErrorAction SilentlyContinue
```

`db:migrate` aplica únicamente las migraciones versionadas en
`supabase/migrations/`. El seed no forma parte del despliegue normal; úsalo solo
para una base nueva, después de verificar el proyecto destino:

```bash
npm run db:migrate:dry-run
npm run db:migrate
npm run db:migrate:dry-run
```

El segundo dry-run debe confirmar que no quedan migraciones pendientes. Para un
proyecto Supabase nuevo y vacío, el seed se ejecuta explícitamente después de
aplicar la estructura:

```bash
npm run db:seed
```

### 2. Configurar secretos y variables

Configura las variables en el gestor de secretos del proveedor de hosting, no
en el repositorio. Como mínimo, producción necesita:

```dotenv
APP_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
APP_LOCALE=es-EC
APP_TIME_ZONE=America/Guayaquil

AUTH_SECRET=<random-secret>
AUTH_SESSION_COOKIE_SECURE=true

SUPABASE_DB_HOST=<session-pooler-host>
SUPABASE_DB_PORT=5432
SUPABASE_DB_USERNAME=postgres.<PROJECT_REF>
SUPABASE_DB_PASSWORD=<database-password>

MAILER_EMAIL=<sender>
MAILER_SECRET_KEY=<smtp-secret>
MAILER_FROM=<sender>
MAIL_HOST=<smtp-host>
MAIL_PORT=587
MAIL_SECURE=true

CLOUDINARY_URL=<cloudinary-url>
```

Usa el nombre exacto de cada variable definido en `.env.template`. En
producción, `APP_URL` y `NEXTAUTH_URL` deben usar HTTPS y
`AUTH_SESSION_COOKIE_SECURE` debe ser `true`. Las variables de base de datos,
mailer, Cloudinary y autenticación son server-only; nunca las expongas como
`NEXT_PUBLIC_*`.

La plantilla `templates/parent-invitation.html` debe estar disponible en el
runtime. Si el proveedor usa un paquete standalone, incluye también la carpeta
`templates/` junto con el artefacto generado por Next.js.

### 3. Construir y arrancar la aplicación

Ejecuta las validaciones en CI o antes del despliegue:

```bash
npm ci
npm run lint
npx tsc --noEmit --incremental false
npm run build
npm run start
```

El servidor escucha en el puerto `3000`. Usa el dominio o proxy HTTPS del
proveedor para exponerlo públicamente. El bootstrap valida la configuración,
inicializa las fachadas server-only y comprueba PostgreSQL con `SELECT 1`; si
falla la configuración o la conexión, la aplicación no debe considerarse lista.

### 4. Verificar el despliegue

Después de publicar:

1. Confirma que el proceso está escuchando en el puerto configurado.
2. Abre `/auth/login` y comprueba el login con una cuenta administrada de
   producción.
3. Comprueba `/home`, `/account` y una operación autorizada de cada rol.
4. Verifica una invitación de padre si el mailer está habilitado.
5. Revisa los logs de readiness sin mostrar secretos, cookies, tokens, headers
   ni cuerpos de respuesta.

Para un rollback, detén el tráfico autenticado, vuelve a una versión compatible
con el esquema PostgreSQL actual, verifica `SELECT 1` y repite los smoke tests.
No reactives repositorios JSON ni ejecutes el seed como mecanismo de rollback.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Desarrollo local en el puerto 3000 |
| `npm run lint` | ESLint |
| `npx tsc --noEmit --incremental false` | Typecheck |
| `npm run build` | Build de producción |
| `npm run start` | Ejecutar el build de producción |
| `npm run db:migrate:local:dry-run` | Revisar migraciones contra Supabase local |
| `npm run db:migrate:local` | Aplicar migraciones al stack local |
| `npm run db:migrate:dry-run` | Revisar migraciones del proyecto remoto enlazado |
| `npm run db:migrate` | Aplicar migraciones al proyecto remoto enlazado |
| `npm run db:seed` | Seed explícito de una base remota nueva y vacía |

## Rutas principales

- `/home`: feed según el rol autenticado.
- `/account`: cuenta del personal.
- `/family-feed`: feed familiar.
- `/family-feed/account`: cuenta familiar.
- `/kids` y `/kids/[slug]`: listado y perfiles de niños.
- `/auth/login`: inicio de sesión.
- `/auth/parent-invitation/[token]`: activación de invitaciones de padres.
- `/posts/*`: publicaciones y comentarios.

La raíz `/` redirige permanentemente a `/home`. Las rutas legacy no forman parte
del contrato público.

## Organización y documentación

- `src/app/`: rutas, páginas y Server Actions.
- `src/application/`: casos de uso y puertos.
- `src/domain/`: reglas y modelos de dominio.
- `src/presentation/`: UI, navegación y componentes compartidos de cuenta.
- `src/composition/`: ensamblaje de Application e Infrastructure.
- `src/infrastructure/`: PostgreSQL y proveedores server-only.
- `supabase/migrations/`: migraciones versionadas.

La presentación compartida de cuenta está en `src/presentation/account/` y
reutiliza componentes de `src/presentation/ui/` sin mezclar las autorizaciones
de familia y personal. Para las reglas completas de arquitectura, límites
server/client y flujo de agentes, consulta `AGENTS.md` y `architecture.md`.
