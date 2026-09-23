# SPEC 11 — Feed familiar en Home

> **Status:** Implement
> **Depends on:** SPEC 01, SPEC 09, SPEC 10
> **Date:** 2026-09-22
> **Objective:** Convertir `/home` en una vista de feed filtrada por las relaciones y salas de los padres autenticados sin exponer contenido de otras familias.

## Scope

**In:**

- Resolver la persona autenticada mediante la configuración existente de NextAuth v4.
- Obtener sus relaciones `ParentKid` desde la persistencia JSON existente.
- Filtrar publicaciones por niño y anuncios por sala desde el servidor antes de proyectar props.
- Permitir que una publicación tenga `kidId` o `roomId`, pero no ambos.
- Mostrar un feed combinado para padres vinculados con varios niños.
- Mostrar anuncios de las salas de sus niños.
- Reutilizar padres `parent` activos con varios niños.
- Vincular niños de salas diferentes.
- Crear una invitación específica por relación padre-niño.
- Evitar duplicar registros `Person`.
- Conservar las credenciales y el estado activo del padre reutilizado.
- Crear `ParentKid` al aceptar la invitación sin reemplazar credenciales.
- Rechazar personal, estados incompatibles y relaciones duplicadas.
- Crear un header familiar con identidad, niños y cierre de sesión.
- Omitir composer y navegación exclusiva de personal.
- Mostrar un estado vacío seguro cuando no existan relaciones.
- Mantener el feed actual de personal para `role: "personal"`.
- Mantener diseño responsive y tokens visuales existentes.

**Out of scope (for future specs):**

- Crear publicaciones.
- Editar o eliminar publicaciones.
- Comentarios o reacciones funcionales.
- Notificaciones.
- Selector interactivo de niño.
- Administración de relaciones familiares.
- Subida de multimedia.

## Data model

```ts
type FeedPost = {
  id: string;
  type: PostType;
  subject: string;
  initial?: string;
  time: string;
  dateTime: string;
  authorLabel?: string;
  recipient: string;
  body: string;
  reactions: number;
  comments: number;
  hasMedia?: boolean;
  kidId: string | null;
  roomId: string | null;
};
```

Cada publicación tendrá exactamente uno de estos destinos:

- `kidId` para una publicación específica de un niño. Los posts actuales de Mateo usarán `kid-mateo-fernandez`.
- `roomId` para un anuncio general de una sala.

Los niños actuales de `kids.json` conservan sus relaciones de sala existentes. Los ocho niños de
`room-soles` usan `room-soles`; Martina López Vega usa `room-patitos`. El anuncio actual de sala
usará `room-soles`.

El feed familiar será la unión de publicaciones cuyos `kidId` pertenezcan a los niños relacionados con la persona y anuncios cuyo `roomId` pertenezca a sus salas, ordenada por `dateTime` descendente.

## Implementation plan

1. Añadir `kidId` y `roomId` al contrato `FeedPost` y migrar `feed.json` con destinos explícitos: los dos posts de Mateo con `kid-mateo-fernandez` y el anuncio con `room-soles`.
2. Validar que cada publicación tenga exactamente un destino.
3. Crear servicios server-only para resolver la sesión NextAuth v4, personas, relaciones, niños y salas mediante el adapter JSON existente, y reutilizar padres `parent` activos sin duplicar `Person`.
4. Crear la proyección de feed familiar a partir de las relaciones `ParentKid`.
5. Crear el componente visual de Home familiar reutilizando las tarjetas existentes sin importar datos completos desde el cliente.
6. Crear el header familiar con nombre del padre, niños vinculados y cierre de sesión.
7. Actualizar `/home` para seleccionar la composición de personal o familiar según el rol.
8. Mostrar un estado vacío seguro cuando una cuenta activa no tenga relaciones.
9. Verificar que padres con varios niños reciben un feed combinado sin duplicar anuncios de sala.
10. Verificar que un padre no puede ver publicaciones de niños o salas ajenas.
11. Verificar Home de personal, Home familiar, logout, responsive y accesibilidad con Playwright; no añadir tests unitarios en esta spec.

