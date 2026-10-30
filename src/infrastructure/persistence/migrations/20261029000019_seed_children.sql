do $$
declare
  v_daycare_id uuid;
  v_soles_room_id uuid;
  v_girasoles_room_id uuid;
  v_patitos_room_id uuid;
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
  into v_soles_room_id
  from public.rooms
  where daycare_id = v_daycare_id
    and name = 'Soles'
  limit 1;

  if v_soles_room_id is null then
    raise exception 'Seed requires room "Soles" in daycare "Guardería Sala Soles"';
  end if;

  select id
  into v_girasoles_room_id
  from public.rooms
  where daycare_id = v_daycare_id
    and name = 'Girasoles'
  limit 1;

  if v_girasoles_room_id is null then
    raise exception 'Seed requires room "Girasoles" in daycare "Guardería Sala Soles"';
  end if;

  select id
  into v_patitos_room_id
  from public.rooms
  where daycare_id = v_daycare_id
    and name = 'Patitos'
  limit 1;

  if v_patitos_room_id is null then
    raise exception 'Seed requires room "Patitos" in daycare "Guardería Sala Soles"';
  end if;

  insert into public.children (
    daycare_id,
    room_id,
    slug,
    full_name,
    birth_date,
    enrolled_at,
    medical_notes,
    allergy_tags,
    status
  )
  values
    (
      v_daycare_id,
      v_soles_room_id,
      'mateo-fernandez',
      'Mateo Fernández',
      '2022-09-14',
      '2025-02-03',
      'Alergia al maní y sensibilidad a la lactosa. Lleva una botella de agua identificada.',
      array['peanut', 'lactose', 'cheese'],
      'active'
    ),
    (
      v_daycare_id,
      v_soles_room_id,
      'sofia-mendez',
      'Sofía Méndez',
      '2023-08-22',
      '2025-03-10',
      'Alergia al polen. Avisar a la familia ante síntomas persistentes.',
      array['pollen'],
      'active'
    ),
    (
      v_daycare_id,
      v_soles_room_id,
      'benjamin-ruiz',
      'Benjamín Ruiz',
      '2022-11-06',
      '2025-01-13',
      'Usa lentes para actividades de cerca. Guardar el estuche en su mochila.',
      '{}'::text[],
      'active'
    ),
    (
      v_daycare_id,
      v_soles_room_id,
      'valentina-soto',
      'Valentina Soto',
      '2023-07-19',
      '2026-02-02',
      'No hay notas médicas registradas.',
      '{}'::text[],
      'active'
    ),
    (
      v_daycare_id,
      v_soles_room_id,
      'tomas-diaz',
      'Tomás Díaz',
      '2022-12-18',
      '2025-04-07',
      'Sensibilidad a la lactosa y alergia al maní. Ofrecer las alternativas indicadas en la cocina.',
      array['lactose', 'peanut'],
      'active'
    ),
    (
      v_daycare_id,
      v_soles_room_id,
      'emma-castro',
      'Emma Castro',
      '2023-10-03',
      '2026-01-12',
      'Sin alergias conocidas. Avisar a la familia ante síntomas persistentes.',
      '{}'::text[],
      'active'
    ),
    (
      v_daycare_id,
      v_soles_room_id,
      'lucas-romero',
      'Lucas Romero',
      '2022-10-27',
      '2025-02-17',
      'Evitar alimentos con gluten. Cuenta con inhalador de rescate en su bolso, según autorización vigente.',
      array['gluten'],
      'active'
    ),
    (
      v_daycare_id,
      v_soles_room_id,
      'olivia-vega',
      'Olivia Vega',
      '2023-06-11',
      '2025-08-04',
      'Sin indicaciones médicas especiales registradas.',
      '{}'::text[],
      'active'
    ),
    (
      v_daycare_id,
      v_patitos_room_id,
      'martina-lopez',
      'Martina López Vega',
      '2023-05-15',
      '2026-09-18',
      'Tienes alergia al mani, camarones y gluten, debe tomar un antiestaminico una vez al dia despues del almuerzo',
      array['pollen', 'dust_mites'],
      'active'
    ),
    (
      v_daycare_id,
      v_soles_room_id,
      'chewbacca-lahuasi',
      'Chewbacca Lahuasi',
      '2017-08-15',
      '2026-09-23',
      'Comida hipoalergenica',
      array['gluten', 'chicken'],
      'active'
    ),
    (
      v_daycare_id,
      v_soles_room_id,
      'leia-lahuasi',
      'Leia Lahuasi',
      '2026-08-15',
      '2026-09-23',
      '',
      '{}'::text[],
      'active'
    ),
    (
      v_daycare_id,
      v_girasoles_room_id,
      'terry-lahuasi',
      'Terry Lahuasi',
      '2019-03-21',
      '2026-09-23',
      '',
      '{}'::text[],
      'active'
    )
  on conflict (daycare_id, slug) do update
    set room_id = excluded.room_id,
        full_name = excluded.full_name,
        birth_date = excluded.birth_date,
        enrolled_at = excluded.enrolled_at,
        medical_notes = excluded.medical_notes,
        allergy_tags = excluded.allergy_tags,
        status = excluded.status,
        updated_at = now();
end;
$$;
