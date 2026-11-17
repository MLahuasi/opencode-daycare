-- Keep the public schema closed to Data API roles until explicit policies exist.
-- The server-only application connects through PostgreSQL and is not affected by
-- these grants for anon, authenticated, or service_role.

alter table public.daycares enable row level security;
alter table public.roles enable row level security;
alter table public.people enable row level security;
alter table public.people_roles enable row level security;
alter table public.rooms enable row level security;
alter table public.kids enable row level security;
alter table public.credential enable row level security;
alter table public.staff_rooms enable row level security;
alter table public.parent_kids enable row level security;
alter table public.invitation enable row level security;
alter table public.feed enable row level security;
alter table public.feed_kids enable row level security;
alter table public.feed_media enable row level security;
alter table public.feed_comments enable row level security;
alter table public.feed_reactions enable row level security;

revoke all privileges on all tables in schema public from anon, authenticated, service_role;
revoke all privileges on all sequences in schema public from anon, authenticated, service_role;
revoke all privileges on all functions in schema public from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger on tables
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions
  from anon, authenticated, service_role;
