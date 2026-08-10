-- J.R DRIVER - CONTADOR PUBLICO DE DOWNLOADS
-- Execute uma unica vez no SQL Editor do projeto Supabase usado pelo J.R Driver.
-- Nao armazena IP, nome, e-mail, aparelho ou qualquer dado pessoal.

create table if not exists public.jr_driver_downloads (
  version text primary key,
  total bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.jr_driver_downloads (version, total)
values ('9.7.1-alpha.1', 0)
on conflict (version) do nothing;

alter table public.jr_driver_downloads enable row level security;

-- A tabela nao fica exposta diretamente ao navegador.
revoke all on public.jr_driver_downloads from anon, authenticated;

create or replace function public.get_jr_driver_download_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(total), 0)::bigint
  from public.jr_driver_downloads;
$$;

create or replace function public.register_jr_driver_download(p_version text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
begin
  insert into public.jr_driver_downloads (version, total, updated_at)
  values (coalesce(nullif(trim(p_version), ''), 'desconhecida'), 1, now())
  on conflict (version)
  do update set
    total = public.jr_driver_downloads.total + 1,
    updated_at = now();

  select coalesce(sum(total), 0)::bigint
  into v_total
  from public.jr_driver_downloads;

  return v_total;
end;
$$;

-- O site usa somente estas duas funcoes com a chave publica do projeto.
grant execute on function public.get_jr_driver_download_count() to anon, authenticated;
grant execute on function public.register_jr_driver_download(text) to anon, authenticated;

-- Atualiza o cache da Data API do Supabase.
notify pgrst, 'reload schema';
