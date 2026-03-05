# ADR-0007: IDs (UUIDv7)

Estado: accepted
Fecha: 2026-03-05

## Contexto
En multi-tenant, IDs no secuenciales evitan enumeración y colisiones. UUIDv7 agrega orden temporal, mejorando localidad de inserts en índices B-tree.

## Decisión
- Primary keys: UUIDv7 (RFC 9562).
- Tipo en DB: `uuid`.
- Generación:
  - Postgres 17 (local): generar UUIDv7 en la app.
  - Postgres 18 (opcional futuro): se puede generar en DB con `uuidv7()`.

Referencias:
- RFC 9562: https://www.rfc-editor.org/rfc/rfc9562
- PostgreSQL 18 release (uuidv7()): https://www.postgresql.org/about/news/postgresql-18-released-3142/
- PostgreSQL docs UUID functions: https://www.postgresql.org/docs/current/functions-uuid.html
