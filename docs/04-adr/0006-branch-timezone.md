# ADR-0006: Zona horaria por sucursal (IANA)

Estado: accepted
Fecha: 2026-03-05

## Contexto
Agenda, reportes y recordatorios dependen de la hora local de cada sucursal. Una barbería puede operar en diferentes zonas horarias.

## Decisión
- Cada `branch` tiene `time_zone` (IANA TZ identifier), ej. `America/Guayaquil`.
- Los instantes persistidos son UTC (timestamp) y la UI opera en hora local del branch.
- Default para Ecuador: `America/Guayaquil`.

Referencia (IANA tzdb, incluye America/Guayaquil):
https://data.iana.org/time-zones/tzdb-2021a/zone1970.tab
