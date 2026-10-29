create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete restrict,
  child_id uuid not null references public.children(id) on delete restrict,
  relationship public.relationship_type not null,
  photo_sharing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_children_parent_child_key unique (parent_id, child_id)
);
