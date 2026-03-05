# ADR-0003: Auth (JWT + RBAC)

Estado: accepted
Fecha: 2026-03-05

## Contexto
Necesitamos un modelo estándar para APIs SaaS, con roles y claims multi-tenant.

## Decisión
- Autenticación: JWT Bearer
- Claims mínimos: `tenantId`, `userId`, `roles`
- Roles: `ADMIN`, `MANAGER`, `BARBER`, `RECEPTION`
- Autorización: RBAC + Object-Level Authorization (BOLA mitigation)

Referencias:
- OWASP API1:2023 BOLA: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
