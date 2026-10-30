alter table public.feed_overviews
  add column room_label text,
  add column greeting text,
  add column attendance text,
  add column display_date text,
  add column composer_prompt text,
  add column published_today_label text;

update public.feed_overviews
set room_label = 'Guardería · Sala Soles',
    greeting = 'Buenas, Caro',
    attendance = '12 niños',
    display_date = 'martes 17 jun',
    composer_prompt = 'Comparte un momento…',
    published_today_label = 'Publicado hoy'
where room_label_key = 'feed.room_label'
  and greeting_key = 'feed.greeting'
  and attendance_count = 12
  and date = date '2026-06-17'
  and composer_prompt_key = 'feed.composer_prompt'
  and published_today_label_key = 'feed.published_today';

alter table public.feed_overviews
  alter column room_label set not null,
  alter column greeting set not null,
  alter column attendance set not null,
  alter column display_date set not null,
  alter column composer_prompt set not null,
  alter column published_today_label set not null;
