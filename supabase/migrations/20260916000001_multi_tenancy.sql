-- ==============================================================================
-- VRSOC — Phase 07: Multi-Tenancy Foundation Migration
-- ==============================================================================
-- Description: Establishes organizational tenancy, memberships, teams, invitations,
-- transactional creation functions, and strict PostgreSQL Row Level Security (RLS).
-- ==============================================================================

-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for organization lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS on_organizations_updated ON public.organizations;
CREATE TRIGGER on_organizations_updated
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Create Memberships Table
-- Represents the fundamental link: User + Organization + Role + State
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'SOC Analyst' CHECK (
    role IN (
      'Super Admin',
      'Instructor',
      'Student',
      'SOC Analyst',
      'Incident Responder',
      'Threat Hunter',
      'Auditor',
      'Viewer'
    )
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_memberships_org_user UNIQUE (organization_id, user_id)
);

-- Multi-Tenant B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user_org ON public.memberships(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_user ON public.memberships(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON public.memberships(user_id, status);

-- Attach updated_at trigger
DROP TRIGGER IF EXISTS on_memberships_updated ON public.memberships;
CREATE TRIGGER on_memberships_updated
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Create Teams Table
-- Teams represent organizational subgroups (e.g. "Incident Response Blue Team", "Threat Intel Cohort")
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_teams_org_name UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_org_id ON public.teams(organization_id);

DROP TRIGGER IF EXISTS on_teams_updated ON public.teams;
CREATE TRIGGER on_teams_updated
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create Team Members Table (Team ↔ Membership junction)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_team_members_team_membership UNIQUE (team_id, membership_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_membership ON public.team_members(membership_id);

-- 5. Create Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Student' CHECK (
    role IN (
      'Super Admin',
      'Instructor',
      'Student',
      'SOC Analyst',
      'Incident Responder',
      'Threat Hunter',
      'Auditor',
      'Viewer'
    )
  ),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);

-- 6. Helper Function: Check user active organization membership
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = p_org_id
      AND user_id = p_user_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. Transactional Organization Creation Function
-- Guarantees atomic organization creation + Super Admin membership provisioning
CREATE OR REPLACE FUNCTION public.create_organization(
  org_name TEXT,
  org_slug TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_membership_id UUID;
  v_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create an organization';
  END IF;

  IF LENGTH(TRIM(org_name)) < 2 THEN
    RAISE EXCEPTION 'Organization name must be at least 2 characters';
  END IF;

  IF LENGTH(TRIM(org_slug)) < 2 THEN
    RAISE EXCEPTION 'Organization slug must be at least 2 characters';
  END IF;

  -- 1. Insert Organization
  INSERT INTO public.organizations (name, slug, created_by, status)
  VALUES (TRIM(org_name), LOWER(TRIM(org_slug)), v_user_id, 'active')
  RETURNING id INTO v_org_id;

  -- 2. Insert Creator as Super Admin Membership
  INSERT INTO public.memberships (organization_id, user_id, role, status)
  VALUES (v_org_id, v_user_id, 'Super Admin', 'active')
  RETURNING id INTO v_membership_id;

  -- 3. Create Default Teams
  INSERT INTO public.teams (organization_id, name, description, created_by)
  VALUES 
    (v_org_id, 'SOC Operations Team', 'Default primary tier-1 and tier-2 SOC monitoring team', v_user_id),
    (v_org_id, 'Incident Response Lead Team', 'Escalation responders and forensic leads', v_user_id);

  SELECT jsonb_build_object(
    'organization_id', v_org_id,
    'membership_id', v_membership_id,
    'name', org_name,
    'slug', org_slug
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 8.1 Organizations Policies
-- ------------------------------------------------------------------------------
-- Active members can read their own organization
CREATE POLICY "org_select_member" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Super Admins can update organization metadata
CREATE POLICY "org_update_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'Super Admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'Super Admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 8.2 Memberships Policies
-- ------------------------------------------------------------------------------
-- Users can see their own memberships or active members of the same organization
CREATE POLICY "memberships_select" ON public.memberships
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Super Admins can manage memberships in their organization
CREATE POLICY "memberships_admin_insert" ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'Super Admin'
    )
  );

CREATE POLICY "memberships_admin_update" ON public.memberships
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'Super Admin'
    )
  );

CREATE POLICY "memberships_admin_delete" ON public.memberships
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'Super Admin'
    )
  );

-- ------------------------------------------------------------------------------
-- 8.3 Teams Policies
-- ------------------------------------------------------------------------------
-- Active organization members can read teams
CREATE POLICY "teams_select_member" ON public.teams
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Super Admins and Instructors can manage teams
CREATE POLICY "teams_insert_admin" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('Super Admin', 'Instructor')
    )
  );

CREATE POLICY "teams_update_admin" ON public.teams
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('Super Admin', 'Instructor')
    )
  );

CREATE POLICY "teams_delete_admin" ON public.teams
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('Super Admin', 'Instructor')
    )
  );

-- ------------------------------------------------------------------------------
-- 8.4 Team Members Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT id FROM public.teams
      WHERE organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 8.5 Invitations Policies
-- ------------------------------------------------------------------------------
-- Organization members can read invitations for their org
CREATE POLICY "invitations_select" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Super Admins and Instructors can issue invitations
CREATE POLICY "invitations_insert_admin" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('Super Admin', 'Instructor')
    )
  );
