# SPEC 07 — Correo de invitación para padres

> **Status:** Implement
> **Depends on:** None
> **Date:** 2026-09-18
> **Objective:** Integrar `@jmlq/mailer` mediante una capa server-only y una plantilla con branding de OpenDayCare para preparar el envío seguro de invitaciones de activación a padres vinculados con un niño.

## Why this spec exists

OpenDayCare todavía no tiene una capa de infraestructura para servicios externos. Esta integración establece el primer adapter bajo `app/infrastructure/` sin acoplar el futuro flujo de vinculación de Kids a SMTP, Nodemailer o al sistema de plantillas.

La implementación de referencia recrea varias responsabilidades que el paquete publicado ya expone. OpenDayCare usará directamente `createMailer`, `NodemailerService` y `FileEmailTemplate` para mantener una integración pequeña y evitar duplicar renderer, tipos y transporte.

## Scope

**In:**

- Instalar `@jmlq/mailer` desde npm usando el rango guardado por npm para la versión publicada `0.0.1-beta.1`.
- Instalar `nodemailer` como dependencia directa usando el rango `^7.0.6` requerido por `@jmlq/mailer`, sin importarlo directamente en la aplicación.
- Instalar `env-var` con el rango `^7.5.0` para centralizar la lectura y validación tipada del entorno.
- Conservar `package-lock.json` como resolución canónica de la dependencia instalada.
- Crear la capa `app/infrastructure/adapters/jmlq/mailer/`.
- Marcar la integración como server-only para impedir su inclusión en Client Components.
- Configurar el transporte SMTP con `NodemailerService` de `@jmlq/mailer`.
- Configurar el renderer de archivos con `FileEmailTemplate` de `@jmlq/mailer`.
- Componer ambos mediante `createMailer` de `@jmlq/mailer`.
- Crear una instancia singleton de inicialización diferida.
- Validar la configuración solamente cuando se solicite el primer envío.
- Crear una configuración server-only compartida y extensible mediante `getEnvironment()`, organizada por secciones tipadas.
- Mantener la carga de archivos `.env*` a cargo de Next.js, sin instalar ni inicializar `dotenv`.
- Permitir que lint, typecheck y build terminen sin credenciales SMTP reales.
- Producir un error explícito al intentar enviar con configuración ausente o inválida.
- Crear y versionar `.env.template` con únicamente las variables utilizadas por esta integración.
- Añadir una excepción en `.gitignore` para permitir el versionado de `.env.template` sin dejar de ignorar los demás archivos `.env*`.
- Configurar `MAILER_EMAIL`, `MAILER_SECRET_KEY`, `MAILER_FROM`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_TEMPLATE_PATH` y `MAIL_TEMPLATE_EXTENSION`.
- Usar `templates` como valor de ejemplo para `MAIL_TEMPLATE_PATH`.
- Usar `html` como valor de ejemplo para `MAIL_TEMPLATE_EXTENSION`.
- Resolver la ruta de plantillas desde el directorio de trabajo del proyecto dentro de la configuración compartida.
- Crear `templates/parent-invitation.html`.
- Diseñar la plantilla con el branding coral, crema, tipografía redondeada y marca solar de OpenDayCare.
- Mantener la plantilla autocontenida y compatible con clientes de correo mediante estructura y estilos propios de email HTML.
- Permitir colores literales y estilos inline únicamente dentro de la plantilla de correo como excepción documentada a los estilos del runtime web.
- Incluir en la plantilla el nombre del padre, el nombre del niño, el enlace de activación y la fecha de vencimiento.
- Mostrar el CTA `Activar mi cuenta`.
- Mostrar el enlace completo como alternativa cuando el botón no funcione.
- Exponer `sendParentInvitationEmail` como función pública desde `@/app/infrastructure`.
- Recibir el email del destinatario, nombre del padre, nombre del niño, enlace de activación y vencimiento mediante un input tipado.
- Usar el asunto fijo `Activa tu acceso a OpenDayCare` para no exponer el nombre del niño en la bandeja de entrada.
- Aceptar únicamente enlaces absolutos con protocolo HTTP o HTTPS.
- Formatear el vencimiento como fecha UTC legible mediante `APP_LOCALE`.
- Escapar los datos dinámicos antes de interpolarlos en HTML.
- Incluir una versión de texto plano con la misma información esencial y el enlace sin escapar.
- Devolver el `messageId` producido por `@jmlq/mailer`.
- Propagar los errores de validación, configuración, lectura de plantilla y SMTP al futuro flujo llamador.
- Crear barrels desde el adapter hasta `app/infrastructure/index.ts`.
- Documentar en `README.md` la configuración mínima y la naturaleza server-only de la integración.
- Actualizar el diagrama de arquitectura feature-first de `README.md` con `app/infrastructure`, `@jmlq/mailer`, `templates/` y SMTP.
- Representar la futura invocación desde el flujo de vinculación de Kids como integración no implementada.
- Verificar el renderizado local con datos controlados sin exigir un envío SMTP real.

**Out of scope (for future specs):**

- Implementar la pantalla o formulario para vincular padres con niños.
- Hacer funcional el control `Vincular otro padre` del perfil de Kids.
- Crear o persistir una nueva `Person`.
- Crear o persistir una nueva relación `ParentKid`.
- Generar o persistir una `Invitation`.
- Generar el código o enlace de activación.
- Invocar `sendParentInvitationEmail` desde Kids, Auth, una Server Action o una Route Handler.
- Modificar `/activate-account` o su comportamiento actual.
- Definir la transacción entre persistencia de la relación y entrega del correo.
- Reintentos, colas, idempotencia o recuperación ante fallos de entrega.
- Envío obligatorio a un buzón SMTP real durante la aceptación.
- Credenciales SMTP reales dentro del repositorio.
- Drivers alternativos a Nodemailer.
- Configuración mediante `MAIL_DRIVER` o `MAILER_SERVICE`.
- Envíos batch, adjuntos, límites de adjuntos o alertas internas.
- Tracking de apertura, clics, rebotes o entregas.
- Editor o preview web de plantillas.
- Instalación de un framework de testing.
- Revisión general de las secciones desactualizadas de `README.md` que no estén relacionadas con el mailer o su diagrama feature-first.

## Data model

Esta feature no introduce persistencia ni modifica los modelos `Person`, `ParentKid`, `Kid` o `Invitation`. Añade únicamente el contrato de entrada y salida del correo de invitación.

Los tipos públicos vivirán junto a `sendParentInvitationEmail` y se exportarán desde `@/app/infrastructure`:

```ts
type ParentInvitationEmailInput = {
  recipientEmail: string;
  parentName: string;
  kidName: string;
  activationLink: string;
  expiresAt: Date;
};

