# SPEC 36 — Límite de seguridad HTTP de Next.js

> **Status:** Approved
> **Depends on:** SPEC 35
> **Date:** 2026-11-10
> **Objective:** Endurecer el límite HTTP de Next.js con CSP por nonce, cabeceras defensivas, IP saneada y límites de carga explícitos.

## Why this spec exists

Las cabeceras y los límites de transporte son una barrera independiente de la autorización de aplicación. Deben aplicarse antes de que el código procese entradas grandes o confíe en una dirección IP proporcionada por el cliente.

## Scope

**In:**

- Crear `proxy.ts` para generar un nonce criptográficamente aleatorio por petición.
- Aplicar CSP bloqueante con `script-src` basado en nonce y directivas sin fuentes inseguras innecesarias.
- Añadir `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` y HSTS solo en producción HTTPS.
- Resolver la IP con `ipAddress()` de `@vercel/functions` y propagar únicamente un header interno saneado.
- Limitar cada imagen a 5 MB, a un máximo de cuatro imágenes por operación y a 22 MB por Server Action.
- Mantener sin máximos individuales nuevos los campos de alergias y notas.
- Actualizar `README.md`, `AGENTS.md` y `architecture.md` con la frontera HTTP y el uso de Docker local.

**Out of scope (for future specs):**

- Cambios de Cloudinary o generación de URLs.
- Reportes CSP externos o un sistema de observabilidad nuevo.
- Rate limiting de login, que pertenece a SPEC 37.

## Data model

No se introducen estructuras persistentes. Se añade el contrato interno de petición:

```text
request header: x-open-daycare-client-ip
value: IP validada por Vercel, nunca un header enviado directamente por el cliente
```

## Implementation plan

1. Implementar el resolver de IP de Vercel y eliminar cualquier confianza directa en `x-forwarded-for`.
2. Implementar el nonce por petición en `proxy.ts` y conectar el valor con el renderizado de Next.js.
3. Configurar la CSP y las cabeceras defensivas en la configuración vigente de Next.js.
4. Reducir `serverActions.bodySizeLimit` a `22mb` y validar cantidad, tipo y tamaño de imágenes en el límite de aplicación.
5. Verificar que las rutas dinámicas necesarias para nonce no se publiquen accidentalmente como estáticas.
6. Añadir pruebas de headers, rechazo de cargas y navegación en Playwright.
7. Ejecutar lint, typecheck y build, y documentar las variables y la configuración sin secretos.

## Acceptance criteria

- [ ] Cada respuesta HTML protegida contiene una CSP bloqueante con nonce distinto por petición.
- [ ] La CSP no usa `unsafe-inline` para scripts en producción.
- [ ] Las cabeceras defensivas aparecen en las rutas de la aplicación.
- [ ] HSTS no se envía en desarrollo HTTP.
- [ ] NextAuth y el rate limiter reciben solo la IP interna saneada.
- [ ] Una imagen de más de 5 MB es rechazada.
- [ ] Una operación de más de cuatro imágenes es rechazada.
- [ ] Un body de Server Action superior a 22 MB es rechazado.
- [ ] Alergias y notas no reciben límites de campo nuevos fuera del límite HTTP global.
- [ ] Docker Desktop valida el stack Supabase local antes de cualquier dry-run remoto.
- [ ] Playwright verifica CSP, cabeceras, IP saneada y límites.
- [ ] `npx eslint src`, `npx tsc --noEmit --incremental false` y `npm run build` terminan correctamente.

## Decisions

- **Sí:** nonce por petición. Es una CSP estricta madura y evita habilitar scripts inline arbitrarios.
- **No:** SRI como mecanismo principal. La integración de Next.js es experimental.
- **No:** Report-Only como resultado final. No bloquea ataques.
- **Sí:** `ipAddress()` de Vercel. Evita aceptar directamente datos controlables por el cliente.
- **Sí:** 5 MB por imagen, 4 imágenes y 22 MB globales. Incluye margen para overhead HTTP.

## Risks

| Risk                                     | Mitigation                                                           |
| ---------------------------------------- | -------------------------------------------------------------------- |
| El nonce fuerza renderizado dinámico     | Documentarlo y verificar el coste en build y navegador.              |
| Una IP compartida puede agrupar usuarios | El límite por IP se combina con el límite por cuenta de SPEC 37.     |
| Un proxy futuro cambia la fuente de IP   | Sustituir solo el adaptador de Vercel y conservar el header interno. |

## What is **not** in this spec

- URLs temporales o permanentes de Cloudinary.
- Rate limiting persistente.
- Cambios de roles, grants o RLS de PostgreSQL.

**Siguiente paso tras aprobación:** `/spec-impl 36-nextjs-http-security-boundary`

---

Plan de implementación

4. Configurar serverActions.bodySizeLimit a 22mb y validar imágenes.
5. Verificar que las rutas con nonce no se publiquen como estáticas.
6. Añadir pruebas Playwright de headers, cargas y navegación.
7. Ejecutar lint, typecheck y build; documentar variables y configuración sin secretos.
