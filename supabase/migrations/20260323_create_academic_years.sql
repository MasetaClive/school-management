-- Migration: Create academic_years table
create table public.academic_years (
  id uuid primary key default extensions.uuid_generate_v4(),
  year text not null unique,
  is_active boolean default false,
  is_closed boolean default false,
  start_date date null,
  end_date date null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.academic_years enable row level security;

-- Admin policies
create policy "Admins can do everything on academic_years"
  on public.academic_years
  for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- All authenticated users can view academic_years
create policy "Anyone can view academic_years"
  on public.academic_years
  for select
  using (auth.role() = 'authenticated');
