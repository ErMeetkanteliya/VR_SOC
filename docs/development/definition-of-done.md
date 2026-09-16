# VRSOC Engineering Standards — Definition of Done (DoD)

## 1. Document Overview

This document defines the mandatory **Definition of Done (DoD)** and quality gates that must be satisfied before any implementation phase, feature branch, or Pull Request in the VRSOC project can be marked as complete.

Autonomous agents and software engineers must strictly adhere to these gates. No phase can be closed with failing checks or unresolved regressions.

---

## 2. Universal Phase Completion Gate

A phase is considered **COMPLETE** if and only if all eight quality gates pass:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   VRSOC UNIVERSAL DEFINITION OF DONE                   │
├────────────────────────────────────────────────────────────────────────┤
│  [1] IMPLEMENTATION COMPLETE   │ All requested deliverables exist      │
│  [2] TYPECHECK VALIDATION      │ tsc --noEmit exits with 0 errors      │
│  [3] LINT & CODE STANDARDS     │ eslint & prettier exit with 0 errors  │
│  [4] AUTOMATED TEST SUITE      │ vitest unit/integration 100% passing  │
│  [5] BROWSER & E2E CHECK       │ playwright tests pass for UI changes  │
│  [6] SECURITY & RLS VERIFIED   │ Negative cross-tenant tests pass      │
│  [7] BASE44 UI PARITY VERIFIED │ Visual & interaction parity confirmed │
│  [8] PHASE REPORT CREATED      │ docs/phase-reports/phase-XX.md exists │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Quality Gate Specifications

### 3.1 Gate 1: Implementation Completeness
- All files, routes, components, and services specified in the phase prompt must exist and be functional.
- Zero placeholder comments (e.g. `// TODO: implement later` in active core logic).
- Strict adherence to the current phase scope; zero premature implementation of future phases.

### 3.2 Gate 2: TypeScript Type-Checking
- Strict TypeScript compilation must pass:
  ```bash
  pnpm typecheck
  ```
- Zero implicit `any`, zero suppressed type errors via `@ts-ignore` or `as any`.
- All domain entity types must import from shared packages (`@vrsoc/types`).

### 3.3 Gate 3: Linting & Code Formatting
- ESLint and Prettier must execute cleanly without warnings or errors:
  ```bash
  pnpm lint
  ```
- Code must follow project naming conventions and folder structures defined in `AGENTS.md`.

### 3.4 Gate 4: Automated Testing (Unit & Integration)
- All test suites execute and pass completely:
  ```bash
  pnpm test
  ```
- New business logic, Server Actions, and utility functions must include corresponding unit tests in Vitest.
- Test assertions must test both happy paths and edge failure cases.

### 3.5 Gate 5: Browser Verification & End-to-End (E2E)
- For user-facing UI changes, Playwright browser tests must verify:
  1. Route loads correctly without client-side console errors.
  2. All 4 UI states are functional (`LoadingState`, `EmptyState`, `ErrorState`, `SuccessState`).
  3. Interactive components (Modals, Drawers, Tabs, Dropdowns) function cleanly.
  4. Responsive layouts adapt properly across Desktop (1280px), Tablet (768px), and Mobile (375px).

### 3.6 Gate 6: Security & Row Level Security (RLS) Verification
- For database and authorization changes, negative authorization tests must explicitly prove:
  1. **Cross-Tenant Read Blocked**: User in Org A querying Org B's records receives 0 records or `403 Forbidden`.
  2. **Cross-Tenant Write Blocked**: User in Org A inserting/updating with Org B's `organization_id` is rejected by RLS.
  3. **Role Gating Enforced**: Unauthorized roles (e.g. Student executing Host Isolation or Rule Editing) receive `403 Forbidden`.
  4. **Revoked Access**: A user removed from `memberships` is blocked immediately on their next request.

### 3.7 Gate 7: Base44 Visual & UX Parity
- New or modified screens must be cross-referenced against the Base44 reference catalog in `docs/reverse-engineering/`:
  1. Dark cybersecurity color tokens (`#0A0A0A`, `#161616`, `#5B0A0A`, `#E53935`) strictly applied.
  2. Severity badges match the extracted color matrices.
  3. Spacing, alignment, card geometry, and typography hierarchy match Base44 screens.

### 3.8 Gate 8: Documentation & Phase Report
- Every phase concludes with the creation or update of:
  ```text
  docs/phase-reports/phase-XX.md
  ```
- The phase report must document:
  - Phase Objective
  - Implemented Deliverables & Files Changed
  - Database Changes & Migrations (if applicable)
  - Security & Tenant Considerations
  - Test Suite & Browser Verification Results
  - Known Issues & Unresolved Questions
  - Assumptions & Next-Phase Dependencies

---

## 4. Phase Completion Protocol

When all eight gates are verified:
1. Stage and verify clean git status.
2. Produce the formal phase report.
3. Stop execution immediately. Do NOT automatically proceed to the next phase without explicit user direction.
