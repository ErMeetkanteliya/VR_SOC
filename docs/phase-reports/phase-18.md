# Phase 18 Report: XDR Correlation & Multi-Source Telemetry

> **Document Status:** Authoritative Completion Report  
> **Phase Name:** Phase 18 — XDR Correlation & Multi-Source Telemetry  
> **Target Subsystem:** Cross-Source Correlation Engine, DNS/Email/Cloud/Firewall Schemas, Multi-Domain Attack Scenarios, and XDR Investigation Workbench UI (`/xdr`)  
> **Date:** September 2026  

---

## 1. Executive Summary

Phase 18 implements the **XDR Correlation and Multi-Source Investigation Layer** for VRSOC. Building directly upon the canonical telemetry pipeline established in Phases 12–17, this phase unifies 8 distinct enterprise attack surfaces (Endpoint, Identity, Email Gateway, DNS Server, Cloud Audit, Network Flow, Perimeter Firewall, and Authentication) into deterministic, explainable correlation clusters with a unified forensic investigation workbench (`/xdr`).

### Core Achievements
1. **Normalized Multi-Source Telemetry Domain**: Added focused schema models for DNS queries (`dns_events`), Email gateway transactions (`email_events`), Cloud infrastructure operations (`cloud_events`), and Perimeter firewall traffic (`firewall_events`) without duplicating existing Process, Network Socket, or File records.
2. **Canonical Pipeline Invariant Preserved**: All multi-source telemetry strictly routes through the Phase 13 ingestion pipeline (`Validation -> Parsing -> Normalization -> Persistence`), feeding seamlessly into SIEM (Phase 14), Detection Rules (Phase 15), Alerts (Phase 16), and EDR (Phase 17).
3. **Deterministic & Explainable Correlation Engine**: Implemented `correlateMultiSourceTelemetry()` supporting 6 practical relationship types (`same_identity`, `same_asset`, `same_ip`, `same_domain`, `temporal_killchain`, `related_alert`) with bounded query windows and transparent step-by-step evidence rationales.
4. **4 Safe Educational Multi-Source Simulation Scenarios**: Implemented cross-domain simulation generators covering Spear Phishing to Egress C2, Cloud Account Takeover & S3 Exfiltration, Lateral Movement with Domain Recon, and Ransomware Precursor USB Chains.
5. **XDR Investigation Workbench UI (`/xdr`)**: Built an enterprise Base44 forensic workspace featuring summary KPI cards, an 8-surface interactive Telemetry Matrix, a searchable Correlation Cluster list, a unified Chronological Timeline with raw payload inspection, and 1-click pivots to EDR (`/edr`), SIEM (`/logs`), and Alert Center (`/alerts`).
6. **Comprehensive Quality & Test Suite**: Added 15 unit/integration tests in `apps/web/tests/unit/xdr.test.ts` and Playwright E2E tests in `apps/web/tests/e2e/xdr.spec.ts`. The full test suite passes with **211 tests across 16 test suites (100% success rate)**; TypeScript typecheck and ESLint pass with 0 errors.

---

## 2. Implemented Deliverables

### 2.1 Database & Migrations
- **File:** `supabase/migrations/20260918000010_xdr_correlation.sql`
- **Tables Created:**
  - `public.dns_events`: DNS domain queries, query types (A, AAAA, CNAME, MX, TXT, SRV), resolved IPs, response codes, and malicious indicators.
  - `public.email_events`: Email sender/recipient addresses, subjects, message IDs, attachments, SHA256 hashes, SPF/DKIM verdicts, and phishing verdicts.
  - `public.cloud_events`: Cloud provider operations (AWS, Azure, GCP), service names, API event names, caller IPs, user agents, regions, ARNs, and status.
  - `public.firewall_events`: Perimeter firewall traffic, source/destination IPs and ports, protocols, verdicts (`Allowed`, `Blocked`, `Dropped`), rule IDs/names, and threat signatures.
  - `public.xdr_correlations`: Persisted correlation clusters with correlation codes, relationship types, confidence scores, primary entity pointers, duration metrics, shared identifiers, and explanation steps.
- **Composite Indexes:**
  - `idx_dns_events_org_asset_time` on `(organization_id, asset_id, occurred_at DESC)`
  - `idx_email_events_org_identity` on `(organization_id, identity_id, occurred_at DESC)`
  - `idx_cloud_events_org_identity` on `(organization_id, identity_id, occurred_at DESC)`
  - `idx_firewall_events_org_time` on `(organization_id, occurred_at DESC)`
  - `idx_xdr_correlations_org_time` on `(organization_id, created_at DESC)`
- **RLS Policies:** Complete multi-tenant isolation enforced for SELECT, INSERT, UPDATE, and DELETE across all new tables.

### 2.2 Domain Types & Runtime Validation
- **Types (`packages/types/src/index.ts`):** `XdrTelemetrySource`, `DnsEvent`, `EmailEvent`, `CloudEvent`, `FirewallEvent`, `XdrRelationshipType`, `XdrSharedIdentifiers`, `XdrExplanationStep`, `XdrCorrelationResult`, `XdrTimelineItem`, `XdrFilterParams`, `XdrInvestigationPackage`, `XdrSimulationScenarioType`.
- **Validation (`packages/validation/src/index.ts`):** Zod schemas for all new entities, query filters, scenario triggers, and updated `PipelineIngestionSchema`.

