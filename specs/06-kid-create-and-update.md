# SPEC 06 — Alta y actualización de niños

> **Status:** Approved
> **Depends on:** SPEC 05
> **Date:** 2026-09-18
> **Objective:** Implementar el alta y actualización de niños mediante formularios validados y persistencia local en archivos JSON, incorporando salas y etiquetas de alergias.

## Scope

**In:**

- Crear la página de alta `/kids/new` basada en `references/screens/agregar-nino.dc.html`.
- Crear la página de edición `/kids/[id]/edit` usando el mismo formulario y referencia visual.
- Conectar `+ Agregar niño` en `/kids` con `/kids/new`.
- Conectar `Editar` en el perfil del niño con `/kids/[id]/edit`.
- Compartir la presentación y validación del formulario entre Add y Edit.
- Crear el type `Room` con los campos `id` y `name`.
- Crear las salas `Soles`, `Girasoles` y `Patitos` con identificadores estables.
- Cambiar `Kid.room` por `Kid.roomId`.
- Usar `roomId` como referencia de la sala actual del niño.
- Cargar las salas disponibles desde el mock JSON.
- Migrar los datos Kids a `kids.json`, `people.json`, `rooms.json` y `parent-kids.json` bajo `app/data/mocks/kids/`.
- Mantener arreglos directos como estructura raíz de cada archivo JSON.
- Leer y escribir los JSON únicamente en el servidor mediante un servicio de almacenamiento.
- Persistir altas y actualizaciones mediante Server Actions.
- Implementar escritura atómica para evitar archivos JSON incompletos.
- Validar los datos en cliente y servidor.
- Hacer obligatorios `Nombre completo`, `Fecha de Nacimiento` y `Sala`.
- Identificar los campos obligatorios mediante asterisco, leyenda, atributo `required` y estados accesibles de error.
- Validar `Nombre completo` con al menos dos palabras, espacios normalizados y máximo 120 caracteres.
- Aplicar una máscara `dd/mm/aaaa` a `Fecha de Nacimiento`.
- Rechazar fechas inexistentes y fechas futuras.
- Guardar fechas válidas en formato `YYYY-MM-DD`.
- Iniciar el selector de sala de Add con el placeholder `Selecciona una sala` sin valor seleccionado.
- Mantener `ALERGIAS (ETIQUETAS)` y `NOTAS MÉDICAS` como campos opcionales.
- Crear un `TagsInput` reutilizable para alergias.
- Crear una etiqueta al pulsar Enter o coma.
- Permitir eliminar etiquetas mediante Backspace o un control visible de eliminación.
- Convertir en etiqueta pendiente el texto no confirmado al guardar.
- Recortar etiquetas y deduplicarlas sin distinguir mayúsculas.
- Representar las etiquetas en `Kid.allergies` como una cadena separada por comas.
- Generar un UUID para cada niño nuevo en el servidor.
- Generar un slug único desde el nombre al crear un niño.
- Añadir un sufijo numérico al slug cuando exista una colisión.
- Conservar el slug actual cuando se cambie el nombre durante Edit.
- Crear niños nuevos con `status: "active"`.
- Crear niños nuevos con la fecha local actual como `enrollmentDate`.
- Redirigir Add guardado al perfil del niño creado.
- Redirigir Edit guardado al perfil del niño actualizado.
- Cancelar Add hacia `/kids`.
- Cancelar Edit hacia el perfil del niño actual.
- Mostrar 404 cuando el `id` de edición no exista.
- Mostrar un error inline accesible y conservar los valores del formulario si falla la escritura JSON.
- Agrupar `/kids` por sala y mostrar únicamente salas que tengan niños.
- Actualizar perfiles, activación de cuenta y listados para resolver el nombre mediante `roomId`.
- Añadir alergias al menos a cuatro niños existentes.
- Mantener al menos dos niños con dos alergias.
- Conservar el niño creado y actualizado durante la validación como fixture determinista.
- Reutilizar componentes de `@/app/components/ui` cuando sea posible.
- Mantener Server Components por defecto y limitar los Client Components al estado y eventos del formulario.

**Out of scope (for future specs):**

- Base de datos.
- API pública o Route Handlers para la gestión de niños.
- Historial de salas del niño.
- Relación histórica entre `Kid` y `Room` con `startDate` y `endDate`.
- Eliminación de niños.
- Cambio manual del estado activo o inactivo desde el formulario.
- Gestión de personas, relaciones padre-niño o invitaciones desde este formulario.
- Vinculación de padres durante el alta o actualización.
- Autorización real para Server Actions.
- Sesiones y autenticación real.
- Unit tests o instalación de un framework de testing.
- Catálogo independiente de alergias.
- Validación clínica o interpretación médica de alergias.
- Persistencia remota o sincronización entre instancias.
- Edición manual del slug.

