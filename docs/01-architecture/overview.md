# Architecture Overview

## Multi-tenancy
- Modelo: pool (DB compartida) + columna `tenant_id` en todas las tablas multi-tenant.
- Referencia (AWS SaaS Lens): https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html

## Branch context
- Operaciones branch-scoped requieren `X-Branch-Id` (ADR-0004).

## Seguridad
- RBAC (roles) + Object-Level Authorization (BOLA mitigation):
  https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/

## Errores
- Problem Details (RFC 7807):
  https://www.rfc-editor.org/rfc/rfc7807.html

## IDs
- UUIDv7 (RFC 9562): https://www.rfc-editor.org/rfc/rfc9562

## Time zone
- IANA time zone por branch; p.ej. `America/Guayaquil`:
  https://data.iana.org/time-zones/tzdb-2021a/zone1970.tab
