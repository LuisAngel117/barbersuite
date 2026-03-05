# ADR-0004: Contexto de sucursal (Branch) en API — REQUIRED

Estado: accepted
Fecha: 2026-03-05

## Contexto
Muchas operaciones son por sucursal (agenda, caja, reportes, horarios). Si el branch es implícito o opcional donde no debe, aumenta el riesgo de ambigüedad y de filtración de datos (incluido BOLA).

Referencia (BOLA): https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/

## Decisión
- En endpoints **branch-scoped**, el branch es **REQUIRED** por header:
  - `X-Branch-Id: <uuid>`
- En endpoints **tenant-scoped**, NO se requiere branch.
- Si falta el header en branch-scoped:
  - Error Problem Details con `code="BRANCH_REQUIRED"` y `status=400`.

## Alternativas consideradas
- Branch en path: `/branches/{branchId}/...`
- Branch implícito por perfil de usuario

## Consecuencias
- + Menos ambigüedad (branch explícito)
- + Facilita auditoría y evita “operar en el branch equivocado”
- - El cliente debe enviar header siempre en endpoints branch-scoped.
