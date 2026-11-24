# Delta de especificación

## Purpose

Permitir que el personal autenticado consulte y gestione los aspectos disponibles de su propia cuenta dentro del área de trabajo de la guardería.

## ADDED Requirements

### Requirement: Acceso a la cuenta del personal
El sistema MUST ofrecer `/account` únicamente a personas con una sesión activa y capacidad de acceso al área de personal, e identificar “Mi cuenta” como la sección actual en la navegación lateral y móvil.

#### Scenario: Acceso autorizado
- **WHEN** una persona con sesión activa y acceso al área de personal visita `/account`
- **THEN** el sistema muestra su página “Mi cuenta” con la sección de cuenta marcada como actual

#### Scenario: Acceso sin sesión
- **WHEN** una persona sin sesión activa intenta visitar `/account`
- **THEN** el sistema la redirige al inicio de sesión

### Requirement: Consulta de la información personal
El sistema MUST mostrar los datos de la persona autenticada dentro de su guardería: nombre, correo, teléfono, cargo y salas asignadas, sin exponer información perteneciente a otra persona o guardería.

#### Scenario: Perfil con asignaciones
- **WHEN** el personal abre su página de cuenta y tiene cargo y salas asignadas
- **THEN** el sistema muestra su nombre, correo, teléfono, cargo y salas correspondientes

#### Scenario: Perfil sin asignaciones opcionales
- **WHEN** el personal abre su página de cuenta sin cargo, teléfono o salas asignadas
- **THEN** el sistema presenta valores informativos apropiados sin impedir el uso de la página

### Requirement: Edición limitada del perfil
El sistema MUST permitir que la persona autenticada actualice únicamente su nombre y teléfono. El correo, cargo, roles y salas asignadas deben permanecer sin cambios durante esta operación.

#### Scenario: Apertura del formulario de edición
- **WHEN** la persona pulsa “Editar”
- **THEN** el sistema muestra un formulario con su nombre y teléfono actuales

#### Scenario: Actualización válida
- **WHEN** la persona envía un nombre válido y un teléfono vacío o válido
- **THEN** el sistema persiste ambos valores para esa persona y guardería y actualiza la información mostrada en la página y la navegación

#### Scenario: Datos de perfil inválidos
- **WHEN** la persona envía un nombre menor de dos caracteres o un teléfono no válido
- **THEN** el sistema no modifica el perfil y muestra errores asociados a los campos afectados

#### Scenario: Protección de datos no editables
- **WHEN** se procesa una actualización del perfil desde la página de cuenta
- **THEN** el correo, cargo, roles, estado y salas asignadas conservan sus valores existentes

### Requirement: Preferencias de notificación informativas
El sistema MUST mostrar “Nuevos comentarios de familias” y “Recordatorio de resumen (17:00)” como interruptores activados pero deshabilitados, sin permitir cambios ni persistir preferencias.

#### Scenario: Presentación de notificaciones
- **WHEN** la persona abre su página de cuenta
- **THEN** ambos interruptores aparecen activados visualmente y no admiten interacción

### Requirement: Cambio de contraseña
El sistema MUST permitir que la persona autenticada cambie su contraseña mediante una nueva contraseña y su confirmación, exigiendo un mínimo de ocho caracteres y manteniendo activa la sesión después del cambio correcto.

#### Scenario: Cambio de contraseña válido
- **WHEN** la persona envía dos valores coincidentes de al menos ocho caracteres
- **THEN** el sistema actualiza su contraseña, conserva la sesión activa y muestra una confirmación

#### Scenario: Contraseña demasiado corta
- **WHEN** la persona envía una nueva contraseña menor de ocho caracteres
- **THEN** el sistema no cambia la contraseña y muestra el requisito mínimo

#### Scenario: Confirmación diferente
- **WHEN** la nueva contraseña y su confirmación no coinciden
- **THEN** el sistema no cambia la contraseña y muestra un error de confirmación

#### Scenario: Cuenta sin credencial modificable
- **WHEN** la persona intenta cambiar la contraseña y no existe una credencial asociada
- **THEN** el sistema conserva la contraseña sin cambios y comunica que la cuenta no tiene una contraseña configurada

### Requirement: Ayuda y soporte no disponible
El sistema MUST mostrar “Ayuda y soporte” como una opción deshabilitada, sin navegación ni acción asociada.

#### Scenario: Presentación de ayuda y soporte
- **WHEN** la persona abre su página de cuenta
- **THEN** la opción “Ayuda y soporte” aparece visible y no admite interacción

### Requirement: Cierre de sesión desde la cuenta
El sistema MUST permitir cerrar la sesión desde la página de cuenta y regresar al inicio de sesión.

#### Scenario: Cierre de sesión correcto
- **WHEN** la persona pulsa “Cerrar sesión”
- **THEN** el sistema finaliza su sesión y la redirige al inicio de sesión

### Requirement: Experiencia adaptable y accesible
El sistema MUST mantener el contenido de la cuenta utilizable en vistas de escritorio y móvil, con controles identificables, estados deshabilitados perceptibles y mensajes de validación anunciables.

#### Scenario: Uso en pantalla móvil
- **WHEN** la persona abre `/account` en una pantalla móvil
- **THEN** el contenido permanece legible y operativo junto con la navegación móvil

#### Scenario: Uso con tecnologías de asistencia
- **WHEN** una persona recorre la página mediante teclado o tecnología de asistencia
- **THEN** los controles, diálogos, errores y estados deshabilitados comunican correctamente su propósito y estado
