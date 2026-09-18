# Phase 17 Report: EDR Simulation & Endpoint Investigation

> **Document Status:** Authoritative Completion Report  
> **Phase Name:** Phase 17 — EDR Simulation & Endpoint Investigation  
> **Target Subsystem:** Endpoint Telemetry Extension, Hierarchical Process Tree Engine, Educational EDR Scenarios, and Forensic Workbench UI  
> **Date:** September 2026  

---

## 1. Executive Summary

Phase 17 implements the core **Endpoint Detection & Response (EDR) Simulation and Investigation Layer** for VRSOC. Expanding upon the canonical telemetry pipeline established in Phases 12–16, this phase introduces normalized endpoint telemetry contracts, safe educational simulation scenarios, hierarchical process execution reconstruction with heuristic suspicion tagging, and an enterprise Base44-inspired analyst investigation workbench (`/edr`).

### Core Achievements
1. **Normalized Endpoint Telemetry Domain**: Extended telemetry models to support registry events, service modifications, scheduled tasks, startup autoruns, and USB removable storage events without duplicating existing process, file, or network schemas.
2. **Canonical Pipeline Integration**: All simulated endpoint telemetry flows strictly through the Phase 13 ingestion and normalization pipeline (`Validation -> Parsing -> Normalization -> Persistence`), feeding directly into SIEM queries (Phase 14) and detection engine evaluations (Phase 15).
3. **Hierarchical Process Tree Engine**: Implemented `buildProcessTree()` algorithm capable of reconstructing complex parent-child process execution graphs with cycle protection, PID/PPID index lookup, and heuristic suspicion tagging (e.g. `%TEMP%` path execution, encoded PowerShell commands, and anomalous parent relationships).
4. **9 Safe Educational Simulation Scenarios**: Created educational simulation presets covering process masquerading, registry Run key persistence, double-extension file drops, C2 beaconing, unauthorized service installation, scheduled task triggers, startup folder hijack, unauthorized USB insertion, and multi-stage attack chains.
5. **EDR Investigation Workbench UI (`/edr`)**: Interactive enterprise forensic dashboard featuring endpoint fleet selector, real-time KPI metrics, interactive collapsible process tree, 8 forensic activity tabs (Processes, Files, Network Sockets, Registry Changes, Services & Tasks, Startup & USB, Chronological Timeline, and Related Alerts), and 1-click pivots into SIEM and Alert Center.
6. **Comprehensive Quality & Test Suite**: Added 14 unit/integration tests in `apps/web/tests/unit/edr.test.ts` and E2E specifications in `apps/web/tests/e2e/edr.spec.ts`. The full test suite passes with **196 tests across 15 test suites (100% success rate)**; TypeScript typecheck and ESLint pass with 0 errors.

---

## 2. Implemented Deliverables

### 2.1 Database & Migrations
- **File:** `supabase/migrations/20260916000009_edr_telemetry.sql`
- **Tables Created:**
  - `public.registry_events`: Windows registry hives, key paths, value names/data, actions (`CreateKey`, `SetValue`, `DeleteValue`), and parent process IDs.
  - `public.endpoint_services`: System services, display names, binary paths, start types, and service lifecycle actions.
  - `public.scheduled_task_events`: Task Scheduler events, task names, action commands, trigger schedules, and user contexts.
  - `public.startup_items`: Autorun registry keys, startup folder items, commands, and active states.
  - `public.usb_events`: Removable media insertions, vendor/product IDs, serial numbers, device names, mount points, and timestamps.
- **Composite Indexes:**
  - `idx_registry_events_org_asset_time` on `(organization_id, asset_id, occurred_at DESC)`
  - `idx_endpoint_services_org_asset_time` on `(organization_id, asset_id, occurred_at DESC)`
  - `idx_scheduled_tasks_org_asset_time` on `(organization_id, asset_id, occurred_at DESC)`
  - `idx_startup_items_org_asset_time` on `(organization_id, asset_id, occurred_at DESC)`
  - `idx_usb_events_org_asset_time` on `(organization_id, asset_id, occurred_at DESC)`
- **RLS Policies:** Complete multi-tenant isolation enforced for SELECT, INSERT, UPDATE, and DELETE across all new tables.

### 2.2 Domain Types & Runtime Validation
- **Types (`packages/types/src/index.ts`):** `RegistryEvent`, `EndpointServiceEvent`, `ScheduledTaskEvent`, `StartupItem`, `UsbDeviceEvent`, `EdrProcessTreeNode`, `EndpointTimelineItem`, `EndpointInvestigationPackage`, `EdrFilterParams`, `EdrSimulationScenarioType`.
- **Validation (`packages/validation/src/index.ts`):** Zod schemas for all EDR entities, `SimulateEdrScenarioSchema`, `GetProcessTreeSchema`, `GetEndpointInvestigationSchema`, `EdrFilterParamsSchema`, and extended `PipelineIngestionSchema`.

