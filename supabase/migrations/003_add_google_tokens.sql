alter table public.users
  add column if not exists google_access_token    text,
  add column if not exists google_refresh_token   text,
  add column if not exists google_token_expires_at timestamptz;
