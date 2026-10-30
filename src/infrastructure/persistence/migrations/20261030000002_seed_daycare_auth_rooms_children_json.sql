begin;

create temporary table _seed_daycare(daycare_id uuid primary key) on commit drop;
insert into _seed_daycare(daycare_id)
select id from public.daycares where name = 'Guardería Sala Soles' order by created_at limit 1;

do $$
declare v_daycare_id uuid;
begin
  select daycare_id into v_daycare_id from _seed_daycare limit 1;
  if v_daycare_id is null then
    insert into public.daycares(name) values ('Guardería Sala Soles') returning id into v_daycare_id;
    insert into _seed_daycare values (v_daycare_id);
  end if;
end $$;

create temporary table _people_source(old_id text, name text, email text, role public.person_role, status public.person_status) on commit drop;
insert into _people_source values
('parent-lucia-fernandez','Lucía Fernández','lucia.fernandez@example.com','parent','pending'),
('parent-diego-fernandez','Diego Fernández','diego.fernandez@example.com','parent','active'),
('parent-carolina-mendez','Carolina Méndez','carolina.mendez@example.com','parent','active'),
('parent-mariana-ruiz','Mariana Ruiz','mariana.ruiz@example.com','parent','active'),
('parent-federico-ruiz','Federico Ruiz','federico.ruiz@example.com','parent','pending'),
('parent-julieta-diaz','Julieta Díaz','julieta.diaz@example.com','parent','active'),
('parent-nicolas-castro','Nicolás Castro','nicolas.castro@example.com','parent','inactive'),
('parent-paula-romero','Paula Romero','paula.romero@example.com','parent','active'),
('parent-ines-vega','Inés Vega','ines.vega@example.com','parent','active'),
('person-caro-gimenez','Caro Giménez','caro@opendaycare.com','personal','active'),
('92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','Mauricio Lahuasi','jmlahuasiq@gmail.com','parent','active'),
('2a72a378-638e-4cad-b8bf-b0d1b3e8663f','Mauricio Quillupangui','maurojre@hotmail.com','parent','active'),
('69d0be26-7460-41cf-b44e-652716b72ef4','Katty Gonzalez','aragon777@gmail.com','parent','active'),
('0a154e4f-9cfb-478d-b7d0-6103eb04b4e2','Kathy Gonzalez','jmlq.dev.test@gmail.com','parent','active');

create temporary table _people_map(old_id text primary key, new_id uuid not null) on commit drop;
insert into public.people(daycare_id,name,email,role,status)
select d.daycare_id,s.name,s.email,s.role,s.status from _people_source s cross join _seed_daycare d
on conflict (daycare_id,(lower(email))) do update set name=excluded.name,role=excluded.role,status=excluded.status;
insert into _people_map
select s.old_id,p.id from _people_source s cross join _seed_daycare d join public.people p
on p.daycare_id=d.daycare_id and lower(p.email)=lower(s.email);

create temporary table _rooms_source(old_id text, name text) on commit drop;
insert into _rooms_source values ('room-soles','Soles'),('room-girasoles','Girasoles'),('room-patitos','Patitos');
create temporary table _rooms_map(old_id text primary key, new_id uuid not null) on commit drop;
insert into public.rooms(daycare_id,name)
select d.daycare_id,s.name from _rooms_source s cross join _seed_daycare d
on conflict (daycare_id,name) do nothing;
insert into _rooms_map
select s.old_id,r.id from _rooms_source s cross join _seed_daycare d join public.rooms r
on r.daycare_id=d.daycare_id and r.name=s.name;

