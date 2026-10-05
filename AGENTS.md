<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Guidelines

Aplicar las reglas reutilizables definidas en:

- @architecture.md — arquitectura, capas y límites de dependencia.
- @coding.md — convenciones de implementación, React, TypeScript y estilos.

Las reglas específicas de este proyecto permanecen en este `AGENTS.md`.

## Proyecto

- Next.js 16.3.5 con App Router, React 19.2.8, TypeScript estricto y Tailwind CSS 4.
- El código vive en `src/`; el App Router vive en `src/app/` y `@/*` resuelve desde `src/*`. Usar npm y conservar `package-lock.json`.
- Seguir las convenciones de archivos y las advertencias de la guía local de Next.js; no repetirlas ni contradecirlas aquí.

## Comandos y referencias

- `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- Typecheck: `npx tsc --noEmit --incremental false`.
- `references/` no es runtime. No editar `references/screens/support.js` ni `next-env.d.ts`.
- Guardar todos los logs, capturas, videos, traces y demás artefactos de Playwright en `.playwright-mcp/<Feature>/`.
- Usar Context7 para documentación actual de frameworks y librerías.

## Workflow

- Para funcionalidades grandes, cargar `spec`; para implementar una spec aprobada, cargar `spec-impl` y respetar sus pausas de revisión.
- Validador de aceptación del proyecto: agente `@spec-acceptance-validator` (`.opencode/agent/spec-acceptance-validator.md`) y comando `/spec-acceptance-validator <spec>` (`.opencode/command/spec-acceptance-validator.md`). Corrige incumplimientos, marca solo criterios verificados y usa Context7 y Playwright cuando aplica.
- Los nombres de specs se relacionan con el módulo, no con una captura o prototipo.

## Arquitectura específica del proyecto

- No crear `features`, `shared`, `src/components` ni `src/infrastructure/composition` en este repositorio.
- `src/presentation/ui/index.ts` es el barrel público de UI y `src/presentation/navigation/index.ts` el de navegación.
- Consumir UI y navegación desde `@/presentation/ui` y `@/presentation/navigation`.
- Mantener componentes específicos de una ruta dentro de `src/app/**/_components`, `src/app/**/_actions` o `src/app/**/_schemas`.
- Los archivos especiales de App Router mantienen su convención de Next.js; la organización interna no crea rutas sin `page` o `route`.
- Solo `src/app` contiene páginas, layouts, Route Handlers y colaboradores privados de ruta.

## Datos y configuración específicos

- No hay fixtures estáticos runtime en este corte; los datos JSON editables viven exclusivamente en `src/infrastructure/persistence/json/data/`.
- La aplicación y los tests consumen fixtures desde su barrel público; los servicios server-only consumen persistencia mediante `@/infrastructure/persistence`.
- Los contratos de dominio se importan desde `@/domain/<domain>` y no se duplican en fixtures.
- Los fixtures son deterministas: IDs, fechas, códigos y relaciones permanecen estables entre ejecuciones.
- Configuración compartida usa constantes; configuración de entorno usa variables de entorno.
- Los servicios de dominio no construyen rutas físicas ni importan `node:fs`; usan el adapter JSON server-only.

## Rutas específicas

- Home y Kids viven bajo `src/app/(staff)/`; el grupo `(staff)` no aparece en sus URLs públicas.
- Las rutas públicas de autenticación viven bajo `src/app/auth/`: `/auth/login`, `/auth/parent-invitation` y `/auth/parent-invitation/[token]`.
- Solo `/` se conserva como redirect externo permanente en `next.config.ts`; las rutas legacy aprobadas responden 404.
- Ningún Client Component importa `@/infrastructure`, filesystem, una entrada `server` ni configuración privada.

## Excepciones de estilos del proyecto

- `src/app/globals.css` contiene Tailwind, reset, fuentes y tokens visuales globales.
- Todo color, sombra y gradiente se declara como token semántico en `src/app/globals.css`.

## Verificación específica del proyecto

Antes de finalizar:

- Confirmar que no se introduzcan fixtures fuera de la ubicación aprobada y que los JSON editables estén dentro de `src/infrastructure/persistence/json/data/`.
- Confirmar que fixtures y componentes UI se consuman mediante sus barrels públicos.
- Revisar que los modelos de dominio estén definidos en `src/domain/<domain>/`.
- Buscar colores literales fuera de `src/app/globals.css`.
- Ejecutar `npx eslint src`, `npx tsc --noEmit --incremental false` y `npm run build` cuando apliquen.

<!-- context7 -->
Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer — your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Always start with `resolve-library-id` using the library name and what to look up in the library's documentation, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and what to look up in the library's documentation (not single words), scoped to a single concept. If the question spans multiple distinct concepts (e.g., routing and auth and caching), make a separate `query-docs` call per concept with the same library ID, unless the question is about how the concepts interact — combined queries dilute ranking and return shallow results for each topic
4. Answer using the fetched docs
<!-- context7 -->
