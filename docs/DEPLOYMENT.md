# Deployment (Vercel + Supabase)

## 1. Prepare Supabase

1. Create a Supabase project.
1. Run SQL files in order:
   - `supabase/sql/001_schema.sql`
   - `supabase/sql/002_rls_policies.sql`
   - `supabase/sql/003_reporting.sql`
1. Create at least one user and set role in `profiles` to `ADMIN`.

## 2. Configure environment variables

Set in Vercel project settings:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_IMPERSONATED_USER` (optional)

## 3. Deploy

1. Connect repository to Vercel.
1. Select framework: Next.js.
1. Trigger first deployment.
1. Verify:
   - login works
   - RLS blocks unauthorized roles
   - CSV export works for `ADMIN`/`BOARD`
   - Google Calendar sync works on `reserved` and `confirmed`
