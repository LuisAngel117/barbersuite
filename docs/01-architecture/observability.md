# Observability v1

## Objetivo
Dar trazabilidad operativa al backend sin cambiar reglas de negocio:
- correlacion por request con `X-Request-Id`
- logs estructurados JSON en consola
- endpoints de operabilidad via Actuator
- scrape Prometheus para metricas

## Request correlation
El backend acepta el header `X-Request-Id`.

Comportamiento:
- si el cliente lo envia y es valido, se propaga igual
- si no viene, el backend genera uno
- si viene vacio o con mas de 100 caracteres, responde `400 VALIDATION_ERROR`

El request id se usa en tres lugares:
- header de request: `X-Request-Id`
- MDC: `requestId`
- header de response: `X-Request-Id`

Con esto cada respuesta queda correlacionable incluso en errores `400`, `401` y `403`.

## Logs JSON
Los logs de consola usan structured logging nativo de Spring Boot.

Configuracion:
- `logging.structured.format.console=logstash`

Resultado:
- salida JSON en consola
- inclusion automatica del MDC
- posibilidad de filtrar por `requestId` en Docker, terminal o agregadores de logs

## Actuator
Endpoints habilitados:
- `/actuator/health`
- `/actuator/info`
- `/actuator/metrics`
- `/actuator/prometheus`

Uso:
- `health`: liveness/readiness y smoke operativo
- `metrics`: inspeccion manual de metricas
- `prometheus`: scrape para Prometheus/Grafana o verificaciones de demo

En entorno local/demo se dejan publicos:
- `GET /actuator/health`
- `GET /actuator/prometheus`

El resto de rutas del backend mantiene su seguridad normal.

## Demo y operacion local
Checks utiles:
- `http://localhost:8080/actuator/health`
- `http://localhost:8080/actuator/prometheus`

Cuando un request falle, busca el `X-Request-Id` de la respuesta y luego filtra los logs JSON por el campo `requestId`.
