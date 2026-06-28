alter table if exists public.games
  alter column status set default 'pending';

do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    create table public.profiles (
      id text primary key,
      display_name text,
      avatar_url text,
      role text not null default 'user',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
end $$;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_display_name_idx on public.profiles (display_name);

do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'votes'
  ) then
    create table public.votes (
      id uuid primary key default gen_random_uuid(),
      game_id text not null,
      user_id text not null,
      value smallint not null check (value in (-1, 1)),
      created_at timestamptz not null default now()
    );
  end if;
end $$;

create index if not exists votes_game_id_idx on public.votes (game_id);
create index if not exists votes_user_id_idx on public.votes (user_id);