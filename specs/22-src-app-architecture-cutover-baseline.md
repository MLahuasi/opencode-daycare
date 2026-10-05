# SPEC 22 - Baseline previo al corte de App Router

Fecha de registro: 2026-10-05

## Arbol y alias

- App Router actual: `app/`
- App Router objetivo: `src/app/`
- Capas actuales bajo `src/`: `application/`, `composition/`, `config/`, `domain/`, `infrastructure/`, `presentation/`, `utils/`
- Alias actual: `@/*` -> `./*`
- Alias objetivo: `@/*` -> `./src/*`
- Configuracion y recursos que permanecen en la raiz: `next.config.ts`, `package.json`, `.env*`, `public/`, `templates/`

## Rutas detectadas

| Archivo de entrada | Ruta publica |
| --- | --- |
| `app/(staff)/home/page.tsx` | `/home` |
| `app/(general)/family-feed/page.tsx` | `/family-feed` |
| `app/(general)/family-feed/day-summary/page.tsx` | `/family-feed/day-summary` |
| `app/(general)/family-feed/account/page.tsx` | `/family-feed/account` |
| `app/(general)/posts/[postId]/page.tsx` | `/posts/[postId]` |
| `app/(general)/posts/[postId]/comments/new/page.tsx` | `/posts/[postId]/comments/new` |
| `app/(general)/posts/[postId]/comments/[commentId]/edit/page.tsx` | `/posts/[postId]/comments/[commentId]/edit` |
| `app/(staff)/kids/page.tsx` | `/kids` |
| `app/(staff)/kids/new/page.tsx` | `/kids/new` |
| `app/(staff)/kids/[slug]/page.tsx` | `/kids/[slug]` |
| `app/(staff)/kids/[slug]/invite-parent/page.tsx` | `/kids/[slug]/invite-parent` |
| `app/(staff)/kids/edit/[id]/page.tsx` | `/kids/edit/[id]` |
| `app/auth/login/page.tsx` | `/auth/login` |
| `app/auth/parent-invitation/page.tsx` | `/auth/parent-invitation` |
| `app/auth/parent-invitation/[token]/page.tsx` | `/auth/parent-invitation/[token]` |
| `app/api/auth/[...nextauth]/route.ts` | `/api/auth/[...nextauth]` |

Route files that are not standalone public pages:

- `app/layout.tsx`
- `app/(staff)/kids/layout.tsx`
- `app/(staff)/kids/[slug]/not-found.tsx`

## Redirects y rutas legacy

Redirect externo declarado en `next.config.ts`:

- `/` -> `/home` (permanente)

Redirects internos observados en pages y Server Actions forman parte del runtime y no son redirects de compatibilidad de `next.config.ts`.

Contrato objetivo de SPEC 22:

- Conservar solamente el redirect de compatibilidad `/`.
- `/login`, `/kids/:id/edit`, `/auth/link-parent` y las cuatro rutas antiguas de Posts deben responder 404.
- `/activate-account` y `/auth/activate-account` deben responder 404.

## Hashes SHA-256 de JSON

Los hashes y tamanos corresponden a `src/infrastructure/persistence/json/data/` y son la linea base byte a byte.

| Archivo | Tamano | SHA-256 |
| --- | ---: | --- |
| `credential.json` | 1903 bytes | `080e56ac42397e39d9f0e6632034c4c3a6f0110305b228180fc97d3e52b43cf3` |
| `feed-comments.json` | 3717 bytes | `3b8e57f078b16e6e2d274dc7b7122c78236c165b2b6076b96e0112b5b145b364` |
| `feed-overview.json` | 250 bytes | `b3cfe037d1380daaaeb980d8673bace4b9a831a254eaf0ac29e69259df59ee17` |
| `feed-reactions.json` | 4263 bytes | `01fd66efa9b75e3671edde02826b4c9595ff422346f6c9e6c411b64edccb779e` |
| `feed.json` | 4171 bytes | `116fad2cb28b1cac41240943d6774470545f9e2ec4a5f8d9506b1016c357f363` |
| `invitation.json` | 3450 bytes | `4375124196f4c06ac2b99151bdea08701d91a26f975682fa6fa4adf7ea071ee9` |
| `kids.json` | 4127 bytes | `c276ad4e762b96695796ac6607c13356dc01081406abb529d5bb5eddcf536677` |
| `parent-kids.json` | 3481 bytes | `106ab251492404a409c6873522551028c8f11e50c2abb3621dd6c630ac6d7e61` |
| `people.json` | 2395 bytes | `3217d16cf13b5e648f25e563d1ae204992dcf3368cd99d42a00d840966f8d619` |
| `rooms.json` | 188 bytes | `8854c3564697ecdbb562274e7d71e54931d497d302a186ea6208ecd3283491f1` |
| `staff-rooms.json` | 120 bytes | `123185db7e8e69b423843b215ea55c0f152fefec0db672df306ec32b9c0ba101` |
