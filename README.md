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

### Agentes y herramientas por entorno

Los agentes y herramientas no tienen el mismo alcance en desarrollo y
producción. La aplicación OpenDayCare no ejecuta agentes de administración de
base de datos durante el runtime web.

#### Desarrollo y pruebas

| Agente o herramienta | Uso |
| --- | --- |
| **OpenCode** | Implementar, revisar y validar cambios del repositorio. |
| **Context7 MCP** | Consultar documentación técnica desde OpenCode mediante `CONTEXT7_API_KEY`; no pertenece a la aplicación. |
| **Supabase CLI** | Arrancar Supabase local, revisar/aplicar migraciones y ejecutar consultas autorizadas. |
| **Docker Desktop** | Ejecutar el stack local de Supabase para pruebas aisladas. |
| **Pruebas PostgreSQL remotas** | Pruebas autorizadas protegidas por `RUN_REMOTE_DB_TESTS=true` y rollback transaccional. |
| **`security_auditor`** | Rol opcional de solo lectura para auditorías remotas de desarrollo. |

Para pruebas locales con Docker:

```powershell
npx --yes supabase@3.0.0 start
npm run db:migrate:local:dry-run
npm run db:migrate:local
npx --yes supabase@3.0.0 status
```

Al terminar:

```powershell
npx --yes supabase@3.0.0 stop
```

Para pruebas remotas autorizadas, cambia temporalmente en el entorno de
desarrollo:

```dotenv
RUN_REMOTE_DB_TESTS=true
```

Después de las pruebas, restáuralo a `RUN_REMOTE_DB_TESTS=false`. Estas
pruebas no forman parte del arranque normal y deben ejecutarse con rollback.

El rol `security_auditor` es opcional y no se necesita para ejecutar la
aplicación. Si se requiere para una auditoría de desarrollo, habilítalo solo en
el SQL Editor del proyecto autorizado:

```sql
alter role security_auditor
  login
  password '<auditor-password-managed-outside-git>';
```

Guarda `SECURITY_AUDITOR_DB_URL` y `SECURITY_AUDITOR_DB_PASSWORD` únicamente
en el entorno del auditor o en un `.env` local ignorado por Git. No los
configures en Vercel.

#### Producción

En producción el runtime web se ejecuta en **Vercel**. No se ejecutan Docker,
OpenCode, Context7, pruebas remotas ni el rol `security_auditor` dentro de
Vercel.

El flujo productivo es:

1. Confirmar el proyecto Supabase enlazado.
2. Ejecutar el dry-run de migraciones.
3. Aplicar las migraciones remotas explícitamente.
4. Ejecutar un segundo dry-run y confirmar que no quedan pendientes.
5. Si la base es nueva y está vacía, ejecutar `npm run db:seed`.
6. Configurar variables en **Vercel → Settings → Environment Variables**.
7. Ejecutar `npm run build:production` mediante el despliegue.
8. Hacer **Redeploy** después de modificar variables.
9. Verificar `/auth/login`, `/home`, `/account` y las operaciones principales.

Comandos de migración productiva:

```powershell
npm run db:migrate:production:dry-run
npm run db:migrate:production
npm run db:migrate:production:dry-run
```

El seed crea datos iniciales de demostración y solo debe ejecutarse en una base
nueva y vacía con autorización. Después de usarlo, rota la contraseña inicial
y crea cuentas administradas. En producción debe mantenerse:

```dotenv
RUN_REMOTE_DB_TESTS=false
```

La migración que crea `security_auditor` puede formar parte del historial, pero
no se debe ejecutar `ALTER ROLE security_auditor` en producción. El rol debe
permanecer `NOLOGIN` salvo que exista una necesidad operativa aprobada y un
entorno separado de auditoría.

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

### Variables de entorno para desarrollo y pruebas

`.env.template` es la plantilla comentada para desarrollo local y pruebas.
Cópiala como `.env.local` o `.env` según la herramienta que vaya a ejecutarla:

```powershell
Copy-Item .env.template .env.local
```

Incluye las variables server-only de la aplicación: `APP_*`, `AUTH_*`,
`NEXTAUTH_URL`, `SUPABASE_DB_*`, `MAILER_*` y `CLOUDINARY_URL`.

Para pruebas remotas autorizadas, cambia temporalmente:

```dotenv
RUN_REMOTE_DB_TESTS=true
```

Estas pruebas usan PostgreSQL remoto dentro de una transacción con rollback.
Después vuelve a `RUN_REMOTE_DB_TESTS=false`. Las variables
`E2E_DAYCARE_ID`, `E2E_STAFF_EMAIL` y `E2E_STAFF_PASSWORD` solo deben existir
si un runner E2E externo las consume; el código actual no las lee.

`CONTEXT7_API_KEY` pertenece al MCP de Context7 usado por OpenCode, no a la
aplicación. `SECURITY_AUDITOR_DB_URL` y `SECURITY_AUDITOR_DB_PASSWORD` solo se
configuran en el entorno separado que ejecuta auditorías remotas de lectura.

