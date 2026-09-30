# SPEC 17 - Baseline de Kid, Person y Room

Fecha de captura: 2026-09-30

## Rutas actuales

| Ruta | Entrada actual | Comportamiento observado en codigo |
| --- | --- | --- |
| `/kids` | `app/(staff)/kids/page.tsx` | Requiere sesion de staff, lee kids, relaciones parent-kid y rooms, proyecta `KidListItem` y renderiza filtro/listado. |
| `/kids/new` | `app/(staff)/kids/new/page.tsx` | Requiere sesion, lee rooms y muestra el formulario vacio; la accion crea el kid y redirige a su slug. |
| `/kids/[slug]` | `app/(staff)/kids/[slug]/page.tsx` | Requiere sesion, resuelve el perfil por slug, carga room y padres vinculados, y devuelve 404 si no existe. |
| `/kids/edit/[id]` | `app/(staff)/kids/edit/[id]/page.tsx` | Requiere sesion, resuelve el kid por ID, carga rooms y muestra el formulario de edicion; devuelve 404 si no existe. |
| `/kids/:id/edit` | `next.config.ts` | Redirect permanente actual hacia `/kids/edit/:id`; debe eliminarse en esta spec y responder 404. |

## Entradas actuales

| Entrada | Responsabilidad actual |
| --- | --- |
| `app/features/kids/index.ts` | Barrel de modelos, DTOs, esquema, componentes y utilidades de Kids. |
| `app/features/kids/server.ts` | Barrel server-only de consultas, comandos y Server Actions. |
| `app/features/kids/services/kids-service.ts` | Lee y escribe JSON directamente; genera slug, crea/actualiza Kids y resuelve rooms, personas y relaciones. |
| `app/features/kids/schemas/kid-form.ts` | Define DTOs del formulario y validacion de nombre, fecha, sala, alergias y notas. |
| `app/features/kids/actions/` | Valida, autoriza, invoca el servicio, revalida rutas y redirige. |
| `app/features/people/types/` | Define `Person`, `PersonRole` y `PersonStatus`. |
| `app/features/rooms/types/` | Define `Room`. |
| `app/features/family/types/` | Define `ParentKid` y contratos relacionados. |

## Consumidores que deben migrarse

- Rutas: `app/(staff)/kids/`.
- Auth: `app/auth/activate-account/page.tsx`, `app/features/auth/`.
- Family: `app/features/family/`.
- Feed: `app/features/feed/`.
- Post detail: `app/features/post-detail/`.
- Componentes, schemas y servicios dentro de `app/features/kids/`.

Las referencias actuales usan principalmente `@/app/features/kids`, `@/app/features/kids/types`, `@/app/features/kids/server`, `@/app/features/people` y `@/app/features/rooms`.

## Comportamiento de persistencia

- `kids.json` se lee y escribe mediante el adapter JSON de `src/infrastructure/persistence`.
- `people.json`, `rooms.json` y `parent-kids.json` se leen para proyecciones y relaciones.
- Alta: genera `randomUUID()`, slug unico, fecha de inscripcion actual y estado `active`.
- Edicion: conserva ID, slug, fecha de inscripcion y estado; solo actualiza los valores editables.
- Las escrituras de Kids usan `withWriteLock` y `writeCollection`.

## Contratos actuales

- `Kid`: `id`, `slug`, `name`, `birthDate`, `roomId`, `enrollmentDate`, `medicalNotes`, `allergies`, `status`.
- `Person`: `id`, `name`, `email`, `role`, `status`.
- `Room`: `id`, `name`.
- `ParentKid`: `id`, `parentId`, `kidId`, `relationship`, `photoSharingConsent`.
- `KidFormValues`: `name`, `birthDate`, `roomId`, `allergies`, `medicalNotes`.
