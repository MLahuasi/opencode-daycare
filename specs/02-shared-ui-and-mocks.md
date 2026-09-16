# SPEC 02 — UI compartida y centralización de mocks

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-09-16
> **Objective:** Centralizar los mocks de la aplicación y extraer componentes UI reutilizables sin cambiar el comportamiento observable del Home del feed.

## Scope

**In:**

- Crear `app/data/mocks/` como ubicación única para los mocks de la aplicación.
- Agrupar los mocks por dominio en `app/data/mocks/feed/`, `app/data/mocks/layout/` y `app/data/mocks/kids/`.
- Crear un `index.ts` por dominio y `app/data/mocks/index.ts` como barrel público.
- Mover los mocks actuales de Feed y StaffSidebar a la nueva estructura sin cambiar sus valores.
- Mantener los tipos de dominio en `app/features/<domain>/types/`, incluyendo la extracción de los tipos actuales de StaffSidebar desde su fixture.
- Crear componentes globales reutilizables para avatar y badge en `app/components/ui/`.
- Crear `SearchField` y `LinkButton` en `app/components/ui/` para que puedan ser usados por Kids y futuras features.
- Reutilizar los componentes globales en Feed y StaffSidebar cuando exista una coincidencia real de responsabilidad.
- Mantener el contenido, apariencia, responsive, landmarks y accesibilidad actuales de `/`.
- Mantener los mocks importables desde `@/app/data/mocks` para facilitar futuros unit tests.

**Out of scope (for future specs):**

- Implementar `/kids` o `/kids/[slug]`; se realizará en SPEC 03.
- Crear una base de datos, API, persistencia o Server Actions.
- Instalar o configurar una librería de unit tests.
- Crear un componente global `Card`.
- Rediseñar Feed o StaffSidebar.
- Cambiar el contenido visible, las rutas existentes o el comportamiento responsive del Home.
- Implementar CRUD o acciones de negocio.

## Data model

Esta spec no introduce entidades nuevas. Reubica los fixtures existentes y establece sus barrels públicos.

La estructura de datos será:

```text
app/data/mocks/
├── index.ts
├── feed/
│   ├── feed-mock.ts
│   └── index.ts
├── layout/
│   ├── staff-sidebar-mock.ts
│   └── index.ts
└── kids/
    └── index.ts
```

`app/data/mocks/kids/index.ts` podrá quedar preparado para SPEC 03 sin introducir todavía fixtures de niños.

Los tipos continuarán en sus features correspondientes. Los fixtures importarán esos tipos en lugar de declarar contratos duplicados. El tipo `StaffNavigationIcon` y el tipo `StaffNavigationItem` deberán quedar en `app/features/layout/types/`.

## Implementation plan

1. Crear la estructura `app/data/mocks/` y sus barrels de Feed, Layout y raíz, dejando exports válidos y compilables.
2. Mover el fixture de Feed a `app/data/mocks/feed/feed-mock.ts` y actualizar los imports públicos sin modificar sus valores.
3. Mover el fixture de StaffSidebar a `app/data/mocks/layout/staff-sidebar-mock.ts` y actualizar los imports públicos sin modificar su configuración.
4. Crear `Avatar` en `app/components/ui/avatar.tsx` y su estilo asociado, aceptando `className`, inicial, tratamiento visual y atributos accesibles necesarios.
5. Crear `Badge` en `app/components/ui/badge.tsx` y su estilo asociado, aceptando `className`, contenido y variante visual.
6. Crear `SearchField` y `LinkButton` como componentes presentacionales reutilizables con JSDoc, estados visuales y `className` combinable.
7. Refactorizar Feed y StaffSidebar para consumir los mocks desde `@/app/data/mocks` y reutilizar los nuevos componentes donde corresponda.
8. Revisar que el Home conserve el mismo contenido, layout, comportamiento responsive, landmarks y estados de interacción que SPEC 01.

## Acceptance criteria

- [ ] Existe `app/data/mocks/index.ts` y exporta los fixtures públicos de Feed, Layout y Kids.
- [ ] Los mocks de Feed y StaffSidebar ya no se almacenan dentro de `features/<domain>/data`.
- [ ] Los imports de la aplicación consumen los mocks desde `@/app/data/mocks`.
- [ ] Los tipos de Feed y Layout permanecen en sus directorios de `features` y no se duplican dentro de los mocks.
- [ ] Existen componentes reutilizables `Avatar`, `Badge`, `SearchField` y `LinkButton` bajo `app/components/ui/`.
- [ ] Los componentes reutilizables aceptan y combinan `className`.
- [ ] Los componentes reutilizables tienen JSDoc completo para sus props propias y retorno.
- [ ] `/` conserva el copy, datos, estilos, responsive, landmarks y accesibilidad definidos en SPEC 01.
- [ ] La refactorización no introduce navegación ficticia, handlers de negocio ni estado de cliente innecesario.
- [ ] `npx eslint app` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.

## Decisions

- **Sí:** centralizar mocks bajo `app/data/mocks` porque serán reutilizados por la aplicación y futuros unit tests.
- **Sí:** organizar los mocks por dominio porque evita un archivo global difícil de mantener.
- **Sí:** mantener los tipos dentro de cada feature porque son contratos de dominio y no datos de prueba.
- **Sí:** exponer barrels por dominio y un barrel raíz porque simplifica los imports de runtime y de tests.
- **Sí:** extraer `Avatar`, `Badge`, `SearchField` y `LinkButton` porque tendrán uso transversal en Kids y en partes existentes.
- **No:** crear un `Card` global porque las tarjetas de Feed y Kids tienen semántica y composición distintas.
- **No:** cambiar el diseño observable del Home; esta spec es una refactorización estructural.
- **No:** instalar testing ahora; la centralización prepara los fixtures sin ampliar esta entrega.

## Risks

| Risk                                                                                 | Mitigation                                                                                                                 |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Los imports antiguos pueden quedar apuntando a fixtures eliminados.                  | Buscar todas las referencias a los mocks y compilar con ESLint, TypeScript y build.                                        |
| La extracción de UI puede alterar tamaños o estados del Home.                        | Comparar Feed y Sidebar con la salida de SPEC 01 y conservar sus clases y tokens visuales.                                 |
| El barrel raíz puede importar datos de dominios innecesarios en un Client Component. | Mantener los componentes de esta spec como Server Components y revisar los límites de importación durante la verificación. |

## What is **not** in this spec

- Listado de niños, perfiles o rutas `/kids`.
- CRUD, persistencia, API o base de datos.
- Instalación de unit tests.
- Componente global `Card`.
- Cambios visuales o funcionales al Home del feed.
