# SPEC 30 — Persistencia PostgreSQL del módulo Staff

> **Status:** Draft
> **Depends on:** SPEC 28, SPEC 29
> **Date:** 2026-11-05
> **Objective:** Implementar la lectura y escritura PostgreSQL de Kids, Rooms, People, ParentKids, StaffRooms y Posts usados por las rutas `src/app/(staff)/`, manteniendo el comportamiento funcional actual y el runtime JSON hasta el cutover.

## Scope

**In:**

- Implementar adapters PostgreSQL de `rooms`, `kids`, `parent_kids`, `staff_rooms` y las lecturas necesarias de `people`.
- Implementar el agregado `feed + feed_kids + feed_media` para posts.
- Reutilizar autorización de staff y consentimiento existentes.
- Mantener `daycareId` en cada entidad y validar relaciones dentro del mismo tenant.
- Probar las rutas y operaciones Staff contra PostgreSQL sin usar JSON del módulo.

**Out of scope (for future specs):**

- Activar PostgreSQL en las rutas Staff productivas antes de SPEC 32.
- Cambiar formularios, validaciones, navegación o reglas de negocio.
- Implementar comentarios, reacciones o Family Feed.
- Cambiar Cloudinary.
- Crear o alterar esquema, RPC, policies o grants.

## Data model

Los adapters deben mapear:

```text
rooms         → Room
kids          → Kid
parent_kids   → ParentKid
staff_rooms   → { personId, roomId }
feed          → PersistedPost raíz
feed_kids     → PersistedPost.kidIds
feed_media    → PersistedPost.media ordenado por position
```

Toda fila se consulta con `daycare_id`. Un post solo puede mapearse si su autor, sala, niños y media pertenecen al mismo tenant.

## Implementation plan

1. Crear mappers PostgreSQL de Room, Kid, ParentKid y StaffRoom.
2. Implementar repositorios PostgreSQL de Room, Kid y ParentKid con filtros tenant-scoped.
3. Implementar el adapter de acceso Staff sobre `staff_rooms`, `parent_kids` y `kids`.
4. Implementar el lector PostgreSQL de Posts agregando destinatarios y media sin usar arrays JSON.
5. Implementar creación y actualización del agregado Post con transacción local PostgreSQL y rollback.
6. Validar destino exclusivo de cada post antes de persistir.
7. Validar que el autor Staff tenga acceso a la sala o a todos los niños destino.
8. Mantener los IDs generados como UUID y eliminar IDs derivados no válidos.
9. Crear pruebas remotas de listado, alta, edición, autorización, relaciones y rollback con `RUN_REMOTE_DB_TESTS`.
10. Ejecutar la aplicación con runtime JSON y verificar que las rutas Staff existentes no se rompen.

## Acceptance criteria

- [ ] Kids, Rooms, ParentKids y StaffRooms se leen por `daycare_id`.
- [ ] Un kid de otra guardería no puede resolverse como destino válido.
- [ ] Una sala de otra guardería no puede asignarse a un kid o post.
- [ ] Un post se reconstruye correctamente desde `feed`, `feed_kids` y `feed_media`.
- [ ] El orden de media se conserva mediante `position`.
- [ ] Crear un post no deja filas parciales si falla una escritura relacionada.
- [ ] Actualizar un post reemplaza destinatarios y media de forma coherente.
- [ ] La autorización Staff conserva las reglas actuales.
- [ ] La creación de Kid conserva slug, enrollment date, status y campos editables.
- [ ] Los tests del módulo no leen `src/infrastructure/persistence/json/data`.
- [ ] Las pruebas remotas requieren `RUN_REMOTE_DB_TESTS` y hacen rollback.
- [ ] Las rutas Staff siguen funcionando con JSON antes del cutover.
- [ ] No se modifican formularios, validaciones ni reglas de negocio.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.

## Decisions

- **Sí:** tratar Posts como agregado porque una publicación se distribuye entre tres tablas.
- **Sí:** mantener el dominio como fuente de contratos y usar mappers para `snake_case`.
- **No:** guardar `kidIds` o `media` como JSONB, porque el esquema actual los normaliza.
- **Sí:** ejecutar pruebas contra PostgreSQL remoto con rollback.
- **No:** cambiar la UI o las reglas de autorización.
- **No:** activar este adapter en Composition productivo antes del cutover final.

## Risks

| Risk | Mitigation |
| --- | --- |
| El agregado Post queda inconsistente. | Una sola transacción para raíz, destinatarios y media. |
| Se pierde el orden de imágenes. | Mapear y verificar `position` cero-based. |
| Staff ve datos de otro tenant. | Filtrar cada tabla por `daycare_id` y validar relaciones cruzadas. |

## What is **not** in this spec

- Comentarios y reacciones.
- Family Feed.
- Cutover productivo.
- Cambios de esquema o autorización SQL.
