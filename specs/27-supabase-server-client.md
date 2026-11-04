# SPEC 27 — Cliente Supabase server-side y verificación de arranque

> **Status:** Approved
> **Depends on:** SPEC 22
> **Date:** 2026-10-30
> **Objective:** Centralizar la configuración server-only y la inicialización de los clientes externos mediante `bootstrap.ts`, conectar la capacidad de base de datos a través de una fachada provider-neutral y verificar la disponibilidad de su Data API durante el arranque, corrigiendo además el acceso público de Auth para que pase por Composition.

## Why this spec exists

La aplicación ya declara dependencias de Supabase, pero todavía no dispone de una integración ejecutable que permita detectar al iniciar si la URL y la clave configuradas alcanzan el Data API del proyecto.

Además, `src/auth.ts` funciona actualmente como un barrel de Infrastructure: reexporta directamente la implementación concreta ubicada en `src/infrastructure/auth/auth.ts`. La inicialización de la aplicación y las APIs server-side de Auth deben tener fronteras distintas: `bootstrap.ts` coordina el arranque y Composition ensambla las dependencias de Auth.

La conexión debe respetar Clean Architecture, Ports & Adapters y Dependency Inversion. La comprobación no debe convertir `src/instrumentation.ts` en un consumidor directo de Infrastructure ni introducir una ruta pública de diagnóstico.

La configuración de entorno es una capacidad transversal, no una responsabilidad exclusiva de Infrastructure. Por ello, la lectura y validación de `.env*` vivirá en `src/config/server/`, mientras que los adapters únicamente consumirán getters tipados y no accederán directamente a `process.env`.

La verificación se limita al gateway del Data API. No consulta tablas porque el esquema remoto mantiene RLS activo y no concede acceso público a las tablas de negocio.

## Scope

**In:**

- Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` a `.env.template`.
- Centralizar la lectura y validación de todas las variables runtime en `src/config/server/environment.ts`.
- Exponer getters server-only por sección para Application de entrada, Composition y adapters autorizados.
- Validar todas las variables requeridas desde `bootstrap.ts` antes de inicializar clientes.
- Crear el puerto técnico `DatabaseClientProvider` para abstraer la creación del cliente.
- Crear el proveedor concreto de Supabase dentro de `src/infrastructure/adapters/database/supabase/`.
- Crear la fachada server-only `databaseClient` en `src/infrastructure/adapters/database/server.ts`.
- Exponer la fachada mediante `src/infrastructure/adapters/database/index.ts`, sin exponer Supabase ni sus tipos.
- Crear la fachada server-only `mailerClient` para controlar el cliente de correo sin exponer JMLQ, Nodemailer ni sus tipos.
- Crear la fachada server-only `imageStorageClient` para controlar el almacenamiento de imágenes sin exponer Cloudinary ni sus tipos.
- Inicializar `databaseClient`, `mailerClient` e `imageStorageClient` desde Composition y coordinarlos desde `bootstrap.ts`.
- Crear en Application un port de comprobación de conexión y un caso de uso que lo invoque.
- Crear en Infrastructure el adapter que comprueba el Data API mediante una solicitud `GET` al gateway `/rest/v1/` con la clave publicable.
- Ensamblar el caso de uso y el adapter mediante Composition.
- Crear `src/bootstrap.ts` como punto de inicialización explícito, idempotente y server-only de la aplicación.
- Ejecutar `src/bootstrap.ts` desde `src/instrumentation.ts` mediante `register()` e import dinámico condicionado al runtime Node.js.
- Validar el entorno y ejecutar la comprobación de Supabase desde el bootstrap, en un orden determinista.
- Reemplazar el barrel directo de `src/auth.ts` por una composición/fachada server-side de Auth y actualizar sus consumidores.
- Eliminar `src/auth.ts` y prohibir imports `@/auth` una vez migrados los consumidores.
- Registrar en consola un mensaje de éxito sin credenciales ni datos sensibles.
- Lanzar un error sanitizado y detener la preparación del servidor si la comprobación falla.
- Documentar configuración, arranque, límites y flujo de conexión en `README.md`.
- Mantener los SDKs, proveedores concretos y sus tipos dentro de Infrastructure.

**Out of scope (for future specs):**

- Crear `page.tsx`, una ruta de diagnóstico o la tabla `todos`.
- Crear un cliente para navegador.
- Usar `@supabase/ssr`, cookies, `middleware.ts` o `proxy.ts`.
- No modificar las reglas funcionales de NextAuth, sus sesiones, cookies, redirects ni permisos.
- Consultar tablas, leer filas o validar el contenido del esquema durante el arranque.
- Crear ports de repositorio, repositorios Supabase o modificar los repositorios JSON.
- Implementar RLS, claims, aislamiento multi-tenant o autorización de datos.
- Conceder permisos a `anon` o `authenticated` para habilitar el health check.
- Crear un endpoint público de salud o una página de diagnóstico.
- Ejecutar migraciones, seeds o cambios remotos en Supabase.
- Modificar `package.json` o `package-lock.json`.
- Exponer un `SupabaseClient` o tipos de Supabase a Domain, Application o Presentation.
- Permitir imports de Infrastructure desde Client Components.
- Permitir lecturas directas de `process.env`, `env.get()` o equivalentes fuera de `src/config/server/environment.ts` y del getter runtime explícitamente autorizado.
- Exportar SDKs, proveedores concretos o instancias de proveedores desde las fachadas públicas.

## Data model

Esta spec no introduce estructuras de negocio ni datos persistidos nuevos.

La configuración server-side debe vivir fuera de Infrastructure y ampliar el contrato transversal de `src/config/server/` con secciones equivalentes a:

```ts
type Environment = {
  application: {
    appUrl: string;
    nodeEnvironment: "development" | "test" | "production";
  };
  auth: {
    // Existing authentication configuration.
  };
  mailer: {
    // Mail configuration.
  };
  cloudinary: {
    url: string;
  };
  supabase: {
    url: string;
    publishableKey: string;
    dbPassword: string;
  };
};
```

`src/config/server/environment.ts` será el único lector de variables de `.env*`. Su API pública tendrá getters por sección y una validación explícita:

```ts
function validateEnvironment(): void;
function getApplicationEnvironment(): ApplicationEnvironment;
function getAuthEnvironment(): AuthEnvironment;
function getMailerEnvironment(): MailerEnvironment;
function getCloudinaryEnvironment(): CloudinaryEnvironment;
function getSupabaseEnvironment(): SupabaseEnvironment;
```

Los getters deberán devolver valores ya validados, no leer `process.env` de nuevo y no exponer una sección completa a consumidores que no la necesitan. La validación completa debe producir un error sanitizado que identifique el nombre de la variable inválida, pero nunca su valor.

`src/config/runtime.ts` expondrá únicamente el getter necesario para conocer el runtime de Next.js. `src/instrumentation.ts` podrá usarlo para decidir si carga el bootstrap Node.js. Ningún cliente, adapter o componente podrá leer directamente `process.env`.

La API técnica de Infrastructure debe organizarse así:

```text
src/infrastructure/adapters/database/
├── database-client-provider.ts
├── server.ts                  # databaseClient
├── index.ts
└── supabase/
    ├── supabase-client-provider.ts
    ├── supabase-connection-checker.ts
    └── index.ts
```

Las fachadas de clientes externos se organizarán así:

```text
src/infrastructure/adapters/
├── database/
│   └── server.ts              # databaseClient
├── mailer/
│   ├── server.ts              # mailerClient
│   └── jmlq/
│       └── jmlq-mailer-provider.ts
└── image-storage/
    ├── server.ts              # imageStorageClient
    └── cloudinary/
        └── cloudinary-provider.ts
