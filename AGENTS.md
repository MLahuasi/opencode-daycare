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
- Los nombres de specs se relacionan con el módulo, no con una captura o prototipo.

## Arquitectura

- Usar feature-first: `components/ui` para UI genérica, `shared` para código transversal y `features/<domain>` para cada dominio.
- Una feature puede contener `components`, `data`, `types`, `schemas`, `actions`, `services` y `utils`.
- Las features no dependen de internals de otras features. Exponer su API pública mediante `index.ts` y mover lo común a `shared`.
- Los archivos especiales de App Router mantienen su convención de Next.js; la organización interna no crea rutas sin `page` o `route`.

## Código

- Nombres de código y archivos en inglés. Mantener responsabilidades claras, bajo acoplamiento y evitar abstracciones o cambios no solicitados.
- Separar presentación, datos, validación, estado y lógica de negocio cuando mezclarlo reduzca claridad.

### Documentación

- APIs exportadas y componentes reutilizables DEBEN tener JSDoc.
- El JSDoc de funciones incluye descripción, `@param`, cada prop propia recibida y `@returns`.
- Si las props extienden atributos nativos, indicarlo. Usar `//` solo para decisiones o lógica no evidente.

### React

- Componentes reutilizables DEBEN aceptar y combinar `className?: string`.
- Eventos configurables se reciben por props; no agregar handlers, enlaces ni navegación ficticios.
- Mantener Server Components por defecto. Usar `"use client"` solo para estado, eventos, hooks o APIs del navegador.
- Los elementos interactivos incluyen los estados visuales aplicables: `hover`, `focus-visible`, `disabled`, `loading` o `cursor-pointer`.

### Datos y configuración

- Componentes NO DEBEN contener datos mock o de negocio. Ubicarlos tipados en `features/<feature>/data` o recibirlos por props.
- Datos mock incluyen nombres, fechas, cantidades, publicaciones, etiquetas variables y opciones de navegación.
- Configuración compartida usa constantes; configuración de entorno usa variables de entorno. Se permiten literales técnicos, SVG y copy propio de componentes genéricos.

### Estilos

- Usar Tailwind para la mayoría de estilos y layout, conforme a la guía local de Next.js.
- Usar CSS Modules colocados junto al componente cuando estilos o variantes complejos no sean claros con utilities.
- `globals.css` se reserva para Tailwind, reset, fuentes y tokens globales.
- Colores, sombras y gradientes compartidos usan tokens semánticos. No usar estilos inline salvo valores calculados dinámicamente.

## Verificación obligatoria

Antes de finalizar, revisar el diff por datos mock en componentes, estilos duplicados o hardcodeados, JSDoc incompleto y límites Server/Client. Ejecutar `npx eslint app`, `npx tsc --noEmit --incremental false` y `npm run build` cuando apliquen; estas herramientas no sustituyen la revisión arquitectónica.
