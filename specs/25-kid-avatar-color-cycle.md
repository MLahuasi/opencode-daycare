# SPEC 25 — Alternancia de colores para avatares infantiles

> **Status:** Draft
> **Depends on:** SPEC 24
> **Date:** 2026-10-07
> **Objective:** Alternar los seis tonos semánticos existentes en los avatares infantiles según su posición visible para mejorar la identificación visual sin persistir colores.

## Scope

**In:**

- Centralizar la paleta de avatares infantiles en la API pública de `@/presentation/ui`.
- Usar los tonos existentes `coral`, `blue`, `pink`, `green`, `yellow` y `purple`.
- Asignar tonos por posición visible mediante un ciclo.
- Recalcular la posición después de búsquedas, filtros, ordenamientos o cambios en la lista.
- Aplicar la alternancia a listas de Kids, filtros de Family Feed, formularios de Posts, tarjetas de Feed y detalles principales de niño o publicación infantil.
- Contar únicamente avatares infantiles en listas mixtas.
- Permitir que `Varios niños` participe en el mismo ciclo como publicación infantil.
- Usar `coral`, posición cero, en pantallas con un único avatar infantil aislado.
- Mantener el tamaño compacto actual de las iniciales en los pills del formulario.
- Mantener contraste y estados seleccionados existentes.

**Out of scope (for future specs):**

- Agregar colores, gradientes o tokens visuales nuevos.
- Persistir `avatarTone` en `kids.json`, `feed.json` u otra colección.
- Cambiar colores de avatares de personal, familias, padres, comentarios o reacciones.
- Cambiar el significado de los avatares de sala o anuncios.
- Rediseñar los componentes de avatar.
- Crear preferencias de color por usuario.

## Data model

Esta spec no introduce datos persistidos ni modifica contratos de dominio.

La API pública de UI deberá exponer una paleta pura y reutilizable equivalente a:

```ts
const AVATAR_TONES = [
  "coral",
  "blue",
  "pink",
  "green",
  "yellow",
  "purple",
] as const;

type AvatarTone = (typeof AVATAR_TONES)[number];

function getAvatarToneByPosition(index: number): AvatarTone;
```

La función debe devolver el tono en `index % AVATAR_TONES.length` y no debe depender de infraestructura, sesión, datos persistidos ni APIs de navegador.

## Implementation plan

1. Exponer `AvatarTone`, la paleta y la función de ciclo desde `@/presentation/ui` sin cambiar colores declarados ni introducir dependencias server-only.
2. Adaptar `/kids` para calcular los tonos desde la posición de los elementos visibles después del filtrado y conservar un índice global al agrupar por sala.
3. Adaptar `/kids/[slug]` para usar la posición cero en el avatar infantil aislado.
4. Adaptar los filtros de `/family-feed` para que solo los niños consuman posiciones y el ciclo comience en `coral`.
5. Adaptar la sección “Para” de `/posts/new` y `/posts/[postId]/edit` para alternar los seis tonos sin cambiar el tamaño compacto de las iniciales.
6. Adaptar las tarjetas de Feed para pasar la posición del avatar infantil visible, excluyendo salas y anuncios, y eliminar overrides CSS que impidan aplicar el tono.
7. Adaptar el detalle de Posts para usar `coral` en el avatar infantil aislado y conservar un tratamiento no infantil para salas y anuncios.
8. Verificar contraste, estados seleccionados, búsqueda, filtros, listas mixtas, responsive y accesibilidad en todas las pantallas incluidas.

## Acceptance criteria

- [ ] Existe una única paleta pública con los tonos `coral`, `blue`, `pink`, `green`, `yellow` y `purple`.
- [ ] La paleta no agrega colores ni tokens fuera de `src/app/globals.css`.
- [ ] La función de ciclo asigna tonos según la posición visible y reinicia después del sexto tono.
- [ ] La función de ciclo es pura y no depende de infraestructura ni datos persistidos.
- [ ] `/kids` alterna tonos según el orden visible después de aplicar búsqueda o filtros.
- [ ] El índice de colores en `/kids` continúa globalmente entre grupos de salas.
- [ ] `/kids/[slug]` usa `coral` para el avatar infantil aislado.
- [ ] Los filtros de `/family-feed` asignan el primer tono `coral` al primer niño visible.
- [ ] Salas y opciones no infantiles de Family Feed no consumen posiciones del ciclo.
- [ ] La sección “Para” de Posts alterna los seis tonos entre niños visibles.
- [ ] El tamaño compacto de las iniciales de Posts se conserva.
- [ ] Los estados seleccionados de los pills mantienen contraste legible con cada tono.
- [ ] Las tarjetas de Feed asignan colores solo a avatares de publicaciones infantiles.
- [ ] Las tarjetas de salas y anuncios no desplazan la posición de los avatares infantiles.
- [ ] Una publicación con `Varios niños` consume una posición del ciclo como publicación infantil.
- [ ] El detalle de una publicación infantil usa `coral` como posición cero.
- [ ] Los avatares de personal, familias, padres, comentarios y reacciones no cambian por esta spec.
- [ ] No se persiste `avatarTone` en ningún JSON ni contrato de dominio.
- [ ] La alternancia funciona en viewport de escritorio y móvil.
- [ ] Los cambios no producen errores de consola ni violaciones de accesibilidad en los flujos verificados.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] Playwright verifica Kids, Family Feed, Posts y detalles en los viewports definidos.

## Decisions

- **Sí:** usar los seis tonos ya declarados, porque la aplicación ya tiene tokens y estilos semánticos para ellos.
- **No:** crear colores nuevos, porque aumentaría la superficie visual sin una necesidad funcional.
- **Sí:** centralizar la paleta en `@/presentation/ui`, porque actualmente existen secuencias duplicadas e inconsistentes.
- **Sí:** asignar por posición visible, porque el objetivo es distinguir elementos en la lista actual.
- **No:** persistir el tono por niño, porque el color depende del contexto visible y no es un dato de negocio.
- **Sí:** recalcular después de filtrar u ordenar, porque el índice debe representar lo que la persona está viendo.
- **Sí:** contar solo avatares infantiles, porque salas, anuncios y perfiles no representan niños individuales.
- **Sí:** usar `coral` en un avatar infantil aislado, porque ocupa la posición cero del ciclo.
- **Sí:** incluir `Varios niños` en el ciclo, porque representa una publicación infantil compartida.
- **No:** cambiar avatares de adultos, porque requieren una semántica visual independiente.

## Risks

| Risk | Mitigation |
| --- | --- |
| El mismo niño cambia de color entre pantallas. | Documentar que la asignación depende de la posición visible y no del ID. |
| El filtrado reinicia o desplaza colores incorrectamente. | Calcular el índice después del filtrado y verificar listas mixtas con Playwright. |
| Un override CSS mantiene todos los avatares azules. | Retirar reglas específicas que sobrescriban los tonos del componente `Avatar`. |
| El cambio altera avatares de adultos por reutilización del componente. | Aplicar la paleta únicamente a los puntos de renderizado identificados como infantiles. |
| El tamaño del formulario cambia al usar `Avatar`. | Mantener una variante compacta o conservar el círculo actual con clases de tono semánticas. |

## What is **not** in this spec

- Persistencia de colores en niños o publicaciones.
- Paletas nuevas o selección manual de colores.
- Cambios en avatares de personas adultas.
- Cambios en permisos, destinatarios o consentimiento de fotos.
- Rediseño del componente `Avatar`.
