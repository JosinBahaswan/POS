alter table public.tenants
  add column if not exists code text,
  add column if not exists join_code text;

update public.tenants
set
  code = coalesce(
    code,
    left(lower(regexp_replace(name, '[^a-z0-9]+', '', 'g')), 12)
    || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4)
  ),
  join_code = coalesce(join_code, upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)))
where code is null or join_code is null;

alter table public.tenants
  alter column code set not null,
  alter column join_code set not null;

create unique index if not exists idx_tenants_code_unique on public.tenants(code);
create unique index if not exists idx_tenants_join_code_unique on public.tenants(join_code);

alter table public.tenants enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.register_owner(
  p_company_name text,
  p_company_code text default null,
  p_full_name text default null
)
returns table (
  tenant_id uuid,
  tenant_code text,
  tenant_join_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_name text;
  v_base_code text;
  v_code text;
  v_join_code text;
  v_tenant_id uuid;
begin
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'User already has a company profile';
  end if;

  v_company_name := trim(coalesce(p_company_name, ''));
  if v_company_name = '' then
    raise exception 'Company name is required';
  end if;

  v_base_code := lower(regexp_replace(trim(coalesce(p_company_code, '')), '[^a-z0-9]+', '', 'g'));
  if length(v_base_code) < 3 then
    v_base_code := lower(regexp_replace(v_company_name, '[^a-z0-9]+', '', 'g'));
  end if;

  if length(v_base_code) < 3 then
    raise exception 'Company code minimal 3 karakter';
  end if;

  v_code := left(v_base_code, 16);

  while exists (select 1 from public.tenants where code = v_code) loop
    v_code := left(v_base_code, 12)
      || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4);
  end loop;

  loop
    v_join_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    exit when not exists (select 1 from public.tenants where join_code = v_join_code);
  end loop;

  insert into public.tenants (name, code, join_code)
  values (v_company_name, v_code, v_join_code)
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, role, full_name)
  values (
    v_user_id,
    v_tenant_id,
    'owner',
    nullif(trim(coalesce(p_full_name, '')), '')
  );

  insert into public.subscriptions (tenant_id, plan_code, status, current_period_end)
  values (v_tenant_id, 'starter', 'trial', now() + interval '14 days')
  on conflict (tenant_id) do nothing;

  return query
  select v_tenant_id, v_code, v_join_code;
end;
$$;

create or replace function public.register_staff(
  p_join_code text,
  p_full_name text default null,
  p_role text default 'cashier'
)
returns table (
  tenant_id uuid,
  tenant_name text,
  assigned_role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text := lower(trim(coalesce(p_role, 'cashier')));
  v_tenant_id uuid;
  v_tenant_name text;
begin
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'User already has a company profile';
  end if;

  if v_role not in ('cashier', 'manager') then
    raise exception 'Role hanya cashier atau manager';
  end if;

  select t.id, t.name
  into v_tenant_id, v_tenant_name
  from public.tenants t
  where t.join_code = upper(trim(coalesce(p_join_code, '')))
  limit 1;

  if v_tenant_id is null then
    raise exception 'Join code perusahaan tidak ditemukan';
  end if;

  insert into public.profiles (id, tenant_id, role, full_name)
  values (
    v_user_id,
    v_tenant_id,
    v_role,
    nullif(trim(coalesce(p_full_name, '')), '')
  );

  return query
  select v_tenant_id, v_tenant_name, v_role;
end;
$$;

drop policy if exists "tenants_self_read" on public.tenants;
create policy "tenants_self_read"
on public.tenants
for select
using (id = public.current_tenant_id());

drop policy if exists "profiles_tenant_read_for_management" on public.profiles;
create policy "profiles_tenant_read_for_management"
on public.profiles
for select
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('owner', 'manager')
);

revoke all on function public.register_owner(text, text, text) from public;
grant execute on function public.register_owner(text, text, text) to authenticated;

revoke all on function public.register_staff(text, text, text) from public;
grant execute on function public.register_staff(text, text, text) to authenticated;
