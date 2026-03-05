# ADR-0010: Email en V1 (SMTP) + MailHog en dev

Estado: accepted
Fecha: 2026-03-05

## Contexto
R1 incluye notificaciones por email reales. En desarrollo, necesitamos capturar correos sin enviar a internet.

## Decisión
- En V1 enviamos correo vía SMTP.
- Dev: MailHog (SMTP + UI web).
- Prod: SMTP provider (SendGrid/Mailgun/SES/otro) por env vars.

Referencias:
- MailHog: https://github.com/mailhog/MailHog
- 12-factor config por env vars: https://12factor.net/config
