begin;
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  owner_id uuid not null unique references auth.users(id),
  invite_code text not null unique check (invite_code ~ '^[A-Z]{6}$'),
  created_at timestamptz not null default now()
);
create table public.team_members (
  user_id uuid primary key references auth.users(id) references public.profiles(user_id),
  team_id uuid not null references public.teams(id),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);
-- Deferred FK ensures the owner is a member at commit, including direct admin writes.
alter table public.teams add constraint teams_owner_membership
  foreign key (id, owner_id) references public.team_members(team_id, user_id) deferrable initially deferred;
create index team_members_team_id_idx on public.team_members(team_id);
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
revoke all on public.teams, public.team_members from anon, authenticated;
grant select on public.teams, public.team_members to authenticated;
create function public.current_team_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select team_id from public.team_members where user_id = (select auth.uid());
$$;
create function public.is_team_owner(target_team_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.teams where id = target_team_id and owner_id = (select auth.uid()));
$$;
revoke all on function public.current_team_id(), public.is_team_owner(uuid) from public, anon, authenticated;
grant execute on function public.current_team_id(), public.is_team_owner(uuid) to authenticated;
create policy teams_read_team on public.teams for select to authenticated
  using (id = (select public.current_team_id()));
create policy members_read_team on public.team_members for select to authenticated
  using (team_id = (select public.current_team_id()));
create policy profiles_read_teammates on public.profiles for select to authenticated
  using (exists (select 1 from public.team_members m where m.user_id = profiles.user_id and m.team_id = (select public.current_team_id())));
create function public.create_team(team_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); new_team uuid; code text; attempts integer := 0;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  perform 1 from public.profiles where user_id = actor for update;
  if not found then raise exception 'PROFILE_REQUIRED'; end if;
  if exists (select 1 from public.team_members where user_id = actor) then raise exception 'ALREADY_IN_TEAM'; end if;
  if team_name is null or btrim(team_name) = '' then raise exception 'TEAM_NAME_REQUIRED'; end if;
  loop
    attempts := attempts + 1;
    code := '';
    for i in 1..6 loop
      code := code || chr(65 + floor(random() * 26)::integer);
    end loop;
    begin
      insert into public.teams(name, owner_id, invite_code) values (btrim(team_name), actor, code) returning id into new_team;
      exit;
    exception when unique_violation then
      if attempts >= 10 then raise exception 'INVITE_GENERATION_FAILED'; end if;
    end;
  end loop;
  insert into public.team_members(user_id, team_id) values (actor, new_team);
  return new_team;
end;
$$;
create function public.join_team(code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); target uuid;
begin
  if actor is null then raise exception 'AUTH_REQUIRED'; end if;
  perform 1 from public.profiles where user_id = actor for update;
  if not found then raise exception 'PROFILE_REQUIRED'; end if;
  if exists (select 1 from public.team_members where user_id = actor) then raise exception 'ALREADY_IN_TEAM'; end if;
  select id into target from public.teams where invite_code = upper(btrim(code));
  if target is null then raise exception 'INVITE_NOT_FOUND'; end if;
  insert into public.team_members(user_id, team_id) values (actor, target);
  return target;
end;
$$;
revoke all on function public.create_team(text), public.join_team(text) from public, anon, authenticated;
grant execute on function public.create_team(text), public.join_team(text) to authenticated;
commit;