```

Los nombres públicos representan capacidades, no proveedores. Se usarán `databaseClient`, `mailerClient` e `imageStorageClient`; no se expondrán `supabaseClient`, `jmlqClient` ni `cloudinaryClient`.

La estructura de inicialización y composición será:

```text
src/
├── config/
│   ├── runtime.ts
│   └── server/
│       ├── environment.ts
│       └── index.ts
├── bootstrap.ts
├── instrumentation.ts
├── application/
│   └── database/
├── composition/
│   ├── auth/
│   ├── bootstrap/
│   └── database/
└── infrastructure/
    ├── auth/
    └── adapters/database/
```

El puerto técnico debe expresar únicamente la creación del cliente, sin definir consultas ni nombres de tablas:

```ts
interface DatabaseClientProvider<TClient> {
  createClient(): TClient;
}
```

El port de Application para la comprobación debe ocultar el proveedor y sus tipos:

```ts
interface DatabaseConnectionChecker {
  check(): Promise<void>;
}
```

El caso de uso `checkDatabaseConnection` depende únicamente de `DatabaseConnectionChecker`. La fachada `databaseClient` implementa el ciclo de vida provider-neutral y delega en `SupabaseConnectionChecker`, que implementa ese port y considera exitosa la comprobación cuando el Data API responde correctamente a `GET /rest/v1/` usando la clave publicable.

La verificación debe aplicar un timeout de cinco segundos y un único intento. No debe registrar la URL completa, la clave, los headers, el body ni los detalles internos de la respuesta.

`bootstrap.ts` debe exponer únicamente una función pública de inicialización:

```ts
function bootstrapApplication(): Promise<void>;
```

La función no debe ejecutarse como efecto secundario al importar el módulo. Debe ser idempotente: las llamadas concurrentes de una misma instancia comparten la misma `Promise` de inicialización y no repiten validaciones, logs ni comprobaciones remotas.

El bootstrap debe coordinar, en este orden:

1. Registrar el inicio de la inicialización.
2. Validar el entorno server-side completo mediante `validateEnvironment()`.
3. Registrar que el entorno fue validado, sin mostrar valores.
4. Ejecutar el caso de uso de comprobación de Supabase mediante Composition.
5. Registrar la conexión exitosa de Data API.
6. Registrar que la aplicación terminó su inicialización.

El mailer de `SPEC 07` mantiene la ausencia de conexión SMTP durante el arranque, pero su cliente debe construirse e inicializarse desde `mailerClient` después de validar la configuración. La inicialización construye el transporte y el renderer, pero no realiza una conexión remota SMTP. Cloudinary sigue la misma política: se configura e inicializa sin realizar una operación remota de negocio.

La creación de los clientes y la verificación remota son operaciones diferentes:

```text
databaseClient.initialize()       # crea/configura el cliente técnico
databaseClient.checkConnection()  # realiza GET /rest/v1/
mailerClient.initialize()         # crea transporte y renderer, sin conexión SMTP
imageStorageClient.initialize()   # configura Cloudinary, sin upload/delete
```

Cada fachada debe inicializarse de forma idempotente, compartir una única Promise concurrente por instancia y guardar su cliente únicamente después de una construcción válida. Las fachadas no expondrán las instancias de SDK.

## Runtime connection flow

El flujo ejecutable será:

```text
src/instrumentation.ts (adaptador de Next.js)
  → src/bootstrap.ts
  → validateEnvironment() / getters de src/config/server/
  → src/composition/bootstrap/
  → databaseClient.initialize()
  → mailerClient.initialize()
  → imageStorageClient.initialize()
  → databaseClient.checkConnection()
  → src/composition/database/database-composition.ts
  → src/application/database/check-database-connection.ts
  → src/application/database/ports/database-connection-checker.ts
  → src/infrastructure/adapters/database/server.ts
  → src/infrastructure/adapters/database/supabase/
  → Supabase Data API /rest/v1/
