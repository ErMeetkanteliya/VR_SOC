# Threat Intelligence & IOC Architecture Specification

> **Module:** Threat Intelligence / Indicator of Compromise (IOC) Entity Layer  
> **Status:** Implemented (Phase 20)  
> **Route:** `/threat-intelligence`  
> **Authoritative Specification:** STIX 2.1 & MITRE ATT&CK Aligned Canonical Intelligence Model

---

## 1. Executive Summary & Objective

The Threat Intelligence and IOC subsystem provides a shared, authoritative, tenant-isolated repository of cyber observables, indicator metadata, and multi-directional forensic relationships across the VRSOC training and simulation platform.

### Golden Architectural Boundary
Threat Intelligence is a **shared platform entity layer**. It is **NEVER** implemented as disparate, duplicate tables or siloed state inside SIEM logs, Alert correlation engines, EDR simulators, or Incident dossiers. All telemetry sightings, detection alerts, EDR socket/file events, and investigation cases reference canonical `iocs` and `ioc_relationships` records.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    Canonical Threat Observables                         │
│       [ IP • Domain • URL • File Hash • Email • Filename/Process ]       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Normalization & Defanging Pipeline
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    public.iocs (Tenant-Isolated)                        │
│          normalized_value • raw_value • severity • confidence           │
└───────┬──────────────┬──────────────┬──────────────┬─────────────┬──────┘
        │              │              │              │             │
        ▼              ▼              ▼              ▼             ▼
   [ Events ]     [ Alerts ]   [ Incidents ]     [ Assets ]   [ Malware ]
   (SIEM Logs)   (Detections)     (Cases)          (EDR)      (Payloads)
```

---

## 2. IOC Domain Model & Database Schema

The database persistence layer is defined in `supabase/migrations/20260918000012_threat_intelligence.sql`.

### 2.1 Supported Indicator Types (`IocType`)
1. **`ip`**: IPv4 and IPv6 network addresses (e.g. `185.220.101.5`, `2a02:4780:8::1`).
2. **`domain`**: Fully qualified domain names (FQDN) (e.g. `c2-update-services.ru`).
3. **`url`**: Web request targets, URIs, and command endpoints (e.g. `https://malicious-cdn.net/payload.bin`).
4. **`hash`**: Cryptographic file hashes (`md5`, `sha1`, `sha256`, `sha512`).
5. **`email`**: Phishing senders, recipient targets, and spoofed headers (e.g. `billing-alert@target-corp.com`).
6. **`file`**: Malicious filenames, script droppers, and tool binaries (e.g. `Invoke-Mimikatz.ps1`, `beacon.dll`).

### 2.2 Table Definitions

#### `public.iocs`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `ioc_type VARCHAR(32) NOT NULL` (`ip`, `domain`, `url`, `hash`, `email`, `file`)
- `normalized_value TEXT NOT NULL` (lowercase, stripped protocols/paths/defanging where applicable)
- `raw_value TEXT NOT NULL` (original observable string preserving forensic integrity)
- `hash_type VARCHAR(16)` (`md5`, `sha1`, `sha256`, `sha512`, or `NULL`)
- `ip_version VARCHAR(8)` (`v4`, `v6`, or `NULL`)
- `confidence INTEGER NOT NULL DEFAULT 80 CHECK (confidence >= 0 AND confidence <= 100)`
- `severity VARCHAR(16) NOT NULL DEFAULT 'high'` (`critical`, `high`, `medium`, `low`, `informational`)
- `threat_types TEXT[] NOT NULL DEFAULT '{}'` (`c2`, `ransomware`, `phishing`, `dropper`, `botnet`, `scanner`, etc.)
- `source VARCHAR(32) NOT NULL DEFAULT 'manual'` (`manual`, `simulation`, `alienvault_otx`, `virustotal`, `misp`, etc.)
- `tags TEXT[] NOT NULL DEFAULT '{}'`
- `description TEXT NOT NULL DEFAULT ''`
- `first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `status VARCHAR(16) NOT NULL DEFAULT 'active'` (`active`, `watchlist`, `deprecated`, `false_positive`)
- `is_global BOOLEAN NOT NULL DEFAULT FALSE` (System-wide default simulation indicators)
- `metadata JSONB NOT NULL DEFAULT '{}'::JSONB` (ASN, geolocation, reputation scores)
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

#### `public.ioc_relationships`
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`
- `ioc_id UUID NOT NULL REFERENCES public.iocs(id) ON DELETE CASCADE`
- `target_type VARCHAR(32) NOT NULL` (`event`, `alert`, `incident`, `case`, `asset`, `malware`)
- `target_id VARCHAR(128) NOT NULL` (Foreign target entity reference)
- `relationship_type VARCHAR(32) NOT NULL` (`communicated_with`, `downloaded_from`, `executed_by`, `observed_on`, `attributed_to`, `resolved_to`, `dropped_by`)
- `description TEXT`
- `confidence INTEGER NOT NULL DEFAULT 90`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

---

## 3. Deterministic Normalization & Defanging Pipeline

To prevent duplicate observables caused by defanged formatting (`hxxps://`, `[.]`, `[@]`) or casing variations, all indicators pass through `apps/web/lib/threat-intel/normalization.ts`.

### Normalization Matrix

