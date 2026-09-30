# SPEC 16 — Fundación de arquitectura por capas

> **Status:** Approved
> **Depends on:** SPEC 08, SPEC 15
> **Date:** 2026-09-30
> **Objective:** Separar componentes reutilizables, configuración transversal y persistencia concreta en capas externas al App Router sin cambiar el comportamiento funcional.

## Why this spec exists

La aplicación mantiene componentes, configuración, persistencia y rutas bajo `app/`.

La arquitectura objetivo requiere que `app/` conserve únicamente responsabilidades de entrada y routing.

Esta spec prepara las capas externas sin mover todavía el directorio del App Router.

## Scope

**In:**

- Crear `src/components/ui/` para controles visuales genéricos.
- Crear `src/components/layout/` para shells, navegación y composición estructural.
- Crear `src/infrastructure/persistence/json/` para el adapter JSON server-only.
- Mover los JSON editables a `src/infrastructure/persistence/json/data/` sin cambiar su contenido byte a byte.
- Distribuir configuración y utilidades transversales según su responsabilidad concreta.
- Actualizar imports desde `app/` hacia las nuevas capas mediante `@/src/...`.
- Mantener el App Router en `app/` durante esta spec.
- Mantener el comportamiento visual, las URLs y las reglas de negocio existentes.
- Verificar los flujos afectados con ESLint, TypeScript, build, búsquedas estáticas y Playwright.

**Out of scope (for future specs):**

- Mover `app/` a `src/app`.
- Eliminar `app/features`.
- Crear `application` o `domain`.
- Cambiar rutas públicas, redirects o datos persistidos.
- Introducir un contenedor DI o un framework de testing.

## Data model

Esta spec no introduce estructuras de negocio nuevas.

Los archivos JSON mantienen exactamente sus bytes, nombres, orden de registros y estructura raíz actuales.

La interfaz técnica del adapter conserva operaciones equivalentes a `readCollection`, `writeCollection`, `withWriteLock` y `withJsonTransaction`.

## Implementation plan

1. Registrar hashes byte a byte de todos los JSON editables y una línea base de imports de componentes, configuración e infraestructura.
2. Crear `src/components/ui/` y trasladar sus componentes y CSS Modules, conservando exports, props y apariencia.
3. Crear `src/components/layout/` y trasladar la composición estructural actualmente compartida.
4. Crear `src/infrastructure/persistence/json/` y mover allí el adapter server-only sin cambiar sus contratos.
5. Trasladar los JSON editables a `src/infrastructure/persistence/json/data/` conservando sus bytes y actualizar la resolución física del adapter.
6. Distribuir utilidades y configuración transversal fuera de `app/` según su responsabilidad, sin crear módulos genéricos sin consumidores reales.
7. Actualizar los consumidores existentes a los nuevos entry points y eliminar los archivos antiguos solo después de una búsqueda sin referencias.
8. Ejecutar los checks completos y validar Home, Auth, Kids, invitaciones y feeds en escritorio y móvil.

## Acceptance criteria

- [ ] `src/components/ui/` contiene los controles UI reutilizables actuales.
- [ ] `src/components/layout/` contiene la navegación y shells estructurales actuales.
- [ ] `src/infrastructure/persistence/json/` está marcado como server-only.
- [ ] Todos los JSON editables viven en `src/infrastructure/persistence/json/data/`.
- [ ] Los hashes byte a byte de los JSON antes y después del traslado son iguales.
- [ ] El adapter JSON mantiene lectura, escritura atómica, lock y rollback equivalentes.
- [ ] Ningún Client Component importa `src/infrastructure`.
- [ ] No quedan imports runtime hacia los directorios antiguos trasladados.
- [ ] El App Router sigue funcionando desde `app/`.
- [ ] No se modifican URLs, redirects, reglas de negocio ni registros persistidos.
- [ ] `npx eslint app src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] Playwright verifica Home, Auth, Kids, invitación y ambos feeds en escritorio y móvil.

## Decisions

- **Sí:** migrar las capas externas antes que el router para reducir el riesgo del corte de `src/app`.
- **Sí:** usar `src/` como destino final de las capas de aplicación.
- **No:** mantener persistencia editable bajo `app/` después de esta spec.
- **No:** crear directorios vacíos solo para anticipar la arquitectura final.
- **No:** modificar el contenido de los JSON durante el traslado.
- **No:** crear abstracciones para APIs nativas sin una dependencia intercambiable real.

## Risks

| Risk                                                 | Mitigation                                                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Un cambio de ruta física rompe la persistencia JSON. | Comparar hashes y ejecutar operaciones de lectura y escritura representativas antes de eliminar el origen. |
| Un barrel expone infraestructura al cliente.         | Usar entry points server-only y búsquedas estáticas de imports desde Client Components.                    |
| El traslado de CSS rompe estilos.                    | Mantener cada CSS Module junto a su componente y validar visualmente en dos viewports.                     |

## What is **not** in this spec

- Migración del App Router a `src/app`.
- Eliminación de `features` o `shared` como capas de dominio.
- Nuevas reglas de negocio, rutas, providers o dependencias.
