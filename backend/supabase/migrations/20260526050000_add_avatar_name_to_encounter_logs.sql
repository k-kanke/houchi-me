alter table public.encounter_logs
  add column if not exists avatar_name text not null default '';
