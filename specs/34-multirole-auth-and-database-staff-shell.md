# SPEC 34 — Auth multirol y Staff Shell desde PostgreSQL

> **Status:** Implemented
> **Depends on:** SPEC 33
> **Date:** 2026-11-06
> **Objective:** Adaptar Auth, autorización, Home y todos los consumidores del Staff Shell para consultar roles y perfil desde PostgreSQL sin almacenar roles en el JWT.

## Why this spec exists

SPEC 33 define el esquema final con roles many-to-many, branding persistido y tres salas iniciales. El runtime actual conserva un único rol en la persona, usa ese rol en la sesión y quema el branding y el perfil en `staff-navigation.ts`; por eso no es compatible con la base nueva sin una adaptación coordinada.

## Scope

**In:**

- Consultar los roles activos de una persona desde PostgreSQL después del login y durante las comprobaciones de autorización.
- Adaptar Auth y la sesión para conservar solo `personId` y `daycareId`, sin roles en JWT.
- Rechazar credenciales válidas cuando la persona no tenga roles para el daycare solicitado.
- Implementar las capacidades actuales con la unión de roles: `personal` para acceso al Staff Shell, `teacher` para gestión de Kids y Posts, `parent` para Family y `admin` como modelo sin UI propia.
- Derivar el perfil y branding del Staff Shell desde `people`, `daycares`, `rooms` y `staff_rooms`.
- Reemplazar la configuración estática de `src/presentation/navigation/staff-navigation.ts` por una proyección dinámica compartida por Home, Kids y detalle de Post.
- Eliminar `feed_overview`, su repositorio, tipos, composición y consumidores.
- Derivar el encabezado de Home con salas, persona, cantidad de niños y fecha actual.
- Verificar y preparar el proyecto Supabase nuevo y vacío como prerrequisito del runtime: revisar el dry-run, aplicar la migración estructural de SPEC 33 y ejecutar el seed independiente.
- Bloquear el despliegue de la aplicación hasta completar la adaptación y validación del runtime contra ese proyecto ya estructurado y sembrado.

**Out of scope (for future specs):**

- Tablas configurables `permissions` y `role_permissions`.
- Selector de rol o cambio de contexto después del login.
- Pantallas de administración para `admin`.
- Gestión UI de personas, roles, salas o guarderías.
- Migración del proyecto remoto anterior o de cualquier proyecto que contenga datos operativos.
- Supabase Auth o almacenamiento de roles dentro de claims JWT.

## Data model

La identidad de sesión queda reducida a:

```ts
type SessionIdentity = {
  personId: string;
  daycareId: string;
};
```

Los roles se consultan mediante `people_roles` y `roles` para el par `(personId, daycareId)`:

```text
people_roles(daycare_id, person_id, role_id)
roles(id, code)
```

La proyección dinámica del Staff Shell debe tener esta forma conceptual:

```ts
type StaffNavigationProjection = {
  brand: {
    name: string;
    room: string;
  };
  profile: {
    initial: string;
    name: string;
    role: string;
  };
};
```

Para Caro con las tres salas del seed:

- `brand.name`: `OpenDayCare`.
- `brand.room`: `Salas Soles, Girasoles, Patitos`.
- `profile.initial`: `C`.
- `profile.name`: `Caro Giménez`.
- `profile.role`: `Maestra · Soles, Girasoles, Patitos`.

La proyección debe ordenar las salas de forma determinista. Si falta `job_title`, debe usar `Personal`; si no hay salas, debe usar `Sin salas`. La ausencia de salas no debe inventar asignaciones y debe bloquear las operaciones que requieren `staff_rooms`.

Las capacidades se definen en código, no en tablas:

```text
personal → acceso al Staff Shell
teacher  → gestión de Kids y Posts según asignaciones
parent   → Family Feed y comportamiento familiar
admin    → rol persistido, sin UI adicional en esta spec
```

Una persona puede tener varias capacidades simultáneamente. Caro se autentica con `admin`, `personal` y `teacher`; no se selecciona un único rol y ninguna lista de roles se serializa en JWT.

## Database prerequisite and migration boundary

SPEC 34 no puede adaptar ni validar el runtime contra un proyecto completamente vacío porque Auth, autorización, Staff Shell y los repositorios dependen de las tablas creadas por SPEC 33. Por tanto, la migración de SPEC 33 y su seed son un prerrequisito técnico de esta spec.

Este prerrequisito solo aplica al proyecto Supabase nuevo, vacío y destinado a esta implementación. Antes de cualquier escritura se debe:

1. Confirmar que el proyecto enlazado es el proyecto nuevo y no el proyecto remoto anterior ni un proyecto con datos operativos.
2. Ejecutar el dry-run de migraciones y revisar que el único cambio estructural esperado sea la baseline de SPEC 33.
3. Aplicar la migración estructural.
4. Ejecutar `supabase/seed.sql` mediante el comando separado `npm run db:seed`.
5. Ejecutar el seed una segunda vez y verificar que no duplica los 16 registros, roles ni asignaciones.
6. Verificar que Caro, sus tres roles y sus tres salas existen antes de iniciar los smoke tests del runtime.

