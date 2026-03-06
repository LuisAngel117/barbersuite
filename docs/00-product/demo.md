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

### El seed falla
- Asegurate de que el backend ya este arriba
- Vuelve a correr `./scripts/demo-seed.ps1`
- Si el puerto `8080` esta ocupado por otro proceso, libera el puerto o usa el stack Docker sin procesos locales paralelos
