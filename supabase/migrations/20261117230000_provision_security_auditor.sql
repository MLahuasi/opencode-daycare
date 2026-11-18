-- Provision the production audit role without credentials.
-- LOGIN and the password are managed outside migrations through the approved
-- production secret-management procedure.
do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_roles
    where rolname = 'security_auditor'
  ) then
    create role security_auditor
      nologin
      nosuperuser
      nocreatedb
      nocreaterole
      noinherit
      noreplication
      nobypassrls;
  end if;
end
$$;

-- Managed Supabase PostgreSQL does not allow the project database role to
-- re-alter role attributes after creation. The attributes above are applied
-- when the role is first created.
alter role security_auditor
  set default_transaction_read_only = on;

alter role security_auditor
  set statement_timeout = '30s';

alter role security_auditor
  set lock_timeout = '2s';

grant connect on database postgres to security_auditor;
grant usage on schema public to security_auditor;

-- Keep the allowlist limited to tenant and authorization relationships.
-- Credentials, invitation codes, media contents, and personal secrets are
-- intentionally excluded.
grant select on table
  public.people,
  public.people_roles,
  public.roles,
  public.daycares,
  public.parent_kids,
  public.kids
to security_auditor;

revoke create on schema public from security_auditor;
