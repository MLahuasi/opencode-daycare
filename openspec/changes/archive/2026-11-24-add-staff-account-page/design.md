# Diseño

## Contexto

Véase `proposal.md` para la motivación. La navegación del personal ya declara la opción “Mi cuenta”, pero no tiene destino. El shell del personal obtiene nombre, cargo y salas mediante una proyección PostgreSQL tenant-scoped; la entidad `people` ya contiene correo y teléfono. La cuenta familiar ofrece patrones de interfaz para editar perfil, cambiar contraseña y cerrar sesión, aunque sus componentes y acciones son privados de esa ruta.

El repositorio aplica arquitectura por capas: las rutas adaptan entradas, Application define casos de uso y puertos, Infrastructure implementa PostgreSQL y Composition realiza el ensamblaje. La actualización genérica actual de personas también reemplaza correo, estado y roles, por lo que no es adecuada para una edición limitada del perfil propio.

## Objetivos / No objetivos

**Objetivos:**

- Añadir `/account` al área autenticada del personal con la experiencia visual del prototipo `references/screens/mi-cuenta.dc.html`.
- Consultar el perfil con aislamiento por `daycareId` y `personId` procedentes exclusivamente de la sesión.
- Actualizar nombre y teléfono mediante una operación PostgreSQL estrecha que no pueda modificar correo, cargo, estado, roles ni salas.
- Reutilizar los casos de uso y componentes públicos existentes cuando sus límites lo permitan.
- Mantener componentes interactivos accesibles y una presentación adaptable.

**No objetivos:**

- Persistir preferencias o enviar notificaciones.
- Implementar un canal de ayuda y soporte.
- Permitir editar correo, cargo, roles, estado o asignaciones de salas.
- Cambiar el esquema de PostgreSQL, la política de contraseñas o la cuenta familiar.
- Introducir dependencias externas de interfaz.

## Decisiones

### 1. Ruta de personal protegida y navegación existente

Se creará `src/app/(staff)/account/page.tsx`. La página exigirá `requireStaffSession()` y construirá el `StaffSidebar` con `activeSection="account"`. La configuración de navegación asignará `href: "/account"` al elemento existente “Mi cuenta”, habilitando el mismo destino en escritorio y móvil.

Se elige el grupo `(staff)` porque conserva la URL pública `/account` y comunica el límite de autorización. Se descarta ubicarla bajo `(general)` o `/family-feed`, ya que mezclaría shells y políticas de acceso diferentes.

### 2. Capacidad de cuenta separada del Staff Shell

Application incorporará contratos específicos de cuenta del personal: una proyección de lectura con nombre, correo, teléfono, cargo y salas, y una operación de actualización limitada a nombre y teléfono. Composition ensamblará estos contratos con un adapter PostgreSQL server-only.

Se prefiere una capacidad `staff-account` separada en lugar de ampliar la proyección del Staff Shell: el shell solo necesita datos de navegación, mientras la cuenta maneja información y escrituras adicionales. Ambas pueden compartir el cliente PostgreSQL sin acoplar Presentation a Infrastructure.

### 3. Escritura estrecha y tenant-scoped

El adapter actualizará exclusivamente `people.name`, `people.phone` y `updated_at`, filtrando simultáneamente por `daycare_id` e `id`. Los identificadores llegarán de la sesión, nunca del formulario. La ausencia de una fila coincidente se tratará como una cuenta no disponible.

Se descarta reutilizar `PostgresPersonRepository.update`, porque esa operación reemplaza también correo, estado y asignaciones de roles. La escritura específica reduce el riesgo de escalada de privilegios o cambios accidentales en datos no editables.

### 4. Server Actions como adaptadores de los formularios

La ruta tendrá Server Actions privadas para perfil y contraseña. La acción de perfil volverá a exigir una sesión de personal, normalizará el teléfono mediante la regla de dominio existente, validará el nombre y delegará la escritura a Application. Tras el éxito invalidará `/account` para refrescar la tarjeta y el perfil del shell.

La acción de contraseña delegará en `changePassword` mediante `createAuthComposition()`, manteniendo la política y los errores existentes. No importará la acción privada de la cuenta familiar; se reutilizará el caso de uso estable y se adaptarán sus resultados al formulario de personal.

### 5. Componentes privados de ruta y UI pública existente

Los formularios, el coordinador de diálogos y los estilos vivirán bajo `src/app/(staff)/account/_components`, `_actions` y un CSS Module próximo a la ruta. Se reutilizarán `StaffSidebar`, `LogoutButton`, `Avatar`, `Button`, `FormField` y `CheckboxField` desde sus APIs públicas.

Los diálogos expondrán nombre accesible, cierre explícito, cierre con Escape, foco inicial y restauración del foco al control que los abrió. Los mensajes usarán regiones anunciables y los campos asociarán errores mediante atributos ARIA. No se extraerán abstracciones compartidas con la cuenta familiar hasta que exista un segundo consumidor real fuera de sus límites privados.

### 6. Opciones deliberadamente no interactivas

Las dos preferencias de notificación se renderizarán marcadas y deshabilitadas; no tendrán estado de cliente, Server Action ni almacenamiento. “Ayuda y soporte” será un botón deshabilitado. Esta representación evita sugerir que una interacción se guardó cuando la capacidad todavía no existe.

### 7. Verificación sin cambios de esquema

No se añadirá migración porque todas las columnas y relaciones necesarias existen. La verificación combinará revisión de los contratos y consultas tenant-scoped, validación de los estados de formularios, recorrido Playwright de `/account` en escritorio y móvil, ESLint, TypeScript y build de producción.

## Riesgos / Trade-offs

- **[Riesgo] La acción de perfil podría modificar datos no autorizados si usa el repositorio genérico.** → Crear y probar una operación SQL estrecha que solo acepte nombre y teléfono y filtre por guardería y persona.
- **[Riesgo] Los controles visualmente activos de notificaciones pueden interpretarse como preferencias reales.** → Mantenerlos deshabilitados y con semántica accesible de indisponibilidad; no añadir estado local.
- **[Riesgo] Duplicación menor entre formularios de cuenta familiar y personal.** → Reutilizar dominio, casos de uso y UI pública, pero conservar adaptadores privados por política de acceso; extraer una abstracción solo si aparece una reutilización estable.
- **[Riesgo] Un cambio de nombre puede dejar datos anteriores en partes ya renderizadas.** → Invalidar `/account` después de guardar y mantener las proyecciones del shell como lecturas dinámicas de PostgreSQL.
- **[Trade-off] La ayuda permanece visible sin destino.** → El estado deshabilitado preserva el diseño acordado sin inventar un canal de soporte.

## Plan de migración

1. Desplegar los contratos, adapter y composición de cuenta junto con la nueva ruta y su enlace de navegación.
2. Verificar acceso, aislamiento tenant-scoped, edición de perfil, contraseña, cierre de sesión y presentación responsive.
3. No ejecutar migraciones ni seeds.
4. Para rollback, retirar la ruta y restaurar la navegación sin `href`; los datos persistidos siguen siendo compatibles porque no cambia el esquema.
