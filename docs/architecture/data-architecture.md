# VRSOC Architecture Constitution — Data Architecture

## 1. Document Overview

This document defines the target Supabase and PostgreSQL data architecture for the VRSOC SaaS platform. It establishes the relational data models, multi-tenant partitioning, primary/foreign key conventions, indexing strategies, state machines, audit trail mechanisms, and data retention policies that will guide database implementation in Phase 04 and Phase 10.

> **Phase Constraint**: This document specifies the **data architecture rules, schema contracts, and entity relationships**. No physical database migrations or SQL DDL scripts are created during Phase 02.

---

## 2. Classification Framework

| Category | Definition | Application to Data Architecture |
|---|---|---|
| **OBSERVED** | Verifiable from Base44 bundle, network, and DOM. | Entity concepts like Alerts, Incidents, Agents, Sigma Rules, Playbooks, Knowledge Articles, Analytics. |
| **INFERRED** | Logical deductions from observable patterns. | Relational mappings between alerts and incidents; telemetry structure backing the live terminal. |
| **UNKNOWN** | Unobservable internal Base44 storage details. | Base44's private database schema, table naming, indexing, and ORM configuration. |
| **TARGET** | Production architecture designed for VRSOC. | PostgreSQL 15+ relational schema, multi-tenant RLS policies, partitioned event tables, and JSONB payloads. |

---

## 3. Relational Entity Relationship Architecture

```text
┌────────────────────────┐
│     organizations      │
│  id (PK, UUID)         │
│  name, slug, tier      │
└───────────┬────────────┘
            │
            ├───────────────────────────────────────────────────────┐
            │ 1:N                                                   │ 1:N
            ▼                                                       ▼
┌────────────────────────┐                               ┌────────────────────────┐
│      memberships       │                               │         assets         │
│  id (PK), org_id (FK)  │                               │  id (PK), org_id (FK)  │
│  user_id (FK), role    │                               │  hostname, ip, os      │
└───────────┬────────────┘                               └───────────┬────────────┘
            │                                                       │
            ├──────────────────────┐                                ├──────────────────────┐
            │ 1:N                  │ 1:N                            │ 1:1                  │ 1:N
            ▼                      ▼                                ▼                      ▼
┌────────────────────────┐ ┌────────────────────────┐     ┌───────────────────┐  ┌──────────────────┐
│         teams          │ │      invitations       │     │      agents       │  │      events      │
│  id (PK), org_id (FK)  │ │  id (PK), org_id (FK)  │     │  id (PK), asset_id│  │  id (PK), org_id │
└────────────────────────┘ └────────────────────────┘     └───────────────────┘  │  timestamp, JSON │
                                                                                 └─────────┬────────┘
            ┌──────────────────────────────────────────────────────────────────────────────┘
            │ 1:N Evaluates Rules
            ▼
┌────────────────────────┐       1:N       ┌────────────────────────┐       1:N       ┌────────────────────────┐
│    detection_rules     │ ───────────────► │         alerts         │ ──────────────► │     alert_comments     │
│  id (PK), org_id (FK)  │                 │  id (PK), org_id (FK)  │                 │  id (PK), alert_id (FK)│
│  name, severity, sigma │                 │  title, risk_score     │                 └────────────────────────┘
└────────────────────────┘                 └───────────┬────────────┘
                                                       │
                                                       │ N:M (alert_incidents)
                                                       ▼
┌────────────────────────┐       1:N       ┌────────────────────────┐       1:N       ┌────────────────────────┐
│     audit_events       │                 │       incidents        │ ──────────────► │         cases          │
│  id (PK), org_id (FK)  │                 │  id (PK), org_id (FK)  │                 │  id (PK), incident_id  │
│  actor_id, action, log │                 │  incident_num, stage   │                 └───────────┬────────────┘
└────────────────────────┘                 └────────────────────────┘                             │
                                                                                                  │ 1:N
                                                                                                  ▼
┌────────────────────────┐                 ┌────────────────────────┐                 ┌────────────────────────┐
│    simulation_runs     │                 │   training_progress    │                 │     case_evidence      │
│  id (PK), org_id (FK)  │                 │  id (PK), org_id (FK)  │                 │  id (PK), case_id (FK) │
│  scenario_id, events_ct│                 │  student_id, score     │                 │  evidence_type, ref_id │
└────────────────────────┘                 └────────────────────────┘                 └────────────────────────┘
```

---

## 4. Standard Schema Conventions & Invariants

