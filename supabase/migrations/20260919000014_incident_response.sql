-- ==============================================================================
-- Migration: 20260919000014_incident_response.sql
-- Description: Phase 22 — Incident Response Domain Schema
-- Tables: public.incidents, public.incident_history, public.incident_tasks,
--         public.incident_evidence, public.incident_notes, public.incident_playbooks
-- ==============================================================================

-- 1. Create Playbooks Table (Reference / Template Library)
CREATE TABLE IF NOT EXISTS public.incident_playbooks (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'Malware Outbreak',
  mitre_techniques TEXT[] NOT NULL DEFAULT '{}',
  default_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Incidents Table (Tenant-Isolated Core Record)
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  incident_code VARCHAR(32) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity VARCHAR(16) NOT NULL DEFAULT 'High',
  priority VARCHAR(8) NOT NULL DEFAULT 'P2',
  stage VARCHAR(32) NOT NULL DEFAULT 'Detection',
  status VARCHAR(32) NOT NULL DEFAULT 'Open',
  source_alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
  source_alert_ids TEXT[] NOT NULL DEFAULT '{}',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_name TEXT,
  lead_responder_name TEXT,
  affected_assets TEXT[] NOT NULL DEFAULT '{}',
  affected_identities TEXT[] NOT NULL DEFAULT '{}',
  mitre_tactics TEXT[] NOT NULL DEFAULT '{}',
  mitre_techniques TEXT[] NOT NULL DEFAULT '{}',
  playbook_id VARCHAR(64) REFERENCES public.incident_playbooks(id) ON DELETE SET NULL,
  playbook_name TEXT,
  stage_timestamps JSONB NOT NULL DEFAULT '{}'::jsonb,
  declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closure_reason TEXT,
  closure_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Incident History Table (Audited State Machine Transitions)
CREATE TABLE IF NOT EXISTS public.incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL DEFAULT 'SOC Lead',
  action_type VARCHAR(64) NOT NULL,
  previous_stage VARCHAR(32),
  new_stage VARCHAR(32),
  rationale TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Incident Tasks Table (Checklist & Playbook Execution)
CREATE TABLE IF NOT EXISTS public.incident_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  playbook_id VARCHAR(64),
  stage VARCHAR(32) NOT NULL DEFAULT 'Detection',
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  order_index INTEGER NOT NULL DEFAULT 0,
  assigned_to TEXT,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Incident Evidence Table (References to Canonical SOC Entities)
CREATE TABLE IF NOT EXISTS public.incident_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  target_type VARCHAR(32) NOT NULL,
  target_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  confidence INTEGER NOT NULL DEFAULT 90 CHECK (confidence >= 0 AND confidence <= 100),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  added_by TEXT NOT NULL DEFAULT 'Incident Responder',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Incident Notes Table (Tenant-Scoped Analyst Notes)
CREATE TABLE IF NOT EXISTS public.incident_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Incident Responder',
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Indexes for Performance & Queue Filtering
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_incidents_org_stage ON public.incidents(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON public.incidents(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_org_severity ON public.incidents(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_incidents_org_created ON public.incidents(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_code ON public.incidents(organization_id, incident_code);

CREATE INDEX IF NOT EXISTS idx_incident_history_lookup ON public.incident_history(incident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_tasks_lookup ON public.incident_tasks(incident_id, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_incident_evidence_lookup ON public.incident_evidence(incident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_notes_lookup ON public.incident_notes(incident_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.incident_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_notes ENABLE ROW LEVEL SECURITY;

-- 1. Playbooks: readable by all authenticated users
CREATE POLICY "playbooks_read_authenticated"
  ON public.incident_playbooks
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Incidents: organization member isolation
CREATE POLICY "incidents_select_tenant"
  ON public.incidents
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "incidents_insert_tenant"
  ON public.incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "incidents_update_tenant"
  ON public.incidents
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "incidents_delete_tenant"
  ON public.incidents
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 3. Incident History: organization member isolation
CREATE POLICY "incident_history_select_tenant"
  ON public.incident_history
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "incident_history_insert_tenant"
  ON public.incident_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 4. Incident Tasks: organization member isolation
CREATE POLICY "incident_tasks_select_tenant"
  ON public.incident_tasks
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "incident_tasks_all_tenant"
  ON public.incident_tasks
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 5. Incident Evidence: organization member isolation
CREATE POLICY "incident_evidence_select_tenant"
  ON public.incident_evidence
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "incident_evidence_all_tenant"
  ON public.incident_evidence
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 6. Incident Notes: organization member isolation
CREATE POLICY "incident_notes_select_tenant"
  ON public.incident_notes
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "incident_notes_all_tenant"
  ON public.incident_notes
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
