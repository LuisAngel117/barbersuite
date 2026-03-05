# Decisiones aceptadas (resumen)

Fecha: 2026-03-05

- Spring Boot line: Boot 4.0.x (pin 4.0.3) + regla de escape → ADR-0005
- Multi-tenancy: pool shared DB + `tenant_id` → ADR-0002
- Auth: JWT + RBAC → ADR-0003
- Branch context: `X-Branch-Id` requerido en branch-scoped → ADR-0004
- Time zone: `time_zone` por branch (IANA) → ADR-0006
- IDs: UUIDv7 → ADR-0007
- Dinero: USD + scale 2 + BigDecimal HALF_UP → ADR-0008
- Numeración recibos: por branch → ADR-0009
- Email V1: SMTP + MailHog en dev → ADR-0010
