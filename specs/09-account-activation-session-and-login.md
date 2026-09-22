# SPEC 09 — Activación, sesión e inicio de sesión

> **Status:** Implemented
> **Depends on:** SPEC 05, SPEC 08
> **Date:** 2026-09-22
> **Objective:** Completar la activación persistente y el inicio de sesión con credenciales, sesiones seguras y autorización por rol antes de habilitar la vinculación de padres.

## Scope

**In:**

- Instalar `next-auth@4.24.15` y `bcryptjs`.
- Configurar NextAuth v4 con Credentials Provider, sesión JWT y cookie HttpOnly de siete días.
- Añadir `AUTH_SECRET` a `.env.template`.
- Persistir la activación en `Person`, `Invitation`, `Credential` y `ParentKid`.
- Normalizar fechas de invitación como strings ISO persistibles.
- Añadir `kidId`, `relationship` y `sentAt` a `Invitation`.
- Crear `ParentKid` únicamente al activar una invitación.
- Validar credenciales en `/auth/login` y redirigir a `/home`.
- Mostrar un mensaje de activación exitosa mediante `?activated=1`.
- Implementar cierre de sesión.
- Revalidar en servidor que la persona de la sesión existe, está activa y conserva su rol.
- Proteger las rutas de Kids para el rol `personal`.
- Redirigir padres autenticados que intenten abrir Kids hacia `/home`.
- Mostrar un estado seguro y mínimo en `/home` hasta SPEC 11.
- Conservar los hashes `mock-hash-*` como credenciales no válidas.
- Crear un hash bcrypt local para Caro usando la clave demo `OpenDayCare1!`.

**Out of scope (for future specs):**

- Vinculación de padres y envío de invitaciones.
- Feed familiar filtrado.
- Recuperación de contraseña.
- Rate limiting.
- OAuth u otros proveedores de autenticación.
- Base de datos remota.
- Sesiones persistidas en JSON.
- Publicación de contenido.

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

