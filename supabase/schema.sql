create extension if not exists pgcrypto;

create table if not exists rocks (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id text unique not null,
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
  last_daily_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table rocks
  add column if not exists telegram_chat_id text unique,
  add column if not exists telegram_user_id text,
  add column if not exists location_name text,
  add column if not exists location_region text,
  add column if not exists location_country text,
  add column if not exists paused boolean not null default false,
  add column if not exists last_daily_sent_on date,
  add column if not exists updated_at timestamptz not null default now();

alter table rocks
  alter column telegram_chat_id set not null;

alter table rocks
  drop column if exists phone_number,
  drop column if exists consent_checked_at,
  drop column if exists consent_text,
  drop column if exists opted_out_at;

alter table rocks
  drop constraint if exists rocks_contact_channel_check;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  rock_id uuid not null references rocks(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  provider_sid text unique,
  created_at timestamptz not null default now()
);

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
