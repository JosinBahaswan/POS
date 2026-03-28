create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('owner', 'cashier', 'manager')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sku text not null,
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, sku)
);

create table if not exists public.sales (
  id text primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  total numeric(12,2) not null check (total >= 0),
  source text not null default 'pos-pwa',
  line_items jsonb not null,
  created_at timestamptz not null,
  inserted_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  plan_code text not null,
  status text not null check (status in ('active', 'past_due', 'canceled', 'trial')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_tenant on public.products(tenant_id);
create index if not exists idx_sales_tenant_created_at on public.sales(tenant_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.subscriptions enable row level security;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create policy "profiles_self_read"
on public.profiles
for select
using (id = auth.uid());

create policy "products_tenant_isolation"
on public.products
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "sales_tenant_isolation"
on public.sales
for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "subscriptions_tenant_isolation"
on public.subscriptions
for select
using (tenant_id = public.current_tenant_id());
