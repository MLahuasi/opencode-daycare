# SPEC 21 — Presentation, Composition y cierre de capas legacy

> **Status:** Implement
> **Depends on:** SPEC 18, SPEC 19, SPEC 20
> **Date:** 2026-10-02
> **Objective:** Consolidar Presentation y Composition, conectar el runtime con Application e Infrastructure y eliminar las capas legacy antes del corte de `app/` a `src/app/`.

## Scope

**In:**

- Crear `src/presentation/` para UI reutilizable, navegación, presenters y view models visuales.
- Crear `src/composition/` para factories server-only que conecten Application con Infrastructure.
- Mover `src/components/` a `src/presentation/` conservando exports, props, estilos y comportamiento.
- Mover la navegación visual desde `src/config/navigation/` a Presentation; conservar configuración no visual en `src/config/`.
- Mover `src/infrastructure/composition/` a `src/composition/`.
- Migrar Auth, Family, Kids y Posts para consumir Application y Composition desde sus entradas de Presentation.
- Mantener rutas, Route Groups, Server Actions y colaboradores privados dentro de `app/` durante esta spec.
- Mantener componentes exclusivos de una ruta en sus `_components`, `_actions` y `_schemas`.
- Eliminar `app/features/`, `app/infrastructure/`, `app/shared/`, `src/components/` y `src/infrastructure/composition/` después de migrar todos sus consumidores.
- Eliminar dependencias desde `src/` hacia `app/`.
- Separar DTOs neutrales de view models, labels, hrefs, formatos localizados y copy visual.
- Mantener reglas de negocio, autorización, URLs, redirects y datos persistidos actuales.

**Out of scope (for future specs):**

- Mover el App Router de `app/` a `src/app/`; corresponde a SPEC 22.
- Cambiar el framework o la versión de Next.js.
- Cambiar reglas de negocio, autorización funcional o persistencia.
- Rediseñar páginas o añadir funcionalidades.
- Cambiar el contenido o estructura de los JSON.
- Crear un contenedor DI externo o introducir un proveedor nuevo.

## Data model

Esta spec no introduce ni modifica estructuras de negocio ni datos persistidos.

La separación de contratos queda definida así:

```text
src/domain/           Entidades, value objects, invariantes y reglas puras.
src/application/      Use cases, commands, queries, DTOs y ports.
src/infrastructure/   Repositorios, proveedores y adapters concretos.
src/presentation/     UI, presenters, view models y navegación visual.
src/composition/      Factories que ensamblan Application e Infrastructure.
app/                  Routing y adapters de entrada de Next.js, temporalmente.
```

Los campos visuales como labels, hrefs, tonos, formatos localizados y mensajes no se consideran modelos de dominio.

## Implementation plan

1. Registrar dependencias actuales entre `app`, `src`, features, componentes, Composition, Infrastructure y los consumidores runtime.
2. Crear `src/presentation/` y trasladar `src/components/ui/`, `src/components/layout/` y los componentes Post compartidos.
3. Trasladar navegación y configuración visual a Presentation, manteniendo configuración técnica en `src/config/`.
4. Crear `src/composition/` y trasladar las composiciones de Auth, Family, Kids y Posts desde Infrastructure.
5. Eliminar dependencias de Infrastructure y Composition hacia `app/features`, `app/infrastructure` y otros módulos de Presentation.
6. Conectar las rutas y Server Actions activas con los casos de uso de Application mediante Composition.
7. Migrar schemas de request, presenters y view models fuera de Domain/Application cuando contengan decisiones visuales o de transporte.
8. Eliminar `app/features/`, `app/infrastructure/`, `app/shared/`, `src/components/` y `src/infrastructure/composition/` después de búsquedas sin referencias.
9. Ejecutar auditoría completa de capas, rutas, datos, límites Server/Client y documentación.

## Acceptance criteria

- [x] Existe `src/presentation/` con UI, layout, navegación y componentes reutilizables.
- [x] Existe `src/composition/` con factories server-only de Auth, Family, Kids y Posts.
- [x] No existe `src/components/`.
- [x] No existe `src/infrastructure/composition/`.
- [x] No existe `app/features/`.
- [x] No existe `app/infrastructure/`.
- [x] No existe `app/shared/`.
- [x] `src/domain/` no importa Application, Presentation, Infrastructure, Composition, Next.js, React, filesystem ni SDKs.
- [x] `src/application/` no importa Presentation, Infrastructure, Composition, React, Next.js ni APIs HTTP.
- [x] `src/infrastructure/` implementa ports sin importar Presentation, Composition ni `app/`.
- [x] `src/composition/` conecta ports de Application con adapters de Infrastructure.
- [x] `src/presentation/` no importa Infrastructure ni Composition.
- [x] Ningún archivo bajo `src/` importa `app/features`, `app/infrastructure` o colaboradores privados de `app`.
- [x] Las páginas y Server Actions delegan en Application y usan Composition cuando requieren adapters concretos.
- [x] Los componentes exclusivos permanecen junto a sus rutas dentro de `_components`, `_actions` o `_schemas`.
- [x] Domain no contiene labels, hrefs, copy, formatos localizados ni view models visuales.
- [x] Application contiene DTOs neutrales y no decisiones específicas de UI.
- [x] Se conservan autorización, filtros, orden, engagement, redirects y URLs.
- [ ] Los JSON mantienen sus hashes byte a byte.
- [x] `npx eslint app src` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] `git diff --check` termina correctamente.
- [x] Playwright verifica Auth, Home, Kids, Family Feed, Posts, comentarios, reacciones y viewports móviles.

## Decisions

- **Sí:** separar `src/presentation` de `src/application`; Presentation depende de casos de uso, no los reemplaza.
- **Sí:** separar `src/composition` de Infrastructure porque ensamblar dependencias no es un adapter técnico.
- **Sí:** mantener temporalmente `app/` como App Router hasta SPEC 22.
- **Sí:** mantener componentes privados cerca de sus rutas cuando no tengan consumidores múltiples.
- **No:** colocar casos de uso dentro de `src/app`.
- **No:** permitir que Application importe React, Next.js o Infrastructure.
- **No:** mantener implementaciones paralelas activas en `app/features` y `src/application`.
- **No:** cambiar reglas de negocio o datos durante la consolidación.

## Risks

| Risk                                                                      | Mitigation                                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| El runtime continúa usando servicios legacy después de crear Application. | Verificar consumidores reales y eliminar cada servicio solo después de conectar su entrada. |
| Composition queda acoplado a una feature de Presentation.                 | Prohibir imports desde `src/composition` hacia `app/` y usar únicamente ports.              |
| DTOs mezclan datos de negocio con copy visual.                            | Separar proyección neutral de presenter y view model de Presentation.                       |
| Se rompe una Server Action al moverla.                                    | Verificar autorización, revalidación, redirects y estados serializables por mutación.       |
| Se elimina una implementación aún consumida indirectamente.               | Ejecutar búsquedas literales y build antes de cada eliminación.                             |

## What is **not** in this spec

- Migración física de `app/` a `src/app/`.
- Cambio de alias `@/*`.
- Eliminación del App Router raíz.
- Nuevas funcionalidades o cambios de diseño.
- Cambios en proveedores, persistencia o datos.
