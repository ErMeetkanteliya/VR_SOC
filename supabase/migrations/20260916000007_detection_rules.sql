-- =============================================================================
-- Phase 15: Detection & Correlation Rules — Schema & Policies
-- =============================================================================
-- 1. Creates public.detection_rules table for tenant and system detection rules.
-- 2. Configures Row Level Security (RLS) for tenant isolation.
-- 3. Adds indexes for fast rule lookup, category filtering, and MITRE mapping.
-- =============================================================================

-- 1. DETECTION RULES TABLE
CREATE TABLE IF NOT EXISTS public.detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(32) NOT NULL DEFAULT 'Medium'
    CHECK (severity IN ('Informational', 'Low', 'Medium', 'High', 'Critical')),
  rule_type VARCHAR(64) NOT NULL DEFAULT 'single_event'
    CHECK (rule_type IN ('single_event', 'threshold', 'correlation', 'sequence')),
  category VARCHAR(64) NOT NULL DEFAULT 'Threat Detection',
  mitre_tactic VARCHAR(64),
  mitre_technique_id VARCHAR(32),
  mitre_technique_name VARCHAR(128),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  evaluation_window_minutes INTEGER NOT NULL DEFAULT 15
    CHECK (evaluation_window_minutes >= 1 AND evaluation_window_minutes <= 1440),
  threshold_count INTEGER NOT NULL DEFAULT 1
    CHECK (threshold_count >= 1),
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_detection_rules_id_org UNIQUE (id, organization_id)
);

-- Indexes for detection_rules
CREATE INDEX IF NOT EXISTS idx_detection_rules_org
  ON public.detection_rules(organization_id, is_enabled, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_detection_rules_category
  ON public.detection_rules(organization_id, category);

CREATE INDEX IF NOT EXISTS idx_detection_rules_mitre
  ON public.detection_rules(organization_id, mitre_technique_id)
  WHERE mitre_technique_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_detection_rules_system
  ON public.detection_rules(is_system)
  WHERE is_system = true;

-- =============================================================================
-- Row Level Security (RLS) for Detection Rules
-- =============================================================================
ALTER TABLE public.detection_rules ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Member of organization OR System Rule
CREATE POLICY "detection_rules_select" ON public.detection_rules
  FOR SELECT TO authenticated
  USING (
    is_system = true
    OR EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = detection_rules.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- INSERT Policy: Member of organization (cannot create system rules directly)
CREATE POLICY "detection_rules_insert" ON public.detection_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = detection_rules.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- UPDATE Policy: Member of organization (cannot modify system rules)
CREATE POLICY "detection_rules_update" ON public.detection_rules
  FOR UPDATE TO authenticated
  USING (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = detection_rules.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  )
  WITH CHECK (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = detection_rules.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- DELETE Policy: Member of organization (cannot delete system rules)
CREATE POLICY "detection_rules_delete" ON public.detection_rules
  FOR DELETE TO authenticated
  USING (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = detection_rules.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );
