# AGENTS.md — VRSOC Engineering Constitution & Agent Operating Rules

> **Project Name:** VRSOC (Enterprise SOC Training & Simulation SaaS)  
> **Tagline:** Learn • Detect • Investigate • Defend  
> **Reference Prototype:** `https://vrsoc.base44.app/`  
> **Target Technology Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (PostgreSQL, Auth, RLS, Realtime, Storage, Edge Functions) + Vitest + Playwright  
> **Document Role:** Authoritative engineering constitution and mandatory operating contract for all autonomous agents and developers.

---

## 1. Core Operating Philosophy

Every autonomous agent working on VRSOC must strictly adhere to the phased engineering protocol:

```text
READ
  ↓
INSPECT
  ↓
PLAN
  ↓
IMPLEMENT
  ↓
TEST
  ↓
BROWSER VERIFY
  ↓
SECURITY VERIFY
  ↓
DOCUMENT
  ↓
STOP
```

### Mandatory Rules
1. **Work Strictly Phase-by-Phase**: Never implement future phases ahead of schedule. Execute only the phase explicitly requested in the prompt.
2. **Read Before Modifying**: Before creating or editing code, read `VR_SOC.md`, `AGENTS.md`, previous phase reports, and the relevant specification documents under `docs/`.
3. **Inspect Existing State**: Always inspect the current repository files and commit history before proposing or making changes.
4. **No Premature Architecture**: Do NOT introduce NestJS, microservices, separate backend daemons, or unnecessary external dependencies unless an explicit architectural decision record (ADR) justifies it.
5. **No Hallucinated Behaviors**: Strictly classify all findings and decisions as `OBSERVED`, `INFERRED`, `TARGET`, or `UNKNOWN`. Never represent an inference as an observed fact.

---

## 2. Technology Stack & Architectural Guardrails

### 2.1 Frontend Framework
- **Framework**: Next.js (App Router, React Server Components where beneficial, Client Components only when client interactivity is strictly required).
- **Language**: TypeScript (`strict: true`, zero implicit `any`).
- **Styling**: Tailwind CSS with custom VRSOC design system tokens. Vanilla CSS/Tailwind utilities only; no external heavy UI component kits (e.g. Mantine, MUI) that violate Base44 visual parity.
- **Icons**: Lucide React.
- **State Management**: React state, Server Actions, URL search params; Redux Toolkit / RTK Query used only where complex shared client state across widgets is strictly justified.
- **Validation**: Zod for all schema definitions, form validations, and API contracts.

### 2.2 Backend & Data Platform
- **Database & Services**: Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security, Supabase Realtime, Supabase Storage, Edge Functions).
- **Default Architecture**: Single deployable Next.js frontend communicating directly with Supabase via `@supabase/ssr` / `@supabase/supabase-js`.
- **Backend Service Prohibition**: Do NOT introduce NestJS, Express, or standalone backend microservices as default components. Edge Functions handle secure server-side background orchestration.

### 2.3 Testing Stack
- **Unit & Integration**: Vitest + React Testing Library.
- **End-to-End & Visual**: Playwright.
- **Database / Security**: Supabase pgTAP / PostgreSQL RLS integration test suites.

---

## 3. Security & Multi-Tenancy Invariants

### 3.1 Tenant Isolation
1. **Database-Enforced Multi-Tenancy**: Every tenant-owned table in PostgreSQL MUST contain an `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.
2. **Row Level Security (RLS) is Mandatory**: RLS must be enabled on every public table. Policies MUST verify tenant membership in `public.memberships`.
3. **Authorization Boundary Invariant**:
   > **CRITICAL RULE**: `app_metadata` in JWT tokens provides convenient client-side context, but it is **NEVER** the sole source of truth for authorization. All authorization decisions MUST be validated by PostgreSQL RLS and server-side authorization guards (Server Actions / Edge Functions).
4. **Zero Cross-Tenant Leakage**: Automated negative tests must verify that an authenticated member of Organization A cannot read, insert, update, or delete Organization B's data under any condition.
5. **Frontend Filtering is NOT Security**: Hiding a button or filtering an array in the browser is a UX concern only; the database and API must enforce access controls independently.

### 3.2 Role-Based Access Control (RBAC)
The platform enforces 8 distinct enterprise roles within each organization:
- `Super Admin`, `Instructor`, `Student`, `SOC Analyst`, `Incident Responder`, `Threat Hunter`, `Auditor`, `Viewer`.
- Role capabilities are strictly evaluated server-side.

### 3.3 Defensive & Educational Boundary
> **ABSOLUTE RULE**: VRSOC is strictly a defensive cybersecurity training and simulation platform.
> It must **NEVER** contain:
> - Offensive hacking tools or exploit compilers
> - Live malware generation or payload delivery
> - Phishing kit generation or credential harvesting
> - Automated external attack infrastructure
>
> All adversarial behaviors and malware samples must remain simulated, synthetic, and safe.

---

## 4. Base44 Visual & UX Parity Invariant

The Base44 application (`https://vrsoc.base44.app/`) is the **visual and interaction source of truth**.