## Data model

Los modelos de dominio permanecerán en `app/features/kids/types/`. Los mocks persistidos vivirán en `app/data/mocks/kids/`.

```ts
type Room = {
  id: string;
  name: string;
};

type Kid = {
  id: string;
  slug: string;
  name: string;
  birthDate: string;
  roomId: string;
  enrollmentDate: string;
  medicalNotes: string;
  allergies: string;
  status: KidStatus;
};
```

Los archivos JSON contendrán arreglos directos:

- `app/data/mocks/kids/kids.json`: `Kid[]`.
- `app/data/mocks/kids/people.json`: `Person[]`.
- `app/data/mocks/kids/rooms.json`: `Room[]`.
- `app/data/mocks/kids/parent-kids.json`: `ParentKid[]`.

Las salas iniciales serán:

```json
[
  { "id": "room-soles", "name": "Soles" },
  { "id": "room-girasoles", "name": "Girasoles" },
  { "id": "room-patitos", "name": "Patitos" }
]
```

Todos los niños existentes usarán `roomId: "room-soles"` como sala inicial.

El formulario usará una proyección de edición equivalente a:

```ts
type KidFormValues = {
  name: string;
  birthDate: string;
  roomId: string;
  allergies: string;
  medicalNotes: string;
};
```

La fecha se presentará como `dd/mm/aaaa` y se convertirá a `YYYY-MM-DD` antes de persistirla.

Las alergias continuarán almacenándose como una cadena separada por comas. La interfaz podrá trabajar con `string[]` mientras edita.

## Implementation plan

1. Actualizar `Kid` para reemplazar `room` por `roomId`, crear y exportar `Room`, y actualizar los barrels públicos de Kids.
2. Crear `rooms.json` con `room-soles`, `room-girasoles` y `room-patitos`.
3. Migrar los fixtures actuales a `kids.json`, `people.json` y `parent-kids.json`, manteniendo IDs, relaciones y datos existentes.
4. Actualizar `kids.json` para que todos los niños existentes usen `room-soles` y para asignar alergias a Mateo, Tomás, Sofía y Lucas; Mateo y Tomás conservarán sus alergias actuales y recibirán una segunda etiqueta.
5. Crear un servicio server-only para leer colecciones JSON y resolver relaciones entre `Kid`, `Room`, `Person` y `ParentKid`.
6. Crear la escritura atómica del servicio JSON y las operaciones de alta y actualización de niños.
7. Crear validadores compartidos para nombre completo, fecha de nacimiento, sala, alergias y notas médicas.
8. Crear `TagsInput` en `app/components/ui/`, documentarlo con JSDoc, aceptar `className` y exportarlo desde el barrel público.
9. Crear el formulario de Kids dentro de `app/features/kids/components/`, usando componentes UI compartidos y los estilos de la referencia `agregar-nino.dc.html`.
10. Añadir la máscara visual `dd/mm/aaaa`, errores inline, atributos ARIA y estados requeridos, inválidos, foco, deshabilitado y carga.
11. Crear `/kids/new` con los campos vacíos, sala sin seleccionar y navegación de Cancelar hacia `/kids`.
12. Crear `/kids/[id]/edit`, cargar el niño por `id` desde el JSON y mostrar 404 cuando no exista.
13. Crear Server Actions para Add y Edit, validar nuevamente en servidor, generar UUID y slug en Add, conservar slug en Edit y revalidar `/kids` y el perfil afectado.
14. Conectar `KidsHeader` y `KidProfileHeader` con `/kids/new` y `/kids/[id]/edit` respectivamente.
15. Actualizar `/kids`, el perfil y la activación de cuenta para resolver y mostrar nombres de sala desde `roomId`.
16. Corregir el agrupamiento del listado para que una búsqueda pueda mostrar niños de varias salas en sus grupos correspondientes.
17. Crear y conservar el fixture de validación de Martina López con nacimiento `2023-05-15`, primero en Girasoles y luego actualizada a `Martina López Vega` en Patitos, conservando `slug: "martina-lopez"`, alergias `Polen, Ácaros` y la nota médica acordada.
18. Verificar Add, Edit, errores de validación, 404, responsive, accesibilidad, persistencia y navegación con Playwright, guardando capturas bajo `.playwright-mcp/Kids/`.
19. Ejecutar `npx eslint app`, `npx tsc --noEmit --incremental false`, `npm run build` y `git diff --check`.

## Acceptance criteria

