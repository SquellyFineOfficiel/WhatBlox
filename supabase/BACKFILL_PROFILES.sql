insert into public.profiles (id, display_name, avatar_url, role)
select distinct user_id, null, null, 'user'
from (
  select user_id from public.games where user_id is not null
  union
  select user_id from public.votes where user_id is not null
) as user_ids
on conflict (id) do nothing;