## Acceptance criteria

- [x] `FeedPost` contiene `kidId` y `roomId` nullable.
- [x] Cada publicación persistida tiene exactamente un destino.
- [x] Las publicaciones actuales de Mateo tienen `kidId: "kid-mateo-fernandez"`.
- [x] El anuncio general actual tiene `roomId: "room-soles"`.
- [x] Los niños de `kids.json` conservan `room-soles` o `room-patitos` como sala explícita.
- [x] Un usuario de personal continúa viendo el feed de personal actual.
- [x] Un padre autenticado no ve el feed de personal.
- [x] Un padre ve publicaciones de todos sus niños vinculados.
- [x] Un padre ve anuncios de las salas de sus niños.
- [x] Un padre `parent` activo puede vincular varios niños sin duplicar `Person`.
- [x] Un padre puede tener niños vinculados en salas diferentes.
- [x] Cada relación padre-niño pendiente usa una invitación específica.
- [x] Una vinculación adicional conserva las credenciales y el estado activo del padre.
- [x] Aceptar una vinculación adicional crea `ParentKid` sin reemplazar credenciales.
- [x] Personal, estados incompatibles y relaciones duplicadas son rechazados.
- [x] Un padre no ve publicaciones de niños no vinculados.
- [x] Un padre no ve anuncios de salas no relacionadas.
- [x] Los anuncios se muestran una sola vez aunque varios niños compartan sala.
- [x] El feed combinado se ordena por `dateTime` descendente.
- [x] El destinatario de cada publicación permanece visible.
- [x] El Home familiar muestra identidad del padre y niños vinculados.
- [x] El Home familiar permite cerrar sesión.
- [x] El Home familiar no muestra composer de personal.
- [x] El Home familiar no muestra navegación exclusiva de personal.
- [x] Una cuenta sin relaciones muestra un estado vacío seguro.
- [x] No se exponen credenciales, tokens ni datos de otras personas al cliente.
- [x] La pantalla funciona en escritorio y móvil.
- [x] Las verificaciones funcionales se ejecutan con Playwright.
- [x] No se añaden tests unitarios en esta spec.
- [x] `npx eslint app` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] `git diff --check` termina correctamente.

## Decisions

- **Sí:** filtrar por `kidId` y `roomId` explícitos.
- **No:** inferir el alcance usando nombres o texto de las publicaciones.
- **Sí:** mostrar niños relacionados y anuncios de sus salas.
- **Sí:** reutilizar padres `parent` activos para varios niños sin duplicar `Person`.
- **Sí:** mantener credenciales y estado activo al aceptar una vinculación adicional.
- **No:** crear `ParentKid` antes de aceptar la invitación.
- **No:** duplicar relaciones padre-niño ni aceptar personal o estados incompatibles.
- **No:** mostrar la sala completa con publicaciones de otros niños.
- **Sí:** usar un feed combinado para varios niños.
- **No:** introducir un selector interactivo en esta entrega.
- **Sí:** mantener una composición distinta para personal y familia.
- **No:** adaptar el sidebar de personal para padres.
- **Sí:** mostrar un estado vacío seguro sin relaciones.
- **No:** mostrar feed general sin una relación autorizada.

## Risks

| Risk                                                      | Mitigation                                                |
| --------------------------------------------------------- | --------------------------------------------------------- |
| Un post sin destino puede filtrarse incorrectamente.      | Validar que exactamente uno de `kidId` o `roomId` exista. |
| Un usuario puede tener varios niños en salas compartidas. | Deduplicar anuncios por ID y ordenar una sola cronología. |
| El cliente puede recibir datos de otras familias.         | Filtrar en el servidor antes de proyectar props.          |

## What is **not** in this spec

- Crear, editar o borrar publicaciones.
- Comentarios, reacciones o notificaciones funcionales.
- Selector de niño.
- Gestión de relaciones o invitaciones.
- Subida de multimedia.
