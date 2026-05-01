alter table if exists rocks
  drop constraint if exists rocks_contact_channel_check;

alter table if exists rocks
  drop column if exists phone_number,
  drop column if exists consent_checked_at,
  drop column if exists consent_text,
  drop column if exists opted_out_at;

alter table if exists rocks
  alter column telegram_chat_id set not null;
