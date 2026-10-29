create table public.staff_rooms (
  staff_id uuid not null references public.users(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, room_id)
);
