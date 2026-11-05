begin;

create temporary table _social_daycare(daycare_id uuid primary key) on commit drop;
insert into _social_daycare(daycare_id)
select id
from public.daycares
where name = 'Guardería Sala Soles'
order by created_at
limit 1;

do $$
declare
  v_daycare_id uuid;
begin
  select daycare_id into v_daycare_id from _social_daycare limit 1;
  if v_daycare_id is null then
    insert into public.daycares(name)
    values ('Guardería Sala Soles')
    returning id into v_daycare_id;
    insert into _social_daycare(daycare_id) values (v_daycare_id);
  end if;
end
$$;

create temporary table _social_people_source(
  old_id text primary key,
  email text not null
) on commit drop;

insert into _social_people_source values
  ('parent-lucia-fernandez', 'lucia.fernandez@example.com'),
  ('parent-diego-fernandez', 'diego.fernandez@example.com'),
  ('parent-carolina-mendez', 'carolina.mendez@example.com'),
  ('parent-mariana-ruiz', 'mariana.ruiz@example.com'),
  ('parent-federico-ruiz', 'federico.ruiz@example.com'),
  ('parent-julieta-diaz', 'julieta.diaz@example.com'),
  ('parent-nicolas-castro', 'nicolas.castro@example.com'),
  ('parent-paula-romero', 'paula.romero@example.com'),
  ('parent-ines-vega', 'ines.vega@example.com'),
  ('person-caro-gimenez', 'caro@opendaycare.com'),
  ('92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8', 'jmlahuasiq@gmail.com'),
  ('2a72a378-638e-4cad-b8bf-b0d1b3e8663f', 'maurojre@hotmail.com'),
  ('69d0be26-7460-41cf-b44e-652716b72ef4', 'aragon777@gmail.com'),
  ('0a154e4f-9cfb-478d-b7d0-6103eb04b4e2', 'jmlq.dev.test@gmail.com');

create temporary table _social_people_map(
  old_id text primary key,
  new_id uuid not null
) on commit drop;

do $$
begin
  if exists (
    select 1
    from _social_people_source s
    left join _social_daycare d on true
    left join public.people p
      on p.daycare_id = d.daycare_id
     and lower(p.email) = lower(s.email)
    where p.id is null
  ) then
    raise exception 'social-media source contains an unresolved people reference';
  end if;
end
$$;

insert into _social_people_map(old_id, new_id)
select s.old_id, p.id
from _social_people_source s
cross join _social_daycare d
join public.people p
  on p.daycare_id = d.daycare_id
 and lower(p.email) = lower(s.email);

create temporary table _social_rooms_source(
  old_id text primary key,
  name text not null
) on commit drop;

insert into _social_rooms_source values
  ('room-soles', 'Soles'),
  ('room-girasoles', 'Girasoles'),
  ('room-patitos', 'Patitos');

create temporary table _social_rooms_map(
  old_id text primary key,
  new_id uuid not null
) on commit drop;

insert into _social_rooms_map(old_id, new_id)
select s.old_id, r.id
from _social_rooms_source s
cross join _social_daycare d
join public.rooms r
  on r.daycare_id = d.daycare_id
 and r.name = s.name;

create temporary table _social_kids_source(
  old_id text primary key,
  slug text not null
) on commit drop;

insert into _social_kids_source values
  ('kid-mateo-fernandez', 'mateo-fernandez'),
  ('kid-sofia-mendez', 'sofia-mendez'),
  ('kid-benjamin-ruiz', 'benjamin-ruiz'),
  ('kid-valentina-soto', 'valentina-soto'),
  ('kid-tomas-diaz', 'tomas-diaz'),
  ('kid-emma-castro', 'emma-castro'),
  ('kid-lucas-romero', 'lucas-romero'),
  ('kid-olivia-vega', 'olivia-vega'),
  ('54f37876-e15f-4aef-a517-c1f6b2e4b31d', 'martina-lopez'),
  ('a8728bae-1aba-41c4-a50d-cc3cc192548b', 'chewbacca-lahuasi'),
  ('e73240ec-9849-4060-8b75-79a1a1e917dc', 'leia-lahuasi'),
  ('493c86d1-f2f3-42aa-a36f-656102bf6472', 'terry-lahuasi');

create temporary table _social_kids_map(
  old_id text primary key,
  new_id uuid not null
) on commit drop;

