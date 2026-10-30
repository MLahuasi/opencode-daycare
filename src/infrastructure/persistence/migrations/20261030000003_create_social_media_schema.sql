do $$
begin
  create type public.post_type as enum (
    'food',
    'nap',
    'activity',
    'achievement',
    'mood',
    'announcement'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.post_reaction_type as enum ('love');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.post_media_format as enum ('jpg', 'jpeg', 'png', 'webp');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.post_media_resource_type as enum ('image');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.post_media_delivery_type as enum ('authenticated');
exception
  when duplicate_object then null;
end
$$;

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
  constraint feed_kids_feed_kid_unique unique (feed_id, kid_id)
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

create table public.feed_overview (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null,
  room_label text not null,
  greeting text not null,
  attendance text not null,
  date text not null,
  composer_prompt text not null,
  published_today_label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_overview_daycare_fk
    foreign key (daycare_id) references public.daycares (id) on delete restrict,
  constraint feed_overview_daycare_unique unique (daycare_id),
  constraint feed_overview_id_daycare_unique unique (id, daycare_id)
);

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

alter table public.feed enable row level security;
alter table public.feed_kids enable row level security;
alter table public.feed_media enable row level security;
alter table public.feed_comments enable row level security;
alter table public.feed_overview enable row level security;
alter table public.feed_reactions enable row level security;

revoke all privileges on table public.feed, public.feed_kids, public.feed_media,
  public.feed_comments, public.feed_overview, public.feed_reactions
  from anon, authenticated;
