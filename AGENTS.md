<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Guidelines

Aplicar las reglas reutilizables definidas en:

- @architecture.md — arquitectura, capas y límites de dependencia.
- @coding.md — convenciones de implementación, React, TypeScript y estilos.

Las reglas específicas de este proyecto permanecen en este `AGENTS.md`.

## Proyecto

- Next.js 16.4.3 con App Router, React 19.2.8, TypeScript estricto y Tailwind CSS 4.
- El código vive en `src/`; el App Router vive en `src/app/` y `@/*` resuelve desde `src/*`. Usar npm y conservar `package-lock.json`.
- Seguir las convenciones de archivos y las advertencias de la guía local de Next.js; no repetirlas ni contradecirlas aquí.

## Comandos y referencias

- `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- `npm run db:migrate:dry-run` y `npm run db:migrate` para validar y aplicar
  migraciones Supabase al proyecto remoto enlazado.
- `npm run test:e2e` ejecuta las pruebas Playwright de seguridad HTTP; sus
  artefactos viven en `.playwright-mcp/http-security/`.
- Typecheck: `npx tsc --noEmit --incremental false`.
- `references/` no es runtime. No editar `references/screens/support.js` ni `next-env.d.ts`.
- Guardar todos los logs, capturas, videos, traces y demás artefactos de Playwright en `.playwright-mcp/<Feature>/`.
- Usar Context7 para documentación actual de frameworks y librerías.

## Supabase y MCP

- La frontera HTTP vive en `src/proxy.ts`: genera CSP por nonce, cabeceras
  defensivas y el header interno de IP saneada. No se debe confiar directamente
  en `x-forwarded-for`.
- `x-open-daycare-client-ip` permite que el rate limiter use la IP resuelta por
  el proxy sin aceptar una IP elegida por el cliente; el login no debe consumir
  headers de forwarding no saneados.
- Antes de cualquier `db:migrate:dry-run` remoto, Docker Desktop debe validar el
  stack local con `npx supabase start`, `npx supabase status` y
  `npx supabase db reset`.
- La analítica local permanece deshabilitada en `supabase/config.toml` porque
  `vector` requiere acceso al Docker API TCP y puede bloquear los health checks;
  no se debe exponer el daemon Docker sin TLS para resolverlo. Studio e Imgproxy
  pueden excluirse durante la validación de migraciones, pues no participan en
  PostgreSQL.
- Las pruebas transaccionales de protección del login usan
  `runRemoteLoginAbusePersistenceTests`, requieren `RUN_REMOTE_DB_TESTS=true` y
  revierten sus escrituras; no deben ejecutarse contra tráfico real ni con
  credenciales versionadas.

- La configuración del servidor MCP de Supabase vive en `opencode.json` bajo `mcp.supabase`.
- El proyecto Supabase remoto se selecciona mediante `supabase link`; no fijar un proyecto de producción en código ni en documentación operativa.
- El MCP de Supabase tiene habilitadas las capacidades `docs`, `account`, `database`, `debugging`, `development`, `functions` y `branching`.
- La configuración del MCP no implica autenticación. Si el servidor solicita autorización, ejecutar `opencode mcp auth supabase` y completar el flujo OAuth en el navegador; después recargar la sesión de OpenCode.
- No guardar tokens personales, claves `service_role` ni secretos en `opencode.json`, el código fuente o variables `NEXT_PUBLIC_*`.
- El MCP de Supabase se reserva para documentación, inspección y migraciones autorizadas; no se usa para ejecutar operaciones normales de la aplicación.
- Antes de cambiar el esquema remoto, consultar primero las tablas existentes y preferir desarrollo local, migraciones revisables y verificación posterior.
- Las migraciones y seeds SQL versionados viven en `supabase/migrations/`; no se ejecutan desde el bootstrap ni desde una ruta HTTP.
- La referencia documental externa está en `../info/opencode-daycare/references/open-daycare-schema.md`; es un diccionario de diseño, no DDL ejecutable ni fuente de runtime.

## Workflow

- Para funcionalidades grandes, cargar `spec`; para implementar una spec aprobada, cargar `spec-impl` y respetar sus pausas de revisión.
- Validador de aceptación del proyecto: agente `@spec-acceptance-validator` (`.opencode/agent/spec-acceptance-validator.md`) y comando `/spec-acceptance-validator <spec>` (`.opencode/command/spec-acceptance-validator.md`). Corrige incumplimientos, marca solo criterios verificados y usa Context7 y Playwright cuando aplica.
- Los nombres de specs se relacionan con el módulo, no con una captura o prototipo.

## Arquitectura específica del proyecto

- No crear `features`, `shared`, `src/components` ni `src/infrastructure/composition` en este repositorio.
- La configuración transversal server-only vive en `src/config/server/`; `src/config/server/environment.ts` es el único lector de variables runtime y expone getters tipados por sección.
- `src/instrumentation.ts` puede leer directamente `process.env.NEXT_RUNTIME` como excepción exclusiva exigida por Next.js para separar los bundles Edge y Node.js; no puede leer ninguna otra variable runtime.
- `src/bootstrap.ts` coordina la validación del entorno, la inicialización idempotente de clientes externos y los checks de readiness; no es un barrel general de Infrastructure ni un service locator de request.
- `src/instrumentation.ts` debe mantenerse como adaptador mínimo de Next.js: exporta `register()`, carga `bootstrap.ts` dinámicamente y limita el bootstrap al runtime Node.js.
- Las fachadas server-only `databaseClient`, `mailerClient` e `imageStorageClient` son las únicas APIs públicas de sus capacidades; no exponen SDKs, proveedores ni tipos concretos.
- Los proveedores PostgreSQL, JMLQ y Cloudinary permanecen dentro de Infrastructure y solo se ensamblan desde sus fachadas o Composition.
- PostgreSQL usa `postgres.js` mediante el Session Pooler IPv4 configurado por `SUPABASE_DB_HOST`, `SUPABASE_DB_PORT`, `SUPABASE_DB_USERNAME` y `SUPABASE_DB_PASSWORD`.
- `databaseClient` comprueba readiness mediante `SELECT 1`; no existe una dependencia runtime de `supabase-js` ni de `NEXT_PUBLIC_SUPABASE_*`.
- La composición server-side de Auth vive en `src/composition/auth/`; los consumidores no importan `@/auth` ni `@/infrastructure/auth` directamente.
- `src/presentation/ui/index.ts` es el barrel público de UI y `src/presentation/navigation/index.ts` el de navegación.
- Consumir UI y navegación desde `@/presentation/ui` y `@/presentation/navigation`.
- Mantener componentes específicos de una ruta dentro de `src/app/**/_components`, `src/app/**/_actions` o `src/app/**/_schemas`.
- Los archivos especiales de App Router mantienen su convención de Next.js; la organización interna no crea rutas sin `page` o `route`.
- Solo `src/app` contiene páginas, layouts, Route Handlers y colaboradores privados de ruta.

## Datos y configuración específicos

- No existen fixtures JSON runtime en este corte; los servicios server-only consumen persistencia PostgreSQL mediante sus fachadas y composiciones.
- Los contratos de dominio se importan desde `@/domain/<domain>` y no se duplican en fixtures.
- Los fixtures son deterministas: IDs, fechas, códigos y relaciones permanecen estables entre ejecuciones.
- Configuración compartida usa constantes; configuración de entorno usa variables de entorno.
- Los límites de abuso del login son constantes server-only en
  `src/config/server/login-rate-limit.ts` (`LOGIN_RATE_LIMITS`); no se configuran
  mediante variables `NEXT_PUBLIC_*` ni desde el cliente.
- Los límites HTTP no secretos se leen mediante el getter tipado de la sección
  `httpSecurity` en `src/config/server/environment.ts`: tamaño de imagen,
  cantidad de imágenes, texto alternativo y body de Server Actions. Los
  consumidores cliente reciben esos valores por props serializables.
- Ningún módulo fuera de `src/config/server/environment.ts` lee directamente `process.env` o `env.get()`, salvo `src/instrumentation.ts` para `process.env.NEXT_RUNTIME` exclusivamente.
- `next.config.ts` es la única excepción adicional de build: lee y valida
  únicamente `HTTP_SERVER_ACTION_BODY_SIZE_BYTES`, porque Next.js carga esa
  configuración antes del runtime server-only.
- Las variables de entorno se configuran fuera de Git. Una variable `NEXT_PUBLIC_*` puede ser publicable, pero no elimina los límites server-only del SDK ni de su configuración.
- Los servicios de dominio no construyen rutas físicas ni importan `node:fs`; usan puertos y adapters PostgreSQL server-only.
- `CurrentDaycareProvider` es provisional y obtiene la única guardería operativa para el login. Debe reemplazarse por un selector explícito cuando se habiliten múltiples guarderías.

## Rutas específicas

- Home y Kids viven bajo `src/app/(staff)/`; el grupo `(staff)` no aparece en sus URLs públicas.
- Kids requiere rol `teacher` y asignación a la sala del niño. La navegación oculta Kids sin capacidad efectiva y las rutas, acciones y consultas no autorizadas responden 404 sin revelar recursos.
- Las fotografías solo se publican o adjuntan cuando existe al menos un progenitor activo y todos los progenitores activos han dado consentimiento.
- Las rutas públicas de autenticación viven bajo `src/app/auth/`: `/auth/login`, `/auth/parent-invitation` y `/auth/parent-invitation/[token]`.
- Solo `/` se conserva como redirect externo permanente en `next.config.ts`; las rutas legacy aprobadas responden 404.
- Ningún Client Component importa `@/infrastructure`, filesystem, una entrada `server` ni configuración privada.
- Ningún Client Component importa `@/config/server`, `@/bootstrap`, una fachada server-only ni un SDK externo.

## Excepciones de estilos del proyecto

- `src/app/globals.css` contiene Tailwind, reset, fuentes y tokens visuales globales.
- Todo color, sombra y gradiente se declara como token semántico en `src/app/globals.css`.

## Verificación específica del proyecto

Antes de finalizar:

- Confirmar que no se introduzcan fixtures JSON ni adapters de persistencia local.
- Revisar que los modelos de dominio estén definidos en `src/domain/<domain>/`.
- Revisar que Composition sea el único punto que ensamble Application con proveedores concretos y que Auth se consuma mediante `@/composition/auth`.
- Revisar que el bootstrap inicialice database, mailer e image storage sin conexiones SMTP ni operaciones Cloudinary, y que compruebe PostgreSQL mediante `SELECT 1`.
- Revisar que no se filtren secretos, URLs completas, claves, headers, bodies ni detalles de respuestas en logs o errores de arranque.
- Buscar colores literales fuera de `src/app/globals.css`.
- Ejecutar `npx eslint src`, `npx tsc --noEmit --incremental false` y `npm run build` cuando apliquen.
- Ejecutar `npm run test:e2e` cuando el servidor y las variables `E2E_*` estén
  disponibles; conservar sus artefactos bajo `.playwright-mcp/`.

<!-- context7 -->
Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer — your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Always start with `resolve-library-id` using the library name and what to look up in the library's documentation, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and what to look up in the library's documentation (not single words), scoped to a single concept. If the question spans multiple distinct concepts (e.g., routing and auth and caching), make a separate `query-docs` call per concept with the same library ID, unless the question is about how the concepts interact — combined queries dilute ranking and return shallow results for each topic
4. Answer using the fetched docs
<!-- context7 -->
