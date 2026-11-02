create table public.kimchi_partners (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120),
 status text not null default '조사 중' check(status in ('조사 중','연락 예정','연락 완료','참여 확정')),
 phone text not null default '' check(length(phone)<=100), source text not null default '' check(length(source)<=1000),
 memo text not null default '' check(length(memo)<=4000), updated_at timestamptz not null default now()
);
alter table public.kimchi_partners enable row level security;
revoke all on public.kimchi_partners from anon, authenticated;
grant select,insert,update,delete on public.kimchi_partners to authenticated;
create policy partners_admin on public.kimchi_partners for all to authenticated using (public.is_admin()) with check (public.is_admin());
create table public.kimchi_products (
 id uuid primary key default gen_random_uuid(), name text not null, product text not null,
 kind text not null check(kind in ('온라인','매장')), address text not null default '',
 link text not null, source text not null, verified_on date not null,
 check(length(name) between 1 and 120 and length(product) between 1 and 200 and length(address)<=300 and length(link)<=1000 and length(source)<=1000),
 check(link ~ '^https://' and source ~ '^https://')
);
alter table public.kimchi_products enable row level security;
revoke all on public.kimchi_products from anon, authenticated;
grant select on public.kimchi_products to anon,authenticated;
grant insert,update,delete on public.kimchi_products to authenticated;
create policy products_read on public.kimchi_products for select to anon,authenticated using (true);
create policy products_write on public.kimchi_products for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.kimchi_partners(name,phone,source,memo) values
('가가호호김치','0504-0526-8168','https://www.daangn.com/kr/local-profile/%EA%B0%80%EA%B0%80%ED%98%B8%ED%98%B8%EA%B9%80%EC%B9%98-ocq4hgu6w7v8/','용산 매장 및 배송. 제품별 배추·고춧가루 원산지와 등록 의사 확인 필요.'),
('김치클래식 화곡역점','010-3481-7331','https://www.daangn.com/kr/local-profile/%EA%B9%80%EC%B9%98%ED%81%B4%EB%9E%98%EC%8B%9D-%ED%99%94%EA%B3%A1%EC%97%AD%EC%A0%90-pz5x4fr2cp1y/','화곡 매장 및 택배. 제품별 원산지와 등록 의사 확인 필요.'),
('팔공김치','1522-3651','https://www.8030kimchi.com/shopinfo/ceo.html','공식몰 운영. 제품별 원산지와 제휴 담당자 확인 필요.'),
('한울','02-2685-3359','https://hanul.com/business/hanul.html','영업·마케팅본부 공개번호. 제품별 원산지 확인 필요.'),
('마음심은','','https://view.asiae.co.kr/article/2022062013040790206','2022년 보도 기준. 현 운영 주체, 공식 판매처, 전화 및 원산지 재확인 필요.');