do $$
begin
  if exists (
    select 1
    from _social_kids_source s
    left join _social_daycare d on true
    left join public.kids k
      on k.daycare_id = d.daycare_id
     and k.slug = s.slug
    where k.id is null
  ) then
    raise exception 'social-media source contains an unresolved kids reference';
  end if;
end
$$;

insert into _social_kids_map(old_id, new_id)
select s.old_id, k.id
from _social_kids_source s
cross join _social_daycare d
join public.kids k
  on k.daycare_id = d.daycare_id
 and k.slug = s.slug;

create temporary table _feed_source on commit drop as
select
  source.id,
  source.type,
  source."authorId" as author_old_id,
  source."createdAt" as created_at,
  source."updatedAt" as updated_at,
  source.body,
  source.media,
  source."kidIds" as kid_ids,
  source."roomId" as room_old_id
from jsonb_to_recordset($feed$
[
  {"id":"mateo-first-potty","type":"achievement","authorId":"person-caro-gimenez","createdAt":"2026-06-17T19:20:00.000Z","updatedAt":"2026-06-17T19:20:00.000Z","body":"¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.","media":[],"kidIds":["kid-mateo-fernandez"],"roomId":null},
  {"id":"mateo-tempera-painting","type":"activity","authorId":"person-caro-gimenez","createdAt":"2026-06-17T14:40:00.000Z","updatedAt":"2026-06-17T14:40:00.000Z","body":"Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.","media":[],"kidIds":["kid-mateo-fernandez"],"roomId":null},
  {"id":"friday-park-announcement","type":"announcement","authorId":"person-caro-gimenez","createdAt":"2026-06-17T12:50:00.000Z","updatedAt":"2026-06-17T12:50:00.000Z","body":"El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.","media":[],"kidIds":[],"roomId":"room-soles"},
  {"id":"f8a06160-812b-4624-a547-e8ad55d485e2","type":"activity","authorId":"person-caro-gimenez","body":"Mi bebe chiquito","createdAt":"2026-09-24T23:19:31.874Z","updatedAt":"2026-10-05T18:44:27.867Z","media":[{"assetId":"5dd3b7baa3cfa7af5b3c49a0d4b2ebb8","publicId":"daycare/posts/hgylex2gwjuqsurcaovz","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":4899,"height":3266,"bytes":4275613,"id":"6b2490cb-2c33-4288-81cb-335d0fd2ab4b","originalName":"DSC_0409.jpg","alt":null},{"assetId":"c7b30fcf259b8363a8b077723f2e3cfd","publicId":"daycare/posts/qfeza5tr9mp8cvvmun05","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":1064,"height":2015,"bytes":288299,"id":"d32a06db-b877-44ca-8250-73b100bd6189","originalName":"FB_IMG_1581873922116.jpg","alt":null},{"assetId":"1196be846e04c80c9b89d9995bdc9f0a","publicId":"daycare/posts/s7s7nsllx8vxoeujj84y","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":960,"height":1280,"bytes":144260,"id":"80ad668d-c95e-4c25-a15e-c55a999cf685","originalName":"WhatsApp Image 2026-08-30 at 9.25.14 PM.jpeg","alt":null},{"assetId":"358cf0d2edf309d3cdd6c238ad552510","publicId":"daycare/posts/wvg7gikxv906rvkzdjch","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":3000,"height":4000,"bytes":898250,"id":"3f085a78-87cd-42e9-b2c3-0d4ce9fbb1e6","originalName":"IMG_20180824_112234.jpg","alt":null}],"kidIds":["a8728bae-1aba-41c4-a50d-cc3cc192548b"],"roomId":null},
  {"id":"211c6723-4a1e-46c9-ad7e-11cbf42bab35","type":"activity","authorId":"person-caro-gimenez","body":"hermoso","createdAt":"2026-10-05T22:33:08.325Z","updatedAt":"2026-10-05T22:33:08.325Z","media":[{"assetId":"54cf3dbb95f2239f329e8f12b716a205","publicId":"daycare/posts/gcup4nffpnvagafknqki","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":2250,"height":4000,"bytes":371122,"id":"c24373db-41c9-44a5-853d-8642a6e57272","originalName":"IMG_20190510_134643.jpg","alt":null},{"assetId":"d025aa4c5cafeda997b10574901cbbc0","publicId":"daycare/posts/lkzuaajs8n06drxczuwh","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":4000,"height":3000,"bytes":612517,"id":"2d1b3ac4-b046-45bc-9dc1-d8f758326265","originalName":"IMG_20200410_100100.jpg","alt":null},{"assetId":"b40befc9a8aeee734a06b9b531e2310b","publicId":"daycare/posts/l8gxfqdxzd6sxrsla9po","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":3120,"height":4160,"bytes":3422555,"id":"6d26799f-b031-4744-a956-b2676f263f01","originalName":"IMG_20230104_085527.jpg","alt":null},{"assetId":"0bacd29d1078a76785a602f46628b564","publicId":"daycare/posts/v0h4h6yrkhdtusf9dh4v","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":2250,"height":4000,"bytes":3485010,"id":"735414ee-3987-439b-a882-87cca53c1ed0","originalName":"IMG_20210315_114226.jpg","alt":null}],"kidIds":["a8728bae-1aba-41c4-a50d-cc3cc192548b"],"roomId":null},
  {"id":"35ca5d49-5f0e-4170-8b9a-f1ab4939173d","type":"activity","authorId":"person-caro-gimenez","body":"Este es mi chiquito","createdAt":"2026-10-07T22:10:46.229Z","updatedAt":"2026-10-07T22:18:13.493Z","media":[{"assetId":"92ba2d7f506d52087d64373141eb51d1","publicId":"daycare/posts/h2sravcqmolruowzyucu","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":3000,"height":4000,"bytes":595306,"id":"225cd647-59d5-4ebf-bcc7-c3ad61fa88d1","originalName":"IMG_20181218_145117_HHT.jpg","alt":null}],"kidIds":["a8728bae-1aba-41c4-a50d-cc3cc192548b","e73240ec-9849-4060-8b75-79a1a1e917dc"],"roomId":null},
  {"id":"dae7b444-2db1-4009-aca4-d905bdb8453d","type":"announcement","authorId":"person-caro-gimenez","body":"el viernes es feriado","createdAt":"2026-10-07T22:18:46.326Z","updatedAt":"2026-10-07T22:18:46.326Z","media":[],"kidIds":["kid-mateo-fernandez","kid-sofia-mendez","kid-benjamin-ruiz","kid-valentina-soto","kid-tomas-diaz","kid-emma-castro","kid-lucas-romero","kid-olivia-vega","a8728bae-1aba-41c4-a50d-cc3cc192548b","e73240ec-9849-4060-8b75-79a1a1e917dc"],"roomId":null},
  {"id":"f6c02a08-deca-4aab-aaa0-bfb6fc33e9ce","type":"announcement","authorId":"person-caro-gimenez","body":"Lunes feriado","createdAt":"2026-10-07T23:16:41.333Z","updatedAt":"2026-10-07T23:17:10.919Z","media":[{"assetId":"3904ec500f92ef616055e3b090857b8c","publicId":"daycare/posts/pj1mlyynq5a5sem3yel8","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":3000,"height":4000,"bytes":648455,"id":"05015b55-23aa-4f15-a4c3-55433252e9b2","originalName":"IMG_20190131_175716.jpg","alt":null},{"assetId":"cf2d90d285263b3cd0377315d87f0b73","publicId":"daycare/posts/xdmp9pzepnj2uu0utpwp","resourceType":"image","deliveryType":"authenticated","format":"jpg","width":4000,"height":2250,"bytes":328735,"id":"71f0a167-2735-4c46-9e0b-0379574c20d8","originalName":"IMG_20191215_090723.jpg","alt":null}],"kidIds":["kid-sofia-mendez","kid-benjamin-ruiz","kid-valentina-soto","kid-tomas-diaz","kid-emma-castro","kid-lucas-romero","kid-olivia-vega","a8728bae-1aba-41c4-a50d-cc3cc192548b","e73240ec-9849-4060-8b75-79a1a1e917dc"],"roomId":null}
]
$feed$::jsonb) as source(
  id text,
  type public.post_type,
  "authorId" text,
  "createdAt" timestamptz,
  "updatedAt" timestamptz,
  body text,
  media jsonb,
  "kidIds" jsonb,
  "roomId" text
);

