# Appointments Frontend BFF

## Scope

The appointments module uses Next Route Handlers as a BFF layer so the browser never receives the backend JWT directly.

Routes:

- `/api/barbers`
- `/api/appointments`
- `/api/appointments/[appointmentId]`

## Branch Scope

These routes are branch-scoped.

They read the selected branch from the `bs_branch_id` cookie and forward it as `X-Branch-Id` to the backend.

Local validation before proxying:

- Missing `bs_branch_id` -> `400` `application/problem+json` with `code="BRANCH_REQUIRED"`
- Invalid `bs_branch_id` UUID -> `400` `application/problem+json` with `code="VALIDATION_ERROR"`

## Security

Authentication:

- The BFF reads `bs_access_token` from the httpOnly cookie and forwards it as `Authorization: Bearer ...`.

Mutating routes:

- `POST /api/appointments`
- `PATCH /api/appointments/[appointmentId]`

Before forwarding, the BFF enforces:

- same-origin validation (`Origin` / `Referer`)
- double-submit CSRF validation (`bs_csrf` cookie + `X-CSRF-Token` header)

If validation fails, the BFF responds locally with `application/problem+json`.

## Forwarding Behavior

The BFF preserves backend status codes and response bodies, including `application/problem+json`.

Examples:

- `GET /api/barbers` -> backend `/barbers`
- `GET /api/appointments?from=2026-03-06&to=2026-03-06` -> backend `/appointments?from=2026-03-06&to=2026-03-06`
- `PATCH /api/appointments/{id}` -> backend `/appointments/{id}`

## Server-side Wrappers

For future UI work, server components can reuse:

- `getBarbers()`
- `getAppointments(query)`

from [frontend/src/lib/server-bff.ts](/Users/luisa/Proyecto/barbersuite/frontend/src/lib/server-bff.ts).

## Example Calls

Conceptual examples through the BFF:

```bash
curl http://localhost:3000/api/barbers
```

```bash
curl "http://localhost:3000/api/appointments?from=2026-03-06&to=2026-03-06"
```

```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <bs_csrf>" \
  -d '{"clientId":"...","barberId":"...","serviceId":"...","startAtLocal":"2026-03-06T10:00"}'
```
