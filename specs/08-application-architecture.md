# SPEC 08 — Reorganización de la arquitectura de aplicación

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02, SPEC 03, SPEC 04, SPEC 05, SPEC 06, SPEC 07
> **Date:** 2026-09-21
> **Objective:** Reorganizar incrementalmente la aplicación en rutas App Router, componentes compartidos, features de dominio, shared e infrastructure con contratos y tipos bien delimitados, sin alterar la experiencia salvo las URLs acordadas.

## Why this spec exists

La estructura actual mezcla rutas, composición de páginas, navegación de aplicación, modelos de varios dominios y persistencia JSON dentro de Kids.

`app/features/kids/types/kids.ts` reúne conceptos distintos como `Kid`, `Person`, `Room` y relaciones familiares.

El servicio de Kids también conoce queries, proyecciones, filesystem, serialización y la ubicación física de los JSON.

Esta reorganización define propietarios claros y límites de importación sin introducir cambios funcionales no solicitados.

## Scope

**In:**

- Mantener todo el código de aplicación bajo `app/`.
- Organizar las rutas de personal mediante el route group `(staff)` sin incluir el grupo en la URL.
- Mover el feed de la raíz a `/home`.
- Redirigir permanentemente `/` hacia `/home`.
- Mover Login a `/auth/login`.
- Mover Activación de cuenta a `/auth/activate-account`.
- Redirigir permanentemente `/login` hacia `/auth/login`.
- Redirigir permanentemente `/activate-account` hacia `/auth/activate-account` y conservar sus query parameters.
- Mantener `/kids`, `/kids/new` y `/kids/[slug]` bajo `(staff)`.
- Mover Edit a `/kids/edit/[id]`.
- Redirigir permanentemente `/kids/:id/edit` hacia `/kids/edit/:id`.
- Mantener perfiles de Kids identificados por slug.
- Mantener Edit de Kids identificado por ID.
- Mantener `page.tsx` como punto de composición, carga de datos y proyección específica de cada pantalla.
- Crear una entrada pública client-safe para cada feature.
- Crear una entrada `server` explícita para queries, servicios y Server Actions de cada feature cuando corresponda.
- Evitar imports profundos desde fuera de una feature.
- Usar imports relativos dentro de una feature para evitar ciclos mediante barrels.
- Mover `StaffSidebar` desde `features/layout` a `app/components/layout/`.
- Mover la configuración de navegación de personal a `app/shared/config/`.
- Eliminar `features/layout` y `data/mocks/layout` después de migrar todos sus consumidores.
- Crear `features/people/` para `Person`, `PersonRole` y `PersonStatus`.
- Crear `features/rooms/` para `Room`.
- Crear `features/family/` para `ParentKid`, `ParentRelationship` y `LinkedParent`.
- Separar `Kid`, `KidStatus` y los DTOs de presentación de Kids en archivos con propietarios explícitos.
- Mantener `KidFormValues`, sus errores y validadores junto al schema de formulario de Kids.
- Auditar los tipos de Auth, Feed y navegación para separar modelos, DTOs y props cuando representen responsabilidades distintas.
- Mantener los tipos de props junto al componente que los consume.
- Eliminar `app/features/kids/types/kids.ts` después de migrar sus exports y consumidores.
- Extraer lectura, escritura atómica y serialización JSON a `app/infrastructure/persistence/json/`.
- Mover `kids.json`, `people.json`, `rooms.json` y `parent-kids.json` a `app/infrastructure/persistence/json/data/` sin modificar sus registros.
- Mantener `app/data/mocks/` únicamente para fixtures estáticos no editables.
- Evitar que componentes presentacionales carguen fixtures completos internamente.
- Actualizar `README.md` y `AGENTS.md` con el árbol objetivo, rutas, límites de dependencia, entry points y propiedad de datos.
- Verificar las rutas, redirects, flujos existentes, compilación y límites arquitectónicos en cada fase.

**Out of scope (for future specs):**

- Cambiar el diseño, contenido, responsive o accesibilidad de las pantallas existentes.
- Cambiar validaciones, reglas de negocio o registros de fixtures.
- Cambiar la persistencia JSON por una base de datos.
- Crear Route Handlers o una API pública.
- Implementar autenticación, sesiones o autorización real.
- Eliminar los redirects permanentes acordados.
- Instalar un framework de testing.
- Añadir tests automatizados de arquitectura.
- Crear una capa `views`, `use-cases` o `application` adicional para reemplazar la composición de `page.tsx`.
- Mover el código a `src/`.
- Crear un directorio `app/pages/`.

## Data model

