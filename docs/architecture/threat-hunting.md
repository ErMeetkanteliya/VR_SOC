# Threat Hunting & Investigation Architecture Specification

> **Module:** Threat Hunting Investigation Workspace  
> **Status:** Implemented (Phase 21)  
> **Route:** `/threat-hunting`  
> **Authoritative Specification:** Hypothesis-Driven Threat Hunting & Investigation Model

---

## 1. Executive Summary & Objective

The Threat Hunting subsystem provides a dedicated, proactive investigation workspace for security analysts, incident responders, and threat hunters. It enables hypothesis-driven querying, chronological forensic timeline reconstruction, MITRE ATT&CK kill-chain attack path sequencing, entity-relationship topology graphing, evidence curation, and tenant-scoped analyst notes across all canonical SOC telemetry.

### Golden Architectural Boundary
Threat Hunting strictly reuses existing canonical data layers without creating duplicate databases or fragmented stores:
- **Phase 14 SIEM Query Layer**: Log searches, event records, normalized telemetry (`public.events`).
- **Phase 16 Detection Alert Data**: Triggered Sigma rules, severity mappings, detection metadata (`public.alerts`).
- **Phase 17 EDR Investigation Data**: Process execution trees, host network sockets, file modifications, memory handles.
- **Phase 18 XDR Correlation Layer**: Cross-source correlation identifiers, alert clusters, correlated entities.
- **Phase 19 MITRE ATT&CK Center**: Tactics, techniques, sub-techniques, and threat coverage.
- **Phase 20 Threat Intelligence / IOC Store**: Indicator observables, sighting counts, threat indicators (`public.iocs`).

```text
┌────────────────────────────────────────────────────────────────────────┐
│               Canonical Pipeline & Data Sources                         │
│   [ SIEM Logs • Detection Alerts • EDR Telemetry • XDR • Threat IOCs ] │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Cross-Source Query & Correlation
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            Threat Hunting Query Service (hunting-service.ts)           │
│   [ Bounded Inputs • Entity Filters • Time Windows • Determinism ]     │
└───────┬──────────────┬──────────────┬──────────────┬─────────────┬─────┘
        │              │              │              │             │
        ▼              ▼              ▼              ▼             ▼
   [ Timeline ]  [ Attack Path ]   [ Graph ]    [ Evidence ]    [ Notes ]
 (Forensic Logs)  (Kill-Chain)   (Topology)    (References)   (Audited)
```

---

## 2. Threat Hunting Domain Model & Database Schema

The database persistence layer is defined in `supabase/migrations/20260918000013_threat_hunting.sql`.

### 2.1 Supported Pivot Observable Types (`HuntType`)
1. **`ioc`**: Direct indicator observable searches (IPs, hashes, domains, URLs).
2. **`ip`**: IPv4 and IPv6 network source/destination address hunts.
3. **`hash`**: Cryptographic file hashes (`md5`, `sha1`, `sha256`).
4. **`user`**: Identity accounts, Kerberos usernames, service accounts.
5. **`host`**: Asset hostnames, endpoint machine IDs, domain controllers.
6. **`process`**: Executable names, command line strings, parent/child process IDs.
7. **`registry`**: Windows registry keys and modified values (e.g. `HKCU\...\Run`).
8. **`dns`**: FQDN domain lookups, resolved addresses, DNS query logs.

### 2.2 Table Definitions

