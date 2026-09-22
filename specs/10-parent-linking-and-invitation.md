# SPEC 10 — Vinculación de padres e invitaciones

> **Status:** Implement
> **Depends on:** SPEC 07, SPEC 09
> **Date:** 2026-09-22
> **Objective:** Implementar `/auth/link-parent` para crear invitaciones seguras a padres y enviarlas mediante el mailer existente desde un perfil de niño.

## Scope

**In:**

- Crear `/auth/link-parent?kidId=<id>` basada en `references/screens/vincular-padre.dc.html`.
- Conectar “Vincular otro padre” desde `kids/[slug]`.
- Cargar el niño mediante `kidId` y resolver su información relacionada.
- Recibir nombre, email y parentesco.
- Generar el código en servidor al enviar.
- Crear códigos criptográficamente aleatorios de ocho caracteres.
- Usar mayúsculas y dígitos sin caracteres ambiguos.
- Definir un vencimiento fijo de siete días mediante una utilidad reutilizable server-only.
- Persistir `Person` pendiente e `Invitation` sin crear todavía `ParentKid`.
- Invocar `sendParentInvitationEmail` desde SPEC 07.
- Construir el enlace con `APP_URL`.
- Conservar invitaciones cuando el SMTP falle para permitir reintentos.
- Reusar un código vigente cuyo envío no haya sido confirmado.
- Rotar código y vencimiento cuando el reintento encuentre una invitación vencida.
- Mostrar confirmación en el perfil con `?invitation=sent`.
- Proteger la ruta para el rol `personal` mediante SPEC 09.

**Out of scope (for future specs):**

- Activación de cuenta y creación de credenciales.
- Creación de `ParentKid`.
- Vincular emails ya existentes.
- Reenvíos masivos, colas o tracking de entrega.
- Rate limiting.
- Revocación manual de invitaciones.
- Base de datos o API pública.

## Data model

```ts
type Invitation = {
  id: string;
  personId: string;
  kidId: string;
  relationship: ParentRelationship;
  code: string;
  expiresAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
};
```

La utilidad pública server-only tendrá un contrato equivalente a:

```ts
function createInvitationCode(existingCodes: readonly string[]): string;

function getInvitationExpiration(now: Date): string;
```

El código se normaliza con `trim().toUpperCase()` al resolverlo. La unicidad se comprueba contra todas las invitaciones, incluidas vencidas y aceptadas.

## Implementation plan

1. Crear el servicio server-only que carga el niño por ID y proyecta los datos necesarios para la pantalla.
2. Crear la utilidad de generación de código y vencimiento con constantes explícitas y sin depender de datos cliente.
3. Crear el schema de formulario para nombre completo, email y parentesco.
4. Crear la página y el formulario responsive siguiendo la plantilla visual de vinculación.
5. Reemplazar el botón inerte del perfil por un enlace a `/auth/link-parent?kidId=<id>`.
6. Crear la Server Action de envío y validar nuevamente todos los campos en servidor.
7. Rechazar emails existentes en `people.json`, incluyendo padres activos, pendientes, inactivos y personal.
8. Crear `Person` con rol `parent` y estado `pending`.
9. Crear `Invitation` con `kidId`, parentesco, código, vencimiento y `sentAt: null`.
10. Persistir los registros bajo el lock JSON antes de invocar el mailer.
11. Construir el enlace absoluto con `APP_URL` y llamar a `sendParentInvitationEmail`.
12. Actualizar `sentAt` solo después de un envío exitoso.
13. Conservar los registros y mostrar error recuperable cuando SMTP falle.
14. Reusar la invitación pendiente y su código mientras siga vigente; rotar código y vencimiento si expiró.
15. Redirigir al perfil con `invitation=sent` y mostrar un banner accesible sin exponer el código.
16. Verificar el envío con SMTP de prueba y conservar las credenciales fuera del repositorio.

## Acceptance criteria

- [x] Existe `/auth/link-parent?kidId=<id>`.
- [x] Un `kidId` inexistente produce una respuesta 404 o estado equivalente.
- [x] La pantalla muestra el nombre del niño cargado desde persistencia.
- [x] El formulario contiene nombre, email y parentesco.
- [x] Los tres campos son obligatorios.
- [x] El nombre exige entre dos y 120 caracteres y al menos dos palabras.
- [x] El email se recorta y normaliza en minúsculas.
- [x] El parentesco no aparece preseleccionado.
- [x] El código no se recibe como input confiable del cliente.
- [x] El código se genera en servidor al enviar.
- [x] El código tiene ocho caracteres.
- [x] El código usa únicamente el alfabeto acordado sin caracteres ambiguos.
- [x] La utilidad nunca devuelve un código presente en cualquier invitación existente.
- [x] La utilidad calcula un vencimiento de siete días.
- [x] El vencimiento se persiste como ISO string.
- [x] Se crea una persona `parent` con estado `pending`.
- [x] Se crea una invitación con `personId`, `kidId` y `relationship`.
- [x] No se crea `ParentKid` al enviar la invitación.
- [x] Un email existente se rechaza con un error visible y accesible.
- [x] El enlace de activación usa `APP_URL` y conserva el código generado.
- [x] El mailer recibe nombre del padre, niño, enlace y vencimiento correctos.
- [x] Un envío exitoso persiste `sentAt`.
- [x] Un fallo SMTP conserva la persona y la invitación pendientes.
- [x] Un reintento vigente reutiliza el código existente.
- [x] Un reintento de una invitación vencida rota código y vencimiento.
- [x] La URL de retorno contiene `?invitation=sent`.
- [x] El perfil muestra confirmación cuando `invitation=sent`.
- [x] La confirmación no muestra credenciales ni datos SMTP.
- [x] “Vincular otro padre” navega con el ID correcto del niño.
- [x] La ruta exige rol `personal` y un padre es redirigido a `/home`.
- [ ] El envío SMTP de prueba devuelve un `messageId` no vacío.
- [x] `npx eslint app` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] `git diff --check` termina correctamente.

## Decisions

- **Sí:** generar el código al enviar para impedir manipulación desde el cliente.
- **Sí:** usar una utilidad reutilizable server-only para código y vencimiento.
- **Sí:** usar ocho caracteres y siete días.
- **No:** replicar el código de cinco caracteres de la plantilla porque ofrece menor espacio de búsqueda.
- **Sí:** usar `APP_URL` para construir enlaces absolutos reproducibles.
- **No:** derivar el origen de cabeceras de petición no confiables.
- **Sí:** rechazar emails existentes en esta primera entrega.
- **Sí:** conservar registros cuando SMTP falla para permitir reintento.
- **No:** crear una nueva invitación por cada reintento vigente.
- **Sí:** crear la relación familiar al activar, no al enviar.
- **No:** usar la pantalla de vinculación para alterar personas existentes.

## Risks

| Risk                                        | Mitigation                                                     |
| ------------------------------------------- | -------------------------------------------------------------- |
| Fallo SMTP después de persistir registros.  | Conservar estado pendiente y permitir reintento.               |
| Colisiones de códigos.                      | Usar aleatoriedad criptográfica y comprobar toda la colección. |
| Enlace de activación con origen incorrecto. | Validar `APP_URL` y aceptar solo HTTP/HTTPS.                   |
| Envíos duplicados.                          | Reusar invitaciones pendientes vigentes.                       |

## What is **not** in this spec

- Activar cuentas.
- Crear credenciales o sesiones.
- Crear `ParentKid`.
- Reutilizar personas existentes.
- Feed familiar.
- Colas, rate limiting o tracking SMTP.
