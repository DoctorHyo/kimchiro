-- Execute once in the Supabase SQL editor. Create the operator in Authentication
-- and insert that user's UUID into public.app_admins using the dashboard SQL editor.
create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.app_admins where user_id = auth.uid()); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  created_at timestamptz not null default now(),
  constraint store_valid check (coalesce((
    jsonb_typeof(data) = 'object' and
    jsonb_typeof(data->'name') = 'string' and length(data->>'name') between 1 and 120 and
    jsonb_typeof(data->'address') = 'string' and length(data->>'address') between 1 and 300 and
    jsonb_typeof(data->'note') = 'string' and length(data->>'note') between 1 and 2000 and
    jsonb_typeof(data->'evidence') = 'string' and length(data->>'evidence') between 1 and 100 and
    jsonb_typeof(data->'verifiedAt') = 'string' and length(data->>'verifiedAt') = 10 and
    pg_column_size(data) < 10000
  ), false))
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  created_at timestamptz not null default now(),
  constraint report_valid check (coalesce((
    jsonb_typeof(data) = 'object' and
    jsonb_typeof(data->'name') = 'string' and length(data->>'name') between 1 and 120 and
    jsonb_typeof(data->'address') = 'string' and length(data->>'address') between 1 and 300 and
    jsonb_typeof(data->'note') = 'string' and length(data->>'note') between 1 and 2000 and
    jsonb_typeof(data->'evidence') = 'string' and length(data->>'evidence') between 1 and 100 and
    jsonb_typeof(data->'verifiedAt') = 'string' and length(data->>'verifiedAt') = 10 and
    pg_column_size(data) < 10000
  ), false))
);
alter table public.stores enable row level security;
alter table public.reports enable row level security;
revoke all on public.stores, public.reports from anon, authenticated;
grant select on public.stores to anon, authenticated;
grant insert, update, delete on public.stores to authenticated;
grant insert on public.reports to anon, authenticated;
grant select, delete on public.reports to authenticated;
create policy stores_read on public.stores for select to anon, authenticated using (true);
create policy stores_insert on public.stores for insert to authenticated with check (public.is_admin());
create policy stores_update on public.stores for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy stores_delete on public.stores for delete to authenticated using (public.is_admin());
create policy report_submit on public.reports for insert to anon, authenticated with check (true);
create policy report_read on public.reports for select to authenticated using (public.is_admin());
create policy report_delete on public.reports for delete to authenticated using (public.is_admin());

-- One transaction: a failed insert never removes a report.
create function public.approve_report(report_id uuid, store_data jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if not exists (select 1 from public.reports where id = report_id) then raise exception 'report not found'; end if;
  insert into public.stores(data) values(store_data);
  delete from public.reports where id = report_id;
end;
$$;
revoke all on function public.approve_report(uuid,jsonb) from public;
grant execute on function public.approve_report(uuid,jsonb) to authenticated;

