-- SPEC 33 omitted the RLS boundary from the structural migration.
-- Keep client policies absent until the identity-to-person authorization model
-- is defined; enabling RLS without policies denies Data API access by default.
alter table public.credential enable row level security;
alter table public.daycares enable row level security;
alter table public.feed enable row level security;
alter table public.feed_comments enable row level security;
alter table public.feed_kids enable row level security;
alter table public.feed_media enable row level security;
alter table public.feed_reactions enable row level security;
alter table public.invitation enable row level security;
alter table public.kids enable row level security;
alter table public.parent_kids enable row level security;
alter table public.people enable row level security;
alter table public.people_roles enable row level security;
alter table public.roles enable row level security;
alter table public.rooms enable row level security;
alter table public.staff_rooms enable row level security;
