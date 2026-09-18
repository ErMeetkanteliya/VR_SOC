-- ==============================================================================
-- VRSOC — Phase 18: XDR Correlation & Multi-Source Telemetry Migration
-- ==============================================================================
-- Description: Establishes normalized relational entities for DNS, Email, Cloud,
-- and Firewall telemetry alongside persistent XDR correlation clusters.
-- Enforces PostgreSQL Row Level Security (RLS) and multi-tenant isolation.
-- ==============================================================================

-- 1. DNS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.dns_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  query_domain VARCHAR(255) NOT NULL,
  query_type VARCHAR(16) NOT NULL DEFAULT 'A' CHECK (query_type IN ('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'PTR', 'SRV', 'NS', 'SOA')),
  resolved_ips TEXT[] DEFAULT '{}'::text[],
  response_code VARCHAR(32) NOT NULL DEFAULT 'NOERROR',
  is_malicious BOOLEAN NOT NULL DEFAULT FALSE,
  threat_category VARCHAR(64),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_dns_events_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_dns_events_org_asset_time ON public.dns_events(organization_id, asset_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_dns_events_domain ON public.dns_events(organization_id, query_domain);
CREATE INDEX IF NOT EXISTS idx_dns_events_occurred ON public.dns_events(organization_id, occurred_at DESC);

-- 2. EMAIL EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  identity_id UUID REFERENCES public.soc_identities(id) ON DELETE SET NULL,
  sender VARCHAR(255) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(512) NOT NULL,
  message_id VARCHAR(255),
  attachment_name VARCHAR(255),
  attachment_sha256 VARCHAR(64),
  attachment_size_bytes BIGINT,
  action VARCHAR(32) NOT NULL DEFAULT 'Delivered' CHECK (action IN ('Delivered', 'Quarantined', 'Blocked', 'Filtered', 'Deleted')),
  spf_verdict VARCHAR(16) DEFAULT 'Pass' CHECK (spf_verdict IN ('Pass', 'Fail', 'SoftFail', 'Neutral', 'None')),
  dkim_verdict VARCHAR(16) DEFAULT 'Pass' CHECK (dkim_verdict IN ('Pass', 'Fail', 'None')),
  is_phishing BOOLEAN NOT NULL DEFAULT FALSE,
  threat_level VARCHAR(32) DEFAULT 'Low' CHECK (threat_level IN ('Informational', 'Low', 'Medium', 'High', 'Critical')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_email_events_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_email_events_org_identity ON public.email_events(organization_id, identity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_sender ON public.email_events(organization_id, sender);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON public.email_events(organization_id, recipient);
CREATE INDEX IF NOT EXISTS idx_email_events_attachment_hash ON public.email_events(organization_id, attachment_sha256);

-- 3. CLOUD EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.cloud_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  identity_id UUID REFERENCES public.soc_identities(id) ON DELETE SET NULL,
  cloud_provider VARCHAR(32) NOT NULL DEFAULT 'AWS' CHECK (cloud_provider IN ('AWS', 'Azure', 'GCP', 'Kubernetes', 'SaaS')),
  service_name VARCHAR(64) NOT NULL,
  event_name VARCHAR(128) NOT NULL,
  caller_ip VARCHAR(45),
  user_agent TEXT,
  region VARCHAR(64) DEFAULT 'us-east-1',
  resource_arn TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'Success' CHECK (status IN ('Success', 'Failure', 'Denied', 'Throttled')),
  request_parameters JSONB DEFAULT '{}'::jsonb,
  response_elements JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_cloud_events_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_cloud_events_org_identity ON public.cloud_events(organization_id, identity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_cloud_events_service ON public.cloud_events(organization_id, service_name, event_name);
CREATE INDEX IF NOT EXISTS idx_cloud_events_caller_ip ON public.cloud_events(organization_id, caller_ip);

-- 4. FIREWALL EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.firewall_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  src_ip VARCHAR(45) NOT NULL,
  dst_ip VARCHAR(45) NOT NULL,
  src_port INTEGER NOT NULL,
  dst_port INTEGER NOT NULL,
  protocol VARCHAR(16) NOT NULL DEFAULT 'TCP' CHECK (protocol IN ('TCP', 'UDP', 'ICMP', 'DNS', 'HTTP', 'HTTPS', 'TLS')),
  action VARCHAR(16) NOT NULL DEFAULT 'Allowed' CHECK (action IN ('Allowed', 'Blocked', 'Dropped', 'Rejected', 'Alerted')),
  rule_id VARCHAR(64),
  rule_name VARCHAR(128),
  bytes_transferred BIGINT DEFAULT 0,
  threat_name VARCHAR(128),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_firewall_events_id_org UNIQUE (id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_firewall_events_org_time ON public.firewall_events(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_firewall_events_src_dst ON public.firewall_events(organization_id, src_ip, dst_ip);
CREATE INDEX IF NOT EXISTS idx_firewall_events_action ON public.firewall_events(organization_id, action);

-- 5. XDR CORRELATIONS TABLE (Deterministic Cross-Source Incident Clusters)
CREATE TABLE IF NOT EXISTS public.xdr_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  correlation_code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(32) NOT NULL DEFAULT 'High' CHECK (severity IN ('Informational', 'Low', 'Medium', 'High', 'Critical')),
  relationship_type VARCHAR(64) NOT NULL CHECK (
    relationship_type IN (
      'same_identity',
      'same_asset',
      'same_ip',
      'same_domain',
      'temporal_killchain',
      'cross_source_threat',
      'related_alert'
    )
  ),
  confidence_score INTEGER NOT NULL DEFAULT 85 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  primary_entity_type VARCHAR(32) NOT NULL CHECK (primary_entity_type IN ('asset', 'identity', 'ip', 'domain', 'alert')),
  primary_entity_id VARCHAR(128) NOT NULL,
  primary_entity_name VARCHAR(255) NOT NULL,
  time_window_start TIMESTAMPTZ NOT NULL,
  time_window_end TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  explanation JSONB NOT NULL DEFAULT '[]'::jsonb,
  shared_identifiers JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  matched_event_ids TEXT[] DEFAULT '{}'::text[],
  related_asset_ids TEXT[] DEFAULT '{}'::text[],
  related_identity_ids TEXT[] DEFAULT '{}'::text[],
  related_alert_ids TEXT[] DEFAULT '{}'::text[],
  status VARCHAR(32) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Investigating', 'Resolved', 'Dismissed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_xdr_correlations_id_org UNIQUE (id, organization_id),
  CONSTRAINT uq_xdr_correlation_code_org UNIQUE (organization_id, correlation_code)
);

CREATE INDEX IF NOT EXISTS idx_xdr_correlations_org_time ON public.xdr_correlations(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xdr_correlations_severity ON public.xdr_correlations(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_xdr_correlations_relationship ON public.xdr_correlations(organization_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_xdr_correlations_primary ON public.xdr_correlations(organization_id, primary_entity_type, primary_entity_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. DNS Events RLS
ALTER TABLE public.dns_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dns_events_select" ON public.dns_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = dns_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "dns_events_insert" ON public.dns_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = dns_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- 2. Email Events RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_events_select" ON public.email_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = email_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "email_events_insert" ON public.email_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = email_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- 3. Cloud Events RLS
ALTER TABLE public.cloud_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cloud_events_select" ON public.cloud_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = cloud_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "cloud_events_insert" ON public.cloud_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = cloud_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- 4. Firewall Events RLS
ALTER TABLE public.firewall_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firewall_events_select" ON public.firewall_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = firewall_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "firewall_events_insert" ON public.firewall_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = firewall_events.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- 5. XDR Correlations RLS
ALTER TABLE public.xdr_correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "xdr_correlations_select" ON public.xdr_correlations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = xdr_correlations.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

CREATE POLICY "xdr_correlations_insert" ON public.xdr_correlations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = xdr_correlations.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'Instructor', 'SOC Analyst', 'Incident Responder', 'Threat Hunter')
    )
  );

CREATE POLICY "xdr_correlations_update" ON public.xdr_correlations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE memberships.organization_id = xdr_correlations.organization_id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
        AND memberships.role IN ('Super Admin', 'Instructor', 'SOC Analyst', 'Incident Responder', 'Threat Hunter')
    )
  );