type ParentInvitationEmailResult = {
  messageId: string;
};
```

La API pública será equivalente a:

```ts
function sendParentInvitationEmail(
  input: ParentInvitationEmailInput,
): Promise<ParentInvitationEmailResult>;
```

La plantilla `parent-invitation` recibirá exactamente estas variables:

```ts
type ParentInvitationTemplateData = {
  parentName: string;
  kidName: string;
  activationLink: string;
  expiresAt: string;
};
```

`expiresAt` se generará con `Intl.DateTimeFormat` usando `APP_LOCALE`, `dateStyle: "long"` y `timeZone: "UTC"`. No incluirá hora.

`activationLink` se normalizará mediante `URL` antes de construir el cuerpo. El valor normalizado sin escaping se usará en el texto plano y su equivalente escapado se usará en el HTML.

La sección de `.env.template` será:

```dotenv
# ============================================================
# SETTINGS @jmlq/mailer
# ============================================================

MAILER_EMAIL=example@gmail.com
MAILER_SECRET_KEY=app_password_here
MAILER_FROM=example@gmail.com

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false

MAIL_TEMPLATE_PATH=templates
MAIL_TEMPLATE_EXTENSION=html
```

`MAIL_PORT` deberá ser un entero positivo. `MAIL_SECURE` solo aceptará `true` o `false`. Los demás valores no podrán estar vacíos cuando se intente enviar.

## Implementation plan

1. Instalar `@jmlq/mailer`, `nodemailer` y `env-var` con npm, y actualizar `package.json` y `package-lock.json` con los rangos `^0.0.1-beta.1`, `^7.0.6` y `^7.5.0`, respectivamente.
2. Añadir `!.env.template` a `.gitignore` sin permitir el versionado de otros archivos `.env*`.
3. Crear `.env.template` con la sección `SETTINGS @jmlq/mailer` y las ocho variables acordadas, sin incluir secretos reales.
4. Crear los directorios y barrels de `app/infrastructure/adapters/jmlq/mailer/` hasta `app/infrastructure/index.ts`.
5. Crear `getEnvironment()` bajo `app/shared/config/server/` para la lectura server-only, compartida, extensible y diferida mediante `env-var`; resolver allí la ruta de plantillas desde `process.cwd()`.
6. Crear `mailer.singleton.ts` para consumir directamente `getEnvironment().mailer` y construir una única instancia mediante `NodemailerService`, `FileEmailTemplate` y `createMailer` sin importar Nodemailer directamente ni duplicar el renderer.
7. Crear `parent-invitation-email.ts` con los tipos públicos, validación de URL HTTP/HTTPS, validación de fecha, escaping de HTML y formato UTC con `APP_LOCALE`.
8. Implementar `sendParentInvitationEmail` con el asunto acordado, `templateId: "parent-invitation"`, los cuatro datos de plantilla, texto plano y retorno del `messageId`.
9. Crear `templates/parent-invitation.html` con estructura compatible con email, estilos autocontenidos, branding de OpenDayCare, CTA y enlace alternativo.
10. Exportar únicamente el contrato necesario para futuros consumidores desde `@/app/infrastructure`, manteniendo configuración y singleton como detalles internos del adapter.
11. Actualizar `README.md` con las variables requeridas, la arquitectura server-only y la aclaración de que las credenciales reales no se versionan.
12. Actualizar el diagrama feature-first de `README.md` para mostrar Infrastructure, paquete, templates y SMTP, además de una relación futura y explícitamente no implementada desde Kids.
13. Renderizar `parent-invitation` mediante `FileEmailTemplate` con datos controlados y comprobar que el resultado contiene branding, padre, niño, fecha, CTA y enlace sin placeholders pendientes.
14. Verificar mediante una llamada controlada que la configuración ausente o inválida produce un error antes de contactar SMTP y no durante import, lint, typecheck o build.
15. Revisar límites arquitectónicos, secretos, imports públicos, JSDoc, escaping, colores literales y ausencia de integración funcional con Kids o Auth.
16. Ejecutar `npx eslint app`, `npx tsc --noEmit --incremental false`, `npm run build` y `git diff --check`.

## Acceptance criteria

- [x] La spec se implementa únicamente después de pasar a estado `Approved`.
- [x] `package.json` declara `@jmlq/mailer` con el rango de npm correspondiente a `0.0.1-beta.1`.
- [x] `package.json` declara `nodemailer` como dependencia directa con el rango `^7.0.6`.
- [x] `package.json` declara `env-var` con el rango `^7.5.0`.
- [x] `package-lock.json` fija la versión resuelta de `@jmlq/mailer`.
- [x] `package-lock.json` fija la versión resuelta de `nodemailer`.
- [x] La aplicación usa `createMailer`, `NodemailerService` y `FileEmailTemplate` desde el export público de `@jmlq/mailer`.
- [x] La aplicación no importa Nodemailer directamente.
- [x] La aplicación no duplica el renderer de archivos de la implementación de referencia.
- [x] Existe `app/infrastructure/adapters/jmlq/mailer/`.
- [x] Existe una API pública en `app/infrastructure/index.ts`.
- [x] Los futuros consumidores pueden importar `sendParentInvitationEmail` desde `@/app/infrastructure`.
- [x] La configuración, el singleton y la función de envío están marcados como server-only.
- [x] Ningún Client Component importa la capa Infrastructure.
- [x] `.gitignore` continúa ignorando `.env*` y permite únicamente `.env.template`.
- [x] `.env.template` no contiene credenciales reales.
- [x] `.env.template` contiene exactamente las ocho variables de mailer acordadas.
- [x] `.env.template` no añade driver, service, límites de adjuntos ni alertas.
- [x] `MAIL_TEMPLATE_PATH` usa `templates` como valor de ejemplo.
- [x] `MAIL_TEMPLATE_EXTENSION` usa `html` como valor de ejemplo.
- [x] La ruta de plantillas se resuelve desde `process.cwd()`.
- [x] La configuración se lee y valida al solicitar el primer envío, no al importar el módulo.
- [x] `getEnvironment()` vive en `app/shared/config/server/`, está marcado como server-only y permite añadir futuras secciones tipadas.
- [x] El adapter consume directamente `getEnvironment().mailer` sin una capa adicional de configuración específica.
- [x] La configuración validada se reutiliza y una validación fallida no guarda estado parcial.
- [x] La aplicación no instala ni inicializa `dotenv`; Next.js conserva la responsabilidad de cargar `.env*`.
- [x] Lint, typecheck y build pueden ejecutarse sin secretos SMTP configurados.
- [x] Un intento de envío sin una variable requerida produce un error que identifica la configuración inválida.
- [x] `MAIL_PORT` rechaza valores vacíos, no numéricos, fraccionarios, cero o negativos.
- [x] `MAIL_SECURE` rechaza valores diferentes de `true` y `false`.
- [x] El mailer se construye una sola vez por proceso después de una configuración válida.
- [x] Existe `templates/parent-invitation.html`.
- [x] El ID lógico usado para renderizar la plantilla es `parent-invitation`.
- [x] La plantilla contiene `{{parentName}}`, `{{kidName}}`, `{{activationLink}}` y `{{expiresAt}}`.
- [x] La plantilla presenta el nombre OpenDayCare y una identidad visual coherente con el coral, crema y marca solar del runtime.
- [x] La plantilla funciona sin depender de `app/globals.css`, Tailwind, CSS Modules, JavaScript o assets remotos.
- [x] Los colores literales y estilos inline del correo están limitados a `templates/parent-invitation.html` y constan como excepción documentada.
- [x] La plantilla tiene un ancho legible en escritorio y se adapta a pantallas móviles.
- [x] El CTA visible dice `Activar mi cuenta`.
- [x] El enlace de activación aparece también como texto seleccionable y copiable.
- [x] `ParentInvitationEmailInput` contiene exactamente `recipientEmail`, `parentName`, `kidName`, `activationLink` y `expiresAt`.
- [x] `sendParentInvitationEmail` usa el asunto `Activa tu acceso a OpenDayCare`.
- [x] El asunto no contiene el nombre del padre ni del niño.
- [x] `sendParentInvitationEmail` rechaza enlaces relativos.
- [x] `sendParentInvitationEmail` rechaza protocolos distintos de HTTP y HTTPS.
- [x] `sendParentInvitationEmail` rechaza una fecha de vencimiento inválida.
- [x] La fecha de vencimiento se renderiza como fecha larga en `es-EC` y UTC, sin hora.
- [x] El nombre del padre, el nombre del niño, el enlace y la fecha se escapan antes de insertarse en HTML.
- [x] El cuerpo de texto plano conserva el enlace HTTP/HTTPS normalizado sin entidades HTML.
- [x] El email contiene un cuerpo HTML renderizado y una alternativa de texto plano.
- [x] Un envío exitoso devuelve un objeto con `messageId` no vacío.
- [x] Los errores de configuración, plantilla y SMTP no se convierten en resultados exitosos ni se omiten silenciosamente.
- [x] El secreto SMTP no aparece en HTML, texto plano, mensajes de error controlados, logs ni módulos cliente.
- [x] Un render con datos controlados no conserva secuencias `{{...}}` pendientes.
- [x] El render controlado contiene el padre, niño, fecha, CTA y enlace suministrados.
- [x] `README.md` documenta la configuración mínima del mailer y su límite server-only.
- [x] El diagrama feature-first de `README.md` incluye `app/infrastructure`, `@jmlq/mailer`, `templates/` y SMTP.
- [x] La relación desde Kids hacia `sendParentInvitationEmail` aparece etiquetada como integración futura o no implementada.
- [x] El diagrama no afirma que el flujo de vinculación ya envía correos.
- [x] No se modifica la persistencia de `Person`, `ParentKid`, `Kid` o `Invitation`.
- [x] No se implementa UI, Server Action, Route Handler ni servicio de Kids que invoque el mailer.
- [x] No se requiere un envío SMTP real para aprobar esta spec.
- [x] No se instala un framework de testing.
- [x] No se introducen colores literales nuevos fuera de `app/globals.css` y la excepción `templates/parent-invitation.html`.
- [x] Las APIs exportadas incluyen JSDoc con descripción, parámetros y retorno.
- [x] `npx eslint app` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] `git diff --check` termina correctamente.

## Decisions

- **Sí:** usar la API publicada de `@jmlq/mailer` porque ya ofrece composición, transporte Nodemailer y renderer de archivos.
- **No:** copiar literalmente `mailer.adapter.ts`, `mailer.file-template.renderer.ts` y los tipos de la referencia porque duplicaría responsabilidades del paquete instalado.
- **Sí:** instalar el rango que npm genera para `0.0.1-beta.1` porque se decidió permitir actualizaciones compatibles.
- **Sí:** declarar `nodemailer` con el rango directo `^7.0.6` requerido por el paquete para hacer explícita la dependencia de runtime, sin consumir su API directamente.
- **Sí:** usar `env-var` desde una función compartida y diferida para centralizar configuración tipada sin impedir builds que no realizan envíos.
- **No:** crear un wrapper `getMailerConfig()` porque `getEnvironment().mailer` ya ofrece el contrato validado que necesita el adapter.
- **No:** usar `dotenv` porque Next.js ya carga los archivos `.env*` y una segunda carga sería redundante.
- **Sí:** conservar `package-lock.json` para que las instalaciones reproducibles usen la resolución validada.
- **Sí:** ubicar la integración en `app/infrastructure/adapters/jmlq/mailer/` para mantener todo el runtime bajo `app/` y respetar nombres de directorio en minúsculas.
- **No:** crear `Infrastructure/` con mayúscula en la raíz.
- **Sí:** exponer una función específica `sendParentInvitationEmail` para que el futuro flujo no conozca IDs de plantilla ni detalles SMTP.
- **No:** exponer el mailer genérico como API principal de la aplicación.
- **Sí:** mantener el singleton y la configuración como detalles internos del adapter.
- **Sí:** usar inicialización diferida para que las tareas de análisis y build no dependan de secretos.
- **No:** omitir silenciosamente correos cuando falte configuración; el futuro flujo debe recibir el error.
- **Sí:** incluir solo variables realmente consumidas por esta integración.
- **No:** incluir `MAIL_DRIVER`, `MAILER_SERVICE`, límites de adjuntos o alertas porque no existe comportamiento asociado.
- **Sí:** guardar la plantilla en `templates/` en la raíz, siguiendo el concepto de la referencia sin introducir una ruta de App Router.
- **Sí:** usar `parent-invitation.html` porque describe el caso de uso y no confunde la vinculación con una verificación genérica de email.
- **Sí:** recibir el enlace completo como input para que Infrastructure no dependa de rutas ni de una URL base del frontend.
- **No:** añadir `APP_URL` a la configuración del mailer.
- **Sí:** aceptar únicamente HTTP y HTTPS para impedir protocolos inseguros en el CTA.
- **Sí:** usar un asunto fijo sin nombres para reducir exposición de información personal en notificaciones y vistas previas.
- **Sí:** mostrar el vencimiento como fecha larga UTC con `APP_LOCALE` y sin hora.
- **Sí:** incluir texto plano para clientes que no renderizan HTML.
- **Sí:** escapar valores dinámicos porque `FileEmailTemplate` realiza interpolación simple sin escaping automático.
- **Sí:** permitir estilos inline y colores literales dentro del HTML de email porque los clientes de correo no cargan los tokens de `app/globals.css`.
- **No:** inyectar o leer tokens de `app/globals.css` durante el envío porque acoplaría el adapter al CSS del runtime y añadiría complejidad innecesaria.
- **No:** usar variables CSS globales en la plantilla porque no estarán disponibles en los clientes de correo.
- **Sí:** verificar el renderer localmente sin exigir credenciales ni entrega real.
- **No:** declarar dependencia de una spec anterior porque la capa Infrastructure y su contrato no requieren modificar ni consumir los flujos existentes.
- **Sí:** mostrar en README la futura relación con Kids de forma explícitamente no implementada.
- **No:** dibujar el envío desde Kids como flujo activo mientras no exista un disparador real.

## Risks

| Risk                                                                                           | Mitigation                                                                                                                           |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `@jmlq/mailer` está en versión beta y puede cambiar su API dentro del rango aceptado.          | Conservar `package-lock.json`, validar typecheck y build, y revisar futuras actualizaciones antes de regenerar el lockfile.          |
| `FileEmailTemplate` interpola valores sin escapar.                                             | Escapar todos los valores destinados al HTML antes de entregarlos como `templateData`.                                               |
| Un enlace malicioso podría insertarse en el CTA.                                               | Normalizar con `URL` y aceptar únicamente protocolos HTTP y HTTPS.                                                                   |
| Los estilos de email se renderizan de forma distinta entre clientes.                           | Usar estructura simple, estilos autocontenidos, fallbacks tipográficos y un enlace visible además del botón.                         |
| La carpeta raíz `templates/` podría omitirse en un futuro empaquetado standalone o serverless. | Documentar que forma parte de los archivos runtime y configurar tracing o copia de assets cuando se adopte ese modelo de despliegue. |
| La validación diferida permite que una configuración inválida llegue hasta el primer uso.      | Producir errores explícitos y dejar una comprobación operativa de SMTP para la futura spec que conecte el flujo.                     |
| La fecha UTC puede diferir de la fecha local del destinatario cerca de medianoche.             | Mantener UTC como decisión explícita y presentar solo la fecha, sin afirmar una hora local.                                          |
| El futuro flujo puede persistir una relación aunque el envío falle.                            | Definir transacción, reintentos e idempotencia en la spec que implemente la vinculación.                                             |
| El futuro flujo puede enviar invitaciones duplicadas.                                          | Dejar generación, persistencia y deduplicación de invitaciones para la spec de vinculación.                                          |
| Un secreto puede filtrarse accidentalmente a código cliente o logs.                            | Mantener toda la capa server-only, no interpolar configuración en mensajes y verificar bundles y errores.                            |

## What is **not** in this spec

- UI o interacción funcional para vincular padres.
- Persistencia de personas, relaciones o invitaciones.
- Generación de códigos y enlaces de activación.
- Cambios en `/activate-account`.
- Invocación real desde Kids o Auth.
- Semántica transaccional entre vinculación y envío.
- Colas, reintentos, idempotencia o tracking.
- Adjuntos, batch, alertas o drivers alternativos.
- Credenciales reales o envío obligatorio a un buzón.
- Framework de testing o suite de tests automatizada.
- Preview o editor visual de la plantilla.
- Revisión general de README fuera de la configuración del mailer y el diagrama feature-first.

Cada una de estas capacidades requiere una spec posterior si se incorpora al producto.
