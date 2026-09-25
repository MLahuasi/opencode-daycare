# SPEC 13 — Feed familiar por sala

> **Status:** Approved
> **Depends on:** SPEC 09, SPEC 11, SPEC 12
> **Date:** 2026-09-23
> **Objective:** Implementar `/family-feed` con navegación familiar y filtros por niño, sala y conjunto de salas autorizadas.

## Scope

**In:**

- Crear `/family-feed` basado en `references/screens/familia-feed.dc.html`.
- Redirigir a padres autenticados desde `/home` hacia `/family-feed`.
- Redirigir a personal que intente abrir `/family-feed` hacia `/home`.
- Cambiar el destino posterior al login según el rol.
- Crear navegación familiar con Feed funcional, Resumen del día y Mi cuenta como enlaces placeholder.
- Crear `/family-feed/day-summary` y `/family-feed/account` como rutas placeholder que redirigen a `/family-feed`.
- Redirigir sesiones ausentes desde `/family-feed` hacia `/auth/login` y personal o cuentas no autorizadas hacia `/home`.
- Mantener identidad familiar y cierre de sesión.
- Resolver las salas de los niños vinculados al padre.
- Mostrar publicaciones de todos los niños activos de esas salas.
- Mostrar imágenes autorizadas de los niños de esas salas.
- Mostrar etiquetas de niños activos, salas autorizadas y `Todos` cuando haya más de una sala.
- Aplicar selección única con tratamiento negro para la etiqueta activa.
- Iniciar en la sala cuando el padre tenga una sola sala y en `Todos` cuando tenga varias.
- Mostrar únicamente publicaciones del niño al seleccionar una etiqueta de niño.
- Mostrar publicaciones de todos los niños y anuncios de la sala al seleccionar una etiqueta de sala.
- Combinar todas las salas al seleccionar `Todos`.
- Deduplicar publicaciones y ordenar por `createdAt` descendente.
- Generar URLs firmadas de Cloudinary únicamente después de autorizar la publicación.
- Mantener estado vacío, responsive y accesible.

**Out of scope (for future specs):**

- Crear, editar o eliminar publicaciones desde la cuenta familiar.
- Comentarios y reacciones mutables.
- Implementar la funcionalidad de Resumen del día.
- Implementar la funcionalidad de Mi cuenta.
- Gestión de vínculos padre-niño.
- Cambio de consentimiento.
- Notificaciones o paginación.

## Data model

```ts
type FamilyFeedFilter =
  | { kind: "kid"; id: string }
  | { kind: "room"; id: string }
  | { kind: "all" };

type FamilyFeedOption = {
  id: string;
  label: string;
  filter: FamilyFeedFilter;
};
```

La autorización se calcula a partir de `ParentKid` y `Kid.roomId`. No se usarán nombres, texto de publicaciones ni IDs recibidos del cliente para decidir acceso.

## Implementation plan

1. Crear servicios server-only para proyectar el contexto familiar, salas autorizadas, niños activos y opciones de filtro.
2. Ampliar la autorización de feed para incluir todos los niños activos de las salas de los hijos vinculados, reemplazando explícitamente la restricción de SPEC 11.
3. Crear configuración y componentes de navegación familiar con Feed activo y enlaces placeholder para Resumen del día y Mi cuenta.
4. Crear el servicio de filtrado por niño, sala y `Todos`, con deduplicación y orden cronológico.
5. Crear la página `/family-feed`, sus rutas placeholder `/family-feed/day-summary` y `/family-feed/account`, y mover la experiencia familiar fuera de la composición de `/home`.
6. Actualizar login y accesos directos para separar estrictamente los feeds por rol.
7. Conectar las tarjetas al detalle y proyectar URLs firmadas de Cloudinary solo para posts autorizados.
8. Verificar con Playwright los filtros, la autorización, las redirecciones, la navegación placeholder, los estados vacíos, responsive y accesibilidad; ejecutar las comprobaciones del proyecto.

## Acceptance criteria

- [ ] Un padre autenticado llega a `/family-feed` después del login.
- [ ] Un padre que abre `/home` es redirigido a `/family-feed`.
- [ ] Personal que abre `/family-feed` es redirigido a `/home`.
- [ ] La navegación familiar muestra Feed, Resumen del día y Mi cuenta.
- [ ] Feed y cerrar sesión tienen comportamiento funcional; Resumen del día y Mi cuenta solo redirigen desde sus rutas placeholder a `/family-feed`.
- [ ] `/family-feed/day-summary` y `/family-feed/account` redirigen a `/family-feed`.
- [ ] El feed muestra todos los niños activos de las salas de los hijos vinculados.
- [ ] Un padre no puede ver publicaciones de salas no autorizadas.
- [ ] Se muestran etiquetas de niños y salas según las salas autorizadas.
- [ ] `Todos` aparece cuando el padre tiene más de una sala autorizada.
- [ ] La sala única inicia seleccionada cuando solo existe una sala.
- [ ] `Todos` inicia seleccionado cuando existen varias salas.
- [ ] La etiqueta activa usa el estilo negro definido por la plantilla.
- [ ] El filtro de un niño muestra únicamente posts dirigidos a ese niño.
- [ ] El filtro de una sala muestra posts de sus niños y anuncios de esa sala.
- [ ] `Todos` combina las salas autorizadas sin duplicar publicaciones.
- [ ] El feed se ordena por fecha descendente.
- [ ] Las imágenes se muestran solo después de autorizar el post.
- [ ] Las URLs Cloudinary no se generan para publicaciones no autorizadas.
- [ ] Una cuenta sin relaciones muestra un estado vacío seguro.
- [ ] La navegación funciona en escritorio y móvil.
- [ ] `npx eslint app` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.

## Decisions

- **Sí:** separar `/home` para personal y `/family-feed` para padres.
- **Sí:** permitir a un padre consultar todos los niños de sus salas autorizadas.
- **No:** limitar el feed familiar únicamente a sus hijos vinculados.
- **Sí:** mostrar filtros de niños, salas y `Todos` según corresponda.
- **Sí:** filtrar por niño de forma exclusiva, sin anuncios de sala.
- **Sí:** incluir anuncios al filtrar por sala.
- **No:** mostrar niños inactivos en los filtros.
- **Sí:** conservar Resumen del día y Mi cuenta como enlaces placeholder bajo `/family-feed`.
- **No:** implementar la funcionalidad de Resumen del día o Mi cuenta en esta spec.
- **Sí:** validar autorización en servidor antes de generar URLs de imágenes.
- **Sí:** redirigir sesiones ausentes a `/auth/login` y personal o cuentas no autorizadas a `/home`.
- **Sí:** verificar los flujos con Playwright manual y los comandos `eslint`, `tsc`, `build` y `git diff --check`.

## Risks

| Risk                                                              | Mitigation                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| La nueva visibilidad permite ver posts de otros niños de la sala. | Documentar que esta spec reemplaza explícitamente la decisión de privacidad de SPEC 11. |
| Un padre puede manipular el filtro recibido.                      | Resolver salas, niños y publicaciones autorizadas en servidor.                          |
| Una sala compartida puede duplicar resultados.                    | Deduplicar por ID antes de proyectar el feed.                                           |

## What is **not** in this spec

- Feed familiar basado únicamente en hijos propios.
- Publicación o edición por padres.
- Resumen del día funcional; su ruta placeholder solo redirige al feed.
- Mi cuenta funcional; su ruta placeholder solo redirige al feed.
- Comentarios, reacciones y notificaciones.
