# BarberSuite Frontend

Frontend App Router para onboarding, login y dashboard inicial de BarberSuite.

## Local

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

El backend debe estar disponible en `http://localhost:8080`.

## Flujos

- `POST /api/auth/login` desde Route Handlers de Next
- `POST /api/tenants/signup` desde Route Handlers de Next
- `GET /api/v1/me` desde el dashboard server-side

El JWT se guarda en cookie `httpOnly` (`bs_access_token`). No se usa `localStorage`.
