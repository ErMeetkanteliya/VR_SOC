# VRSOC Architecture Constitution — Architectural Decision Records (ADRs)

## 1. Document Overview

This document records the foundational architectural decisions governing the VRSOC SaaS platform. Each record defines the decision, context, rationale, evaluated alternatives, tradeoffs, and current status.

---

## ADR-001: Next.js (App Router) for the Primary Frontend

- **Status**: **ACCEPTED**
- **Decision**: Build the VRSOC frontend using Next.js with App Router, TypeScript, React Server Components (RSC), and Tailwind CSS.
- **Reason**: Next.js App Router provides optimal server-side rendering (SSR), streaming UI boundaries, built-in Server Actions for mutations, secure cookie-based session handling, and direct alignment with the React ecosystem.
- **Alternatives Considered**:
  - *Vite SPA*: Fast client development, but lacks native SSR, SEO optimization, and secure server-side action boundaries.
  - *Remix*: Strong full-stack model, but smaller ecosystem and tooling integration compared to Next.js + Vercel/Supabase.
- **Tradeoffs**: Requires clear mental separation between Server Components and Client Components (`"use client"`).

---

## ADR-002: Supabase as the Primary Backend & Data Platform

- **Status**: **ACCEPTED**
- **Decision**: Adopt Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security, Realtime, Storage, and Edge Functions) as the canonical production backend.
- **Reason**: VRSOC has deeply relational data models (Organizations -> Assets -> Logs -> Detections -> Alerts -> Incidents -> Cases). PostgreSQL offers rock-solid ACID transactions, GIN indexing for log queries, declarative partitioning, and database-level security via Row Level Security (RLS).
- **Alternatives Considered**:
  - *MongoDB / Document DB*: Flexible schema, but poor relational integrity, complex multi-tenant isolation, and lacks native RLS.
  - *Custom Node/Express backend with raw Postgres*: Requires reinventing auth, session management, realtime subscriptions, and storage infrastructure.
- **Tradeoffs**: Developers must learn PostgreSQL RLS policy authoring and PostgREST idioms.

---

## ADR-003: No Default NestJS or Standalone Backend Microservices

- **Status**: **ACCEPTED**
- **Decision**: Prohibit the introduction of NestJS or standalone backend microservices as default project components. All business logic, telemetry simulation, and integrations run within Next.js Server Actions and Supabase Edge Functions.
- **Reason**: Introducing a separate backend framework creates unnecessary infrastructure overhead, duplicate type definitions, complex CI/CD pipelines, and network hops without measurable technical need for the initial production SaaS.
- **Alternatives Considered**:
  - *NestJS Backend API*: Powerful enterprise structure, but introduces dual-server deployment complexity and redundant authentication middleware.
- **Tradeoffs**: If future sustained high-throughput telemetry ingestion exceeds serverless execution limits, a dedicated ingestion worker can be introduced via an explicit future ADR.

---

## ADR-004: Multi-Tenancy Enforced via PostgreSQL Row Level Security (RLS)

- **Status**: **ACCEPTED**
- **Decision**: Enforce multi-tenant data isolation at the PostgreSQL database layer using `organization_id` foreign keys and Row Level Security (RLS) policies evaluated against active membership records.
- **Reason**: Security must be enforced at the lowest possible layer. Frontend filtering or application-layer `WHERE` clauses are vulnerable to developer oversight. RLS guarantees that queries cannot leak cross-tenant data.
- **Alternatives Considered**:
  - *Database-per-tenant*: Maximum isolation, but prohibitive operational cost, schema migration complexity, and poor resource utilization for an educational SaaS.
  - *Schema-per-tenant*: Complex connection pooling and migration orchestration.
- **Tradeoffs**: Requires careful indexing on `organization_id` and rigorous test coverage of RLS policies.

---

## ADR-005: Authorization Boundary Invariant (Database RLS & Server Actions)

- **Status**: **ACCEPTED**
- **Decision**: `app_metadata` in JWT tokens provides client-side context for UI rendering, but the **authoritative security boundary** is PostgreSQL RLS and server-side authorization guards querying `public.memberships`.
- **Reason**: Relying solely on JWT claims creates security vulnerabilities if a user's membership is revoked or role is downgraded while their token remains active. Validating against live database memberships ensures instantaneous access revocation.
- **Alternatives Considered**:
  - *Pure JWT Claim Authorization*: Fast, but cannot handle instant permission revocations without token blacklisting.
- **Tradeoffs**: Small query overhead during Server Action execution to check membership status, mitigated by PostgreSQL indexing.

---

## ADR-006: Canonical Shared Telemetry & Simulation Pipeline

- **Status**: **ACCEPTED**
- **Decision**: Unify all simulation labs and training scenarios into a single canonical pipeline: `Scenario -> Telemetry -> Normalization -> Detection Rules -> Alerts -> Incidents -> Cases -> Reports -> AI Grounding`. Prohibit disconnected fake data generators.
- **Reason**: The core differentiator of VRSOC is that students and analysts interact with real SOC operational tools backed by the same telemetry pipeline that generates alerts. Fake UI animations degrade educational authenticity.
- **Alternatives Considered**:
  - *Screen-specific mock data generators*: Easier to build initially, but creates an unmaintainable, fragmented product that fails to simulate real SOC investigations.
- **Tradeoffs**: Requires building a robust synthetic telemetry generation and ingestion engine.

---

## ADR-007: Exact Base44 UI/UX Visual & Interaction Parity

- **Status**: **ACCEPTED**
- **Decision**: Treat the Base44 prototype (`https://vrsoc.base44.app/`) as the visual and interaction source of truth. Replicate its dark cybersecurity aesthetic (`#0A0A0A`, `#161616`, `#5B0A0A`, `#E53935`), typography, card layouts, tables, and 32 route hierarchies.
- **Reason**: The client and stakeholders have approved the Base44 product experience. Rebuilding requires engineering a new production backend while keeping the user interface familiar, premium, and consistent.
- **Alternatives Considered**:
  - *Redesigning with a generic UI library*: Faster development, but destroys the established product identity and user familiarity.
- **Tradeoffs**: Requires careful CSS token extraction and custom component craftsmanship.

---

## ADR-008: Strict Defensive & Educational Guardrails (Zero Offensive Tooling)

- **Status**: **ACCEPTED**
- **Decision**: Strictly prohibit the creation of offensive hacking tools, exploit compilers, live malware generators, credential harvesters, or external automated attack infrastructure.
- **Reason**: VRSOC is an educational cyber defense platform. Introducing offensive capabilities introduces severe legal, ethical, and security risks. All adversarial scenarios must remain safe and synthetic.
- **Alternatives Considered**: None.
- **Tradeoffs**: None. Defensive focus is non-negotiable.

---

## ADR-009: Grounded RAG Architecture for AI Security Assistant

- **Status**: **ACCEPTED**
- **Decision**: Architect the AI Security Assistant (`/ai-assistant`) as a context-grounded retrieval-augmented generation (RAG) service consuming active alert metadata, triggering logs, asset profiles, and MITRE guidance.
- **Reason**: Generic chatbots provide hallucinated advice. Grounding the AI on structured tenant SOC telemetry ensures that explanations, investigation queries, and containment advice are accurate, actionable, and educational.
- **Alternatives Considered**:
  - *Direct ungrounded LLM prompt*: Simple, but provides generic responses disconnected from active SOC alerts.
- **Tradeoffs**: Requires server-side context assembly and token budget management.
