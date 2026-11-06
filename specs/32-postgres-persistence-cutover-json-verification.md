# SPEC 32 — Verificación de ausencia de persistencia JSON

Registro del Paso 8.

## Resultado

- No existen archivos `*.json` versionados bajo `src/`.
- No existe `src/infrastructure/persistence/json/`.
- No existen imports de `node:fs` para persistencia de datos.
- No existen llamadas runtime a `writeFile`, `writeFileSync`, `appendFile`,
  `rename` o equivalentes para guardar entidades.
- No existen escrituras mediante `JSON.stringify` hacia filesystem o un
  adapter de persistencia.

## Falsos positivos revisados

- `src/config/server/environment.ts` usa `existsSync` únicamente para validar
  la existencia de un recurso de configuración del mailer; no lee ni escribe
  datos de negocio.
- `src/app/_actions/posts/post-action.ts` usa `JSON.parse` para interpretar
  campos enviados por formularios.
- `src/app/_actions/posts/restriction-confirmation.ts` serializa un payload
  firmado y temporal de confirmación.
- `src/presentation/post/post-form.tsx` serializa valores de campos ocultos
  del formulario.

Estos usos no constituyen persistencia JSON y no escriben snapshots ni datos
de negocio.

## Evidencia

La revisión combinó búsquedas de filesystem APIs, operaciones de escritura,
imports JSON, rutas `persistence/json` y archivos JSON bajo `src/`.

**Conclusión:** el runtime no conserva ni escribe persistencia JSON; PostgreSQL
es la única fuente de datos persistidos.
