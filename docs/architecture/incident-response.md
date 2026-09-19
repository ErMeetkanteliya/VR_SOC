# Incident Response Architecture Specification

> **Module:** Incident Response Domain & Lifecycle Management  
> **Status:** Implemented (Phase 22)  
> **Route:** `/incidents` and `/incidents/[id]`  
> **Authoritative Specification:** NIST SP 800-61 Rev. 2 & ISO/IEC 27035 Aligned Canonical Incident Lifecycle

---

## 1. Executive Summary & Objective

The Incident Response (IR) subsystem provides an authoritative, tenant-isolated domain for managing cybersecurity incidents from initial alert triage through forensic investigation, containment, eradication, system recovery, and post-incident lessons learned.

### 1.1 Golden Architectural Boundaries

1. **State Machine Canonical Pipeline**:
   All incidents strictly follow the 7-stage lifecycle state machine:
   ```text
   Detection ──► Analysis ──► Containment ──► Eradication ──► Recovery ──► Lessons Learned ──► Closed
   ```
2. **Defensive Boundary**:
   The module provides guided response playbooks, evidence tracking, task delegation, and containment tracking. It **NEVER** includes offensive tools, destructive automated scripts, or unconstrained host command execution.
3. **Cross-Domain Reference Architecture**:
   Incidents reference existing canonical entities across SIEM (`events`), Detections (`alerts`), Endpoints (`edr_events`), Threat Intelligence (`iocs`), and Adversary Mapping (`mitre_techniques`). It does not create duplicate silos of telemetry data.
4. **Deferred Case Management Boundary**:
   Phase 22 provides incident declaration, lifecycle tracking, stage transitions, playbooks, checklist tasks, evidence references, analyst notes, and audit timeline history. Full multi-tenant legal/HR case dossiers, external regulatory compliance export packs, and deep multi-case aggregation remain deferred to Phase 23 (Case Management).

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VRSOC Detection Layer                                 │
│          [ SIEM Logs • Sigma Alerts • EDR Telemetry • Threat Intel ]            │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ Escalate / Declare Incident
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    public.incidents (Tenant-Isolated)                           │
│        incident_number • title • severity • priority • stage • status           │
└───────┬──────────────┬──────────────┬──────────────┬──────────────┬─────────────┘
        │              │              │              │              │
        ▼              ▼              ▼              ▼              ▼
   [ Playbooks ]   [ Tasks ]     [ Evidence ]     [ Notes ]     [ History ]
   (Checklists)   (Assignments)  (SIEM/IOC/EDR)  (Audit Notes)  (State Machine)
```

---

## 2. Incident Domain Model & Database Schema

The persistence layer is defined in `supabase/migrations/20260919000014_incident_response.sql`.

### 2.1 Supported Entities & Enums

#### Incident Stages (`IncidentStage`)
1. **`detection`**: Initial trigger, alert triage, scope identification, and triage verification.
2. **`analysis`**: Deep-dive triage, IOC extraction, blast radius scoping, and causal attribution.
3. **`containment`**: Isolation of affected endpoints, credential revocation, network micro-segmentation.
4. **`eradication`**: Malware removal, persistence mechanism purging, compromised binary replacement.
5. **`recovery`**: Restoring systems from trusted backups, hardening controls, continuous monitoring.
6. **`lessons_learned`**: Post-incident review (PIR), timeline verification, root cause analysis, prevention actions.
7. **`closed`**: Formal case sign-off, metrics finalization, archival.

#### Incident Severities & Priorities
- **Severity**: `critical` (P1), `high` (P2), `medium` (P3), `low` (P4).
- **Priority**: `P1` (Immediate Escalation), `P2` (High Urgency), `P3` (Standard Response), `P4` (Low Urgency).
- **Status**: `open`, `in_progress`, `contained`, `resolved`, `closed`.

### 2.2 Table Definitions

#### `public.incidents`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `incident_number VARCHAR(32) NOT NULL` (e.g. `INC-2026-001`)
- `title TEXT NOT NULL`
- `description TEXT NOT NULL DEFAULT ''`
- `severity VARCHAR(16) NOT NULL DEFAULT 'medium'`
- `priority VARCHAR(8) NOT NULL DEFAULT 'P3'`
- `stage VARCHAR(32) NOT NULL DEFAULT 'detection'`
- `status VARCHAR(16) NOT NULL DEFAULT 'open'`
- `lead_analyst_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
- `lead_analyst_name TEXT`
- `declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `contained_at TIMESTAMPTZ`
- `eradicated_at TIMESTAMPTZ`
- `recovered_at TIMESTAMPTZ`
- `closed_at TIMESTAMPTZ`
- `playbook_id UUID REFERENCES public.incident_playbooks(id) ON DELETE SET NULL`
- `declared_from_alert_id VARCHAR(128)`
- `tags TEXT[] NOT NULL DEFAULT '{}'`
- `mitre_techniques TEXT[] NOT NULL DEFAULT '{}'`
- `affected_assets TEXT[] NOT NULL DEFAULT '{}'`
- `affected_users TEXT[] NOT NULL DEFAULT '{}'`
- `metadata JSONB NOT NULL DEFAULT '{}'::JSONB`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

#### `public.incident_playbooks`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `playbook_key VARCHAR(64) NOT NULL` (e.g. `PB-MAL-001`, `PB-RAN-002`, `PB-CRED-003`)
- `title TEXT NOT NULL`
- `description TEXT NOT NULL DEFAULT ''`
- `category VARCHAR(32) NOT NULL` (`malware`, `ransomware`, `credential_access`, `lateral_movement`, `data_exfiltration`, `generic`)
- `target_severity VARCHAR(16) NOT NULL DEFAULT 'high'`
- `estimated_duration_minutes INTEGER NOT NULL DEFAULT 60`
- `steps JSONB NOT NULL DEFAULT '[]'::JSONB` (Deterministic standard operating procedures)
- `is_default BOOLEAN NOT NULL DEFAULT FALSE`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

#### `public.incident_tasks`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE`
- `title TEXT NOT NULL`
- `description TEXT NOT NULL DEFAULT ''`
- `stage VARCHAR(32) NOT NULL DEFAULT 'analysis'`
- `task_order INTEGER NOT NULL DEFAULT 0`
- `is_required BOOLEAN NOT NULL DEFAULT TRUE`
- `status VARCHAR(16) NOT NULL DEFAULT 'pending'` (`pending`, `in_progress`, `completed`, `skipped`)
- `assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
- `assigned_to_name TEXT`
- `completed_at TIMESTAMPTZ`
- `completed_by_name TEXT`
- `notes TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

