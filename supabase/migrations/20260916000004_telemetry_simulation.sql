-- ==============================================================================
-- VRSOC — Phase 12: Telemetry Engine & Simulation Pipeline Migration
-- ==============================================================================
-- Description: Establishes normalized relational entities for Simulation Scenarios,
-- Simulation Runs, and Simulation Run Events with tenant isolation and RLS.
-- ==============================================================================

-- 1. SIMULATION SCENARIOS TABLE
CREATE TABLE IF NOT EXISTS public.simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug VARCHAR(128) NOT NULL,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'Authentication Attacks' CHECK (
    category IN (
      'Authentication Attacks',
      'Endpoint Execution',
      'Persistence Mechanism',
      'Network Anomalies',
      'Hardware Additions',
      'Ransomware & Destruction',
      'Cloud & Identity'
    )
  ),
  severity VARCHAR(32) NOT NULL DEFAULT 'Medium' CHECK (
    severity IN ('Informational', 'Low', 'Medium', 'High', 'Critical')
  ),
  description TEXT NOT NULL,
  learning_outcome TEXT NOT NULL,
  mitre_tactics TEXT[] NOT NULL DEFAULT '{}'::text[],
  mitre_techniques TEXT[] NOT NULL DEFAULT '{}'::text[],
  duration_seconds INTEGER NOT NULL DEFAULT 60 CHECK (duration_seconds > 0 AND duration_seconds <= 3600),
  event_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_sim_scenarios_slug_org UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_sim_scenarios_org_id ON public.simulation_scenarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_sim_scenarios_category ON public.simulation_scenarios(category);
CREATE INDEX IF NOT EXISTS idx_sim_scenarios_system ON public.simulation_scenarios(is_system);

-- 2. SIMULATION RUNS TABLE (Execution instances of scenarios)
CREATE TABLE IF NOT EXISTS public.simulation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES public.simulation_scenarios(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Running', 'Completed', 'Failed', 'Cancelled')
  ),
  target_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  target_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  target_identity_id UUID REFERENCES public.soc_identities(id) ON DELETE SET NULL,
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  events_generated_count INTEGER NOT NULL DEFAULT 0,
  logs_generated_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_sim_runs_id_org UNIQUE (id, organization_id),
  CONSTRAINT fk_sim_runs_asset_org FOREIGN KEY (target_asset_id, organization_id)
    REFERENCES public.assets(id, organization_id) ON DELETE SET NULL,
  CONSTRAINT fk_sim_runs_agent_org FOREIGN KEY (target_agent_id, organization_id)
    REFERENCES public.agents(id, organization_id) ON DELETE SET NULL,
  CONSTRAINT fk_sim_runs_identity_org FOREIGN KEY (target_identity_id, organization_id)
    REFERENCES public.soc_identities(id, organization_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sim_runs_org_id ON public.simulation_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_sim_runs_org_status ON public.simulation_runs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sim_runs_scenario_id ON public.simulation_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_sim_runs_started_at ON public.simulation_runs(organization_id, started_at DESC);

-- 3. SIMULATION RUN EVENTS (Audit link between simulation run and normalized events)
CREATE TABLE IF NOT EXISTS public.simulation_run_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  simulation_run_id UUID NOT NULL,
  event_id UUID NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_sim_run_event UNIQUE (simulation_run_id, event_id),
  CONSTRAINT fk_sim_run_events_run_org FOREIGN KEY (simulation_run_id, organization_id)
    REFERENCES public.simulation_runs(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT fk_sim_run_events_event_org FOREIGN KEY (event_id, organization_id)
    REFERENCES public.events(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sim_run_events_run_id ON public.simulation_run_events(simulation_run_id, sequence_number ASC);
CREATE INDEX IF NOT EXISTS idx_sim_run_events_event_id ON public.simulation_run_events(event_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Simulation Scenarios RLS
ALTER TABLE public.simulation_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulation_scenarios_select" ON public.simulation_scenarios
  FOR SELECT TO authenticated
  USING (
    is_system = TRUE
    OR EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = simulation_scenarios.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "simulation_scenarios_insert" ON public.simulation_scenarios
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = simulation_scenarios.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'Instructor', 'SOC Analyst')
    )
  );

CREATE POLICY "simulation_scenarios_update" ON public.simulation_scenarios
  FOR UPDATE TO authenticated
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = simulation_scenarios.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'Instructor')
    )
  );

CREATE POLICY "simulation_scenarios_delete" ON public.simulation_scenarios
  FOR DELETE TO authenticated
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = simulation_scenarios.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'Instructor')
    )
  );

-- 2. Simulation Runs RLS
ALTER TABLE public.simulation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulation_runs_select" ON public.simulation_runs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = simulation_runs.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "simulation_runs_insert" ON public.simulation_runs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = simulation_runs.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'Instructor', 'SOC Analyst', 'Incident Responder', 'Threat Hunter', 'Student')
    )
  );

CREATE POLICY "simulation_runs_update" ON public.simulation_runs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = simulation_runs.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'Instructor', 'SOC Analyst', 'Incident Responder', 'Threat Hunter')
    )
  );

-- 3. Simulation Run Events RLS
ALTER TABLE public.simulation_run_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulation_run_events_select" ON public.simulation_run_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = simulation_run_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "simulation_run_events_insert" ON public.simulation_run_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = simulation_run_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );
