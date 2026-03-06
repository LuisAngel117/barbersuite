# Web Security

## Objetivo
Endurecer la capa web del frontend sin exponer el JWT al browser ni cambiar reglas de negocio del backend.

El modelo actual usa:
- BFF en Next Route Handlers para todas las llamadas operativas
- cookie `bs_access_token` como credencial de sesión `httpOnly`
- cookie `bs_branch_id` para contexto branch-scoped
- cookie `bs_csrf` para defensa CSRF por double-submit token

## Modelo BFF + cookies
El browser nunca llama directo al backend.

Flujo:
1. el usuario hace login o signup contra rutas internas `/api/*`
2. el Route Handler habla con el backend real
3. el JWT queda guardado en `bs_access_token` como cookie `httpOnly`
4. los componentes cliente consumen solo rutas internas del frontend

Ventaja:
- el token no queda en `localStorage`
- el browser no necesita conocer ni construir headers `Authorization`
- la política de seguridad queda centralizada en el BFF

## Cookies
Cookies relevantes:
- `bs_access_token`
  - `httpOnly=true`
  - `sameSite=lax`
  - `secure=true` en producción real
  - `maxAge` alineado con `expiresIn` del backend
- `bs_csrf`
  - `httpOnly=false`
  - `sameSite=lax`
  - `secure=true` en producción real
  - `maxAge` alineado con la sesión
- `bs_branch_id`
  - no es secreto
  - persiste la sucursal seleccionada para endpoints branch-scoped

## CSRF defense-in-depth
`SameSite=Lax` ya reduce parte del riesgo CSRF, pero no es una defensa suficiente por sí sola.

Por eso el frontend agrega dos controles:

### 1. Double-submit CSRF token
En login/signup se crea la cookie `bs_csrf`.

Para requests mutantes del BFF:
- `POST`
- `PATCH`

el browser debe enviar:
- cookie `bs_csrf`
- header `X-CSRF-Token`

El Route Handler compara ambos valores:
- si falta alguno: `403 CSRF_REQUIRED`
- si no coinciden: `403 CSRF_FAILED`

### 2. Origin / Referer validation
En requests unsafe el BFF valida:
- `Origin`
- o, si no existe, `Referer`

Si alguno existe y no coincide con el origen de la app:
- `403 ORIGIN_FORBIDDEN`

Si ambos faltan, el request se permite para no romper herramientas o clientes legítimos que no los envían.

## Route Handlers protegidos
Rutas mutantes protegidas por CSRF + same-origin:
- `/api/services` `POST`
- `/api/services/[serviceId]` `PATCH`
- `/api/clients` `POST`
- `/api/clients/[clientId]` `PATCH`
- `/api/branch/select` `POST`
- `/api/auth/logout` `POST`

Adicionalmente:
- `/api/auth/login` y `/api/tenants/signup` validan same-origin antes de crear sesión

## Security headers
Next agrega headers globales:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy-Report-Only`

La CSP está en `Report-Only` para no romper el demo ni el runtime de Next.

Nota:
- una CSP estricta de producción requeriría nonces o hashes para scripts
- en este proyecto se deja en modo observación para endurecer sin romper DX/demo

## Códigos de error nuevos
- `CSRF_REQUIRED`
  - falta el header `X-CSRF-Token` o la cookie `bs_csrf`
- `CSRF_FAILED`
  - el token del header no coincide con la cookie
- `ORIGIN_FORBIDDEN`
  - el `Origin` o `Referer` no corresponde al origen de la app

## E2E
Playwright cubre la regresión de seguridad:
- mutación sin `X-CSRF-Token` -> `403`
- mutación con token correcto -> `2xx`

Esto valida que el hardening está activo sobre el BFF real y no solo como código muerto.
