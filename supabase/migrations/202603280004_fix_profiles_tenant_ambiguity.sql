create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.tenant_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
on public.profiles
for select
using (public.profiles.id = auth.uid());

drop policy if exists "profiles_tenant_read_for_management" on public.profiles;
create policy "profiles_tenant_read_for_management"
on public.profiles
for select
using (
  public.profiles.tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('owner', 'manager')
);

select pg_notify('pgrst', 'reload schema');
