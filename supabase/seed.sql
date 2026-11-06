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

commit;
