do $$
declare
  v_daycare_id uuid;
  v_staff_id uuid;
  v_soles_room_id uuid;
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
  into v_staff_id
  from public.users
  where daycare_id = v_daycare_id
    and email = 'caro@opendaycare.com'
  limit 1;

  if v_staff_id is null then
    raise exception 'Seed requires staff user "caro@opendaycare.com" in daycare "Guardería Sala Soles"';
  end if;

  insert into public.rooms (daycare_id, name)
  values (v_daycare_id, 'Soles')
  on conflict (daycare_id, name) do update
    set updated_at = now();

  insert into public.rooms (daycare_id, name)
  values (v_daycare_id, 'Girasoles')
  on conflict (daycare_id, name) do update
    set updated_at = now();

  insert into public.rooms (daycare_id, name)
  values (v_daycare_id, 'Patitos')
  on conflict (daycare_id, name) do update
    set updated_at = now();

  select id
  into v_soles_room_id
  from public.rooms
  where daycare_id = v_daycare_id
    and name = 'Soles'
  limit 1;

  if v_soles_room_id is null then
    raise exception 'Seed requires room "Soles" in daycare "Guardería Sala Soles"';
  end if;

  insert into public.staff_rooms (staff_id, room_id)
  values (v_staff_id, v_soles_room_id)
  on conflict (staff_id, room_id) do nothing;
end;
$$;
