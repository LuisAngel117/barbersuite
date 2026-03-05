# Definition of Done (DoD) — Release 1

Fecha: 2026-03-05

## Funcionalidad
- Criterios de aceptación cumplidos.
- OpenAPI actualizado cuando aplique.
- Migraciones DB versionadas si hay cambio de schema.
- No TODOs sin ticket (si hay TODO, va con issue linkeado).

## Calidad
- Nomenclatura consistente (paquetes, clases, endpoints, tablas).
- Manejo de errores consistente usando Problem Details (RFC 7807):
  https://www.rfc-editor.org/rfc/rfc7807.html

## Tests (no negociable)
- Unit tests para lógica.
- Integration tests con Postgres real (Testcontainers) cuando aplique:
  https://testcontainers.com/guides/testing-spring-boot-rest-api-using-testcontainers/

## Seguridad
- Filtrado por `tenant_id` en toda query de datos multi-tenant.
- Branch REQUIRED en endpoints branch-scoped (ADR-0004).
- Prevención explícita de BOLA:
  https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/

## Operabilidad
- Logs útiles (incluye `tenantId`, `userId`, `branchId` cuando aplique).
- Health endpoint / readiness (cuando se active Actuator).
- Docs actualizados en `/docs`.
