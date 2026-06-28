alter table if exists public.games
add column if not exists status text not null default 'approved';

alter table if exists public.games
add column if not exists rejection_reason text;

create index if not exists games_status_created_at_idx
  on public.games (status, created_at desc);

create index if not exists games_user_id_status_idx
  on public.games (user_id, status);