create temporary table _feed_map(
  old_id text primary key,
  new_id uuid not null
) on commit drop;

do $$
begin
  if exists (
    select 1
    from _feed_source s
    left join _social_people_map p on p.old_id = s.author_old_id
    left join _social_rooms_map r on r.old_id = s.room_old_id
    where p.old_id is null
       or (s.room_old_id is not null and r.old_id is null)
  ) then
    raise exception 'feed.json contains an unresolved author or room reference';
  end if;
end
$$;

insert into public.feed(daycare_id, type, author_id, created_at, updated_at, body, room_id)
select
  d.daycare_id,
  s.type,
  p.new_id,
  s.created_at,
  s.updated_at,
  s.body,
  r.new_id
from _feed_source s
cross join _social_daycare d
join _social_people_map p on p.old_id = s.author_old_id
left join _social_rooms_map r on r.old_id = s.room_old_id
where not exists (
  select 1
  from public.feed f
  where f.daycare_id = d.daycare_id
    and f.type = s.type
    and f.author_id = p.new_id
    and f.created_at = s.created_at
    and f.updated_at = s.updated_at
    and f.body = s.body
    and f.room_id is not distinct from r.new_id
);

insert into _feed_map(old_id, new_id)
select distinct on (s.id) s.id, f.id
from _feed_source s
cross join _social_daycare d
join _social_people_map p on p.old_id = s.author_old_id
left join _social_rooms_map r on r.old_id = s.room_old_id
join public.feed f
  on f.daycare_id = d.daycare_id
 and f.type = s.type
 and f.author_id = p.new_id
 and f.created_at = s.created_at
 and f.updated_at = s.updated_at
 and f.body = s.body
 and f.room_id is not distinct from r.new_id
