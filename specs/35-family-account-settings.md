# SPEC 35 — Ajustes de cuenta familiar

> **Status:** Approved
> **Depends on:** SPEC 20, SPEC 29, SPEC 34
> **Date:** 2026-11-19
> **Objective:** Implementar `/family-feed/account` para que un padre gestione su nombre, teléfono y contraseña, consulte sus hijos vinculados y vea las opciones futuras de cuenta.

## Why this spec exists

`/family-feed/account` existe como entrada de compatibilidad que redirige al Family Feed. La navegación familiar ya expone “Mi cuenta”, pero no ofrece una pantalla funcional ni un lugar para administrar los datos básicos del padre.

La funcionalidad debe respetar la composición server-only, la autorización por sesión PostgreSQL y el diseño visual existente de Family Feed.

## Scope

**In:**

- Convertir `/family-feed/account` en una página protegida para usuarios con rol `parent`.
- Mostrar el encabezado “Ajustes / Mi cuenta” siguiendo `references/screens/familia-cuenta.dc.html`.
- Mostrar el avatar basado en la inicial existente, sin carga ni persistencia de imágenes.
- Mostrar el correo electrónico como dato no editable.
- Editar y persistir el nombre del padre.
- Añadir `people.phone` como columna nullable y editar el teléfono desde la cuenta.
- Normalizar espacios, paréntesis, puntos y guiones del teléfono antes de persistirlo.
- Mostrar los hijos activos vinculados al padre en modo lectura.
- Mostrar la sala asociada cuando exista información de sala.
- Mostrar controles de notificaciones visibles pero deshabilitados.
- Implementar cambio de contraseña mediante Server Action server-only.
- Usar únicamente nueva contraseña y confirmación de nueva contraseña.
- Exigir una contraseña de al menos ocho caracteres y coincidencia entre ambos campos.
- Mantener la sesión activa después de cambiar la contraseña.
- Reutilizar el `LogoutButton` existente.
- Mostrar soporte como opción deshabilitada mientras no exista un destino definido.
- Validar la migración de teléfono en Supabase local antes de dejarla preparada para el entorno remoto de test.

**Out of scope (for future specs):**

- Carga, edición o almacenamiento de avatares.
- Edición del correo electrónico.
- Persistencia de preferencias de notificaciones.
- Envío de notificaciones o resumen diario.
- Flujo de soporte, tickets, correo de ayuda o ruta de soporte.
- Recuperación de contraseña por correo.
- Solicitar nuevamente la contraseña actual para cambiarla.
- Cierre de otras sesiones después de cambiar la contraseña.
- Modificación de vínculos padre-hijo desde esta página.
- Aplicación directa de la migración al proyecto remoto desde esta implementación.
- Nuevos endpoints HTTP; el cambio de contraseña será una Server Action.

## Data model

La entidad `Person` incorpora el teléfono opcional:

```ts
type Person = DaycareScoped & {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roles: PersonRoles;
  status: PersonStatus;
};
```

La migración SQL añade:

```sql
alter table public.people
  add column phone text;
```

Reglas del teléfono:

- `NULL` representa que no se ha informado.
- Una cadena vacía se convierte en `NULL`.
- Se eliminan espacios, paréntesis, puntos y guiones antes de guardar.
- Se acepta un prefijo `+` opcional.
- El valor normalizado debe contener entre 7 y 15 dígitos.

La consulta de cuenta reutiliza el contexto autorizado de Family Feed:

```ts
type FamilyAccountContext = {
  person: Person;
  kids: readonly Kid[];
  rooms: readonly Room[];
};
```

El cambio de contraseña conserva la identidad de la credencial y reemplaza solo su hash:

```ts
type PasswordChangeInput = {
  daycareId: string;
  personId: string;
  password: string;
};
```

La identidad anterior se obtiene exclusivamente de la sesión activa. El formulario no envía ni decide `personId` o `daycareId`.

## Implementation plan

1. Crear una migración SQL versionada para añadir `people.phone` y verificar que sea compatible con las filas existentes.
2. Actualizar `Person`, `PersonRow`, el mapper y `PostgresPersonRepository` para leer, crear y actualizar el teléfono.
3. Crear el comando de aplicación para cambiar una credencial existente, validar ocho caracteres como mínimo, generar el hash con bcrypt y persistirlo mediante los puertos de Auth.
4. Crear la Server Action de actualización de cuenta, validar la sesión y el rol `parent`, normalizar nombre y teléfono, actualizar solo la persona autenticada y revalidar `/family-feed/account` y `/family-feed`.
5. Crear la Server Action de cambio de contraseña, validar la sesión activa, validar ambos campos, ejecutar el comando de aplicación y devolver estados de éxito o error sin exponer datos sensibles.
6. Reemplazar el placeholder de `src/app/(general)/family-feed/account/page.tsx` por una página server que cargue el contexto autorizado, construya el shell familiar y renderice la cuenta.
7. Crear los colaboradores privados de la ruta para los formularios interactivos de perfil y contraseña usando `useActionState`, estados pendientes, errores accesibles y mensajes `aria-live`.
8. Crear los estilos CSS Module de la página siguiendo los tokens semánticos existentes, el diseño de `familia-cuenta.dc.html` y los breakpoints del Family Feed.
9. Añadir la sección de hijos en modo lectura, controles de notificaciones deshabilitados, cambio de contraseña habilitado, soporte deshabilitado y cierre de sesión funcional.
10. Validar la migración en el stack Supabase local mediante el flujo de migraciones del proyecto y comprobar que las filas existentes conservan `phone = NULL`.
11. Ejecutar ESLint, TypeScript, build y pruebas de navegación y formularios; dejar la migración preparada para que el responsable del entorno de test la aplique mediante el flujo remoto autorizado.

