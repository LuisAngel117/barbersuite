# Local Dev

## Objetivo
Levantar BarberSuite en local de dos maneras:
- modo normal para desarrollo diario: dependencias en Docker y apps corriendo con `mvnw` y `npm`
- modo full docker para demo reproducible: backend + dependencias en contenedores

## Prerrequisitos
- Docker Desktop o Docker Engine con Docker Compose v2
- Java 21 para correr el backend fuera de Docker
- Node.js 24 para correr el frontend fuera de Docker

## Variables de entorno
1. Copiar `.env.example` a `.env`.
2. Ajustar los valores si hace falta para tu máquina local.

`.env.example` no contiene secretos reales; solo valores de desarrollo.

## Modo normal (recomendado dev)

### 1. Levantar dependencias
Desde la raíz del repo:

```bash
docker compose up -d
docker compose ps
```

Resultado esperado:
- `barbersuite-postgres` expuesto en `localhost:5432`
- `barbersuite-mailhog` expuesto en `localhost:1025` (SMTP) y `localhost:8025` (UI)

MailHog UI:

```text
http://localhost:8025
```

### 2. Levantar backend fuera de Docker
Desde `/backend`:

```bash
./mvnw spring-boot:run
```

En Windows:

```powershell
cmd /c mvnw.cmd spring-boot:run
```

Health esperado:

```text
http://localhost:8080/actuator/health
```

### 3. Levantar frontend fuera de Docker
Desde `/frontend`:

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Abrir:

```text
http://localhost:3000
```

Notas:
- El backend debe estar corriendo en `http://localhost:8080`.
- `BACKEND_BASE_URL` por defecto apunta a `http://localhost:8080/api/v1`.
- `COOKIE_SECURE=false` en local/demo porque el frontend corre sobre `http://localhost`.
- El JWT se guarda en cookie `httpOnly`; no se usa `localStorage`.
- El login usa `email` y `password`; el backend resuelve el `tenantId` desde el usuario autenticado.

## Modo full docker (demo)

### 1. Generar el jar del backend
Desde `/backend`:

```bash
./mvnw -q -DskipTests package
```

En Windows:

```powershell
cmd /c mvnw.cmd -q -DskipTests package
```

### 2. Levantar backend + dependencias
Desde la raíz del repo:

```bash
docker compose -f docker-compose.yml -f docker-compose.app.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.app.yml ps
```

### 3. Verificar backend containerizado
Health esperado:

```text
http://localhost:8080/actuator/health
```

La respuesta debe ser `200 OK`.

## Notas
- `docker-compose.yml` se mantiene como stack de dependencias (`postgres` + `mailhog`).
- `docker-compose.app.yml` agrega el backend y reutiliza el Postgres del compose base.
- La base usa un volumen persistente Docker para conservar datos entre reinicios.