order by s.id, f.id;

do $$
begin
  if (select count(*) from _feed_map) <> (select count(*) from _feed_source) then
    raise exception 'feed map count mismatch';
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from _feed_source s
    cross join lateral jsonb_array_elements_text(s.kid_ids) as recipient(old_id)
    left join _social_kids_map k on k.old_id = recipient.old_id
    where k.old_id is null
  ) then
    raise exception 'feed.json contains an unresolved kid reference';
  end if;
end
$$;

insert into public.feed_kids(daycare_id, feed_id, kid_id)
select d.daycare_id, f.new_id, k.new_id
from _feed_source s
cross join _social_daycare d
join _feed_map f on f.old_id = s.id
cross join lateral jsonb_array_elements_text(s.kid_ids) as recipient(old_id)
join _social_kids_map k on k.old_id = recipient.old_id
where not exists (
  select 1
  from public.feed_kids x
  where x.daycare_id = d.daycare_id
    and x.feed_id = f.new_id
    and x.kid_id = k.new_id
);

create temporary table _feed_media_source on commit drop as
select
  s.id as feed_old_id,
  media.value->>'id' as old_id,
  (media.ordinality - 1)::integer as position,
  media.value->>'publicId' as public_id,
  media.value->>'assetId' as asset_id,
  (media.value->>'resourceType')::public.post_media_resource_type as resource_type,
  (media.value->>'deliveryType')::public.post_media_delivery_type as delivery_type,
  (media.value->>'format')::public.post_media_format as format,
  (media.value->>'width')::integer as width,
  (media.value->>'height')::integer as height,
  (media.value->>'bytes')::integer as bytes,
  media.value->>'originalName' as original_name,
  media.value->>'alt' as alt
from _feed_source s
cross join lateral jsonb_array_elements(s.media) with ordinality as media(value, ordinality);

insert into public.feed_media(
  daycare_id,
  feed_id,
  position,
  public_id,
  asset_id,
  resource_type,
  delivery_type,
  format,
  width,
  height,
  bytes,
  original_name,
  alt
)
select
  d.daycare_id,
  f.new_id,
  s.position,
  s.public_id,
  s.asset_id,
  s.resource_type,
  s.delivery_type,
  s.format,
  s.width,
  s.height,
  s.bytes,
  s.original_name,
  s.alt
from _feed_media_source s
cross join _social_daycare d
join _feed_map f on f.old_id = s.feed_old_id
where not exists (
  select 1
  from public.feed_media x
  where x.daycare_id = d.daycare_id
    and x.feed_id = f.new_id
    and x.position = s.position
);

create temporary table _feed_media_map(
  old_id text primary key,
  new_id uuid not null
) on commit drop;

insert into _feed_media_map(old_id, new_id)
select s.old_id, m.id
from _feed_media_source s
join _feed_map f on f.old_id = s.feed_old_id
cross join _social_daycare d
join public.feed_media m
  on m.daycare_id = d.daycare_id
 and m.feed_id = f.new_id
 and m.position = s.position;

