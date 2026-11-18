-- Invitation codes are bearer credentials.  Scope their uniqueness to the
-- daycare so concurrent invitation creation cannot make code lookup
-- ambiguous (the application resolves one row with LIMIT 1).
alter table public.invitation
  add constraint invitation_daycare_code_unique
  unique (daycare_id, code);
