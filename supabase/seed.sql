begin;

create temporary table _seed_daycare (
  daycare_id uuid primary key
) on commit drop;

insert into _seed_daycare (daycare_id)
select id
from public.daycares
where name = 'Guardería Sala Soles'
order by created_at
limit 1;

do $$
declare
  v_daycare_id uuid;
begin
  select daycare_id
  into v_daycare_id
  from _seed_daycare
  limit 1;

  if v_daycare_id is null then
    insert into public.daycares (name, brand_name)
    values ('Guardería Sala Soles', 'OpenDayCare')
    returning id into v_daycare_id;

    insert into _seed_daycare (daycare_id)
    values (v_daycare_id);
  end if;
end;
$$;

create temporary table _seed_roles (
  code public.person_role primary key,
  role_id uuid not null
) on commit drop;

insert into public.roles (code)
values
  ('admin'),
  ('personal'),
  ('teacher'),
  ('parent')
on conflict (code) do update
set code = excluded.code;

insert into _seed_roles (code, role_id)
select code, id
from public.roles
where code in ('admin', 'personal', 'teacher', 'parent');

insert into public.people (
  daycare_id,
  name,
  email,
  job_title,
  status
)
select
  daycare_id,
  'Caro Giménez',
  'caro@opendaycare.com',
  'Maestra',
  'active'
from _seed_daycare
on conflict (daycare_id, (lower(email))) do update
set name = excluded.name,
    job_title = excluded.job_title,
    status = excluded.status,
    updated_at = now();

create temporary table _seed_caro (
  person_id uuid primary key,
  daycare_id uuid not null
) on commit drop;

insert into _seed_caro (person_id, daycare_id)
select p.id, p.daycare_id
from public.people p
join _seed_daycare d on d.daycare_id = p.daycare_id
where lower(p.email) = lower('caro@opendaycare.com')
order by p.created_at
limit 1;

do $$
declare
  v_caro_id uuid;
  v_daycare_id uuid;
begin
  select person_id, daycare_id
  into v_caro_id, v_daycare_id
  from _seed_caro
  limit 1;

  update public.credential
  set password_hash = '$2b$12$XU0dIsFwQ4L8zUWUJWMizeynioWBpLtOyWVT/8ZWGkxX4P0r8lZSi',
      updated_at = now()
  where id = (
    select c.id
    from public.credential c
    where c.daycare_id = v_daycare_id
      and c.person_id = v_caro_id
    order by c.created_at
    limit 1
  );

  if not exists (
    select 1
    from public.credential c
    where c.daycare_id = v_daycare_id
      and c.person_id = v_caro_id
  ) then
    insert into public.credential (daycare_id, person_id, password_hash)
    values (
      v_daycare_id,
      v_caro_id,
      '$2b$12$XU0dIsFwQ4L8zUWUJWMizeynioWBpLtOyWVT/8ZWGkxX4P0r8lZSi'
    );
  end if;
end;
$$;

create temporary table _seed_caro_roles (
  role_code public.person_role primary key
) on commit drop;

insert into _seed_caro_roles (role_code)
values ('admin'), ('personal'), ('teacher');

insert into public.people_roles (daycare_id, person_id, role_id)
select c.daycare_id, c.person_id, r.role_id
from _seed_caro c
cross join _seed_caro_roles s
join _seed_roles r on r.code = s.role_code
on conflict (daycare_id, person_id, role_id) do nothing;

create temporary table _seed_rooms (
  name text primary key,
  room_id uuid not null
) on commit drop;

insert into public.rooms (daycare_id, name)
select d.daycare_id, source.name
from _seed_daycare d
cross join (values ('Soles'), ('Girasoles'), ('Patitos')) as source(name)
on conflict (daycare_id, name) do update
set name = excluded.name,
    updated_at = now();

insert into _seed_rooms (name, room_id)
select r.name, r.id
from public.rooms r
join _seed_daycare d on d.daycare_id = r.daycare_id
where r.name in ('Soles', 'Girasoles', 'Patitos');

insert into public.staff_rooms (daycare_id, person_id, room_id)
select c.daycare_id, c.person_id, r.room_id
from _seed_caro c
cross join _seed_rooms r
on conflict (daycare_id, person_id, room_id) do nothing;

commit;
