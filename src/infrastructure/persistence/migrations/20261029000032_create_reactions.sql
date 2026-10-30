create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type public.reaction_type not null default 'love',
  created_at timestamptz not null default now(),
  constraint reactions_post_user_key unique (post_id, user_id)
);
