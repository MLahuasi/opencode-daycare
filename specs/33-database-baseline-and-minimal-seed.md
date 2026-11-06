# SPEC 33 — Baseline PostgreSQL y seed mínimo independiente

> **Status:** Approved
> **Depends on:** SPEC 32
> **Date:** 2026-11-06
> **Objective:** Reemplazar las migraciones actuales por una única estructura PostgreSQL final y un seed independiente que deje una guardería nueva lista para el primer acceso de Caro.

## Why this spec exists

El esquema actual fue construido mediante varias migraciones que mezclan estructura, datos demo y contenido histórico. Esta spec define el punto de partida reproducible para un proyecto Supabase nuevo, sin modificar el proyecto remoto actualmente enlazado.

## Scope

**In:**

- Sustituir los cuatro archivos actuales de `supabase/migrations/` por una única migración estructural versionada.
- Mantener todos los enums dentro de la migración estructural.
- Crear el catálogo global `roles` y la relación tenant-scoped `people_roles`.
- Agregar `daycares.brand_name` y `people.job_title`.
- Eliminar `feed_overview` de la estructura final.
- Crear `supabase/seed.sql` como seed independiente, transaccional e idempotente.
- Crear comandos npm separados para migrar la estructura y ejecutar el seed.
- Documentar que la estructura y el seed solo se aplican a un proyecto Supabase nuevo después de adaptar el runtime en SPEC 34.

**Out of scope (for future specs):**

- Aplicar esta reorganización al proyecto remoto actualmente enlazado.
- Migrar o conservar datos históricos de producción.
- Sembrar niños, padres, invitaciones, posts, comentarios, reacciones, media o fixtures históricos.
- Implementar el runtime multirol, Auth, navegación dinámica o autorización; corresponde a SPEC 34.
- Crear tablas `permissions` o `role_permissions`.
- Crear políticas RLS, administración de guarderías o Supabase Auth.

## Data model

La migración estructural debe conservar las entidades de negocio necesarias por el runtime PostgreSQL y reemplazar el rol singular por esta relación:

```text
roles
  id uuid primary key
  code person_role unique not null

people_roles
  daycare_id uuid not null references daycares(id)
  person_id uuid not null references people(id)
  role_id uuid not null references roles(id)
  unique (daycare_id, person_id, role_id)

daycares.brand_name text not null
people.job_title text null
```

El enum `person_role` debe contener exactamente `admin`, `personal`, `teacher` y `parent`. Los demás enums existentes y necesarios para la estructura permanecen en la migración estructural.

La relación `people_roles` incluye `daycare_id` porque una misma persona puede tener roles diferentes en distintas guarderías. No se agrega una restricción UNIQUE a `credential`; el seed debe resolver la idempotencia con búsquedas y actualizaciones compatibles con la estructura final.

El seed debe producir exactamente estas cantidades iniciales:

```text
daycares:    1
roles:       4
people:      1
credential:  1
people_roles: 3
rooms:       3
staff_rooms: 3
total:       16
```

Los datos iniciales son:

- Daycare: `name = 'Guardería Sala Soles'`, `brand_name = 'OpenDayCare'`.
- Persona: Caro Giménez, activa, con `job_title = 'Maestra'`.
- Credencial: `caro@opendaycare.com`, hash bcrypt existente para `OpenDayCare1!`.
- Roles de Caro en el daycare: `admin`, `personal` y `teacher`.
- Salas: `Soles`, `Girasoles` y `Patitos`.
- Asignaciones: Caro pertenece a las tres salas mediante `staff_rooms`.

## Implementation plan

1. Inventariar las cuatro migraciones actuales y definir el orden completo de creación, constraints, índices, funciones y tablas en un único archivo estructural nuevo.
2. Reemplazar los archivos de `supabase/migrations/` por una única migración que cree enums, tablas, relaciones, índices y constraints finales, incluyendo `roles`, `people_roles`, `brand_name` y `job_title`, y sin crear `feed_overview`.
3. Crear `supabase/seed.sql` fuera de `supabase/migrations/`; resolver el daycare por `name` usando `order by created_at limit 1`, insertarlo cuando no exista y ejecutar el resto dentro de una transacción.
4. Hacer que el seed inserte o actualice de forma idempotente el catálogo de roles, Caro, su credencial, sus tres roles, las tres salas y las tres asignaciones `staff_rooms`, sin insertar contenido de negocio.
5. Agregar comandos npm separados para validar/aplicar migraciones y para ejecutar exclusivamente `supabase/seed.sql`; el comando de migración no debe ejecutar el seed implícitamente.
6. Actualizar la configuración y documentación operativa para que el seed estándar no se ejecute durante una migración, y para prohibir `db:migrate` o `db:seed` contra el proyecto remoto antiguo.
7. Validar la estructura con una base Supabase local o una base temporal vacía, ejecutar el seed dos veces y comprobar que el segundo ciclo no duplica filas ni asignaciones.
8. Dejar documentada la evidencia de conteos, relaciones y credenciales para que SPEC 34 pueda adaptar el runtime antes de aplicar el esquema al proyecto nuevo.