create temporary table _kids_source(
  old_id text, slug text, name text, birth_date date, room_old_id text,
  enrollment_date date, medical_notes text, allergies text, status public.kid_status
) on commit drop;
insert into _kids_source values
('kid-mateo-fernandez','mateo-fernandez','Mateo Fernández','2022-09-14','room-soles','2025-02-03','Alergia al maní y sensibilidad a la lactosa. Lleva una botella de agua identificada.','Maní, Lactosa, queso','active'),
('kid-sofia-mendez','sofia-mendez','Sofía Méndez','2023-08-22','room-soles','2025-03-10','Alergia al polen. Avisar a la familia ante síntomas persistentes.','Polen','active'),
('kid-benjamin-ruiz','benjamin-ruiz','Benjamín Ruiz','2022-11-06','room-soles','2025-01-13','Usa lentes para actividades de cerca. Guardar el estuche en su mochila.','','active'),
('kid-valentina-soto','valentina-soto','Valentina Soto','2023-07-19','room-soles','2026-02-02','No hay notas médicas registradas.','','active'),
('kid-tomas-diaz','tomas-diaz','Tomás Díaz','2022-12-18','room-soles','2025-04-07','Sensibilidad a la lactosa y alergia al maní. Ofrecer las alternativas indicadas en la cocina.','Lactosa, Maní','active'),
('kid-emma-castro','emma-castro','Emma Castro','2023-10-03','room-soles','2026-01-12','Sin alergias conocidas. Avisar a la familia ante síntomas persistentes.','','active'),
('kid-lucas-romero','lucas-romero','Lucas Romero','2022-10-27','room-soles','2025-02-17','Evitar alimentos con gluten. Cuenta con inhalador de rescate en su bolso, según autorización vigente.','Gluten','active'),
('kid-olivia-vega','olivia-vega','Olivia Vega','2023-06-11','room-soles','2025-08-04','Sin indicaciones médicas especiales registradas.','','active'),
('54f37876-e15f-4aef-a517-c1f6b2e4b31d','martina-lopez','Martina López Vega','2023-05-15','room-patitos','2026-09-18','Tienes alergia al mani, camarones y gluten, debe tomar un antiestaminico una vez al dia despues del almuerzo','Polen, Ácaros','active'),
('a8728bae-1aba-41c4-a50d-cc3cc192548b','chewbacca-lahuasi','Chewbacca Lahuasi','2017-08-15','room-soles','2026-09-23','Comida hipoalergenica','gluten, pollo','active'),
('e73240ec-9849-4060-8b75-79a1a1e917dc','leia-lahuasi','Leia Lahuasi','2026-08-15','room-soles','2026-09-23','','','active'),
('493c86d1-f2f3-42aa-a36f-656102bf6472','terry-lahuasi','Terry Lahuasi','2019-03-21','room-girasoles','2026-09-23','','','active');

create temporary table _kids_map(old_id text primary key, new_id uuid not null) on commit drop;
do $$ begin
  if exists(select 1 from _kids_source s left join _rooms_map r on r.old_id=s.room_old_id where r.old_id is null) then
    raise exception 'kids.json contains an unresolved room reference';
  end if;
end $$;
insert into public.kids(daycare_id,slug,name,birth_date,room_id,enrollment_date,medical_notes,allergies,status)
select d.daycare_id,s.slug,s.name,s.birth_date,r.new_id,s.enrollment_date,s.medical_notes,s.allergies,s.status
from _kids_source s cross join _seed_daycare d join _rooms_map r on r.old_id=s.room_old_id
on conflict(daycare_id,slug) do update set name=excluded.name,birth_date=excluded.birth_date,
room_id=excluded.room_id,enrollment_date=excluded.enrollment_date,medical_notes=excluded.medical_notes,
allergies=excluded.allergies,status=excluded.status;
insert into _kids_map
select s.old_id,k.id from _kids_source s cross join _seed_daycare d join public.kids k
on k.daycare_id=d.daycare_id and k.slug=s.slug;

create temporary table _credential_source(old_id text, person_old_id text, password_hash text) on commit drop;
insert into _credential_source values
('credential-diego-fernandez','parent-diego-fernandez','$2b$12$XU0dIsFwQ4L8zUWUJWMizeynioWBpLtOyWVT/8ZWGkxX4P0r8lZSi'),
('credential-carolina-mendez','parent-carolina-mendez','mock-hash-carolina-mendez-v1'),
('credential-mariana-ruiz','parent-mariana-ruiz','mock-hash-mariana-ruiz-v1'),
('credential-julieta-diaz','parent-julieta-diaz','mock-hash-julieta-diaz-v1'),
('credential-paula-romero','parent-paula-romero','mock-hash-paula-romero-v1'),
('credential-ines-vega','parent-ines-vega','mock-hash-ines-vega-v1'),
('credential-caro-gimenez','person-caro-gimenez','$2b$12$XU0dIsFwQ4L8zUWUJWMizeynioWBpLtOyWVT/8ZWGkxX4P0r8lZSi'),
('credential-92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','$2b$12$4t29uMFgizNoerXUbDJ9JO/9K6ZWqZcLi3DBFY6aHhadYAQAl5ZMG'),
('credential-2a72a378-638e-4cad-b8bf-b0d1b3e8663f','2a72a378-638e-4cad-b8bf-b0d1b3e8663f','$2b$12$y0FvEHuyvbi5dsOLWterEuheKSNFrcKzh8QuuE11tXrND2p3kouUi'),
('credential-69d0be26-7460-41cf-b44e-652716b72ef4','69d0be26-7460-41cf-b44e-652716b72ef4','$2b$12$VNPoMrKOlHDvJsmQkDVt4OPsJIuDGSOpZNKl2bTAp4iajj3utmWlG'),
('credential-0a154e4f-9cfb-478d-b7d0-6103eb04b4e2','0a154e4f-9cfb-478d-b7d0-6103eb04b4e2','$2b$12$KQDuZmDwMtsQ0Ku.4jRKr.uE2G8ujs9hAt6XM4Hu3N5OzSXX02KGu');

