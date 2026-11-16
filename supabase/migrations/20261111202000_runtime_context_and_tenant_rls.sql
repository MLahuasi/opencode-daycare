-- SPEC 38: transaction-local context readers used by runtime code.
create or replace function private.current_daycare_id()
returns uuid
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select nullif(current_setting('app.daycare_id', true), '')::uuid;
$$;

create or replace function private.current_person_id()
returns uuid
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select nullif(current_setting('app.person_id', true), '')::uuid;
$$;

alter function private.current_daycare_id() owner to postgres;
alter function private.current_person_id() owner to postgres;

revoke all on function private.current_daycare_id() from public;
revoke all on function private.current_daycare_id()
  from anon, authenticated, service_role, open_daycare_runtime;
grant execute on function private.current_daycare_id()
  to open_daycare_runtime;

revoke all on function private.current_person_id() from public;
revoke all on function private.current_person_id()
  from anon, authenticated, service_role, open_daycare_runtime;
grant execute on function private.current_person_id()
  to open_daycare_runtime;

grant usage on schema private to open_daycare_runtime;

-- Global role definitions are not tenant data. Runtime can read them but cannot
-- mutate them. Daycares remains inaccessible directly; the private singleton
-- function is the only pre-session lookup path.
drop policy if exists runtime_read_roles on public.roles;
create policy runtime_read_roles
  on public.roles
  for select
  to open_daycare_runtime
  using (true);

-- Every tenant policy denies access when the transaction has no daycare
-- context. NULLIF also makes an explicitly empty setting deny access instead
-- of raising a cast error. The scalar subquery keeps the setting evaluation
-- stable and index-friendly for the row comparison.
drop policy if exists runtime_people_tenant on public.people;
create policy runtime_people_tenant
  on public.people
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_people_roles_tenant on public.people_roles;
create policy runtime_people_roles_tenant
  on public.people_roles
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_rooms_tenant on public.rooms;
create policy runtime_rooms_tenant
  on public.rooms
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_kids_tenant on public.kids;
create policy runtime_kids_tenant
  on public.kids
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_credential_tenant on public.credential;
create policy runtime_credential_tenant
  on public.credential
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_staff_rooms_tenant on public.staff_rooms;
create policy runtime_staff_rooms_tenant
  on public.staff_rooms
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_parent_kids_tenant on public.parent_kids;
create policy runtime_parent_kids_tenant
  on public.parent_kids
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_invitation_tenant on public.invitation;
create policy runtime_invitation_tenant
  on public.invitation
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_feed_tenant on public.feed;
create policy runtime_feed_tenant
  on public.feed
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_feed_kids_tenant on public.feed_kids;
create policy runtime_feed_kids_tenant
  on public.feed_kids
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_feed_media_tenant on public.feed_media;
create policy runtime_feed_media_tenant
  on public.feed_media
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_feed_comments_tenant on public.feed_comments;
create policy runtime_feed_comments_tenant
  on public.feed_comments
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));

drop policy if exists runtime_feed_reactions_tenant on public.feed_reactions;
create policy runtime_feed_reactions_tenant
  on public.feed_reactions
  for all
  to open_daycare_runtime
  using (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid))
  with check (daycare_id = (select nullif(current_setting('app.daycare_id', true), '')::uuid));
