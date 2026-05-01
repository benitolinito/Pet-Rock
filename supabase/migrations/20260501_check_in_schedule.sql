alter table if exists rocks
  add column if not exists last_check_in_at timestamptz,
  add column if not exists next_check_in_at timestamptz;

update rocks
set next_check_in_at = now() + interval '3 hours'
where next_check_in_at is null
  and telegram_chat_id is not null
  and paused = false;

create index if not exists rocks_next_check_in_at_idx
  on rocks(next_check_in_at)
  where paused = false and telegram_chat_id is not null;
