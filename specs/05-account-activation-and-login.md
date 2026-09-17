# SPEC 05 — Activación de cuenta e inicio de sesión

> **Status:** Approved
> **Depends on:** SPEC 04
> **Date:** 2026-09-17
> **Objective:** Implementar `/login` y `/activate-account` con datos mock, validación de contraseña y navegación, normalizando personas, relaciones familiares, invitaciones y credenciales bajo una configuración global `es-EC`.

## Scope

**In:**

- Crear `/login` basada en `references/screens/login.dc.html`.
- Omitir la sección `INGRESO COMO`, incluyendo `Personal` y `Familia`.
- Iniciar email y contraseña vacíos.
- Navegar desde `Iniciar sesión` hacia `/`.
- Navegar desde `Activa tu cuenta` hacia `/activate-account`.
- Mantener `¿Olvidaste tu contraseña?` visible como control presentacional sin acción.
- Crear `/activate-account` basada en `references/screens/activar-cuenta.dc.html`.
- Resolver invitaciones mediante `/activate-account?code=<code>`.
- Precargar código, email y datos del niño cuando la invitación sea válida.
- Mantener código y email precargados como campos de solo lectura.
- Mostrar el formulario vacío y sin card del niño cuando no exista query string.
- Mostrar errores y bloquear la activación para invitaciones desconocidas, vencidas o aceptadas.
- Validar la contraseña de activación y su confirmación con mensajes inline accesibles.
- Navegar desde `Activar mi cuenta` hacia `/familia-feed` sin implementar esa ruta.
- Navegar desde `Iniciar sesión` hacia `/login`.
- Renombrar `Parent` a `Person`.
- Eliminar `relationship` y `code` de `Person`.
- Añadir `role: "parent" | "personal"` y el estado de cuenta de la persona.
- Crear `ParentKid` y reemplazar `Kid.parentIds` por esta relación.
- Añadir `status: "active" | "inactive"` a `Kid`.
- Crear `Invitation` y `Credential` en la feature de autenticación.
- Ajustar los fixtures existentes y crear los nuevos mocks deterministas.
- Configurar `es-EC` mediante una constante compartida global.
- Corregir el voseo existente en todo el runtime.
- Adaptar las pantallas a escritorio y móvil.

**Out of scope (for future specs):**

- Base de datos, API, Server Actions, persistencia, sesiones o autenticación real.
- Validación del login contra credenciales mock.
- Generación de hashes reales.
- Recuperación de contraseña.
- Implementación de `/familia-feed`.
- Resolución dinámica de un código escrito manualmente desde la pantalla sin query.
- Invitaciones para una persona vinculada con varios niños.
- Selector de rol Personal/Familia.
- Unit tests o instalación de un framework de testing.
- Soporte para locales distintos de `es-EC`.

## Data model

`Person`, `ParentKid` y `Kid` permanecerán en `app/features/kids/types/`. `Invitation` y `Credential` vivirán en `app/features/auth/types/`.

```ts
type ParentRelationship = "mother" | "father" | "guardian";
type PersonRole = "parent" | "personal";
type PersonStatus = "active" | "inactive" | "pending";
type KidStatus = "active" | "inactive";

type Person = {
  id: string;
  name: string;
  email: string;
  role: PersonRole;
  status: PersonStatus;
};

type ParentKid = {
  id: string;
  parentId: string;
  kidId: string;
  relationship: ParentRelationship;
  photoSharingConsent: boolean;
};

type Kid = {
  id: string;
  slug: string;
  name: string;
  birthDate: string;
  room: string;
  enrollmentDate: string;
  medicalNotes: string;
  allergies: string;
  status: KidStatus;
};

type Invitation = {
  id: string;
  personId: string;
  code: string;
  expiresAt: Date;
  acceptedAt: Date | null;
};

type Credential = {
  id: string;
  personId: string;
  passwordHash: string;
};
```

`ParentKid.parentId` debe referenciar una `Person` cuyo `role` sea `"parent"`. `PersonStatus` representa el estado de la cuenta. Las personas con invitaciones pendientes usarán `pending`; las personas habilitadas usarán `active`.

La autorización efectiva para fotos se expondrá mediante una utilidad de dominio equivalente a:

```ts
hasKidPhotoSharingConsent(
  kidId: string,
  parentKids: readonly ParentKid[],
): boolean;
```

La función devolverá `true` solamente cuando exista al menos una relación para el niño y todas sus relaciones tengan `photoSharingConsent: true`. Mateo tendrá un consentimiento aprobado y otro rechazado, por lo que su autorización efectiva será `false`.

La política de contraseña de activación exigirá mínimo ocho caracteres, una mayúscula, una minúscula, un número y un carácter de la lista `!@#$%^&*()_+-=[]{};':"\\|,.<>/?`. La contraseña de confirmación deberá coincidir. La expresión regular y la función de validación vivirán en `app/features/auth/utils/`.

## Implementation plan

1. Crear `APP_LOCALE = "es-EC"` bajo `app/shared/config/`, exportarla desde `@/app/shared` y reemplazar los literales de locale existentes.
2. Actualizar los tipos de Kids para introducir `Person`, `PersonRole`, `PersonStatus`, `KidStatus` y `ParentKid`, eliminar `Parent`, `ParentStatus` y `Kid.parentIds`, y añadir `Kid.status`.
3. Migrar `parents-mock.ts` a personas, añadir roles y estados, conservar IDs estables y agregar a Caro como persona de rol `personal`.
4. Crear `parent-kids-mock.ts` con las nueve relaciones actuales y sus consentimientos, incluyendo el escenario mixto de Mateo.
5. Añadir `status: "active"` a los ocho niños y actualizar los barrels públicos de Kids y mocks.
6. Actualizar `/kids`, `/kids/[slug]` y `KidParents` para resolver relaciones desde `ParentKid` mediante DTOs mínimos.
7. Crear y exportar `hasKidPhotoSharingConsent`, verificando los casos sin padres, todos aceptan y consentimiento mixto.
8. Crear `app/features/auth/types/` con `Invitation` y `Credential`, además de la utilidad de validación de contraseñas.
9. Crear mocks Auth con una invitación válida `7K4P9` para Lucía usando `lucia.fernandez@example.com`, invitaciones vencida y aceptada, y credenciales con hashes opacos para todas las personas activas.
10. Crear componentes Auth para el shell, login, activación, card del niño y estados de invitación, manteniendo los Server Components por defecto.
11. Crear `app/login/page.tsx` con campos vacíos, validación requerida, destino `/`, enlace a `/activate-account` y recuperación presentacional.
12. Crear `app/activate-account/page.tsx`, resolver `searchParams.code` en el servidor y entregar al formulario únicamente la proyección segura de la invitación.
13. Implementar validación inline accesible y navegación hacia `/familia-feed` solo cuando la activación sea válida, sin persistir cambios.
14. Aplicar tokens semánticos, estilos responsive y estados visuales de foco, error, solo lectura y deshabilitado sin colores literales fuera de `app/globals.css`.
15. Corregir el copy argentino del runtime a español de Ecuador, incluyendo `Compartí` a `Comparte` y `publicado por vos` a `publicado por ti`.
16. Actualizar la documentación de rutas, mocks y arquitectura sin modificar las referencias HTML ni las specs históricas.

## Acceptance criteria

