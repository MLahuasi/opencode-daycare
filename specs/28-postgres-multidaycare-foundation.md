# SPEC 28 — Fundación de persistencia PostgreSQL multi-daycare

> **Status:** Approved
> **Depends on:** SPEC 26 (`specs/26-supabase-schema-source-of-truth.md`), SPEC 27
> **Date:** 2026-11-05
> **Objective:** Preparar los contratos de dominio y los adapters server-only de PostgreSQL para que los módulos puedan leer y escribir Supabase sin modificar todavía el runtime activo de la aplicación.

## Why this spec exists

La aplicación usa IDs distintos en los JSON y en Supabase. Por ello los adapters PostgreSQL deben coexistir con los adapters JSON durante la migración, mientras las entidades de negocio expresan explícitamente su pertenencia a una guardería.

## Scope

**In:**

- Añadir `daycareId` a todas las entidades persistidas de `src/domain/`.
- Crear el contrato compartido `DaycareScoped` y validaciones puras de pertenencia a tenant.
- Crear `src/infrastructure/persistence/postgres/` como implementación separada de JSON.
- Configurar conexión PostgreSQL server-only con `postgres.js`.
- Derivar el endpoint directo desde `NEXT_PUBLIC_SUPABASE_URL` y usar `SUPABASE_DB_PASSWORD`.
- Generar tipos PostgreSQL desde el esquema remoto y mantenerlos dentro de Infrastructure.
- Crear helpers de mapeo entre filas `snake_case` y entidades de dominio.
- Crear soporte de pruebas remotas opt-in mediante `RUN_REMOTE_DB_TESTS` y rollback transaccional.
- Mantener el runtime de la aplicación usando JSON.

**Out of scope (for future specs):**

- Cambiar Composition para activar PostgreSQL en rutas productivas.
- Crear o alterar tablas, índices, constraints, enums, funciones, policies, grants o seeds.
- Crear una interfaz CRUD de guarderías.
- Resolver todavía la selección de guardería en login.
- Eliminar JSON o repositorios JSON.
- Implementar repositorios funcionales completos de Auth, Staff o General.

## Data model

Todas las entidades persistidas deben implementar el siguiente contrato conceptual:

```ts
export type DaycareScoped = {
  daycareId: string;
};
```

Se añade `daycareId` a:

- `Credential`
- `Invitation`
- `ParentKid`
- `Kid`
- `Person`
- `Room`
- `PersistedPost`
- `PostMedia`
- `PostComment`
- `PostReaction`
- `FamilyFeedPost`

No se añade a enums, reglas puras ni valores derivados sin identidad persistida.

Los JSON continúan sin `daycareId`. Sus adapters temporales deben obtener la única fila de `daycares` y añadir el valor únicamente al mapear al dominio, sin reescribir los archivos.

## Implementation plan

1. Crear el contrato `DaycareScoped` y las reglas puras para comparar tenants.
2. Añadir `daycareId` a las entidades y corregir sus barrels públicos.
3. Eliminar duplicaciones de contratos de `ParentKid` y `ParentRelationship` en Application cuando dupliquen Domain.
4. Añadir la dependencia fijada de `postgres.js` y configurar su cliente únicamente en módulos server-only.
5. Crear el proveedor PostgreSQL y derivar el host directo desde `NEXT_PUBLIC_SUPABASE_URL` sin registrar credenciales.
6. Crear el tipo generado de la base remota y mantenerlo fuera de Domain, Application y Presentation.
7. Crear mappers para `people`, `credential`, `invitation`, `rooms`, `kids`, `parent_kids`, `feed`, `feed_media`, `feed_comments` y `feed_reactions`.
8. Crear un `CurrentDaycareProvider` que lea la única guardería operativa y rechace cero o múltiples resultados.
9. Crear el contexto de pruebas PostgreSQL con transacción y rollback automático.
10. Verificar que la aplicación existente continúa compilando y ejecutándose con los adapters JSON sin modificar los JSON.

## Acceptance criteria

- [ ] Todas las entidades persistidas listadas tienen `daycareId` obligatorio.
- [ ] Los tipos derivados no duplican manualmente `daycareId`.
- [ ] Domain no importa PostgreSQL, Supabase, Next.js, filesystem ni configuración server-only.
- [ ] Existe `src/infrastructure/persistence/postgres/` separado de `src/infrastructure/persistence/json/`.
- [ ] La conexión PostgreSQL solo puede importarse desde código server-only.
- [ ] No se registra ninguna contraseña, URL completa, query ni respuesta sensible.
- [ ] El endpoint se deriva de `NEXT_PUBLIC_SUPABASE_URL` y la autenticación usa `SUPABASE_DB_PASSWORD`.
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no se usa como credencial PostgreSQL.
- [ ] Los mappers conservan nombres, fechas, `NULL`, cadenas vacías y valores enum.
- [ ] Los adapters JSON siguen funcionando y no modifican ningún archivo de `json/data`.
- [ ] Las pruebas remotas solo se ejecutan con `RUN_REMOTE_DB_TESTS` explícito.
- [ ] Las pruebas remotas revierten sus escrituras dentro de una transacción.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.

## Decisions

- **Sí:** usar `daycareId` en Domain porque la guardería es parte de la identidad de negocio.
- **Sí:** mantener JSON y PostgreSQL separados durante la migración para evitar mezclar IDs.
- **Sí:** usar `postgres.js` y conexión directa porque las credenciales actuales no permiten consultar tablas mediante la publishable key.
- **No:** usar `SUPABASE_DB_PASSWORD` desde el navegador o en variables `NEXT_PUBLIC_*`.
- **No:** cambiar el esquema remoto; la base existente es el contrato de esta migración.
- **Sí:** conservar los JSON como snapshot inmutable de migración.
- **No:** crear un fallback entre JSON y PostgreSQL dentro del mismo repositorio.

## Risks

| Risk                                           | Mitigation                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| El endpoint directo requiere IPv6.             | Verificar conectividad IPv6 antes de implementar las specs dependientes. |
| Se mezclan IDs JSON y PostgreSQL.              | Mantener adapters separados y runtime JSON hasta el cutover final.       |
| Se filtran tipos de Infrastructure al dominio. | Revisar imports y exigir mappers en los límites.                         |
| Las pruebas remotas dejan datos.               | Ejecutar cada suite dentro de una transacción con rollback.              |

## What is **not** in this spec

- Activación de PostgreSQL en la aplicación productiva.
- Cambios de esquema o políticas RLS.
- CRUD funcional completo de ningún módulo.
- Selección de guardería en login.
- Eliminación de JSON o adapters JSON.

---

Plan de implementación

2.  Añadir daycareId a entidades y corregir barrels públicos.
3.  Eliminar duplicaciones de ParentKid y ParentRelationship.
4.  Añadir postgres.js y configurar el cliente server-only.
5.  Crear proveedor PostgreSQL y derivar el host.
6.  Crear tipos generados de la base remota.
7.  Crear mappers de las tablas indicadas.
8.  Crear CurrentDaycareProvider.
9.  Crear contexto de pruebas con transacción y rollback.
10. Verificar compilación y continuidad de adapters JSON.