do $$ begin
  if exists(select 1 from _credential_source s left join _people_map p on p.old_id=s.person_old_id where p.old_id is null) then
    raise exception 'credential.json contains an unresolved person reference';
  end if;
end $$;
update public.credential c set password_hash=s.password_hash,updated_at=now()
from _credential_source s join _people_map p on p.old_id=s.person_old_id cross join _seed_daycare d
where c.daycare_id=d.daycare_id and c.person_id=p.new_id;
insert into public.credential(daycare_id,person_id,password_hash)
select d.daycare_id,p.new_id,s.password_hash from _credential_source s join _people_map p on p.old_id=s.person_old_id cross join _seed_daycare d
where not exists(select 1 from public.credential c where c.daycare_id=d.daycare_id and c.person_id=p.new_id);

create temporary table _staff_rooms_source(old_id text, person_old_id text, room_old_id text) on commit drop;
insert into _staff_rooms_source values ('staff-room-caro-soles','person-caro-gimenez','room-soles');
do $$ begin
  if exists(select 1 from _staff_rooms_source s left join _people_map p on p.old_id=s.person_old_id left join _rooms_map r on r.old_id=s.room_old_id where p.old_id is null or r.old_id is null) then
    raise exception 'staff-rooms.json contains an unresolved relationship';
  end if;
end $$;
insert into public.staff_rooms(daycare_id,person_id,room_id)
select d.daycare_id,p.new_id,r.new_id from _staff_rooms_source s join _people_map p on p.old_id=s.person_old_id join _rooms_map r on r.old_id=s.room_old_id cross join _seed_daycare d
where not exists(select 1 from public.staff_rooms x where x.daycare_id=d.daycare_id and x.person_id=p.new_id and x.room_id=r.new_id);

create temporary table _parent_kids_source(old_id text,parent_old_id text,kid_old_id text,relationship public.parent_relationship,photo_sharing_consent boolean) on commit drop;
insert into _parent_kids_source values
('parent-kid-diego-mateo','parent-diego-fernandez','kid-mateo-fernandez','father',false),
('parent-kid-carolina-sofia','parent-carolina-mendez','kid-sofia-mendez','mother',true),
('parent-kid-mariana-benjamin','parent-mariana-ruiz','kid-benjamin-ruiz','mother',true),
('parent-kid-federico-benjamin','parent-federico-ruiz','kid-benjamin-ruiz','father',true),
('parent-kid-julieta-tomas','parent-julieta-diaz','kid-tomas-diaz','guardian',true),
('parent-kid-nicolas-emma','parent-nicolas-castro','kid-emma-castro','father',true),
('parent-kid-paula-lucas','parent-paula-romero','kid-lucas-romero','mother',true),
('parent-kid-ines-olivia','parent-ines-vega','kid-olivia-vega','mother',true),
('parent-kid-92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8-e73240ec-9849-4060-8b75-79a1a1e917dc','92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','e73240ec-9849-4060-8b75-79a1a1e917dc','father',true),
('parent-kid-92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8-a8728bae-1aba-41c4-a50d-cc3cc192548b','92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','a8728bae-1aba-41c4-a50d-cc3cc192548b','father',true),
('parent-kid-92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8-493c86d1-f2f3-42aa-a36f-656102bf6472','92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','493c86d1-f2f3-42aa-a36f-656102bf6472','father',true),
('parent-kid-2a72a378-638e-4cad-b8bf-b0d1b3e8663f-kid-valentina-soto','2a72a378-638e-4cad-b8bf-b0d1b3e8663f','kid-valentina-soto','father',true),
('parent-kid-69d0be26-7460-41cf-b44e-652716b72ef4-493c86d1-f2f3-42aa-a36f-656102bf6472','69d0be26-7460-41cf-b44e-652716b72ef4','493c86d1-f2f3-42aa-a36f-656102bf6472','mother',true),
('parent-kid-92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8-54f37876-e15f-4aef-a517-c1f6b2e4b31d','92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','54f37876-e15f-4aef-a517-c1f6b2e4b31d','guardian',true),
('parent-kid-0a154e4f-9cfb-478d-b7d0-6103eb04b4e2-54f37876-e15f-4aef-a517-c1f6b2e4b31d','0a154e4f-9cfb-478d-b7d0-6103eb04b4e2','54f37876-e15f-4aef-a517-c1f6b2e4b31d','mother',true),
('parent-kid-69d0be26-7460-41cf-b44e-652716b72ef4-a8728bae-1aba-41c4-a50d-cc3cc192548b','69d0be26-7460-41cf-b44e-652716b72ef4','a8728bae-1aba-41c4-a50d-cc3cc192548b','mother',true);
do $$ begin
  if exists(select 1 from _parent_kids_source s left join _people_map p on p.old_id=s.parent_old_id left join _kids_map k on k.old_id=s.kid_old_id where p.old_id is null or k.old_id is null) then
    raise exception 'parent-kids.json contains an unresolved relationship';
  end if;
