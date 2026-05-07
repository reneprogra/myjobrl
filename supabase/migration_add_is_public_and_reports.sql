-- Migration: Add is_public to profiles + create reports table
-- Run this in the Supabase SQL Editor

-- Add is_public column to profiles (if it doesn't exist)
alter table profiles add column if not exists is_public boolean not null default true;

-- Create reports table
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  subject text not null,
  description text not null,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "Users can insert their own reports"
  on reports for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own reports"
  on reports for select
  to authenticated
  using (auth.uid() = user_id);
