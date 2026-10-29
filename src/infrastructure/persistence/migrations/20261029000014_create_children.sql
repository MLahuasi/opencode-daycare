create table public.children (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  room_id uuid references public.rooms(id) on delete restrict,
  slug text not null,
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null,
  medical_notes text not null default '',
  allergy_tags text[] not null default '{}',
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint children_daycare_slug_key unique (daycare_id, slug)
);
