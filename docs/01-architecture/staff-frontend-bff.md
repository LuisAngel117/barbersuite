# Staff Frontend BFF

El módulo de Staff Admin usa Route Handlers internos para mantener el JWT dentro de cookies `httpOnly` y evitar llamadas directas del browser al backend.

## Rutas

- `GET /api/staff/barbers`
  - proxy a `GET /api/v1/staff/barbers`
  - tenant-scoped, sin `X-Branch-Id`
  - forwardea query string completa (`active`, `q`, `branchId`)
- `POST /api/staff/barbers`
  - proxy a `POST /api/v1/staff/barbers`
  - requiere `Origin/Referer` same-origin y double-submit CSRF (`bs_csrf` + `X-CSRF-Token`)
- `GET /api/staff/barbers/{barberId}`
  - proxy a `GET /api/v1/staff/barbers/{barberId}`
- `PATCH /api/staff/barbers/{barberId}`
  - proxy a `PATCH /api/v1/staff/barbers/{barberId}`
  - misma protección CSRF/origin que `POST`

## Seguridad web

- El token de acceso sigue viviendo en `bs_access_token` (`httpOnly`).
- Las mutaciones usan el hardening común del BFF:
  - `requireSameOrigin`
  - `requireCsrf`
- Si el token falta o expira, el BFF no inventa auth local: forwardea y deja que el backend responda `401`.

## Alcance

- Staff Admin es `tenant-scoped`.
- El filtro `branchId` es un query param normal del módulo admin; no usa `X-Branch-Id`.
- El endpoint branch-scoped para agenda sigue siendo `GET /api/barbers`.
