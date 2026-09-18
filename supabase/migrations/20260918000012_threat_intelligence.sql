-- ==============================================================================
-- VRSOC Phase 20 Migration: Threat Intelligence & Canonical IOC Entity Layer
-- ==============================================================================

-- 1. Create public.iocs table
CREATE TABLE IF NOT EXISTS public.iocs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ioc_type TEXT NOT NULL CHECK (ioc_type IN ('ip', 'domain', 'url', 'hash', 'email', 'file')),
    normalized_value TEXT NOT NULL,
    raw_value TEXT NOT NULL,
    hash_type TEXT CHECK (hash_type IN ('md5', 'sha1', 'sha256', 'sha512') OR hash_type IS NULL),
    ip_version TEXT CHECK (ip_version IN ('v4', 'v6') OR ip_version IS NULL),
    confidence INTEGER NOT NULL DEFAULT 80 CHECK (confidence >= 0 AND confidence <= 100),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'informational')),
    threat_types TEXT[] NOT NULL DEFAULT '{}',
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'simulation', 'alienvault', 'virustotal', 'misp', 'threatconnect', 'feed')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL DEFAULT '',
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'whitelisted', 'false_positive')),
    is_global BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_organization_ioc_normalized UNIQUE (organization_id, ioc_type, normalized_value)
);

-- 2. Create public.ioc_relationships table
CREATE TABLE IF NOT EXISTS public.ioc_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ioc_id UUID NOT NULL REFERENCES public.iocs(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('event', 'alert', 'incident', 'case', 'asset', 'malware')),
    target_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'observed_in' CHECK (relationship_type IN (
        'observed_in', 'attributed_to', 'targeted_at', 'blocked_by', 'dropped_by', 'communicated_with'
    )),
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ioc_relationship_target UNIQUE (organization_id, ioc_id, target_type, target_id, relationship_type)
);

-- 3. Composite and B-tree Indexes for High-Throughput SOC Queries
CREATE INDEX IF NOT EXISTS idx_iocs_org_type ON public.iocs(organization_id, ioc_type);
CREATE INDEX IF NOT EXISTS idx_iocs_org_normalized ON public.iocs(organization_id, normalized_value);
CREATE INDEX IF NOT EXISTS idx_iocs_org_severity ON public.iocs(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_iocs_org_status ON public.iocs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_iocs_org_last_seen ON public.iocs(organization_id, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_ioc_relationships_org_ioc ON public.ioc_relationships(organization_id, ioc_id);
CREATE INDEX IF NOT EXISTS idx_ioc_relationships_org_target ON public.ioc_relationships(organization_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ioc_relationships_ioc_target_type ON public.ioc_relationships(ioc_id, target_type);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.iocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ioc_relationships ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies for public.iocs
CREATE POLICY "Members can view IOCs in their organization"
ON public.iocs FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
    OR is_global = TRUE
);

CREATE POLICY "Authorized members can insert IOCs"
ON public.iocs FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Authorized members can update IOCs"
ON public.iocs FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Authorized members can delete IOCs"
ON public.iocs FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- 6. Strict RLS Policies for public.ioc_relationships
CREATE POLICY "Members can view IOC relationships in their organization"
ON public.ioc_relationships FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Authorized members can insert IOC relationships"
ON public.ioc_relationships FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Authorized members can update IOC relationships"
ON public.ioc_relationships FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Authorized members can delete IOC relationships"
ON public.ioc_relationships FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
    )
);
