# SPEC 18 - Baseline de Family, invitaciones y Auth

Fecha de captura: 2026-10-01

## Rutas actuales

| Ruta | Entrada actual | Comportamiento observado en codigo |
| --- | --- | --- |
| `/auth/login` | `app/auth/login/page.tsx` | Pagina publica de login con formulario de credenciales y estado opcional `activated=1`. |
| `/auth/link-parent` | `app/auth/link-parent/page.tsx` | Requiere sesion de staff, recibe `kidId` por query string y muestra el formulario de invitacion; debe eliminarse. |
| `/auth/activate-account` | `app/auth/activate-account/page.tsx` | Resuelve `code` desde query string, proyecta el estado de la invitacion y muestra el formulario de activacion. |
| `/login` | `next.config.ts` | Redirect permanente a `/auth/login`; debe eliminarse y responder 404. |
| `/activate-account` | `next.config.ts` | Redirect permanente a `/auth/activate-account`; debera conservar compatibilidad solo cuando exista `code`. |
| Perfil de Kid | `app/(staff)/kids/[slug]/page.tsx` | Muestra padres vinculados y el enlace actual hacia `/auth/link-parent?kidId=...`. |
| Email de invitacion | `app/features/auth/actions/send-parent-invitation.ts` | Genera `/auth/activate-account?code=...`, envia el correo y redirige al perfil con `invitation=sent`. |

## Entradas actuales

| Entrada | Responsabilidad actual |
| --- | --- |
| `app/features/auth/types/` | Define `Invitation`, `Credential`, activacion y contratos del formulario de vinculacion. |
| `app/features/auth/services/invitation.service.ts` | Lee invitaciones, crea pendientes con `randomUUID`, codigo aleatorio y expiracion, y marca `sentAt`. |
| `app/features/auth/services/credential.service.ts` | Lee credenciales desde `credential.json`. |
| `app/features/auth/services/link-parent.service.ts` | Resuelve un Kid por ID para la pantalla de invitacion. |
| `app/features/auth/actions/send-parent-invitation.ts` | Autoriza staff, valida formulario, crea persona/invitacion, envia email y marca la invitacion como enviada. |
| `app/features/auth/actions/activate-account.ts` | Valida codigo, email, expiracion y password; coordina credencial, persona, ParentKid e invitacion dentro de `withJsonTransaction`. |
| `app/features/family/types/parent-kid.ts` | Define `ParentRelationship` y `ParentKid`. |
| `app/infrastructure/adapters/jmlq/mailer/parent-invitation-email.ts` | Adapta el mailer concreto y prepara el contenido del email de invitacion. |
| `auth.ts` | Configura NextAuth Credentials, bcrypt, sesiones, cookies y autorizacion de staff. |
| `app/api/auth/[...nextauth]/route.ts` | Construye el handler HTTP concreto de NextAuth desde `authOptions`. |

## Estados de invitacion

- Pendiente: `acceptedAt === null` y `expiresAt` posterior al instante actual.
- Enviada: `sentAt` contiene el instante en que el proveedor acepto el mensaje.
- Vencida: `isInvitationExpired` detecta expiracion o fecha invalida.
- Aceptada: `acceptedAt` contiene el instante de activacion.
- Desconocida: el codigo no existe o no puede resolver persona, Kid o room relacionados.
- La pagina actual tambien proyecta `none`, `unknown`, `expired`, `accepted` y `valid` para la interfaz de activacion.

## Flujo de invitacion actual

1. Staff abre `/auth/link-parent?kidId=<id>` desde el perfil del Kid.
2. La accion valida nombre, email y relacion, y verifica que el Kid exista.
3. Se crea una persona pendiente, una invitacion pendiente y sus referencias persistidas.
4. Se genera un codigo corto y una expiracion fija.
5. Se envia un email con `/auth/activate-account?code=<token>`.
6. Si el envio funciona, se actualiza `sentAt` y se vuelve al perfil del Kid.
7. La persona abre el enlace, valida el codigo y completa email/password cuando corresponde.
8. Una transaccion escribe `credential.json`, activa `people.json`, crea `parent-kids.json` y marca `acceptedAt`.
9. La aplicacion redirige a `/auth/login`.

## Comportamiento de persistencia

- Las colecciones usadas son `people.json`, `credential.json`, `invitation.json` y `parent-kids.json`.
- La creacion de invitacion usa `withWriteLock` y `writeCollection`.
- La activacion usa `withJsonTransaction` sobre las cuatro colecciones.
- Las credenciales nuevas se generan con `bcrypt.hash(password, 12)`.
- La autenticacion compara credenciales con `bcrypt.compare` y solo permite personas activas.
- No se deben cambiar los registros persistidos como parte de esta spec.

## Consumidores que deben migrarse

- `app/auth/link-parent/` y sus componentes, schemas, actions y servicios.
- `app/auth/activate-account/` y el formulario de activacion.
- `app/auth/login/` y el formulario de login.
- `app/(staff)/kids/[slug]/page.tsx` y `app/(staff)/kids/[slug]/_components/kid-parents.tsx`.
- `app/features/auth/` completo.
- `app/features/family/types/` y los consumidores de `ParentKid`.
- `app/infrastructure/adapters/jmlq/mailer/`.
- `auth.ts` y `app/api/auth/[...nextauth]/route.ts`.
- `next.config.ts` y cualquier referencia a `/login`, `/activate-account` o `/auth/link-parent`.

## Contratos actuales

- `Invitation`: `id`, `personId`, `kidId`, `relationship`, `code`, `expiresAt`, `sentAt`, `acceptedAt`.
- `Credential`: `id`, `personId`, `passwordHash`.
- `ParentKid`: `id`, `parentId`, `kidId`, `relationship`, `photoSharingConsent`.
- `InvitationMailer`: pendiente de extraer como port; el adapter actual retorna `messageId`.
- `PasswordHasher`: pendiente de extraer como port; el codigo actual usa bcrypt directamente.
