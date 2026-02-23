# API Routes

## Authenticated CRM routes

- `GET /api/accounts`: list accounts (`ADMIN`, `BOARD`, `MANAGER`)
- `POST /api/accounts`: create account (`ADMIN`, `MANAGER`)

- `GET /api/deals`: list deals (`ADMIN`, `BOARD`, `MANAGER`)
- `POST /api/deals`: create deal (`ADMIN`, `MANAGER`)
- `PATCH /api/deals/:id`: update deal status/follow-up (`ADMIN`, `MANAGER`)
  - When status becomes `reserved`, app creates/updates a linked event and Google Calendar event

- `GET /api/events`: list events (`ADMIN`, `BOARD`, `MANAGER`, `STAFF` with `confirmed` only)
- `POST /api/events`: create event (`ADMIN`, `MANAGER`)
- `PATCH /api/events/:id`: update event (`ADMIN`, `MANAGER`)
  - When status is `confirmed`, app creates/updates Google Calendar event

- `GET /api/activities`: list activities (`ADMIN`, `BOARD`, `MANAGER`)
- `POST /api/activities`: create activity (`ADMIN`, `MANAGER`)

- `GET /api/reports/weekly`: weekly sales report (`ADMIN`, `BOARD`, `MANAGER`)
- `GET /api/reminders/daily`: daily follow-up list (`ADMIN`, `BOARD`, `MANAGER`)

- `GET /api/export/:entity`: CSV export (`ADMIN`, `BOARD`)
  - Allowed entities: `accounts`, `deals`, `events`, `activities`, `audit_logs`

- `PATCH /api/admin/users/:id/role`: role management (`ADMIN`)
