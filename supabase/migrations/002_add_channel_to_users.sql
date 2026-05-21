alter table public.users
  add column if not exists active_youtube_channel_id   text,
  add column if not exists active_youtube_channel_name text,
  add column if not exists active_youtube_channel_thumbnail text;