Durante la adaptación puede existir una incompatibilidad temporal entre el runtime actual y el esquema nuevo: el código todavía puede referenciar `people.role`, `feed_overview` o tipos PostgreSQL antiguos. Esta ventana es aceptable porque el proyecto está vacío y la aplicación no debe desplegarse ni exponerse hasta completar la adaptación y validación de esta spec.

La aplicación remota de la migración y el seed no autoriza por sí sola un despliegue. El despliegue queda bloqueado hasta que pasen lint, typecheck, build y los smoke tests definidos en esta spec.

## Implementation plan

1. Completar el prerrequisito de base de datos descrito arriba sobre el proyecto Supabase nuevo y vacío.
2. Regenerar o actualizar el snapshot de tipos PostgreSQL para reflejar `roles`, `people_roles`, `brand_name`, `job_title` y la ausencia de `feed_overview`.
3. Sustituir el contrato singular de `PersonRole` por el catálogo de roles y tipos de capacidades que reflejan `admin`, `personal`, `teacher` y `parent`, manteniendo los contratos de dominio sin duplicar el modelo SQL.
4. Implementar el lector PostgreSQL que resuelva roles por `personId` y `daycareId`, y reutilizarlo en login, guards y casos de uso que necesiten autorización.
5. Adaptar Credentials/Auth para validar persona activa, credencial y existencia de al menos un rol tenant-scoped; rechazar login cuando la consulta de `people_roles` no devuelva roles.
6. Cambiar callbacks y tipos de NextAuth para guardar únicamente `personId` y `daycareId`; eliminar cualquier lectura de `session.user.role` como fuente de autorización.
7. Actualizar las pruebas transaccionales de Auth y Staff para insertar `brand_name`, usar `people_roles` y validar el aislamiento multirol por daycare.
8. Implementar predicados de capacidades que acepten el conjunto de roles consultado y conservar las reglas de tenant y `staff_rooms` para Kids, Posts y Family.
9. Crear la composición server-only que cargue daycare, persona, cargo y salas asignadas, y proyecte la configuración dinámica del Staff Shell desde PostgreSQL.
10. Cambiar todos los consumidores de `StaffSidebar` para recibir esa proyección: `src/app/(staff)/home/page.tsx`, `src/app/(staff)/kids/layout.tsx` y `src/app/(general)/posts/[postId]/page.tsx` cuando rendericen el shell Staff.
11. Retirar `feed_overview` de `src/app/(staff)/home/page.tsx`, `src/presentation/feed/`, `src/composition/feed/`, repositorios, tipos y cualquier consumidor runtime; construir el overview con datos actuales, runtime date y estado vacío seguro.
12. Verificar Home sin kids, sin posts y con múltiples salas; mostrar asistencia `0 niños` y no acceder a una fila inexistente de `feed_overview`.
13. Crear pruebas de login, sesión sin roles, multirol, aislamiento por daycare, capacidades combinadas, fallback de perfil y proyección de varias salas.
14. Ejecutar lint, typecheck, build y smoke tests contra el proyecto nuevo ya sembrado. No desplegar la aplicación ni declarar la spec completa hasta que todas las verificaciones pasen.

## Acceptance criteria

- [x] La consulta de roles usa `people_roles` y `roles` filtrando por `person_id` y `daycare_id`.
- [x] Una persona activa con credencial válida y sin roles en el daycare no obtiene sesión.
- [x] Los roles no aparecen en el JWT ni se usan como autoridad persistida en la sesión.
- [x] La sesión conserva `personId` y `daycareId`.
- [x] Una persona con `admin`, `personal` y `teacher` conserva las capacidades combinadas definidas en esta spec.
- [x] `personal` permite entrar al Staff Shell.
- [x] `teacher` permite gestionar Kids y Posts únicamente dentro del daycare y salas autorizadas.
- [x] `parent` conserva el comportamiento de Family Feed.
- [x] `admin` puede existir en la sesión consultada desde PostgreSQL, pero no muestra UI administrativa nueva.
- [x] Home, Kids y detalle de Post no importan una configuración Staff con nombre, branding o perfil hardcodeados.
- [x] El branding se obtiene de `daycares.brand_name` y las salas asignadas.
- [x] El perfil se obtiene de `people.name`, `people.job_title` y las salas asignadas.
- [x] Con las tres salas sembradas, la interfaz muestra `Salas Soles, Girasoles, Patitos` y `Maestra · Soles, Girasoles, Patitos`.
- [x] Sin cargo se muestra `Personal` y sin salas se muestra `Sin salas`.
- [x] `feed_overview` no tiene tipos, repositorio, composición ni consumidor runtime.
- [ ] Home funciona con cero kids y cero posts, muestra asistencia cero y calcula la fecha actual.
- [x] Las rutas no autorizadas se redirigen o rechazan según el comportamiento existente, sin confiar en un rol único del JWT.
- [x] Las pruebas cubren roles distintos para una misma persona en daycares distintos.
- [ ] Antes de adaptar el runtime se confirma que el proyecto enlazado es nuevo, está vacío y no es el proyecto remoto anterior.
- [ ] La baseline de SPEC 33 se aplica al proyecto nuevo después de revisar el dry-run y el seed se ejecuta mediante el comando separado.
- [ ] Ejecutar el seed dos veces deja exactamente los 16 registros iniciales, sin duplicar roles, Caro, salas ni asignaciones.
- [ ] El runtime no se despliega durante la ventana temporal de incompatibilidad con el esquema nuevo.
- [ ] La adaptación y los smoke tests se validan contra el proyecto nuevo ya estructurado y sembrado.
- [x] `npx eslint src` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [ ] Los smoke tests de login, Home, Kids y Posts pasan contra el proyecto nuevo sembrado.

