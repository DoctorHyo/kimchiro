create table public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('개선 제안', '오류 신고', '기타')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.site_feedback enable row level security;
revoke all on public.site_feedback from public, anon, authenticated;
grant insert (category, body) on public.site_feedback to anon, authenticated;
grant select, delete on public.site_feedback to authenticated;
grant update (reviewed) on public.site_feedback to authenticated;
create policy feedback_submit on public.site_feedback for insert to anon, authenticated with check (true);
create policy feedback_read on public.site_feedback for select to authenticated using ((select public.is_admin()));
create policy feedback_update on public.site_feedback for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy feedback_delete on public.site_feedback for delete to authenticated using ((select public.is_admin()));
