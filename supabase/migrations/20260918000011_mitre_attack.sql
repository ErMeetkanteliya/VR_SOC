-- ==============================================================================
-- VRSOC Migration: 20260918000011_mitre_attack.sql
-- Phase 19: Shared MITRE ATT&CK Intelligence Layer & Coverage
-- ==============================================================================

-- 1. MITRE Tactics (Global Shared Reference)
CREATE TABLE IF NOT EXISTS public.mitre_tactics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'TA0001'
    name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MITRE Techniques & Sub-techniques (Global Shared Reference)
CREATE TABLE IF NOT EXISTS public.mitre_techniques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'T1059' or 'T1059.001'
    name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    tactic_external_id VARCHAR(32) NOT NULL REFERENCES public.mitre_tactics(external_id) ON DELETE CASCADE,
    tactic_name VARCHAR(128) NOT NULL,
    is_subtechnique BOOLEAN NOT NULL DEFAULT FALSE,
    parent_technique_id VARCHAR(32) REFERENCES public.mitre_techniques(external_id) ON DELETE SET NULL,
    platforms TEXT[] NOT NULL DEFAULT ARRAY['Windows', 'Linux', 'macOS', 'Cloud', 'Network'],
    data_sources TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    detection_guidance TEXT NOT NULL DEFAULT '',
    examples JSONB NOT NULL DEFAULT '[]'::JSONB,
    mitigations JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MITRE Mitigations Catalog (Global Shared Reference)
CREATE TABLE IF NOT EXISTS public.mitre_mitigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(32) NOT NULL UNIQUE, -- e.g. 'M1036'
    name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tenant Custom Mappings / Overrides (Tenant-Scoped)
CREATE TABLE IF NOT EXISTS public.mitre_tenant_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    technique_external_id VARCHAR(32) NOT NULL REFERENCES public.mitre_techniques(external_id) ON DELETE CASCADE,
    coverage_status VARCHAR(32) NOT NULL DEFAULT 'uncovered', -- 'covered', 'partially_covered', 'uncovered'
    custom_notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_technique UNIQUE (organization_id, technique_external_id)
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_mitre_tactics_order ON public.mitre_tactics(order_index ASC);
CREATE INDEX IF NOT EXISTS idx_mitre_techniques_tactic ON public.mitre_techniques(tactic_external_id);
CREATE INDEX IF NOT EXISTS idx_mitre_techniques_parent ON public.mitre_techniques(parent_technique_id);
CREATE INDEX IF NOT EXISTS idx_mitre_techniques_sub ON public.mitre_techniques(is_subtechnique);
CREATE INDEX IF NOT EXISTS idx_mitre_tenant_mappings_org ON public.mitre_tenant_mappings(organization_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.mitre_tactics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitre_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitre_mitigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitre_tenant_mappings ENABLE ROW LEVEL SECURITY;

-- Tactics, Techniques, Mitigations: Shared Global Reference (Readable by all authenticated users)
CREATE POLICY "global_read_mitre_tactics"
    ON public.mitre_tactics
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "global_read_mitre_techniques"
    ON public.mitre_techniques
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "global_read_mitre_mitigations"
    ON public.mitre_mitigations
    FOR SELECT
    TO authenticated
    USING (true);

-- Tenant Mappings: Strict Multi-Tenant Isolation
CREATE POLICY "tenant_read_mitre_mappings"
    ON public.mitre_tenant_mappings
    FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "tenant_write_mitre_mappings"
    ON public.mitre_tenant_mappings
    FOR ALL
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM public.memberships
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.memberships
            WHERE user_id = auth.uid()
        )
    );
