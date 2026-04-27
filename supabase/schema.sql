create extension if not exists pgcrypto;

-- Rocks table stores:
-- information about each pet rock: phone number, name, location, personality state, etc.

create table if not exists rocks (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique not null,
  name text not null,
  starting_vibe text not null,
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
  updated_at timestamptz not null default now()
);

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
