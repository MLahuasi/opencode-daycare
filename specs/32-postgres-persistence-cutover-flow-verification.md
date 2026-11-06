# SPEC 32 — Verificación de flujos PostgreSQL

Registro del Paso 6. Las rutas productivas reciben el `daycareId` de la
sesión y las composiciones resuelven exclusivamente repositorios PostgreSQL.

| Flujo | Composición / evidencia | Verificación |
| --- | --- | --- |
| Login | `src/infrastructure/auth/auth.ts`, `runRemoteAuthPersistenceTests` | Credenciales y personas se consultan por tenant; la sesión conserva IDs PostgreSQL y `daycareId`. |
| Invitaciones | `createFamilyComposition`, `PostgresInvitationRepository`, `PostgresAuthTransactionRunner` | Creación, consulta y aceptación coordinan invitación, persona, credential y ParentKid por tenant. |
| Kids | `createKidComposition`, `PostgresKidRepository` | Listado, detalle, alta y edición usan el tenant de la sesión. |
| Rooms | `createKidComposition`, `PostgresRoomRepository` | Lectura y relaciones de sala se filtran por `daycareId`. |
| ParentKids | `PostgresParentKidRepository`, composiciones Family/Kids/Post | Relaciones se consultan y persisten dentro del tenant. |
| Posts | `createPostComposition`, `runRemoteStaffPersistenceTests` | Alta, edición, destinatarios y media usan tablas PostgreSQL normalizadas. |
| Family Feed | `createFamilyFeedComposition`, `runRemoteGeneralPersistenceTests` | Feed y detalle reconstruyen posts, destinatarios y engagement por tenant. |
| Comentarios | `PostgresPostCommentRepository`, prueba General remota | Alta, edición, borrado, autorización y `updatedAt: null`. |
| Reacciones | `PostgresPostReactionRepository`, prueba General remota | Alta, unicidad, toggle concurrente y engagement. |

## Validación ejecutada

- `npm run build` terminó correctamente.
- El build confirmó las rutas Auth, Staff y General y compiló sus
  composiciones PostgreSQL.
- Las pruebas remotas de Auth, Staff y General permanecen opt-in mediante
  `RUN_REMOTE_DB_TESTS=true`; sus escenarios y rollback están documentados en
  `specs/32-postgres-persistence-cutover-postgres-evidence.md`.
- No se ejecutaron escrituras remotas fuera del opt-in explícito.

**Conclusión:** los flujos solicitados tienen composiciones PostgreSQL y
evidencia de operaciones tenant-scoped; la ejecución remota queda protegida
por el mecanismo opt-in y rollback transaccional existente.