type Credential = {
  id: string;
  personId: string;
  passwordHash: string;
};
```

La activación válida debe realizar estas operaciones coordinadas:

- Crear o reemplazar la credencial de la persona.
- Cambiar `Person.status` a `"active"`.
- Crear `ParentKid` con el `kidId`, `relationship` y consentimiento elegido.
- Guardar `Invitation.acceptedAt`.

La invitación válida existente de Lucía perderá su relación pendiente en `parent-kids.json`; la activación volverá a crearla.

## Implementation plan

1. Instalar `next-auth@4.24.15` y `bcryptjs`, actualizar `package.json` y `package-lock.json`, y añadir las variables de entorno documentadas.
2. Normalizar el tipo `Invitation`, los fixtures y los servicios para trabajar con fechas ISO y comparar vencimientos correctamente.
3. Crear la configuración estable de NextAuth v4 con Credentials Provider, `getServerSession` y Route Handler App Router.
4. Añadir callbacks de JWT y sesión para transportar `personId` y `role` sin exponer hashes.
5. Crear la transacción JSON coordinada con lock, snapshots y restauración ante fallos.
6. Implementar la Server Action de activación con validación de código, fecha, contraseña, confirmación y consentimiento opcional.
7. Actualizar la pantalla de activación para enviar la acción, bloquear estados inválidos y mostrar un estado no accionable sin código.
8. Crear la credencial bcrypt local de Caro y conservar los demás hashes mock como valores no verificables.
9. Implementar la autorización server-side y proteger las rutas de Kids y la futura ruta de vinculación.
10. Conectar Login con Auth.js, mostrar un error genérico y redirigir credenciales válidas a `/home`.
11. Conectar `Cerrar sesión` y mostrar el estado de activación exitosa en Login.
12. Mostrar en `/home` un estado seguro para padres autenticados hasta que SPEC 11 implemente el feed familiar.
13. Verificar activación, persistencia, rollback, login, logout, sesiones y autorización en escritorio y móvil.

## Acceptance criteria

- [x] `package.json` declara `next-auth` y `bcryptjs`.
- [x] `package-lock.json` contiene las versiones resueltas.
- [x] `.env.template` contiene `AUTH_SECRET` sin secretos reales.
- [x] `Invitation` contiene `kidId`, `relationship`, `sentAt` y fechas ISO.
- [x] Las fechas vencidas se detectan correctamente al leer JSON.
- [x] La invitación válida de Lucía identifica explícitamente a Mateo.
- [x] La invitación válida de Lucía no tiene una relación `ParentKid` previa.
- [x] NextAuth v4 expone el Route Handler `app/api/auth/[...nextauth]/route.ts` para el App Router.
- [x] NextAuth v4 usa Credentials Provider con email y contraseña.
- [x] La sesión dura como máximo siete días.
- [x] La cookie de sesión es HttpOnly, Secure en producción y SameSite Lax.
- [x] Los hashes nunca llegan a componentes cliente ni HTML.
- [x] Una activación válida crea o actualiza Credential con bcrypt.
- [x] Una activación válida cambia la persona a `active`.
- [x] Una activación válida crea exactamente una relación `ParentKid`.
- [x] El consentimiento sin marcar se persiste como `false`.
- [x] El consentimiento marcado se persiste como `true`.
- [x] Una activación válida marca `acceptedAt`.
- [x] Un fallo durante la activación restaura las colecciones modificadas.
- [x] Una activación válida redirige a `/auth/login?activated=1`.
- [x] Login muestra el aviso de activación cuando `activated=1`.
- [x] Login rechaza email o contraseña incorrectos con un mensaje genérico.
- [x] Login rechaza cuentas inexistentes, inactivas y hashes mock.
- [x] Login válido crea sesión y redirige a `/home`.
- [x] Cerrar sesión invalida la sesión y vuelve a `/auth/login`.
- [x] Una persona eliminada o inactiva no puede seguir usando una sesión válida.
- [x] `/kids/**` requiere una sesión con rol `personal`.
- [x] Un padre autenticado que abre `/kids/**` es redirigido a `/home`.
- [x] `/home` no muestra el feed de personal a un padre durante esta spec.
- [x] No se implementa rate limiting.
- [x] `npx eslint app` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] `git diff --check` termina correctamente.

## Decisions

- **Sí:** usar NextAuth v4 con Credentials porque es la versión estable publicada (`4.24.15`).
- **No:** usar `next-auth@beta` porque introduce cambios de API y riesgo innecesario para este proyecto.
- **No:** migrar a Auth.js v5 durante esta feature; requiere una decisión y validación separadas.
- **No:** implementar una sesión custom porque duplicaría responsabilidades criptográficas.
- **Sí:** usar JWT por cookie durante siete días.
- **No:** persistir sesiones en JSON porque añadiría otra colección mutable sin necesidad.
- **Sí:** usar bcryptjs para evitar dependencias nativas en el entorno local.
- **No:** migrar los hashes mock existentes; deben fallar de forma segura.
- **Sí:** crear `ParentKid` al activar, no al enviar la invitación.
- **Sí:** coordinar las cuatro escrituras con snapshots y lock local.
- **No:** implementar una transacción de base de datos.
- **Sí:** usar un error genérico de login para no revelar cuentas existentes.
- **No:** implementar rate limiting en esta spec.

## Risks

| Risk                                                        | Mitigation                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| NextAuth v4 requiere una integración distinta a Auth.js v5. | Fijar `4.24.15`, seguir su API documentada y verificar typecheck y build. |
| JSON no ofrece transacciones multiarchivo nativas.          | Usar lock, snapshots y restauración en el adapter.                        |
| Un JWT puede conservar datos obsoletos.                     | Revalidar persona y rol en cada acceso protegido.                         |
| La clave demo no debe llegar a producción.                  | Documentarla como fixture local y no incluir secretos reales.             |

## What is **not** in this spec

- `/auth/link-parent` funcional.
- Generación o envío de nuevas invitaciones.
- Feed familiar filtrado.
- Recuperación de contraseña.
- Rate limiting.
- OAuth, base de datos o sesiones persistidas.
