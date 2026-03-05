# API Conventions

## Versionado
- Base path: `/api/v1`
- Breaking changes => `/api/v2`

## Seguridad
- `Authorization: Bearer <JWT>`
- Claims mínimos: `tenantId`, `userId`, `roles`

## Contexto de sucursal (Branch)
**Regla:** En endpoints branch-scoped, el branch es REQUIRED via header:

- `X-Branch-Id: <uuid>`

Endpoints tenant-scoped (catálogo global, usuarios/roles del tenant) **no** requieren branch.

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