#### `public.incident_evidence`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE`
- `evidence_type VARCHAR(32) NOT NULL` (`alert`, `log_event`, `edr_process`, `edr_network`, `ioc`, `pcap`, `memory_dump`, `file_sample`, `screenshot`, `other`)
- `reference_id VARCHAR(128) NOT NULL`
- `title TEXT NOT NULL`
- `description TEXT NOT NULL DEFAULT ''`
- `confidence INTEGER NOT NULL DEFAULT 90 CHECK (confidence >= 0 AND confidence <= 100)`
- `source VARCHAR(32) NOT NULL DEFAULT 'siem'`
- `collected_by_name TEXT`
- `collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `metadata JSONB NOT NULL DEFAULT '{}'::JSONB`

#### `public.incident_notes`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE`
- `author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
- `author_name TEXT NOT NULL`
- `author_role TEXT NOT NULL DEFAULT 'SOC Analyst'`
- `content TEXT NOT NULL`
- `tags TEXT[] NOT NULL DEFAULT '{}'`
- `is_pinned BOOLEAN NOT NULL DEFAULT FALSE`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

#### `public.incident_history`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE`
- `actor_name TEXT NOT NULL`
- `action VARCHAR(64) NOT NULL` (`created`, `stage_changed`, `status_changed`, `assigned`, `playbook_applied`, `task_updated`, `evidence_added`, `note_added`)
- `from_stage VARCHAR(32)`
- `to_stage VARCHAR(32)`
- `from_status VARCHAR(16)`
- `to_status VARCHAR(16)`
- `rationale TEXT`
- `occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `metadata JSONB NOT NULL DEFAULT '{}'::JSONB`

---

## 3. State Machine & Stage Transition Engine

The state transition engine is governed by `isValidStageTransition` and `STAGE_LIFECYCLE_ORDER` in `apps/web/lib/incident-response/catalog.ts`.

### 3.1 Transition Rules Matrix

| From Stage | Allowed Forward Targets | Allowed Reversion Targets | Rationale Required |
| :--- | :--- | :--- | :--- |
| **`detection`** | `analysis`, `closed` (False Positive) | None | Yes |
| **`analysis`** | `containment`, `closed` | `detection` | Yes |
| **`containment`** | `eradication` | `analysis` | Yes |
| **`eradication`** | `recovery` | `containment` | Yes |
| **`recovery`** | `lessons_learned` | `eradication` | Yes |
| **`lessons_learned`**| `closed` | `recovery` | Yes |
| **`closed`** | `analysis` (Reopen) | `lessons_learned` | Yes |

Every stage transition writes an immutable audit record to `public.incident_history` with the acting analyst, timestamp, previous stage, new stage, and operational rationale.

---

## 4. Canonical Playbook Catalog

The platform ships with pre-configured playbooks aligned with NIST SP 800-61 checklist standards:

1. **`PB-MAL-001` (Malware Infection & EDR Triage)**
   - Stage-by-stage tasks for isolating host via EDR, terminating suspicious parent/child process trees, gathering process memory, scrubbing persistence run keys, and validating AV clean scan.
2. **`PB-RAN-002` (Ransomware Outbreak & Lateral Containment)**
   - Urgent isolation of domain subnets, disabling compromised service accounts, collecting shadow copy backups, identifying ransomware payload strain, and verifying immutable storage integrity.
3. **`PB-CRED-003` (Credential Dumping & Account Compromise)**
   - Identifying LSASS memory dumping, invalidating active Kerberos TGTs/OAuth sessions, enforcing password reset, auditing AD event 4624/4672 logs, and inspecting suspicious PowerShell scripts.

---

## 5. Security, Multi-Tenancy & RBAC

### 5.1 Role-Based Permissions
The IR subsystem registers granular permissions enforced by PostgreSQL RLS and Server Action security guards:
- `incidents:read`: Super Admin, Instructor, SOC Analyst, Incident Responder, Threat Hunter, Auditor, Viewer.
- `incidents:create`: Super Admin, Instructor, SOC Analyst, Incident Responder, Threat Hunter.
- `incidents:update_status`: Super Admin, Instructor, SOC Analyst, Incident Responder.
- `incidents:assign`: Super Admin, Instructor, SOC Analyst, Incident Responder.
- `incidents:stage`: Super Admin, Instructor, SOC Analyst, Incident Responder.
- `incidents:task`: Super Admin, Instructor, SOC Analyst, Incident Responder.
- `incidents:note`: Super Admin, Instructor, Student, SOC Analyst, Incident Responder, Threat Hunter.
- `incidents:evidence`: Super Admin, Instructor, SOC Analyst, Incident Responder, Threat Hunter.
- `incidents:playbook`: Super Admin, Instructor, Incident Responder.
- `incidents:close`: Super Admin, Instructor, Incident Responder.

### 5.2 Row Level Security (RLS) Invariants
All tables contain `organization_id` foreign keys with `ENABLE ROW LEVEL SECURITY`. Queries evaluate user membership in `public.memberships` to prevent cross-tenant data leakage.

---

## 6. User Experience & Deep SOC Pivots

The Incident Detail Dossier (`/incidents/[id]`) provides immediate forensic pivot links directly into related platform modules:
- **SIEM Logs (`/logs?search=...`)**: Query raw normalized logs for affected hostnames or usernames.
- **Alerts (`/alerts?search=...`)**: View originating detection alert and correlated correlation alerts.
- **EDR Workbench (`/edr`)**: Inspect process trees and endpoint network sockets on compromised assets.
- **Threat Intelligence (`/threat-intelligence?search=...`)**: Pivot to IOC reputations, defanged observables, and sightings.
- **Threat Hunting (`/threat-hunting?entity_type=...`)**: Launch proactive hypothesis hunts around discovered artifacts.
- **MITRE Matrix (`/mitre?technique=...`)**: View technique details, detection rules, and adversary mitigations.