- [ ] La spec se implementa únicamente después de pasar a estado `Approved`.
- [ ] Existe `Room` con exactamente los campos `id` y `name`.
- [ ] `Kid` contiene `roomId` y no contiene `room`.
- [ ] Existen `kids.json`, `people.json`, `rooms.json` y `parent-kids.json` bajo `app/data/mocks/kids/`.
- [ ] Los cuatro archivos JSON tienen arreglos directos como raíz.
- [ ] `rooms.json` contiene Soles, Girasoles y Patitos con los IDs acordados.
- [ ] Todos los niños existentes tienen `roomId: "room-soles"` antes de las pruebas de Add y Edit.
- [ ] `/kids/new` carga sin errores y usa la composición visual de `agregar-nino.dc.html`.
- [ ] `/kids/[id]/edit` carga sin errores para un niño existente.
- [ ] `+ Agregar niño` navega a `/kids/new`.
- [ ] `Editar` navega al perfil actual en `/kids/[id]/edit` usando el ID del niño.
- [ ] Add inicia nombre, fecha, alergias y notas vacíos.
- [ ] Add inicia Sala con `Selecciona una sala` sin valor seleccionado.
- [ ] Edit carga nombre, fecha, sala, alergias y notas del niño buscado por `id`.
- [ ] Un `id` inexistente en Edit produce una respuesta 404.
- [ ] `Nombre completo`, `Fecha de Nacimiento` y `Sala` muestran una señal visual de obligatoriedad.
- [ ] Los tres campos obligatorios incluyen `required` y errores accesibles cuando están vacíos.
- [ ] El nombre exige al menos dos palabras después de normalizar espacios.
- [ ] El nombre rechaza valores de más de 120 caracteres.
- [ ] La fecha acepta la máscara `dd/mm/aaaa` e inserta los separadores correspondientes.
- [ ] La fecha rechaza días o meses inexistentes.
- [ ] La fecha rechaza fechas futuras.
- [ ] Una fecha válida se persiste como `YYYY-MM-DD`.
- [ ] La sala solo acepta IDs presentes en `rooms.json`.
- [ ] `ALERGIAS (ETIQUETAS)` y `NOTAS MÉDICAS` son opcionales.
- [ ] Los campos opcionales muestran placeholders cuando están vacíos.
- [ ] Enter crea una etiqueta en `TagsInput`.
- [ ] Coma crea una etiqueta en `TagsInput`.
- [ ] Backspace elimina la última etiqueta cuando el texto pendiente está vacío.
- [ ] Cada etiqueta puede eliminarse mediante un control accesible.
- [ ] El texto pendiente se agrega como etiqueta al guardar.
- [ ] Las etiquetas se recortan y deduplican sin distinguir mayúsculas.
- [ ] Las alergias se persisten como una cadena separada por comas.
- [ ] Add genera un UUID para el niño nuevo.
- [ ] Add genera un slug único derivado del nombre.
- [ ] Edit conserva el slug cuando cambia el nombre.
- [ ] Add asigna `status: "active"`.
- [ ] Add asigna la fecha local actual como `enrollmentDate`.
- [ ] Guardar Add escribe el nuevo niño en `kids.json` y navega a su perfil.
- [ ] Guardar Edit actualiza el registro correspondiente en `kids.json` y navega a su perfil.
- [ ] Cancelar Add navega a `/kids` sin modificar JSON.
- [ ] Cancelar Edit navega al perfil actual sin modificar JSON.
- [ ] Un fallo de escritura muestra un error inline accesible y conserva los valores ingresados.
- [ ] Las Server Actions validan los datos independientemente de la validación del cliente.
- [ ] Las Server Actions no exponen acceso de filesystem al Client Component.
- [ ] Las escrituras JSON reemplazan el archivo de forma atómica.
- [ ] `/kids` muestra grupos separados para las salas que tienen niños.
- [ ] La búsqueda puede mostrar niños pertenecientes a más de una sala en sus grupos correspondientes.
- [ ] Los perfiles muestran el nombre de sala resuelto desde `roomId`.
- [ ] La activación de cuenta continúa mostrando el nombre de sala correcto después de la migración.
- [ ] Al menos cuatro niños tienen alergias en `kids.json`.
- [ ] Al menos dos niños tienen dos alergias.
- [ ] Mateo conserva `Maní` y recibe una segunda alergia.
- [ ] Tomás conserva `Lactosa` y recibe una segunda alergia.
- [ ] Sofía y Lucas tienen al menos una alergia.
- [ ] Martina López puede crearse desde Add con nacimiento `15/05/2023` y sala Girasoles.
- [ ] Martina puede actualizarse a `Martina López Vega`, sala Patitos, alergias `Polen, Ácaros` y la nota médica acordada.
- [ ] El registro actualizado de Martina conserva `slug: "martina-lopez"`.
- [ ] El fixture final contiene el registro persistido de Martina después de validar Add y Edit.
- [ ] No se implementan base de datos, API, autenticación, historial de salas, eliminación ni unit tests.
- [ ] La experiencia funciona en escritorio y móvil.
- [ ] Las capturas de verificación se almacenan bajo `.playwright-mcp/Kids/`.
- [ ] `npx eslint app` termina correctamente.
- [ ] `npx tsc --noEmit --incremental false` termina correctamente.
- [ ] `npm run build` termina correctamente.
- [ ] `git diff --check` termina correctamente.

