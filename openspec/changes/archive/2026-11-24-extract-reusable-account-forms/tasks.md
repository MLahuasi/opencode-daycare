# Tareas

## 1. Contratos y componentes compartidos

- [x] 1.1 Crear el módulo público `src/presentation/account/` con los tipos compartidos de estado, acciones y configuración visual; verificar que no importe rutas, Server Actions concretas, composición ni Infrastructure.
- [x] 1.2 Implementar el formulario reutilizable de perfil para nombre y teléfono usando `useActionState`, valores iniciales, estados de carga, errores ARIA y mensaje de resultado; verificar que acepte acciones de familia y personal mediante props.
- [x] 1.3 Implementar el formulario reutilizable de contraseña con nueva contraseña, confirmación, estados de carga y errores ARIA; verificar que no contenga reglas de autorización ni dependa de una acción concreta.
- [x] 1.4 Extraer el modal de cuenta común con título accesible, cierre explícito, Escape, foco inicial y restauración de foco; verificar que soporte las clases visuales de ambas rutas sin duplicar la estructura del diálogo.

## 2. Migración de la cuenta familiar

- [x] 2.1 Sustituir los formularios y el modal locales de `family-feed/account` por los componentes reutilizables, conservando `updateAccountAction` y `changePasswordAction`; verificar que la ruta familiar mantenga su autorización de padre y sus mensajes actuales.
- [x] 2.2 Eliminar únicamente los componentes familiares duplicados que ya no tengan consumidores; verificar con búsqueda de imports que no queden referencias rotas.
- [x] 2.3 Ejecutar el recorrido de la cuenta familiar para apertura, cierre, validación, guardado de perfil y cambio de contraseña; verificar que la interfaz y la persistencia no cambien.

## 3. Migración de la cuenta del personal

- [x] 3.1 Sustituir los formularios y el modal locales de `(staff)/account` por los componentes reutilizables, conservando `updateStaffAccountAction` y `changeStaffPasswordAction`; verificar que la ruta siga restringida al personal.
- [x] 3.2 Eliminar únicamente los componentes del personal duplicados que ya no tengan consumidores; verificar con búsqueda de imports que no queden referencias rotas.
- [x] 3.3 Ejecutar el recorrido de `/account` para edición de perfil, cambio de contraseña, estados de error, controles deshabilitados y cierre de sesión; verificar que se mantenga el comportamiento implementado en `add-staff-account-page`.

## 4. Verificación de no regresión

- [x] 4.1 Comparar los contratos de props, identificadores y mensajes antes y después de la migración; verificar que familia y personal conserven sus Server Actions, permisos y estilos propios.
- [x] 4.2 Ejecutar `npx eslint src`, `npx tsc --noEmit --incremental false` y `npm run build`; corregir errores introducidos por la extracción y confirmar que no se añadan dependencias ni cambios de base de datos.
- [x] 4.3 Ejecutar una revisión final de arquitectura y actualizar cualquier documentación técnica afectada; verificar que los componentes compartidos solo dependan de Presentation y contratos serializables.

## Seguimiento del workflow

- Verificar el cambio con OpenSpec después de completar todas las tareas.
- Archivar el cambio únicamente después de revisar la refactorización y sus verificaciones.
