# SPEC 03 — Listado de niños y perfiles

> **Status:** Implemented
> **Depends on:** SPEC 02
> **Date:** 2026-09-16
> **Objective:** Implementar el listado `/kids` y los perfiles `/kids/[slug]` con datos mock tipados, filtrado local y navegación accesible basada en las plantillas de niños y perfil de niño.

## Scope

**In:**

- Crear la página `/kids` basada en `references/screens/ninos.dc.html`.
- Crear la página dinámica `/kids/[slug]` basada en `references/screens/perfil-nino.dc.html`.
- Crear `app/kids/layout.tsx` para compartir StaffSidebar, navegación responsive y estructura visual entre el listado, perfiles y 404.
- Crear una página 404 propia para slugs inválidos con regreso a `/kids`.
- Mantener los ocho niños visibles en la plantilla y proporcionar un perfil completo para cada uno.
- Crear mocks tipados de niños y padres bajo `app/data/mocks/kids/`.
- Modelar `Kid` con información propia, incluyendo `birthDate` y `medicalNotes`.
- Modelar `Parent` como entidad independiente enlazada desde `Kid` mediante IDs.
- Derivar edad, inicial, cantidad de padres e información resumida desde los mocks canónicos.
- Calcular la edad a partir de `birthDate` usando partes del calendario y una fecha de referencia explícita.
- Mantener nombres, conteos y etiquetas no médicas visibles de la plantilla, enriqueciendo los perfiles con información ficticia coherente.
- Mantener `medicalNotes` únicamente en el perfil; no mostrar ni serializar información médica en el listado.
- Implementar filtrado local por nombre sin distinguir mayúsculas, minúsculas ni tildes.
- Aplicar `trim()` a la consulta y mostrar todos los niños cuando la consulta esté vacía.
- Mostrar un grid sin tarjetas cuando el filtro no encuentre coincidencias, conservando el buscador y el encabezado.
- Hacer navegables las tarjetas hacia el slug canónico correspondiente y permitir regresar a `/kids`.
- Actualizar `StaffSidebar` para que solo Niños tenga navegación real hacia `/kids` y sea la sección activa en `/kids` y `/kids/[slug]`.
- Mantener Feed con navegación real hacia `/`; Avisos y Mi cuenta permanecen como controles presentacionales sin destinos ficticios.
- Reutilizar `Button`, `Avatar`, `Badge`, `SearchField` y `LinkButton` de `app/components/ui/` cuando corresponda.
- Mantener los controles secundarios como botones presentacionales sin CRUD ni navegación.
- Adaptar las páginas a móvil usando la navegación inferior existente y contenido apilado.

**Out of scope (for future specs):**

- Base de datos, API, persistencia o sincronización remota.
- Alta, edición o eliminación de niños.
- Edición de `medicalNotes`.
- Página de padres o gestión de la entidad `Parent`.
- Vincular o desvincular padres.
- Funcionalidad de los botones Agregar niño, Editar, Resumen del día y Vincular otro padre.
- Filtrado remoto, paginación o búsqueda avanzada.
- Implementar otras rutas del sidebar como Avisos o Mi cuenta.

## Data model

Los fixtures vivirán en `app/data/mocks/kids/` y serán consumidos desde `app/data/mocks` para los datos. Los tipos de dominio y DTOs vivirán en `app/features/kids/types/` y se expondrán desde la API pública de la feature.

```ts
type ParentRelationship = "mother" | "father" | "guardian";
type ParentStatus = "active" | "inactive" | "pending";

type Parent = {
  id: string;
  name: string;
  email: string;
  relationship: ParentRelationship;
  code: string;
  status: ParentStatus;
};

type Kid = {
  id: string;
  slug: string;
  name: string;
  birthDate: string;
  room: string;
  enrollmentDate: string;
  medicalNotes: string;
  parentIds: string[];
};

type KidListItem = {
  slug: string;
  name: string;
  initial: string;
  age: number;
  parentCount: number;
  avatarTone: string;
  shouldLinkParent: boolean;
};
```

`birthDate` y `enrollmentDate` usarán fechas ISO date-only en formato `YYYY-MM-DD`. `slug` será un valor canónico estable del fixture, único entre los ocho niños y normalizado a ASCII. La utilidad de normalización podrá generarlo o validarlo, pero no se recalculará en cada render.

Los códigos de padres serán valores alfanuméricos fijos del mock. Los valores internos de parentesco y estado estarán en inglés y se traducirán a español únicamente en la presentación.

El servidor proyectará `Kid[]` y `Parent[]` a datos mínimos antes de entregar información al componente cliente del filtro. `KidListItem` no incluirá `medicalNotes`, `parentIds`, `email` ni `code`. El componente cliente no importará `@/app/data/mocks`.

