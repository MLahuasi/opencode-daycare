# Propuesta

## Por qué

La cuenta familiar y la cuenta del personal contienen implementaciones duplicadas para editar el perfil, cambiar la contraseña y presentar los diálogos. Esta duplicación aumenta el coste de mantenimiento y puede provocar diferencias de accesibilidad o comportamiento entre ambas experiencias.

## Qué cambia

- Extraer formularios reutilizables para editar nombre y teléfono.
- Extraer el formulario reutilizable para cambiar la contraseña.
- Extraer, cuando corresponda, la presentación común de los diálogos de cuenta.
- Mantener las Server Actions y las reglas de autorización específicas de cada contexto:
  - Familia: acciones limitadas a personas con rol `parent`.
  - Personal: acciones limitadas a sesiones del área de personal.
- Permitir que cada ruta conserve sus estilos, textos y estados particulares mediante props o configuración explícita.
- Sustituir las implementaciones duplicadas de familia y personal por los componentes compartidos.
- No modificar el comportamiento visible, las validaciones, la persistencia ni los permisos actuales.

## Capacidades

### Nuevas capacidades

Ninguna. Este cambio es una refactorización interna y no introduce comportamiento funcional nuevo.

### Capacidades modificadas

Ninguna. Las capacidades de cuenta de familia y personal deben conservar exactamente sus contratos observables.

Este cambio deberá configurarse como `skip_specs: true`, ya que no modifica requisitos funcionales.

## Impacto

- Componentes de cuenta familiar en `src/app/(general)/family-feed/account/_components/`.
- Componentes de cuenta del personal en `src/app/(staff)/account/_components/`.
- Posible nuevo módulo reutilizable dentro de `src/presentation/` siguiendo los límites de arquitectura del proyecto.
- Server Actions existentes, que permanecerán en sus rutas y no se expondrán como lógica compartida de UI.
- Estilos y contratos de props de los formularios.
- Verificación de ambas rutas con TypeScript, ESLint, build y recorridos funcionales.
- No requiere migraciones, cambios de base de datos, nuevas dependencias ni cambios de URL.
