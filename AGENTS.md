<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Proyecto

- Next.js 16.3.5 con App Router, React 19.2.8, TypeScript estricto y Tailwind CSS 4.
- El código vive en `app/`; `@/*` resuelve desde la raíz. Usar npm y conservar `package-lock.json`.
- Seguir las convenciones de archivos y las advertencias de la guía local de Next.js; no repetirlas ni contradecirlas aquí.

## Comandos y referencias

- `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- Typecheck: `npx tsc --noEmit --incremental false`.
- `references/` no es runtime. No editar `references/screens/support.js` ni `next-env.d.ts`.
- Guardar capturas y archivos de Playwright en `.playwright-mcp/<Feature>/`.
- Usar Context7 para documentación actual de frameworks y librerías.

## Workflow

- Para funcionalidades grandes, cargar `spec`; para implementar una spec aprobada, cargar `spec-impl` y respetar sus pausas de revisión.
- Validador de aceptación del proyecto: agente `@spec-acceptance-validator` (`.opencode/agent/spec-acceptance-validator.md`) y comando `/spec-acceptance-validator <spec>` (`.opencode/command/spec-acceptance-validator.md`). Corrige incumplimientos, marca solo criterios verificados y usa Context7 y Playwright cuando aplica.
- Los nombres de specs se relacionan con el módulo, no con una captura o prototipo.

## Arquitectura

- Usar feature-first: `app/components/ui` para UI genérica, `app/components/layout` para composición estructural, `app/shared` para código transversal, `app/data/mocks` para fixtures estáticos, `app/infrastructure` para persistencia e integraciones server-only y `app/features/<domain>` para cada dominio.
- Una feature puede contener `components`, `types`, `schemas`, `actions`, `services` y `utils`.
- Las features no dependen de internals de otras features. Exponer su API pública mediante `index.ts`.
- `app/components/ui/index.ts` expone la API pública de los componentes reutilizables.
- Consumir componentes UI desde `@/app/components/ui`, sin imports profundos a sus archivos internos.
- Mantener componentes específicos de negocio dentro de `app/features/<domain>/components`.
- Los archivos especiales de App Router mantienen su convención de Next.js; la organización interna no crea rutas sin `page` o `route`.

## Código

- Nombres de código y archivos en inglés. Mantener responsabilidades claras, bajo acoplamiento y evitar abstracciones o cambios no solicitados.
- Separar presentación, datos, validación, estado y lógica de negocio cuando mezclarlo reduzca claridad.

### Documentación

- APIs exportadas y componentes reutilizables DEBEN tener JSDoc.
- El JSDoc de funciones incluye descripción, `@param`, cada prop propia recibida y `@returns`.
- Si las props extienden atributos nativos, indicarlo. Usar `//` solo para decisiones o lógica no evidente.

### React

- Los componentes reutilizables viven en `app/components/ui/` y se exportan explícitamente desde su barrel.
- Los componentes reutilizables DEBEN aceptar y combinar `className?: string`.
- Cuando corresponda, las props extienden los atributos nativos del elemento HTML que renderiza el componente.
- Usar `Omit` para resolver conflictos entre atributos nativos y props propias.
- Las props específicas permanecen junto al componente. Exportar sus tipos desde el barrel solo cuando formen parte de la API pública.
- Los componentes UI son presentacionales y no contienen datos mock, lógica de negocio ni tipos de dominio.
- Los modelos de dominio viven en `app/features/<domain>/types/`.
- Eventos configurables y destinos se reciben mediante props; no agregar handlers, enlaces ni navegación ficticios.
- Mantener Server Components por defecto. Usar `"use client"` solo para estado, eventos, hooks o APIs del navegador.
- Los elementos interactivos incluyen los estados visuales aplicables: `hover`, `focus-visible`, `disabled`, `loading` o `cursor-pointer`.

### Datos y configuración

- Los mocks y fixtures estáticos viven en `app/data/mocks/<domain>/`; los datos JSON editables viven exclusivamente en `app/infrastructure/persistence/json/data/`.
- Cada dominio de mocks expone un `index.ts`; `app/data/mocks/index.ts` es la API pública raíz.
- La aplicación y los tests consumen fixtures desde `@/app/data/mocks`; los servicios server-only consumen persistencia mediante `@/app/infrastructure/persistence`.
- Los mocks importan sus contratos desde `app/features/<domain>/types/`.
- No declarar ni duplicar tipos de dominio dentro de los archivos mock.
- Los fixtures son deterministas: IDs, fechas, códigos y relaciones permanecen estables entre ejecuciones.
- Los componentes NO DEBEN contener datos mock o de negocio. Recibirlos por props o consumirlos desde la capa de datos correspondiente.
- Los Client Components reciben solo los datos necesarios mediante props y no importan colecciones completas de fixtures.
- Datos mock incluyen nombres, fechas, cantidades, publicaciones, etiquetas variables y opciones de navegación.
- Configuración compartida usa constantes; configuración de entorno usa variables de entorno. Se permiten literales técnicos, SVG y copy propio de componentes genéricos.

### Rutas e imports

- Home y Kids viven bajo `app/(staff)/`; el grupo `(staff)` no aparece en sus URLs públicas.
- Las rutas públicas de autenticación viven bajo `app/auth/`: `/auth/login` y `/auth/activate-account`.
- Los redirects legacy se mantienen en `next.config.ts` como permanentes: `/`, `/login`, `/activate-account` y `/kids/:id/edit`.
- Consumir `StaffSidebar` desde `@/app/components/layout` y la navegación desde `@/app/shared/config`.
- Ningún Client Component importa `app/infrastructure`, una entrada `server`, `node:fs` ni configuración privada.
- Los servicios de dominio no construyen rutas físicas ni importan `node:fs`; usan el adapter JSON server-only.

### Estilos

- Usar Tailwind para la mayoría de estilos y layout, conforme a la guía local de Next.js.
- Usar CSS Modules colocados junto al componente cuando estilos o variantes complejos no sean claros con utilities.
- `app/globals.css` contiene Tailwind, reset, fuentes y tokens visuales globales.
- Todo color, sombra y gradiente se declara como token semántico en `app/globals.css`.
- No usar valores hexadecimales, `rgb()`, `hsl()` ni colores arbitrarios directamente en componentes o CSS Modules.
- Los CSS Modules consumen colores mediante `var(--token-semantico)`.
- Los SVG reutilizables usan `currentColor` cuando corresponda.
- No usar estilos inline salvo para valores calculados dinámicamente.

## Verificación obligatoria

Antes de finalizar:

- Confirmar que todos los fixtures estáticos están dentro de `app/data/mocks/` y que los JSON editables están dentro de `app/infrastructure/persistence/json/data/`.
- Confirmar que mocks y componentes UI se consumen mediante sus barrels públicos.
- Revisar que los modelos de dominio estén definidos en `app/features/<domain>/types/`.
- Buscar colores literales fuera de `app/globals.css`.
- Revisar datos hardcodeados, estilos duplicados, JSDoc incompleto, soporte de `className` y límites Server/Client.
- Ejecutar `npx eslint app`, `npx tsc --noEmit --incremental false` y `npm run build` cuando apliquen; estas herramientas no sustituyen la revisión arquitectónica.
