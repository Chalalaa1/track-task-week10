begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) > 0),
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
create policy profiles_read_self on public.profiles for select to authenticated
  using (user_id = (select auth.uid()));

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare profile_name text;
begin
  profile_name := btrim(new.raw_user_meta_data ->> 'display_name');
  if profile_name is null or profile_name = '' then
    raise exception 'DISPLAY_NAME_REQUIRED';
  end if;
  insert into public.profiles(user_id, display_name, email)
  values (new.id, profile_name, new.email);
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where user_id = new.id;
  return new;
end;
$$;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
create trigger on_auth_email_updated after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- Support accounts created before installing US-1.
insert into public.profiles(user_id, display_name, email)
select id, coalesce(nullif(btrim(raw_user_meta_data ->> 'display_name'), ''), 'ผู้ใช้'), email
from auth.users where email is not null
on conflict (user_id) do nothing;
commit;
