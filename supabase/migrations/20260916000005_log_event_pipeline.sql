-- =============================================================================
-- Phase 13: Log / Event Pipeline — Schema Enhancements
-- =============================================================================
-- Adds pipeline processing metadata to events and logs tables.
-- Adds additional indexes for pipeline query patterns.
-- Does NOT recreate events or logs tables (those exist from Phase 10).
-- =============================================================================

-- 1. Add pipeline_status to events (tracks processing state)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS pipeline_status VARCHAR(32) NOT NULL DEFAULT 'Stored'
    CHECK (pipeline_status IN ('Received', 'Validated', 'Parsed', 'Normalized', 'Enriched', 'Stored', 'Failed'));

-- 2. Add ingestion_id for idempotency / deduplication
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ingestion_id VARCHAR(128);

-- 3. Add source_host to events for direct host attribution
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS source_host VARCHAR(255);

-- 4. Add pipeline_status to logs
ALTER TABLE public.logs
  ADD COLUMN IF NOT EXISTS pipeline_status VARCHAR(32) NOT NULL DEFAULT 'Stored'
    CHECK (pipeline_status IN ('Received', 'Validated', 'Parsed', 'Normalized', 'Enriched', 'Stored', 'Failed'));

-- 5. Add ingestion_id to logs for idempotency / deduplication
ALTER TABLE public.logs
  ADD COLUMN IF NOT EXISTS ingestion_id VARCHAR(128);

-- 6. Add source and source_type to logs for direct source attribution
ALTER TABLE public.logs
  ADD COLUMN IF NOT EXISTS source VARCHAR(64);

ALTER TABLE public.logs
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(64);

-- =============================================================================
-- Additional Indexes for Pipeline Query Patterns
-- =============================================================================

-- Events: pipeline status filtering
CREATE INDEX IF NOT EXISTS idx_events_pipeline_status
  ON public.events(organization_id, pipeline_status);

-- Events: ingestion deduplication
CREATE INDEX IF NOT EXISTS idx_events_ingestion_id
  ON public.events(ingestion_id)
  WHERE ingestion_id IS NOT NULL;

-- Events: severity + timestamp (alert generation queries)
CREATE INDEX IF NOT EXISTS idx_events_org_severity_occurred
  ON public.events(organization_id, severity, occurred_at DESC);

-- Events: source_host lookups
CREATE INDEX IF NOT EXISTS idx_events_source_host
  ON public.events(organization_id, source_host)
  WHERE source_host IS NOT NULL;

-- Logs: pipeline status filtering
CREATE INDEX IF NOT EXISTS idx_logs_pipeline_status
  ON public.logs(organization_id, pipeline_status);

-- Logs: ingestion deduplication
CREATE INDEX IF NOT EXISTS idx_logs_ingestion_id
  ON public.logs(ingestion_id)
  WHERE ingestion_id IS NOT NULL;

-- Logs: source filtering
CREATE INDEX IF NOT EXISTS idx_logs_source
  ON public.logs(organization_id, source)
  WHERE source IS NOT NULL;

-- Logs: parse_status filtering (for reprocessing failed logs)
CREATE INDEX IF NOT EXISTS idx_logs_parse_status
  ON public.logs(organization_id, parse_status);

-- Logs: source_host filtering
CREATE INDEX IF NOT EXISTS idx_logs_source_host
  ON public.logs(organization_id, source_host)
  WHERE source_host IS NOT NULL;
