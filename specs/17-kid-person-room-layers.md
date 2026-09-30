# SPEC 17 — Capas de Kid, Person y Room

> **Status:** Draft
> **Depends on:** SPEC 06, SPEC 16
> **Date:** 2026-09-30
> **Objective:** Separar los modelos y casos de uso de Kid, Person y Room en Domain, Application e Infrastructure sin alterar los flujos de personal.

## Scope

**In:**

- Crear `src/domain/kid/`, `src/domain/person/` y `src/domain/room/`.
- Crear `src/application/kid/` para comandos, consultas, validación de entrada y DTOs de Kids.
- Crear ports de persistencia solo para las necesidades reales de los casos de uso.
- Implementar repositorios concretos bajo `src/infrastructure/persistence/`.
- Crear composición server-only para Kid.
- Mantener los perfiles identificados por slug y la edición identificada por ID.
- Mantener componentes exclusivos de Kids junto a sus rutas en `_components`.
- Mantener las Server Actions como adapters delgados en `app/(staff)/kids/_actions`.
- Eliminar `features/kids`, `features/people` y `features/rooms` después de migrar sus consumidores.
- Eliminar el redirect `/kids/:id/edit`.

**Out of scope (for future specs):**

- Reorganizar Auth, Family o Post.
- Cambiar validaciones, datos, diseño o autorización.
- Añadir funcionalidad de administración de salas o personas.
- Mover todavía `app/` a `src/app`.

## Data model

Esta spec no cambia campos ni registros persistidos.

Los modelos se distribuyen así:

```text
src/domain/kid/
  kid.ts
src/domain/person/
  person.ts
src/domain/room/
  room.ts
src/application/kid/
  dto/
  queries/
  commands/
```

`KidListItem`, `KidFormValues` y `KidFormErrors` siguen siendo DTOs o contratos de entrada de Application, no entidades de Domain.

## Implementation plan

1. Registrar imports, rutas y comportamiento de listado, alta, perfil y edición de Kids.
2. Crear los modelos puros de `kid`, `person` y `room`, conservando los contratos actuales.
3. Crear ports de lectura y escritura de Kids, rooms, people y relaciones únicamente con las operaciones usadas por los casos de uso.
4. Implementar los repositorios JSON concretos y conectarlos desde `src/infrastructure/composition/kid/`.
5. Migrar consultas y comandos de Kids a `src/application/kid/`, incluyendo slug, DTOs y validación de entrada.
6. Mover los componentes exclusivos de Kids a los `_components` de las rutas y actualizar sus imports públicos.
7. Reducir las páginas y Server Actions a resolución de parámetros, autorización de entrada, invocación de Application y navegación.
8. Eliminar las features antiguas y el redirect `/kids/:id/edit` después de comprobar que no quedan referencias.
9. Ejecutar ESLint, TypeScript, build, búsquedas estáticas y Playwright para todos los flujos de Kids.

## Acceptance criteria

- [ ] `Kid`, `Person` y `Room` tienen ownership en `src/domain/kid`, `src/domain/person` y `src/domain/room`.
- [ ] Domain no importa Next.js, React, Application, Infrastructure, filesystem ni SDKs.
- [ ] Los casos de uso de Kids viven en `src/application/kid`.
- [ ] Los repositorios JSON no se construyen desde páginas ni Server Actions.
- [ ] Existe composición server-only para conectar los ports de Kids.
- [ ] `/kids`, `/kids/new`, `/kids/[slug]` y `/kids/edit/[id]` conservan su comportamiento.
- [ ] El perfil continúa resolviendo por `slug`.
- [ ] La edición continúa resolviendo por ID.
- [ ] `/kids/:id/edit` responde 404 y no tiene alias interno.
- [ ] No existen `app/features/kids`, `app/features/people` ni `app/features/rooms`.
- [ ] No se cambian los registros de `kids.json`, `people.json`, `rooms.json` ni `parent-kids.json`.
- [ ] Las páginas y acciones de Kids no importan filesystem ni SDKs concretos.
- [ ] `npx eslint app src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] Playwright verifica listado, alta, perfil, edición, errores y responsive.

## Decisions

- **Sí:** dar a Person y Room dominios propios porque son usados por varios dominios.
- **No:** absorber Person en Auth ni Room en Kid.
- **Sí:** mantener `KidListItem` y los contratos de formulario en Application.
- **No:** crear un port por cada archivo JSON.
- **Sí:** conservar las URLs funcionales de Kids salvo el redirect legacy explícitamente eliminado.
- **No:** introducir compatibilidad para `/kids/:id/edit`.

## Risks

| Risk | Mitigation |
| --- | --- |
| Separar modelos compartidos produce ciclos. | Domain solo expone contratos puros y la composición resuelve consultas cruzadas. |
| Un DTO de formulario se confunde con una entidad persistida. | Mantener DTOs y validadores bajo `application/kid` y documentar su responsabilidad. |
| La eliminación de features rompe imports profundos. | Buscar consumidores antes de eliminar y exigir barrels o entry points explícitos. |

## What is **not** in this spec

- Migración de Auth, Family o Post.
- Nuevas reglas de negocio o cambios de persistencia.
- Migración final del router a `src/app`.
