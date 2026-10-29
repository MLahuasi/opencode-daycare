create type public.user_role as enum ('parent', 'staff', 'admin');

create type public.user_status as enum ('pending', 'active', 'inactive');
