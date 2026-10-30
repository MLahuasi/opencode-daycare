create table public.feed_overviews (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  room_id uuid references public.rooms(id) on delete restrict,
  room_label_key text not null,
  greeting_key text not null,
  attendance_count integer not null,
  date date not null,
  composer_prompt_key text not null,
  published_today_label_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_overviews_attendance_count_non_negative_check
    check (attendance_count >= 0),
  constraint feed_overviews_daycare_room_date_key
    unique nulls not distinct (daycare_id, room_id, date)
);

alter table public.feed_overviews enable row level security;

create index feed_overviews_daycare_date_idx
  on public.feed_overviews (daycare_id, date desc);

create index feed_overviews_room_id_idx
  on public.feed_overviews (room_id);

do $$
declare
  v_daycare_id uuid;
  v_room_id uuid;
begin
  select id
  into v_daycare_id
  from public.daycares
  where name = 'Guardería Sala Soles'
    and address = 'Av. Principal 123, Centro'
  limit 1;

  if v_daycare_id is null then
    raise exception 'Seed requires daycare "Guardería Sala Soles" at "Av. Principal 123, Centro"';
  end if;

  select id
  into v_room_id
  from public.rooms
  where daycare_id = v_daycare_id
    and name = 'Soles'
  limit 1;

  if v_room_id is null then
    raise exception 'Seed requires room "Soles" in daycare "Guardería Sala Soles"';
  end if;

  insert into public.feed_overviews (
    daycare_id,
    room_id,
    room_label_key,
    greeting_key,
    attendance_count,
    date,
    composer_prompt_key,
    published_today_label_key
  )
  values (
    v_daycare_id,
    v_room_id,
    'feed.room_label',
    'feed.greeting',
    12,
    '2026-06-17',
    'feed.composer_prompt',
    'feed.published_today'
  )
  on conflict on constraint feed_overviews_daycare_room_date_key do update
    set room_id = excluded.room_id,
        room_label_key = excluded.room_label_key,
        greeting_key = excluded.greeting_key,
        attendance_count = excluded.attendance_count,
        date = excluded.date,
        composer_prompt_key = excluded.composer_prompt_key,
        published_today_label_key = excluded.published_today_label_key,
        updated_at = now();
end;
$$;
