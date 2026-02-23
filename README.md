# Premium Event Venue CRM

Production-ready CRM web application for premium event sales and operations.

## Stack

- Next.js (App Router, TypeScript)
- Supabase (PostgreSQL, Auth, RLS)
- Google Calendar API integration
- Tailwind CSS
- Vercel deployment target

## Roles

- `ADMIN`: full CRUD + configuration + exports + integrations
- `BOARD`: read-only global access + dashboards/reports
- `MANAGER`: edit events, manage pipeline with restricted deal fields
- `STAFF`: read-only confirmed events and operational data

## Features

- Accounts management
- Deals pipeline (Kanban)
- Confirmed/planned events management
- Activities and follow-up tracking
- Dashboard KPIs:
  - Total pipeline value
  - Monthly sales value
  - Conversion rate
  - Average event value
  - Sales by source
  - Upcoming events
- Daily follow-up list
- Weekly sales report
- Audit log
- CSV exports
- Admin role management

## Quick Start

1. Install Node.js 20+.
1. Create `.env.local` from `.env.example`.
1. Install dependencies:

```bash
npm install
```

4. Run SQL migrations in Supabase SQL editor in this order:
   - `supabase/sql/001_schema.sql`
   - `supabase/sql/002_rls_policies.sql`
   - `supabase/sql/003_reporting.sql`
5. Start app:

```bash
npm run dev
```

## Deployment (Vercel)

1. Push repo to Git provider.
1. Import project in Vercel.
1. Add all environment variables from `.env.example`.
1. Deploy.

## Security Notes

- Authorization enforced at DB level through Supabase RLS.
- API route role checks are defense in depth.
- Service role key is server-side only (`SUPABASE_SERVICE_ROLE_KEY`).
- Audit logs track INSERT/UPDATE/DELETE on core business tables.

## Project docs

- `docs/FOLDER_STRUCTURE.md`
- `docs/API_ROUTES.md`
- `docs/GOOGLE_CALENDAR_INTEGRATION.md`
- `docs/RLS_OVERVIEW.md`
- `docs/DEPLOYMENT.md`