| Type | Input Example | Defanging Output | Normalized Canonical Output | Rules Enforced |
| :--- | :--- | :--- | :--- | :--- |
| **IP** | `185[.]220[.]101[.]5:8080` | `185.220.101.5:8080` | `185.220.101.5` | Strips port, validates IPv4/IPv6 octets. |
| **Domain** | `hxxps://evil-c2[.]net/beacon` | `https://evil-c2.net/beacon` | `evil-c2.net` | Strips protocols, trailing paths, query parameters, lowercase. |
| **URL** | `hxxps://phish[.]site/login?id=1` | `https://phish.site/login?id=1` | `https://phish.site/login?id=1` | Standardizes scheme (`http/https`), lowercase hostname, preserves path. |
| **Hash** | `44D88612FEA8A8F36DE82E1278ABB02F` | N/A | `44d88612fea8a8f36de82e1278abb02f` | Lowercase hex, detects MD5 (32), SHA1 (40), SHA256 (64), SHA512 (128). |
| **Email** | `phish[@]target-corp[.]com` | `phish@target-corp.com` | `phish@target-corp.com` | Validates RFC-5322 structure, lowercase domain part. |
| **File** | `C:\Users\Admin\Invoke-Mimikatz.ps1` | N/A | `Invoke-Mimikatz.ps1` | Strips Windows/Unix directory prefixes, preserves case-sensitive basename. |

---

## 4. Multi-Tenant Security & RBAC Enforcement

### 4.1 PostgreSQL Row Level Security (RLS)
RLS is mandatory and enabled on both `public.iocs` and `public.ioc_relationships`:
- **Read Access**: Authenticated users can view indicators belonging to their active organization membership (`public.memberships`) OR platform-wide global simulation indicators (`is_global = true`).
- **Mutation Access (Insert/Update/Delete)**: Strictly restricted to records with `organization_id` matching an active membership. Global indicators cannot be mutated by tenant analysts.

### 4.2 Server-Side RBAC Permissions
Threat Intelligence operations are guarded by explicit granular permissions evaluated server-side in Server Actions:
- `threat_intel:read` — View threat indicators, KPI metrics, and relationships (All roles except Viewer if restricted).
- `threat_intel:create` — Register new indicators and defanged observables (`Super Admin`, `Instructor`, `SOC Analyst`, `Threat Hunter`, `Incident Responder`).
- `threat_intel:update` — Modify confidence, severity, lifecycle status, or analyst tags.
- `threat_intel:delete` — Deprecate or remove indicators (`Super Admin`, `Threat Hunter`).
- `threat_intel:relate` — Link observables to SIEM events, detection alerts, EDR endpoints, or malware dossiers.

---

## 5. Threat Intelligence UI Architecture (`/threat-intelligence`)

Built with the VRSOC / Base44 Dark Cyber design system (`#0A0A0A` background, `#141414` glassmorphism, crimson accents).

### Component Hierarchy
```text
ThreatIntelWorkbench (Master Orchestrator)
├── IocOverviewKpis (4 Metric cards: Active IOCs, Critical Threats, Sightings, Types)
├── IocFilterBar (Search input, Type chips [IP, DOM, URL, HASH, EMAIL, FILE], Severity/Status dropdowns, 'New Indicator' trigger)
├── IocTable (Sortable table with severity badges, confidence bars, 1-click clipboard copy, tags, 'Inspect' drawer trigger)
├── IocDetailDrawer (4-Tab forensic inspector: Overview, Related Events, Alerts & Incidents, Related Assets, Quick SOC Pivots)
└── CreateIocModal (Analyst creation modal with real-time defanging/normalization preview and validation)
```

### 1-Click SOC Investigation Pivots
The `IocDetailDrawer` exposes deep navigation pivots into related defensive modules:
- **SIEM Logs** (`/logs?search=...`) — Queries correlated event streams for sightings of this indicator.
- **Alert Center** (`/alerts?search=...`) — Correlates open detection alerts triggering on this IOC.
- **EDR Endpoint** (`/edr`) — Inspects process trees and open network sockets on compromised endpoints.
- **MITRE ATT&CK** (`/mitre`) — Navigates to adversary tactics and techniques associated with the indicator's threat category.

---

## 6. Performance & Indexing Strategy

PostgreSQL composite and expression indexes are implemented to support high-throughput correlation lookups without requiring external search engines (Elasticsearch, OpenSearch, ClickHouse):
1. `idx_iocs_org_val`: `(organization_id, normalized_value)` — Fast exact-match deduplication and SIEM correlation.
2. `idx_iocs_org_type`: `(organization_id, ioc_type)` — Accelerated category tab filtering.
3. `idx_iocs_org_status_sev`: `(organization_id, status, severity)` — Accelerated high-priority KPI queries.
4. `idx_ioc_relationships_lookup`: `(organization_id, ioc_id, target_type)` — Fast multi-tab relationship drawer lookups.
5. `idx_ioc_relationships_reverse`: `(organization_id, target_type, target_id)` — Reverse enrichment lookup when viewing Alerts or SIEM events.

---

## 7. Current Development Mode Limitation & Future Persistence

> [!NOTE]
> **Development Environment Limitation**:
> As specified in platform operating rules, local and remote PostgreSQL database engines are not currently running during this phase of development.
> - The codebase contains full production PostgreSQL DDL and RLS migration scripts in `supabase/migrations/20260918000012_threat_intelligence.sql`.
> - Server actions, service modules, and UI components operate with in-memory persistence and canonical simulation datasets during current test execution and preview runs.
> - Once the Supabase environment is provisioned in subsequent infrastructure phases, the existing service layer (`getThreatIndicators`, `createThreatIndicator`, `getIocRelationships`) seamlessly connects to live PostgreSQL via `@supabase/ssr`.
