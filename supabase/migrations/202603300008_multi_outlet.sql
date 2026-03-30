-- Multi-Outlet Tables

CREATE TABLE IF NOT EXISTS public.outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read outlets in their tenant"
  ON public.outlets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tenant_id = outlets.tenant_id
    )
  );

CREATE POLICY "Owners can manage outlets in their tenant"
  ON public.outlets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND tenant_id = outlets.tenant_id AND role = 'owner'
    )
  );

-- Link profiles to an outlet
ALTER TABLE public.profiles ADD COLUMN outlet_id UUID REFERENCES public.outlets(id);
-- Transactions already have outletId as string, wait, the DB schema might just use text for outlet_id

