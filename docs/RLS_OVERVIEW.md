# Supabase RLS Overview

RLS is enabled on:

- `profiles`
- `app_settings`
- `accounts`
- `deals`
- `events`
- `activities`
- `audit_logs`

## Access matrix

- `ADMIN`: full access on business tables, role management, exports
- `BOARD`: read-only on all CRM data, reports, and audit logs
- `MANAGER`: edit operations data (`events`, `activities`, selected `deals` fields)
- `STAFF`: read-only `events` where `status = 'confirmed'`

## Additional controls

- `deals` trigger blocks manager updates to `estimated_value` and `notes` unless:
  - `app_settings.manager_can_edit_sensitive_fields = true`
- `audit_logs` trigger records all inserts/updates/deletes for core tables with:
  - `changed_by`
  - `old_data`
  - `new_data`
  - `changed_at`
