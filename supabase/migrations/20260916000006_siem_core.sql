-- =============================================================================
-- Phase 14: SIEM Core — Schema Enhancements & Saved Queries
-- =============================================================================
-- 1. Creates public.saved_queries table for tenant-scoped SIEM search filters.
-- 2. Adds composite indexes on events & logs for asset/identity/agent-centric queries.
-- 3. Configures Row Level Security (RLS) for tenant isolation on saved_queries.
-- =============================================================================

-- 1. SAVED QUERIES TABLE
CREATE TABLE IF NOT EXISTS public.saved_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  query_type VARCHAR(32) NOT NULL DEFAULT 'events' CHECK (query_type IN ('events', 'logs', 'correlated')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_saved_queries_id_org UNIQUE (id, organization_id)
);

-- Indexes for saved_queries
CREATE INDEX IF NOT EXISTS idx_saved_queries_org
  ON public.saved_queries(organization_id, query_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_queries_user
  ON public.saved_queries(organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_saved_queries_pinned
  ON public.saved_queries(organization_id, is_pinned)
  WHERE is_pinned = true;

-- 2. ADDITIONAL COMPOSITE INDEXES FOR SIEM QUERY PATTERNS
-- Fast lookup for asset correlation & asset timelines
CREATE INDEX IF NOT EXISTS idx_events_org_asset_occurred
  ON public.events(organization_id, asset_id, occurred_at DESC)
  WHERE asset_id IS NOT NULL;

-- Fast lookup for identity correlation & identity timelines
CREATE INDEX IF NOT EXISTS idx_events_org_identity_occurred
  ON public.events(organization_id, identity_id, occurred_at DESC)
  WHERE identity_id IS NOT NULL;

-- Fast lookup for agent telemetry streams
CREATE INDEX IF NOT EXISTS idx_events_org_agent_occurred
  ON public.events(organization_id, agent_id, occurred_at DESC)
  WHERE agent_id IS NOT NULL;

-- Composite index for logs time-range & service filtering
CREATE INDEX IF NOT EXISTS idx_logs_org_service_logged
  ON public.logs(organization_id, service_name, logged_at DESC);

-- =============================================================================
-- Row Level Security (RLS) for Saved Queries
-- =============================================================================
ALTER TABLE public.saved_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_queries_select" ON public.saved_queries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = saved_queries.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "saved_queries_insert" ON public.saved_queries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = saved_queries.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "saved_queries_update" ON public.saved_queries
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = saved_queries.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = saved_queries.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "saved_queries_delete" ON public.saved_queries
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = saved_queries.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );
