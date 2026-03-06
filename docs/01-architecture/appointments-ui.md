# Appointments UI

## Scope

The appointments module lives in `/app/appointments` and uses:

- `GET /api/barbers`
- `GET /api/appointments`
- `POST /api/appointments`
- `PATCH /api/appointments/[appointmentId]`

through the Next BFF layer only.

## Views

The UI uses FullCalendar with three views:

- Day: `timeGridDay`
- Week: `timeGridWeek`
- List: `listWeek`

The toolbar is rendered with the internal design system instead of the default FullCalendar header so it stays consistent with the rest of the app shell.

## Time Zone

The calendar runs in the selected branch time zone.

Source of truth:

- branch selected in `bs_branch_id`
- branch metadata from `/me`
- `timeZone` passed into the calendar component

FullCalendar uses the Luxon plugin for named IANA zones, so the agenda renders and edits time slots using the branch local time while the backend keeps UTC instants.

## Mutations

Create and edit flows run inside a sheet using RHF + Zod.

Protected paths:

- `POST /api/appointments`
- `PATCH /api/appointments/[appointmentId]`

These mutations still go through the hardened BFF, so CSRF and same-origin checks remain enforced before the request reaches the backend.

## Overlap UX

When the backend rejects a conflicting slot with `409 APPOINTMENT_OVERLAP`, the UI maps it to a specific toast and keeps drag/drop or resize operations reversible.

## Empty States

The page handles three main non-happy paths without falling back to a raw placeholder:

- no branch selected
- no barbers available in the selected branch
- BFF/backend problem responses shown as a consistent problem banner
