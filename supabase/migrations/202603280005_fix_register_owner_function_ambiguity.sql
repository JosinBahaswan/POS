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
#variable_conflict use_column
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

  if exists (select 1 from public.profiles p where p.id = v_user_id) then
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

  while exists (select 1 from public.tenants t where t.code = v_code) loop
    v_code := left(v_base_code, 12)
      || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4);
  end loop;

  loop
    v_join_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    exit when not exists (select 1 from public.tenants t where t.join_code = v_join_code);
  end loop;

  insert into public.tenants (name, code, join_code)
  values (v_company_name, v_code, v_join_code)
  returning id into v_tenant_id;

  insert into public.profiles (id, tenant_id, role, full_name, is_active)
  values (
    v_user_id,
    v_tenant_id,
    'owner',
    nullif(trim(coalesce(p_full_name, '')), ''),
    true
  );

  insert into public.subscriptions (tenant_id, plan_code, status, current_period_end)
  values (v_tenant_id, 'starter', 'trial', now() + interval '14 days')
  on conflict on constraint subscriptions_tenant_id_key do nothing;

  return query
  select v_tenant_id, v_code, v_join_code;
end;
$$;

select pg_notify('pgrst', 'reload schema');
