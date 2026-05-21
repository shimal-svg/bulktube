-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- ENUM
-- ─────────────────────────────────────────
create type upload_status as enum ('pending', 'uploading', 'success', 'failed');

-- ─────────────────────────────────────────
-- USERS
-- Mirrors auth.users; row created on sign-up via trigger.
-- ─────────────────────────────────────────
create table public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null unique,
  free_uploads_used   int  not null default 0,
  free_uploads_limit  int  not null default 3,
  created_at          timestamptz not null default now()
);

-- Auto-create a public.users row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- CREDIT PACKS
-- ─────────────────────────────────────────
create table public.credit_packs (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.users(id) on delete cascade,
  credits_total     int         not null,
  credits_remaining int         not null,
  stripe_payment_id text        not null,
  purchased_at      timestamptz not null default now(),
  expires_at        timestamptz not null default now() + interval '1 year'
);

create index on public.credit_packs (user_id);

-- ─────────────────────────────────────────
-- UPLOAD SESSIONS
-- ─────────────────────────────────────────
create table public.upload_sessions (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references public.users(id) on delete cascade,
  youtube_channel_id   text        not null,
  youtube_channel_name text        not null,
  created_at           timestamptz not null default now()
);

create index on public.upload_sessions (user_id);

-- ─────────────────────────────────────────
-- UPLOADS
-- ─────────────────────────────────────────
create table public.uploads (
  id               uuid          primary key default gen_random_uuid(),
  session_id       uuid          not null references public.upload_sessions(id) on delete cascade,
  user_id          uuid          not null references public.users(id) on delete cascade,
  filename         text          not null,
  title            text          not null,
  orientation      text,
  duration         int,                        -- seconds
  privacy          text          not null default 'private',
  youtube_video_id text,
  youtube_url      text,
  status           upload_status not null default 'pending',
  credit_used      boolean       not null default false,
  created_at       timestamptz   not null default now()
);

create index on public.uploads (user_id);
create index on public.uploads (session_id);
create index on public.uploads (status);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.users          enable row level security;
alter table public.credit_packs   enable row level security;
alter table public.upload_sessions enable row level security;
alter table public.uploads        enable row level security;

-- users: can only read/update their own row
create policy "users: own row" on public.users
  for all using (auth.uid() = id);

-- credit_packs: own records only
create policy "credit_packs: own records" on public.credit_packs
  for all using (auth.uid() = user_id);

-- upload_sessions: own records only
create policy "upload_sessions: own records" on public.upload_sessions
  for all using (auth.uid() = user_id);

-- uploads: own records only
create policy "uploads: own records" on public.uploads
  for all using (auth.uid() = user_id);
