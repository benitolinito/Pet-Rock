create extension if not exists pgcrypto;

-- Rocks table stores:
-- information about each pet rock: phone number, name, location, personality state, etc.

create table if not exists rocks (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique,
  telegram_chat_id text unique,
  telegram_user_id text,
  name text not null,
  starting_vibe text not null,
  location_name text,
  location_region text,
  location_country text,
  latitude double precision not null,
  longitude double precision not null,
  timezone text not null,
  personality_state jsonb not null,
  paused boolean not null default false,
  consent_checked_at timestamptz,
  consent_text text,
  opted_out_at timestamptz,
  last_daily_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rocks_contact_channel_check
    check (phone_number is not null or telegram_chat_id is not null)
);

alter table rocks
  alter column phone_number drop not null,
  add column if not exists telegram_chat_id text unique,
  add column if not exists telegram_user_id text,
  add column if not exists location_name text,
  add column if not exists location_region text,
  add column if not exists location_country text,
  add column if not exists paused boolean not null default false,
  add column if not exists consent_checked_at timestamptz,
  add column if not exists consent_text text,
  add column if not exists opted_out_at timestamptz,
  add column if not exists last_daily_sent_on date,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rocks_contact_channel_check'
  ) then
    alter table rocks
      add constraint rocks_contact_channel_check
      check (phone_number is not null or telegram_chat_id is not null);
  end if;
end $$;

-- Messages table stores all inbound and outbound texts for each rock.
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  rock_id uuid not null references rocks(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  provider_sid text unique,
  created_at timestamptz not null default now()
);

-- Fetch recent messages for a specific rock efficiently.
create index if not exists messages_rock_id_created_at_idx
  on messages(rock_id, created_at desc);

create table if not exists telegram_onboarding_sessions (
  telegram_chat_id text primary key,
  telegram_user_id text,
  rock_name text,
  starting_vibe text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table telegram_onboarding_sessions
  add column if not exists starting_vibe text;
