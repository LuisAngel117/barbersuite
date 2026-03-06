# Notifications Email Outbox

## Enfoque
BarberSuite usa patrón outbox para email:
- la API HTTP solo encola intención de envío en `email_outbox`
- un worker interno reclama filas `pending`, las manda por SMTP y actualiza su estado
- el request de negocio no bloquea esperando SMTP

## Estados
- `pending`: lista para enviarse
- `processing`: reclamada por un worker
- `sent`: entregada al servidor SMTP
- `failed`: agotó reintentos
- `cancelled`: reservada para futuras cancelaciones manuales o de negocio

El estado `processing` existe para evitar doble envío cuando hay más de un worker o dos ticks concurrentes.

## Claim y locking
El worker usa un `UPDATE ... FROM (SELECT ... FOR UPDATE SKIP LOCKED)` sobre `email_outbox`:
- selecciona solo filas `pending` con `scheduled_at <= now()`
- las cambia atómicamente a `processing`
- devuelve el batch reclamado

Con esto, dos workers concurrentes no reclaman la misma fila.

## Envío SMTP
El sender usa `JavaMailSender` de Spring Boot:
- `spring.mail.*` se configura por variables de entorno
- en local, los defaults apuntan a MailHog (`localhost:1025`)
- si `body_html` existe, se envía email HTML con texto alterno cuando hay `body_text`

## Reintentos
Cuando un envío falla:
- `attempts` se incrementa
- `last_error` guarda el error resumido
- si aún no alcanza el máximo, vuelve a `pending`
- `scheduled_at` se mueve al futuro con backoff exponencial simple

Defaults:
- base backoff: `30s`
- máximo backoff: `15m`
- máximo intentos: `5`

## Tests
En tests de integración:
- Postgres real sigue corriendo con Testcontainers
- SMTP se valida con GreenMail JUnit 5
- el scheduler real queda desactivado y los tests llaman `processOnce()` de forma explícita

Eso permite verificar:
- envío exitoso real por SMTP
- reintento después de fallo
- claim concurrente sin doble envío
