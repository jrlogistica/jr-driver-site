-- J.R TECNOLOGIA - CONTADOR PUBLICO DE VISITAS
-- Uma visita por navegador a cada dia, controlada no site.
-- Nao armazena IP, nome, e-mail, aparelho ou qualquer dado pessoal.

create table if not exists public.jr_site_visits_daily (
  visit_day date primary key,
  total bigint not null default 0 check (total >= 0),
  updated_at timestamptz not null default now()
);

alter table public.jr_site_visits_daily enable row level security;
revoke all on table public.jr_site_visits_daily from public, anon, authenticated;

create or replace function public.get_jr_site_visit_stats()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total', coalesce(sum(v.total), 0)::bigint,
    'today', coalesce(sum(v.total) filter (where v.visit_day = current_date), 0)::bigint
  )
  from public.jr_site_visits_daily as v;
$$;

create or replace function public.register_jr_site_visit()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stats jsonb;
begin
  insert into public.jr_site_visits_daily (visit_day, total, updated_at)
  values (current_date, 1, now())
  on conflict (visit_day)
  do update set total = public.jr_site_visits_daily.total + 1, updated_at = now();

  select jsonb_build_object(
    'total', coalesce(sum(v.total), 0)::bigint,
    'today', coalesce(sum(v.total) filter (where v.visit_day = current_date), 0)::bigint
  )
  into v_stats
  from public.jr_site_visits_daily as v;

  return v_stats;
end;
$$;

revoke execute on function public.get_jr_site_visit_stats() from public, anon, authenticated;
revoke execute on function public.register_jr_site_visit() from public, anon, authenticated;
grant execute on function public.get_jr_site_visit_stats() to anon, authenticated;
grant execute on function public.register_jr_site_visit() to anon, authenticated;

notify pgrst, 'reload schema';
