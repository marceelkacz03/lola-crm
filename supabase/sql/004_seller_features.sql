-- Accounts: seller fields
alter table accounts
  add column if not exists sales_status text not null default 'new',
  add column if not exists estimated_value numeric(12,2),
  add column if not exists next_followup_date date;

alter table accounts
  drop constraint if exists accounts_sales_status_check;

alter table accounts
  add constraint accounts_sales_status_check
  check (sales_status in ('new', 'contacted', 'offer_sent', 'negotiation', 'won', 'lost'));

create index if not exists idx_accounts_sales_status on accounts (sales_status);
create index if not exists idx_accounts_followup_date on accounts (next_followup_date);

-- Client interactions timeline
create table if not exists client_interactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  type text not null check (type in ('call', 'email', 'meeting', 'note')),
  note text not null,
  next_followup_date date,
  created_by uuid not null references profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_interactions_account on client_interactions (account_id, created_at desc);
create index if not exists idx_client_interactions_followup on client_interactions (next_followup_date);

-- Message templates
create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'other' check (type in ('first_contact', 'followup', 'offer', 'other')),
  content text not null,
  created_by uuid not null references profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_message_templates_type on message_templates (type);

-- Reminder notification log
create table if not exists reminder_notification_logs (
  id uuid primary key default gen_random_uuid(),
  sent_at timestamptz not null default now(),
  channel text not null check (channel in ('email', 'push', 'telegram')),
  status text not null check (status in ('sent', 'skipped', 'error')),
  details text
);

-- Enable RLS
alter table client_interactions enable row level security;
alter table message_templates enable row level security;
alter table reminder_notification_logs enable row level security;

drop policy if exists "client_interactions_select_admin_board_manager" on client_interactions;
drop policy if exists "client_interactions_insert_admin_manager" on client_interactions;
drop policy if exists "client_interactions_delete_admin_only" on client_interactions;

drop policy if exists "message_templates_select_authenticated" on message_templates;
drop policy if exists "message_templates_insert_admin_manager" on message_templates;
drop policy if exists "message_templates_update_admin_manager" on message_templates;
drop policy if exists "message_templates_delete_admin_manager" on message_templates;

drop policy if exists "reminder_logs_select_admin_board_manager" on reminder_notification_logs;
drop policy if exists "reminder_logs_insert_admin_manager" on reminder_notification_logs;

create policy "client_interactions_select_admin_board_manager"
on client_interactions for select
using (is_admin() or is_board() or is_manager());

create policy "client_interactions_insert_admin_manager"
on client_interactions for insert
with check ((is_admin() or is_manager()) and created_by = auth.uid());

create policy "client_interactions_delete_admin_only"
on client_interactions for delete
using (is_admin());

create policy "message_templates_select_authenticated"
on message_templates for select
using (auth.uid() is not null);

create policy "message_templates_insert_admin_manager"
on message_templates for insert
with check ((is_admin() or is_manager()) and created_by = auth.uid());

create policy "message_templates_update_admin_manager"
on message_templates for update
using (is_admin() or is_manager())
with check (is_admin() or is_manager());

create policy "message_templates_delete_admin_manager"
on message_templates for delete
using (is_admin() or is_manager());

create policy "reminder_logs_select_admin_board_manager"
on reminder_notification_logs for select
using (is_admin() or is_board() or is_manager());

create policy "reminder_logs_insert_admin_manager"
on reminder_notification_logs for insert
with check (is_admin() or is_manager());

-- Audit for new tables
drop trigger if exists trg_client_interactions_audit on client_interactions;
drop trigger if exists trg_message_templates_audit on message_templates;

create trigger trg_client_interactions_audit
after insert or update or delete on client_interactions
for each row execute function write_audit_log();

create trigger trg_message_templates_audit
after insert or update or delete on message_templates
for each row execute function write_audit_log();
