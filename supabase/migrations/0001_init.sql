create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.upload_status as enum ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');
create type public.subscription_plan as enum ('FREE', 'PRODUCER', 'STUDIO', 'ENTERPRISE');
create type public.subscription_status as enum ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING');

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text not null,
  size_bytes integer not null,
  duration_sec double precision,
  status public.upload_status not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  upload_id uuid unique not null references public.uploads(id) on delete cascade,
  bpm double precision not null,
  musical_key text not null,
  energy double precision not null,
  genres jsonb not null,
  mood text[] not null default '{}',
  artists jsonb not null,
  vocal_styles text[] not null default '{}',
  explanation text not null,
  raw_features jsonb,
  created_at timestamptz not null default now()
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  slug text unique not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription text,
  plan public.subscription_plan not null default 'FREE',
  status public.subscription_status not null default 'ACTIVE',
  credits_monthly integer not null default 5,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.api_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  credits integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index uploads_user_created_idx on public.uploads(user_id, created_at desc);
create index analyses_user_created_idx on public.analyses(user_id, created_at desc);
create index api_usage_user_created_idx on public.api_usage(user_id, created_at desc);
create index credit_ledger_user_created_idx on public.credit_ledger(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.uploads enable row level security;
alter table public.analyses enable row level security;
alter table public.share_links enable row level security;
alter table public.subscriptions enable row level security;
alter table public.api_usage enable row level security;
alter table public.credit_ledger enable row level security;

create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can manage own uploads" on public.uploads for all using (auth.uid() = user_id);
create policy "Users can manage own analyses" on public.analyses for all using (auth.uid() = user_id);
create policy "Public share links are readable" on public.share_links for select using (true);
create policy "Users can read own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can read own usage" on public.api_usage for select using (auth.uid() = user_id);
create policy "Users can read own credits" on public.credit_ledger for select using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('audio-uploads', 'audio-uploads', false)
on conflict (id) do nothing;
