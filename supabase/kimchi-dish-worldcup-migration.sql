create table public.kimchi_dish_worldcup_results (
  game_id uuid primary key,
  winner text not null check (winner in ('김치찌개','참치김치찌개','돼지고기 김치찌개','부대찌개','김치볶음밥','치즈김치볶음밥','김치볶음밥 오므라이스','김치전','김치치즈전','김치만두','김치만둣국','김치수제비','김치칼국수','김치말이국수','김치비빔국수','김치우동','김치라면','김치라볶이','김치떡볶이','김치찜','등갈비 김치찜','김치두루치기','두부김치','김치제육볶음','삼겹살 김치볶음','김치찜닭','김치찜갈비','김치볶음우동','김치볶음면','김치주먹밥','김치김밥','김치치즈토스트')),
  created_at timestamptz not null default now()
);
alter table public.kimchi_dish_worldcup_results enable row level security;
revoke all on public.kimchi_dish_worldcup_results from public, anon, authenticated;
create function public.submit_kimchi_dish_result(p_game_id uuid, p_winner text) returns void
language sql security definer set search_path = '' as $$
 insert into public.kimchi_dish_worldcup_results(game_id,winner) values (p_game_id,p_winner) on conflict (game_id) do nothing;
$$;
create function public.kimchi_dish_rankings() returns table(winner text, wins bigint)
language sql stable security definer set search_path = '' as $$
 select r.winner, count(*) as wins from public.kimchi_dish_worldcup_results r group by r.winner order by wins desc, r.winner;
$$;
revoke all on function public.submit_kimchi_dish_result(uuid,text) from public;
revoke all on function public.kimchi_dish_rankings() from public;
grant execute on function public.submit_kimchi_dish_result(uuid,text) to anon, authenticated;
grant execute on function public.kimchi_dish_rankings() to anon, authenticated;
