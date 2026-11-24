# Diseño

## Contexto

Véase `proposal.md` para la motivación. Actualmente las rutas familiar y de personal mantienen copias casi equivalentes de `AccountProfileForm`, `PasswordForm` y parte de la presentación modal. Las Server Actions son distintas porque cada ruta aplica una autorización diferente y deben permanecer en sus respectivos límites de aplicación.

Los componentes compartidos no deben importar acciones de rutas, infraestructura, composición ni configuración privada. La reutilización debe vivir en Presentation y recibir mediante props únicamente valores serializables, acciones server válidas y configuración visual necesaria.

## Objetivos / No objetivos

**Objetivos:**

- Tener una única implementación visual de los formularios de perfil y contraseña.
- Compartir la presentación común de los diálogos de cuenta cuando no introduzca acoplamiento.
- Mantener independientes las Server Actions, validaciones de autorización y mensajes propios de cada ruta.
- Preservar los identificadores accesibles, estados de carga, errores y mensajes actuales.
- Permitir que familia y personal continúen utilizando sus CSS Modules y composiciones de página sin duplicar la lógica del formulario.

**No objetivos:**

- Cambiar permisos, reglas de validación, persistencia o textos funcionales.
- Fusionar las Server Actions de familia y personal.
- Crear un formulario genérico para dominios no relacionados con cuentas.
- Cambiar rutas, modelos de dominio o contratos PostgreSQL.
- Introducir una librería de formularios o una dependencia externa.

## Decisiones

### 1. Componentes compartidos en Presentation

Se creará un módulo reutilizable bajo `src/presentation/account/`, con una API pública para los formularios y, si resulta estable, para el modal. Los consumidores de familia y personal importarán desde el barrel público de ese módulo.

Se descarta colocar los componentes compartidos dentro de una de las rutas, porque convertiría una ruta en dependencia de otra y conservaría un límite incorrecto de responsabilidades. También se descarta crear `src/components`, que no forma parte de la arquitectura del repositorio.

### 2. Acciones server inyectadas por props

`AccountProfileForm` y `PasswordForm` recibirán una acción compatible con `useActionState`, el estado inicial y los valores iniciales necesarios. El componente compartirá estructura, accesibilidad, estados de carga y presentación de errores, pero no conocerá si la acción pertenece a una familia o al personal.

Las acciones continuarán en:

- `src/app/(general)/family-feed/account/_actions/`.
- `src/app/(staff)/account/_actions/`.

Esto conserva el control de sesión y autorización en el servidor y evita que un componente reutilizable se convierta en un punto de acceso a datos.

### 3. Estado común estructural, mensajes configurables

Se definirá un contrato pequeño para errores de `name`, `phone`, `password` y `confirmation`, junto con `message`. Los formularios aceptarán etiquetas, textos de progreso y nombres base de campos cuando sea necesario para evitar colisiones de IDs.

Los mensajes y políticas seguirán perteneciendo a las Server Actions. El componente solo mostrará los errores recibidos y no duplicará reglas de negocio.

### 4. Modal común con configuración de estilos

Se extraerá un `AccountModal` reutilizable únicamente para el comportamiento común: diálogo modal, título, cierre explícito, foco inicial, Escape y restauración de foco. Recibirá `className` o un contrato de clases para que familia y personal puedan conservar sus estilos actuales.

Si la diferencia de estilos impide una API clara, se compartirá primero solo la capa de formularios y se mantendrán los modales locales. La decisión se resolverá durante la implementación sin cambiar el comportamiento observable.

### 5. Migración incremental de consumidores

Se migrará primero la cuenta familiar, que sirve como comportamiento de referencia, y después la cuenta del personal. Tras cada migración se eliminarán los archivos duplicados únicamente cuando ningún consumidor los importe.

La comparación debe verificar que familia mantiene su autorización `parent` y que personal mantiene `requireStaffSession`, además de que cada ruta sigue usando su hoja de estilos y sus textos.

### 6. Verificación de no regresión

La refactorización se validará con TypeScript, ESLint focalizado, build y recorridos de ambas páginas. Los escenarios incluirán abrir/cerrar diálogos, validación de campos, estados de carga y mensajes de éxito o error. No habrá migraciones ni pruebas que escriban datos remotos sin una transacción controlada.

## Riesgos / Trade-offs

- **[Riesgo] Una API demasiado genérica puede ocultar diferencias importantes entre rutas.** → Mantener props pequeñas y dejar acciones, autorización y mensajes en cada consumidor.
- **[Riesgo] IDs repetidos si ambas variantes se renderizan en la misma página.** → Aceptar un prefijo o `idPrefix` obligatorio para campos y diálogos.
- **[Riesgo] Compartir estilos puede degradar la fidelidad visual existente.** → Compartir estructura y permitir clases recibidas; no forzar un CSS global innecesario.
- **[Riesgo] Mover una Server Action al módulo Presentation rompe la frontera server/client.** → Mantener todas las acciones en `_actions` de sus rutas y pasarlas como referencias server válidas.
- **[Trade-off] Puede mantenerse una pequeña diferencia entre modales si sus estilos no son compatibles.** → Priorizar la reutilización segura de formularios sobre una abstracción visual artificial.

## Plan de migración

1. Crear el módulo Presentation reutilizable y sus contratos de props.
2. Migrar el formulario de perfil y el de contraseña de la cuenta familiar y verificar su comportamiento.
3. Migrar los formularios equivalentes de la cuenta del personal y verificar sus acciones propias.
4. Extraer el modal común si la API de clases resulta estable; de lo contrario, conservar modales locales.
5. Eliminar duplicados sin consumidores y ejecutar TypeScript, ESLint, build y recorridos funcionales.
6. El rollback consiste en restaurar los imports y componentes locales; no hay cambios de base de datos ni migración operativa.
