-- A person may have at most one credential in a daycare.  Without this
-- invariant, duplicate password hashes can make credential lookup ambiguous
-- (the repository intentionally reads one row) and leave stale credentials
-- usable after a replacement.
alter table public.credential
  add constraint credential_daycare_person_unique
  unique (daycare_id, person_id);
