# Data Table

## Overview

BarberSuite usa un kit interno de tablas construido con `@tanstack/react-table` y primitives de shadcn. La meta es repetir un mismo patrón visual y de interacción en listados operativos, sin volver a escribir tablas bespoke en cada slice.

La implementación vive en:

- `frontend/src/components/data-table/data-table.tsx`
- `frontend/src/components/data-table/data-table-toolbar.tsx`
- `frontend/src/components/data-table/data-table-pagination.tsx`
- `frontend/src/components/data-table/data-table-row-actions.tsx`
- `frontend/src/components/data-table/data-table-empty.tsx`
- `frontend/src/components/data-table/data-table-skeleton.tsx`

## Why This Stack

- TanStack Table resuelve sorting y paginación con control explícito de estado.
- shadcn aporta primitives coherentes con el resto del design system.
- El contenedor de cada pantalla mantiene el fetch, el RBAC y las mutaciones; la tabla solo resuelve presentación y mecánica reusable.

## Conventions

- `Services` usa client-side pagination y search local.
- `Clients` usa manual pagination porque el backend ya expone `page`, `size`, `totalItems` y `totalPages`.
- No se mezcla sorting client-side con server pagination si el backend no controla ese orden.
- Row actions viven en dropdown y las acciones destructivas pasan por confirm dialog.
- Empty states y skeletons salen del kit, no de cada pantalla.

## i18n

El kit consume keys de `common` para labels compartidos:

- `search`
- `clear`
- `actions`
- `page`
- `of`
- `rowsPerPage`
- `previous`
- `next`
- `emptyTitle`
- `emptyDescription`

Las pantallas siguen aportando sus textos de dominio, por ejemplo `services.*` o `clients.*`.

## E2E Test IDs

Convenciones relevantes para Playwright:

- filas:
  - `services-row-{slug}`
  - `clients-row-{slug}`
- trigger de acciones:
  - `services-actions-{slug}`
  - `clients-actions-{slug}`
- items del dropdown:
  - `services-edit-{slug}`
  - `services-toggle-{slug}`
  - `clients-edit-{slug}`
  - `clients-toggle-{slug}`
- confirm destructivo:
  - `{actionTestId}-confirm`

Los botones principales existentes se conservan:

- `services-add`
- `clients-add`
- `clients-search`
- `clients-search-submit`

## Visual Validation

Hay una demo interna del patrón en:

- `/app/ui-kit`

Esa ruta renderiza una tabla de ejemplo con toolbar, paginación, row actions y estados vacíos sin depender del backend.
