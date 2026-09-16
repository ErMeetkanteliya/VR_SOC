-- ==============================================================================
-- VRSOC — Phase 08: Role-Based Access Control (RBAC) Migration
-- ==============================================================================
-- Description: Establishes database-level RBAC helper functions, anti-self-elevation
-- triggers, and role-sensitive Row Level Security (RLS) enforcement.
-- ==============================================================================

-- 1. Helper Function: Get user's active role within an organization
CREATE OR REPLACE FUNCTION public.get_user_role(
  p_org_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL OR p_org_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role INTO v_role
  FROM public.memberships
  WHERE organization_id = p_org_id
    AND user_id = p_user_id
    AND status = 'active';

  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Helper Function: Check if user holds any of the allowed roles
CREATE OR REPLACE FUNCTION public.has_role(
  p_org_id UUID,
  p_allowed_roles TEXT[],
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_user_id IS NULL OR p_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = p_org_id
      AND user_id = p_user_id
      AND status = 'active'
      AND role = ANY(p_allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Trigger Function: Anti-Self-Role Escalation
-- Enforces the invariant: A user cannot mutate their own role, even if they possess Super Admin rights
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If a user is updating their own membership row and attempting to change their role:
  IF NEW.user_id = auth.uid() AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Privilege escalation rejected: Users cannot modify their own role.';
  END IF;

  -- Ensure active status is maintained on creation/update unless explicitly archived
  IF NEW.status NOT IN ('active', 'inactive', 'revoked', 'pending') THEN
    RAISE EXCEPTION 'Invalid membership status.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_self_role_escalation ON public.memberships;
CREATE TRIGGER trg_prevent_self_role_escalation
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_escalation();

-- 4. Trigger Function: Prevent Orphaned Organization (Must retain at least 1 active Super Admin)
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS TRIGGER AS $$
DECLARE
  v_remaining_admins INT;
BEGIN
  IF OLD.role = 'Super Admin' AND (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND (NEW.role != 'Super Admin' OR NEW.status != 'active'))) THEN
    SELECT COUNT(*) INTO v_remaining_admins
    FROM public.memberships
    WHERE organization_id = OLD.organization_id
      AND role = 'Super Admin'
      AND status = 'active'
      AND id != OLD.id;

    IF v_remaining_admins = 0 THEN
      RAISE EXCEPTION 'Operation rejected: Organization must retain at least one active Super Admin.';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_last_admin_removal ON public.memberships;
CREATE TRIGGER trg_prevent_last_admin_removal
  BEFORE UPDATE OR DELETE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_removal();

-- 5. Enhanced Role-Based RLS Policies
-- Refine membership update/delete policies to strictly verify Super Admin role via security function
DROP POLICY IF EXISTS "memberships_admin_update" ON public.memberships;
CREATE POLICY "memberships_admin_update" ON public.memberships
  FOR UPDATE TO authenticated
  USING (
    public.has_role(organization_id, ARRAY['Super Admin'])
  )
  WITH CHECK (
    public.has_role(organization_id, ARRAY['Super Admin'])
  );

DROP POLICY IF EXISTS "memberships_admin_delete" ON public.memberships;
CREATE POLICY "memberships_admin_delete" ON public.memberships
  FOR DELETE TO authenticated
  USING (
    public.has_role(organization_id, ARRAY['Super Admin'])
  );

-- Refine invitations deletion/revocation to Super Admin
DROP POLICY IF EXISTS "invitations_delete_admin" ON public.invitations;
CREATE POLICY "invitations_delete_admin" ON public.invitations
  FOR DELETE TO authenticated
  USING (
    public.has_role(organization_id, ARRAY['Super Admin'])
  );
