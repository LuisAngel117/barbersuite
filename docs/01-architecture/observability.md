# Observability

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

Metricas HTTP incluidas por Spring Boot / Micrometer:
- `http_server_requests_seconds`

Tags utiles ya disponibles en esas metricas:
- `method`
- `status`
- `uri`
- `outcome`
- `error`
- `exception`

Uso:
- `health`: liveness/readiness y smoke operativo
- `metrics`: inspeccion manual de metricas
- `prometheus`: scrape para Prometheus/Grafana o verificaciones de demo

En entorno local/demo se dejan publicos:
- `GET /actuator/health`
- `GET /actuator/prometheus`

El resto de rutas del backend mantiene su seguridad normal.

## Metricas de negocio y enforcement
Metricas custom publicadas en `/actuator/prometheus`:
- `barbersuite_service_creations_total`
- `barbersuite_client_creations_total`
- `barbersuite_clients_search_total`
- `barbersuite_branch_required_total`
- `barbersuite_branch_forbidden_total`

Semantica:
- `barbersuite_service_creations_total`: incrementa cuando un `POST /api/v1/services` termina exitosamente
- `barbersuite_client_creations_total`: incrementa cuando un `POST /api/v1/clients` termina exitosamente
- `barbersuite_clients_search_total`: incrementa cuando `GET /api/v1/clients` recibe `q` no vacio
- `barbersuite_branch_required_total`: incrementa cuando falta `X-Branch-Id` en un endpoint branch-scoped
- `barbersuite_branch_forbidden_total`: incrementa cuando el usuario no tiene acceso a la sucursal solicitada

No se usan tags con `tenantId`, `userId`, `email` o `branchId` para evitar cardinalidad explosiva y fuga de informacion.

Nota:
- se usa `creations_total` en lugar de `created_total` porque el sufijo `_created` tiene semantica reservada en Prometheus/OpenMetrics y termina colapsando nombres de contador ambiguos.

## Demo con Prometheus
Compose adicional:
- [docker-compose.observability.yml](/Users/luisa/Proyecto/barbersuite/docker-compose.observability.yml)

Config de scrape:
- [prometheus.yml](/Users/luisa/Proyecto/barbersuite/observability/prometheus.yml)

Levantar stack completo con observabilidad:
- `docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml -f docker-compose.observability.yml up -d --build`

Verificacion:
- backend metrics: `http://localhost:8080/actuator/prometheus`
- Prometheus UI: `http://localhost:9090`
- targets: `http://localhost:9090/targets`

## Demo y operacion local
Checks utiles:
- `http://localhost:8080/actuator/health`
- `http://localhost:8080/actuator/prometheus`
- `http://localhost:9090`

Cuando un request falle, busca el `X-Request-Id` de la respuesta y luego filtra los logs JSON por el campo `requestId`.
