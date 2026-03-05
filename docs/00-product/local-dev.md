# Local Dev

## Objetivo
Levantar la infraestructura mínima de desarrollo local para BarberSuite:
- PostgreSQL 17
- MailHog para capturar emails SMTP sin enviar a internet

## Prerrequisitos
- Docker Desktop o Docker Engine con Docker Compose v2

## Variables de entorno
1. Copiar `.env.example` a `.env`.
2. Ajustar los valores si hace falta para tu máquina local.

`.env.example` no contiene secretos reales; solo valores de desarrollo.

## Levantar servicios
Ejecutar desde la raíz del repo:

```bash
docker compose up -d
```

## Verificar estado
Confirmar que ambos contenedores están arriba:

```bash
docker compose ps
```

Resultado esperado:
- `barbersuite-postgres` expuesto en `localhost:5432`
- `barbersuite-mailhog` expuesto en `localhost:1025` (SMTP) y `localhost:8025` (UI)

## Verificar MailHog
Abrir la UI web:

```text
http://localhost:8025
```

La bandeja debe cargar aunque todavía no existan correos enviados por la aplicación.

## Notas
- La base de datos usa un volumen persistente Docker para conservar datos entre reinicios.
- La base creada por defecto es `barbersuite`.
- Las credenciales de PostgreSQL se resuelven por variables de entorno para evitar secretos hardcodeados en el compose.