#### Auditor remoto para desarrollo

El rol `security_auditor` no es una cuenta de OpenDayCare y no es necesario
para ejecutar la aplicación en producción. Solo configúralo si vas a realizar
auditorías remotas de lectura durante desarrollo o pruebas autorizadas.

La migración `20261117230000_provision_security_auditor.sql` crea el rol como
`NOLOGIN`, sin contraseña y con permisos de lectura limitados. Para habilitar
el acceso temporal del auditor, ejecuta una sola vez en el **SQL Editor del
proyecto Supabase de desarrollo**:

```sql
alter role security_auditor
  login
  password '<auditor-password-managed-outside-git>';
```

Genera la contraseña fuera del repositorio y guárdala únicamente en el gestor
de secretos o en `.env` local, que está excluido de Git:

```dotenv
SECURITY_AUDITOR_DB_PASSWORD=<auditor-password>
SECURITY_AUDITOR_DB_URL=postgresql://security_auditor.<PROJECT_REF>@<POOLER_HOST>:5432/postgres?sslmode=require
```

No pongas estas variables en Vercel ni en el entorno web de producción. No
incluyas la contraseña en migraciones, commits, logs o documentación.

`MAIL_TEMPLATE_PATH` no se configura en `.env`: se deriva de la carpeta
`templates/`, que debe existir en el directorio de ejecución.

### Variables de entorno para producción

Usa `.env.prod.template` como referencia. No copies secretos al repositorio:
configura los valores en el gestor de secretos del proveedor de hosting. La
plantilla contiene únicamente las variables necesarias para ejecutar
OpenDayCare en producción, incluyendo `RUN_REMOTE_DB_TESTS=false`.

En producción:

- `APP_URL` y `NEXTAUTH_URL` deben ser el mismo origen HTTPS público.
- `AUTH_SESSION_COOKIE_SECURE=true`.
- `SUPABASE_DB_*` debe apuntar al Session Pooler del proyecto Supabase remoto.
- `MAILER_*` y `CLOUDINARY_URL` deben usar credenciales de producción.
- No configures `CONTEXT7_API_KEY`, `E2E_*` ni las variables del auditor en el
  runtime web. El auditor usa un gestor de secretos independiente.

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
antes de permitir cualquier acceso real.

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

### Migración remota de producción

La migración `20261117230000_provision_security_auditor.sql` puede aplicarse
porque forma parte del historial versionado, pero **no ejecutes `ALTER ROLE` en
producción**. El rol auditor debe permanecer `NOLOGIN` si no existe una
necesidad operativa aprobada. No es necesario para que OpenDayCare arranque.

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

foreach ($value in @($adminDbUrl)) {
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

Los dos contadores deben ser `0`.

Limpia las variables temporales al terminar:

```powershell
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:SUPABASE_DB_PASSWORD -ErrorAction SilentlyContinue
Remove-Variable adminPassword, adminDbHost, adminDbPort, adminDbUsername, `
  adminDbUrl `
  -ErrorAction SilentlyContinue
```

`db:migrate` aplica únicamente las migraciones versionadas en
`supabase/migrations/`. Ejecuta el flujo de producción en este orden:

```bash
npm run db:migrate:production:dry-run
npm run db:migrate:production
npm run db:migrate:production:dry-run
```

El segundo dry-run debe confirmar que no quedan migraciones pendientes. Para un
proyecto Supabase nuevo y vacío, ejecuta explícitamente el seed después de
aplicar la estructura:

```bash
npm run db:seed
```

El seed crea la guardería inicial, salas, roles y una cuenta de demostración.
No lo ejecutes sobre una base con datos históricos sin autorización. Después de
usarlo, rota la contraseña inicial y crea cuentas administradas. La variable
`RUN_REMOTE_DB_TESTS` debe permanecer en `false`.

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
RUN_REMOTE_DB_TESTS=false

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

Después de cambiar variables en Vercel, selecciona **Deployments → Redeploy**;
las variables nuevas no modifican una función ya desplegada.

### 3. Construir y arrancar la aplicación

Ejecuta las validaciones en CI o antes del despliegue:

```bash
npm ci
npm run build:production
npm run start:production
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
| `npm run typecheck` | Typecheck |
| `npm run validate` | ESLint y TypeScript |
| `npm run build` | Build de producción |
| `npm run build:production` | Validar y generar el build de producción |
| `npm run start` | Ejecutar el build generado |
| `npm run start:production` | Arrancar el servidor de producción |
| `npm run db:migrate:local:dry-run` | Revisar migraciones contra Supabase local |
| `npm run db:migrate:local` | Aplicar migraciones al stack local |
| `npm run db:migrate:dry-run` | Revisar migraciones del proyecto remoto enlazado |
| `npm run db:migrate` | Aplicar migraciones al proyecto remoto enlazado |
| `npm run db:migrate:production:dry-run` | Dry-run explícito de migraciones de producción |
| `npm run db:migrate:production` | Aplicar explícitamente migraciones de producción |
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
