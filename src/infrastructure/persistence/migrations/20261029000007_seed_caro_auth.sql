do $$
declare
  v_daycare_id uuid;
  v_user_id uuid;
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

  insert into public.users (
    id,
    daycare_id,
    role,
    status,
    full_name,
    email
  )
  values (
    gen_random_uuid(),
    v_daycare_id,
    'staff',
    'active',
    'Caro Giménez',
    'caro@opendaycare.com'
  )
  on conflict (daycare_id, email) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        status = excluded.status,
        updated_at = now()
  returning id into v_user_id;

  insert into public.credentials (user_id, password_hash)
  values (
    v_user_id,
    '$2a$12$w/T4K04U1TSrCv5CGhh8meKTRdE7wG0/wWnW1Jbj8tylt5k6FyA6a'
  )
  on conflict (user_id) do update
    set password_hash = excluded.password_hash,
        updated_at = now();
end;
$$;
