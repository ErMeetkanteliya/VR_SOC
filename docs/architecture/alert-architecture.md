# Architecture: Alerts & Triage Layer

> **Subsystem:** Phase 16 — Alerts & Triage  
> **Target Technology:** Next.js (App Router) + TypeScript + PostgreSQL (Supabase) + Vitest  
> **Status:** Authoritative Architecture Reference  

---

## 1. Overview & Pipeline Placement

The **Alerts & Triage Layer** represents the authoritative bridge between automated detection evaluation (Phase 15) and human analyst investigation/incident management (Phase 17+).

The complete telemetry lifecycle flows as follows:

```text
Simulation / EDR Agent Telemetry
              ↓
Phase 13 Ingestion & Normalization Pipeline (public.events, public.logs)
              ↓
Phase 14 SIEM Query Layer
              ↓
Phase 15 Detection Engine (Produces DetectionExecutionResults)
              ↓
Phase 16 Alerts & Triage Layer (public.alerts, public.alert_history)
              ↓
Phase 17+ Incident Response, Case Dossiers & SOAR Automation
```

### 1.1 Strict Boundary Invariants
1. **Separation from Detection**: Detection execution results do NOT directly become UI state. They flow through `createAlertFromDetection()`, where deduplication, validation, risk scoring, and tenant scoping occur before persistence.
2. **Unmatched Detections Prohibited**: Alerts are never generated for unmatched detection runs (`matched === false`).
3. **Deterministic Deduplication**: Stable deduplication keys (`ruleId:assetId:identityId:timeBucket`) prevent redundant alert generation during recurring or persistent condition cycles.
4. **Tenant Isolation**: Alerts and alert history records are strictly partitioned by `organization_id` with PostgreSQL Row Level Security (RLS) and server-side RBAC guards.
5. **No Incident Pollution**: Phase 16 does NOT implement incident declaration, case dossier compilation, automated endpoint containment, or SOAR playbooks.

---

## 2. Core Alert Data Model

### 2.1 Database Schema (`public.alerts`)
```sql
CREATE TABLE public.alerts (
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
```

### 2.2 Alert Lifecycle State Machine
```text
  [ Detection Match ]
          ↓
       +------+
       | Open | <---------------------+
       +------+                       |
          | (Acknowledge)             | (Reopen)
          v                           |
  +--------------+                    |
  | Acknowledged |                    |
  +--------------+                    |
          | (Assign / Investigate)    |
          v                           |
  +-------------+                     |
  | In Progress |                     |
  +-------------+                     |
     |         |                      |
     |         +----------------------+
     | (Escalate)                     |
     v                                |
+-----------+                         |
| Escalated | ------------------------+
+-----------+                         |
     |                                |
     +-----------> +--------+ <-------+
     | (Resolve)   | Closed |
     |             +--------+
     | (Dismiss)   | False  |
     +-----------> |Positive|
                   +--------+
```

Lifecycle States:
- **`Open`**: Newly generated alert awaiting analyst review.
- **`Acknowledged`**: Analyst has acknowledged receipt of alert.
- **`In Progress`**: Active triage or forensic investigation underway.
- **`Escalated`**: Severe threat flagged for incident declaration.
- **`Closed`**: Threat resolved with verified mitigation rationale.
- **`False Positive`**: Dismissed benign activity or rule tuning candidate.

---

## 3. Deduplication Algorithm

The alert deduplication key is calculated deterministically via `generateAlertDedupKey()`:

$$\text{DedupKey} = \text{ruleId} : \text{assetId} : \text{identityId} : \lfloor \frac{\text{epochMs}}{\text{bucketWindowMs}} \rfloor$$

### Behavior on Duplicate Detection
1. If an alert with the same `(organization_id, dedup_key)` is in an active state (`Open`, `Acknowledged`, `In Progress`, `Escalated`):
   - Merges the newly matched event IDs: $\text{matchedEventIds} \leftarrow \text{existing} \cup \text{new}$.
   - Updates `occurred_at` timestamp and `explanation`.
   - Returns `{ isDuplicate: true, alert: updatedAlert }`.
2. If no active alert exists for that dedup bucket, a new alert is generated with a unique code (e.g. `ALT-2026-A1B2`) and logged in `public.alert_history`.

---

## 4. Auditable Alert History (`public.alert_history`)

Every state mutation, acknowledgement, assignment, note addition, and closure is recorded in `public.alert_history`:

```typescript
export interface AlertHistory {
  id: string;
  organization_id: string;
  alert_id: string;
  actor_id?: string | null;
  action: "created" | "acknowledged" | "assigned" | "status_changed" | "note_added" | "closed";
  previous_status?: string | null;
  new_status?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}
```

---

## 5. Security & Multi-Tenancy

- **Row Level Security (RLS)**: Enforced on both `public.alerts` and `public.alert_history` via `organization_id = auth.current_org_id()` and membership verification.
- **Explicit RBAC Permissions**:
  - `alerts:read`: View queue, metrics, and alert details.
  - `alerts:triage`: Acknowledge, assign, and update status.
  - `alerts:comment`: Add notes to alert history.
  - `alerts:escalate`: Escalate alerts to incident readiness.
- **Server-Side Authorization**: All mutations are authenticated and validated in Server Actions before querying the database.