create temporary table _feed_comments_source on commit drop as
select
  source.id,
  source."postId" as post_old_id,
  source."authorId" as author_old_id,
  source.body,
  source."createdAt" as created_at,
  source."updatedAt" as updated_at
from jsonb_to_recordset($comments$
[
  {"id":"comment-mateo-first-potty-1","postId":"mateo-first-potty","authorId":"parent-diego-fernandez","body":"¡Qué gran paso, Mateo!","createdAt":"2026-06-17T19:30:00.000Z","updatedAt":null},
  {"id":"comment-mateo-tempera-painting-1","postId":"mateo-tempera-painting","authorId":"parent-diego-fernandez","body":"¡Qué hermoso! En casa también le encanta el azul.","createdAt":"2026-06-17T15:02:00.000Z","updatedAt":null},
  {"id":"comment-mateo-tempera-painting-2","postId":"mateo-tempera-painting","authorId":"person-caro-gimenez","body":"¡Se nota mucho! Le guardamos la obra.","createdAt":"2026-06-17T15:15:00.000Z","updatedAt":null},
  {"id":"8a0f1996-ba6a-47bf-92d1-ba097c2ebb95","postId":"f8a06160-812b-4624-a547-e8ad55d485e2","authorId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","body":"este es mi comentario, mi chiquito","createdAt":"2026-09-29T20:20:30.602Z","updatedAt":"2026-09-29T20:21:17.764Z"},
  {"id":"32dd47cb-92de-4aea-9376-8ec3653793ed","postId":"f8a06160-812b-4624-a547-e8ad55d485e2","authorId":"person-caro-gimenez","body":"Si este es otro comentario","createdAt":"2026-09-29T20:38:47.662Z","updatedAt":null},
  {"id":"40dbe560-1a64-487c-a99a-86bb5877a171","postId":"mateo-first-potty","authorId":"person-caro-gimenez","body":"Este es otro","createdAt":"2026-09-29T21:25:37.263Z","updatedAt":null},
  {"id":"278353c2-e83e-4dc9-9357-901ca4a08d84","postId":"f8a06160-812b-4624-a547-e8ad55d485e2","authorId":"person-caro-gimenez","body":"gato hermoso","createdAt":"2026-09-29T21:26:06.097Z","updatedAt":null},
  {"id":"fc1a4841-4796-4291-80c5-0b74d2ffd822","postId":"friday-park-announcement","authorId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","body":"No hay otro comentario","createdAt":"2026-09-29T21:27:22.035Z","updatedAt":null},
  {"id":"3f73db0d-ef15-46cf-8bb8-76804e63798f","postId":"f8a06160-812b-4624-a547-e8ad55d485e2","authorId":"person-caro-gimenez","body":"hermoso","createdAt":"2026-10-01T02:03:10.566Z","updatedAt":null},
  {"id":"bb0f234f-fd0b-4876-a0f0-1abab2410a82","postId":"f8a06160-812b-4624-a547-e8ad55d485e2","authorId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","body":"pechocho","createdAt":"2026-10-01T02:04:35.214Z","updatedAt":null},
  {"id":"4782cc7f-a5ce-42be-8b98-137822162f5a","postId":"f8a06160-812b-4624-a547-e8ad55d485e2","authorId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","body":"bebe","createdAt":"2026-10-01T23:06:37.666Z","updatedAt":null},
  {"id":"d4e23350-866d-4423-97f1-d5bdc164cc62","postId":"f8a06160-812b-4624-a547-e8ad55d485e2","authorId":"person-caro-gimenez","body":"Pechocho","createdAt":"2026-10-05T18:28:13.909Z","updatedAt":null},
  {"id":"afaa2706-30cc-48f9-850c-7ba3bdd01fbc","postId":"f8a06160-812b-4624-a547-e8ad55d485e2","authorId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","body":"Mi gatito hermoso te amo","createdAt":"2026-10-05T18:43:12.429Z","updatedAt":null},
  {"id":"8400af2c-bce8-401f-a548-24c6c2de326e","postId":"211c6723-4a1e-46c9-ad7e-11cbf42bab35","authorId":"person-caro-gimenez","body":"Muy lindo","createdAt":"2026-10-05T22:33:33.142Z","updatedAt":null},
  {"id":"3bf23b39-c89c-4959-bb57-6a213596ca42","postId":"211c6723-4a1e-46c9-ad7e-11cbf42bab35","authorId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","body":"Mi amor","createdAt":"2026-10-05T22:34:15.978Z","updatedAt":null},
  {"id":"3cefd18e-e044-4101-9132-9cfb003ecb9c","postId":"35ca5d49-5f0e-4170-8b9a-f1ab4939173d","authorId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","body":"Hermoso","createdAt":"2026-10-07T22:19:54.504Z","updatedAt":null},
  {"id":"98ad9a2f-cd46-4615-b2d8-87acf88613ec","postId":"35ca5d49-5f0e-4170-8b9a-f1ab4939173d","authorId":"person-caro-gimenez","body":"Si","createdAt":"2026-10-07T22:20:27.473Z","updatedAt":null},
  {"id":"2e4d7094-d528-4697-aaf6-4f08c7f81ff1","postId":"f6c02a08-deca-4aab-aaa0-bfb6fc33e9ce","authorId":"person-caro-gimenez","body":"Lindo feriado","createdAt":"2026-10-07T23:17:30.662Z","updatedAt":null},
  {"id":"2f82e5d2-799a-4212-ab2b-d6b5fbbe907d","postId":"f6c02a08-deca-4aab-aaa0-bfb6fc33e9ce","authorId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","body":"Gracias","createdAt":"2026-10-07T23:17:59.683Z","updatedAt":null},
  {"id":"716a33d6-452f-470c-bbd0-62e97bae5512","postId":"f6c02a08-deca-4aab-aaa0-bfb6fc33e9ce","authorId":"69d0be26-7460-41cf-b44e-652716b72ef4","body":"hermoso","createdAt":"2026-10-07T23:23:09.881Z","updatedAt":null}
]
$comments$::jsonb) as source(
  id text,
  "postId" text,
  "authorId" text,
  body text,
  "createdAt" timestamptz,
  "updatedAt" timestamptz
);

