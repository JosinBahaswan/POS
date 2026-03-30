-- Advanced RLS Hardening for POS Tables

-- 1. Prevent cashiers from manipulating approval policies
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers and owners can manage approval rules"
    ON public.approval_rules
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND tenant_id = approval_rules.tenant_id 
        AND role IN ('manager', 'owner')
      )
    );

CREATE POLICY "Cashiers can only read approval rules"
    ON public.approval_rules
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND tenant_id = approval_rules.tenant_id 
        AND role = 'cashier'
      )
    );

-- 2. Prevent manipulation of closed shifts
CREATE OR REPLACE FUNCTION check_shift_closed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'closed' THEN
    RAISE EXCEPTION 'Cannot modify a closed shift';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_closed_shift_mod
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION check_shift_closed();

-- 3. Only Managers/Owners can approve requests
CREATE POLICY "Only manager or owner can approve requests"
    ON public.approval_requests
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND tenant_id = approval_requests.tenant_id 
        AND role IN ('manager', 'owner')
      )
    );

