create table public.users (
  id uuid primary key,
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  email text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_daycare_email_key unique (daycare_id, email)
);
