create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
