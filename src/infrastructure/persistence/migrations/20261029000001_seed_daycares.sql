insert into public.daycares (name, address)
select 'Guardería Sala Soles', 'Av. Principal 123, Centro'
where not exists (
  select 1
  from public.daycares
  where name = 'Guardería Sala Soles'
    and address = 'Av. Principal 123, Centro'
);
