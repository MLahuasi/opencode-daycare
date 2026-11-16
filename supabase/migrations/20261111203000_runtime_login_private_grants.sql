-- SPEC 38: private login-abuse functions used by the dedicated runtime role.
grant usage on schema private to open_daycare_runtime;
grant select, insert, update, delete
  on table private.login_attempt_limits
  to open_daycare_runtime;

grant execute on function private.is_login_attempt_blocked(bytea)
  to open_daycare_runtime;
grant execute on function private.record_login_failure(bytea, integer, integer, integer)
  to open_daycare_runtime;
grant execute on function private.clear_login_attempt_limit(bytea)
  to open_daycare_runtime;

drop policy if exists runtime_login_attempt_limits on private.login_attempt_limits;
create policy runtime_login_attempt_limits
  on private.login_attempt_limits
  for all
  to open_daycare_runtime
  using (true)
  with check (true);
