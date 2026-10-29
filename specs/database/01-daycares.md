# SPEC DATABASE 01 — Primera tabla `daycares`

> **Status:** Implemented
> **Depends on:** SPEC 26
> **Date:** 2026-10-29
> **Objective:** Crear la tabla raíz `daycares` mediante scripts de migración y seed versionados, aplicarlos al proyecto Supabase configurado y habilitar RLS.

## Scope

**In:**

- Crear scripts SQL versionados en `src/infrastructure/persistence/migrations/`.
- Crear la tabla `public.daycares` en el proyecto Supabase configurado.
- Incorporar el nombre y la dirección de la guardería inicial de prueba.
- Habilitar Row Level Security (RLS) sobre la tabla.
- Aplicar la migración al proyecto remoto Supabase.
- Aplicar el seed al proyecto remoto Supabase.
- Verificar la estructura resultante y el estado de RLS.
- Mantener intactos la persistencia JSON y el runtime actual.

**Out of scope (for future specs):**

- Crear las demás tablas del modelo PostgreSQL.
- Crear políticas RLS definitivas.
- Implementar claims `sub`, `daycare_id` o `role`.
- Crear repositorios o adaptadores PostgreSQL.
- Migrar datos desde JSON.
- Integrar la aplicación con Supabase.
- Crear triggers automáticos para `updated_at`.

## Data model

Tabla: `public.daycares`.

| Column       | PostgreSQL type | Null/default/constraint                   |
| ------------ | --------------- | ----------------------------------------- |
| `id`         | `uuid`          | PK, NOT NULL, default `gen_random_uuid()` |
| `name`       | `text`          | NOT NULL                                  |
| `address`    | `text`          | NOT NULL                                  |
| `created_at` | `timestamptz`   | NOT NULL, default `now()`                 |
| `updated_at` | `timestamptz`   | NOT NULL, default `now()`                 |

La tabla tendrá RLS habilitado. No se crearán políticas públicas permisivas mientras no estén definidos los claims confiables de autenticación propia.

### Seed inicial

El seed debe insertar, de forma idempotente, el siguiente registro:

```sql
('Guardería Sala Soles', 'Av. Principal 123, Centro')
```

Si ya existe una guardería con el mismo `name` y `address`, el seed no debe insertar un duplicado.

## Implementation plan

1. Crear un script de migración SQL versionado en `src/infrastructure/persistence/migrations/`.
2. Definir la creación de `public.daycares` con `id`, `name`, `address`, `created_at` y `updated_at`.
3. Habilitar RLS sobre `public.daycares` dentro de la migración.
4. Crear un script de seed SQL versionado en el mismo directorio.
5. Hacer que el seed inserte `Guardería Sala Soles` y `Av. Principal 123, Centro` sin duplicados.
6. Revisar que los scripts no creen políticas inseguras ni modifiquen datos JSON.
7. Aplicar la migración al proyecto Supabase remoto mediante el flujo de migraciones configurado.
8. Aplicar el seed al proyecto Supabase remoto.
9. Consultar la estructura resultante, el estado de RLS y el registro sembrado.
10. Confirmar que no se modificó el código runtime.

## Acceptance criteria

- [x] Existe un script de migración versionado en `src/infrastructure/persistence/migrations/`.
- [x] Existe un script de seed versionado en `src/infrastructure/persistence/migrations/`.
- [x] La migración crea `public.daycares`.
- [x] `id` es UUID, clave primaria y usa `gen_random_uuid()` por defecto.
- [x] `name` es `text NOT NULL`.
- [x] `address` es `text NOT NULL`.
- [x] `created_at` usa `timestamptz NOT NULL DEFAULT now()`.
- [x] `updated_at` usa `timestamptz NOT NULL DEFAULT now()`.
- [x] RLS está habilitado en `public.daycares`.
- [x] No existen políticas públicas permisivas.
- [x] La migración fue aplicada correctamente en Supabase.
- [x] El seed fue aplicado correctamente en Supabase.
- [x] Existe un registro con nombre `Guardería Sala Soles` y dirección `Av. Principal 123, Centro`.
- [x] Ejecutar el seed más de una vez no duplica el registro.
- [x] La tabla puede consultarse mediante las herramientas MCP de Supabase.
- [x] No se modificó la persistencia JSON.
- [x] No se modificó el runtime de la aplicación.

## Decisions

- **Sí:** usar `daycares` como primera tabla porque es la raíz del aislamiento multi-tenant.
- **Sí:** agregar `address` para conservar la información de ubicación del seed solicitado.
- **Sí:** guardar los scripts de migración y seed en `src/infrastructure/persistence/migrations/`, según la decisión del proyecto.
- **Sí:** aplicar la migración al proyecto Supabase remoto.
- **Sí:** aplicar un seed inicial idempotente para validar la conexión y la estructura.
- **Sí:** habilitar RLS desde la creación.
- **No:** crear políticas RLS todavía, porque aún no están implementados los claims confiables.
- **No:** migrar datos desde los JSON actuales.
- **No:** modificar JSON ni conectar el runtime a Supabase.

## Risks

| Risk                                                             | Mitigation                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| La tabla queda inaccesible para clientes por no tener políticas. | Es intencional hasta definir autenticación y claims.                                   |
| La migración local y el historial remoto divergen.               | Verificar el resultado remoto inmediatamente después de aplicar la migración.          |
| `updated_at` no se actualiza automáticamente.                    | Dejar el trigger fuera de esta primera tabla y documentarlo para una futura migración. |
| El seed se ejecuta varias veces y duplica la guardería.          | Hacer la inserción condicional por `name` y `address`.                                 |

## What is **not** in this spec

- Las demás tablas del diccionario PostgreSQL.
- Políticas RLS de negocio.
- Claims o integración con la autenticación propia.
- Migración de datos JSON.
- Repositorios, clientes o adaptadores Supabase.
- Seeds distintos de `Guardería Sala Soles`.
- Triggers de auditoría o actualización automática de `updated_at`.
