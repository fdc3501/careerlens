-- orders (단건결제)
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  polar_checkout_id text unique not null,
  polar_order_id text unique,
  user_id uuid references profiles(id) on delete set null,
  email text,
  status text not null default 'pending',       -- pending | succeeded | failed
  payment_type text default 'one_time',
  metadata_pending_session_key text,            -- localStorage key로 분석 데이터 복원
  report_generated boolean not null default false,
  created_at timestamptz default now()
);
alter table orders enable row level security;
create policy "Anyone can read orders" on orders for select using (true);
create policy "Service role inserts orders" on orders for insert with check (true);
create policy "Service role updates orders" on orders for update using (true);

-- subscriptions (구독결제)
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  polar_subscription_id text unique not null,
  user_id uuid references profiles(id) on delete cascade not null,
  email text not null,
  status text not null default 'active',        -- active | canceled | revoked
  current_period_end timestamptz,
  created_at timestamptz default now()
);
alter table subscriptions enable row level security;
create policy "Users can view own subscription" on subscriptions for select using (auth.uid() = user_id);

-- profiles 확장
alter table profiles add column if not exists subscription_status text default 'none';
-- none | active | canceled

-- 구독 일일 사용량 추적
create table if not exists daily_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  usage_date date not null default current_date,
  report_count integer not null default 0,
  unique(user_id, usage_date)
);
alter table daily_usage enable row level security;
create policy "Users can view own usage" on daily_usage for select using (auth.uid() = user_id);

-- 원자적 카운터 증가 RPC
create or replace function increment_daily_usage(p_user_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  insert into public.daily_usage (user_id, usage_date, report_count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set report_count = public.daily_usage.report_count + 1
  returning report_count into v_count;
  return v_count;
end;
$$;
