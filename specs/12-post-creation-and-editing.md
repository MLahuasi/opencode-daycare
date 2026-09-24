# SPEC 12 — Creación y edición de publicaciones

> **Status:** Approved
> **Depends on:** SPEC 03, SPEC 05, SPEC 08, SPEC 09, SPEC 11
> **Date:** 2026-09-23
> **Objective:** Implementar `/post` para crear y editar publicaciones del personal con imágenes gestionadas por Cloudinary y persistencia en JSON.

## Scope

**In:**

- Crear `/post` y `/post?id=<id>` basados en `references/screens/crear-publicacion.dc.html`.
- Permitir acceso únicamente a personas activas con rol `personal`.
- Conectar “Comparte un momento”, “Nueva publicación” y “Editar” con el formulario.
- Persistir las publicaciones en `app/infrastructure/persistence/json/data/feed.json`.
- Permitir un único destino por publicación: un niño activo o una sala asignada.
- Implementar los tipos `food`, `nap`, `activity`, `achievement`, `mood` y `announcement`.
- Exigir una descripción o al menos una imagen.
- Limitar la descripción a 2000 caracteres.
- Implementar selección de hasta cuatro imágenes JPEG, PNG o WebP de hasta 10 MB cada una.
- Crear un componente reutilizable con selector del sistema, drag and drop, preview, texto alternativo y eliminación.
- Subir imágenes desde el servidor autenticado a Cloudinary.
- Usar assets Cloudinary `authenticated` y generar sus URLs firmadas desde el servidor.
- Persistir `publicId` y metadatos Cloudinary en `feed.json`, nunca credenciales ni archivos locales.
- Validar `photoSharingConsent` para todos los padres o tutores activos del niño antes de subir imágenes.
- Permitir imágenes únicamente en publicaciones dirigidas a un niño.
- Crear `staff-rooms.json` para relacionar personal con salas autorizadas.
- Generar fechas en servidor y persistirlas en UTC.
- Permitir agregar y quitar imágenes durante la edición.
- Eliminar de Cloudinary las imágenes retiradas y hacer rollback de assets nuevos si falla la persistencia.
- Volver a `/home` al cancelar, crear o editar.

**Out of scope (for future specs):**

- Integración con otro proveedor de almacenamiento.
- Eliminación de publicaciones.
- Comentarios y reacciones mutables.
- Publicaciones creadas por padres.
- Gestión de consentimientos familiares.
- URLs temporales o renovación automática de URLs Cloudinary.

## Data model

```ts
type PostType =
  | "food"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "announcement";

type FeedMedia = {
  id: string;
  publicId: string;
  assetId: string;
  resourceType: "image";
  deliveryType: "authenticated";
  format: "jpg" | "jpeg" | "png" | "webp";
  width: number;
  height: number;
  bytes: number;
  originalName: string;
  alt: string | null;
};

type FeedPost = {
  id: string;
  type: PostType;
  authorId: string;
  kidId: string | null;
  roomId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  media: FeedMedia[];
};

type StaffRoom = {
  id: string;
  personId: string;
  roomId: string;
};
```

Cloudinary se configurará mediante variables de entorno server-only. `api_key` y `api_secret` nunca se enviarán al navegador. Las URLs firmadas permanentes se generarán con `publicId` después de autorizar el acceso dentro de la aplicación.

## Implementation plan

