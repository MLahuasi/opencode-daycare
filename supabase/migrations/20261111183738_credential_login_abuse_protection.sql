create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated, service_role;

create table private.login_attempt_limits (
  key_hash bytea primary key,
  window_started_at timestamptz not null,
  failure_count integer not null,
  blocked_until timestamptz,
  updated_at timestamptz not null,
  constraint login_attempt_limits_key_hash_length_check
    check (octet_length(key_hash) = 32),
  constraint login_attempt_limits_failure_count_check
    check (failure_count > 0)
);

alter table private.login_attempt_limits enable row level security;

create index login_attempt_limits_blocked_until_idx
  on private.login_attempt_limits (blocked_until)
  where blocked_until is not null;

create index login_attempt_limits_updated_at_idx
  on private.login_attempt_limits (updated_at);

create or replace function private.is_login_attempt_blocked(
  p_key_hash bytea
)
returns boolean
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select exists (
    select 1
    from private.login_attempt_limits
    where key_hash = p_key_hash
      and blocked_until > clock_timestamp()
  );
$$;

create or replace function private.record_login_failure(
  p_key_hash bytea,
  p_failure_limit integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns table (
  failure_count integer,
  blocked_until timestamptz
)
language plpgsql
security invoker
set search_path = pg_catalog, private
as $$
declare
  v_now timestamptz := clock_timestamp();
begin
  if octet_length(p_key_hash) <> 32
     or p_failure_limit <= 0
     or p_window_seconds <= 0
     or p_block_seconds <= 0 then
    raise exception 'Invalid login attempt limit arguments';
  end if;

  return query
  insert into private.login_attempt_limits (
    key_hash,
    window_started_at,
    failure_count,
    blocked_until,
    updated_at
  )
  values (
    p_key_hash,
    v_now,
    1,
    case
      when p_failure_limit = 1
        then v_now + make_interval(secs => p_block_seconds)
      else null
    end,
    v_now
  )
  on conflict (key_hash) do update
  set window_started_at = case
        when private.login_attempt_limits.blocked_until > v_now
          then private.login_attempt_limits.window_started_at
        when private.login_attempt_limits.window_started_at <=
             v_now - make_interval(secs => p_window_seconds)
          then v_now
        else private.login_attempt_limits.window_started_at
      end,
      failure_count = case
        when private.login_attempt_limits.blocked_until > v_now
          then private.login_attempt_limits.failure_count
        when private.login_attempt_limits.window_started_at <=
             v_now - make_interval(secs => p_window_seconds)
          then 1
        else private.login_attempt_limits.failure_count + 1
      end,
      blocked_until = case
        when private.login_attempt_limits.blocked_until > v_now
          then private.login_attempt_limits.blocked_until
        when private.login_attempt_limits.window_started_at <=
             v_now - make_interval(secs => p_window_seconds)
          and p_failure_limit = 1
          then v_now + make_interval(secs => p_block_seconds)
        when private.login_attempt_limits.failure_count + 1 >= p_failure_limit
          then v_now + make_interval(secs => p_block_seconds)
        else null
      end,
      updated_at = v_now
  returning
    private.login_attempt_limits.failure_count,
    private.login_attempt_limits.blocked_until;
end;
$$;

create or replace function private.clear_login_attempt_limit(
  p_key_hash bytea
)
returns void
language sql
security invoker
set search_path = pg_catalog, private
as $$
  delete from private.login_attempt_limits
  where key_hash = p_key_hash;
$$;

revoke all on table private.login_attempt_limits from public;
revoke all on table private.login_attempt_limits from anon, authenticated, service_role;
grant select, insert, update, delete on table private.login_attempt_limits to postgres;

revoke all on function private.is_login_attempt_blocked(bytea) from public;
revoke all on function private.is_login_attempt_blocked(bytea) from anon, authenticated, service_role;
grant execute on function private.is_login_attempt_blocked(bytea) to postgres;

revoke all on function private.record_login_failure(bytea, integer, integer, integer) from public;
revoke all on function private.record_login_failure(bytea, integer, integer, integer)
  from anon, authenticated, service_role;
grant execute on function private.record_login_failure(bytea, integer, integer, integer)
  to postgres;

revoke all on function private.clear_login_attempt_limit(bytea) from public;
revoke all on function private.clear_login_attempt_limit(bytea) from anon, authenticated, service_role;
grant execute on function private.clear_login_attempt_limit(bytea) to postgres;