## Acceptance criteria

- [ ] `supabase/migrations/` contiene una sola migración estructural nueva y no contiene el seed.
- [ ] La migración crea todos los enums antes de las columnas que los usan.
- [ ] El esquema contiene `roles` global y `people_roles` con `daycare_id` y unicidad por daycare, persona y rol.
- [ ] `roles.code` acepta exactamente `admin`, `personal`, `teacher` y `parent`.
- [ ] `daycares.brand_name` y `people.job_title` existen con los tipos y nulabilidad definidos.
- [ ] `feed_overview` no existe en el esquema final.
- [ ] `supabase/seed.sql` existe fuera de `supabase/migrations/` y no depende de otra ejecución de seed.
- [ ] El seed localiza `Guardería Sala Soles` con `select id from public.daycares where name = 'Guardería Sala Soles' order by created_at limit 1;` y la crea si la base está vacía.
- [ ] El seed crea o deja disponibles los 16 registros iniciales definidos en esta spec.
- [ ] Caro puede autenticarse con `caro@opendaycare.com` y `OpenDayCare1!` después de ejecutar estructura y seed.
- [ ] Caro queda relacionada con `admin`, `personal` y `teacher` en el daycare sembrado.
- [ ] Caro queda asignada a `Soles`, `Girasoles` y `Patitos` mediante `staff_rooms`.
- [ ] El seed no crea kids, parent_kids, invitations, posts, comments, reactions, media ni históricos.
- [ ] Ejecutar el seed dos veces no duplica daycare, roles, persona, credencial, salas, roles de Caro ni asignaciones.
- [ ] Existen comandos npm separados para estructura y seed.
- [ ] La documentación prohíbe aplicar estos archivos al proyecto Supabase remoto actualmente enlazado.

## Decisions

- **Sí:** usar una única migración estructural para que el esquema nuevo sea reproducible desde cero.
- **Sí:** usar `supabase/seed.sql` para que la carga de datos sea realmente independiente de las migraciones.
- **No:** mantener el seed dentro de `supabase/migrations/`, porque Supabase lo aplicaría como parte del historial estructural.
- **Sí:** sembrar las tres salas y las tres asignaciones de Caro, porque la aplicación no permite crear salas antes de crear niños o publicaciones.
- **No:** sembrar una fila `feed_overview`; el encabezado se derivará de datos reales en SPEC 34.
- **Sí:** conservar `Guardería Sala Soles` como nombre operativo y guardar `OpenDayCare` en `daycares.brand_name`.
- **Sí:** persistir `Maestra` en `people.job_title`; el cargo visible no sustituye al rol de autorización `teacher`.
- **No:** agregar una restricción UNIQUE a `credential`; la idempotencia se implementará sin cambiar esa decisión estructural.
- **No:** modificar el proyecto remoto actualmente enlazado; el destino será un proyecto nuevo creado desde cero.

## Risks

| Risk                                                                           | Mitigation                                                                                                      |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| El seed se ejecuta contra el proyecto equivocado.                              | Exigir proyecto nuevo, revisar el enlace antes de aplicar y documentar la prohibición sobre el proyecto actual. |
| La ejecución repetida duplica filas por la ausencia de UNIQUE en `credential`. | Usar búsquedas deterministas y actualizar la fila encontrada dentro de una transacción.                         |
| El runtime espera `feed_overview`.                                             | SPEC 34 debe eliminar sus consumidores antes de aplicar el esquema nuevo.                                       |
| Una sala queda sin asignación para Caro.                                       | Validar las tres relaciones `staff_rooms` como criterio de aceptación.                                          |

## What is **not** in this spec

- Adaptación de Auth, JWT, sesión o autorización multirol.
- Implementación de la navegación Staff dinámica.
- Modificación de páginas o componentes React.
- Aplicación al proyecto Supabase remoto actual.
- Datos demo distintos del bootstrap mínimo definido.

---

Plan de implementación

1. Inventariar las cuatro migraciones actuales y definir el orden estructural completo.
2. Reemplazarlas por una única migración final.
3. Crear supabase/seed.sql independiente.
4. Hacer el seed idempotente para roles, Caro, salas y asignaciones.
5. Agregar comandos npm separados para migración y seed.
6. Actualizar configuración y documentación operativa.
7. Validar estructura y ejecutar el seed dos veces sin duplicados.
8. Documentar evidencia de conteos, relaciones y credenciales.
