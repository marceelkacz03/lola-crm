-- Enable required extension
create extension if not exists pgcrypto;

-- Enums
create type app_role as enum ('ADMIN', 'BOARD', 'MANAGER', 'STAFF');
create type account_type as enum ('company', 'private', 'wedding_planner');
create type account_source as enum ('internal_base', 'own_portfolio', 'planner', 'networking', 'other');
create type deal_event_type as enum ('corporate', 'wedding', 'private', 'other');
create type deal_status as enum ('new_lead', 'contacted', 'offer_sent', 'negotiation', 'reserved', 'lost');
create type event_status as enum ('planned', 'confirmed', 'completed');
create type activity_type as enum ('call', 'email', 'meeting', 'other');

-- Profiles linked to Supabase auth users
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role app_role not null default 'STAFF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_settings (
  id boolean primary key default true check (id = true),
  manager_can_edit_sensitive_fields boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into app_settings (id, manager_can_edit_sensitive_fields)
values (true, false)
on conflict (id) do nothing;

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  type account_type not null,
  name text not null,
  contact_person text,
  email text,
  phone text,
  source account_source not null default 'other',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete restrict,
  event_type deal_event_type not null default 'other',
  estimated_value numeric(12,2) not null check (estimated_value >= 0),
  estimated_guests int check (estimated_guests is null or estimated_guests >= 0),
  event_date date,
  status deal_status not null default 'new_lead',
  probability int not null check (probability >= 0 and probability <= 100),
  owner_id uuid not null references profiles (id) on delete restrict,
  next_followup_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique references deals (id) on delete cascade,
  event_date date not null,
  event_start_time time,
  event_end_time time,
  final_value numeric(12,2) not null check (final_value >= 0),
  number_of_guests int not null check (number_of_guests >= 0),
  hall text not null,
  operational_notes text,
  status event_status not null default 'planned',
  google_calendar_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  type activity_type not null,
  description text not null,
  next_step text,
  next_followup_date date,
  created_by uuid not null references profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  changed_by uuid references profiles (id) on delete set null,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now()
);

-- Performance indexes
create index if not exists idx_accounts_source on accounts (source);
create index if not exists idx_deals_status on deals (status);
create index if not exists idx_deals_owner on deals (owner_id);
create index if not exists idx_deals_next_followup on deals (next_followup_date);
create index if not exists idx_events_date on events (event_date);
create index if not exists idx_events_status on events (status);
create index if not exists idx_activities_followup on activities (next_followup_date);
create index if not exists idx_audit_logs_changed_at on audit_logs (changed_at desc);

-- Helper function: current role
create or replace function current_app_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select current_app_role() = 'ADMIN'::app_role;
$$;

create or replace function is_board()
returns boolean
language sql
stable
as $$
  select current_app_role() = 'BOARD'::app_role;
$$;

create or replace function is_manager()
returns boolean
language sql
stable
as $$
  select current_app_role() = 'MANAGER'::app_role;
$$;

create or replace function is_staff()
returns boolean
language sql
stable
as $$
  select current_app_role() = 'STAFF'::app_role;
$$;

-- Generic updated_at trigger
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger trg_settings_updated_at before update on app_settings for each row execute function set_updated_at();
create trigger trg_accounts_updated_at before update on accounts for each row execute function set_updated_at();
create trigger trg_deals_updated_at before update on deals for each row execute function set_updated_at();
create trigger trg_events_updated_at before update on events for each row execute function set_updated_at();
create trigger trg_activities_updated_at before update on activities for each row execute function set_updated_at();

-- Restrict manager edits on sensitive deal columns
create or replace function enforce_manager_deal_restrictions()
returns trigger
language plpgsql
as $$
declare
  can_edit_sensitive boolean;
begin
  if current_app_role() = 'MANAGER'::app_role then
    select manager_can_edit_sensitive_fields into can_edit_sensitive from app_settings where id = true;
    if coalesce(can_edit_sensitive, false) = false then
      if new.estimated_value is distinct from old.estimated_value then
        raise exception 'Managers cannot edit estimated_value when manager_can_edit_sensitive_fields=false';
      end if;
      if new.notes is distinct from old.notes then
        raise exception 'Managers cannot edit notes when manager_can_edit_sensitive_fields=false';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_deals_manager_restrictions
before update on deals
for each row
execute function enforce_manager_deal_restrictions();

-- Audit trigger for critical data changes
create or replace function write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into audit_logs (table_name, record_id, action, changed_by, old_data, new_data)
    values (tg_table_name, new.id, tg_op, auth.uid(), null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into audit_logs (table_name, record_id, action, changed_by, old_data, new_data)
    values (tg_table_name, new.id, tg_op, auth.uid(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into audit_logs (table_name, record_id, action, changed_by, old_data, new_data)
    values (tg_table_name, old.id, tg_op, auth.uid(), to_jsonb(old), null);
    return old;
  end if;
  return null;
end;
$$;

create trigger trg_accounts_audit after insert or update or delete on accounts for each row execute function write_audit_log();
create trigger trg_deals_audit after insert or update or delete on deals for each row execute function write_audit_log();
create trigger trg_events_audit after insert or update or delete on events for each row execute function write_audit_log();
create trigger trg_activities_audit after insert or update or delete on activities for each row execute function write_audit_log();

-- Automatically create a profile when a new auth user is created
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce((new.raw_user_meta_data ->> 'role')::app_role, 'STAFF'::app_role)
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Fallback role assignment if metadata role is invalid
    insert into public.profiles (id, email, role)
    values (new.id, coalesce(new.email, ''), 'STAFF'::app_role)
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function handle_new_user();

-- Explicit grants (RLS still applies)
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