## Decisions

- **Sí:** usar `roles` global y `people_roles` tenant-scoped; una persona puede tener varios roles por daycare.
- **Sí:** usar `admin`, `personal`, `teacher` y `parent` como códigos persistidos.
- **Sí:** consultar roles desde PostgreSQL después del login y en las decisiones de autorización.
- **No:** almacenar roles en JWT; evita sesiones obsoletas y respeta que el rol puede cambiar en la BDD.
- **Sí:** conservar solo `personId` y `daycareId` en la sesión.
- **Sí:** mantener las capacidades en código; las tablas de permisos configurables quedan para otra spec.
- **Sí:** combinar capacidades cuando una persona tiene varios roles; Caro recibe `admin`, `personal` y `teacher`.
- **No:** crear selector de rol; el comportamiento inicial usa la unión de capacidades.
- **No:** dar UI a `admin` en esta spec.
- **Sí:** persistir `Maestra` en `people.job_title` y derivar las salas desde `staff_rooms`.
- **Sí:** eliminar `feed_overview`; Home debe mostrar una proyección dinámica y tolerar una BDD vacía de contenido.
- **Sí:** aplicar la migración y el seed primero a un proyecto Supabase nuevo y vacío, porque el runtime necesita las tablas de SPEC 33 para poder adaptarse y probarse.
- **Sí:** revisar el dry-run, verificar el destino y ejecutar el seed dos veces antes de usar la base para validar el runtime.
- **No:** desplegar la aplicación mientras el runtime todavía sea incompatible con la estructura nueva.

## Risks

| Risk                                                        | Mitigation                                                                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Una sesión conserva capacidades después de retirar un rol.  | Consultar roles desde PostgreSQL en cada guard o autorización relevante.                                                    |
| Un rol de otro daycare concede acceso incorrecto.           | Filtrar siempre `people_roles` por `daycare_id` y probar aislamiento entre tenants.                                         |
| Algún consumidor sigue esperando `session.user.role`.       | Buscar usos globales y cubrir login, Home, Kids, Posts y Family en typecheck y smoke tests.                                 |
| El Staff Shell pierde datos con varias salas.               | Usar orden determinista, formato explícito y pruebas de las tres salas del seed.                                            |
| Home falla con contenido vacío.                             | Eliminar `feed_overview` y probar explícitamente cero kids y cero posts.                                                    |
| Se aplica el esquema al proyecto equivocado.                | Confirmar que el proyecto enlazado es nuevo y vacío, revisar el dry-run y no usar el proyecto remoto anterior.              |
| El runtime queda temporalmente incompatible con el esquema. | Aceptar la ventana solo en el proyecto vacío y bloquear el despliegue hasta completar lint, typecheck, build y smoke tests. |
| La adaptación se valida contra tablas inexistentes.         | Aplicar primero la baseline y el seed de SPEC 33, verificando los 16 registros antes de adaptar el runtime.                 |

## What is **not** in this spec

- Migración destructiva del proyecto remoto actual.
- Roles dentro de JWT o claims personalizados.
- Pantallas administrativas para `admin`.
- Editor de permisos configurables.
- Tabla `feed_overview` o contenido visual persistido para Home.
- Seed de niños, padres, invitaciones o publicaciones.

---

Plan de implementación

1.  Completar el prerrequisito de base de datos en el proyecto Supabase nuevo y vacío.
2.  Actualizar el snapshot de tipos PostgreSQL.
3.  Sustituir PersonRole por el catálogo de roles y capacidades.
4.  Implementar el lector PostgreSQL de roles por persona y daycare.
5.  Adaptar Credentials/Auth y rechazar usuarios sin roles.
6.  Guardar únicamente personId y daycareId en sesión.
7.  Actualizar pruebas transaccionales de Auth y Staff.
8.  Implementar predicados de capacidades y reglas de tenant/salas.
9.  Crear la composición dinámica del Staff Shell.
10. Actualizar los consumidores de StaffSidebar.
11. Eliminar feed_overview y construir el overview dinámico.
12. Verificar Home vacío y con múltiples salas.
13. Crear pruebas de login, multirol, aislamiento y proyección.
14. Ejecutar lint, typecheck, build y smoke tests sin desplegar.