do $$
begin
  if exists (
    select 1
    from _feed_comments_source s
    left join _feed_map f on f.old_id = s.post_old_id
    left join _social_people_map p on p.old_id = s.author_old_id
    where f.old_id is null or p.old_id is null
  ) then
    raise exception 'feed-comments.json contains an unresolved post or author reference';
  end if;
end
$$;

insert into public.feed_comments(daycare_id, feed_id, author_id, body, created_at, updated_at)
select d.daycare_id, f.new_id, p.new_id, s.body, s.created_at, s.updated_at
from _feed_comments_source s
cross join _social_daycare d
join _feed_map f on f.old_id = s.post_old_id
join _social_people_map p on p.old_id = s.author_old_id
where not exists (
  select 1
  from public.feed_comments x
  where x.daycare_id = d.daycare_id
    and x.feed_id = f.new_id
    and x.author_id = p.new_id
    and x.body = s.body
    and x.created_at = s.created_at
    and x.updated_at is not distinct from s.updated_at
);

create temporary table _feed_reactions_source on commit drop as
select
  source.id,
  source."postId" as post_old_id,
  source."personId" as person_old_id,
  source.type,
  source."createdAt" as created_at
from jsonb_to_recordset($reactions$
[
  {"id":"reaction-mateo-tempera-painting-1","postId":"mateo-tempera-painting","personId":"parent-diego-fernandez","type":"love","createdAt":"2026-06-17T14:50:00.000Z"},
  {"id":"reaction-friday-park-announcement-1","postId":"friday-park-announcement","personId":"parent-diego-fernandez","type":"love","createdAt":"2026-06-17T13:00:00.000Z"},
  {"id":"reaction-friday-park-announcement-2","postId":"friday-park-announcement","personId":"parent-carolina-mendez","type":"love","createdAt":"2026-06-17T13:01:00.000Z"},
  {"id":"reaction-friday-park-announcement-3","postId":"friday-park-announcement","personId":"parent-mariana-ruiz","type":"love","createdAt":"2026-06-17T13:02:00.000Z"},
  {"id":"reaction-friday-park-announcement-4","postId":"friday-park-announcement","personId":"parent-julieta-diaz","type":"love","createdAt":"2026-06-17T13:03:00.000Z"},
  {"id":"reaction-friday-park-announcement-5","postId":"friday-park-announcement","personId":"parent-paula-romero","type":"love","createdAt":"2026-06-17T13:04:00.000Z"},
  {"id":"reaction-friday-park-announcement-6","postId":"friday-park-announcement","personId":"parent-ines-vega","type":"love","createdAt":"2026-06-17T13:05:00.000Z"},
  {"id":"a49e7a86-58ff-45e2-9a77-45d0a9d44922","postId":"friday-park-announcement","personId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","type":"love","createdAt":"2026-10-05T22:11:57.084Z"},
  {"id":"e5fa7e3a-95f7-448d-8a26-7ed0944eea9d","postId":"mateo-first-potty","personId":"person-caro-gimenez","type":"love","createdAt":"2026-10-05T22:29:32.147Z"},
  {"id":"36f58573-40f1-4562-b97c-163e8768a151","postId":"mateo-tempera-painting","personId":"person-caro-gimenez","type":"love","createdAt":"2026-10-05T22:29:34.810Z"},
  {"id":"2aa59842-9104-4050-bd09-d9fd223048b9","postId":"f8a06160-812b-4624-a547-e8ad55d485e2","personId":"person-caro-gimenez","type":"love","createdAt":"2026-10-05T22:29:40.065Z"},
  {"id":"90cd29eb-42c9-48fc-b865-ac2657ae4306","postId":"friday-park-announcement","personId":"person-caro-gimenez","type":"love","createdAt":"2026-10-05T22:29:42.695Z"},
  {"id":"44a043f2-3335-4bc1-95f6-9c8f251e1630","postId":"211c6723-4a1e-46c9-ad7e-11cbf42bab35","personId":"person-caro-gimenez","type":"love","createdAt":"2026-10-05T22:33:15.642Z"},
  {"id":"dbd502af-22f9-451d-b726-787739fc73f9","postId":"35ca5d49-5f0e-4170-8b9a-f1ab4939173d","personId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","type":"love","createdAt":"2026-10-07T22:19:32.787Z"},
  {"id":"37c8ae34-5fa7-4757-9097-ff1f16ee0436","postId":"211c6723-4a1e-46c9-ad7e-11cbf42bab35","personId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","type":"love","createdAt":"2026-10-07T22:19:43.606Z"},
  {"id":"d0704390-fc07-46c8-b02e-ce0d160bfe3f","postId":"f6c02a08-deca-4aab-aaa0-bfb6fc33e9ce","personId":"person-caro-gimenez","type":"love","createdAt":"2026-10-07T23:17:17.592Z"},
  {"id":"75f05e77-5c00-40a5-9e62-297483699b22","postId":"f6c02a08-deca-4aab-aaa0-bfb6fc33e9ce","personId":"92a69f5f-0f6c-44f4-9e6d-abd6985f7ed8","type":"love","createdAt":"2026-10-07T23:17:51.460Z"},
  {"id":"7e9d3327-913c-4f38-a40c-d26becc63db9","postId":"f6c02a08-deca-4aab-aaa0-bfb6fc33e9ce","personId":"69d0be26-7460-41cf-b44e-652716b72ef4","type":"love","createdAt":"2026-10-07T23:23:02.791Z"}
]
$reactions$::jsonb) as source(
  id text,
  "postId" text,
  "personId" text,
  type public.post_reaction_type,
  "createdAt" timestamptz
);