```

`src/instrumentation.ts` debe ser un adaptador mínimo del ciclo de vida de Next.js. Debe exportar `register()`, obtener el runtime mediante el getter runtime permitido y cargar `src/bootstrap.ts` mediante `import()` dinámico dentro de `register()`. No debe construir clientes, validar configuración ni contener lógica de inicialización propia.

Next.js debe esperar la finalización de `register()` antes de aceptar requests. `instrumentation.ts` no puede renombrarse porque es una convención de descubrimiento del framework; `bootstrap.ts` contiene el nombre y la lógica semántica de la inicialización de OpenDayCare.

Cuando la comprobación termina correctamente, el proceso registra exactamente un mensaje equivalente a:

```text
[database] Supabase Data API connection successful
```

Cuando falla, debe lanzar un error con el contexto de conexión, sin incluir secretos. El error impide que la instancia se considere lista.

Esta comprobación confirma que el gateway responde y acepta la clave configurada. No confirma permisos de lectura sobre tablas ni la disponibilidad de los repositorios futuros.

Los mensajes de bootstrap esperados son, en orden:

```text
[bootstrap] Application initialization started
[environment] Server environment validated
[database] Client initialized
[mailer] Client initialized
[image-storage] Client initialized
[database] Supabase Data API connection successful
[bootstrap] Application initialization completed
```

Ante un fallo, debe registrarse únicamente un contexto sanitizado y propagarse el error. No debe registrarse el secreto, la URL completa, la respuesta HTTP ni la configuración completa.

## Auth composition boundary

`src/auth.ts` no debe continuar funcionando como barrel público de Infrastructure. La composición server-side de Auth será el único lugar autorizado para ensamblar `next-auth`, repositorios, hashers y configuración concreta.

Los consumidores de Auth deberán importar desde `@/composition/auth` o desde una API pública de composición equivalente. El Route Handler de NextAuth y los Server Components/Actions que necesiten sesión conservarán su comportamiento actual, pero no accederán directamente a `@/infrastructure/auth`.

Esta refactorización es estructural: no cambia el proveedor Credentials, la estrategia JWT, las cookies, los redirects, la revalidación de sesión ni las reglas de autorización.

## Implementation plan

1. Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` a `.env.template`, usando placeholders y sin incluir credenciales reales.
2. Mover la configuración server-only desde `src/infrastructure/config/server/` a `src/config/server/` y crear getters tipados por sección.
3. Centralizar en `src/config/server/environment.ts` la lectura de `.env*`, la validación de valores, la validación de rutas runtime y la caché de configuración.
4. Crear `src/config/runtime.ts` para exponer el runtime de Next.js sin permitir lecturas directas dispersas de `process.env`.
5. Crear `src/application/database/ports/database-connection-checker.ts` con el port `DatabaseConnectionChecker` y su barrel de Application.
6. Crear `src/application/database/check-database-connection.ts` con el caso de uso que invoque el port sin conocer Next.js, Supabase ni `fetch`.
7. Crear `src/infrastructure/adapters/database/database-client-provider.ts` con `DatabaseClientProvider<TClient>` y sin importar Supabase.
8. Crear el proveedor privado de Supabase y la fachada `databaseClient`, usando únicamente `getSupabaseEnvironment()`.
9. Crear `src/infrastructure/adapters/database/supabase/supabase-connection-checker.ts` para comprobar `GET /rest/v1/` con timeout de cinco segundos.
10. Crear la fachada `mailerClient` y su proveedor JMLQ, usando únicamente `getMailerEnvironment()` y sin realizar conexión SMTP.
11. Crear la fachada `imageStorageClient` y su proveedor Cloudinary, usando únicamente `getCloudinaryEnvironment()` y sin realizar operaciones remotas.
12. Crear las composiciones de clientes y `src/composition/bootstrap/` para ensamblar las fachadas sin exponer proveedores.
13. Crear `src/bootstrap.ts` con `bootstrapApplication()`, validación completa, inicialización idempotente de los tres clientes, check de database y logs sanitizados.
14. Crear `src/instrumentation.ts` como adaptador mínimo de Next.js, con getter runtime, import dinámico de `bootstrap.ts` y ejecución exclusiva en Node.js.
15. Refactorizar `src/composition/auth/` para exponer la API server-side necesaria de Auth sin reexportar directamente Infrastructure.
16. Eliminar `src/auth.ts` y actualizar el Route Handler, páginas y Server Actions que actualmente importan `@/auth`.
17. Actualizar `README.md` para documentar getters, clientes, fachadas, flujo de arranque y límites.
18. Revisar que ningún archivo fuera de la configuración centralizada lea `process.env` o `env.get()` directamente.
19. Ejecutar ESLint, TypeScript, build y `git diff --check` sin modificar los repositorios JSON ni las reglas funcionales de autenticación.

## Acceptance criteria

- [ ] `.env.template` contiene `NEXT_PUBLIC_SUPABASE_URL` con un placeholder de URL.
- [ ] `.env.template` contiene `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con un placeholder de clave publicable.
- [ ] Existe `src/config/server/environment.ts` como único lector de variables de entorno de la aplicación.
- [ ] No existe `src/infrastructure/config/server/` como dueño de la configuración transversal.
- [ ] `validateEnvironment()` valida todas las variables runtime requeridas antes de inicializar clientes.
- [ ] La validación rechaza variables ausentes, vacías, URLs inválidas, enums inválidos, booleanos inválidos e enteros no positivos.
- [ ] La validación incluye `SUPABASE_DB_PASSWORD`, aunque el check Data API no la utilice.
- [ ] Existen getters tipados para application, auth, mailer, Cloudinary y Supabase.
- [ ] Los getters reutilizan la configuración validada y no leen `process.env` directamente.
- [ ] Los errores de configuración identifican el nombre de la variable sin mostrar su valor.
- [ ] Existe `src/config/runtime.ts` para el runtime de Next.js.
- [ ] No existen lecturas directas de `process.env` o `env.get()` fuera de los módulos de configuración autorizados.
- [ ] Existe `src/application/database/ports/database-connection-checker.ts`.
- [ ] `DatabaseConnectionChecker` no importa Next.js, Supabase ni Infrastructure.
- [ ] Existe el caso de uso `checkDatabaseConnection` en Application.
- [ ] El caso de uso solo depende del port `DatabaseConnectionChecker`.
- [ ] Existe `src/infrastructure/adapters/database/database-client-provider.ts`.
- [ ] `DatabaseClientProvider<TClient>` abstrae únicamente la creación del cliente y no define consultas.
- [ ] Existe `src/infrastructure/adapters/database/supabase/supabase-client-provider.ts`.
- [ ] `SupabaseClientProvider` implementa `DatabaseClientProvider` usando `@supabase/supabase-js`.
- [ ] Existe `src/infrastructure/adapters/database/supabase/supabase-connection-checker.ts`.
- [ ] `SupabaseConnectionChecker` implementa el port de Application sin exponer tipos de Supabase.
- [ ] El proveedor y el comprobador importan `server-only` antes de usar configuración o SDK server-side.
- [ ] `databaseClient` expone una fachada provider-neutral y no expone tipos ni instancias de Supabase.
- [ ] `databaseClient.initialize()` es idempotente y comparte una única Promise concurrente por instancia.
- [ ] `databaseClient` se construye mediante Composition y usa únicamente getters de configuración.
- [ ] La comprobación realiza una solicitud real `GET /rest/v1/` al Data API.
- [ ] La comprobación usa la clave publicable solo en código server-side y nunca la registra.
- [ ] La comprobación tiene un timeout máximo de cinco segundos y no realiza reintentos.
- [ ] La comprobación no consulta tablas ni descarga filas.
- [ ] Existe `src/infrastructure/adapters/database/server.ts`.
- [ ] Existe `src/infrastructure/adapters/database/index.ts`.
- [ ] Existe `mailerClient` como fachada provider-neutral.
- [ ] `mailerClient.initialize()` construye transporte y renderer sin abrir una conexión SMTP.
- [ ] `mailerClient` no expone JMLQ, Nodemailer ni sus tipos.
- [ ] Existe `imageStorageClient` como fachada provider-neutral.
- [ ] `imageStorageClient.initialize()` configura Cloudinary sin ejecutar uploads ni deletes.
- [ ] `imageStorageClient` no expone Cloudinary ni sus tipos.
- [ ] Los proveedores concretos solo son importados por sus fachadas o Composition.
- [ ] Existe `src/composition/database/database-composition.ts`.
- [ ] Composition ensambla el caso de uso con el adapter Supabase.
- [ ] Existe `src/bootstrap.ts` con `bootstrapApplication()`.
- [ ] `bootstrap.ts` está marcado como server-only y no ejecuta efectos secundarios al importarse.
- [ ] `bootstrapApplication()` es idempotente y comparte una única `Promise` por instancia.
- [ ] El bootstrap valida el entorno antes de ejecutar la comprobación de Supabase.
- [ ] El bootstrap registra mensajes sanitizados de inicio, entorno validado, conexión y aplicación lista en orden.
- [ ] El bootstrap inicializa `databaseClient`, `mailerClient` e `imageStorageClient` mediante Composition.
- [ ] Un fallo al construir cualquiera de los tres clientes impide que la instancia se considere lista.
- [ ] El bootstrap no realiza una conexión remota SMTP ni operaciones remotas de Cloudinary.
- [ ] Existe `src/instrumentation.ts` con `register()`.
- [ ] `instrumentation.ts` solo actúa como adaptador del lifecycle de Next.js.
- [ ] `instrumentation.ts` importa dinámicamente `bootstrap.ts` dentro de `register()`.
- [ ] `instrumentation.ts` limita el bootstrap al runtime Node.js.
- [ ] La comprobación se ejecuta una vez por instancia Node antes de aceptar requests.
- [ ] El arranque registra `[database] Supabase Data API connection successful` cuando la respuesta es válida.
- [ ] Un timeout, una URL inválida, una clave inválida o una respuesta no exitosa producen un error sanitizado.
- [ ] Un fallo de conexión impide que la instancia se considere lista.
- [ ] No existe endpoint público ni página de diagnóstico para esta comprobación.
- [ ] No se conceden permisos adicionales a `anon` o `authenticated` para realizar el check.
- [ ] No se crean `src/utils/supabase/client.ts`, `src/utils/supabase/server.ts` ni `src/utils/supabase/middleware.ts`.
- [ ] No se crea `src/proxy.ts` ni `middleware.ts` para Supabase.
- [ ] No se crea ninguna ruta, página o consulta contra `todos`.
- [ ] No se modifican los repositorios JSON existentes ni sus fixtures.
- [ ] No se cambian las reglas funcionales de NextAuth, sus sesiones, cookies, redirects ni permisos.
- [ ] No existe `src/auth.ts` como barrel directo de Infrastructure.
- [ ] No quedan imports `@/auth` en `src`.
- [ ] Los consumidores de Auth acceden mediante Composition y no importan directamente `@/infrastructure/auth`.
- [ ] La composición de Auth conserva el comportamiento actual del Route Handler y de los guards de sesión.
- [ ] No se implementan repositorios Supabase ni cambios en rutas o Composition fuera del ensamblaje del check, bootstrap y Auth composition.
- [ ] Domain y Presentation no importan ningún SDK, proveedor concreto ni fachada server-only.
- [ ] Application no importa Infrastructure, ningún SDK, Next.js, configuración server-only ni `fetch` para esta funcionalidad.
- [ ] Ningún Client Component importa Infrastructure o configuración privada.
- [ ] `README.md` documenta que las variables se configuran fuera de Git y que la clave publicable no es un secreto.
- [ ] `README.md` documenta que esta entrega no implementa Supabase Auth, consultas de tablas, migraciones ni repositorios Supabase, y que la refactorización de NextAuth no cambia su comportamiento.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.

## Decisions

- **Sí:** usar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, porque son las variables entregadas para el proyecto y la comprobación usa una clave pública sin privilegios elevados.
- **Sí:** ejecutar un check contra `/rest/v1/`, porque permite verificar gateway, URL y aceptación de la clave sin depender de tablas o políticas de negocio.
- **No:** consultar `daycares` u otra tabla, porque el proyecto remoto mantiene RLS y no concede acceso público; hacerlo exigiría cambiar el contrato de seguridad.
- **Sí:** ejecutar el check desde `src/instrumentation.ts`, porque Next.js ofrece `register()` como hook de arranque que se completa antes de aceptar requests.
- **Sí:** mantener `src/instrumentation.ts` como adaptador mínimo y colocar la lógica en `src/bootstrap.ts`, porque Next.js requiere el nombre `instrumentation.ts` para descubrir el hook, mientras que `bootstrap.ts` expresa la responsabilidad de la aplicación.
- **Sí:** usar import dinámico dentro de `register()`, porque evita cargar efectos secundarios globalmente y permite seleccionar explícitamente el runtime Node.js.
- **Sí:** centralizar en `bootstrap.ts` la validación de entorno, los logs y los recursos obligatorios de arranque, porque son responsabilidades transversales de inicialización.
- **Sí:** hacer `bootstrapApplication()` idempotente mediante una Promise compartida, porque el registro o llamadas concurrentes no deben duplicar checks ni mensajes.
- **Sí:** ubicar la configuración en `src/config/server/`, porque la lectura de entorno es transversal y no pertenece exclusivamente a Infrastructure.
- **Sí:** exponer getters por sección, porque cada consumidor debe recibir únicamente la configuración que necesita y no un objeto global de secretos.
- **Sí:** validar todas las variables al arrancar, aunque algunos clientes no realicen conexiones remotas, porque una configuración inválida debe impedir un arranque aparentemente saludable.
- **Sí:** inicializar `databaseClient`, `mailerClient` e `imageStorageClient` desde bootstrap mediante Composition, porque permite controlar orden, errores y ciclo de vida en un único punto.
- **Sí:** usar nombres provider-neutral para las fachadas, porque Supabase, JMLQ y Cloudinary son implementaciones sustituibles, no contratos de aplicación.
- **No:** exportar clientes SDK desde las fachadas, porque filtraría detalles de proveedor y rompería Dependency Inversion.
- **No:** mover la API de Auth a `bootstrap.ts`, porque Auth se consume por request y no es una tarea de inicialización.
- **Sí:** eliminar `src/auth.ts` como barrel directo y usar Composition para Auth, porque el Composition Root debe ser el único punto que ensamble Infrastructure.
- **Sí:** conservar la ausencia de conexión SMTP durante el arranque, pero construir `mailerClient` en bootstrap, porque inicializar el cliente y verificar el servidor remoto son responsabilidades diferentes.
- **Sí:** pasar por Application port y Composition, porque el entrypoint de Next.js no debe construir ni importar directamente adapters concretos.
- **Sí:** crear el puerto técnico `DatabaseClientProvider`, porque permite cambiar la implementación concreta sin propagar el proveedor fuera de Infrastructure.
- **Sí:** ubicar los proveedores bajo `adapters/database`, porque `database` representa la capacidad técnica y `supabase` identifica solo la implementación actual.
- **Sí:** crear un facade `database/server.ts`, porque centraliza la selección del proveedor y evita que futuros consumidores conozcan Supabase.
- **Sí:** compartir una instancia técnica por cliente y por instancia del servidor, porque bootstrap controla su ciclo de vida y estas fachadas no almacenan estado de usuario.
- **No:** reutilizar un cliente Supabase con cookies o sesión de usuario entre requests, porque los clientes con estado de usuario deben crearse por request en una futura integración de Auth.
- **Sí:** mantener el cliente y el check server-only, porque el SDK y la configuración no deben entrar en el bundle del navegador.
- **No:** usar `@supabase/ssr`, porque esta entrega no integra sesiones Supabase ni cookies y NextAuth continúa siendo la autenticación actual.
- **No:** crear una ruta pública de salud, porque el check pertenece al ciclo de vida interno de la instancia y no debe exponer información de conectividad.
- **No:** usar una clave secreta bajo `NEXT_PUBLIC_*`, porque expondría privilegios server-only.
- **No:** usar la configuración de `page.tsx` con `todos`, porque introduciría una ruta y un modelo que no pertenecen al dominio OpenDayCare.
- **No:** crear ports de repositorio en esta spec, porque todavía no se implementa un caso de uso de persistencia.
- **No:** modificar dependencias npm, porque los paquetes necesarios ya están instalados.

## Risks

| Risk                                                                                 | Mitigation                                                                                                                                                |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La clave `NEXT_PUBLIC_*` puede terminar incluida en el bundle del navegador.         | No importar Infrastructure desde Client Components y documentar que la clave publicable no es un secreto.                                                 |
| El check del gateway no demuestra permisos sobre tablas.                             | Declarar explícitamente que solo verifica disponibilidad de Data API y aceptación de la clave.                                                            |
| El proyecto remoto cambia su respuesta en `/rest/v1/`.                               | Tratar únicamente respuestas HTTP no exitosas como fallo y no depender de un body concreto.                                                               |
| La conexión temporal falla durante el arranque.                                      | Aplicar un timeout de cinco segundos, fallar de forma explícita y permitir que el orquestador reinicie la instancia.                                      |
| El entrypoint importa Infrastructure directamente.                                   | Mantener `src/instrumentation.ts` como adaptador mínimo; `bootstrap.ts` invoca Composition y Composition ensambla Application e Infrastructure.           |
| Un futuro consumidor filtra el SDK hacia Application.                                | Mantener el facade y el proveedor dentro de Infrastructure y exigir ports de Application para repositorios posteriores.                                   |
| La integración se confunde con la migración del esquema documental.                  | No crear tablas, migraciones, seeds, políticas ni consultas de negocio en esta spec.                                                                      |
| `src/auth.ts` continúa filtrando Infrastructure hacia las rutas.                     | Eliminar el barrel directo, migrar consumidores a Composition y verificar que no queden imports `@/auth` ni `@/infrastructure/auth` fuera de Composition. |
| El bootstrap intenta verificar servicios externos que no forman parte del readiness. | Inicializar mailer y Cloudinary sin conexiones remotas; solo `databaseClient` ejecuta una comprobación Data API.                                          |
| La inicialización se ejecuta dos veces en una instancia.                             | Compartir la Promise de `bootstrapApplication()` y no ejecutar efectos al importar `bootstrap.ts`.                                                        |

## What is **not** in this spec

- Cliente Supabase para navegador.
- Supabase Auth, sesiones, cookies, `@supabase/ssr`, `proxy.ts` o `middleware.ts`.
- Consulta de tablas, filas o datos de negocio.
- Página de ejemplo o tabla `todos`.
- Endpoint público de health check.
- Repositorios o ports de persistencia Supabase.
- Uso del facade database desde Domain, Application, Presentation, páginas o Client Components.
- Migración desde JSON, SQL, seeds, RLS o cambios remotos.
- Sustitución de NextAuth o de los repositorios JSON.
- Cambio funcional del flujo de autenticación, sesiones, cookies, redirects o autorización.
- Verificación SMTP, uploads Cloudinary u otras operaciones remotas de negocio durante el arranque.
- Uso de `bootstrap.ts` como barrel general de Infrastructure, service locator o API de Auth por request.
- Exposición de SDKs o proveedores concretos desde `databaseClient`, `mailerClient` o `imageStorageClient`.

---

Plan de implementación

3.  Centralizar lectura, validación y caché del entorno.
4.  Crear src/config/runtime.ts.
5.  Crear el port DatabaseConnectionChecker.
6.  Crear el caso de uso checkDatabaseConnection.
7.  Crear DatabaseClientProvider<TClient>.
8.  Crear proveedor Supabase y fachada databaseClient.
9.  Crear comprobador del Data API con timeout de cinco segundos.
10. Crear fachada y proveedor JMLQ.
11. Crear fachada y proveedor Cloudinary.
12. Crear composiciones de clientes y bootstrap.
13. Crear bootstrap.ts.
14. Crear instrumentation.ts.
15. Refactorizar Composition de Auth.
16. Eliminar src/auth.ts y migrar consumidores.
17. Actualizar README.md.
18. Revisar accesos directos a variables de entorno.
19. Ejecutar ESLint, TypeScript, build y git diff --check.
