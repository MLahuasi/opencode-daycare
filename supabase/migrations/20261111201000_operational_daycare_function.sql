-- SPEC 38: resolve the only operational daycare before a session context exists.
create or replace function private.get_operational_daycare_id()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_daycare_id uuid;
begin
  begin
    select d.id
      into strict v_daycare_id
    from public.daycares as d;
  exception
    when no_data_found then
      raise exception 'No operational daycare is configured';
    when too_many_rows then
      raise exception 'Multiple operational daycares are configured';
  end;

  return v_daycare_id;
end;
$$;

alter function private.get_operational_daycare_id() owner to postgres;

revoke all on function private.get_operational_daycare_id() from public;
revoke all on function private.get_operational_daycare_id()
  from anon, authenticated, service_role, open_daycare_runtime;
grant execute on function private.get_operational_daycare_id()
  to open_daycare_runtime;
