-- Run once in the Supabase SQL editor for an existing Kimchiro project.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) between 1 and 40),
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists reviews_store_date_idx on public.reviews (store_id, created_at desc);
alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant insert (store_id, nickname, rating, body) on public.reviews to anon, authenticated;
grant delete on public.reviews to authenticated;
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select to anon, authenticated using (true);
drop policy if exists reviews_submit on public.reviews;
create policy reviews_submit on public.reviews for insert to anon, authenticated with check (true);
drop policy if exists reviews_admin_delete on public.reviews;
create policy reviews_admin_delete on public.reviews for delete to authenticated using (public.is_admin());
