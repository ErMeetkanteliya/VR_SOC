# VRSOC Architecture — SIEM Core & Investigation Engine

> **Document Role:** Architectural Specification for Phase 14 SIEM Core  
> **Target Technology:** Next.js App Router + TypeScript + Supabase (PostgreSQL 15+, RLS)  
> **Status:** Authoritative  

---

## 1. Domain Responsibilities & Mission

The **SIEM Core** module is the central search, filtering, inspection, foundational correlation, and timeline reconstruction layer in VRSOC.

Positioned immediately downstream of the canonical **Log / Event Ingestion Pipeline (Phase 13)**, SIEM Core consumes already-persisted, normalized cybersecurity telemetry records and provides analysts, instructors, and students with high-speed exploration tools.

```text
Simulation Engine (Phase 12) / Future Real Telemetry
                         ↓
Log / Event Pipeline: Validate → Parse → Normalize → Enrich → Persist (Phase 13)
                         ↓
Canonical Database Tables: public.events, public.logs, processes, files, network
                         ↓
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASE 14 — SIEM CORE SEARCH LAYER                     │
│  - Multi-field Query Engine (Time, Severity, Source, Category, Asset)   │
│  - Free-Text Search & Deterministic Pagination                         │
│  - Deep Event & Auxiliary Entity Inspector (Process, File, Flow)       │
│  - Foundational Deterministic Correlation Engine (Asset, Identity, Run)│
│  - Unified Chronological Investigation Timeline                         │
│  - Tenant-Scoped Saved Query Presets (public.saved_queries)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ↓
Future Phase 15 Detection Rules Engine (Sigma, Alerts, Mitre Detections, Playbooks)
```

---

## 2. Canonical Data Sources & Schema Contracts

SIEM Core queries strictly from the normalized schema tables established in Phase 10 and Phase 13:

1. **`public.events` (Canonical Telemetry Events)**:
   - Primary table for high-level SOC events (e.g. `AUTH_FAILURE`, `PROCESS_CREATE`, `FILE_WRITE`, `PORT_SCAN`).
   - Fields: `id`, `organization_id`, `occurred_at`, `source`, `source_type`, `category`, `event_type`, `severity`, `asset_id`, `agent_id`, `identity_id`, `raw_payload`, `normalized_fields`, `tags`, `pipeline_status`, `ingestion_id`, `source_host`, `created_at`.
2. **`public.logs` (Raw & Parsed Log Stream)**:
   - Stores raw log lines and parsed facility/service strings for low-level forensic log exploration.
   - Fields: `id`, `organization_id`, `event_id`, `logged_at`, `facility`, `log_level`, `source_host`, `service_name`, `message`, `raw_log`, `parse_status`, `parser_name`, `created_at`.
3. **Auxiliary Entities**:
   - `public.processes` (Process execution details: PID, PPID, name, executable_path, command_line, sha256).
   - `public.files` (File modifications: path, size, sha256, is_executable).
   - `public.network_connections` (Network flows: src_ip, dst_ip, ports, protocol, direction).
4. **`public.saved_queries` (Investigation Presets)**:
   - Stores tenant-scoped search parameters (filters, time ranges, severities) without duplicating underlying data.

---

## 3. Time Handling & Investigation Semantics

A critical architectural invariant in VRSOC SIEM is the separation of **occurrence time** vs. **persistence time**:

| Column | Meaning | SIEM Semantic Role |
|:---|:---|:---|
| **`occurred_at`** / **`logged_at`** | Time the telemetry event physically took place on the sensor or target endpoint. | **Authoritative timestamp for all SIEM search filtering, time ranges, correlation windows, and chronological timeline ordering.** |
| **`created_at`** | Time the pipeline ingested and persisted the record into PostgreSQL. | Auditability, ingestion debugging, and pipeline latency tracking only. |

### Timezone Policy
All timestamps are strictly stored as `TIMESTAMPTZ` in UTC and formatted in ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`). User interface views format relative offsets or UTC strings explicitly.

---

## 4. Query Engine & Indexing Strategy

SIEM Core executes server-side queries via `@supabase/ssr` with bounded pagination (`pageSize` max 100, default 25) and stable ordering (`occurred_at DESC` by default).

### Composite Indexing Map

```sql
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

-- Composite index for severity filtering
CREATE INDEX IF NOT EXISTS idx_events_org_severity_occurred
  ON public.events(organization_id, severity, occurred_at DESC);

-- Composite index for logs time-range & service filtering
CREATE INDEX IF NOT EXISTS idx_logs_org_service_logged
  ON public.logs(organization_id, service_name, logged_at DESC);

-- Saved queries index
CREATE INDEX IF NOT EXISTS idx_saved_queries_org
  ON public.saved_queries(organization_id, query_type, created_at DESC);
```

---

## 5. Foundational Correlation Engine

Phase 14 introduces foundational, deterministic correlation without alert generation:

1. **Asset Correlation (`correlateByAsset`)**:
   - Queries telemetry occurring on the same `asset_id` within a symmetric temporal proximity window ($t \pm 30\text{m}$).
2. **Identity Correlation (`correlateByIdentity`)**:
   - Gathers all actions performed by the same user account (`identity_id`) across assets.
3. **Ingestion Batch Correlation (`correlateByIngestionBatch`)**:
   - Reconstructs related events originating from the same synthetic telemetry stream (`ingestion_id`).

### Correlation Boundaries
- Correlation is **transparent and deterministic**: every cluster includes an explicit explanation string (e.g., *"Identified 6 telemetry events on host srv-linux-01 within ±30m window"*).
- Does **NOT** execute alert generation, UEBA anomaly scoring, or machine learning.

---

## 6. Multi-Tenant Isolation & Security Model

1. **Mandatory Tenant Scoping**: Every SIEM query, correlation lookup, and saved query mutation requires a valid `organization_id`.
2. **Authoritative PostgreSQL RLS**: RLS policies verify tenant membership in `public.memberships` for every SELECT, INSERT, UPDATE, and DELETE query.
3. **Zero Arbitrary SQL**: Queries are parameterized through the Supabase query builder. No user-supplied raw SQL strings are permitted.
4. **Saved Query Safety**: Saved queries store structured JSON filter objects validated by Zod (`SiemFilterParamsSchema`). Result sets are never stored in `saved_queries`.

---

## 7. What Phase 14 Intentionally Does NOT Implement

To preserve strict domain boundaries, the following capabilities are deferred to subsequent phases:
- **Phase 15**: Sigma detection rule evaluation, threshold detection, and alert generation.
- **Phase 16**: MITRE ATT&CK matrix mapping and tactic classification.
- **Phase 17**: Incident declaration, case dossier management, and responder assignments.
- **Phase 18**: SOAR automated playbooks and containment actions.
- **Infrastructure Exclusions**: No Kafka, ClickHouse, Elasticsearch, OpenSearch, or Redis streams.