### 4.1 Primary Keys & Identifiers
- **UUID v4**: All tables use `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- **Human-Readable Identifiers**: Business entities maintain indexed, sequence-backed codes:
  - Alerts: `alert_code VARCHAR(32)` (e.g. `ALT-2026-0342`)
  - Incidents: `incident_number VARCHAR(32)` (e.g. `INC-2026-0089`)
  - Cases: `case_number VARCHAR(32)` (e.g. `CASE-2026-0045`)

### 4.2 Multi-Tenant Foreign Keys
- **Mandatory Tenancy**: Every tenant-owned table MUST contain:
  ```sql
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
  ```
- **Referential Integrity**:
  - Deleting an `organization` cascades and deletes all associated operational assets, alerts, cases, and logs.
  - Deleting a `user` from an organization does NOT delete operational SOC records (alerts/incidents); instead, assignee foreign keys are set to `ON DELETE SET NULL` to preserve historical integrity.

### 4.3 Standard Audit & Timestamp Columns
Every table includes standard operational tracking columns:
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
```
For user-authored entities (`cases`, `playbooks`, `detection_rules`):
```sql
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
```

---

## 5. Indexing Strategy

To guarantee sub-100ms P95 query latencies across multi-tenant workloads, indexes are categorized into three distinct architectural patterns:

### 5.1 Multi-Tenant B-Tree Indexes
Every tenant-scoped table MUST index `organization_id` to optimize RLS evaluation and filter operations:
```sql
CREATE INDEX idx_alerts_org_id ON alerts(organization_id);
CREATE INDEX idx_incidents_org_id ON incidents(organization_id);
CREATE INDEX idx_assets_org_id ON assets(organization_id);
CREATE INDEX idx_memberships_user_org ON memberships(user_id, organization_id);
```

### 5.2 Composite Time-Series Indexes
High-throughput operational tables (`events`, `logs`, `alerts`, `audit_events`) utilize composite indexes combining tenant ID with timestamp and status/severity for instantaneous dashboard aggregation:
```sql
CREATE INDEX idx_alerts_org_sev_created ON alerts(organization_id, severity, created_at DESC);
CREATE INDEX idx_events_org_time ON events(organization_id, timestamp DESC);
CREATE INDEX idx_incidents_org_stage ON incidents(organization_id, stage, created_at DESC);
```

### 5.3 Inverted (GIN) Indexes on JSONB & Telemetry Search
For unstructured log search and IOC matching:
```sql
CREATE INDEX idx_events_normalized_gin ON events USING GIN (normalized_fields);
CREATE INDEX idx_threat_intel_val ON threat_intelligence USING GIN (to_tsvector('english', value));
```

---

## 6. High-Volume Telemetry & Data Retention

### 6.1 Telemetry Table Partitioning
The `public.events` / `public.logs` table will receive high-volume synthetic telemetry during simulation runs. To maintain query performance:
- **Strategy**: PostgreSQL declarative range partitioning by month on `timestamp` (e.g., `events_2026_09`, `events_2026_10`).
- **Partition Pruning**: Queries filtering on time ranges (`WHERE timestamp >= now() - interval '24 hours'`) automatically prune historical partitions.

### 6.2 Data Retention & Archival Strategy
- **Operational Tier**: Hot data (last 30 days) stored in active PostgreSQL partitions.
- **Educational / Completed Labs**: Telemetry generated during temporary student simulation runs is tagged with `simulation_run_id` and can be archived or cleaned up automatically post-grading.
- **Audit Logs**: `public.audit_events` is permanent and immutable (zero retention purge).

---

## 7. Entity Lifecycle & State Machines

### 7.1 Alert Lifecycle
```text
[Open] ────────► [Acknowledged] ────────► [In Progress]
  │                      │                      │
  ├──────────────────────┼──────────────────────┴────────► [Escalated] ──► (Incident Created)
  │                      │                                      │
  ▼                      ▼                                      ▼
[Closed (Resolved)]   [Closed (False Positive)]             [Closed (Duplicate)]
```

### 7.2 Incident Lifecycle (NIST SP 800-61)
```text
[Detection] ──► [Analysis] ──► [Containment] ──► [Eradication] ──► [Recovery] ──► [Lessons Learned] ──► [Closed]
```

### 7.3 Agent Lifecycle
```text
[Pending] ──► [Online] ◄──► [Warning] ◄──► [Critical] ──► [Isolated]
                 │
                 ▼
             [Offline] ──► [Decommissioned]
```

---

## 8. Soft Deletion Policy

- **Operational Telemetry (Logs, Alerts, Incidents, Audit Events)**: Hard deletion is strictly prohibited to preserve forensic and compliance integrity. Status transitions (e.g., `is_archived = true` or `status = 'Closed'`) represent terminal lifecycles.
- **Administrative Entities (Teams, Asset Groups, Playbook Templates)**: Support soft deletion via `deleted_at TIMESTAMPTZ DEFAULT NULL`. RLS policies filter `WHERE deleted_at IS NULL` for standard application queries.