Esta spec no cambia campos, valores ni relaciones persistidas.

Redistribuye contratos existentes según su propietario:

```text
app/features/
├── kids/types/
│   ├── kid.ts                 # Kid, KidStatus
│   └── kid-list-item.ts       # KidListItem
├── people/types/
│   └── person.ts              # Person, PersonRole, PersonStatus
├── rooms/types/
│   └── room.ts                # Room
├── family/types/
│   ├── parent-kid.ts          # ParentKid, ParentRelationship
│   └── linked-parent.ts       # LinkedParent
└── auth/types/
    ├── credential.ts          # Credential
    ├── invitation.ts          # Invitation
    └── activation.ts          # ActivationInvitationState, ActivationKidCardData
```

`KidFormValues` y `KidFormErrors` permanecerán en `app/features/kids/schemas/kid-form.ts` porque son contratos de entrada y validación del flujo de formulario.

`KidListItem` permanecerá bajo Kids como DTO de presentación específico del listado de niños.

Los cuatro archivos JSON conservarán arreglos directos como raíz y sus modelos actuales:

```text
app/infrastructure/persistence/json/data/
├── kids.json          # Kid[]
├── people.json        # Person[]
├── rooms.json         # Room[]
└── parent-kids.json   # ParentKid[]
```

## Implementation plan

1. Registrar una línea base de rutas, redirects inexistentes, contenido de los cuatro JSON, imports públicos y smoke tests de Home, Auth y Kids.
2. Corregir el ciclo de `ActivateAccountForm` hacia el barrel de Auth usando un import relativo de su utilidad.
3. Retirar las reexportaciones de fixtures desde los barrels de Feed y Layout sin mover directorios todavía.
4. Definir y documentar las entradas públicas client-safe y `server` de las features existentes, actualizando consumidores sin cambiar comportamiento.
5. Separar `Kid`, `KidStatus`, `KidListItem` y tipos relacionados detrás de los barrels actuales de Kids para mantener compatibilidad interna durante la migración.
6. Crear `features/people/`, mover `Person`, `PersonRole` y `PersonStatus`, y actualizar los consumidores y fixtures tipados.
7. Crear `features/rooms/`, mover `Room`, y actualizar Kids, Auth, fixtures y servicios consumidores.
8. Crear `features/family/`, mover `ParentKid`, `ParentRelationship` y `LinkedParent`, y actualizar Kids, Auth y persistencia consumidores.
9. Reubicar `KidFormValues` y sus errores en el schema de formulario, eliminando su export como tipo de dominio de Kids.
10. Auditar Auth y Feed para separar sus contratos de dominio y presentación sin crear archivos por tipo cuando no aporten claridad.
11. Crear `app/components/layout/`, mover allí `StaffSidebar` y cualquier composición estructural compartida necesaria, preservando sus props y apariencia.
12. Mover la configuración tipada de navegación de personal a `app/shared/config/` y hacer que la composición de ruta entregue la configuración o fixtures necesarios al sidebar.
13. Mover la carga de `feedOverview` y `feedPosts` desde `FeedContent` a la página de Home, pasando los datos mínimos por props.
14. Eliminar `features/layout` y `data/mocks/layout` cuando ninguna ruta, componente ni fixture los importe.
15. Crear el adapter server-only `app/infrastructure/persistence/json/` con lectura, validación de colección, escritura atómica y serialización actualmente contenidas en el servicio de Kids.
16. Adaptar los servicios server-only de Kids, People, Rooms y Family para consumir el adapter JSON sin conocer `node:fs` ni rutas físicas.
17. Mover los cuatro archivos JSON a `app/infrastructure/persistence/json/data/` sin cambiar su contenido y actualizar el adapter a la nueva ruta.
18. Verificar Add, Edit, perfil, listado y activación de cuenta contra el adapter antes de eliminar las rutas antiguas de mocks editables.
19. Crear la ruta `(staff)/home/page.tsx`, actualizar navegación interna a `/home` y configurar el redirect permanente `/` a `/home` en `next.config.ts`.
20. Mover Login y Activación a `app/auth/`, actualizar enlaces internos y configurar redirects permanentes desde `/login` y `/activate-account`.
21. Mover las rutas de Kids bajo `(staff)/kids/` sin cambiar sus URLs públicas de listado, alta o perfil.
22. Mover Edit a `(staff)/kids/edit/[id]/page.tsx`, actualizar enlaces internos y configurar el redirect permanente `/kids/:id/edit` a `/kids/edit/:id`.
23. Eliminar archivos, barrels, imports y rutas antiguos solo después de comprobar que no quedan referencias con búsquedas estáticas y ejecución de rutas.
24. Actualizar `README.md` y `AGENTS.md` con el árbol definitivo, rutas públicas, redirects permanentes, política de imports y ubicación de tipos, mocks y persistencia.
25. Revisar que los límites Server/Client, JSDoc de APIs exportadas, fixtures estáticos, imports públicos y tokens de estilo siguen cumpliendo las reglas del proyecto.

