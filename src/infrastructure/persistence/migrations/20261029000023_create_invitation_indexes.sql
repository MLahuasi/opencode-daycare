create index invitations_daycare_status_idx
  on public.invitations (daycare_id, status);

create index invitations_child_status_idx
  on public.invitations (child_id, status);

create index invitations_invited_by_user_id_idx
  on public.invitations (invited_by_user_id);

create index invitations_accepted_user_id_idx
  on public.invitations (accepted_user_id);

create index invitations_email_status_idx
  on public.invitations (email, status);

create index invitations_expires_at_status_idx
  on public.invitations (expires_at, status);
