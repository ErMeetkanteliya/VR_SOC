-- ==============================================================================
-- Migration: 20260916000008_alerts_and_triage.sql
-- Description: Phase 16 Alerts & Triage Layer schema with RLS and Audit Trail
-- ==============================================================================

-- 1. Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    rule_id VARCHAR(128),
    alert_code VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(32) NOT NULL DEFAULT 'High',
    risk_score INTEGER DEFAULT 75,
    status VARCHAR(32) NOT NULL DEFAULT 'Open',
    source VARCHAR(128) NOT NULL DEFAULT 'Detection Engine',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    identity_id UUID REFERENCES public.soc_identities(id) ON DELETE SET NULL,
    matched_event_ids JSONB DEFAULT '[]'::jsonb,
    mitre_tactic VARCHAR(64),
    mitre_technique_id VARCHAR(32),
    mitre_technique_name VARCHAR(128),
    explanation JSONB DEFAULT '{}'::jsonb,
    dedup_key VARCHAR(255) NOT NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    closed_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast queue filtering and pagination
CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON public.alerts (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_org_severity ON public.alerts (organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_org_occurred ON public.alerts (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_rule ON public.alerts (organization_id, rule_id);
CREATE INDEX IF NOT EXISTS idx_alerts_asset ON public.alerts (organization_id, asset_id);
CREATE INDEX IF NOT EXISTS idx_alerts_identity ON public.alerts (organization_id, identity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_dedup ON public.alerts (organization_id, dedup_key);

-- 3. Create alert_history table for auditable triage actions
CREATE TABLE IF NOT EXISTS public.alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    previous_status VARCHAR(32),
    new_status VARCHAR(32),
    note TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_history_alert ON public.alert_history (alert_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_alert_history_org ON public.alert_history (organization_id);

-- 4. Enable Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Alerts
DROP POLICY IF EXISTS tenant_read_alerts ON public.alerts;
CREATE POLICY tenant_read_alerts ON public.alerts
    FOR SELECT
    USING (
        organization_id = auth.current_org_id()
        OR EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = alerts.organization_id
              AND memberships.user_id = auth.uid()
              AND memberships.status = 'active'
        )
    );

DROP POLICY IF EXISTS tenant_insert_alerts ON public.alerts;
CREATE POLICY tenant_insert_alerts ON public.alerts
    FOR INSERT
    WITH CHECK (
        organization_id = auth.current_org_id()
        OR EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = alerts.organization_id
              AND memberships.user_id = auth.uid()
              AND memberships.status = 'active'
        )
    );

DROP POLICY IF EXISTS tenant_update_alerts ON public.alerts;
CREATE POLICY tenant_update_alerts ON public.alerts
    FOR UPDATE
    USING (
        organization_id = auth.current_org_id()
        OR EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = alerts.organization_id
              AND memberships.user_id = auth.uid()
              AND memberships.status = 'active'
        )
    );

DROP POLICY IF EXISTS tenant_delete_alerts ON public.alerts;
CREATE POLICY tenant_delete_alerts ON public.alerts
    FOR DELETE
    USING (
        organization_id = auth.current_org_id()
        OR EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = alerts.organization_id
              AND memberships.user_id = auth.uid()
              AND memberships.status = 'active'
        )
    );

-- 6. RLS Policies for Alert History
DROP POLICY IF EXISTS tenant_read_alert_history ON public.alert_history;
CREATE POLICY tenant_read_alert_history ON public.alert_history
    FOR SELECT
    USING (
        organization_id = auth.current_org_id()
        OR EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = alert_history.organization_id
              AND memberships.user_id = auth.uid()
              AND memberships.status = 'active'
        )
    );

DROP POLICY IF EXISTS tenant_insert_alert_history ON public.alert_history;
CREATE POLICY tenant_insert_alert_history ON public.alert_history
    FOR INSERT
    WITH CHECK (
        organization_id = auth.current_org_id()
        OR EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = alert_history.organization_id
              AND memberships.user_id = auth.uid()
              AND memberships.status = 'active'
        )
    );
