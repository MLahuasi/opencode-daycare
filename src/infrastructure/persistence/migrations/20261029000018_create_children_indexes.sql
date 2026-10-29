create index children_daycare_status_room_idx
  on public.children (daycare_id, status, room_id);

create index parent_children_child_id_idx
  on public.parent_children (child_id);
