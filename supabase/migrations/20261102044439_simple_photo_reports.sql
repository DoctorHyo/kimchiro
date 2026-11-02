alter table public.reports drop constraint report_valid;
alter table public.reports add constraint report_valid check (coalesce((
jsonb_typeof(data)='object' and jsonb_typeof(data->'name')='string' and length(btrim(data->>'name')) between 1 and 120
and jsonb_typeof(data->'address')='string' and length(btrim(data->>'address')) between 1 and 300
and (
  (not (data ? 'version') and jsonb_typeof(data->'note')='string' and length(data->>'note') between 1 and 2000
   and jsonb_typeof(data->'evidence')='string' and length(data->>'evidence') between 1 and 100
   and jsonb_typeof(data->'verifiedAt')='string' and length(data->>'verifiedAt')=10 and pg_column_size(data)<10000)
  or
  (data->'version'='2'::jsonb and data->>'status'='pending'
   and jsonb_typeof(data->'neighborhood')='string' and length(btrim(data->>'neighborhood')) between 1 and 100
   and jsonb_typeof(data->'submittedAt')='string' and length(data->>'submittedAt') between 20 and 30
   and jsonb_typeof(data->'photo')='string' and length(data->>'photo') between 100 and 1400000
   and (data->>'photo') ~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$'
   and pg_column_size(data)<1450000)
)),false));
