# VRSOC Product Specification — Non-Functional Requirements

## 1. Document Overview

This document specifies the non-functional requirements (NFRs) for the VRSOC multi-tenant SaaS platform. It establishes the architectural constraints, security controls, performance targets, observability standards, and data integrity guarantees required for enterprise deployment.

> **Requirement Constraint**: In accordance with `VR_SOC.md`, numerical SLAs or thresholds that have not been finalized during initial architecture are explicitly labeled as **[TBD — Phase 41 / Benchmark]** rather than fabricated.

---

## 2. Security & Compliance

### 2.1 Multi-Tenant Isolation
- **Tenant Partitioning**: Strict logical separation of all customer data enforced by PostgreSQL Row Level Security (RLS) on every tenant-owned table.
- **Cross-Tenant Prevention**: Zero cross-tenant data leakage across all REST API endpoints, Server Actions, GraphQL/RPC queries, Supabase Realtime channels, and Supabase Storage buckets.
- **Cryptographic Tenant Context**: Active `organization_id` bound to cryptographically signed JWT `app_metadata` and validated server-side on every request.

### 2.2 Authentication & Session Security
- **Credential Storage**: Managed entirely by Supabase Auth (bcrypt/argon2 hashing, zero raw password storage in application tables).
- **Session Transmission**: Secure HTTP-only, `SameSite=Lax`, `Secure` (HTTPS-enforced) session cookies for web clients.
- **MFA Support**: Time-based One-Time Password (TOTP) algorithm support for two-factor authentication.
- **Brute Force Protection**: Rate-limiting and automated account lockout after 5 consecutive failed login attempts within 15 minutes.

### 2.3 Network & Transport Security
- **Encryption in Transit**: TLS 1.3 enforced across all public endpoints and API gateways; HTTP automatically upgraded to HTTPS.
- **Encryption at Rest**: AES-256 encryption across PostgreSQL database volumes, backup snapshots, and Supabase Storage objects.
- **Content Security Policy (CSP)**: Strict headers mitigating Cross-Site Scripting (XSS), Clickjacking (`X-Frame-Options: DENY`), and MIME-type sniffing (`X-Content-Type-Options: nosniff`).

### 2.4 Defensive Architecture Guardrail
- **Prohibited Capabilities**: The platform must strictly reject the inclusion of offensive exploit compilers, live malware generators, credential harvesting modules, or external automated attack infrastructure.

---

## 3. Realtime Behavior & Data Streaming

### 3.1 Live Telemetry & Event Streaming
- **Subscription Model**: Supabase Realtime (WebSocket / PostgreSQL CDC) for live alert counters, agent fleet status updates, and SOAR execution logs.
- **Channel Authorization**: Realtime channels must enforce tenant authorization policies before broadcasting database mutation events.
- **Streaming Latency**: Telemetry events dispatched from simulation scenarios must stream to the active live console (`/soar/live`) with perceptible real-time progression ([TBD: < 500ms target in Phase 41]).

---

## 4. Performance & Responsiveness

### 4.1 UI Responsiveness & Core Web Vitals
- **Initial Page Load**: Server-side rendering (SSR) via Next.js App Router for immediate Largest Contentful Paint (LCP) ([TBD: Target < 2.0s under standard broadband]).
- **Client Transitions**: Client-side route transitions rendered instantaneously using React Server Components and optimized bundle chunking.
- **Table Pagination & Virtualization**: High-volume tables (Log Explorer, Agent inventory, Alert feeds) must support server-side pagination and client-side virtualization to maintain smooth 60 FPS scrolling over 10,000+ records.

### 4.2 Query Performance & Indexing
- **Database Query Latency**: Indexed tenant queries on primary operational tables (`alerts`, `incidents`, `events`) must execute efficiently ([TBD: P95 < 100ms under benchmark load in Phase 41]).
- **Full-Text Search**: Inverted indexes (`GIN` / `tsvector` in PostgreSQL) for keyword search across log messages and threat intelligence IOCs.

---

## 5. Availability & Reliability

### 5.1 Service Availability
- **Target Uptime**: High availability architecture utilizing multi-region Supabase managed PostgreSQL and edge-deployed Next.js frontend ([TBD: Enterprise SLA target defined during Phase 42]).
- **Graceful Degradation**: If external threat intelligence lookup APIs (e.g. VirusTotal, AbuseIPDB) experience outages or rate limits, the SOAR pipeline must fallback gracefully to local cache without failing parent incident workflows.

### 5.2 Backup & Disaster Recovery
- **Database Backups**: Automated Point-in-Time Recovery (PITR) with continuous write-ahead log (WAL) archiving in Supabase.
- **Recovery Time Objective (RTO)**: [TBD — Phase 42 Production Deployment].
- **Recovery Point Objective (RPO)**: [TBD — Phase 42 Production Deployment].

---

## 6. Scalability & Tenancy Growth

### 6.1 Horizontal Frontend Scaling
- Next.js application layer deployed across stateless edge/serverless compute environments capable of horizontal autoscaling under peak traffic.

### 6.2 Data Partitioning Strategy
- Database schema designed for future time-series table partitioning (e.g. `events_y2026_m09`) to support sustained high-volume simulated telemetry ingestion without degrading query responsiveness.

---

## 7. Observability & Telemetry

### 7.1 Application Logging & Metrics
- **Structured JSON Logging**: Standardized log format capturing timestamp, tenant `organization_id`, user `actor_id`, trace ID, execution duration, and error stacks.
- **Health Check Endpoints**: Public health endpoints (`/api/health`) verifying database connectivity, storage availability, and background queue responsiveness.

### 7.2 Security Auditability
- **Immutable Audit Trail**: Dedicated `public.audit_events` table tracking all administrative mutations, user authentications, host isolations, detection rule edits, and playbook executions.
- **Append-Only Policy**: RLS policies strictly prohibit `UPDATE` or `DELETE` operations on audit logs (enforced via database trigger / read-only rules).

---

## 8. Accessibility & Usability (a11y)

### 8.1 Accessibility Standards
- **WCAG 2.1 AA Compliance**: High-contrast ratios maintained across dark cyber themes (`#FFFFFF` text on `#161616` cards exceeds 7:1 contrast ratio).
- **Keyboard Navigation**: Full keyboard tab navigation and focus rings across all interactive controls, forms, modals, and the global Command Palette (`Ctrl+K` / `Cmd+K`).
- **Screen Reader Support**: Semantic HTML5 markup (`<nav>`, `<main>`, `<aside>`, `<header>`, `<h1>-<h6>`), ARIA labels on icon buttons, and descriptive alt text.

---

## 9. Maintainability & Code Quality

### 9.1 TypeScript & Type Safety
- Strict TypeScript configuration (`"strict": true`, zero implicit `any`).
- End-to-end type sharing between Supabase database schemas, Zod validation models, and React components.

### 9.2 Modular Domain Separation
- Code organized strictly by domain boundaries (`identity`, `telemetry`, `alerts`, `incidents`, `soar`, `training`, `compliance`) preventing spaghetti dependencies.
