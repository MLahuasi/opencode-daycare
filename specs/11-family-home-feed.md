# SPEC 11 — Feed familiar en Home

> **Status:** Approved
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
3. Crear servicios server-only para resolver la sesión NextAuth v4, personas, relaciones, niños y salas mediante el adapter JSON existente.
4. Crear la proyección de feed familiar a partir de las relaciones `ParentKid`.
5. Crear el componente visual de Home familiar reutilizando las tarjetas existentes sin importar datos completos desde el cliente.
6. Crear el header familiar con nombre del padre, niños vinculados y cierre de sesión.
7. Actualizar `/home` para seleccionar la composición de personal o familiar según el rol.
8. Mostrar un estado vacío seguro cuando una cuenta activa no tenga relaciones.
9. Verificar que padres con varios niños reciben un feed combinado sin duplicar anuncios de sala.
10. Verificar que un padre no puede ver publicaciones de niños o salas ajenas.
11. Verificar Home de personal, Home familiar, logout, responsive y accesibilidad con Playwright; no añadir tests unitarios en esta spec.

## Acceptance criteria

- [ ] `FeedPost` contiene `kidId` y `roomId` nullable.
- [ ] Cada publicación persistida tiene exactamente un destino.
- [ ] Las publicaciones actuales de Mateo tienen `kidId: "kid-mateo-fernandez"`.
- [ ] El anuncio general actual tiene `roomId: "room-soles"`.
- [ ] Los niños de `kids.json` conservan `room-soles` o `room-patitos` como sala explícita.
- [ ] Un usuario de personal continúa viendo el feed de personal actual.
- [ ] Un padre autenticado no ve el feed de personal.
- [ ] Un padre ve publicaciones de todos sus niños vinculados.
- [ ] Un padre ve anuncios de las salas de sus niños.
- [ ] Un padre no ve publicaciones de niños no vinculados.
- [ ] Un padre no ve anuncios de salas no relacionadas.
- [ ] Los anuncios se muestran una sola vez aunque varios niños compartan sala.
- [ ] El feed combinado se ordena por `dateTime` descendente.
- [ ] El destinatario de cada publicación permanece visible.
- [ ] El Home familiar muestra identidad del padre y niños vinculados.
- [ ] El Home familiar permite cerrar sesión.
- [ ] El Home familiar no muestra composer de personal.
- [ ] El Home familiar no muestra navegación exclusiva de personal.
- [ ] Una cuenta sin relaciones muestra un estado vacío seguro.
- [ ] No se exponen credenciales, tokens ni datos de otras personas al cliente.
- [ ] La pantalla funciona en escritorio y móvil.
- [ ] Las verificaciones funcionales se ejecutan con Playwright.
- [ ] No se añaden tests unitarios en esta spec.
- [ ] `npx eslint app` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.

## Decisions

- **Sí:** filtrar por `kidId` y `roomId` explícitos.
- **No:** inferir el alcance usando nombres o texto de las publicaciones.
- **Sí:** mostrar niños relacionados y anuncios de sus salas.
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
