# Demo de 5 minutos

## Objetivo
Levantar BarberSuite completo con Docker, crear un tenant demo automaticamente y recorrer el flujo principal de `Services` y `Clients` sin configuracion manual extra.

## Prerrequisitos
- Docker Desktop

## 1. Levantar el stack completo
Desde la raiz del repo:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml up -d --build
```

No hace falta generar el jar del backend antes: el `Dockerfile` multi-stage compila el servicio dentro del build de Docker.

Atajo en Windows:

```powershell
./scripts/demo-up.ps1
```

Antes de levantar la demo, asegúrate de no tener procesos locales usando:
- `localhost:3000`
- `localhost:8080`

Si ya tienes `npm run dev` o `spring-boot:run` abiertos, ciérralos primero.

Verifica que todo este arriba:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml ps
```

Checks rapidos:
- Backend health: `http://localhost:8080/actuator/health`
- Frontend: `http://localhost:3000`
- MailHog UI: `http://localhost:8025`

Nota:
- el demo Docker corre sobre `http://localhost`, por eso el frontend usa `COOKIE_SECURE=false`

## 1.b Observabilidad demo (Prometheus + Grafana)
Si quieres la demo completa con observabilidad:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml -f docker-compose.observability.yml up -d --build
```

Checks extra:
- Prometheus UI: `http://localhost:9090`
- Grafana: `http://localhost:3001`
- login Grafana: `admin / admin`
- dashboard listo: `BarberSuite Overview` en la carpeta `BarberSuite`

## 2. Crear el tenant demo
Desde la raiz del repo:

```powershell
./scripts/demo-seed.ps1
```

El script:
- crea un tenant demo con un email unico (`demo+yyyyMMdd-HHmmss@example.com`)
- usa password fija `DemoPass123!`
- guarda las credenciales en `scripts/demo-credentials.json`

Ejemplo del archivo generado:

```json
{
  "email": "demo+20260305-230000@example.com",
  "password": "DemoPass123!",
  "tenantId": "00000000-0000-0000-0000-000000000000",
  "branchId": "00000000-0000-0000-0000-000000000001",
  "userId": "00000000-0000-0000-0000-000000000002",
  "createdAt": "2026-03-06T04:00:00Z"
}
```

## 3. Probar la UI
1. Abre `http://localhost:3000/login`
2. Usa el `email` y `password` del archivo `scripts/demo-credentials.json`
3. Entra a `Dashboard`
4. En el selector superior, elige la branch `Sucursal Demo`

### Services
1. Ve a `http://localhost:3000/app/services`
2. Crea un servicio:
   - Name: `Corte`
   - Duration: `30`
   - Price: `10.00`
3. Edita el servicio y cambia precio o duracion
4. Desactivalo y vuelvelo a activar

### Clients
1. Ve a `http://localhost:3000/app/clients`
2. Si no hay branch seleccionada, selecciona una arriba
3. Crea un cliente:
   - Full name: `Juan Perez`
   - Phone: `0999999999`
   - Email: `juan.perez@example.com`
4. Busca por `Juan`
5. Edita `notes` y desactiva el cliente

## 3.b Ver observabilidad
Despues de crear servicios o clientes, abre:
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

En Grafana:
1. inicia sesion con `admin / admin`
2. abre el dashboard `BarberSuite Overview`
3. revisa paneles como:
   - `HTTP Requests rate (2m)`
   - `Service creations (rate 5m)`
   - `Client creations (rate 5m)`
   - `Branch Required / Forbidden (rate 5m)`

## 3.c Ejecutar E2E con Playwright
Con el stack demo arriba:

```powershell
cd frontend
npm run e2e
```

Flujo cubierto:
- signup
- dashboard
- services create/edit/deactivate
- branch selection
- clients create/search/edit/deactivate
- logout

Reportes:
- HTML report: `frontend/playwright-report/index.html`
- traces y artifacts de fallo: `frontend/test-results/`

## 3.d Notifications (Email)
Con el stack demo arriba no hace falta exportar variables extra para SMTP: el backend Docker ya usa `barbersuite-mailhog:1025`.

Abrir:
- App: `http://localhost:3000/app/notifications`
- MailHog UI: `http://localhost:8025`

Flujo:
1. Entra a `Notifications`.
2. Completa `Enviar email de prueba`.
3. Confirma que el item aparece en `Outbox` con estado `pending` o `sent`.
4. Abre MailHog y verifica que el email llegó al inbox.

Nota:
- El worker de email corre por polling, así que el registro puede verse `pending` unos segundos antes de pasar a `sent`.

## 4. Apagar el stack

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml down
```

Atajo en Windows:

```powershell
./scripts/demo-down.ps1
```

Si quieres resetear la demo por completo, incluyendo la base Docker:

```powershell
./scripts/demo-reset.ps1
```

Si levantaste tambien observabilidad, puedes bajar todo con:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml -f docker-compose.observability.yml down
```

## Troubleshooting

### El backend no responde en 8080
- Revisa si `http://localhost:8080/actuator/health` devuelve `200`
- Ejecuta `docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml ps`
- Mira logs:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml logs backend
```

### El frontend no carga en 3000
- Verifica `docker compose ... ps`
- Mira logs:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml logs barbersuite-frontend
```

### Grafana no carga en 3001
- Verifica el estado:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml -f docker-compose.observability.yml ps
```

- Mira logs:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml -f docker-compose.observability.yml logs grafana
```

### El seed falla
- Asegurate de que el backend ya este arriba
- Vuelve a correr `./scripts/demo-seed.ps1`
- Si el puerto `8080` esta ocupado por otro proceso, libera el puerto o usa el stack Docker sin procesos locales paralelos

### El test email no llega a MailHog
- Verifica que `http://localhost:8025` cargue.
- Revisa el estado del backend:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml ps
```

- Mira logs del backend y MailHog:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml logs backend
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml logs mailhog
```

### Login entra pero navegar a Services o Clients devuelve al login
- Verifica que el frontend tenga `COOKIE_SECURE=false` en local/demo
- Si cambiaste variables, reconstruye el frontend:

```powershell
docker compose -f docker-compose.yml -f docker-compose.app.yml -f docker-compose.frontend.yml up -d --build barbersuite-frontend
```

### Los E2E fallan
- Verifica primero que `http://localhost:3000` y `http://localhost:8080/actuator/health` respondan
- Luego ejecuta:

```powershell
cd frontend
npm run e2e
```

- Si falla una prueba, abre:
  - `frontend/playwright-report/index.html`
  - `frontend/test-results/`
