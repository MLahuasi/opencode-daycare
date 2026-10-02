# SPEC 20 — Family Feed y grupos de acceso

> **Status:** Approved
> **Depends on:** SPEC 13, SPEC 15, SPEC 19
> **Date:** 2026-09-30
> **Objective:** Separar las reglas y consultas de Family Feed en sus capas propias y completar la organización de rutas por áreas de acceso.

## Scope

**In:**

- Crear `src/domain/family/feed/` para reglas puras de visibilidad y filtros.
- Crear `src/application/family/feed/` para consultas, DTOs y proyecciones.
- Crear composición server-only para Family Feed.
- Mover `/family-feed`, `/family-feed/day-summary` y `/family-feed/account` bajo `(general)` conservando sus URLs.
- Mantener `(staff)` exclusivamente para páginas de personal.
- Mover `FamilySidebar`, navegación y shells reutilizables a `src/components/layout`.
- Mantener componentes exclusivos del feed en `_components` de sus rutas.
- Eliminar `app/features/family` cuando todos sus consumidores hayan migrado.
- Eliminar `app/shared` distribuyendo cada módulo según responsabilidad.
- Mantener layouts locales de Kids y Posts; no crear layouts vacíos por simetría.
- Mantener filtros, autorización, orden, anuncios y engagement actuales.

**Out of scope (for future specs):**

- Añadir funcionalidades a Day Summary o Account.
- Cambiar la política de visibilidad familiar.
- Cambiar el diseño visual o el contenido del feed.
- Añadir un layout de grupo sin comportamiento compartido real.
- Modificar persistencia o datos.

## Data model

Esta spec no introduce ni modifica datos persistidos.

Los modelos de relaciones permanecen en `domain/family`; los tipos de filtros y proyecciones de feed se distribuyen entre:

```text
src/domain/family/feed/
src/application/family/feed/dto/
src/application/family/feed/queries/
```

## Implementation plan

1. Registrar las reglas actuales de autorización, filtros, anuncios, orden y comportamiento de las rutas auxiliares.
2. Extraer predicados puros de visibilidad y selección a `domain/family/feed`.
3. Crear consultas y proyecciones en `application/family/feed` sin imports de React ni Next.js.
4. Conectar persistencia, sesión y otros ports desde `infrastructure/composition/family`.
5. Mover Family Feed bajo `(general)` y conservar sus rutas públicas.
6. Mover sidebar, navegación y composición estructural a `components/layout`.
7. Colocar componentes exclusivos junto a las rutas y reducir las páginas a composición y adapters de entrada.
8. Eliminar `features/family` y `shared` después de comprobar que cada responsabilidad tiene nuevo propietario.
9. Ejecutar checks completos y verificar Family Feed, Posts compartidos y redirecciones auxiliares.

## Acceptance criteria

- [ ] Las reglas puras de Family Feed viven en `src/domain/family/feed`.
- [ ] Las consultas, comandos y proyecciones viven en `src/application/family/feed`.
- [ ] Application no importa React, Next.js, Infrastructure ni APIs HTTP.
- [ ] Existe composición server-only para Family Feed.
- [ ] `/family-feed` pertenece a `(general)` y conserva su URL.
- [ ] `/family-feed/day-summary` conserva su redirect actual.
- [ ] `/family-feed/account` conserva su redirect actual.
- [ ] `(staff)` contiene exclusivamente páginas destinadas al personal.
- [ ] `FamilySidebar` y la navegación estructural se consumen desde `src/components/layout`.
- [ ] No existe `app/features/family`.
- [ ] No existe `app/shared`.
- [ ] No se crea un `(general)/layout.tsx` sin comportamiento compartido real.
- [ ] Se conservan autorización, filtros, anuncios, deduplicación, orden y engagement.
- [ ] Los componentes no contienen colecciones mock ni lógica de negocio.
- [ ] `npx eslint app src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] Playwright verifica Family Feed, filtros, Posts compartidos y viewports móviles.

## Decisions

- **Sí:** mantener Day Summary y Account por compatibilidad de comportamiento actual.
- **Sí:** distribuir `shared` según responsabilidad en vez de reemplazarlo por otra carpeta ambigua.
- **No:** crear un nuevo módulo transversal genérico sin propietario concreto.
- **Sí:** conservar layouts locales cuando el shell compartido no sea realmente común.
- **No:** crear `(general)/layout.tsx` por simetría con `(staff)`.

## Risks

| Risk                                                                       | Mitigation                                                                          |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Se altera accidentalmente la privacidad del feed al extraer predicados.    | Comparar resultados para cada rol, niño, sala y filtro antes y después.             |
| La eliminación de `shared` duplica utilidades.                             | Asignar cada archivo a una responsabilidad concreta y mantener un solo propietario. |
| Un componente de Family queda ligado a una sola ruta después del traslado. | Mantenerlo en `_components` si no tiene consumidores múltiples.                     |

## What is **not** in this spec

- Nuevas páginas funcionales de Family.
- Rediseño del feed o cambios en sus reglas de acceso.
- Migración final del App Router a `src/app`.
