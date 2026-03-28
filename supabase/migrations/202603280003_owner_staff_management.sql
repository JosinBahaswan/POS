alter table public.profiles
  add column if not exists is_active boolean not null default true;

create index if not exists idx_profiles_tenant_role_active
  on public.profiles(tenant_id, role, is_active);
