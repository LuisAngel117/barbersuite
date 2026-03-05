# ADR-0005: Línea de Spring Boot (pin 4.0.3) + regla de escape

Estado: accepted
Fecha: 2026-03-05

## Contexto
Necesitamos fijar baseline y versiones para estabilidad y reproducibilidad del repo.

Referencias:
- Boot 4.0.0 GA (20-Nov-2025): https://spring.io/blog/2025/11/20/spring-boot-4-0-0-available-now
- Boot 4.0.3 (19-Feb-2026): https://spring.io/blog/2026/02/19/spring-boot-4-0-3-available-now
- Boot 3.5.11 (19-Feb-2026): https://spring.io/blog/2026/02/19/spring-boot-3-5-11-available-now
- Spring Framework 7 GA (Jakarta EE 11 / Servlet 6.1): https://spring.io/blog/2025/11/13/spring-framework-7-0-general-availability

## Decisión
- Usar Spring Boot **4.0.x**, con pin inicial **4.0.3**.
- Regla de escape: si una dependencia crítica no es compatible con Boot 4,
  hacer fallback a Boot **3.5.x** (última 3.x) de forma temporal, documentado en un ADR “superseding”.

## Consecuencias
- + Baseline moderno (Spring Framework 7 / Jakarta EE 11)
- - Posibles incompatibilidades de ecosistema (mitigación: regla de escape).
