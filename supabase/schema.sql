-- =============================================
-- MyJob — Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null default '',
  avatar_url text,
  user_type text not null check (user_type in ('cliente', 'worker')) default 'worker',
  city text,
  state text,
  bio text,
  rating numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  is_verified boolean not null default false,
  is_public boolean not null default true,
  cancellation_count integer not null default 0,
  has_warning boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- CATEGORIES
-- =============================================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  emoji text not null default '💼',
  description text,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "Categories viewable by all authenticated users"
  on categories for select
  to authenticated
  using (true);

-- Seed categories
insert into categories (name, emoji, description) values
  ('Mesero / Servicio de eventos', '🍽️', 'Servicio de mesas, eventos sociales y corporativos'),
  ('Plomero / Fontanero', '🔧', 'Instalación y reparación de tuberías y sistemas hidráulicos'),
  ('Niñera', '👶', 'Cuidado de niños en casa o eventos'),
  ('Limpieza del hogar', '🧹', 'Limpieza general, profunda o post-obra del hogar'),
  ('Reparaciones', '🔨', 'Reparaciones generales del hogar (especificar qué tipo al publicar turno)')
on conflict do nothing;

-- =============================================
-- WORKER CATEGORIES
-- =============================================
create table if not exists worker_categories (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  unique(worker_id, category_id)
);

alter table worker_categories enable row level security;

create policy "Worker categories viewable by authenticated users"
  on worker_categories for select
  to authenticated
  using (true);

create policy "Workers can manage their own categories"
  on worker_categories for all
  to authenticated
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

-- =============================================
-- SHIFTS
-- =============================================
create table if not exists shifts (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references categories(id) not null,
  title text not null,
  description text,
  location_address text not null,
  city text not null,
  state text,
  pay_amount numeric(10,2) not null,
  pay_currency text not null default 'MXN',
  shift_date date not null,
  shift_start time not null,
  shift_end time not null,
  slots integer not null default 1,
  status text not null check (status in ('open', 'assigned', 'completed', 'cancelled')) default 'open',
  created_at timestamptz not null default now()
);

alter table shifts enable row level security;

create policy "Shifts readable by authenticated users"
  on shifts for select
  to authenticated
  using (true);

create policy "Clients can insert their own shifts"
  on shifts for insert
  to authenticated
  with check (auth.uid() = client_id);

create policy "Clients can update their own shifts"
  on shifts for update
  to authenticated
  using (auth.uid() = client_id);

create policy "Clients can delete their own shifts"
  on shifts for delete
  to authenticated
  using (auth.uid() = client_id);

-- =============================================
-- APPLICATIONS
-- =============================================
create table if not exists applications (
  id uuid primary key default uuid_generate_v4(),
  shift_id uuid references shifts(id) on delete cascade not null,
  worker_id uuid references profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  proposed_pay numeric(10,2),
  message text,
  created_at timestamptz not null default now(),
  unique(shift_id, worker_id)
);

alter table applications enable row level security;

-- Workers can see their own applications; shift owners can see all applications for their shifts
create policy "Applications readable by shift owner and applicant"
  on applications for select
  to authenticated
  using (
    auth.uid() = worker_id
    or auth.uid() = (select client_id from shifts where id = shift_id)
  );

create policy "Workers can insert their own applications"
  on applications for insert
  to authenticated
  with check (auth.uid() = worker_id);

create policy "Shift owner can update application status"
  on applications for update
  to authenticated
  using (
    auth.uid() = worker_id
    or auth.uid() = (select client_id from shifts where id = shift_id)
  );

-- =============================================
-- REVIEWS
-- =============================================
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  shift_id uuid references shifts(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete cascade not null,
  reviewed_id uuid references profiles(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(shift_id, reviewer_id)
);

alter table reviews enable row level security;

create policy "Reviews readable by authenticated users"
  on reviews for select
  to authenticated
  using (true);

create policy "Authenticated users can insert reviews"
  on reviews for insert
  to authenticated
  with check (auth.uid() = reviewer_id);

-- =============================================
-- GROUPS
-- =============================================
create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  leader_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references categories(id) not null,
  city text not null,
  member_count integer not null default 1,
  created_at timestamptz not null default now()
);

alter table groups enable row level security;

create policy "Groups readable by authenticated users"
  on groups for select
  to authenticated
  using (true);

create policy "Workers can create groups"
  on groups for insert
  to authenticated
  with check (auth.uid() = leader_id);

create policy "Group leaders can update their groups"
  on groups for update
  to authenticated
  using (auth.uid() = leader_id);

-- =============================================
-- GROUP MEMBERS
-- =============================================
create table if not exists group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  worker_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  unique(group_id, worker_id)
);

alter table group_members enable row level security;

create policy "Group members readable by authenticated users"
  on group_members for select
  to authenticated
  using (true);

create policy "Workers can manage their own memberships"
  on group_members for all
  to authenticated
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

-- =============================================
-- PORTFOLIO PHOTOS
-- =============================================
create table if not exists portfolio_photos (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid references profiles(id) on delete cascade not null,
  photo_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table portfolio_photos enable row level security;

create policy "Portfolio photos viewable by authenticated users"
  on portfolio_photos for select
  to authenticated
  using (true);

create policy "Workers can manage their own portfolio"
  on portfolio_photos for all
  to authenticated
  using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

-- =============================================
-- HELPER: Increment group member count
-- =============================================
create or replace function increment_member_count(group_id uuid)
returns void
language sql
security definer
as $$
  update groups set member_count = member_count + 1 where id = group_id;
$$;

-- =============================================
-- REPORTS
-- =============================================
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

-- =============================================
-- INDEXES for performance
-- =============================================
create index if not exists idx_shifts_client_id on shifts(client_id);
create index if not exists idx_shifts_city on shifts(city);
create index if not exists idx_shifts_status on shifts(status);
create index if not exists idx_shifts_category on shifts(category_id);
create index if not exists idx_applications_shift on applications(shift_id);
create index if not exists idx_applications_worker on applications(worker_id);
create index if not exists idx_reviews_reviewed on reviews(reviewed_id);
create index if not exists idx_worker_categories_worker on worker_categories(worker_id);
create index if not exists idx_group_members_worker on group_members(worker_id);