### Replicating the Product Experience
1. **Design Tokens**:
   - Background Base: `#0A0A0A` (Near Black)
   - Primary Accent: `#5B0A0A` (Deep Blood Burgundy) / `#B71C1C`
   - Bright Action Accent: `#E53935` (`rgb(229, 57, 53)`)
   - Card Glassmorphism: `#161616` with `border: 1px solid rgba(255, 255, 255, 0.05)` to `0.1`
   - Text Hierarchy: Primary `#FFFFFF`, Secondary `rgba(255, 255, 255, 0.6)`, Muted `rgba(255, 255, 255, 0.3)`
2. **Severity Badges**:
   - `Critical`: `bg-red-500/15 text-red-400 border-red-500/30`
   - `High`: `bg-orange-500/15 text-orange-400 border-orange-500/30`
   - `Medium`: `bg-amber-500/15 text-amber-400 border-amber-500/30`
   - `Low`: `bg-blue-500/15 text-blue-400 border-blue-500/30`
3. **Layout Relationships**: Preserve the 240px collapsible sidebar, topbar with breadcrumbs & user profile, KPI stat grids, data tables with row drawers, Kanban boards, and terminal-style consoles.
4. **Zero Arbitrary Redesigns**: Do NOT redesign the application layout or invent unrelated color palettes for convenience. Replicate the observable Base44 UI faithfully.

---

## 5. Golden Product Principle: Canonical Shared Telemetry Pipeline

The Simulation Lab and Training modules must **NEVER** use disconnected fake data generators or localized client-side timers.

All simulation scenarios must flow through the canonical shared pipeline:

```text
Simulation Scenario
      ↓
Synthetic Telemetry Stream (Syslog, Windows Event Logs, NetFlow, EDR)
      ↓
Event / Log Ingestion & Normalization (public.events)
      ↓
Stream Correlation & Detection Rule Evaluation (Sigma Rules)
      ↓
Alert Generation (Mapped to MITRE ATT&CK)
      ↓
Incident Declaration & Case Dossier
      ↓
SOAR Playbook Execution (Auto / Human Approval)
      ↓
Analytics, Reports & Grounded AI Explanation
```

---

## 6. Coding & Implementation Standards

### 6.1 TypeScript Standards
- Enable strict type-checking (`"strict": true`, `"noImplicitAny": true`).
- Export shared domain types from `@vrsoc/types` or `packages/types`.
- Never use `as any` or `@ts-ignore` to suppress type errors.

### 6.2 Validation & Error Handling
- Validate all user inputs, Server Action payloads, and API parameters with Zod schemas.
- Standardize all API error responses:
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED_TENANT_ACCESS",
      "message": "User does not hold membership in the requested organization.",
      "details": {}
    }
  }
  ```
- Use React Error Boundaries on every major route segment and feature module.

### 6.3 UI States
Every user-facing data component must explicitly implement:
- `LoadingState` (Skeleton shimmer loaders)
- `EmptyState` (Contextual descriptive placeholder with action button)
- `ErrorState` (Alert banner with retry button)
- `SuccessState` (Toast / inline confirmation)

### 6.4 Logging & Auditability
- Log all administrative and security mutations to `public.audit_events`.
- Enforce append-only integrity on audit logs (prohibit `UPDATE` and `DELETE`).

---

## 7. Definition of Done (DoD) Gate

Before any implementation phase can be marked complete:
1. **Implementation Complete**: All phase deliverables created and functional.
2. **Typecheck Passes**: `pnpm typecheck` or `tsc --noEmit` exits with 0 errors.
3. **Lint Passes**: `pnpm lint` exits with 0 errors.
4. **Automated Tests Pass**: `pnpm test` (unit/integration) passes with 100% success.
5. **Browser Verification**: Relevant UI flows verified in the browser.
6. **Security & RLS Verified**: Multi-tenant isolation verified with negative test cases.
7. **Phase Report Created**: `docs/phase-reports/phase-XX.md` created with required sections.
8. **No Future Phase Pollution**: Stop execution; do not begin subsequent phases.