## Implementation plan

1. Crear `app/features/kids/types/` con los modelos `Kid`, `Parent`, sus unions y el DTO `KidListItem`; crear `app/features/kids/index.ts` para exponer la API pública de la feature.
2. Crear utilidades server-safe para normalizar nombres, validar unicidad de slugs y calcular edades mediante `calculateAge(birthDate, asOfDate)` usando fechas ISO y partes del calendario.
3. Crear los fixtures de los ocho niños y sus padres en `app/data/mocks/kids/`, incluyendo fechas, notas médicas, IDs, relaciones, códigos y estados coherentes.
4. Actualizar `app/data/mocks/kids/index.ts` y el barrel raíz para exponer únicamente los valores fixture de Kids; exponer los tipos desde `app/features/kids`.
5. Crear `app/kids/layout.tsx` como Server Component con StaffSidebar y la estructura compartida, pasando `activeSection="children"` sin resolver la URL en el cliente.
6. Crear los componentes presentacionales del listado en `app/features/kids/components/`, incluyendo encabezado, tarjeta, agrupación por sala y estado sin resultados.
7. Crear un único Client Component pequeño para el filtrado local que reciba únicamente `readonly KidListItem[]`, importe UI desde `@/app/components/ui` y no importe mocks ni datos sensibles.
8. Crear `app/kids/page.tsx` como Server Component, proyectar los mocks a `KidListItem[]` y componer el listado con el componente cliente de búsqueda.
9. Crear los componentes presentacionales del perfil para identidad, notas médicas, datos básicos, padres vinculados y controles sin acción.
10. Crear `app/kids/[slug]/page.tsx` con `params: Promise<{ slug: string }>`, resolver el slug canónico después de `await params`, calcular valores derivados y llamar a `notFound()` para slugs desconocidos.
11. Añadir `generateStaticParams()` para los ocho slugs y crear `app/kids/[slug]/not-found.tsx` con una pantalla accesible y enlace real a `/kids`.
12. Actualizar `StaffSidebar` para aceptar `activeSection`, enlazar únicamente Niños a `/kids` mediante `LinkButton` y conservar Feed, Avisos y Mi cuenta como controles presentacionales.
13. Añadir o reutilizar tokens semánticos en `app/globals.css` para todos los colores, sombras y gradientes de Kids, y crear estilos responsive sin literales visuales fuera de ese archivo.

## Acceptance criteria

- [x] `/kids` carga sin errores de servidor, consola o hidratación.
- [x] `/kids` muestra los ocho niños definidos por el mock y conserva la composición visual principal de `ninos.dc.html`.
- [x] Cada tarjeta deriva su inicial, edad, cantidad de padres y cualquier etiqueta no médica desde los datos mock.
- [x] El listado no muestra ni serializa `medicalNotes` ni ningún resumen médico.
- [x] Las tarjetas navegan a un slug ASCII único bajo `/kids/[slug]`.
- [x] Los ocho slugs conocidos muestran un perfil completo basado en los datos del mock.
- [x] El perfil muestra nombre, edad calculada desde `birthDate`, sala, ingreso y `medicalNotes` del niño.
- [x] El perfil muestra los padres asociados mediante `parentIds`, incluyendo nombre, parentesco traducido y estado traducido.
- [x] El perfil no expone funcionalidades para modificar datos.
- [x] El perfil permite regresar funcionalmente a `/kids`.
- [x] Un slug desconocido muestra la página 404 propia con un enlace funcional a `/kids`.
- [x] La 404 conserva el layout de Kids, StaffSidebar, navegación móvil, un único H1 y el enlace de regreso.
- [x] `generateStaticParams()` devuelve los ocho slugs canónicos.
- [x] El buscador filtra localmente por nombre ignorando mayúsculas, minúsculas y tildes.
- [x] La consulta se recorta con `trim()` y una consulta vacía muestra todos los niños.
- [x] Un filtro sin coincidencias deja el grid sin tarjetas y conserva visibles el buscador y el encabezado.
- [x] El Client Component del filtro recibe únicamente `KidListItem[]` y no importa mocks ni datos sensibles.
- [x] `email`, `code`, `medicalNotes` y `parentIds` no aparecen en el payload ni en el HTML del listado.
- [x] En `/kids` y `/kids/[slug]`, StaffSidebar marca Niños con `aria-current="page"`.
- [x] En `/`, StaffSidebar mantiene Feed como sección activa.
- [x] Solo Niños tiene navegación real hacia `/kids`; las demás opciones no tienen destinos ficticios.
- [x] Agregar niño, Editar, Resumen del día y Vincular otro padre no navegan ni ejecutan CRUD.
- [x] Los controles presentacionales con interacción futura definida usan elementos semánticos adecuados y estados visuales aplicables.
- [x] La experiencia funciona en escritorio y móvil con la navegación inferior existente.
- [x] Todos los fixtures están dentro de `app/data/mocks/kids/` y se consumen mediante barrels públicos.
- [x] Los modelos de Kids están en `app/features/kids/types/` y los componentes específicos en `app/features/kids/components/`.
- [x] Los componentes reutilizables se importan desde `@/app/components/ui` y aceptan `className` cuando corresponda.
- [x] Las APIs exportadas y componentes reutilizables tienen JSDoc completo.
- [x] No existen colores, sombras o gradientes literales fuera de `app/globals.css`.
- [x] No se implementan API, base de datos, persistencia ni datos hardcodeados en páginas o componentes.
- [x] `npx eslint app` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] Las capturas de verificación se almacenan bajo `.playwright-mcp/Kids/`.

