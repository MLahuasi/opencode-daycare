# SPEC 37 — Protección contra abuso del login

> **Status:** Approved
> **Depends on:** SPEC 36
> **Date:** 2026-11-10
> **Objective:** Proteger el login de enumeración y fuerza bruta mediante bcrypt ficticio, validación de 72 bytes y rate limiting persistente con HMAC.

## Why this spec exists

El tiempo de respuesta de una cuenta inexistente puede revelar información y los reintentos ilimitados permiten fuerza bruta. La protección debe funcionar con varias instancias de Vercel y fallar de forma segura si PostgreSQL no está disponible.

## Scope

**In:**

- Ejecutar una comparación bcrypt ficticia para cuentas inexistentes.
- Rechazar contraseñas cuya representación UTF-8 supere 72 bytes antes de compararla.
- Crear una migración en `supabase/migrations/` para los contadores de login.
- Limitar a 5 fallos por cuenta y 20 fallos por IP en ventanas de 15 minutos.
- Bloquear durante 15 minutos y devolver siempre un error genérico.
- Limpiar el contador de cuenta tras un login correcto.
- Derivar claves de cuenta e IP mediante HMAC y no almacenar email ni IP en claro.
- Rechazar el login si falla la consulta o actualización del rate limiter.
- Actualizar `README.md`, `AGENTS.md` y `architecture.md` con la operación y los secretos requeridos.

**Out of scope (for future specs):**

- Proveedor externo Redis/Upstash.
- MFA, CAPTCHA o recuperación de contraseña.
- Cambios de Cloudinary.

## Data model

La migración añadirá una tabla privada equivalente a:

```sql
login_attempt_limits(
  key_hash bytea primary key,
  window_started_at timestamptz not null,
  failure_count integer not null,
  blocked_until timestamptz,
  updated_at timestamptz not null
)
```

La clave será HMAC-SHA-256 con un secreto server-only y un prefijo de propósito (`account` o `ip`). La operación de incrementar, comprobar y bloquear será atómica.

## Implementation plan

1. Añadir constantes server-only para límites, ventana y bloqueo, sin permitir configuración desde el cliente.
2. Implementar la normalización de contraseña y la validación de 72 bytes UTF-8.
3. Añadir comparación bcrypt ficticia con un hash fijo generado previamente y no derivado de datos del usuario.
4. Crear la migración de `login_attempt_limits`, índices y función atómica necesaria, con grants mínimos.
5. Integrar la comprobación antes de autenticar y el registro de fallo después de una credencial inválida.
6. Integrar limpieza de cuenta tras éxito y mantener respuesta uniforme para cuenta inexistente, bloqueada o inválida.
7. Consumir `x-open-daycare-client-ip` creado por SPEC 36, sin leer headers no saneados.
8. Probar localmente con Docker Desktop, después ejecutar dry-run remoto sin aplicar la migración.
9. Añadir pruebas transaccionales y Playwright para umbrales, expiración, bloqueo y fallo cerrado.
10. Actualizar documentación y ejecutar ESLint, TypeScript y build.

## Acceptance criteria

- [ ] Una cuenta inexistente ejecuta una comparación bcrypt antes de devolver el error.
- [ ] Una contraseña de más de 72 bytes UTF-8 se rechaza sin truncarla.
- [ ] El quinto fallo de una cuenta activa su bloqueo de 15 minutos.
- [ ] El vigésimo fallo de una IP activa su bloqueo de 15 minutos.
- [ ] Los fallos se cuentan por ventana de 15 minutos y expiran correctamente.
- [ ] Un login correcto limpia el límite de cuenta.
- [ ] Email e IP no aparecen en claro en la tabla ni en logs.
- [ ] La respuesta no distingue cuenta inexistente, contraseña inválida o bloqueo.
- [ ] Un fallo de PostgreSQL en el rate limiter rechaza el login genéricamente.
- [ ] Dos instancias concurrentes no pueden saltarse el contador atómico.
- [ ] La migración se valida con Docker local y `npm run db:migrate:dry-run` antes de cualquier aplicación remota.
- [ ] Pruebas SQL y Playwright cubren los límites y la recuperación.
- [ ] `npx eslint src`, `npx tsc --noEmit --incremental false` y `npm run build` terminan correctamente.

## Decisions

- **Sí:** 5 fallos por cuenta y 20 por IP. Equilibra seguridad y redes compartidas.
- **Sí:** PostgreSQL con HMAC. Es consistente entre instancias y no expone identificadores.
- **Sí:** fail closed. El login no puede saltarse la defensa durante una incidencia.
- **Sí:** bcrypt ficticio. Reduce la enumeración temporal.
- **No:** memoria local. No es fiable con escalado ni reinicios.
- **No:** Redis externo. Se evita una dependencia adicional en esta fase.

## What is **not** in this spec

- Provisión de la contraseña del rol runtime, que pertenece a SPEC 38.
- MFA, CAPTCHA y recuperación de cuenta.
- Cambios de Cloudinary.

**Siguiente paso tras aprobación:** `/spec-impl 37-credential-login-abuse-protection`

---

Plan de implementación

1.  Añadir constantes server-only para límites, ventana y bloqueo.
2.  Implementar normalización y validación de contraseña de 72 bytes UTF-8.
3.  Añadir comparación bcrypt ficticia con hash fijo.
4.  Crear migración, índices, función atómica y grants mínimos.
5.  Integrar comprobación y registro de fallos.
6.  Limpiar el límite de cuenta tras éxito y uniformar respuestas.
7.  Consumir x-open-daycare-client-ip.
8.  Validar localmente y ejecutar dry-run remoto sin aplicar.
9.  Añadir pruebas transaccionales y Playwright.
10. Actualizar documentación y ejecutar ESLint, TypeScript y build.
