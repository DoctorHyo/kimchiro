alter table public.reviews add column photo_data text;
alter table public.reviews add constraint review_photo_valid check (
  photo_data is null or (char_length(photo_data) <= 100000 and photo_data ~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$')
);
grant insert (photo_data) on public.reviews to anon, authenticated;
