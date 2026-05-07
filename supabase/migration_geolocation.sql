-- =============================================
-- Migration: Add geolocation support
-- Run this in the Supabase SQL Editor
-- =============================================

-- Add coordinates to shifts table
alter table shifts
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

-- Worker real-time location tracking
create table if not exists worker_locations (
  id           uuid primary key default uuid_generate_v4(),
  worker_id    uuid references profiles(id) on delete cascade not null unique,
  latitude     double precision not null,
  longitude    double precision not null,
  is_available boolean not null default false,
  updated_at   timestamptz not null default now()
);

alter table worker_locations enable row level security;

-- Workers can manage their own location row
create policy "Workers can upsert their own location"
  on worker_locations for all
  to authenticated
  using  (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

-- Authenticated users can read all available worker locations
create policy "Authenticated users can read worker locations"
  on worker_locations for select
  to authenticated
  using (true);

-- Index for quick availability lookups
create index if not exists idx_worker_locations_worker    on worker_locations(worker_id);
create index if not exists idx_worker_locations_available on worker_locations(is_available);
