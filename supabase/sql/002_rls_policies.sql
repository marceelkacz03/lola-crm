-- Enable RLS on all tables
alter table profiles enable row level security;
alter table app_settings enable row level security;
alter table accounts enable row level security;
alter table deals enable row level security;
alter table events enable row level security;
alter table activities enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "profiles_select_self_or_admin_board" on profiles;
drop policy if exists "profiles_insert_admin_only" on profiles;
drop policy if exists "profiles_update_admin_only" on profiles;
drop policy if exists "profiles_delete_admin_only" on profiles;

drop policy if exists "app_settings_read_admin_board" on app_settings;
drop policy if exists "app_settings_update_admin" on app_settings;

drop policy if exists "accounts_select_admin_board_manager" on accounts;
drop policy if exists "accounts_insert_admin_manager" on accounts;
drop policy if exists "accounts_update_admin_manager" on accounts;
drop policy if exists "accounts_delete_admin_only" on accounts;

drop policy if exists "deals_select_admin_board_manager" on deals;
drop policy if exists "deals_insert_admin_manager" on deals;
drop policy if exists "deals_update_admin_manager" on deals;
drop policy if exists "deals_delete_admin_only" on deals;

drop policy if exists "events_select_admin_board_manager" on events;
drop policy if exists "events_insert_admin_manager" on events;
drop policy if exists "events_update_admin_manager" on events;
drop policy if exists "events_delete_admin_only" on events;

drop policy if exists "activities_select_admin_board_manager" on activities;
drop policy if exists "activities_insert_admin_manager" on activities;
drop policy if exists "activities_update_admin_manager" on activities;
drop policy if exists "activities_delete_admin_only" on activities;

drop policy if exists "audit_logs_select_admin_board" on audit_logs;
drop policy if exists "audit_logs_insert_authenticated" on audit_logs;
drop policy if exists "audit_logs_delete_admin_only" on audit_logs;

-- Profiles
create policy "profiles_select_self_or_admin_board"
on profiles for select
using (id = auth.uid() or is_admin() or is_board());

create policy "profiles_insert_admin_only"
on profiles for insert
with check (is_admin());

create policy "profiles_update_admin_only"
on profiles for update
using (is_admin())
with check (is_admin());

create policy "profiles_delete_admin_only"
on profiles for delete
using (is_admin());

-- App settings
create policy "app_settings_read_admin_board"
on app_settings for select
using (is_admin() or is_board());

create policy "app_settings_update_admin"
on app_settings for update
using (is_admin())
with check (is_admin());

-- Accounts
create policy "accounts_select_admin_board_manager"
on accounts for select
using (is_admin() or is_board() or is_manager());

create policy "accounts_insert_admin_manager"
on accounts for insert
with check (is_admin() or is_manager());

create policy "accounts_update_admin_manager"
on accounts for update
using (is_admin() or is_manager())
with check (is_admin() or is_manager());

create policy "accounts_delete_admin_only"
on accounts for delete
using (is_admin());

-- Deals
create policy "deals_select_admin_board_manager"
on deals for select
using (is_admin() or is_board() or is_manager());

create policy "deals_insert_admin_manager"
on deals for insert
with check (is_admin() or is_manager());

create policy "deals_update_admin_manager"
on deals for update
using (is_admin() or is_manager())
with check (is_admin() or is_manager());

create policy "deals_delete_admin_only"
on deals for delete
using (is_admin());

-- Events
create policy "events_select_admin_board_manager"
on events for select
using (
  is_admin()
  or is_board()
  or is_manager()
  or (is_staff() and status = 'confirmed'::event_status)
);

create policy "events_insert_admin_manager"
on events for insert
with check (is_admin() or is_manager());

create policy "events_update_admin_manager"
on events for update
using (is_admin() or is_manager())
with check (is_admin() or is_manager());

create policy "events_delete_admin_only"
on events for delete
using (is_admin());

-- Activities
create policy "activities_select_admin_board_manager"
on activities for select
using (is_admin() or is_board() or is_manager());

create policy "activities_insert_admin_manager"
on activities for insert
with check (
  (is_admin() or is_manager())
  and created_by = auth.uid()
);

create policy "activities_update_admin_manager"
on activities for update
using (is_admin() or is_manager())
with check (is_admin() or is_manager());

create policy "activities_delete_admin_only"
on activities for delete
using (is_admin());

-- Audit logs
create policy "audit_logs_select_admin_board"
on audit_logs for select
using (is_admin() or is_board());

create policy "audit_logs_insert_authenticated"
on audit_logs for insert
with check (auth.uid() is not null);

create policy "audit_logs_delete_admin_only"
on audit_logs for delete
using (is_admin());