## Decisions

- **Sí:** usar `/kids/new` y `/kids/[id]/edit` porque separa claramente Add y Edit y hace explícito que Edit recibe un ID.
- **Sí:** usar Server Actions porque la persistencia JSON debe permanecer en el servidor sin crear una API pública.
- **Sí:** usar JSON como fuente canónica de Kids porque permitirá reemplazar el almacenamiento por una BDD en una fase futura.
- **Sí:** separar `kids.json`, `people.json`, `rooms.json` y `parent-kids.json` para conservar una estructura cercana a futuras tablas y relaciones.
- **Sí:** usar arreglos directos como raíz porque cada archivo representa una colección.
- **Sí:** usar `people.json` y no `parents.json` porque `Person` también representa personal.
- **Sí:** usar `rooms.json` porque contiene una colección de salas.
- **Sí:** usar `parent-kids.json` porque coincide con el type `ParentKid` y el mock actual.
- **Sí:** usar `room-soles`, `room-girasoles` y `room-patitos` como IDs legibles y estables.
- **Sí:** representar la sala actual con `roomId`.
- **No:** crear todavía el historial de salas; la relación futura incluirá `startDate` y `endDate` en otra spec.
- **Sí:** conservar el slug en Edit para no romper URLs existentes.
- **Sí:** generar UUID en servidor y slug único desde el nombre en Add.
- **Sí:** usar `dd/mm/aaaa` como máscara de presentación y `YYYY-MM-DD` como formato persistido.
- **Sí:** usar una sala vacía en Add para obligar una decisión explícita.
- **Sí:** confirmar alergias con Enter o coma y convertir el texto pendiente al guardar.
- **Sí:** mantener `allergies` como string separado por comas en el modelo persistido.
- **Sí:** guardar el niño de validación de Martina como fixture final para demostrar persistencia real.
- **No:** usar localStorage porque no representa la persistencia JSON solicitada.
- **No:** conservar `kids-mock.ts` como fuente paralela porque produciría dos fuentes de verdad.
- **No:** agregar autorización temporal ficticia porque todavía no existen sesiones reales; la validación de entrada permanece obligatoria.
- **No:** agregar campos de estado o fecha de ingreso al formulario porque no aparecen en la referencia.
- **No:** implementar una entidad o catálogo independiente de alergias.

## Risks

| Risk                                                                                  | Mitigation                                                                                             |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| La escritura local en JSON no es durable en despliegues serverless o multi-instancia. | Documentar el almacenamiento como temporal y dejar la BDD para una spec posterior.                     |
| Dos escrituras simultáneas pueden perder cambios.                                     | Usar reemplazo atómico y centralizar las escrituras en el servicio server-only.                        |
| Las Server Actions no tienen autorización real.                                       | Validar cada payload en servidor y documentar que las sesiones quedan fuera de alcance.                |
| Cambiar `room` a `roomId` puede romper perfiles, Auth o listados.                     | Resolver el nombre de sala mediante un servicio y verificar todas las rutas consumidoras.              |
| Un slug cambiado podría romper enlaces existentes.                                    | Conservar el slug durante Edit y generar slug solo al crear.                                           |
| Etiquetas duplicadas o vacías pueden generar información inconsistente.               | Centralizar trim, deduplicación y serialización en la lógica del TagsInput y del servidor.             |
| Una fecha en formato local puede cambiar por zona horaria.                            | Trabajar con fechas de calendario y persistir directamente `YYYY-MM-DD`, sin convertirlas a timestamp. |

## What is **not** in this spec

- Base de datos, API pública o sincronización remota.
- Autenticación real, sesiones o autorización de usuarios.
- Historial de salas con `startDate` y `endDate`.
- Eliminación de niños.
- Gestión de padres, personal o relaciones desde el formulario.
- Vinculación de padres durante Add o Edit.
- Catálogo de alergias o validación clínica.
- Cambio manual de estado o fecha de ingreso.
- Edición manual del slug.
- Unit tests o framework de testing.
