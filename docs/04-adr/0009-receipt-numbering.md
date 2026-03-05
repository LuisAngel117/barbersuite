# ADR-0009: Numeración de recibos internos (por branch)

Estado: accepted
Fecha: 2026-03-05

## Contexto
En operación real, cada sucursal suele necesitar su propia secuencia de caja/recibos.

## Decisión
- La numeración es **por branch**.
- Formato:
  `BR-{branchCode}-{yyyy}-{seq6}`
  Ej: `BR-UIO-2026-000001`

## Concurrencia (reservar número sin colisiones)
En R1 usaremos una tabla de secuencias por (tenant_id, branch_id, year), con locking:

- Tabla: `receipt_sequences(tenant_id, branch_id, year, next_seq)`
- Para emitir recibo:
  1) `SELECT ... FOR UPDATE`
  2) leer `next_seq`
  3) `UPDATE ... SET next_seq = next_seq + 1`
  4) construir el número con el valor reservado

## Consecuencias
- + Control exacto por sucursal
- + Evita colisiones en alta concurrencia
- - Más lógica que una secuencia global, pero más realista al negocio.
