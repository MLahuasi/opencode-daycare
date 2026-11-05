create extension if not exists pgcrypto;

do $$
begin
  create type public.person_role as enum ('parent', 'personal');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.person_status as enum ('active', 'inactive', 'pending');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.parent_relationship as enum ('mother', 'father', 'guardian');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.kid_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end
$$;

create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  name text not null,
  email text not null,
  role public.person_role not null,
  status public.person_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint people_id_daycare_unique unique (id, daycare_id)
);

create unique index people_daycare_lower_email_unique
  on public.people (daycare_id, lower(email));

create index people_daycare_id_idx
  on public.people (daycare_id);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint rooms_id_daycare_unique unique (id, daycare_id),
  constraint rooms_daycare_name_unique unique (daycare_id, name)
);

create index rooms_daycare_id_idx
  on public.rooms (daycare_id);

create table public.kids (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  slug text not null,
  name text not null,
  birth_date date not null,
  room_id uuid not null,
  enrollment_date date not null,
  medical_notes text not null,
  allergies text not null,
  status public.kid_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kids_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint kids_room_fk
    foreign key (room_id, daycare_id) references public.rooms (id, daycare_id) on delete restrict,
  constraint kids_id_daycare_unique unique (id, daycare_id),
  constraint kids_daycare_slug_unique unique (daycare_id, slug)
);

create index kids_daycare_room_idx
  on public.kids (daycare_id, room_id);

create table public.credential (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  person_id uuid not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint credential_person_fk
    foreign key (person_id, daycare_id) references public.people (id, daycare_id) on delete restrict,
  constraint credential_id_daycare_unique unique (id, daycare_id)
);

create index credential_person_daycare_idx
  on public.credential (person_id, daycare_id);

create index credential_daycare_id_idx
  on public.credential (daycare_id);

create table public.staff_rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  person_id uuid not null,
  room_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_rooms_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint staff_rooms_person_fk
    foreign key (person_id, daycare_id) references public.people (id, daycare_id) on delete restrict,
  constraint staff_rooms_room_fk
    foreign key (room_id, daycare_id) references public.rooms (id, daycare_id) on delete restrict,
  constraint staff_rooms_id_daycare_unique unique (id, daycare_id),
  constraint staff_rooms_person_room_unique unique (person_id, room_id)
);

create index staff_rooms_daycare_person_idx
  on public.staff_rooms (daycare_id, person_id);

create index staff_rooms_daycare_room_idx
  on public.staff_rooms (daycare_id, room_id);

create index staff_rooms_person_daycare_idx
  on public.staff_rooms (person_id, daycare_id);

create index staff_rooms_room_daycare_idx
  on public.staff_rooms (room_id, daycare_id);

create table public.parent_kids (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  parent_id uuid not null,
  kid_id uuid not null,
  relationship public.parent_relationship not null,
  photo_sharing_consent boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_kids_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint parent_kids_parent_fk
    foreign key (parent_id, daycare_id) references public.people (id, daycare_id) on delete restrict,
  constraint parent_kids_kid_fk
    foreign key (kid_id, daycare_id) references public.kids (id, daycare_id) on delete restrict,
  constraint parent_kids_id_daycare_unique unique (id, daycare_id),
  constraint parent_kids_parent_kid_unique unique (parent_id, kid_id)
);

create index parent_kids_daycare_parent_idx
  on public.parent_kids (daycare_id, parent_id);

create index parent_kids_daycare_kid_idx
  on public.parent_kids (daycare_id, kid_id);

create index parent_kids_parent_daycare_idx
  on public.parent_kids (parent_id, daycare_id);

create index parent_kids_kid_daycare_idx
  on public.parent_kids (kid_id, daycare_id);

create table public.invitation (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  person_id uuid not null,
  kid_id uuid not null,
  relationship public.parent_relationship not null,
  code text not null,
  expires_at timestamptz not null,
  sent_at timestamptz null,
  accepted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint invitation_person_fk
    foreign key (person_id, daycare_id) references public.people (id, daycare_id) on delete restrict,
  constraint invitation_kid_fk
    foreign key (kid_id, daycare_id) references public.kids (id, daycare_id) on delete restrict,
  constraint invitation_id_daycare_unique unique (id, daycare_id)
);

create index invitation_daycare_idx
  on public.invitation (daycare_id);

create index invitation_person_daycare_idx
  on public.invitation (person_id, daycare_id);

create index invitation_kid_daycare_idx
  on public.invitation (kid_id, daycare_id);

create index invitation_expires_at_idx
  on public.invitation (expires_at);

create index kids_room_daycare_idx
  on public.kids (room_id, daycare_id);

alter table public.daycares enable row level security;
alter table public.people enable row level security;
alter table public.credential enable row level security;
alter table public.invitation enable row level security;
alter table public.rooms enable row level security;
alter table public.staff_rooms enable row level security;
alter table public.kids enable row level security;
alter table public.parent_kids enable row level security;

revoke all privileges on table public.daycares, public.people, public.credential,
  public.invitation, public.rooms, public.staff_rooms, public.kids, public.parent_kids
  from anon, authenticated;