#### `public.hunt_sessions`
Saved investigation workspaces and hypothesis definitions:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `title TEXT NOT NULL`
- `description TEXT`
- `query TEXT NOT NULL`
- `hunt_type VARCHAR(32) NOT NULL DEFAULT 'all'`
- `status VARCHAR(32) NOT NULL DEFAULT 'active'` (`active`, `completed`, `saved`, `archived`)
- `hypothesis TEXT`
- `time_range VARCHAR(32) NOT NULL DEFAULT '24h'`
- `created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

#### `public.hunt_evidence`
Forensic evidence references linking directly to canonical source records without duplicating telemetry payloads:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `hunt_id UUID REFERENCES hunt_sessions(id) ON DELETE CASCADE`
- `target_type VARCHAR(32) NOT NULL` (`event`, `alert`, `ioc`, `process`, `socket`, `registry`)
- `target_id TEXT NOT NULL` (Canonical record ID or forensic handle)
- `summary TEXT NOT NULL`
- `description TEXT`
- `confidence INTEGER NOT NULL DEFAULT 85 CHECK (confidence >= 0 AND confidence <= 100)`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `added_by TEXT NOT NULL DEFAULT 'SOC Analyst'`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

#### `public.hunt_notes`
Audited analyst collaboration notes attached to hunts:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `hunt_id UUID REFERENCES hunt_sessions(id) ON DELETE CASCADE`
- `author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`
- `author_name TEXT NOT NULL DEFAULT 'SOC Analyst'`
- `content TEXT NOT NULL`
- `tags TEXT[] NOT NULL DEFAULT '{}'`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

---

## 3. Query Service & Investigation Outputs

The query service (`apps/web/lib/threat-hunting/hunting-service.ts`) enforces strict query validation, bounded result sizes, and deterministic output construction:

### 3.1 Forensic Chronological Timeline
- Combines normalized events, logs, process launches, socket connections, DNS queries, registry modifications, and IOC sightings.
- Strictly ordered by `occurred_at` descending.
- Provides 1-click "Add to Evidence" actions directly on timeline rows.

### 3.2 Deterministic Attack Path Construction
- Multi-step kill-chain sequence based strictly on observed telemetry:
  1. **Initial Access**: Phishing attachment execution (`T1566.001`).
  2. **Execution**: Obfuscated PowerShell payload spawning (`T1059.001`).
  3. **Command and Control**: Outbound HTTPS beaconing to C2 IP (`T1071.001`).
  4. **Persistence**: Registry Run key creation for updater script (`T1547.001`).
  5. **Lateral Movement**: SMB Kerberos traversal to Domain Controller (`T1021.002`).
- Rejects ungrounded or hallucinated attack narratives.

### 3.3 Investigation Topology Graph
- Node-edge relationship model linking hosts, identities, processes, IP sockets, and IOCs.
- Labeled semantic edges (`SPAWNED`, `CONNECTED_TO`, `AFFECTS_HOST`, `AUTHENTICATED_AS`).

### 3.4 1-Click SOC Pivoting
The workspace provides direct deep-link pivots to:
- `/siem?query=...` / `/logs`
- `/alerts?id=...`
- `/edr?host=...`
- `/threat-intelligence?search=...`
- `/mitre?technique=...`

---

## 4. Security, Multi-Tenancy & RBAC Guardrails

### 4.1 Tenant Isolation Invariants
- Every table enforces `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.
- Row Level Security (RLS) is enabled with tenant membership checks against `public.memberships`.
- Cross-tenant queries are blocked at both database RLS and server action layers.

### 4.2 RBAC Role Matrix
Explicit permission capabilities mapped across the 8 enterprise roles:
- **`Super Admin`**: Full query, save, evidence, note permissions.
- **`Threat Hunter`**: Full query, save, evidence, note permissions.
- **`Incident Responder`**: Query, evidence, note, and triage permissions.
- **`SOC Analyst`**: Query, evidence, note permissions.
- **`Instructor`**: Full query, scenario save, and demonstration permissions.
- **`Student`**: Query and evidence testing (no persistent global session mutations).
- **`Auditor`**: Read-only inspection (`threat_hunting:read`).
- **`Viewer`**: No access to raw threat hunting workspaces.

---

## 5. Development Persistence Limitation
In development environments without a live PostgreSQL instance, the service uses in-memory Map stores seeded with canonical scenarios (`CANONICAL_HUNT_SESSIONS`, `CANONICAL_HUNT_EVIDENCE`, `CANONICAL_HUNT_NOTES`) and returns structured simulation data. Live database schema and RLS policies are preserved in `supabase/migrations/20260918000013_threat_hunting.sql`.