## Acceptance criteria

- [ ] Existe `/home` y muestra el feed de personal actual sin cambios visuales o de contenido.
- [ ] `/` responde con redirect permanente hacia `/home`.
- [ ] Existe `/auth/login` y conserva el flujo visual actual de Login.
- [ ] Existe `/auth/activate-account` y conserva el flujo actual de activación.
- [ ] `/login` redirige permanentemente a `/auth/login`.
- [ ] `/activate-account` redirige permanentemente a `/auth/activate-account`.
- [ ] El redirect desde `/activate-account?code=<valor>` conserva el parámetro `code` en el destino.
- [ ] Existen `/kids`, `/kids/new`, `/kids/[slug]` y `/kids/edit/[id]`.
- [ ] El perfil de Kids busca por `slug`.
- [ ] Edit de Kids busca por `id`.
- [ ] `/kids/:id/edit` redirige permanentemente a `/kids/edit/:id`.
- [ ] No existen dos segmentos dinámicos hermanos que representen la misma posición de URL dentro de Kids.
- [ ] Las rutas de Home y Kids están organizadas bajo `app/(staff)/` sin que `(staff)` aparezca en sus URLs.
- [ ] `page.tsx` conserva la composición específica de cada pantalla.
- [ ] Ningún consumidor externo importa internals de una feature desde `components`, `types`, `services`, `actions`, `schemas` o `utils`.
- [ ] Cada feature que expone operaciones de servidor ofrece una entrada explícita `server` marcada como server-only cuando aplica.
- [ ] Ningún Client Component importa una entrada server-only, Infrastructure, `node:fs`, configuración privada ni el mailer.
- [ ] `StaffSidebar` se consume desde `@/app/components/layout`.
- [ ] No existe `app/features/layout/`.
- [ ] No existe `app/data/mocks/layout/`.
- [ ] La configuración de navegación de personal vive en `app/shared/config/`.
- [ ] Los componentes presentacionales `FeedContent` y `StaffSidebar` no cargan colecciones completas de mocks internamente.
- [ ] Existen `features/people`, `features/rooms` y `features/family` con barrels públicos.
- [ ] `Person`, `PersonRole` y `PersonStatus` pertenecen a People.
- [ ] `Room` pertenece a Rooms.
- [ ] `ParentKid`, `ParentRelationship` y `LinkedParent` pertenecen a Family.
- [ ] `Kid` y `KidStatus` pertenecen a Kids.
- [ ] `KidFormValues` y sus errores viven junto al schema de formulario de Kids.
- [ ] `KidListItem` se identifica como DTO de presentación del listado de Kids.
- [ ] No existe `app/features/kids/types/kids.ts`.
- [ ] Auth y Feed no mantienen tipos que mezclen sin justificación modelos, DTOs de presentación y props de componentes.
- [ ] Los props de componentes permanecen colocados junto a sus componentes.
- [ ] Existe `app/infrastructure/persistence/json/` marcado como server-only.
- [ ] El adapter JSON encapsula lectura, validación, serialización y escritura atómica.
- [ ] Los servicios de dominio no importan `node:fs` ni construyen rutas físicas a JSON.
- [ ] Los cuatro JSON editables viven en `app/infrastructure/persistence/json/data/`.
- [ ] `app/data/mocks/` contiene únicamente fixtures estáticos no editables.
- [ ] El contenido y la estructura raíz de los cuatro JSON se conservan durante el traslado.
- [ ] El listado, perfil, Add, Edit y activación continúan leyendo datos correctos después de mover el adapter y sus datos.
- [ ] No se cambian diseño, contenido, validaciones, flujos ni datos fuera de las URLs y redirects acordados.
- [ ] `README.md` documenta el árbol, las rutas públicas y la propiedad de componentes, features, shared, mocks e Infrastructure.
- [ ] `AGENTS.md` documenta los límites de imports client-safe y server-only, la propiedad de tipos y la ubicación de persistencia local.
- [ ] Las APIs y componentes reutilizables exportados incluyen JSDoc completo según las reglas del proyecto.
- [ ] `npx eslint app` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] Playwright verifica `/home`, `/auth/login`, `/auth/activate-account?code=<valor>`, `/kids`, `/kids/new`, un perfil por slug y Edit por ID en escritorio y móvil.

