begin;
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  title text not null check (length(btrim(title)) > 0),
  description text,
  due_date date,
  assignee_id uuid not null references auth.users(id),
  created_by uuid not null references auth.users(id),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (team_id, assignee_id) references public.team_members(team_id, user_id),
  foreign key (team_id, created_by) references public.team_members(team_id, user_id)
);
create index tasks_team_status_idx on public.tasks(team_id, status);
create index tasks_assignee_due_idx on public.tasks(assignee_id, due_date);
create index tasks_created_by_idx on public.tasks(created_by);
alter table public.tasks enable row level security;
revoke all on public.tasks from anon, authenticated;
grant select, insert, update on public.tasks to authenticated;
create policy tasks_read_team on public.tasks for select to authenticated
  using (team_id = (select public.current_team_id()));
create policy tasks_insert_owner on public.tasks for insert to authenticated
  with check (public.is_team_owner(team_id) and created_by = (select auth.uid()) and status = 'todo');
create policy tasks_update_owner_or_assignee on public.tasks for update to authenticated
  using (team_id = (select public.current_team_id()) and (public.is_team_owner(team_id) or assignee_id = (select auth.uid())))
  with check (team_id = (select public.current_team_id()) and (public.is_team_owner(team_id) or assignee_id = (select auth.uid())));
create function public.guard_task_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.team_id is distinct from old.team_id
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'CANNOT_CHANGE_OWNER';
  end if;
  if not public.is_team_owner(old.team_id) and
     (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at') then
    raise exception 'ONLY_STATUS_ALLOWED';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.guard_task_update() from public, anon, authenticated;
create trigger guard_task_update before update on public.tasks
  for each row execute function public.guard_task_update();
commit;
