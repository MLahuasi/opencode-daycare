# SPEC 18 — Invitaciones Family y capas de Auth

> **Status:** Draft
> **Depends on:** SPEC 09, SPEC 10, SPEC 11, SPEC 17
> **Date:** 2026-09-30
> **Objective:** Separar la relación Parent/Tutor-Kid en Family y las credenciales en Auth, con rutas públicas y de personal definitivas para invitaciones.

## Scope

**In:**

- Crear `src/domain/auth/` y `src/domain/family/`.
- Crear `src/application/auth/` y `src/application/family/`.
- Mantener la relación Parent/Tutor-Kid bajo Family.
- Mantener creación, activación y validación de credenciales bajo Auth.
- Crear ports `InvitationMailer` y `PasswordHasher` donde los casos de uso los necesiten.
- Implementar adapters concretos bajo `src/infrastructure/adapters/mailer/` y `src/infrastructure/adapters/password/`.
- Mover NextAuth concreto a `src/infrastructure/auth/`.
- Crear composición server-only para Auth y Family.
- Crear `/kids/[slug]/invite-parent` bajo `(staff)`.
- Crear `/auth/parent-invitation` como página pública informativa.
- Crear `/auth/parent-invitation/[token]` como aceptación pública por token de URL.
- Generar nuevos enlaces de email hacia `/auth/parent-invitation/[token]`.
- Conservar redirects externos con token desde `/auth/activate-account?code=<token>` y `/activate-account?code=<token>`.
- Hacer que las URLs legacy de activación sin `code` respondan 404.
- Eliminar `/auth/link-parent` y `/login` sin aliases.

**Out of scope (for future specs):**

- Cerrar la prueba SMTP pendiente de SPEC 10.
- Cambiar el proveedor de persistencia.
- Añadir recuperación de contraseña, OAuth, rate limiting o administración de invitaciones.
- Cambiar los registros persistidos o las reglas de aceptación.

## Data model

No se modifican campos ni valores persistidos.

Ownership:

```text
src/domain/auth/
  credential.ts
src/domain/family/
  invitation.ts
  parent-kid.ts
  parent-relationship.ts
```

Los ports principales son:

```ts
interface InvitationMailer { send(input: InvitationEmailInput): Promise<{ messageId: string }> }
interface PasswordHasher { hash(password: string): Promise<string>; compare(password: string, hash: string): Promise<boolean> }
```

## Implementation plan

1. Registrar URLs de email existentes, estados de invitación y transacciones de activación.
2. Crear entidades y reglas puras de Auth y Family sin imports de framework ni Infrastructure.
3. Crear casos de uso para crear invitación, validar token, aceptar invitación y activar credenciales.
4. Definir ports de mailer, hash de contraseñas y persistencia según las necesidades de esos casos de uso.
5. Implementar adapters y composición server-only, incluyendo NextAuth concreto.
6. Crear la página protegida `/kids/[slug]/invite-parent` y su `_actions`, resolviendo internamente el ID persistido del niño.
7. Crear la página informativa y la página pública de aceptación por token, sin permitir introducir manualmente el token.
8. Actualizar el mailer y los destinos de activación sin cambiar el contenido funcional del email.
9. Configurar redirects legacy condicionales solo cuando exista `code`; los accesos sin `code` deben responder 404.
10. Eliminar las rutas `/auth/link-parent` y `/login`, actualizar imports y verificar todos los flujos.
11. Ejecutar checks completos y pruebas Playwright de invitación, aceptación, sesión y permisos.

## Acceptance criteria

- [ ] La invitación iniciada desde un perfil de niño vive bajo `(staff)` en `/kids/[slug]/invite-parent`.
- [ ] El caso de uso de invitación pertenece a `application/family`.
- [ ] La relación Parent/Tutor-Kid pertenece a `domain/family`.
- [ ] Las credenciales y sus reglas pertenecen a `domain/auth` o `application/auth`.
- [ ] Domain no importa Next.js, React, NextAuth, bcrypt, filesystem ni mailer.
- [ ] Application no importa adapters concretos ni APIs HTTP o de navegación.
- [ ] Existe `InvitationMailer` y su implementación concreta está en Infrastructure.
- [ ] Existe `PasswordHasher` y su implementación concreta usa bcrypt desde Infrastructure.
- [ ] Las páginas no construyen repositorios, mailers ni hashers directamente.
- [ ] `/auth/parent-invitation` explica que debe usarse el enlace recibido por email.
- [ ] `/auth/parent-invitation/[token]` valida el token desde la URL y permite completar la vinculación.
- [ ] Un token no válido, vencido o aceptado no revela datos de la invitación.
- [ ] La aceptación crea o activa credenciales y crea `ParentKid` de forma coordinada.
- [ ] El inicio de una invitación no crea `ParentKid`.
- [ ] Los emails nuevos usan exclusivamente `/auth/parent-invitation/[token]`.
- [ ] `/auth/activate-account?code=<token>` redirige al token correspondiente.
- [ ] `/activate-account?code=<token>` redirige al token correspondiente.
- [ ] Las URLs legacy de activación sin `code` responden 404.
- [ ] `/auth/link-parent` y `/login` responden 404.
- [ ] Los JSON permanecen sin cambios.
- [ ] `npx eslint app src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] Playwright verifica inicio staff, token válido, token inválido, aceptación, login y permisos.

## Decisions

- **Sí:** ownership de Parent/Tutor-Kid en Family aunque el flujo cree credenciales.
- **Sí:** token exclusivamente en la URL del enlace recibido.
- **No:** permitir códigos manuales en la página informativa.
- **Sí:** conservar compatibilidad solo para emails externos ya enviados.
- **No:** mantener aliases internos para `/auth/link-parent` o `/login`.
- **Sí:** conservar `redirect`, `revalidatePath`, cookies y APIs del framework en adapters de entrada cuando corresponda.
- **No:** cerrar en esta spec las verificaciones reales pendientes de SMTP.

## Risks

| Risk | Mitigation |
| --- | --- |
| Un redirect legacy transforma incorrectamente el token. | Validar query `code` y verificar ambos formatos con Playwright. |
| Auth y Family crean dependencias circulares. | Auth expone credenciales; Family expone invitaciones y relaciones; la composición coordina ambos. |
| El token queda expuesto a una página no autorizada. | Resolver y validar el token en servidor antes de proyectar datos. |

## What is **not** in this spec

- Prueba SMTP real pendiente.
- Recuperación de contraseña, OAuth, rate limiting o revocación.
- Cambio de persistencia o de datos.
