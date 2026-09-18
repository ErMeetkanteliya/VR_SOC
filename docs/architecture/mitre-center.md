# Architecture Specification: MITRE ATT&CK Center & Shared Entity Layer

> **Document Status:** Authoritative Architectural Specification  
> **Phase:** Phase 19 — MITRE ATT&CK Center  
> **Module:** `@vrsoc/web/lib/mitre` & `@vrsoc/types`  
> **Classification:** Defensive Cyber Operations Intelligence Layer  
> **Date:** September 2026  

---

## 1. Architectural Philosophy & Objective

The **MITRE ATT&CK Center** in VRSOC functions as the authoritative, shared threat intelligence entity layer across the entire cybersecurity platform. 

### Core Architectural Invariant
> **Golden Principle:** MITRE ATT&CK data is **never** duplicated across isolated silos. Detection rules, alerts, EDR telemetry, SIEM logs, XDR correlations, and future Incident Cases reference a single, normalized, shared MITRE ATT&CK catalog.

```text
                               ┌────────────────────────────────┐
                               │  Shared MITRE ATT&CK Catalog   │
                               │  (Tactics, Techniques, Mitig)  │
                               └───────────────┬────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
     ┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
     │  Detection Rules  │           │   Alert Manager   │           │  XDR Correlation  │
     │  (Phase 15 Engine)│           │  (Phase 16 Triage)│           │ (Phase 18 Fabric) │
     └───────────────────┘           └───────────────────┘           └───────────────────┘
```

---

## 2. Data Architecture & Relational Contracts

### 2.1 Database Schema (`supabase/migrations/20260918000011_mitre_attack.sql`)

1. **`public.mitre_tactics` (Global Shared Reference)**
   - `id UUID PRIMARY KEY`
   - `external_id VARCHAR(32) UNIQUE` (e.g. `TA0001` .. `TA0043`)
   - `name VARCHAR(128)`
   - `description TEXT`
   - `order_index INTEGER` (canonical killchain sequence: Reconnaissance $\to$ Impact)

2. **`public.mitre_techniques` (Global Shared Reference)**
   - `id UUID PRIMARY KEY`
   - `external_id VARCHAR(32) UNIQUE` (e.g. `T1059`, `T1059.001`, `T1110.001`)
   - `name VARCHAR(128)`
   - `description TEXT`
   - `tactic_external_id VARCHAR(32) REFERENCES public.mitre_tactics(external_id)`
   - `tactic_name VARCHAR(128)`
   - `is_subtechnique BOOLEAN DEFAULT FALSE`
   - `parent_technique_id VARCHAR(32) REFERENCES public.mitre_techniques(external_id)`
   - `platforms TEXT[]` (`Windows`, `Linux`, `macOS`, `Cloud`, `Network`)
   - `data_sources TEXT[]`
   - `detection_guidance TEXT`
   - `examples JSONB` (In-the-wild threat actor procedures)
   - `mitigations JSONB` (Defensive hardening codes)

3. **`public.mitre_tenant_mappings` (Tenant-Scoped)**
   - `id UUID PRIMARY KEY`
   - `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
   - `technique_external_id VARCHAR(32) NOT NULL REFERENCES public.mitre_techniques(external_id)`
   - `coverage_status VARCHAR(32)` (`covered`, `partially_covered`, `uncovered`)
   - `custom_notes TEXT`
   - `created_by UUID REFERENCES auth.users(id)`

---

## 3. Deterministic Coverage Calculation

VRSOC strictly calculates **deterministic, explainable detection coverage**:

$$\text{Coverage \%} = \text{round}\left( \frac{N_{\text{covered\_parent\_techniques}}}{N_{\text{total\_parent\_techniques}}} \times 100 \right)$$

### Rules for Coverage Assignment
1. **Direct Match:** If an active detection rule specifies `mitre_technique_id = 'T1490'`, technique `T1490` is **Covered**.
2. **Sub-Technique Propagation:** If an active detection rule specifies sub-technique `mitre_technique_id = 'T1059.001'`, both `T1059.001` (sub-technique) and `T1059` (parent technique) are marked **Covered**.
3. **Multi-Rule Aggregation:** Multiple rules covering the same technique increment `mapped_rules_count` without inflating the percentage.
4. **Visibility Gaps:** Techniques without active enabled detection rules in the active tenant environment are flagged as **Detection Gaps**.

---

## 4. Cross-Module Integration

- **Threat Detection (`/detections`):** Direct pivot from any MITRE technique drawer to rule creation or rule inspection with prefilled `mitre_technique_id`.
- **Alert Triage (`/alerts`):** Alert tags reference shared `resolveMitreMetadata()` to display canonical tactic and technique names.
- **Log Explorer (`/logs`):** Quick 1-click pivot from technique details to SIEM query matching the technique ID or relevant process event.
- **EDR & XDR (`/edr`, `/xdr`):** Direct pivots to endpoint process trees and cross-source killchains mapped to the technique.

---

## 5. Security & Multi-Tenancy

- **Row Level Security (RLS):** Global tactics and techniques are readable by all authenticated users (`global_read_mitre_tactics`). Tenant custom mappings are strictly isolated by `organization_id` matching `public.memberships`.
- **RBAC Guard:** Server actions enforce the `mitre:read` capability.
- **Input Validation:** All queries and filter parameters are validated via Zod schemas (`MitreTechniqueFilterSchema`).

---

## 6. Future Roadmap Hand-Off

- **Phase 20 (Threat Hunting & IOC Engine):** Threat hunting hypotheses will be structured directly around MITRE technique IDs, enabling analysts to hunt for un-alerted technique behaviors in raw SIEM logs.
