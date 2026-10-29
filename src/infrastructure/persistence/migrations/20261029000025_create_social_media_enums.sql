create type public.post_type as enum (
  'food',
  'nap',
  'activity',
  'achievement',
  'mood',
  'announcement'
);

create type public.reaction_type as enum ('love');

create type public.media_resource_type as enum ('image');

create type public.media_delivery_type as enum ('authenticated');

create type public.media_format as enum ('jpg', 'jpeg', 'png', 'webp');