### 2.3 Pipeline Ingestion & Normalization
- **Contracts (`apps/web/lib/telemetry/contracts.ts`):** Extended `RawTelemetryPayload` and `NormalizedTelemetryPackage` with DNS, Email, Cloud, and Firewall objects.
- **Pipeline Parser, Normalizer & Persister (`apps/web/lib/pipeline/*`):** Parsed raw inputs into normalized packages and persisted them directly into their respective PostgreSQL tables.

### 2.4 Correlation Engine & Simulation Scenarios
- **Correlation Engine (`apps/web/lib/xdr/correlation-engine.ts`):** Deterministic clustering across Identity, Asset, Target IP, Domain, Temporal Killchains, and Alerts with explainable evidence steps.
- **Simulation Scenarios (`apps/web/lib/xdr/simulation-scenarios.ts`):** 4 multi-domain scenario generators passing payloads through `processTelemetryBatch()`.
- **Investigation Service (`apps/web/lib/xdr/investigation-service.ts`):** Package aggregation, timeline compiler, and demo data fallbacks.
- **Server Actions (`apps/web/lib/xdr/actions.ts`):** Authenticated Server Actions with explicit RBAC guards (`telemetry:read`).

### 2.5 User Interface
- **Overview Cards (`apps/web/components/xdr/XdrOverviewCards.tsx`):** KPI summary cards.
- **Source Matrix (`apps/web/components/xdr/XdrSourceMatrix.tsx`):** Visual matrix and killchain flow visualizer.
- **Correlation List (`apps/web/components/xdr/XdrCorrelationList.tsx`):** Searchable cluster list with confidence score bars and relationship badges.
- **Investigation Detail (`apps/web/components/xdr/XdrInvestigationDetail.tsx`):** 5-tab forensic inspection view with 1-click pivots to EDR, SIEM, and Alert Center.
- **Simulation Modal (`apps/web/components/xdr/SimulateXdrModal.tsx`):** Interactive modal to trigger multi-source attack bursts.
- **Page Route (`apps/web/app/xdr/page.tsx`):** Dynamic Next.js App Router page.
- **Sidebar Navigation (`apps/web/lib/navigation/config.tsx`):** Added `XDR Correlation` to main navigation.

---

## 3. Verification & Quality Gates

### 3.1 Automated Tests
- **Command:** `pnpm test`
- **Result:** 16 test files passed, 211 tests passed (100% success rate).
- **Test File:** `apps/web/tests/unit/xdr.test.ts`:
  - Validated DNS, Email, Cloud, Firewall, and Correlation schemas
  - Identity cross-source clustering (Email + Auth + Endpoint)
  - Host killchain correlation (Process + DNS + Socket + Firewall)
  - External IP correlation across DNS, Sockets, Firewall, and Cloud
  - Multi-alert host clustering
  - Multi-source simulation payload generation for all 4 scenarios
  - Telemetry normalization and chronological timeline compilation

### 3.2 TypeScript Typecheck
- **Command:** `pnpm typecheck`
- **Result:** Exited with code 0 across all 5 workspace projects (`@vrsoc/config`, `@vrsoc/types`, `@vrsoc/validation`, `@vrsoc/ui`, `@vrsoc/web`).

### 3.3 Linting
- **Command:** `pnpm lint`
- **Result:** Exited with code 0. Zero warnings or errors.

### 3.4 Production Build
- **Command:** `pnpm build`
- **Result:** Next.js build succeeded with code 0, bundling `/xdr` (10.9 kB) cleanly.

---

## 4. Scope Boundaries & Deferred Work

### In Scope for Phase 18 (Completed)
- Normalized multi-source telemetry contracts (DNS, Email, Cloud, Firewall).
- Deterministic cross-source correlation engine and confidence scoring.
- Safe educational multi-domain simulation scenarios.
- Interactive Base44 XDR Investigation Workbench UI (`/xdr`).
- 1-click forensic pivots into SIEM (`/logs`), EDR (`/edr`), and Alert Center (`/alerts`).

### Explicitly Deferred to Phase 19+ (Threat Hunting & Incident Response)
- Threat Hunting query builder and IOC campaign manager.
- Incident case dossier compilation and evidence vault management.
- Automated SOAR response playbooks (IP firewall blocking, account locking).
- Machine learning or graph neural network models.

---

## 5. Next-Phase Dependencies

Phase 18 multi-source correlation clusters provide the primary evidence base for:
1. **Phase 19 (Threat Hunting & IOC Engine)**: Ad-hoc threat hunting queries across multi-source telemetry.
2. **Phase 20 (Incident & Case Management)**: Direct escalation of XDR correlation clusters into formal incident case files.
3. **Phase 21 (SOAR & Containment Playbooks)**: Automated execution of containment actions across identity, firewall, and endpoint surfaces.
