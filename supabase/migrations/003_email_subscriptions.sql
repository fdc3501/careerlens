-- subscriber_profiles: 구독자 커리어 데이터 (일일 이메일 발송용)
create table if not exists subscriber_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null unique,
  email text not null,
  career_input jsonb not null,               -- CareerInput JSON
  last_analysis jsonb,                       -- AnalysisResult JSON (최신)
  email_enabled boolean default true,        -- 이메일 수신 동의
  last_email_sent_at timestamptz,            -- 마지막 발송 시각
  unsubscribe_token uuid default gen_random_uuid() not null unique, -- 비로그인 수신거부용
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriber_profiles enable row level security;
create policy "Users can view own subscriber profile" on subscriber_profiles
  for select using (auth.uid() = user_id);
create policy "Users can update own subscriber profile" on subscriber_profiles
  for update using (auth.uid() = user_id);

-- email_logs: 발송 이력
create table if not exists email_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  email text not null,
  subject text not null,
  sent_at timestamptz default now(),
  status text not null default 'sent',       -- sent | failed
  error_message text
);

alter table email_logs enable row level security;
create policy "Users can view own email logs" on email_logs
  for select using (auth.uid() = user_id);

-- 활성 구독자 조회 RPC (스케줄러용, security definer)
create or replace function get_active_email_subscribers()
returns table (
  user_id uuid,
  email text,
  career_input jsonb,
  last_analysis jsonb,
  unsubscribe_token uuid
) language sql security definer set search_path = '' as $$
  select
    sp.user_id,
    sp.email,
    sp.career_input,
    sp.last_analysis,
    sp.unsubscribe_token
  from public.subscriber_profiles sp
  join public.profiles p on p.id = sp.user_id
  where p.subscription_status = 'active'
    and sp.email_enabled = true
    and sp.career_input is not null
    and (
      sp.last_email_sent_at is null
      or sp.last_email_sent_at::date < current_date
    );
$$;

-- subscriber_profiles.updated_at 자동 갱신 트리거
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriber_profiles_updated_at
  before update on subscriber_profiles
  for each row execute procedure update_updated_at_column();
