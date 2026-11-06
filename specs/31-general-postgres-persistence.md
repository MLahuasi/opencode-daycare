# SPEC 31 — Persistencia PostgreSQL del módulo General

> **Status:** Approved
> **Depends on:** SPEC 28, SPEC 29, SPEC 30
> **Date:** 2026-11-05
> **Objective:** Implementar la lectura PostgreSQL del Family Feed y el CRUD de comentarios y reacciones para las rutas `src/app/(general)/` sin cambiar las reglas de autorización y usando PostgreSQL en el runtime.

## Scope

**In:**

- Implementar lectores PostgreSQL de contexto familiar, Kids, Rooms, ParentKids, People y Posts.
- Implementar CRUD PostgreSQL de `feed_comments` y `feed_reactions`.
- Mantener la autorización de padres y Staff existente.
- Mantener `daycareId` en todas las entidades y validar la pertenencia del agregado completo.
- Probar Family Feed, detalle, comentarios y reacciones contra PostgreSQL remoto con rollback.
- Usar la composición PostgreSQL productiva para validar las rutas `(general)` contra la BDD.
- Ejecutar en esta spec las pruebas PostgreSQL pendientes de SPEC 30 que no llegaron a ejecutarse contra la BDD; la cobertura declarada en SPEC 30 no se considera evidencia suficiente por sí sola.

**Out of scope (for future specs):**

- Cambiar filtros, proyecciones, UX, rutas o reglas de consentimiento.
- Implementar Realtime.
- Cambiar Cloudinary o Storage.
- Crear o alterar esquema, RLS, grants o funciones SQL.

## Data model

```text
feed_comments  → PostComment
feed_reactions → PostReaction
feed + feed_kids + feed_media → Post
parent_kids + people + kids + rooms → FamilyFeedContext
```

Los contadores de engagement continuarán siendo derivados de comentarios y reacciones. No se crearán columnas duplicadas en las entidades de dominio.

## Implementation plan

1. Crear mappers de PostComment y PostReaction con fechas nullable preservadas.
2. Implementar lectores filtrados por `daycare_id` para People, ParentKids, Kids, Rooms y Posts.
3. Implementar `PostgresPostCommentRepository` con find, create, update y delete.
4. Implementar `PostgresPostReactionRepository` con find, create y delete.
5. Implementar consultas por post y por conjunto de posts para evitar scans globales innecesarios.
6. Reutilizar la autorización Application verificando que viewer, post, comentario, reacción y destinatarios compartan tenant.
7. Verificar el consentimiento de fotos usando relaciones y personas PostgreSQL.
8. Crear pruebas de Family Feed, detalle, visibilidad, comentarios, reacciones y aislamiento tenant, incluyendo los escenarios pendientes de SPEC 30: listado, alta, edición, autorización, relaciones y rollback.
9. Ejecutar las pruebas propias de SPEC 31 y las pruebas pendientes de SPEC 30 exclusivamente contra PostgreSQL cuando `RUN_REMOTE_DB_TESTS` esté habilitado, y revertir todas sus escrituras.
10. Ejecutar la app mediante la composición PostgreSQL productiva y verificar las rutas `(general)` contra la BDD.

## Acceptance criteria

- [ ] El Family Feed no combina personas, kids, rooms o posts de distintos tenants.
- [ ] Un padre solo recibe posts autorizados por sus ParentKids activos.
- [ ] Staff conserva la autorización basada en StaffRooms.
- [ ] Los comentarios mantienen `updatedAt: null` cuando la fila es nullable.
- [ ] Un usuario solo puede editar o eliminar sus propios comentarios.
- [ ] Una reacción se identifica por post, persona, tipo y tenant.
- [ ] El engagement coincide con el número real de comentarios y reacciones PostgreSQL.
- [ ] El toggle de reacción no crea duplicados en ejecuciones concurrentes controladas.
- [ ] Las URLs de media se resuelven fuera de PostgreSQL mediante el adapter existente.
- [x] Los tests del módulo no leen los JSON de Feed, comentarios ni reacciones.
- [ ] Las pruebas remotas requieren `RUN_REMOTE_DB_TESTS` y hacen rollback.
- [ ] Se ejecutan contra PostgreSQL las pruebas pendientes de SPEC 30: listado, alta, edición, autorización, relaciones y rollback.
- [x] La evidencia de las pruebas pendientes de SPEC 30 identifica cada escenario ejecutado y no usa los JSON del módulo.
- [x] Las rutas `(general)` pasan smoke tests usando la composición PostgreSQL productiva.
- [x] La composición productiva usa PostgreSQL después del cutover global.
- [ ] No cambian filtros, proyecciones ni reglas funcionales.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.

## Decisions

- **Sí:** derivar engagement desde tablas relacionadas, igual que el contrato actual.
- **Sí:** usar consultas por tenant y por relaciones explícitas.
- **No:** duplicar contadores en `feed` o en `Post` persistido.
- **Sí:** mantener Cloudinary fuera de este cambio de origen de datos.
- **Sí:** validar las rutas `(general)` con PostgreSQL mediante una composición exclusiva de pruebas.
- **No:** cambiar las reglas de autorización para compensar diferencias de IDs.
- **Sí:** activar PostgreSQL en la composición productiva de `(general)`.
- **Sí:** activar PostgreSQL en las composiciones productivas de `(general)`.

## Risks

| Risk                                                 | Mitigation                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Una consulta de Feed expone datos de otra guardería. | Aplicar `daycare_id` a cada consulta y validar las relaciones reconstruidas. |
| El toggle crea reacciones duplicadas.                | Leer y escribir dentro de una transacción y manejar la unicidad existente.   |
| La proyección pierde media o engagement.             | Comparar proyecciones PostgreSQL con el comportamiento funcional actual.     |

## What is **not** in this spec

- Realtime.
- Cambios de autorización SQL.
- Migración a Supabase Auth.

---

Plan de implementación

1.  Crear mappers de PostComment y PostReaction, preservando fechas nullable.
2.  Implementar lectores filtrados por daycare_id.
3.  Implementar PostgresPostCommentRepository.
4.  Implementar PostgresPostReactionRepository.
5.  Añadir consultas por post y conjuntos de posts.
6.  Reutilizar autorización Application y validar tenant.
7.  Verificar consentimiento de fotos con relaciones PostgreSQL.
8.  Crear pruebas de feed, detalle, visibilidad, comentarios, reacciones y aislamiento tenant.
9.  Ejecutar pruebas PostgreSQL con RUN_REMOTE_DB_TESTS y rollback.
10. Verificar las rutas (general) mediante composición PostgreSQL sin activar producción.

## Validation boundary

Esta spec valida la persistencia PostgreSQL mediante adapters y composiciones
productivas. La evidencia de los pasos 1 a 10 debe demostrar que las rutas
`(general)` se ejecutan contra PostgreSQL, con aislamiento por `daycare_id`,
autorización Application y rollback en las pruebas remotas.

Los adapters JSON y sus snapshots fueron retirados. PostgreSQL es la única
fuente runtime de los módulos Staff y General.