## Decisions

- **Sí:** conservar el código de aplicación bajo `app/` porque el proyecto ya usa esa estrategia y Next.js 16 la admite.
- **No:** mover a `src/` porque no resuelve por sí mismo la mezcla actual de responsabilidades.
- **Sí:** usar `(staff)` para agrupar Home y Kids sin alterar sus URLs públicas.
- **Sí:** usar la carpeta `auth/` como segmento público para reunir los flujos de autenticación.
- **Sí:** reemplazar `/` por `/home` porque el Home debe tener una ruta explícita.
- **Sí:** conservar `/`, `/login`, `/activate-account` y `/kids/:id/edit` como redirects permanentes porque ya pueden existir enlaces o bookmarks.
- **Sí:** usar redirects de `next.config.ts` porque Next.js mantiene query parameters y `permanent: true` expresa el contrato estable de migración.
- **Sí:** usar `/kids/edit/[id]` porque hace explícito que Edit usa ID y evita competir con el segmento dinámico `[slug]` del perfil.
- **No:** crear `kids/[id]/edit` junto a `kids/[slug]` porque ambos segmentos dinámicos representan el mismo patrón de URL.
- **Sí:** conservar la composición de página en `page.tsx` porque es simple, explícita y adecuada para las rutas existentes.
- **No:** introducir una capa genérica de views o casos de uso porque añadiría abstracción sin resolver un problema actual.
- **Sí:** definir entry points client-safe y `server` por feature para impedir que el cliente importe acciones, filesystem o configuración privada.
- **No:** permitir subpaths internos libres desde otros dominios porque debilitan los límites públicos.
- **Sí:** usar imports relativos dentro de una feature porque evitan ciclos mediante sus propios barrels.
- **Sí:** mover `StaffSidebar` a `components/layout` porque representa estructura de aplicación y no un dominio de negocio.
- **Sí:** poner navegación compartida en `shared/config` porque es configuración transversal, no un fixture ni un modelo de dominio.
- **Sí:** crear People, Rooms y Family porque sus modelos tienen consumidores más allá de Kids.
- **Sí:** mantener `ParentKid` en Family porque la relación puede evolucionar sin acoplarse a toda la feature Kids.
- **Sí:** conservar `KidListItem` en Kids porque es una proyección específica de ese listado.
- **Sí:** ubicar los contratos de formulario junto al schema porque describen entrada y validación, no el modelo persistido.
- **No:** crear un archivo por cada tipo cuando los tipos estrechamente relacionados pertenecen a una única responsabilidad.
- **Sí:** tratar los JSON editables como datos de Infrastructure porque son almacenamiento local mutable, no fixtures.
- **No:** mantener datos mutables en `data/mocks` porque confunde fuente de verdad con datos de ejemplo.
- **Sí:** no instalar testing porque esta migración se valida con compilación y Playwright manual; la estrategia automatizada merece una spec separada.

## Risks

| Risk                                                                                 | Mitigation                                                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Un redirect permanente puede quedar cacheado por navegadores.                        | Aplicar únicamente redirects aprobados como contrato estable y validarlos antes de publicar.                       |
| Un query parameter de activación puede perderse durante la migración.                | Usar redirects de Next.js y verificar `/activate-account?code=<valor>` con Playwright.                             |
| Mover los JSON puede romper la persistencia o perder registros.                      | Comparar contenido antes y después, conservar la escritura atómica y validar Add/Edit.                             |
| Los barrels pueden introducir ciclos o exponer código de servidor al cliente.        | Separar entradas client-safe y `server`, usar `server-only` y mantener imports relativos internos.                 |
| Separar dominios puede producir dependencias circulares entre Kids, Family y People. | Mantener entidades en su feature propietaria y resolver relaciones desde módulos server-only de composición.       |
| Un traslado masivo puede ocultar regresiones de rutas o estilos.                     | Dividir por fases funcionales, validar rutas afectadas después de cada fase y eliminar archivos antiguos al final. |

## What is **not** in this spec

- Rediseño visual o cambio de contenido de Home, Auth o Kids.
- Cambios de reglas de negocio, validaciones o fixtures.
- Base de datos, API pública, Route Handlers, autenticación real o sesiones.
- Eliminación de redirects permanentes.
- Framework o suite automatizada de testing.
- Capa genérica de views, casos de uso o application.
- Migración a `src/` o creación de `app/pages/`.

Cada una de estas capacidades requiere una spec posterior si se incorpora al producto.
