# ADR-0002: Multi-tenancy (Pool model con tenant_id)

Estado: accepted
Fecha: 2026-03-05

## Contexto
BarberSuite es SaaS multi-tenant. Queremos una estrategia simple y costo-efectiva para R1, con evolución futura para clientes con aislamiento fuerte.

AWS describe modelos: pool/bridge/silo:
https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html

## Decisión
- Modelo: **Pool** (recursos compartidos)
- Persistencia: DB/esquema compartido + columna `tenant_id` en toda tabla multi-tenant.
- Toda query debe filtrar por `tenant_id` (y por `branch_id` cuando aplique).

## Consecuencias
- + Simple de operar y barato en R1
- - Riesgo de “cross-tenant data leakage” si se omite `tenant_id`.
  Mitigación: patrones, tests, y revisión de PR obligatoria.
