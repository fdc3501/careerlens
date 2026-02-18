-- ============================================================
-- CareerLens: profiles + analysis_history schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- 2. analysis_history table
create table analysis_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  career_input jsonb not null,
  analysis jsonb not null,
  report jsonb,
  created_at timestamptz default now()
);

alter table analysis_history enable row level security;

create policy "Users can view own history"
  on analysis_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on analysis_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own history"
  on analysis_history for delete
  using (auth.uid() = user_id);

-- 3. Trigger: auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 4. RPC: delete own account (cascade deletes profiles + history)
create or replace function delete_own_account()
returns void as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;
