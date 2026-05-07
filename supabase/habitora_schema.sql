create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_skin text not null default 'normal',
  avatar_icon text not null default '🐯',
  share_visibility text not null default 'progress'
    check (share_visibility in ('private', 'progress', 'habits')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data_json jsonb not null default '{}'::jsonb,
  app_version integer not null default 1,
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  completed_count integer not null default 0 check (completed_count >= 0),
  total_count integer not null default 0 check (total_count >= 0),
  week_rate integer not null default 0 check (week_rate between 0 and 100),
  streak integer not null default 0 check (streak >= 0),
  completed_habits jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date_key)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> receiver_id)
);

create table if not exists public.cheers (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  stamp_id text not null check (stamp_id in ('great', 'together', 'almost', 'rest')),
  label text not null check (char_length(label) between 1 and 40),
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create index if not exists profiles_share_visibility_idx
  on public.profiles (share_visibility);

create index if not exists progress_days_user_updated_idx
  on public.progress_days (user_id, updated_at desc);

create index if not exists friendships_requester_idx
  on public.friendships (requester_id, status);

create index if not exists friendships_receiver_idx
  on public.friendships (receiver_id, status);

create unique index if not exists friendships_active_pair_idx
  on public.friendships (least(requester_id, receiver_id), greatest(requester_id, receiver_id))
  where status in ('pending', 'accepted');

create index if not exists cheers_to_user_created_idx
  on public.cheers (to_user_id, created_at desc);

create index if not exists cheers_from_user_created_idx
  on public.cheers (from_user_id, created_at desc);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.habit_states to authenticated;
grant select, insert, update on public.progress_days to authenticated;
grant select, insert, update on public.friendships to authenticated;
grant select, insert on public.cheers to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_friendship_participant_change()
returns trigger
language plpgsql
as $$
begin
  if old.requester_id <> new.requester_id or old.receiver_id <> new.receiver_id then
    raise exception 'friendship participants cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_habit_states_updated_at on public.habit_states;
create trigger set_habit_states_updated_at
before update on public.habit_states
for each row execute function public.set_updated_at();

drop trigger if exists set_progress_days_updated_at on public.progress_days;
create trigger set_progress_days_updated_at
before update on public.progress_days
for each row execute function public.set_updated_at();

drop trigger if exists set_friendships_updated_at on public.friendships;
create trigger set_friendships_updated_at
before update on public.friendships
for each row execute function public.set_updated_at();

drop trigger if exists prevent_friendship_participant_change on public.friendships;
create trigger prevent_friendship_participant_change
before update on public.friendships
for each row execute function public.prevent_friendship_participant_change();

alter table public.profiles enable row level security;
alter table public.habit_states enable row level security;
alter table public.progress_days enable row level security;
alter table public.friendships enable row level security;
alter table public.cheers enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "habit_states_select_own" on public.habit_states;
create policy "habit_states_select_own"
on public.habit_states for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "habit_states_insert_own" on public.habit_states;
create policy "habit_states_insert_own"
on public.habit_states for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "habit_states_update_own" on public.habit_states;
create policy "habit_states_update_own"
on public.habit_states for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "progress_days_select_own_or_friends" on public.progress_days;
create policy "progress_days_select_own_or_friends"
on public.progress_days for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.friendships f
    join public.profiles p on p.user_id = progress_days.user_id
    where f.status = 'accepted'
      and p.share_visibility <> 'private'
      and (
        (f.requester_id = (select auth.uid()) and f.receiver_id = progress_days.user_id)
        or (f.receiver_id = (select auth.uid()) and f.requester_id = progress_days.user_id)
      )
  )
);

drop policy if exists "progress_days_insert_own" on public.progress_days;
create policy "progress_days_insert_own"
on public.progress_days for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "progress_days_update_own" on public.progress_days;
create policy "progress_days_update_own"
on public.progress_days for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "friendships_select_participants" on public.friendships;
create policy "friendships_select_participants"
on public.friendships for select
to authenticated
using (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = receiver_id
);

drop policy if exists "friendships_insert_requester" on public.friendships;
create policy "friendships_insert_requester"
on public.friendships for insert
to authenticated
with check (
  (select auth.uid()) = requester_id
  and requester_id <> receiver_id
  and status = 'pending'
);

drop policy if exists "friendships_receiver_respond" on public.friendships;
create policy "friendships_receiver_respond"
on public.friendships for update
to authenticated
using ((select auth.uid()) = receiver_id)
with check (
  (select auth.uid()) = receiver_id
  and status in ('accepted', 'rejected')
);

drop policy if exists "friendships_requester_cancel" on public.friendships;
create policy "friendships_requester_cancel"
on public.friendships for update
to authenticated
using ((select auth.uid()) = requester_id)
with check (
  (select auth.uid()) = requester_id
  and status = 'cancelled'
);

drop policy if exists "cheers_select_participants" on public.cheers;
create policy "cheers_select_participants"
on public.cheers for select
to authenticated
using (
  (select auth.uid()) = from_user_id
  or (select auth.uid()) = to_user_id
);

drop policy if exists "cheers_insert_accepted_friend" on public.cheers;
create policy "cheers_insert_accepted_friend"
on public.cheers for insert
to authenticated
with check (
  (select auth.uid()) = from_user_id
  and from_user_id <> to_user_id
  and exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = from_user_id and f.receiver_id = to_user_id)
        or (f.receiver_id = from_user_id and f.requester_id = to_user_id)
      )
  )
);
