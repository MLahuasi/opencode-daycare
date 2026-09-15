<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Contexto del proyecto

- Es una aplicación Next.js 16.3.5 con App Router, React 19.2.8, TypeScript estricto y Tailwind CSS 4.
- El código de aplicación vive directamente en `app/`; no existe un directorio `src/`.
- El alias `@/*` resuelve desde la raíz del repositorio; usa npm y conserva `package-lock.json`.

## Comandos

- `npm run dev`: inicia el servidor de desarrollo en `http://localhost:3000`.
- `npm run build`: genera el build de producción; `npm run start` lo sirve.
- `npm run lint`: ejecuta ESLint sobre todo el repositorio.
- No hay scripts ni configuración de tests o typecheck; para una comprobación de tipos usa `npx tsc --noEmit --incremental false`.

## Referencias y archivos generados

- `references/` contiene prototipos y capturas visuales; no forma parte del runtime de `app/`.
- No edites `references/screens/support.js`: es un runtime generado y puede producir errores de lint ajenos a la aplicación.
- No edites `next-env.d.ts`: Next.js lo genera automáticamente.

## MCPs

- Cualquier Screenshots o archivo relacionado a Playwright se deben almacenar en `.playwright-mcp` en directorios relacionados a la funcionalidad, por ejemplo: Home
- Usar Context7 para obtener información actualizada acerca del Framework.

## Spec Driven Development - Skills

- Para funcionalidades grandes, cargar la skill `spec` desde `.agents/skills/spec` antes de escribir código. La skill define y guarda especificaciones en `specs/`.
- Cargar `spec-impl` desde `.agents/skills/spec-impl` solo para implementar una especificación con estado aprobado. Respeta su flujo de rama y sus pausas de revisión.

- `/spec` para crear especificaciones
- `/spec-impl` para implementar las especificaciones

- El nombre del archivo spec debe ser relacionado al módulo o pagina que se va a generar, no a la pagina o screenshot ejemplo.

## Arquitectura

Usar arquitectura **feature-first** dentro de `app`.

- `components/ui`: componentes genéricos reutilizables (`Button`, `Input`, `Select`, `Dialog`, `Card`, `Table`).
- `shared`: código reutilizado por varias features (`components`, `types`, `utils`, `constants`).
- `features`: funcionalidades organizadas por dominio (`auth`, `layout`, `children`, etc.).
- Cada feature puede contener `components`, `types`, `schemas`, `actions`, `services` y `utils`.
- Una feature no debe depender directamente de componentes internos de otra; mover elementos compartidos a `shared`.
- Usar `index.ts` como barrel para exponer la API pública del módulo y evitar dependencias circulares.

## Reglas de código

- Escribir nombres de variables, funciones, clases, interfaces, types, componentes y archivos en inglés.
- Aplicar Clean Code: nombres descriptivos, responsabilidades claras y código simple.
- Aplicar el principio de responsabilidad única (SRP): cada componente, función, clase o módulo debe tener una única responsabilidad y una razón principal para cambiar.
- Separar presentación, acceso a datos, validación, estado y lógica de negocio cuando mezclar estas responsabilidades reduzca la claridad.
- Evitar sobreingeniería, abstracciones prematuras y cambios no relacionados con la tarea.

### Comentarios

- Usar `//` para comentarios breves sobre lógica o intención relevante.
- Usar JSDoc `/** ... */` para documentar funciones, clases e interfaces cuando sea necesario.
- En funciones, documentar descripción, parámetros con `@param` y retorno con `@returns` cuando corresponda.
- Evitar comentarios que repitan literalmente lo que ya expresa el código.

### Componentes React

- Los componentes reutilizables pueden recibir `className?: string` para personalizar estilos.
- Recibir mediante props los eventos o acciones configurables (`onClick`, `onChange`, `onSubmit`, etc.).
- Mantener el estado en el nivel adecuado y evitar duplicarlo.
- Los elementos interactivos deben incluir estados visuales adecuados (`hover`, `focus`, `disabled`, `loading`, `cursor-pointer`) cuando corresponda.
- No agregar eventos ficticios para simular funcionalidades no implementadas.

### Estilos

- Usar Tailwind CSS como sistema principal de estilos.
- Usar clases Tailwind directamente para layout y ajustes específicos del componente.
- Centralizar estilos visuales reutilizables en componentes UI, variantes o utilidades compartidas.
- Evitar repetir conjuntos grandes de clases Tailwind en múltiples componentes.
- Preferir reutilizar o extender un componente existente antes que duplicar sus estilos.
- Mantener colores y tokens visuales compartidos centralizados y con nombres semánticos.

### Valores y configuración

- Evitar valores hardcodeados de configuración o negocio.
- Usar constantes, configuración o variables de entorno cuando corresponda.
- Se permiten valores hardcodeados en mocks y detalles simples de implementación.

## Principios generales

- Priorizar simplicidad, legibilidad y mantenibilidad.
- Favorecer reutilización real, bajo acoplamiento y alta cohesión.
- Mantener la lógica de negocio fuera de componentes visuales cuando sea posible.
- Evitar sobreingeniería y abstracciones prematuras.
