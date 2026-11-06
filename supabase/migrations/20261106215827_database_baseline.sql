create extension if not exists pgcrypto;

create type public.person_role as enum ('admin', 'personal', 'teacher', 'parent');
create type public.person_status as enum ('active', 'inactive', 'pending');
create type public.parent_relationship as enum ('mother', 'father', 'guardian');
create type public.kid_status as enum ('active', 'inactive');
create type public.post_type as enum (
  'food',
  'nap',
  'activity',
  'achievement',
  'mood',
  'announcement'
);
create type public.post_reaction_type as enum ('love');
create type public.post_media_format as enum ('jpg', 'jpeg', 'png', 'webp');
create type public.post_media_resource_type as enum ('image');
create type public.post_media_delivery_type as enum ('authenticated');

create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code public.person_role not null unique
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  name text not null,
  email text not null,
  job_title text null,
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

create table public.people_roles (
  daycare_id uuid not null,
  person_id uuid not null,
  role_id uuid not null,
  constraint people_roles_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint people_roles_person_fk
    foreign key (person_id, daycare_id) references public.people (id, daycare_id) on delete restrict,
  constraint people_roles_role_fk
    foreign key (role_id) references public.roles (id) on delete restrict,
  constraint people_roles_unique unique (daycare_id, person_id, role_id)
);

create index people_roles_daycare_person_idx
  on public.people_roles (daycare_id, person_id);

create index people_roles_daycare_role_idx
  on public.people_roles (daycare_id, role_id);

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

create index kids_room_daycare_idx
  on public.kids (room_id, daycare_id);

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
  constraint staff_rooms_person_room_unique unique (daycare_id, person_id, room_id)
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
  constraint parent_kids_parent_kid_unique unique (daycare_id, parent_id, kid_id)
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

create table public.feed (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  type public.post_type not null,
  author_id uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  body text not null,
  room_id uuid null,
  constraint feed_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint feed_author_fk
    foreign key (author_id, daycare_id) references public.people (id, daycare_id) on delete restrict,
  constraint feed_room_fk
    foreign key (room_id, daycare_id) references public.rooms (id, daycare_id) on delete restrict,
  constraint feed_id_daycare_unique unique (id, daycare_id)
);

create index feed_daycare_id_idx
  on public.feed (daycare_id);

create index feed_author_daycare_idx
  on public.feed (author_id, daycare_id);

create index feed_room_daycare_idx
  on public.feed (room_id, daycare_id);

create index feed_created_at_idx
  on public.feed (daycare_id, created_at desc);

create table public.feed_kids (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  feed_id uuid not null,
  kid_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_kids_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint feed_kids_feed_fk
    foreign key (feed_id, daycare_id) references public.feed (id, daycare_id) on delete cascade,
  constraint feed_kids_kid_fk
    foreign key (kid_id, daycare_id) references public.kids (id, daycare_id) on delete restrict,
  constraint feed_kids_id_daycare_unique unique (id, daycare_id),
  constraint feed_kids_feed_kid_unique unique (daycare_id, feed_id, kid_id)
);

create index feed_kids_daycare_feed_idx
  on public.feed_kids (daycare_id, feed_id);

create index feed_kids_daycare_kid_idx
  on public.feed_kids (daycare_id, kid_id);

create index feed_kids_feed_daycare_idx
  on public.feed_kids (feed_id, daycare_id);

create index feed_kids_kid_daycare_idx
  on public.feed_kids (kid_id, daycare_id);

create table public.feed_media (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  feed_id uuid not null,
  position integer not null,
  public_id text not null,
  asset_id text not null,
  resource_type public.post_media_resource_type not null,
  delivery_type public.post_media_delivery_type not null,
  format public.post_media_format not null,
  width integer not null,
  height integer not null,
  bytes integer not null,
  original_name text not null,
  alt text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_media_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint feed_media_feed_fk
    foreign key (feed_id, daycare_id) references public.feed (id, daycare_id) on delete cascade,
  constraint feed_media_id_daycare_unique unique (id, daycare_id),
  constraint feed_media_feed_position_unique unique (feed_id, position)
);

create index feed_media_daycare_feed_idx
  on public.feed_media (daycare_id, feed_id);

create index feed_media_feed_daycare_idx
  on public.feed_media (feed_id, daycare_id);

create table public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  feed_id uuid not null,
  author_id uuid not null,
  body text not null,
  created_at timestamptz not null,
  updated_at timestamptz null,
  constraint feed_comments_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint feed_comments_feed_fk
    foreign key (feed_id, daycare_id) references public.feed (id, daycare_id) on delete cascade,
  constraint feed_comments_author_fk
    foreign key (author_id, daycare_id) references public.people (id, daycare_id) on delete restrict,
  constraint feed_comments_id_daycare_unique unique (id, daycare_id)
);

create index feed_comments_daycare_feed_idx
  on public.feed_comments (daycare_id, feed_id);

create index feed_comments_feed_daycare_idx
  on public.feed_comments (feed_id, daycare_id);

create index feed_comments_author_daycare_idx
  on public.feed_comments (author_id, daycare_id);

create table public.feed_reactions (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  feed_id uuid not null,
  person_id uuid not null,
  type public.post_reaction_type not null,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint feed_reactions_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint feed_reactions_feed_fk
    foreign key (feed_id, daycare_id) references public.feed (id, daycare_id) on delete cascade,
  constraint feed_reactions_person_fk
    foreign key (person_id, daycare_id) references public.people (id, daycare_id) on delete restrict,
  constraint feed_reactions_id_daycare_unique unique (id, daycare_id)
);

create index feed_reactions_daycare_feed_idx
  on public.feed_reactions (daycare_id, feed_id);

create index feed_reactions_feed_daycare_idx
  on public.feed_reactions (feed_id, daycare_id);

create index feed_reactions_person_daycare_idx
  on public.feed_reactions (person_id, daycare_id);
