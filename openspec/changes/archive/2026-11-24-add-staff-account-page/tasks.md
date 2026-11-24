# Tareas

## 1. Contratos y persistencia de la cuenta

- [x] 1.1 Definir en Application la proyección, los puertos y los casos de uso de lectura y actualización limitada de la cuenta del personal; verificar mediante TypeScript que solo nombre y teléfono formen parte del comando de escritura.
- [x] 1.2 Implementar el adapter PostgreSQL tenant-scoped para consultar perfil, cargo y salas y actualizar únicamente `name`, `phone` y `updated_at`; añadir comprobaciones transaccionales que cubran aislamiento entre guarderías y conservación de correo, estado, roles, cargo y salas.
- [x] 1.3 Ensamblar la capacidad en `src/composition/staff/` y exponerla mediante los barrels públicos correspondientes; verificar que ningún módulo de Application o Presentation importe Infrastructure directamente.

## 2. Ruta, navegación y consulta del perfil

- [x] 2.1 Enlazar “Mi cuenta” a `/account` en la navegación del personal y crear la página protegida bajo `(staff)` con `StaffSidebar` marcado en `account`; verificar el acceso autorizado en escritorio y móvil y la redirección al login sin sesión.
- [x] 2.2 Renderizar la tarjeta con avatar, nombre, correo, teléfono, cargo y salas usando la proyección tenant-scoped y valores informativos para datos opcionales ausentes; verificar que coincida con `references/screens/mi-cuenta.dc.html` sin introducir datos simulados.
- [x] 2.3 Documentar `/account` entre las rutas oficiales del README y verificar que la descripción refleje su restricción al personal autenticado.

## 3. Edición segura del perfil

- [x] 3.1 Implementar el diálogo y formulario privados de la ruta para editar nombre y teléfono, con foco inicial, cierre explícito y con Escape, restauración de foco y errores asociados; verificar su operación por teclado y tecnología de asistencia.
- [x] 3.2 Implementar la Server Action de perfil con sesión de personal, nombre mínimo de dos caracteres, normalización de teléfono y delegación al caso de uso; verificar estados válido, teléfono vacío, nombre inválido, teléfono inválido y fallo de persistencia.
- [x] 3.3 Invalidar la vista de cuenta tras una actualización correcta y verificar que tarjeta y perfil lateral muestran el nuevo nombre mientras correo, cargo, estado, roles y salas permanecen intactos.

## 4. Seguridad y opciones informativas

- [x] 4.1 Implementar el diálogo y formulario de cambio de contraseña mediante el caso de uso Auth existente; verificar éxito con sesión conservada, mínimo de ocho caracteres, confirmación diferente, credencial ausente y error inesperado.
- [x] 4.2 Mostrar los interruptores activados y deshabilitados para “Nuevos comentarios de familias” y “Recordatorio de resumen (17:00)”, sin estado ni acción de persistencia; verificar que no admitan interacción con puntero o teclado.
- [x] 4.3 Mostrar “Ayuda y soporte” como opción deshabilitada e integrar el `LogoutButton` visible para cerrar sesión; verificar que ayuda no navegue y que cerrar sesión redirija a `/auth/login`.

## 5. Presentación e integración

- [x] 5.1 Añadir estilos responsive mediante CSS Module y tokens semánticos existentes, sin colores literales; verificar visualmente la página a tamaños de escritorio y móvil y guardar los artefactos Playwright en `.playwright-mcp/StaffAccount/`.
- [x] 5.2 Ejecutar el recorrido integrado de `/account` con una cuenta local de desarrollo: navegación activa, datos persistidos, validaciones de perfil, cambio y restauración de contraseña, controles deshabilitados y cierre de sesión; verificar todos los escenarios de `staff-account` sin modificar datos remotos.
- [x] 5.3 Ejecutar `npx eslint src`, `npx tsc --noEmit --incremental false` y `npm run build`; corregir cualquier error y confirmar que no se añadieron migraciones, fixtures runtime ni cruces de capas prohibidos.

## Seguimiento del workflow

- Verificar el cambio con OpenSpec después de completar todas las tareas.
- Archivar el cambio únicamente después de revisar la implementación y la verificación.
