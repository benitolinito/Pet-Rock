alter table if exists rocks
  add column if not exists consent_checked_at timestamptz,
  add column if not exists consent_text text,
  add column if not exists opted_out_at timestamptz;
