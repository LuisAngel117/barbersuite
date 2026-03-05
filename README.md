# BarberSuite (SaaS para barberías)

Plataforma **multi-tenant**:
- Un **tenant** = una barbería (cliente).
- Un tenant tiene múltiples **sucursales (branches)**.

## Stack
- Backend: Java 21 + Spring Boot **4.0.3** (ver ADR-0005)
- DB: PostgreSQL 17 (local); diseño compatible con PostgreSQL 18 (uuidv7() nativo)
- Infra local: Docker Desktop + docker compose
- Frontend: React / Next.js
- Auth: JWT + roles (ADMIN/MANAGER/BARBER/RECEPTION)

## Centro de verdad (Source of Truth)
Este repo usa **docs-as-code**:
- Decisiones: `/docs/04-adr/`
- Contratos API: `/docs/02-api/openapi.yaml`
- Reglas de trabajo y DoD: `/docs/ways-of-working.md` y `/docs/00-product/definition-of-done.md`

Regla: **Codex implementa solo lo que esté especificado en `/docs`**.

## Docs principales
- Resumen de decisiones: `/docs/00-product/decisions.md`
- Release 1 scope: `/docs/00-product/release-1-scope.md`
- Arquitectura: `/docs/01-architecture/overview.md`
