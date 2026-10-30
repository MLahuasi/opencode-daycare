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
    attendance_count,
    date,
    room_label,
    greeting,
    attendance,
    display_date,
    composer_prompt,
    published_today_label
  )
  values (
    v_daycare_id,
    v_room_id,
    12,
    date '2026-06-17',
    'Guardería · Sala Soles',
    'Buenas, Caro',
    '12 niños',
    'martes 17 jun',
    'Comparte un momento…',
    'Publicado hoy'
  )
  on conflict on constraint feed_overviews_daycare_room_date_key do update
    set room_id = excluded.room_id,
        attendance_count = excluded.attendance_count,
        room_label = excluded.room_label,
        greeting = excluded.greeting,
        attendance = excluded.attendance,
        display_date = excluded.display_date,
        composer_prompt = excluded.composer_prompt,
        published_today_label = excluded.published_today_label,
        updated_at = now();
end;
$$;
