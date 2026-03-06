# API Conventions

## Versionado
- Base path: `/api/v1`
- Breaking changes => `/api/v2`

## Seguridad
- `Authorization: Bearer <JWT>`
- Claims mínimos: `tenantId`, `userId`, `roles`
- `POST /auth/login` es global por email: el backend resuelve el `tenantId` desde el usuario porque `users.email` es único globalmente.

## Contexto de sucursal (Branch)
**Regla:** En endpoints branch-scoped, el branch es REQUIRED via header:

- `X-Branch-Id: <uuid>`

Endpoints tenant-scoped (catálogo global, usuarios/roles del tenant) **no** requieren branch.

### Tenant-scoped vs branch-scoped
- Tenant-scoped: el tenant se resuelve desde el JWT y `X-Branch-Id` NO debe exigirse.
- Branch-scoped: además del tenant autenticado, requieren `X-Branch-Id`.
- Ejemplos tenant-scoped del Slice 1: `/me`, `/branches`, `/branches/{branchId}`.
- Ejemplos tenant-scoped del Slice 2: `/services`, `/services/{serviceId}`.
- Ejemplos tenant-scoped del Slice 4: `/staff/barbers`, `/staff/barbers/{barberId}`.
- Ejemplos branch-scoped del Slice 2: `/clients`, `/clients/{clientId}`.
- Ejemplos branch-scoped del Slice 3: `/barbers`, `/appointments`, `/appointments/{appointmentId}`.
- Ejemplos branch-scoped: agendas, caja, operaciones que ejecutan trabajo dentro de una sucursal específica.

### Staff admin vs staff operativo
- `StaffAdmin` (`/staff/barbers`, `/staff/barbers/{barberId}`) es tenant-scoped y NO requiere `X-Branch-Id`.
- `Staff` operativo (`GET /barbers`) es branch-scoped y requiere `X-Branch-Id` porque lista solo barberos con acceso a la sucursal seleccionada.

### Error estándar
Si falta `X-Branch-Id` donde se requiere, devolver Problem Details con:
- `code = "BRANCH_REQUIRED"`
- `status = 400`

## Errores
Usaremos Problem Details (RFC 7807):
https://www.rfc-editor.org/rfc/rfc7807.html

Campos mínimos:
- `type`, `title`, `status`, `detail`, `instance`
Extensiones:
- `code` (string estable), `errors` (lista por campo), `traceId`

## Paginación (convención)
- Query params: `page`, `size`, `sort`
- Respuesta: `items`, `page`, `size`, `totalItems`, `totalPages`
