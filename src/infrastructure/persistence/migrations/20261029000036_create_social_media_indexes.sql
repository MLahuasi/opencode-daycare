create index posts_daycare_created_at_idx
  on public.posts (daycare_id, created_at desc);

create index posts_author_id_idx
  on public.posts (author_id);

create index posts_room_id_idx
  on public.posts (room_id);

create index post_children_child_post_idx
  on public.post_children (child_id, post_id);

create index reactions_post_created_at_idx
  on public.reactions (post_id, created_at desc);

create index reactions_user_id_idx
  on public.reactions (user_id);

create index comments_post_created_at_idx
  on public.comments (post_id, created_at desc);

create index comments_author_id_idx
  on public.comments (author_id);