### 2.3 Pipeline Ingestion & Normalization
- **Contracts (`apps/web/lib/telemetry/contracts.ts`):** Extended `RawTelemetryPayload` and `NormalizedTelemetryPackage` with EDR domains.
- **Pipeline Parser & Normalizer (`apps/web/lib/pipeline/parse.ts`, `normalize.ts`):** Normalized raw telemetry inputs with standardized timestamps (`occurred_at` vs `created_at`).
- **Persistence Layer (`apps/web/lib/pipeline/persist.ts`):** Batch upserts telemetry into respective domain tables in Supabase.

### 2.4 EDR Engine & Backend Services
- **Process Tree Engine (`apps/web/lib/edr/process-tree.ts`):** Parent-child linking, cycle prevention, integrity level tracking, and defensive heuristic suspicion rules.
- **Simulation Scenarios (`apps/web/lib/edr/simulation-scenarios.ts`):** 9 educational scenario generators routing payloads through `processTelemetryBatch()`.
- **Investigation Service (`apps/web/lib/edr/investigation-service.ts`):** Deep endpoint data aggregation, timeline compilation, and demo dataset fallbacks.
- **Server Actions (`apps/web/lib/edr/actions.ts`):** Authenticated Server Actions with explicit RBAC guards (`telemetry:read`, `agents:read`).

### 2.5 User Interface
- **Master Workbench (`apps/web/components/edr/EdrInvestigationWorkbench.tsx`):** Host selector, sensor health indicators, and KPI summary metric cards.
- **Process Tree View (`apps/web/components/edr/ProcessTreeView.tsx`):** Collapsible hierarchical tree, PID/PPID badges, SHA256 copy helpers, search filter, and detection tags.
- **Activity Tabs (`apps/web/components/edr/EndpointActivityTabs.tsx`):** 8 multi-domain forensic tabs with detailed process inspector side drawer.
- **Simulation Modal (`apps/web/components/edr/SimulateEdrModal.tsx`):** Interactive modal to trigger safe educational telemetry bursts on the selected endpoint.
- **Next.js Route (`apps/web/app/edr/page.tsx`):** Dynamic Server Component prefetching endpoints and initial investigation packages.
- **Sidebar Navigation (`apps/web/lib/navigation/config.tsx`):** Added `EDR Investigation` under the Investigation section.

---

## 3. Verification & Quality Gates

### 3.1 Automated Unit & Integration Tests
- **Command:** `pnpm test`
- **Result:** 15 test suites, 196 tests passed (100% success).
- **Test File:** `apps/web/tests/unit/edr.test.ts`:
  - EDR schema validations (registry, services, scheduled tasks, startup items, USB events)
  - Process tree construction with parent-child nesting and root node identification
  - Cycle protection and circular reference breaking
  - Suspicion heuristic tagging for masquerading and suspicious paths
  - Safe simulation payload generation for all 9 scenarios
  - Multi-domain chronological timeline compilation and sorting
  - Ingestion pipeline parsing and normalization verification

### 3.2 TypeScript Typecheck
- **Command:** `pnpm typecheck`
- **Result:** Exited with code 0 across all 5 workspace projects (`@vrsoc/config`, `@vrsoc/types`, `@vrsoc/validation`, `@vrsoc/ui`, `@vrsoc/web`).

### 3.3 Linting
- **Command:** `pnpm lint`
- **Result:** Exited with code 0. Zero warnings or errors.

### 3.4 E2E Test Suite
- **File:** `apps/web/tests/e2e/edr.spec.ts`
- **Covered Flows:** Unauthenticated redirect, workbench header & KPI rendering, process tree search & inspection, forensic tab switching, simulation modal workflows.

---

## 4. Scope Boundaries & Deferred Work

### In Scope for Phase 17 (Completed)
- EDR telemetry schema extensions and normalization.
- Reconstructed hierarchical process execution trees with suspicion heuristics.
- Safe, defensive, and educational simulation scenario generators.
- Unified endpoint investigation workbench with 8 forensic tabs.
- 1-click pivots to SIEM (`/logs`) and Alert Center (`/alerts`).

### Explicitly Deferred to Phase 18+ (XDR & Response)
- Multi-domain XDR correlation (cross-linking endpoint telemetry with cloud, identity, and firewall logs).
- Threat hunting query builder & IOC match engine.
- Automated endpoint containment / agent network isolation execution.
- Incident case dossier compilation.
- SOAR automated playbook orchestration.

---

## 5. Next-Phase Dependencies

Phase 17 endpoint telemetry and investigation entities form the foundational forensic evidence layer for:
1. **Phase 18 (XDR Correlation)**: Correlating endpoint process trees with network perimeter and cloud identity telemetry.
2. **Phase 19 (Incident & Case Management)**: Direct escalation of suspicious process trees and endpoint artifacts into incident dossiers.
3. **Phase 20 (SOAR & Response Orchestration)**: Executing simulated containment playbooks against compromised endpoints.
