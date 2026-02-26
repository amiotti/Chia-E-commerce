alter table if exists public.users_profile
  add column if not exists password_hash text;

update public.users_profile
set password_hash = coalesce(password_hash, '')
where password_hash is null;

alter table if exists public.users_profile
  alter column password_hash set not null;