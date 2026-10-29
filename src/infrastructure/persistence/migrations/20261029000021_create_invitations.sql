create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  child_id uuid not null references public.children(id) on delete restrict,
  invited_by_user_id uuid not null references public.users(id) on delete restrict,
  accepted_user_id uuid references public.users(id) on delete restrict,
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitations_code_key unique (code),
  constraint invitations_status_fields_check check (
    (status = 'accepted' and accepted_user_id is not null and accepted_at is not null)
    or (status in ('pending', 'expired') and accepted_user_id is null and accepted_at is null)
  )
);
