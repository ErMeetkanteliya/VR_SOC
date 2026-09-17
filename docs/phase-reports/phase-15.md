# Phase 15 Report: Detection & Correlation Rules Engine

> **Document Status:** Authoritative Completion Report  
> **Phase Name:** Phase 15 — Detection & Correlation Rules  
> **Target Subsystem:** Threat Detection Engine, Custom Rule Workbench, Rule Evaluation & MITRE Mapping  
> **Date:** September 2026  

---

## 1. Executive Summary

Phase 15 implements the first authoritative, defensive detection and correlation engine for VRSOC. The engine evaluates canonical telemetry persisted in PostgreSQL (`public.events`, `public.logs`) from Phase 13 and queried via Phase 14 SIEM layer, generating deterministic match results with step-by-step explanations and event attribution.

### Core Achievements
1. **Authoritative Condition Evaluator**: Bounded, safe evaluation of condition trees (`AND`, `OR`, `NOT`) supporting 15 comparison operators (`equals`, `not_equals`, `contains`, `starts_with`, `ends_with`, `in`, `greater_than`, bounded `regex`, etc.).
2. **Deterministic Rule Engine**: Supports `single_event`, `threshold`, `correlation` (host/identity clustering), and `sequence` detection types.
3. **Canonical Baseline Rules**: Created 7 built-in system detection rules covering the Phase 12 educational simulation scenarios.
4. **Tenant-Scoped Custom Rules**: Complete CRUD operations backed by PostgreSQL migration `20260916000007_detection_rules.sql` with multi-tenant RLS policies.
5. **Detection Rules Workspace UI (`/detections`)**: Master workbench featuring KPI metric cards, filter toolbar, visual rule editor modal, and live test/evaluation slide-out drawer with explainability logs.
6. **Robust Quality Assurance**: All 169 unit & integration tests pass with 100% success; TypeScript typechecking passes with 0 errors; ESLint passes with 0 errors.

---

## 2. Implemented Architecture & Deliverables

### 2.1 Database & Migrations
- **File:** `supabase/migrations/20260916000007_detection_rules.sql`
- **Table:** `public.detection_rules`
- **Composite Indexes:**
  - `idx_detection_rules_org_enabled` on `(organization_id, is_enabled)`
  - `idx_detection_rules_category` on `(organization_id, category)`
  - `idx_detection_rules_mitre` on `(organization_id, mitre_technique_id)`
- **RLS Policies:**
  - `tenant_read_detection_rules`: Read access to tenant rules and global baseline rules (`is_system = true`).
  - `tenant_write_detection_rules`: Insert/update/delete restricted to active tenant members.

### 2.2 Domain Types & Runtime Validation
- **Types (`packages/types/src/index.ts`):** `DetectionRuleType`, `RuleOperator`, `FieldCondition`, `LogicalConditionGroup`, `RuleCondition`, `DetectionRule`, `CreateDetectionRuleInput`, `UpdateDetectionRuleInput`, `DetectionMatchExplanation`, `DetectionExecutionResult`.
- **Validation (`packages/validation/src/index.ts`):** Strict Zod schemas with depth limit check (&le; 20 conditions per group), safe operator parsing, and camelCase / snake_case flexible input handling.

### 2.3 Detection Engine & Evaluator
- **Condition Evaluator (`apps/web/lib/detections/evaluator.ts`):** Pure functional evaluation over normalized and raw event payloads with zero `eval` or dynamic SQL.
- **System Rules (`apps/web/lib/detections/system-rules.ts`):** 7 pre-tuned defensive baseline rules.
- **Rule Engine (`apps/web/lib/detections/engine.ts`):** Authoritative execution against PostgreSQL events within time windows, threshold counting, and cluster correlation.
- **Rules Service (`apps/web/lib/detections/rules-service.ts`):** Tenant-scoped database queries and system rule immutability protection.
- **Server Actions (`apps/web/lib/detections/actions.ts`):** Authenticated Server Actions with explicit RBAC permission guards (`detections:read`, `detections:create`, `detections:update`, `detections:delete`, `detections:test`).

### 2.4 User Interface
- **Dashboard Component (`apps/web/components/detections/DetectionRulesDashboard.tsx`):**
  - KPI metric cards (Total Rules, Active, System Baselines, Custom Rules, Critical/High).
  - Search input and category, severity, and origin filter dropdowns.
  - Interactive rules table with real-time status toggles, MITRE technique tags, and action buttons.
  - Batch "Evaluate All Rules" execution with summary detection alert banner.
- **Rule Editor Modal (`apps/web/components/detections/RuleEditorModal.tsx`):**
  - Form for name, severity, category, rule type, threshold count, evaluation window, and MITRE ATT&CK mapping.
  - Dynamic visual condition row builder (`AND` / `OR` toggle, field selection, operator, target value).
- **Evaluation Drawer (`apps/web/components/detections/RuleEvaluationDrawer.tsx`):**
  - Slide-out drawer showing match state (`MATCH DETECTED` vs `NO DETECTION`), evaluation window scanned, summary, condition match explanation steps, and matched canonical telemetry records with collapsible payload inspection.
- **Next.js Page (`apps/web/app/detections/page.tsx`):** Server Component with server-side rule prefetching.

---

## 3. Verification & Quality Gates

### 3.1 Automated Testing Matrix
- **Command:** `pnpm test`
- **Result:** 13 test files, 169 tests passing (100% success rate).
- **Test File:** `apps/web/tests/unit/detections.test.ts` (18 comprehensive test cases):
  - Field condition schema validation & operator rejection
  - Logical condition group validation & recursive depth
  - Top-level and nested field extraction (`process_name`, `command_line`, dotted raw payload)
  - All 15 operator comparisons (equals, contains, in set, regex, numeric comparisons)
  - Complex nested `AND` / `OR` / `NOT` boolean logic
  - System baseline rule triggers on educational scenario telemetry
  - Single event, threshold, and correlation evaluation
  - Rules service database integration & immutability guards

### 3.2 TypeScript Typecheck
- **Command:** `pnpm typecheck`
- **Result:** Exited with code 0 across all workspace packages (`@vrsoc/config`, `@vrsoc/types`, `@vrsoc/validation`, `@vrsoc/ui`, `@vrsoc/web`).

### 3.3 Linting
- **Command:** `pnpm lint`
- **Result:** Exited with code 0. Zero ESLint errors or warnings.

### 3.4 Browser Verification
- **Route:** `http://localhost:3000/detections`
- **Verification:** Verified route authentication boundary (middleware properly redirects unauthenticated users to `/login?redirect=%2Fdetections`).

---

## 4. Known Limitations & Explicitly Deferred Phase 16 Work

### In Scope for Phase 15 (Completed)
- Deterministic detection rules, condition operator evaluation, and multi-event correlation.
- Structured detection results (`DetectionExecutionResult`) with attribution and match explanations.
- Tenant-scoped rule CRUD and baseline rule evaluation workbench.

### Explicitly Deferred to Phase 16 (Alerting & Triage Layer)
- Alert entity generation and lifecycle states (`Open`, `Acknowledged`, `In Progress`, `Closed`, `False Positive`).
- Alert assignment to SOC analysts and triage workflow queue.
- Alert deduplication and aggregation algorithms.
- Alert escalation to incident dossiers and case management.
- SOAR playbook auto-triggering on alert firing.
