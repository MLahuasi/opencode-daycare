# SPEC 01 — Home del feed del personal

> **Status:** Implemented
> **Depends on:** Ninguna
> **Date:** 2026-09-15
> **Objective:** Implementar el Home `/` como un feed estático del personal de Sala Soles basado en la plantilla visual existente.

## Scope

**In:**

- Reemplazar la página inicial de Create Next App por el feed de personal en `/`.
- Mantener la composición visual de `references/screens/feed.dc.html`: sidebar, encabezado, compositor, divisor y tres publicaciones.
- Usar Fredoka para títulos y Nunito para el texto mediante `next/font/google`.
- Mantener colores, gradientes, sombras, bordes redondeados, placeholder de foto y scrollbar de la plantilla.
- Mantener las reacciones con corazón coral relleno y los contadores mock de la plantilla.
- Mostrar sidebar en escritorio y barra de navegación inferior en pantallas móviles.
- Exponer controles visuales personalizables con estados `hover`, `active` y `focus-visible`, sin ejecutar navegación ni acciones de negocio.
- Usar contenido mock fijo para Caro Giménez, Sala Soles, la fecha y las tres publicaciones.
- Mantener la implementación como Server Components, sin estado de cliente.
- Añadir landmarks y nombres accesibles para la interfaz visible.

**Out of scope (for future specs):**

- Autenticación, sesiones, autorización o cierre de sesión real.
- Base de datos, API, Server Actions, persistencia o carga remota.
- Crear o editar publicaciones, subir fotos, comentarios o reacciones mutables.
- Navegación real hacia Niños, Avisos, Mi cuenta, login, detalle o visor de fotos.
- Estados de carga, error, vacío, paginación o feed infinito.
- Cambio dinámico de fecha, selección de sala o cambio de rol.
- Instalación de un framework de tests o una librería de iconos.

## Data model

Esta feature introduce únicamente tipos y datos mock estáticos para renderizar el feed.

```ts
type PostType = "achievement" | "activity" | "announcement";

type FeedPost = {
  id: string;
  type: PostType;
  subject: string;
  initial?: string;
  time: string;
  dateTime: string;
  authorLabel?: string;
  recipient: string;
  body: string;
  reactions: number;
  comments: number;
  hasMedia?: boolean;
};
```

Los datos deben conservar los valores visibles de `references/screens/feed.dc.html`: Caro Giménez, Sala Soles, 12 niños, martes 17 jun, Mateo y el anuncio general.

## Implementation plan

1. Actualizar `app/layout.tsx` para usar Fredoka y Nunito, `lang="es-EC"` y metadata de OpenDayCare.
2. Actualizar `app/globals.css` con los tokens de color de la plantilla, tipografías, reset visual, scrollbar y reglas responsive globales.
3. Crear `app/components/ui/button.tsx` como control presentacional personalizable mediante props y `className`, con estados visuales accesibles.
4. Crear `app/features/layout/components/staff-sidebar.tsx` con marca, CTA, navegación, perfil y versión móvil de la navegación.
5. Crear `app/features/feed/types/feed.ts` y `app/features/feed/data/feed-mock.ts` con el modelo y el contenido estático del feed.
6. Crear `app/features/feed/components/feed-post-card.tsx` para la tarjeta reutilizable, sus variantes, iconos inline y placeholder de foto.
7. Crear `app/features/feed/components/feed-content.tsx` para el saludo, compositor, divisor y lista de publicaciones, y exponer las APIs públicas mediante los `index.ts` de cada feature.
8. Reemplazar `app/page.tsx` para componer el sidebar y el contenido del feed, manteniendo `/` sin navegación real ni lógica de negocio.

## Acceptance criteria

- [x] `/` carga sin errores de servidor, consola o hidratación.
- [x] La página muestra sidebar de 248px y feed con ancho máximo de 760px en escritorio.
- [x] La página muestra barra de navegación inferior en una pantalla móvil.
- [x] El contenido visible coincide con los datos mock de la plantilla: Caro Giménez, Sala Soles, 12 niños, martes 17 jun y tres publicaciones.
- [x] Los corazones y contadores usan el tratamiento coral definido en el HTML de referencia.
- [x] Las fuentes Fredoka y Nunito se cargan mediante `next/font/google`.
- [x] Los botones y enlaces visuales tienen estados `hover`, `active` y `focus-visible` sin handlers ficticios.
- [x] El feed contiene landmarks semánticos, un único H1, `aria-current` para Feed y nombre accesible para el control de cierre de sesión.
- [x] No se implementan autenticación, base de datos, persistencia ni rutas adicionales.
- [x] `npx eslint app` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] Las capturas de verificación se almacenan bajo `.playwright-mcp/Home/`.

## Decisions

- **Sí:** `references/screens/feed.dc.html` es la fuente visual principal porque fue el archivo solicitado explícitamente.
- **Sí:** reacciones coral rellenas porque corresponden al HTML de referencia.
- **Sí:** mock fijo porque no existe una fuente de datos y la feature excluye persistencia.
- **Sí:** barra inferior en móvil porque la plantilla no define una adaptación responsive y el sidebar completo no es usable en pantallas estrechas.
- **Sí:** controles visibles sin destinos reales, con estados CSS personalizables, porque se pidió conservar la apariencia y los efectos de puntero sin implementar navegación.
- **Sí:** Server Components porque el feed no necesita estado ni APIs del navegador.
- **No:** enlaces `href="#"` o handlers ficticios; producirían interacción engañosa.
- **No:** instalar una librería de iconos; los iconos de la plantilla pueden mantenerse como SVG inline y no hay reutilización suficiente todavía.
- **No:** copiar las capturas o prototipos a `public/`; son referencias y el placeholder de foto es parte del diseño.

## Risks

| Risk                                                                         | Mitigation                                                                                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| La paleta de la plantilla puede tener contraste insuficiente.                | Mantener la fidelidad solicitada y revisar contraste durante la verificación; no cambiar colores sin una decisión explícita. |
| El lint global incluye `references/screens/support.js`, un runtime generado. | Ejecutar `npx eslint app` para validar la aplicación y no modificar el archivo generado.                                     |
| Las fuentes remotas pueden no estar disponibles durante un build aislado.    | Usar `next/font/google` como establece el stack actual y verificar `npm run build`.                                          |

## What is **not** in this spec

- Autenticación, base de datos, persistencia y APIs.
- Navegación real entre rutas o implementación de rutas adicionales.
- Publicación, edición, comentarios, reacciones mutables o carga de fotos.
- Tests automatizados o instalación de nuevas librerías de testing.
