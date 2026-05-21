alter table public.users
  add column if not exists google_sheets_id  text,
  add column if not exists google_sheets_url text;
