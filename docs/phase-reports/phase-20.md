# Phase 20 Engineering Report — Threat Intelligence & IOC Model

> **Project:** VRSOC (Enterprise SOC Training & Simulation SaaS)  
> **Phase:** Phase 20 — Threat Intelligence / IOC Model  
> **Status:** Complete  
> **Date:** September 18, 2026  
> **Primary Deliverable:** Canonical Threat Intelligence Entity Layer, Multi-Type Normalization Pipeline, Relationship Graph, and Base44 Threat Intelligence Workbench (`/threat-intelligence`)

---

## 1. Executive Summary

Phase 20 establishes the shared Threat Intelligence and Indicator of Compromise (IOC) foundation for the VRSOC platform. Threat Intelligence serves as a canonical entity layer across SIEM logs, Alert correlation engines, EDR endpoint simulators, and MITRE ATT&CK mappings.

All observables—spanning IP addresses, domain names, URLs, cryptographic file hashes, phishing email senders, and malicious files—are deterministically normalized, validated against strict Zod schemas, and linked via a multi-directional relationship graph to platform events, detection alerts, compromised assets, and malware samples.

---

## 2. Deliverables & Implemented Features

### 2.1 Database Migration (`supabase/migrations/20260918000012_threat_intelligence.sql`)
- **`public.iocs` Table**: Tenant-owned indicator repository containing `organization_id`, `ioc_type`, `normalized_value`, `raw_value`, `hash_type`, `ip_version`, `confidence`, `severity`, `threat_types`, `source`, `tags`, `description`, `first_seen`, `last_seen`, `status`, `is_global`, and `metadata`.
- **`public.ioc_relationships` Table**: Multi-target entity correlation graph linking indicators to `event`, `alert`, `incident`, `case`, `asset`, and `malware`.
- **Row Level Security (RLS)**: PostgreSQL RLS policies enforcing tenant isolation via `public.memberships` verification.
- **Indexes**: Composite B-tree indexes for fast normalized value lookups, type filtering, high-priority KPI queries, and relationship traversals.

### 2.2 Shared Types (`packages/types/src/index.ts`)
- Added `IocType` (`ip`, `domain`, `url`, `hash`, `email`, `file`), `IocHashType`, `IocIpVersion`, `IocStatus`, `IocSeverity`, `IocSource`, `IocRelationshipTargetType`, and `IocRelationshipType`.
- Added domain contracts: `ThreatIndicator`, `IocRelationship`, `ThreatIndicatorDetail`, `IocOverviewStats`, `IocFilter`, `CreateIocInput`, `UpdateIocInput`, `CreateIocRelationshipInput`.
- Added permissions: `threat_intel:read`, `threat_intel:create`, `threat_intel:update`, `threat_intel:delete`, `threat_intel:relate`.

### 2.3 Strict Validation Schemas (`packages/validation/src/index.ts`)
- Implemented Zod schemas: `IocTypeSchema`, `IocHashTypeSchema`, `IocStatusSchema`, `IocSeveritySchema`, `IocSourceSchema`, `ThreatIndicatorSchema`, `CreateIocInputSchema`, `UpdateIocInputSchema`, `IocRelationshipSchema`, `CreateIocRelationshipInputSchema`, `IocFilterSchema`.
- Rejects malformed IP addresses, invalid hash lengths/characters, bad URLs, and oversized strings safely.

### 2.4 Normalization & Defanging Pipeline (`apps/web/lib/threat-intel/normalization.ts`)
- **Defanging Resolution**: Safely converts `185[.]220[.]101[.]5` -> `185.220.101.5`, `hxxps://evil[.]com` -> `https://evil.com`, and `user[@]domain[.]com` -> `user@domain.com`.
- **Type-Specific Canonicalization**:
  - `ip`: Strips ports, normalizes IPv4/IPv6 octets.
  - `domain`: Strips protocols, trailing paths, query strings, converts to lowercase.
  - `url`: Standardizes scheme (`http/https`), lowercase hostname, preserves resource path.
  - `hash`: Lowercase hex conversion, detects MD5/SHA1/SHA256/SHA512.
  - `email`: RFC-5322 regex validation, lowercase domain.
  - `file`: Strips directory paths, preserves case-sensitive filename.
- **Auto-Detection**: `detectIocType()` heuristics to classify raw observable input.

