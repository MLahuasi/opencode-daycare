# SPEC 04 — Etiquetas de alergias en tarjetas

> **Status:** Implemented
> **Depends on:** SPEC 03
> **Date:** 2026-09-16
> **Objective:** Añadir alergias etiquetadas al modelo de niños y mostrarlas en las tarjetas de `/kids` mediante una proyección segura y reutilizable.

## Scope

**In:**

- Añadir `allergies: string` al modelo `Kid`.
- Usar una cadena vacía cuando un niño no tenga alergias.
- Crear una utilidad transversal para convertir cadenas separadas por comas en etiquetas.
- Separar por comas, aplicar `trim()`, eliminar valores vacíos y eliminar duplicados sin distinguir mayúsculas.
- Conservar el orden y la escritura de la primera aparición de cada etiqueta.
- Proyectar las alergias a `KidListItem` como `string[]` seguro para el listado.
- Mantener las alergias de la plantilla: `Maní` para Mateo Fernández y `Lactosa` para Tomás Díaz.
- Mantener sin alergias a los demás niños del fixture.
- Alinear las `medicalNotes` de Mateo con la alergia al maní mostrada en la plantilla.
- Mostrar todas las etiquetas de alergia en la tarjeta y permitir que hagan wrap.
- Alternar las variantes existentes de `Badge` en el orden `coral`, `pink`, `green`, `yellow`, `blue`, `purple`.
- Mantener el texto visual de las etiquetas en mayúsculas mediante el estilo existente de `Badge`.
- Mostrar `VINCULAR` cuando el niño no tenga padres vinculados y `shouldLinkParent` sea verdadero.
- Mostrar alergias y `VINCULAR` simultáneamente cuando ambos estados correspondan.
- Mostrar la flecha actual cuando no haya alergias y el niño tenga padres vinculados.
- No mostrar flecha cuando existan etiquetas de alergia.
- Mantener el perfil `/kids/[slug]` basado en `medicalNotes`, sin agregar badges de alergia en esta spec.
- Mantener el filtrado, la navegación, la 404 y el comportamiento responsive existentes.

**Out of scope (for future specs):**

- Formulario para registrar o editar alergias.
- Alta, edición o eliminación de niños.
- Persistencia local, base de datos, API o sincronización remota.
- Validación clínica o interpretación médica de las etiquetas.
- Catálogo de alergias, IDs de alergias o entidad independiente `Allergy`.
- Mostrar badges de alergia en el perfil del niño.
- Cambiar `medicalNotes` de niños distintos de Mateo.
- Cambiar la navegación o implementar rutas de Avisos y Mi cuenta.
- Cambiar la lógica de vinculación de padres o validar códigos de invitación.

## Data model

Los tipos de dominio continuarán en `app/features/kids/types/` y los fixtures en `app/data/mocks/kids/`.

```ts
type Kid = {
  id: string;
  slug: string;
  name: string;
  birthDate: string;
  room: string;
  enrollmentDate: string;
  medicalNotes: string;
  allergies: string;
  parentIds: string[];
};

type KidListItem = {
  slug: string;
  name: string;
  room: string;
  initial: string;
  age: number;
  parentCount: number;
  avatarTone: string;
  shouldLinkParent: boolean;
  allergies: string[];
};
```

La utilidad transversal se expondrá desde `@/app/shared`:

```ts
parseCommaSeparatedTags(value: string): string[];
```

La función devolverá `[]` para una cadena vacía. Para cada segmento aplicará `trim()`, descartará valores vacíos y eliminará duplicados comparando sin distinguir mayúsculas. No eliminará tildes al comparar. La primera aparición conservará su texto original ya recortado.

## Implementation plan

1. Añadir `allergies: string` a `Kid` y `allergies: string[]` a `KidListItem`, actualizando sus barrels públicos.
2. Crear `app/shared/utils/tags.ts` con `parseCommaSeparatedTags`, exportarla desde `app/shared/utils/index.ts` y `app/shared/index.ts`, y cubrir sus reglas con una verificación ejecutable.
3. Actualizar los ocho fixtures de Kids con `allergies: "Maní"` para Mateo, `allergies: "Lactosa"` para Tomás y `allergies: ""` para los demás; alinear las notas médicas de Mateo.
4. Proyectar `Kid.allergies` a `KidListItem.allergies` en el Server Component de `/kids`, sin entregar `medicalNotes`, `parentIds`, `email` ni `code` al Client Component.
5. Actualizar `KidCard` para mostrar todas las etiquetas mediante `Badge`, alternar sus variantes en el orden acordado y resolver los estados combinados de alergias, `VINCULAR` y flecha.
6. Ajustar estilos responsive de las tarjetas para que varias etiquetas hagan wrap sin ocultar el nombre, la edad ni la cantidad de padres.
7. Ejecutar la verificación de aceptación de SPEC 03 y los nuevos criterios de alergias en `/kids`, incluyendo filtros, payload, navegación, escritorio, móvil y perfiles existentes.

## Acceptance criteria