## Acceptance criteria

- [ ] `/family-feed/account` deja de redirigir a `/family-feed`.
- [ ] Un usuario sin sesión es redirigido al login.
- [ ] Un usuario autenticado sin rol `parent` no puede acceder a la página familiar.
- [ ] La página conserva `FamilySidebar` y marca “Mi cuenta” como navegación activa.
- [ ] La página muestra la inicial del padre y no ofrece carga de avatar.
- [ ] El correo se muestra como no editable.
- [ ] El nombre se puede editar y guardar mediante una Server Action.
- [ ] El nombre vacío o menor de dos caracteres devuelve un error de validación.
- [ ] El teléfono se puede dejar vacío y se persiste como `NULL`.
- [ ] Un teléfono válido se normaliza antes de persistirse.
- [ ] Un teléfono inválido devuelve un error sin modificar la persona.
- [ ] La migración añade `people.phone` como columna nullable.
- [ ] El listado solo muestra hijos activos vinculados al padre autenticado.
- [ ] La página no permite modificar ni crear vínculos padre-hijo.
- [ ] Los controles de notificaciones son visibles y están deshabilitados.
- [ ] La opción de soporte es visible y está deshabilitada.
- [ ] El cambio de contraseña muestra dos campos: nueva contraseña y confirmación.
- [ ] No se solicita la contraseña actual.
- [ ] Las contraseñas con menos de ocho caracteres se rechazan.
- [ ] Las contraseñas diferentes se rechazan.
- [ ] La contraseña válida se almacena únicamente como hash bcrypt.
- [ ] El usuario autenticado se deriva de la sesión y no de valores enviados por el cliente.
- [ ] La sesión actual permanece activa después del cambio de contraseña.
- [ ] El logout reutiliza `LogoutButton` y redirige al login.
- [ ] La interfaz es usable en escritorio y móvil sin introducir colores literales fuera de `globals.css`.
- [ ] La migración pasa la validación y se aplica correctamente al stack Supabase local.
- [ ] `npx eslint src` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] La migración remota no se ejecuta automáticamente desde la implementación.

## Decisions

- **Sí:** convertir la ruta existente `/family-feed/account` en la página oficial de ajustes familiares.
- **Sí:** permitir editar nombre y teléfono con un guardado explícito conjunto.
- **Sí:** almacenar `phone` en `people` como `text null`, porque las cuentas existentes no tienen teléfono.
- **Sí:** normalizar separadores del teléfono antes de guardarlo y conservar el prefijo internacional `+`.
- **Sí:** mostrar el correo como solo lectura, porque no existe flujo de cambio de identidad.
- **Sí:** reutilizar la lectura autorizada de Family Feed para hijos y salas.
- **Sí:** dejar las notificaciones visibles pero deshabilitadas, porque no existe persistencia de preferencias.
- **Sí:** implementar cambio de contraseña con dos campos y sesión activa.
- **No:** solicitar la contraseña actual; el usuario ya está autenticado y la decisión confirmada es confiar en la sesión activa.
- **Sí:** mantener la sesión después del cambio de contraseña.
- **Sí:** usar bcrypt mediante el adapter y los puertos de Auth existentes.
- **No:** crear un Route Handler HTTP; una Server Action satisface el flujo actual.
- **No:** aplicar automáticamente la migración remota; primero se valida localmente y después la aplica el responsable del entorno de test.
- **Sí:** conservar la referencia visual familiar y los tokens semánticos del proyecto.

## Risks

| Risk                                                              | Mitigation                                                                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Un cambio de nombre deja desactualizado el perfil del sidebar.    | Revalidar `/family-feed/account` y `/family-feed` después de guardar.                                           |
| Un teléfono con formato internacional se rechaza incorrectamente. | Normalizar separadores, aceptar `+` opcional y validar la longitud de dígitos después de normalizar.            |
| Una Server Action recibe un identificador manipulado.             | Derivar `personId` y `daycareId` exclusivamente de `requireActiveSession()`.                                    |
| Una cuenta sin credencial no puede cambiar su contraseña.         | Devolver un estado de error específico sin crear una credencial inesperadamente.                                |
| La página muestra hijos de otra familia.                          | Reutilizar `getFamilyFeedContext`, que filtra relaciones por padre, daycare y estado activo.                    |
| La migración se aplica al proyecto equivocado.                    | Ejecutar primero el dry-run y la migración local; dejar la aplicación remota fuera del flujo de implementación. |

## What is **not** in this spec

- Avatar persistido o carga de imágenes.
- Cambio de correo electrónico.
- Preferencias de notificaciones persistidas.
- Soporte o sistema de tickets.
- Recuperación de contraseña.
- Solicitud de contraseña actual.
- Gestión de relaciones padre-hijo.
- Route Handler HTTP para la cuenta.
- Aplicación automática de la migración al proyecto Supabase remoto.

---

Plan de implementación

1.  Crear y verificar la migración people.phone.
2.  Actualizar dominio, tipos, mapper y repositorio.
3.  Crear comando de cambio de contraseña.
4.  Crear Server Action de actualización de cuenta.
5.  Crear Server Action de cambio de contraseña.
6.  Reemplazar el placeholder por la página funcional.
7.  Crear formularios interactivos con useActionState.
8.  Crear estilos CSS Module.
9.  Añadir hijos, notificaciones, contraseña, soporte y logout.
10. Validar la migración en Supabase local.
11. Ejecutar lint, typecheck, build y pruebas.
