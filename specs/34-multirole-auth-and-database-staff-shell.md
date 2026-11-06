# SPEC 34 — Auth multirol y Staff Shell desde PostgreSQL

> **Status:** Draft
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
- Aplicar la migración y el seed únicamente a un proyecto Supabase nuevo al terminar la adaptación y validación del runtime.

**Out of scope (for future specs):**

- Tablas configurables `permissions` y `role_permissions`.
- Selector de rol o cambio de contexto después del login.
- Pantallas de administración para `admin`.
- Gestión UI de personas, roles, salas o guarderías.
- Migración del proyecto remoto actualmente enlazado.
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

## Implementation plan

1. Sustituir el contrato singular de `PersonRole` por el catálogo de roles y tipos de capacidades que reflejan `admin`, `personal`, `teacher` y `parent`, manteniendo los contratos de dominio sin duplicar el modelo SQL.
2. Implementar el lector PostgreSQL que resuelva roles por `personId` y `daycareId`, y reutilizarlo en login, guards y casos de uso que necesiten autorización.
3. Adaptar Credentials/Auth para validar persona activa, credencial y existencia de al menos un rol tenant-scoped; rechazar login cuando la consulta de `people_roles` no devuelva roles.
4. Cambiar callbacks y tipos de NextAuth para guardar únicamente `personId` y `daycareId`; eliminar cualquier lectura de `session.user.role` como fuente de autorización.
5. Implementar predicados de capacidades que acepten el conjunto de roles consultado y conservar las reglas de tenant y `staff_rooms` para Kids, Posts y Family.
6. Crear la composición server-only que cargue daycare, persona, cargo y salas asignadas, y proyecte la configuración dinámica del Staff Shell desde PostgreSQL.
7. Cambiar todos los consumidores de `StaffSidebar` para recibir esa proyección: `src/app/(staff)/home/page.tsx`, `src/app/(staff)/kids/layout.tsx` y `src/app/(general)/posts/[postId]/page.tsx` cuando rendericen el shell Staff.
8. Retirar `feed_overview` de `src/app/(staff)/home/page.tsx`, `src/presentation/feed/`, `src/composition/feed/`, repositorios y tipos; construir el overview con datos actuales, runtime date y estado vacío seguro.
9. Verificar Home sin kids, sin posts y con múltiples salas; mostrar asistencia `0 niños` y no acceder a una fila inexistente de `feed_overview`.
10. Crear pruebas de login, sesión sin roles, multirol, aislamiento por daycare, capacidades combinadas, fallback de perfil y proyección de varias salas.
11. Ejecutar lint, typecheck, build y pruebas contra la estructura/seed en una base local o temporal; solo después enlazar el proyecto Supabase nuevo, aplicar migración, ejecutar seed y realizar smoke tests.

## Acceptance criteria

- [ ] La consulta de roles usa `people_roles` y `roles` filtrando por `person_id` y `daycare_id`.
- [ ] Una persona activa con credencial válida y sin roles en el daycare no obtiene sesión.
- [ ] Los roles no aparecen en el JWT ni se usan como autoridad persistida en la sesión.
- [ ] La sesión conserva `personId` y `daycareId`.
- [ ] Una persona con `admin`, `personal` y `teacher` conserva las capacidades combinadas definidas en esta spec.
- [ ] `personal` permite entrar al Staff Shell.
- [ ] `teacher` permite gestionar Kids y Posts únicamente dentro del daycare y salas autorizadas.
- [ ] `parent` conserva el comportamiento de Family Feed.
- [ ] `admin` puede existir en la sesión consultada desde PostgreSQL, pero no muestra UI administrativa nueva.
- [ ] Home, Kids y detalle de Post no importan una configuración Staff con nombre, branding o perfil hardcodeados.
- [ ] El branding se obtiene de `daycares.brand_name` y las salas asignadas.
- [ ] El perfil se obtiene de `people.name`, `people.job_title` y las salas asignadas.
- [ ] Con las tres salas sembradas, la interfaz muestra `Salas Soles, Girasoles, Patitos` y `Maestra · Soles, Girasoles, Patitos`.
- [ ] Sin cargo se muestra `Personal` y sin salas se muestra `Sin salas`.
- [ ] `feed_overview` no tiene tipos, repositorio, composición ni consumidor runtime.
- [ ] Home funciona con cero kids y cero posts, muestra asistencia cero y calcula la fecha actual.
- [ ] Las rutas no autorizadas se redirigen o rechazan según el comportamiento existente, sin confiar en un rol único del JWT.
- [ ] Las pruebas cubren roles distintos para una misma persona en daycares distintos.
- [ ] El esquema y seed solo se aplican al proyecto Supabase nuevo después de completar la adaptación runtime.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
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
- **Sí:** aplicar estructura y seed al proyecto nuevo únicamente después de adaptar y verificar el runtime.

## Risks

| Risk | Mitigation |
| --- | --- |
| Una sesión conserva capacidades después de retirar un rol. | Consultar roles desde PostgreSQL en cada guard o autorización relevante. |
| Un rol de otro daycare concede acceso incorrecto. | Filtrar siempre `people_roles` por `daycare_id` y probar aislamiento entre tenants. |
| Algún consumidor sigue esperando `session.user.role`. | Buscar usos globales y cubrir login, Home, Kids, Posts y Family en typecheck y smoke tests. |
| El Staff Shell pierde datos con varias salas. | Usar orden determinista, formato explícito y pruebas de las tres salas del seed. |
| Home falla con contenido vacío. | Eliminar `feed_overview` y probar explícitamente cero kids y cero posts. |
| Se aplica el esquema antes de terminar la adaptación. | Bloquear la aplicación remota hasta el último paso y usar únicamente un proyecto nuevo. |

## What is **not** in this spec

- Migración destructiva del proyecto remoto actual.
- Roles dentro de JWT o claims personalizados.
- Pantallas administrativas para `admin`.
- Editor de permisos configurables.
- Tabla `feed_overview` o contenido visual persistido para Home.
- Seed de niños, padres, invitaciones o publicaciones.
