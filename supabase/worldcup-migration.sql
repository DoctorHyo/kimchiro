create table public.worldcup_results (
  game_id uuid primary key,
  winner text not null check (winner in ('배추김치','백김치','깍두기','총각김치','열무김치','열무물김치','동치미','나박김치','오이소박이','파김치','갓김치','부추김치','겉절이','묵은지','보쌈김치','석박지','얼갈이김치','봄동겉절이','고들빼기김치','깻잎김치','고구마줄기김치','가지김치','고추소박이','양배추김치','대파김치','무청김치','순무김치','동치미무김치','돌나물물김치','미나리김치','수박김치','콩나물김치')),
  created_at timestamptz not null default now()
);
alter table public.worldcup_results enable row level security;
revoke all on public.worldcup_results from public, anon, authenticated;

create function public.submit_worldcup_result(p_game_id uuid, p_winner text) returns void
language sql security definer set search_path = '' as $$
  insert into public.worldcup_results(game_id,winner) values (p_game_id,p_winner)
  on conflict (game_id) do nothing;
$$;
create function public.worldcup_rankings() returns table(winner text, wins bigint)
language sql stable security definer set search_path = '' as $$
  select r.winner, count(*) as wins from public.worldcup_results r
  group by r.winner order by wins desc, r.winner;
$$;
revoke all on function public.submit_worldcup_result(uuid,text) from public;
revoke all on function public.worldcup_rankings() from public;
grant execute on function public.submit_worldcup_result(uuid,text) to anon, authenticated;
grant execute on function public.worldcup_rankings() to anon, authenticated;
