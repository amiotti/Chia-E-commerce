-- CHIA E-commerce MVP schema (Supabase)
create extension if not exists pgcrypto;

create table if not exists public.users_profile (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'ARS',
  images text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  category text not null,
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carts (
  user_id text primary key,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id text null,
  status text not null check (status in ('CREADA','PENDIENTE_PAGO','PAGADA','CANCELADA','REEMBOLSADA')),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'ARS',
  items_snapshot jsonb not null,
  shipping jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_payment_id text null,
  status text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'ARS',
  last_event_id text null,
  raw_payload jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_active_category on public.products(active, category);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_payments_order_id on public.payments(order_id);