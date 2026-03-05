# Decisiones pendientes (no bloquean docs; pueden bloquear implementación según slice)

Fecha: 2026-03-05

1) **Provider de email en producción** (cuando desplegues):
   - SendGrid / Mailgun / SES / otro. (Se configura por env vars; no secrets en repo.)

2) **WhatsApp**:
   - R1: plantilla copy/paste.
   - R1.1: WhatsApp Cloud API (definir si se hace y con qué enfoque).

3) **PostgreSQL 18**:
   - Local es Postgres 17; si migras a 18 podrías generar UUIDv7 en DB (`uuidv7()`), ver ADR-0007.