- [x] `Kid` declara `allergies: string`.
- [x] `KidListItem` declara `allergies: string[]`.
- [x] `parseCommaSeparatedTags` está disponible desde `@/app/shared`.
- [x] Una cadena vacía produce `[]`.
- [x] La utilidad separa por comas, recorta espacios y descarta segmentos vacíos.
- [x] La utilidad elimina duplicados sin distinguir mayúsculas y conserva la primera aparición recortada.
- [x] La utilidad no considera iguales `Maní` y `mani` por diferencias de tildes.
- [x] Mateo tiene `allergies: "Maní"` en el fixture.
- [x] Tomás tiene `allergies: "Lactosa"` en el fixture.
- [x] Los otros seis niños tienen `allergies: ""`.
- [x] Las notas médicas de Mateo son coherentes con la alergia al maní de la plantilla.
- [x] `/kids` muestra la etiqueta `MANÍ` en la tarjeta de Mateo.
- [x] `/kids` muestra la etiqueta `LACTOSA` en la tarjeta de Tomás.
- [x] Las tarjetas no muestran etiquetas de alergia para niños cuyo parser devuelve `[]`.
- [x] Todas las etiquetas de una tarjeta se muestran y pueden envolver su contenido en varias líneas.
- [x] Las variantes de badges siguen el ciclo `coral`, `pink`, `green`, `yellow`, `blue`, `purple`.
- [x] Un niño con alergias y sin padres vinculados muestra sus alergias y `VINCULAR`.
- [x] Un niño con alergias y padres vinculados muestra sus alergias sin flecha.
- [x] Un niño sin alergias y sin padres vinculados muestra `VINCULAR`.
- [x] Un niño sin alergias y con padres vinculados muestra la flecha de navegación.
- [x] Las tarjetas continúan navegando al slug canónico correspondiente.
- [x] `medicalNotes` continúa sin aparecer ni serializarse en el listado.
- [x] El Client Component recibe solamente `KidListItem[]` y no importa mocks.
- [x] Los badges de alergia no se agregan al perfil `/kids/[slug]`.
- [x] El perfil continúa mostrando `medicalNotes` sin cambios funcionales.
- [x] La búsqueda por nombre, la 404 y la navegación existente continúan funcionando.
- [x] La experiencia con múltiples etiquetas funciona en escritorio y móvil.
- [x] `npx eslint app` termina correctamente.
- [x] `npx tsc --noEmit --incremental false` termina correctamente.
- [x] `npm run build` termina correctamente.
- [x] Las capturas de verificación se almacenan bajo `.playwright-mcp/Kids/`.

## Decisions

- **Sí:** almacenar `allergies` como `string` separado por comas porque representa el formato canónico definido para una futura captura de datos.
- **No:** almacenar `allergies` como `string[]` en `Kid`; el arreglo se genera únicamente para presentación.
- **Sí:** ubicar el parser en `app/shared/utils/tags.ts` porque la conversión de etiquetas puede reutilizarse en otros dominios.
- **Sí:** eliminar duplicados sin distinguir mayúsculas y conservar la primera escritura porque evita badges repetidos sin alterar el texto ingresado.
- **No:** ignorar tildes al deduplicar porque la regla confirmada solo normaliza mayúsculas.
- **Sí:** conservar `allergies: ""` en fixtures sin alergias porque el campo es obligatorio y no requiere un valor especial.
- **Sí:** mostrar todas las alergias en la tarjeta porque ocultar etiquetas podría ocultar información relevante.
- **Sí:** alternar todas las variantes existentes de `Badge` para distinguir visualmente etiquetas múltiples sin crear colores nuevos.
- **Sí:** mantener `medicalNotes` únicamente en el perfil y no duplicar información médica extensa en el listado.
- **No:** implementar registro o edición de alergias; corresponde a una futura spec de captura y persistencia.
- **No:** agregar una entidad `Allergy` o un catálogo porque esta entrega solo necesita etiquetas libres.

## Risks

| Risk                                                               | Mitigation                                                                                      |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Una cadena mal formada puede generar badges vacíos o duplicados.   | Centralizar `trim()`, descarte de vacíos y deduplicación en `parseCommaSeparatedTags`.          |
| Muchas alergias pueden romper la composición de la tarjeta.        | Usar un contenedor con wrap y verificar tarjetas con múltiples etiquetas en escritorio y móvil. |
| El DTO puede exponer accidentalmente información médica adicional. | Proyectar únicamente `allergies: string[]` y verificar el HTML y payload del listado.           |
| La nota médica y la etiqueta pueden quedar inconsistentes.         | Alinear el fixture y verificar Mateo contra la plantilla.                                       |

## What is **not** in this spec

- Formulario o flujo para registrar alergias.
- Edición, eliminación o persistencia de alergias.
- API, base de datos o sincronización remota.
- Catálogo o entidad independiente de alergias.
- Badges de alergia en el perfil.
- Exposición de `medicalNotes` en las tarjetas.
- Cambios a la vinculación de padres o validación de códigos.