## Decisions

- **Sí:** separar esta feature de la centralización de mocks y UI; SPEC 03 depende de SPEC 02.
- **Sí:** usar ocho perfiles completos para que todas las tarjetas de la plantilla tengan navegación válida.
- **Sí:** usar mocks como representación de una futura capa de persistencia, sin conectar todavía una base de datos.
- **Sí:** mantener `medicalNotes` dentro de `Kid` porque es información propia del niño y podría modificarse en una futura operación de persistencia.
- **Sí:** mostrar `medicalNotes` únicamente en el perfil y no exponer etiquetas médicas en el listado.
- **Sí:** modelar `Parent` como entidad independiente y enlazarlo por IDs para reflejar la futura relación de base de datos.
- **Sí:** guardar `status` en `Parent` porque forma parte de la información mock solicitada para mostrar los perfiles.
- **Sí:** usar identificadores internos en inglés y traducirlos en la presentación para respetar las convenciones del código.
- **Sí:** usar códigos fijos de padres porque representan valores persistidos y deben ser estables durante las pruebas.
- **Sí:** calcular la edad siempre desde la fecha de nacimiento mediante calendario, aunque difiera del texto congelado de la plantilla.
- **Sí:** usar slugs legibles, canónicos, únicos y normalizados a ASCII.
- **Sí:** implementar el filtro local en un Client Component mínimo que reciba un DTO sin datos sensibles.
- **Sí:** compartir el layout de Kids desde `app/kids/layout.tsx` para que la página y la 404 conserven la navegación.
- **Sí:** mostrar una 404 propia porque comunica el error dentro del lenguaje visual de OpenDayCare.
- **Sí:** agregar navegación real únicamente a Niños, porque es el destino solicitado en esta fase.
- **No:** implementar búsqueda remota, edición, vinculación de padres o cualquier acción CRUD.
- **No:** exponer `email`, `code`, `medicalNotes` o `parentIds` al componente cliente del listado.
- **No:** inventar rutas para Feed, Avisos, Mi cuenta, Resumen del día o acciones secundarias.

## Risks

| Risk                                                                        | Mitigation                                                                                                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| La edad calculada puede diferir de los textos de la plantilla.              | Tratar `birthDate` como fuente canónica, usar cálculo por calendario y verificar con una fecha de referencia explícita.             |
| El modelo de padres puede quedar inconsistente si falta un ID.              | Resolver relaciones mediante funciones tipadas y verificar que cada `parentId` exista en los fixtures.                              |
| El filtrado local requiere estado de cliente.                               | Mantener un único Client Component pequeño y entregar solo `KidListItem[]` proyectados desde el servidor.                           |
| Datos sensibles pueden llegar al RSC payload del listado.                   | No importar mocks en el cliente y verificar que el DTO no contenga `email`, `code`, `medicalNotes` ni `parentIds`.                  |
| La plantilla contiene acciones sin destino real.                            | Renderizarlas como controles presentacionales sin enlaces ni handlers de negocio.                                                   |
| El cambio de navegación puede afectar el Home existente.                    | Mantener Feed como sección activa por defecto en `/`, activar Niños por composición de ruta y verificar ambas variantes responsive. |
| Los colores de la plantilla pueden quedar como literales en nuevos módulos. | Crear tokens semánticos en `app/globals.css` y buscar literales fuera de ese archivo durante la validación.                         |

## What is **not** in this spec

- Base de datos, API, persistencia o sincronización remota.
- CRUD de niños, padres o notas médicas.
- Página de padres o flujo de vinculación.
- Exposición de datos sensibles en el cliente del listado.
- Rutas de Avisos, Mi cuenta o Resumen del día.
- Búsqueda remota, paginación o filtros avanzados.