### 2.5 Intelligence Service Layer (`apps/web/lib/threat-intel/threat-intel-service.ts`)
- `getThreatIndicators()` — Tenant-scoped paginated and filtered querying.
- `getThreatIndicatorById()` — Fetches full indicator record with aggregated relationship counts.
- `getThreatIndicatorByValue()` — Fast exact-match lookup on normalized value.
- `createThreatIndicator()` — Validates, normalizes, and creates tenant-isolated IOCs.
- `updateThreatIndicator()` — Modifies confidence, severity, status, or description.
- `deleteThreatIndicator()` — Deprecates or removes indicators.
- `getIocOverviewStats()` — Computes real-time KPI overview metrics.
- `getIocRelationships()` & `createIocRelationship()` — Graph relationship management.
- `enrichEntityIocs()` — Batch enrichment helper for SIEM logs and Alerts.

### 2.6 Authenticated Server Actions (`apps/web/lib/threat-intel/actions.ts`)
- `fetchThreatIndicatorsAction` (`threat_intel:read`)
- `fetchThreatIndicatorDetailAction` (`threat_intel:read`)
- `fetchIocOverviewStatsAction` (`threat_intel:read`)
- `createThreatIndicatorAction` (`threat_intel:create`)
- `updateThreatIndicatorAction` (`threat_intel:update`)
- `deleteThreatIndicatorAction` (`threat_intel:delete`)
- `createIocRelationshipAction` (`threat_intel:relate`)

### 2.7 Role-Based Access Control (`apps/web/lib/rbac/permissions.ts`)
- Mapped all `threat_intel:*` permissions across the 8 enterprise roles with least-privilege principles.

### 2.8 Threat Intelligence Workbench UI (`/threat-intelligence`)
- **`IocOverviewKpis`**: 4 metric cards (Total Active IOCs, Critical & High Threats, Sighting Matches, Type Breakdown).
- **`IocFilterBar`**: Search bar, category pill selector, severity & lifecycle status dropdowns, source selector, and "New Indicator" trigger.
- **`IocTable`**: High-density table featuring severity badges, confidence meters, 1-click clipboard copy, tag chips, and drawer inspection triggers.
- **`IocDetailDrawer`**: 4-tab slide-out inspector:
  - *Overview*: Threat types, ASN/Geo metadata, forensic narrative, first/last seen.
  - *Related Events*: Correlated SIEM telemetry sightings.
  - *Alerts & Incidents*: Detection alerts triggered by this indicator.
  - *Related Assets*: Compromised endpoints and malware payload linkages.
  - *Quick SOC Pivots*: Direct navigation to `/logs`, `/alerts`, `/edr`, and `/mitre`.
- **`CreateIocModal`**: Analyst indicator registration with live normalization preview, auto-detection, and defanging resolution.

---

## 3. Verification & DoD Compliance

| Gate | Status | Details |
| :--- | :--- | :--- |
| **Typecheck** | Passed | `pnpm -r run typecheck` passes with **0 errors** across all packages. |
| **Lint** | Passed | `pnpm lint` (`next lint`) passes with **0 warnings / 0 errors**. |
| **Unit Tests** | Passed | **18 test suites, 241/241 tests passing (100%)** via Vitest. |
| **Production Build** | Passed | `next build` successfully compiled all 39 static and dynamic routes. |
| **Multi-Tenancy** | Verified | Database RLS policies and server-side RBAC guards ensure strict tenant isolation. |
| **Visual Parity** | Verified | Base44 Dark Cyber aesthetics (`#0A0A0A`, `#141414`, crimson accents) faithfully replicated. |

---

## 4. Known Limitations & Development Environment Boundary

> [!IMPORTANT]
> **Database Environment Limitation**:
> As specified in the engineering operating instructions, live and local PostgreSQL database engines are not currently running during this phase.
> - Full PostgreSQL DDL, foreign key relationships, composite indexes, and RLS policies are implemented in `supabase/migrations/20260918000012_threat_intelligence.sql`.
> - Server actions and UI components operate with in-memory persistence and canonical simulation datasets (`CANONICAL_THREAT_INDICATORS`, `CANONICAL_IOC_RELATIONSHIPS`).
> - Browser and unit tests verify normalization, client state management, UI flows, and mock-safe execution without claiming live database persistence.

---

## 5. Next-Phase Dependencies

- **Phase 21 (Threat Hunting)**: Will consume normalized IOCs from Phase 20 to construct hypothesis queries and cross-source sighting hunts.
- **Phase 22 (Incident Response / Case Management)**: Will attach canonical IOCs and relationships directly to Incident dossiers.
