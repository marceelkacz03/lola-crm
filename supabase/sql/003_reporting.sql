create or replace view daily_followup_reminders as
select
  'deal'::text as source,
  d.id as reference_id,
  a.name as account_name,
  d.next_followup_date as due_date,
  d.status::text as state
from deals d
join accounts a on a.id = d.account_id
where d.next_followup_date = current_date

union all

select
  'activity'::text as source,
  act.id as reference_id,
  a.name as account_name,
  act.next_followup_date as due_date,
  act.type::text as state
from activities act
join deals d on d.id = act.deal_id
join accounts a on a.id = d.account_id
where act.next_followup_date = current_date;

create or replace function weekly_sales_report()
returns table (
  period_start date,
  period_end date,
  pipeline_value numeric,
  conversion_rate numeric,
  confirmed_revenue numeric
)
language sql
stable
as $$
  with window as (
    select (current_date - interval '7 day')::date as start_date, current_date as end_date
  ),
  deal_data as (
    select d.*
    from deals d, window w
    where d.created_at::date between w.start_date and w.end_date
  ),
  event_data as (
    select e.*
    from events e, window w
    where e.created_at::date between w.start_date and w.end_date
  )
  select
    w.start_date as period_start,
    w.end_date as period_end,
    coalesce((select sum(estimated_value) from deal_data), 0)::numeric as pipeline_value,
    case
      when (
        (select count(*) from deal_data where status in ('reserved', 'lost'))
      ) = 0 then 0
      else
        (
          (select count(*) from deal_data where status = 'reserved')::numeric
          /
          (select count(*) from deal_data where status in ('reserved', 'lost'))::numeric
        ) * 100
    end as conversion_rate,
    coalesce(
      (
        select sum(final_value)
        from event_data
        where status in ('confirmed', 'completed')
      ),
      0
    )::numeric as confirmed_revenue
  from window w;
$$;
