# SPEC 08 - Baseline de arquitectura

Fecha de captura: 2026-09-21

## Rutas y redirects

`next.config.ts` no define redirects.

| Ruta actual | Resultado de smoke test | Destino previsto |
| --- | --- | --- |
| `/` | 200 | `/home` mediante redirect permanente |
| `/login` | 200 | `/auth/login` mediante redirect permanente |
| `/activate-account?code=invalid` | 200 | `/auth/activate-account?code=invalid` mediante redirect permanente |
| `/kids` | 200 | `/kids` bajo `(staff)` |
| `/kids/new` | 200 | `/kids/new` bajo `(staff)` |
| `/kids/mateo-fernandez` | 200 | `/kids/mateo-fernandez` bajo `(staff)` |
| `/kids/kid-mateo-fernandez/edit` | 200 | `/kids/edit/kid-mateo-fernandez` mediante redirect permanente |

Los smoke tests se realizaron con `npm run dev -- --port 3100`.

## Datos JSON editables

Los cuatro archivos se encuentran bajo `app/data/mocks/kids/`. Todos usan un arreglo directo como raíz.

| Archivo | Registros | Contrato actual |
| --- | ---: | --- |
| `kids.json` | 9 | `Kid[]` |
| `people.json` | 10 | `Person[]` |
| `rooms.json` | 3 | `Room[]` |
| `parent-kids.json` | 9 | `ParentKid[]` |

Los registros no se modificaron durante esta captura.

## Entradas públicas actuales

| Feature | Barrel actual | Observación |
| --- | --- | --- |
| Auth | `app/features/auth/index.ts` | Expone componentes, contratos y utilidades desde una única entrada. |
| Feed | `app/features/feed/index.ts` | Reexporta `feedOverview` y `feedPosts` desde mocks. |
| Kids | `app/features/kids/index.ts` | Expone modelos de Kids, People, Rooms y Family junto con componentes y utilidades. |
| Layout | `app/features/layout/index.ts` | Reexporta `staffSidebarMock` desde mocks. |

No existe una entrada `server` de feature en esta línea base.
