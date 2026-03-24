create extension if not exists pgcrypto;

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null unique,
  description text not null,
  category text not null default 'community',
  image_url text,
  upcoming_event text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null default 'subscriber' check (role in ('subscriber', 'admin')),
  is_active boolean not null default true,
  charity_id uuid references public.charities(id) on delete set null,
  charity_percentage integer not null default 10 check (charity_percentage between 0 and 100),
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'inactive', 'cancelled', 'lapsed')),
  amount numeric(10,2) not null default 0,
  payment_provider text not null default 'razorpay',
  payment_reference text,
  started_at timestamptz not null default now(),
  renewal_date timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists subscriptions_user_started_at_idx on public.subscriptions(user_id, started_at desc);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  value integer not null check (value between 1 and 45),
  played_at date not null,
  created_at timestamptz not null default now()
);

create index if not exists scores_user_created_at_idx on public.scores(user_id, created_at desc);
create index if not exists scores_user_played_at_idx on public.scores(user_id, played_at desc);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  mode text not null default 'random' check (mode in ('random', 'algorithmic')),
  status text not null default 'published' check (status in ('published')),
  draw_month date not null,
  numbers integer[] not null,
  active_subscriber_count integer not null default 0,
  prize_pool_total numeric(10,2) not null default 0,
  tier_5_pool numeric(10,2) not null default 0,
  tier_4_pool numeric(10,2) not null default 0,
  tier_3_pool numeric(10,2) not null default 0,
  jackpot_rollover_in numeric(10,2) not null default 0,
  jackpot_rollover_out numeric(10,2) not null default 0,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists draws_draw_month_key on public.draws(draw_month);

create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  matched_count integer not null check (matched_count between 3 and 5),
  prize_tier text not null,
  matched_numbers integer[] not null,
  prize_amount numeric(10,2) not null default 0,
  verification_status text not null default 'not_required' check (verification_status in ('not_required', 'pending_review', 'approved', 'rejected')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'rejected')),
  proof_filename text,
  proof_url text,
  proof_storage_path text,
  review_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists winners_user_idx on public.winners(user_id, created_at desc);

create table if not exists public.charity_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  charity_id uuid not null references public.charities(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount numeric(10,2) not null default 0,
  percentage integer not null check (percentage between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  event_type text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.charities disable row level security;
alter table public.users disable row level security;
alter table public.subscriptions disable row level security;
alter table public.scores disable row level security;
alter table public.draws disable row level security;
alter table public.winners disable row level security;
alter table public.charity_contributions disable row level security;
alter table public.email_logs disable row level security;
