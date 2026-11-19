# Propuesta

## Por qué

El área de personal muestra “Mi cuenta” en su navegación, pero todavía no ofrece una página donde la persona autenticada pueda consultar y actualizar sus datos, gestionar su contraseña o cerrar sesión desde el contenido principal. Esta incorporación completa ese recorrido siguiendo la experiencia ya disponible para las familias y el diseño de referencia del proyecto.

## Qué cambia

- Se incorpora la página de cuenta del personal en `/account`, accesible desde la navegación lateral y móvil, con la sección correspondiente marcada como activa.
- Se presenta la información de la persona autenticada: nombre, correo, teléfono, cargo y salas asignadas.
- Se permite editar y persistir únicamente el nombre y el teléfono; el correo, el cargo y las salas permanecen informativos.
- Se muestran las preferencias “Nuevos comentarios de familias” y “Recordatorio de resumen (17:00)” como interruptores activados pero deshabilitados, sin persistencia ni comportamiento asociado.
- Se permite cambiar la contraseña con las mismas validaciones y comportamiento de la cuenta familiar.
- Se muestra “Ayuda y soporte” como una opción deshabilitada.
- Se permite cerrar la sesión desde la página y regresar al inicio de sesión.

## Capacidades

### Capacidades nuevas

- `staff-account`: Consulta y gestión de la cuenta de la persona autenticada dentro del área de personal, incluyendo perfil, contraseña, opciones informativas y cierre de sesión.

### Capacidades modificadas

Ninguna.

## Impacto

- Nueva ruta autenticada `/account` dentro del área de personal.
- Navegación lateral y móvil del personal.
- Lectura tenant-scoped de los datos de la persona y sus asignaciones.
- Actualización PostgreSQL del nombre y teléfono sin modificar correo, roles, cargo ni salas.
- Integración con los casos de uso existentes de cambio de contraseña y cierre de sesión.
- Nuevos componentes, acciones, estilos y pruebas específicos de la ruta de cuenta del personal.
- No requiere cambios en el esquema de base de datos ni introduce APIs públicas o dependencias externas.
