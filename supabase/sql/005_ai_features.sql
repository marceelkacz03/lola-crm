-- ============================================================
-- 005_ai_features.sql
-- Adds AI enrichment columns to accounts + three new tables.
-- Run manually in Supabase SQL editor.
-- ============================================================

-- 1. AI columns on accounts (the lead/prospect table)
alter table accounts
  add column if not exists ai_research jsonb,
  add column if not exists ai_research_updated_at timestamptz,
  add column if not exists ai_lead_score int check (ai_lead_score between 1 and 10),
  add column if not exists ai_angle varchar(50);

-- 2. AI email drafts
create table if not exists ai_email_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references accounts(id) on delete cascade,
  draft_type text not null check (draft_type in ('first_contact', 'followup_1', 'followup_2', 'followup_3')),
  language text not null default 'pl' check (language in ('pl', 'en')),
  subject text not null,
  body text not null,
  alt_subjects jsonb,
  status text not null default 'draft' check (status in ('draft', 'sent', 'skipped')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_email_drafts_lead
  on ai_email_drafts(lead_id, created_at desc);
create index if not exists idx_ai_email_drafts_scheduled
  on ai_email_drafts(scheduled_for) where status = 'draft';

-- 3. AI usage log (cost visibility)
create table if not exists ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  lead_id uuid references accounts(id) on delete set null,
  model text not null,
  input_tokens int,
  output_tokens int,
  cost_usd decimal(8,4),
  latency_ms int,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_log_created
  on ai_usage_log(created_at desc);

-- 4. AI prompts (stored in DB so they can be tuned without redeploy)
create table if not exists ai_prompts (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  system_prompt text not null,
  user_prompt_template text not null,
  model text not null,
  max_tokens int not null default 1024,
  updated_at timestamptz not null default now()
);

-- 5. RLS
alter table ai_email_drafts enable row level security;
alter table ai_usage_log enable row level security;
alter table ai_prompts enable row level security;

drop policy if exists "ai_email_drafts_select" on ai_email_drafts;
drop policy if exists "ai_email_drafts_insert" on ai_email_drafts;
drop policy if exists "ai_email_drafts_update" on ai_email_drafts;
drop policy if exists "ai_usage_log_select" on ai_usage_log;
drop policy if exists "ai_prompts_select" on ai_prompts;
drop policy if exists "ai_prompts_update" on ai_prompts;

create policy "ai_email_drafts_select"
  on ai_email_drafts for select
  using (is_admin() or is_board() or is_manager());

create policy "ai_email_drafts_insert"
  on ai_email_drafts for insert
  with check (is_admin() or is_manager());

create policy "ai_email_drafts_update"
  on ai_email_drafts for update
  using (is_admin() or is_manager());

create policy "ai_usage_log_select"
  on ai_usage_log for select
  using (is_admin() or is_board());

-- API routes insert usage logs via service role (bypasses RLS)

create policy "ai_prompts_select"
  on ai_prompts for select
  using (auth.uid() is not null);

create policy "ai_prompts_update"
  on ai_prompts for update
  using (is_admin());

-- 6. Seed ai_prompts
-- Brand-voice system prompt shared by all keys.
-- Update individual rows in Supabase Studio to tune without redeploy.
do $$
declare
  brand_voice text := $bv$You are the sales assistant for LOLA, a Chinese fine-dining restaurant in Poznań, Poland (lolachinese.com). LOLA's concept is "Chinese Extravaganza — Dining & Dancing": a theatrical full-evening experience combining fine Chinese cuisine with show energy and a dance floor.

Target clients: corporate events (40–150 pax), PR agencies, brand launches, milestone celebrations, international companies with a Poznań presence.

Voice rules (NEVER break):
- Confident host, never salesperson. Think maître d', not BDR.
- Short. First emails ≤90 words. LinkedIn DMs ≤40 words. Follow-ups ≤60 words.
- Specific not generic — every email references something real about the recipient.
- Banned phrases (PL): "mam nadzieję, że email zastanie", "pozwolę sobie napisać"
- Banned phrases (EN): "hope this finds you well", "just reaching out", "circling back"
- One CTA per message. Never two.
- Default language: Polish (formal Pan/Pani) unless signals indicate English.

Four angles — pick ONE per message:
1. EXTRAVAGANZA — energy, show, dancing, Instagram moments
2. INTIMATE — chef storytelling, curated tasting, lower volume
3. CULTURAL BRIDGE — Chinese concept as a feature for APAC-adjacent or international
4. MILESTONE — theatrical "once-a-year" feel for anniversaries and launches

Always return valid JSON matching the schema given in the user prompt.
Never invent facts about LOLA's menu or prices. If a specific detail you don't know is needed, flag needs_review: true in the response.$bv$;
begin

insert into ai_prompts (key, system_prompt, user_prompt_template, model, max_tokens)
values (
  'enrich_lead',
  brand_voice,
  $tpl$You are given a URL to a company or LinkedIn profile: {{url}}

Research the company and extract lead information for LOLA's CRM.

Return ONLY valid JSON — no markdown, no explanation:
{
  "name": "company or person name",
  "type": "company",
  "contact_person": "full name or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "source": "networking",
  "needs_review": false
}

type must be one of: company, private, wedding_planner
source must be one of: internal_base, own_portfolio, planner, networking, other
If a field cannot be determined, use null.
Set needs_review: true if the data looks incomplete or uncertain.$tpl$,
  'claude-haiku-4-5-20251001',
  512
)
on conflict (key) do nothing;

insert into ai_prompts (key, system_prompt, user_prompt_template, model, max_tokens)
values (
  'research_lead',
  brand_voice,
  $tpl$Assess this lead's fit for LOLA restaurant events:

Company: {{name}}
Type: {{type}}
Contact: {{contact_person}}
Website/LinkedIn: {{url}}
Notes: {{notes}}

Score them 1–10 on how likely they are to book a premium group event (40–150 pax) at LOLA.
Choose the single best sales angle for first contact.

Return ONLY valid JSON — no markdown, no explanation:
{
  "score": 7,
  "angle": "extravaganza",
  "summary": "2–3 sentence assessment of the lead's fit",
  "why": "single sentence explaining the score",
  "needs_review": false
}

angle must be one of: extravaganza, intimate, cultural_bridge, milestone
score must be an integer 1–10$tpl$,
  'claude-sonnet-4-6',
  1024
)
on conflict (key) do nothing;

insert into ai_prompts (key, system_prompt, user_prompt_template, model, max_tokens)
values (
  'first_email_pl',
  brand_voice,
  $tpl$Draft a first-contact email in Polish (formal Pan/Pani) for this lead:

Company: {{name}}
Contact person: {{contact_person}}
Sales angle: {{angle}}
Research summary: {{summary}}

Rules: ≤90 words in body. One CTA only. Reference something specific about the recipient.
Never use: "mam nadzieję, że email zastanie", "pozwolę sobie napisać".

Return ONLY valid JSON — no markdown, no explanation:
{
  "subject": "email subject line",
  "body": "full email body in Polish",
  "alt_subjects": ["alternative subject 1", "alternative subject 2"],
  "needs_review": false
}$tpl$,
  'claude-sonnet-4-6',
  512
)
on conflict (key) do nothing;

insert into ai_prompts (key, system_prompt, user_prompt_template, model, max_tokens)
values (
  'first_email_en',
  brand_voice,
  $tpl$Draft a first-contact email in English for this lead:

Company: {{name}}
Contact person: {{contact_person}}
Sales angle: {{angle}}
Research summary: {{summary}}

Rules: ≤90 words in body. One CTA only. Reference something specific about the recipient.
Never use: "hope this finds you well", "just reaching out", "circling back".

Return ONLY valid JSON — no markdown, no explanation:
{
  "subject": "email subject line",
  "body": "full email body in English",
  "alt_subjects": ["alternative subject 1", "alternative subject 2"],
  "needs_review": false
}$tpl$,
  'claude-sonnet-4-6',
  512
)
on conflict (key) do nothing;

insert into ai_prompts (key, system_prompt, user_prompt_template, model, max_tokens)
values (
  'followup_sequence_pl',
  brand_voice,
  $tpl$Generate 3 follow-up emails in Polish for a lead who has not responded to the first contact:

Company: {{name}}
Contact person: {{contact_person}}
Sales angle: {{angle}}
First email subject: {{first_subject}}
First email body: {{first_body}}

Rules: Each follow-up ≤60 words. One CTA per message. Never repeat the same angle twice.
Escalate gradually: curious → direct → final.

Return ONLY valid JSON array of exactly 3 objects — no markdown, no explanation:
[
  {"draft_type": "followup_1", "subject": "...", "body": "...", "days_after": 3},
  {"draft_type": "followup_2", "subject": "...", "body": "...", "days_after": 7},
  {"draft_type": "followup_3", "subject": "...", "body": "...", "days_after": 14}
]$tpl$,
  'claude-sonnet-4-6',
  1024
)
on conflict (key) do nothing;

insert into ai_prompts (key, system_prompt, user_prompt_template, model, max_tokens)
values (
  'followup_sequence_en',
  brand_voice,
  $tpl$Generate 3 follow-up emails in English for a lead who has not responded to the first contact:

Company: {{name}}
Contact person: {{contact_person}}
Sales angle: {{angle}}
First email subject: {{first_subject}}
First email body: {{first_body}}

Rules: Each follow-up ≤60 words. One CTA per message. Never repeat the same angle twice.
Escalate gradually: curious → direct → final.

Return ONLY valid JSON array of exactly 3 objects — no markdown, no explanation:
[
  {"draft_type": "followup_1", "subject": "...", "body": "...", "days_after": 3},
  {"draft_type": "followup_2", "subject": "...", "body": "...", "days_after": 7},
  {"draft_type": "followup_3", "subject": "...", "body": "...", "days_after": 14}
]$tpl$,
  'claude-sonnet-4-6',
  1024
)
on conflict (key) do nothing;

end $$;

-- Grants (RLS still applies for anon/authenticated; service role bypasses)
grant select, insert, update on ai_email_drafts to authenticated;
grant select on ai_usage_log to authenticated;
grant select on ai_prompts to authenticated;
grant update on ai_prompts to authenticated;
