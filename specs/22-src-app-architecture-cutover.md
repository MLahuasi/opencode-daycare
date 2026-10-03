# SPEC 22 — Corte final del App Router a src

> **Status:** Draft
> **Depends on:** SPEC 16, SPEC 17, SPEC 18, SPEC 19, SPEC 20, SPEC 21
> **Date:** 2026-09-30
> **Objective:** Trasladar atómicamente el App Router a `src/app` después del saneamiento de capas y dejar el alias `@/*` apuntando a `src/*`.

## Scope

**In:**

- Mover `app/` completo a `src/app/` en un único corte de routing, después de cumplir las precondiciones de SPEC 21.
- Conservar las convenciones especiales de App Router, Route Handlers, layouts y archivos privados.
- Actualizar `tsconfig.json` para que `@/*` resuelva a `src/*`.
- Convertir imports temporales `@/src/...` a imports finales `@/...`.
- Mantener configuración, `package.json`, `next.config.ts`, `.env*`, `public/` y `templates/` en la raíz.
- Mantener `/api/auth/[...nextauth]` como Route Handler de entrada.
- Actualizar `auth.ts`, las ampliaciones de NextAuth y la documentación al árbol final.
- Confirmar que no existe un `app/` raíz, porque Next.js prioriza ese directorio sobre `src/app`.
- Ejecutar auditoría final de capas, rutas, datos, estilos, Server/Client y documentación.

**Out of scope (for future specs):**

- Cambiar el framework o la versión de Next.js.
- Cambiar reglas de negocio, datos, proveedores o persistencia.
- Crear un contenedor DI o una API pública adicional.
- Rediseñar páginas o añadir funcionalidades nuevas.

## Data model

Esta spec no introduce ni modifica estructuras de negocio ni datos persistidos.

El árbol final esperado es:

```text
src/
├── app/
├── application/
│   ├── auth/
│   ├── family/feed/
│   ├── kid/
│   └── post/
├── domain/
│   ├── auth/
│   ├── family/feed/
│   ├── kid/
│   ├── person/
│   ├── post/
│   └── room/
├── presentation/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   └── post/
├── infrastructure/
│   ├── adapters/
│   ├── auth/
│   ├── config/
│   └── persistence/
├── composition/
│   ├── auth/
│   ├── family/
│   ├── kid/
│   └── post/
└── types/
```

Solo existirán directorios que contengan archivos con responsabilidad concreta.

## Implementation plan

1. Registrar el árbol, alias, rutas públicas, redirects permitidos y hashes de JSON antes del corte.
2. Confirmar que SPEC 21 está completada y que no existen `app/features`, `app/infrastructure`, `app/shared`, `src/components` ni `src/infrastructure/composition`.
3. Confirmar que no existen dependencias desde `src/` hacia `app/` y que Application, Domain, Infrastructure, Presentation y Composition cumplen sus límites.
4. Mover `app/` a `src/app/` atómicamente y verificar que no queda `app/` raíz.
5. Actualizar `tsconfig.json`, tipos de NextAuth, `auth.ts` y todos los imports al alias final `@/...`.
6. Verificar que Next.js detecta `src/app`, sus Route Groups, layouts, Route Handlers y archivos privados.
7. Actualizar `README.md` y `AGENTS.md` con arquitectura, ownership, rutas oficiales, redirects externos y límites de dependencia.
8. Ejecutar la auditoría estática final y corregir únicamente incumplimientos de la arquitectura especificada.
9. Ejecutar ESLint, TypeScript, build, búsquedas estáticas, comparación de JSON y Playwright completo.

## Acceptance criteria

- [ ] Existe `src/app` con todas las rutas, layouts y Route Handlers runtime.
- [ ] No existe un directorio `app/` raíz.
- [ ] `tsconfig.json` configura `@/*` hacia `src/*`.
- [ ] No quedan imports `@/src/...` en el código final.
- [ ] `src/app` contiene solo routing, páginas, layouts, Route Handlers, adapters de entrada y colaboradores privados de ruta.
- [ ] No existen `features`, `shared`, `src/components` ni `src/infrastructure/composition`.
- [ ] Existe `src/presentation` para UI, navegación, presenters y view models.
- [ ] Existe `src/composition` para ensamblar Application e Infrastructure.
- [ ] Application no depende de Infrastructure ni de APIs específicas de Next.js.
- [ ] Domain no depende de Application, Infrastructure, Next.js, React, NextAuth, filesystem ni SDKs externos.
- [ ] Infrastructure no depende de Presentation, Composition ni `src/app`.
- [ ] Presentation no depende de Infrastructure ni Composition.
- [ ] Composition no depende de Presentation ni `src/app`.
- [ ] Ningún Client Component importa Infrastructure, filesystem o configuración privada.
- [ ] Las páginas y Server Actions delegan en casos de uso ensamblados por composición.
- [ ] Solo `/` conserva redirect de compatibilidad; las rutas legacy de activación responden 404 según SPEC 18.
- [ ] `/login`, `/kids/:id/edit`, `/auth/link-parent` y las cuatro rutas antiguas de Posts responden 404.
- [ ] Los JSON mantienen hashes byte a byte respecto de la línea base.
- [ ] No existen directorios vacíos creados únicamente por simetría.
- [ ] `README.md` y `AGENTS.md` documentan el árbol final y sus límites.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] Playwright verifica rutas de staff, general, auth, Posts, Kids, redirects permitidos y 404 legacy en escritorio y móvil.

## Decisions

- **Sí:** mover el router en una spec final y atómica porque Next.js ignora `src/app` mientras exista `app/` raíz.
- **Sí:** ejecutar el corte solo después de consolidar Presentation y Composition en SPEC 21.
- **Sí:** usar `@/*` para ocultar el prefijo físico `src` en imports finales.
- **Sí:** mantener archivos de configuración y recursos runtime fuera de `src` cuando Next.js lo exige.
- **No:** mantener un App Router duplicado durante la ejecución final.
- **Sí:** conservar únicamente el redirect raíz permitido por las specs aprobadas.
- **No:** mantener aliases internos o rutas duplicadas por compatibilidad.
- **No:** modificar reglas de negocio ni datos persistidos durante el corte.

## Risks

| Risk | Mitigation |
| --- | --- |
| Next.js detecta accidentalmente el router antiguo. | Eliminar `app/` raíz antes del build y verificar el árbol físicamente. |
| El corte mezcla deuda arquitectónica con routing. | Tratar las precondiciones de SPEC 21 como bloqueo previo. |
| El alias final rompe tipos o imports server-only. | Ejecutar TypeScript, build y búsquedas de imports después del cambio. |
| Un redirect o Route Handler queda fuera del traslado. | Comparar el inventario de rutas antes y después y verificar cada URL con Playwright. |

## What is **not** in this spec

- Nuevas funcionalidades, providers, dependencias o cambios de datos.
- Compatibilidad para rutas legacy distintas del redirect raíz aprobado.
- Rediseño visual o cambio de reglas de negocio.
