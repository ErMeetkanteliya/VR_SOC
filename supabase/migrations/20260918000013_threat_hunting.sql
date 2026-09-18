-- =============================================================================
-- Migration: 20260918000013_threat_hunting.sql
-- Description: Creates public.hunt_sessions, public.hunt_evidence, and public.hunt_notes
-- Multi-Tenancy: Enforces strict organization_id boundaries with PostgreSQL RLS
-- Security: Prohibits arbitrary code/SQL; all hunt records are tenant-isolated
-- =============================================================================

-- 1. Create public.hunt_sessions Table
CREATE TABLE IF NOT EXISTS public.hunt_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    hypothesis TEXT,
    hunt_type VARCHAR(32) NOT NULL DEFAULT 'all',
    query TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    analyst_id UUID,
    analyst_name VARCHAR(128) NOT NULL DEFAULT 'SOC Analyst',
    findings_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint for hunt_type
ALTER TABLE public.hunt_sessions
    DROP CONSTRAINT IF EXISTS hunt_sessions_type_check,
    ADD CONSTRAINT hunt_sessions_type_check
    CHECK (hunt_type IN ('all', 'ioc', 'ip', 'hash', 'user', 'host', 'process', 'registry', 'dns'));

-- Constraint for status
ALTER TABLE public.hunt_sessions
    DROP CONSTRAINT IF EXISTS hunt_sessions_status_check,
    ADD CONSTRAINT hunt_sessions_status_check
    CHECK (status IN ('active', 'completed', 'saved', 'archived'));

-- 2. Create public.hunt_evidence Table
CREATE TABLE IF NOT EXISTS public.hunt_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    hunt_id UUID REFERENCES public.hunt_sessions(id) ON DELETE CASCADE,
    target_type VARCHAR(32) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    summary TEXT NOT NULL,
    description TEXT,
    confidence INTEGER NOT NULL DEFAULT 85 CHECK (confidence >= 0 AND confidence <= 100),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    added_by VARCHAR(128) NOT NULL DEFAULT 'SOC Analyst',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint for target_type
ALTER TABLE public.hunt_evidence
    DROP CONSTRAINT IF EXISTS hunt_evidence_target_type_check,
    ADD CONSTRAINT hunt_evidence_target_type_check
    CHECK (target_type IN ('event', 'alert', 'ioc', 'process', 'socket', 'registry'));

-- 3. Create public.hunt_notes Table
CREATE TABLE IF NOT EXISTS public.hunt_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    hunt_id UUID REFERENCES public.hunt_sessions(id) ON DELETE CASCADE,
    author_id UUID,
    author_name VARCHAR(128) NOT NULL DEFAULT 'SOC Analyst',
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Indexes for High-Throughput Tenant & Hunt Querying
CREATE INDEX IF NOT EXISTS idx_hunt_sessions_org_status
    ON public.hunt_sessions(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_hunt_sessions_org_type
    ON public.hunt_sessions(organization_id, hunt_type);

CREATE INDEX IF NOT EXISTS idx_hunt_sessions_created
    ON public.hunt_sessions(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hunt_evidence_hunt
    ON public.hunt_evidence(organization_id, hunt_id);

CREATE INDEX IF NOT EXISTS idx_hunt_evidence_target
    ON public.hunt_evidence(organization_id, target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_hunt_notes_hunt
    ON public.hunt_notes(organization_id, hunt_id, created_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.hunt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_notes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for public.hunt_sessions
DROP POLICY IF EXISTS "Tenant members can view hunt sessions" ON public.hunt_sessions;
CREATE POLICY "Tenant members can view hunt sessions"
    ON public.hunt_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_sessions.organization_id
              AND memberships.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tenant members can insert hunt sessions" ON public.hunt_sessions;
CREATE POLICY "Tenant members can insert hunt sessions"
    ON public.hunt_sessions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_sessions.organization_id
              AND memberships.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tenant members can update hunt sessions" ON public.hunt_sessions;
CREATE POLICY "Tenant members can update hunt sessions"
    ON public.hunt_sessions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_sessions.organization_id
              AND memberships.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tenant members can delete hunt sessions" ON public.hunt_sessions;
CREATE POLICY "Tenant members can delete hunt sessions"
    ON public.hunt_sessions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_sessions.organization_id
              AND memberships.user_id = auth.uid()
        )
    );

-- 7. RLS Policies for public.hunt_evidence
DROP POLICY IF EXISTS "Tenant members can view hunt evidence" ON public.hunt_evidence;
CREATE POLICY "Tenant members can view hunt evidence"
    ON public.hunt_evidence
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_evidence.organization_id
              AND memberships.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tenant members can insert hunt evidence" ON public.hunt_evidence;
CREATE POLICY "Tenant members can insert hunt evidence"
    ON public.hunt_evidence
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_evidence.organization_id
              AND memberships.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tenant members can delete hunt evidence" ON public.hunt_evidence;
CREATE POLICY "Tenant members can delete hunt evidence"
    ON public.hunt_evidence
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_evidence.organization_id
              AND memberships.user_id = auth.uid()
        )
    );

-- 8. RLS Policies for public.hunt_notes
DROP POLICY IF EXISTS "Tenant members can view hunt notes" ON public.hunt_notes;
CREATE POLICY "Tenant members can view hunt notes"
    ON public.hunt_notes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_notes.organization_id
              AND memberships.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tenant members can insert hunt notes" ON public.hunt_notes;
CREATE POLICY "Tenant members can insert hunt notes"
    ON public.hunt_notes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_notes.organization_id
              AND memberships.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Tenant members can delete hunt notes" ON public.hunt_notes;
CREATE POLICY "Tenant members can delete hunt notes"
    ON public.hunt_notes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.organization_id = hunt_notes.organization_id
              AND memberships.user_id = auth.uid()
        )
    );