do $$
begin
  if exists (
    select 1
    from _feed_reactions_source s
    left join _feed_map f on f.old_id = s.post_old_id
    left join _social_people_map p on p.old_id = s.person_old_id
    where f.old_id is null or p.old_id is null
  ) then
    raise exception 'feed-reactions.json contains an unresolved post or person reference';
  end if;
end
$$;

insert into public.feed_reactions(daycare_id, feed_id, person_id, type, created_at)
select d.daycare_id, f.new_id, p.new_id, s.type, s.created_at
from _feed_reactions_source s
cross join _social_daycare d
join _feed_map f on f.old_id = s.post_old_id
join _social_people_map p on p.old_id = s.person_old_id
where not exists (
  select 1
  from public.feed_reactions x
  where x.daycare_id = d.daycare_id
    and x.feed_id = f.new_id
    and x.person_id = p.new_id
    and x.type = s.type
    and x.created_at = s.created_at
);

create temporary table _feed_overview_source on commit drop as
select
  source."roomLabel" as room_label,
  source.greeting,
  source.attendance,
  source.date,
  source."composerPrompt" as composer_prompt,
  source."publishedTodayLabel" as published_today_label
from jsonb_to_recordset($overview$
[
  {"roomLabel":"Guardería · Sala Soles","greeting":"Buenas, Caro","attendance":"12 niños","date":"martes 17 jun","composerPrompt":"Comparte un momento…","publishedTodayLabel":"Publicado hoy"}
]
$overview$::jsonb) as source(
  "roomLabel" text,
  greeting text,
  attendance text,
  date text,
  "composerPrompt" text,
  "publishedTodayLabel" text
);