1. Migrar el contrato de `FeedPost`, los posts existentes y el adapter JSON para soportar autoría, timestamps, tipos nuevos y `media`.
2. Crear `staff-rooms.json`, su tipo y servicios para resolver las salas autorizadas del personal.
3. Crear el adapter server-only de Cloudinary, su configuración mediante entorno y el contrato de subida, firma y eliminación.
4. Crear schemas para destino, tipo, descripción, metadatos de imágenes y modo creación/edición.
5. Crear el componente reutilizable de selección de imágenes con diálogo, drag and drop, preview, validación y eliminación.
6. Crear el formulario responsive basado en la plantilla y cargar desde servidor únicamente niños y salas autorizados.
7. Crear las acciones server-only de creación y edición con reautorización, validación de consentimiento y transacción de persistencia.
8. Implementar rollback de Cloudinary cuando una escritura posterior falle y eliminación de assets retirados tras una edición exitosa.
9. Crear `/post` y `/post?id=<id>`, conectarlo con el composer, CTA y tarjetas, y revalidar `/home` después de guardar.
10. Verificar creación, edición, consentimiento, errores de Cloudinary, rollback, responsive y accesibilidad.

## Acceptance criteria

- [ ] `/post` carga para personal activo y redirige a `/home` para padres.
- [ ] `/post?id=<id>` carga los datos de la publicación existente.
- [ ] El formulario coincide estructuralmente con la plantilla indicada.
- [ ] Solo se pueden seleccionar niños activos y salas asignadas al personal.
- [ ] Cada publicación tiene exactamente un destino.
- [ ] Los seis tipos definidos se pueden seleccionar y persistir.
- [ ] Una descripción de más de 2000 caracteres es rechazada.
- [ ] Una publicación sin descripción ni imágenes es rechazada.
- [ ] El selector acepta como máximo cuatro imágenes válidas.
- [ ] Se rechazan formatos no permitidos y archivos mayores de 10 MB.
- [ ] El selector ofrece diálogo del sistema, drag and drop, preview y eliminación.
- [ ] Las credenciales Cloudinary no llegan al cliente.
- [ ] Las imágenes se suben como assets `authenticated`.
- [ ] Las fotos de un niño se bloquean si algún padre o tutor activo no tiene consentimiento.
- [ ] Las publicaciones dirigidas a una sala no admiten imágenes.
- [ ] `feed.json` contiene `publicId` y metadatos de cada imagen guardada.
- [ ] Un fallo de persistencia elimina los assets Cloudinary recién subidos.
- [ ] Editar permite agregar y quitar imágenes sin superar el límite.
- [ ] Cancelar, crear y editar vuelven a `/home`.
- [ ] Las publicaciones nuevas aparecen en `/home` después de guardarse.
- [ ] `npx eslint app` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.

## Decisions

- **Sí:** usar Cloudinary desde esta entrega.
- **Sí:** subir desde el servidor autenticado para validar permisos antes de transferir imágenes.
- **Sí:** usar assets `authenticated` y URLs firmadas permanentes generadas server-side.
- **No:** exponer `api_key` o `api_secret` al navegador.
- **Sí:** guardar identificadores y metadatos Cloudinary en `feed.json`.
- **No:** guardar binarios, Data URLs o paths locales.
- **Sí:** usar un niño o una sala como destino exclusivo.
- **Sí:** exigir consentimiento de todos los padres o tutores activos para fotos de un niño.
- **No:** adjuntar fotos a publicaciones de sala.
- **Sí:** hacer rollback de assets si falla la persistencia.
- **No:** implementar Cloudinary mediante carga directa desde el navegador.

## Risks

| Risk                                                                 | Mitigation                                                                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Una escritura JSON puede fallar después de una subida.               | El servicio registra los assets nuevos y ejecuta `destroy` durante el rollback.                               |
| Una URL firmada permanente puede compartirse fuera de la plataforma. | Usar assets autenticados y documentar que la revocación requiere eliminar o invalidar el asset en Cloudinary. |
| El consentimiento puede cambiar después de publicar.                 | Validar consentimiento al crear y editar; la revocación histórica queda fuera de esta spec.                   |
| El proveedor no está disponible.                                     | Mostrar error recuperable y no persistir posts incompletos.                                                   |

## What is **not** in this spec

- Almacenamiento local de imágenes.
- URLs públicas de Cloudinary.
- Carga directa desde el navegador.
- Eliminación de publicaciones.
- Comentarios y reacciones funcionales.
- Gestión de consentimientos.