- [ ] `/login` carga sin errores y conserva la composición principal de la plantilla.
- [ ] `/login` no muestra `INGRESO COMO`, `Personal` ni `Familia`.
- [ ] Email y contraseña comienzan vacíos y son obligatorios.
- [ ] Un login válido navega a `/`.
- [ ] `Activa tu cuenta` navega a `/activate-account`.
- [ ] `¿Olvidaste tu contraseña?` permanece visible sin navegación ni handler ficticio.
- [ ] `/activate-account?code=7K4P9` muestra el email canónico y la card de Mateo en Sala Soles.
- [ ] El código y email precargados son de solo lectura.
- [ ] `/activate-account` sin query muestra campos vacíos y no muestra la card del niño.
- [ ] Un código escrito manualmente no resuelve mocks ni carga una card.
- [ ] Los códigos desconocidos, vencidos y aceptados muestran errores específicos y bloquean la activación.
- [ ] La contraseña de activación cumple todas las reglas acordadas.
- [ ] La contraseña de activación requiere confirmación coincidente.
- [ ] Los errores de contraseña se muestran inline y son accesibles.
- [ ] El consentimiento de fotos es interactivo y opcional.
- [ ] Una activación válida navega a `/familia-feed`.
- [ ] No existe `app/familia-feed/page.tsx`.
- [ ] `Iniciar sesión` desde activación navega a `/login`.
- [ ] `Parent` y `ParentStatus` ya no existen en `app/`.
- [ ] `Person` no contiene `relationship` ni `code`.
- [ ] `Kid` contiene `status` y no contiene `parentIds`.
- [ ] Los conteos y perfiles de `/kids` se derivan desde `ParentKid`.
- [ ] Los ocho niños y sus perfiles continúan funcionando.
- [ ] La autorización efectiva de Mateo es `false` por consentimiento mixto.
- [ ] `Credential` no aparece en HTML ni payload de componentes cliente.
- [ ] `APP_LOCALE` es la única definición de `"es-EC"` en runtime.
- [ ] No queda voseo visible en `app/`.
- [ ] No existen colores, sombras o gradientes literales fuera de `app/globals.css`.
- [ ] Las pantallas funcionan en escritorio y móvil.
- [ ] No se implementan BDD, API, persistencia, sesiones ni unit tests.
- [ ] `npx eslint app` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] Las capturas se almacenan bajo `.playwright-mcp/Auth/`.

## Decisions

- **Sí:** mantener una única spec para modelo, mocks y pantallas.
- **Sí:** mantener `Person` y `ParentKid` dentro de Kids como cambio mínimo acordado.
- **No:** conservar `relationship` nullable en `Person`; el parentesco pertenece a `ParentKid`.
- **No:** conservar `Kid.parentIds`; `ParentKid` será la única fuente de relaciones.
- **Sí:** interpretar `PersonStatus` como estado de cuenta.
- **Sí:** resolver invitaciones mediante `searchParams.code`.
- **Sí:** usar `/` como Home existente.
- **Sí:** mantener `/familia-feed` únicamente como destino no implementado.
- **Sí:** aplicar la política de contraseña únicamente durante la activación.
- **Sí:** usar una lista cerrada de caracteres especiales para la política de contraseña.
- **Sí:** corregir a español de Ecuador todo el runtime existente.
- **No:** validar login contra `Credential` en esta entrega.
- **No:** resolver códigos escritos manualmente.
- **No:** implementar invitaciones para personas vinculadas a varios niños.

## Risks

| Risk                                                                      | Mitigation                                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| La migración de `parentIds` puede romper listados o perfiles.             | Centralizar los joins en `ParentKid` y verificar las nueve relaciones existentes.     |
| Los hashes pueden filtrarse al cliente.                                   | Mantener credenciales en Server Components y proyectar solo datos visuales.           |
| La expresión regular puede divergir entre UI y dominio.                   | Mantener una única constante y función en `app/features/auth/utils/`.                 |
| `/familia-feed` producirá una 404.                                        | Verificar el destino configurado sin crear la ruta y documentar su estado temporal.   |
| La activación no modifica `acceptedAt`, estado ni credenciales.           | Declarar expresamente que no existe persistencia en esta entrega.                     |
| La autorización de fotos puede quedar inconsistente con un único rechazo. | Calcularla con una función que exija consentimiento positivo de todas las relaciones. |

## What is **not** in this spec

- Base de datos, API, persistencia, sesiones o autenticación real.
- Validación del login contra credenciales mock.
- Recuperación de contraseña.
- Implementación de `/familia-feed`.
- Resolución de códigos escritos manualmente.
- Invitaciones para personas vinculadas a varios niños.
- Selector de rol Personal/Familia.
- Unit tests o framework de testing.
