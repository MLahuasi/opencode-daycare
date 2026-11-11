-- SPEC 38: dedicated runtime role without a versioned password.
-- The password is provisioned out of band for each environment.
do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_roles
    where rolname = 'open_daycare_runtime'
  ) then
    create role open_daycare_runtime
      with login
      nosuperuser
      nocreatedb
      nocreaterole
      nobypassrls;
  end if;
end
$$;

alter role open_daycare_runtime
  with login
  nosuperuser
  nocreatedb
  nocreaterole
  nobypassrls;

-- The runtime role must not inherit schema-management or broad object access.
revoke all on schema public from open_daycare_runtime;
revoke create on schema public from open_daycare_runtime;
grant usage on schema public to open_daycare_runtime;

revoke all on all tables in schema public from open_daycare_runtime;
revoke all on all sequences in schema public from open_daycare_runtime;
revoke all on all functions in schema public from open_daycare_runtime;

-- Global lookup data required before a daycare/person context exists.
grant select on table public.daycares to open_daycare_runtime;
grant select on table public.roles to open_daycare_runtime;

-- Tenant-scoped runtime access. UPDATE grants include SELECT because PostgreSQL
-- evaluates the existing row before applying the update.
grant select, insert, update on table public.people to open_daycare_runtime;
grant select, insert on table public.people_roles to open_daycare_runtime;
grant select, insert, update on table public.rooms to open_daycare_runtime;
grant select, insert, update on table public.kids to open_daycare_runtime;
grant select, insert, update on table public.credential to open_daycare_runtime;
grant select on table public.staff_rooms to open_daycare_runtime;
grant select, insert, update on table public.parent_kids to open_daycare_runtime;
grant select, insert, update on table public.invitation to open_daycare_runtime;
grant select, insert, update, delete on table public.feed to open_daycare_runtime;
grant select, insert, delete on table public.feed_kids to open_daycare_runtime;
grant select, insert, delete on table public.feed_media to open_daycare_runtime;
grant select, insert, update, delete on table public.feed_comments to open_daycare_runtime;
grant select, insert, delete on table public.feed_reactions to open_daycare_runtime;

-- Explicitly keep the private schema unavailable until later migrations grant
-- only the functions needed by the runtime application.
revoke all on schema private from open_daycare_runtime;