end $$;
insert into public.parent_kids(daycare_id,parent_id,kid_id,relationship,photo_sharing_consent)
select d.daycare_id,p.new_id,k.new_id,s.relationship,s.photo_sharing_consent from _parent_kids_source s join _people_map p on p.old_id=s.parent_old_id join _kids_map k on k.old_id=s.kid_old_id cross join _seed_daycare d
where not exists(select 1 from public.parent_kids x where x.daycare_id=d.daycare_id and x.parent_id=p.new_id and x.kid_id=k.new_id);

create temporary table _invitation_source(
  old_id text, person_old_id text, kid_old_id text, relationship public.parent_relationship,
  code text, expires_at timestamptz, sent_at timestamptz, accepted_at timestamptz
) on commit drop;
insert into _invitation_source values
('invitation-lucia-7k4p9','parent-lucia-fernandez','kid-mateo-fernandez','mother','7K4P9','2026-12-31T23:59:59.000Z','2026-09-22T10:00:00.000Z',null),
('invitation-carolina-expired','parent-carolina-mendez','kid-sofia-mendez','mother','EXPIRED1','2026-01-31T23:59:59.000Z','2026-01-01T10:00:00.000Z',null),
('invitation-mariana-accepted','parent-mariana-ruiz','kid-benjamin-ruiz','mother','ACCEPTED1','2026-12-31T23:59:59.000Z','2026-08-01T10:00:00.000Z','2026-08-15T14:30:00.000Z'),
('18c815e3-2880-47f2-bb19-4323f3f48085','92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','e73240ec-9849-4060-8b75-79a1a1e917dc','father','LDCCKXGP','2026-09-30T15:32:18.892Z','2026-09-23T15:32:21.924Z','2026-09-23T15:33:41.846Z'),
('ece51bbf-a0b8-4f46-b0be-36372dc763d5','92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','a8728bae-1aba-41c4-a50d-cc3cc192548b','father','ZWXT9DH2','2026-09-30T16:29:07.403Z','2026-09-23T16:29:09.568Z','2026-09-23T16:31:34.650Z'),
('ef89193d-a424-4ddf-8e95-ded568725ce7','92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','493c86d1-f2f3-42aa-a36f-656102bf6472','father','4G4AH2UP','2026-09-30T17:18:48.045Z','2026-09-23T17:18:50.318Z','2026-09-23T17:19:07.730Z'),
('699cb92d-cd2e-47d5-9379-8a042eb32ad9','2a72a378-638e-4cad-b8bf-b0d1b3e8663f','kid-valentina-soto','father','9XNX4QK5','2026-10-08T18:54:00.002Z','2026-10-01T18:54:02.930Z','2026-10-01T18:54:54.054Z'),
('867653be-e751-4dcc-b176-ee943e340890','69d0be26-7460-41cf-b44e-652716b72ef4','493c86d1-f2f3-42aa-a36f-656102bf6472','mother','DG2XFB7D','2026-10-08T20:48:19.681Z','2026-10-01T20:48:22.242Z','2026-10-01T20:50:50.868Z'),
('ff13c647-b55b-402c-9277-7348d010f871','92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8','54f37876-e15f-4aef-a517-c1f6b2e4b31d','guardian','AF3TE3BN','2026-10-12T18:35:22.944Z','2026-10-05T18:35:25.466Z','2026-10-05T18:36:53.653Z'),
('174b92d3-7c70-41f9-bb5c-bc1bb98f2718','0a154e4f-9cfb-478d-b7d0-6103eb04b4e2','54f37876-e15f-4aef-a517-c1f6b2e4b31d','mother','VJ9X8R2M','2026-10-12T18:41:09.471Z','2026-10-05T18:41:12.281Z','2026-10-05T18:42:01.158Z'),
('d4d1f06b-5f93-4faf-80c7-7ee2938781eb','69d0be26-7460-41cf-b44e-652716b72ef4','a8728bae-1aba-41c4-a50d-cc3cc192548b','mother','86J5YEQQ','2026-10-14T23:21:50.540Z','2026-10-07T23:21:54.039Z','2026-10-07T23:22:34.600Z');
do $$ begin
  if exists(select 1 from _invitation_source s left join _people_map p on p.old_id=s.person_old_id left join _kids_map k on k.old_id=s.kid_old_id where p.old_id is null or k.old_id is null) then
    raise exception 'invitation.json contains an unresolved relationship';
  end if;
end $$;
update public.invitation i set person_id=p.new_id,kid_id=k.new_id,relationship=s.relationship,
expires_at=s.expires_at,sent_at=s.sent_at,accepted_at=s.accepted_at,updated_at=now()
from _invitation_source s join _people_map p on p.old_id=s.person_old_id join _kids_map k on k.old_id=s.kid_old_id cross join _seed_daycare d
where i.daycare_id=d.daycare_id and i.code=s.code;
insert into public.invitation(daycare_id,person_id,kid_id,relationship,code,expires_at,sent_at,accepted_at)
select d.daycare_id,p.new_id,k.new_id,s.relationship,s.code,s.expires_at,s.sent_at,s.accepted_at
from _invitation_source s join _people_map p on p.old_id=s.person_old_id join _kids_map k on k.old_id=s.kid_old_id cross join _seed_daycare d
where not exists(select 1 from public.invitation i where i.daycare_id=d.daycare_id and i.code=s.code);

do $$
declare v_daycare_id uuid; v_expected integer; v_actual integer;
begin
  select daycare_id into v_daycare_id from _seed_daycare limit 1;
  select count(*) into v_expected from _people_source; select count(*) into v_actual from public.people where daycare_id=v_daycare_id;
  if v_actual<>v_expected then raise exception 'people count mismatch: expected %, got %',v_expected,v_actual; end if;
  select count(*) into v_expected from _rooms_source; select count(*) into v_actual from public.rooms where daycare_id=v_daycare_id;
  if v_actual<>v_expected then raise exception 'rooms count mismatch: expected %, got %',v_expected,v_actual; end if;
  select count(*) into v_expected from _kids_source; select count(*) into v_actual from public.kids where daycare_id=v_daycare_id;
  if v_actual<>v_expected then raise exception 'kids count mismatch: expected %, got %',v_expected,v_actual; end if;
  select count(*) into v_expected from _credential_source; select count(*) into v_actual from public.credential where daycare_id=v_daycare_id;
  if v_actual<>v_expected then raise exception 'credential count mismatch: expected %, got %',v_expected,v_actual; end if;
  select count(*) into v_expected from _staff_rooms_source; select count(*) into v_actual from public.staff_rooms where daycare_id=v_daycare_id;
  if v_actual<>v_expected then raise exception 'staff_rooms count mismatch: expected %, got %',v_expected,v_actual; end if;
  select count(*) into v_expected from _parent_kids_source; select count(*) into v_actual from public.parent_kids where daycare_id=v_daycare_id;
  if v_actual<>v_expected then raise exception 'parent_kids count mismatch: expected %, got %',v_expected,v_actual; end if;
  select count(*) into v_expected from _invitation_source; select count(*) into v_actual from public.invitation where daycare_id=v_daycare_id;
  if v_actual<>v_expected then raise exception 'invitation count mismatch: expected %, got %',v_expected,v_actual; end if;
  if exists(select 1 from public.credential c where c.daycare_id=v_daycare_id and not exists(select 1 from public.people p where p.id=c.person_id and p.daycare_id=c.daycare_id)) then raise exception 'orphan credential reference'; end if;
  if exists(select 1 from public.invitation i where i.daycare_id=v_daycare_id and (not exists(select 1 from public.people p where p.id=i.person_id and p.daycare_id=i.daycare_id) or not exists(select 1 from public.kids k where k.id=i.kid_id and k.daycare_id=i.daycare_id))) then raise exception 'orphan invitation reference'; end if;
  if exists(select 1 from public.parent_kids x where x.daycare_id=v_daycare_id and (not exists(select 1 from public.people p where p.id=x.parent_id and p.daycare_id=x.daycare_id) or not exists(select 1 from public.kids k where k.id=x.kid_id and k.daycare_id=x.daycare_id))) then raise exception 'orphan parent_kids reference'; end if;
end $$;

commit;