insert into public.feed_overview(
  daycare_id,
  room_label,
  greeting,
  attendance,
  date,
  composer_prompt,
  published_today_label
)
select
  d.daycare_id,
  s.room_label,
  s.greeting,
  s.attendance,
  s.date,
  s.composer_prompt,
  s.published_today_label
from _feed_overview_source s
cross join _social_daycare d
on conflict (daycare_id) do update set
  room_label = excluded.room_label,
  greeting = excluded.greeting,
  attendance = excluded.attendance,
  date = excluded.date,
  composer_prompt = excluded.composer_prompt,
  published_today_label = excluded.published_today_label,
  updated_at = now();

do $$
declare
  v_daycare_id uuid;
  v_expected integer;
  v_actual integer;
begin
  select daycare_id into v_daycare_id from _social_daycare limit 1;

  select count(*) into v_expected from _feed_source;
  select count(*) into v_actual from public.feed where daycare_id = v_daycare_id;
  if v_actual <> v_expected then
    raise exception 'feed count mismatch: expected %, got %', v_expected, v_actual;
  end if;

  select count(*) into v_expected
  from _feed_source s
  cross join lateral jsonb_array_elements(s.kid_ids);
  select count(*) into v_actual from public.feed_kids where daycare_id = v_daycare_id;
  if v_actual <> v_expected then
    raise exception 'feed_kids count mismatch: expected %, got %', v_expected, v_actual;
  end if;

  select count(*) into v_expected from _feed_media_source;
  select count(*) into v_actual from public.feed_media where daycare_id = v_daycare_id;
  if v_actual <> v_expected then
    raise exception 'feed_media count mismatch: expected %, got %', v_expected, v_actual;
  end if;

  select count(*) into v_expected from _feed_comments_source;
  select count(*) into v_actual from public.feed_comments where daycare_id = v_daycare_id;
  if v_actual <> v_expected then
    raise exception 'feed_comments count mismatch: expected %, got %', v_expected, v_actual;
  end if;

  select count(*) into v_expected from _feed_overview_source;
  select count(*) into v_actual from public.feed_overview where daycare_id = v_daycare_id;
  if v_actual <> v_expected then
    raise exception 'feed_overview count mismatch: expected %, got %', v_expected, v_actual;
  end if;

  select count(*) into v_expected from _feed_reactions_source;
  select count(*) into v_actual from public.feed_reactions where daycare_id = v_daycare_id;
  if v_actual <> v_expected then
    raise exception 'feed_reactions count mismatch: expected %, got %', v_expected, v_actual;
  end if;

  if exists (
    select 1
    from public.feed_kids x
    where x.daycare_id = v_daycare_id
      and not exists (
        select 1
        from public.feed f
        where f.id = x.feed_id and f.daycare_id = x.daycare_id
      )
  ) then
    raise exception 'orphan feed_kids reference';
  end if;

  if exists (
    select 1
    from public.feed_media x
    where x.daycare_id = v_daycare_id
      and not exists (
        select 1
        from public.feed f
        where f.id = x.feed_id and f.daycare_id = x.daycare_id
      )
  ) then
    raise exception 'orphan feed_media reference';
  end if;

  if exists (
    select 1
    from public.feed_comments x
    where x.daycare_id = v_daycare_id
      and not exists (
        select 1
        from public.feed f
        where f.id = x.feed_id and f.daycare_id = x.daycare_id
      )
  ) then
    raise exception 'orphan feed_comments reference';
  end if;

  if exists (
    select 1
    from public.feed_reactions x
    where x.daycare_id = v_daycare_id
      and not exists (
        select 1
        from public.feed f
        where f.id = x.feed_id and f.daycare_id = x.daycare_id
      )
  ) then
    raise exception 'orphan feed_reactions reference';
  end if;
end
$$;

commit;
