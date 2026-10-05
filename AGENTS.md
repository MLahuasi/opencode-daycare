<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

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

## Arquitectura

- Usar arquitectura por capas: `src/app` para routing y adapters de entrada, `src/application` para casos de uso y ports, `src/domain` para reglas puras, `src/infrastructure` para adapters concretos, `src/presentation` para UI y view models, y `src/composition` para ensamblar dependencias.
- Las responsabilidades de dominio se organizan por subdominio dentro de cada capa; exponer APIs públicas mediante `index.ts` cuando exista más de un consumidor.
- No crear `features`, `shared`, `src/components` ni `src/infrastructure/composition`.
- Aplicar inversión de dependencias en adapters: la lógica de dominio debe depender de interfaces o puertos definidos en la capa de dominio o contratos compartidos, nunca de SDKs o proveedores concretos.
- Inyectar las implementaciones de infraestructura desde una composición externa; cambiar de proveedor no debe requerir modificar la lógica de negocio.
- `src/presentation/ui/index.ts` expone la API pública de los componentes reutilizables.
- Consumir componentes UI desde `@/presentation/ui`, sin imports profundos a sus archivos internos.
- Mantener componentes específicos de una ruta dentro de `src/app/**/_components`, `src/app/**/_actions` o `src/app/**/_schemas`.
- Los archivos especiales de App Router mantienen su convención de Next.js; la organización interna no crea rutas sin `page` o `route`.
- Solo `src/app` contiene páginas, layouts, Route Handlers y colaboradores privados de ruta.

## Código

- Nombres de código y archivos en inglés. Mantener responsabilidades claras, bajo acoplamiento y evitar abstracciones o cambios no solicitados.
- Separar presentación, datos, validación, estado y lógica de negocio cuando mezclarlo reduzca claridad.

### Documentación

- APIs exportadas y componentes reutilizables DEBEN tener JSDoc.
- El JSDoc de funciones incluye descripción, `@param`, cada prop propia recibida y `@returns`.
- Si las props extienden atributos nativos, indicarlo. Usar `//` solo para decisiones o lógica no evidente.

### React

- Los componentes reutilizables viven en `src/presentation/ui/` y se exportan explícitamente desde su barrel.
- Los componentes reutilizables DEBEN aceptar y combinar `className?: string`.
- Cuando corresponda, las props extienden los atributos nativos del elemento HTML que renderiza el componente.
- Usar `Omit` para resolver conflictos entre atributos nativos y props propias.
- Las props específicas permanecen junto al componente. Exportar sus tipos desde el barrel solo cuando formen parte de la API pública.
- Los componentes UI son presentacionales y no contienen datos mock, lógica de negocio ni tipos de dominio.
- Los modelos de dominio viven en `src/domain/<domain>/`.
- Eventos configurables y destinos se reciben mediante props; no agregar handlers, enlaces ni navegación ficticios.
- Mantener Server Components por defecto. Usar `"use client"` solo para estado, eventos, hooks o APIs del navegador.
- Los elementos interactivos incluyen los estados visuales aplicables: `hover`, `focus-visible`, `disabled`, `loading` o `cursor-pointer`.

### Datos y configuración

- No hay fixtures estáticos runtime en este corte; los datos JSON editables viven exclusivamente en `src/infrastructure/persistence/json/data/`.
- La aplicación y los tests consumen fixtures desde su barrel público; los servicios server-only consumen persistencia mediante `@/infrastructure/persistence`.
- Los contratos de dominio se importan desde `@/domain/<domain>` y no se duplican en fixtures.
- No declarar ni duplicar tipos de dominio dentro de los archivos mock.
- Los fixtures son deterministas: IDs, fechas, códigos y relaciones permanecen estables entre ejecuciones.
- Los componentes NO DEBEN contener datos mock o de negocio. Recibirlos por props o consumirlos desde la capa de datos correspondiente.
- Los Client Components reciben solo los datos necesarios mediante props y no importan colecciones completas de fixtures.
- Datos mock incluyen nombres, fechas, cantidades, publicaciones, etiquetas variables y opciones de navegación.
- Configuración compartida usa constantes; configuración de entorno usa variables de entorno. Se permiten literales técnicos, SVG y copy propio de componentes genéricos.

### Rutas e imports

- Home y Kids viven bajo `src/app/(staff)/`; el grupo `(staff)` no aparece en sus URLs públicas.
- Las rutas públicas de autenticación viven bajo `src/app/auth/`: `/auth/login`, `/auth/parent-invitation` y `/auth/parent-invitation/[token]`.
- Solo `/` se conserva como redirect externo permanente en `next.config.ts`; las rutas legacy aprobadas responden 404.
- Consumir UI y navegación desde `@/presentation/ui` y `@/presentation/navigation`.
- Ningún Client Component importa `@/infrastructure`, filesystem, una entrada `server` ni configuración privada.
- Los servicios de dominio no construyen rutas físicas ni importan `node:fs`; usan el adapter JSON server-only.

### Límites de dependencia

- Domain no depende de Application, Infrastructure, Presentation, Composition, Next.js, React, filesystem ni SDKs externos.
- Application no depende de Infrastructure, Presentation, Composition, Next.js ni React.
- Infrastructure implementa ports de Application y no depende de Presentation, Composition ni `src/app`.
- Presentation no depende de Infrastructure ni Composition.
- Composition puede depender de Application e Infrastructure, pero no de Presentation ni `src/app`.
- `src/app` delega en Application y Composition; no contiene reglas de negocio ni construye adapters directamente.

### Estilos

- Usar Tailwind para la mayoría de estilos y layout, conforme a la guía local de Next.js.
- Usar CSS Modules colocados junto al componente cuando estilos o variantes complejos no sean claros con utilities.
- `src/app/globals.css` contiene Tailwind, reset, fuentes y tokens visuales globales.
- Todo color, sombra y gradiente se declara como token semántico en `src/app/globals.css`.
- No usar valores hexadecimales, `rgb()`, `hsl()` ni colores arbitrarios directamente en componentes o CSS Modules.
- Los CSS Modules consumen colores mediante `var(--token-semantico)`.
- Los SVG reutilizables usan `currentColor` cuando corresponda.
- No usar estilos inline salvo para valores calculados dinámicamente.

## Verificación obligatoria

Antes de finalizar:

- Confirmar que no se introduzcan fixtures fuera de la ubicación aprobada y que los JSON editables estén dentro de `src/infrastructure/persistence/json/data/`.
- Confirmar que fixtures y componentes UI se consumen mediante sus barrels públicos.
- Revisar que los modelos de dominio estén definidos en `src/domain/<domain>/`.
- Buscar colores literales fuera de `src/app/globals.css`.
- Revisar datos hardcodeados, estilos duplicados, JSDoc incompleto, soporte de `className` y límites Server/Client.
- Ejecutar `npx eslint src`, `npx tsc --noEmit --incremental false` y `npm run build` cuando apliquen; estas herramientas no sustituyen la revisión arquitectónica.

<!-- context7 -->
Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer — your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Always start with `resolve-library-id` using the library name and what to look up in the library's documentation, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and what to look up in the library's documentation (not single words), scoped to a single concept. If the question spans multiple distinct concepts (e.g. routing and auth and caching), make a separate `query-docs` call per concept with the same library ID, unless the question is about how the concepts interact — combined queries dilute ranking and return shallow results for each topic
4. Answer using the fetched docs
<!-- context7 -->
