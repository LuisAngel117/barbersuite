# ADR-0008: Dinero (USD, scale 2) + redondeo explícito

Estado: accepted
Fecha: 2026-03-05

## Contexto
Dinero requiere precisión exacta. No usar `double/float`.

## Decisión
- Moneda: USD (fija en R1; si se vuelve configurable, será por tenant).
- Persistencia: `numeric(12,2)` para montos.
- En Java: `BigDecimal` y redondeo explícito al persistir/emitir totales:
  `setScale(2, RoundingMode.HALF_UP)`.

Referencia (JDK):
- BigDecimal: https://docs.oracle.com/javase/8/docs/api/java/math/BigDecimal.html
- RoundingMode: https://docs.oracle.com/javase/8/docs/api/java/math/RoundingMode.html
