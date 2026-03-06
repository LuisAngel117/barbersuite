# App Shell

## Layout
El area autenticada `/app/*` usa un shell responsivo con tres capas:
- Desktop: sidebar izquierda colapsable en modo icono
- Topbar: trigger, breadcrumbs, branch selector y acciones de usuario
- Mobile: bottom nav fija + sheet `More`

El layout vive en:
- `frontend/src/app/app/layout.tsx`

## Fuente unica de navegacion
La configuracion central esta en:
- `frontend/src/config/app-nav.ts`

Define:
- grupos (`Core`, `Operaciones`, `Administración`, `Sistema`)
- `href`
- icono
- labels `es` / `en`
- roles permitidos
- items `mobilePrimary`

## Role-based UI gating
La UI no expone el mismo menu para todos los roles.

Resumen:
- `ADMIN`
  ve dashboard, appointments, services, clients, receipts, branches, settings y ui-kit en dev
- `MANAGER`
  ve dashboard, appointments, services, clients, receipts, branches, settings y ui-kit en dev
- `RECEPTION`
  ve dashboard, appointments, services, clients y receipts
- `BARBER`
  ve dashboard, appointments, services y clients

Nota:
- este gating es de navegacion y chrome visual
- no reemplaza autorizacion de backend

## Componentes principales
- `frontend/src/components/app-sidebar.tsx`
- `frontend/src/components/app-topbar.tsx`
- `frontend/src/components/app-breadcrumbs.tsx`
- `frontend/src/components/mobile-bottom-nav.tsx`
- `frontend/src/components/app-user-menu.tsx`

## Branch selector
`BranchSelector` permanece accesible:
- desktop: topbar
- mobile: sheet `More`

El selector sigue usando la cookie `bs_branch_id` y mantiene el `data-testid="branch-selector"` para E2E.

## Testids E2E
Convenciones que el shell preserva:
- `nav-services`
- `nav-clients`
- `nav-user-menu`
- `nav-logout`
- `branch-selector`

Esto permite evolucionar la navegacion sin romper Playwright en cada iteracion.
