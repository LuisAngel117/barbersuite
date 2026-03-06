# Dashboard And Placeholders

## Objetivo

El dashboard de `/app` debe sentirse como producto real desde el primer minuto, incluso mientras algunos módulos siguen pendientes. La estrategia es:

- usar solo datos ya disponibles (`/me` + BFF de `services` y `clients`)
- concentrar contexto y quick actions en una vista inicial fuerte
- reemplazar placeholders planos por páginas premium coherentes con el app shell

## Dashboard

La página [frontend/src/app/app/page.tsx](c:/Users/luisa/Proyecto/barbersuite/frontend/src/app/app/page.tsx) usa:

- `getDashboardContext()` para `tenant`, `user`, `roles`, `branches` y `selectedBranchId`
- `fetchBffJson()` para leer `/api/services` y `/api/clients`
- `Suspense` con fallback skeleton para que counts y actividad no aparezcan “de golpe”

El dashboard muestra:

- sucursal activa
- cantidad de servicios
- cantidad de clientes de la sucursal seleccionada
- rol actual + tenant
- quick actions
- últimos clientes del branch activo

## Data Sources

No se agregan endpoints nuevos. La fuente de verdad es:

- `/me` para identidad, roles, tenant y branches accesibles
- `/api/services` para catálogo tenant-scoped
- `/api/clients?page=0&size=5` para total y actividad reciente branch-scoped

## Quick Actions

Las acciones rápidas usan query params en rutas existentes:

- `/app/services?create=1`
- `/app/clients?create=1`

Los componentes cliente [frontend/src/components/services/services-table.tsx](c:/Users/luisa/Proyecto/barbersuite/frontend/src/components/services/services-table.tsx) y [frontend/src/components/clients/clients-table.tsx](c:/Users/luisa/Proyecto/barbersuite/frontend/src/components/clients/clients-table.tsx) detectan `create=1`, abren el sheet correspondiente y limpian el query param sin recargar la página.

## Premium Placeholders

Los módulos futuros usan el patrón:

- [frontend/src/components/page-header.tsx](c:/Users/luisa/Proyecto/barbersuite/frontend/src/components/page-header.tsx)
- [frontend/src/components/empty-state.tsx](c:/Users/luisa/Proyecto/barbersuite/frontend/src/components/empty-state.tsx)
- [frontend/src/components/module-placeholder.tsx](c:/Users/luisa/Proyecto/barbersuite/frontend/src/components/module-placeholder.tsx)

Cada placeholder premium incluye:

- header consistente
- estado vacío visualmente fuerte
- descripción de valor futuro
- roadmap breve en 2-4 bullets
- CTA primaria y secundaria

## Role-Based UI

La UI mantiene gating visual por rol:

- `ADMIN` y `MANAGER` ven módulos administrativos como `branches`, `reports` y `settings`
- `RECEPTION` mantiene acceso a operación y caja
- `BARBER` no ve CTAs administrativos y recibe estado “sin acceso” si entra directo a páginas restringidas

El gating usa el helper [frontend/src/lib/roles.ts](c:/Users/luisa/Proyecto/barbersuite/frontend/src/lib/roles.ts) y la configuración de navegación en [frontend/src/config/app-nav.ts](c:/Users/luisa/Proyecto/barbersuite/frontend/src/config/app-nav.ts).

## i18n

Los textos nuevos viven en:

- [frontend/src/i18n/messages/es.json](c:/Users/luisa/Proyecto/barbersuite/frontend/src/i18n/messages/es.json)
- [frontend/src/i18n/messages/en.json](c:/Users/luisa/Proyecto/barbersuite/frontend/src/i18n/messages/en.json)

El objetivo es que dashboard, quick actions y placeholders se sientan consistentes en ES y EN sin introducir rutas por locale.
