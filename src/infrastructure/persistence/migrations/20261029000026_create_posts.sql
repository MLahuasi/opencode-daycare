create table public.posts (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  author_id uuid not null references public.users(id) on delete restrict,
  room_id uuid references public.rooms(id) on delete restrict,
  type public.post_type not null,
  body text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
