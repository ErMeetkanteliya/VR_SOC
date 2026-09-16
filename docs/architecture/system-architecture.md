# VRSOC Architecture Constitution — System Architecture

## 1. Document Overview

This document specifies the complete system architecture for the VRSOC SaaS platform. It establishes the technical blueprint, component boundaries, execution models, and data flows governing the interaction between the Next.js frontend, Supabase backend platform, PostgreSQL database, Edge Functions, Realtime subsystem, and external integration points.

---

## 2. High-Level Architecture Topology

VRSOC is architected as a modern, multi-tenant cloud-native application leveraging a single deployable Next.js frontend and a Supabase managed backend foundation:

```text
                               ┌─────────────────────────────────────────────────────────┐
                               │                    CLIENT BROWSER                       │
                               │  Base44 Replicated UI • Dark Cyber Glassmorphism        │
                               │  React Client Components • Lucide Icons • Realtime Sub  │
                               └────────────┬────────────────────────────┬────────────────┘
                                            │ HTTPS (SSR / RSC / Actions)│ WSS (Realtime)
                                            ▼                            ▼
                 ┌──────────────────────────────────────┐     ┌────────────────────────┐
                 │            NEXT.JS SERVER            │     │   SUPABASE REALTIME    │
                 │  App Router (RSC & Server Actions)   │     │  PostgreSQL CDC Stream │
                 │  Zod Validation • Session Middleware │     │  Tenant Channel Filter │
                 └──────────────────┬───────────────────┘     └───────────┬────────────┘
                                    │ Supabase SSR Client                 │
                                    │ (Postgres Wire / PostgREST)         │
                                    ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                SUPABASE PLATFORM CORE                                  │
│                                                                                        │
│  ┌────────────────────────┐   ┌────────────────────────────┐   ┌────────────────────┐  │
│  │     SUPABASE AUTH      │   │   SUPABASE EDGE FUNCTIONS  │   │  SUPABASE STORAGE  │  │
│  │  Email/Password + OTP  │   │   Simulation Engine Worker │   │  Report PDFs & CSV │  │
│  │  Google OAuth + MFA    │   │   Threat Intel Integration │   │  Forensic Evidence │  │
│  │  Session Cookies & JWT │   │   AI Security Assistant    │   │  Encrypted Objects │  │
│  └───────────┬────────────┘   └─────────────┬──────────────┘   └─────────┬──────────┘  │
│              │                              │                            │             │
│              ▼                              ▼                            ▼             │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                       POSTGRESQL 15+ DATABASE ENGINE                             │  │
│  │                                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                   ROW LEVEL SECURITY (RLS) LAYER                           │  │  │
│  │  │  Mandatory tenant isolation (organization_id) & RBAC database policies     │  │  │
│  │  └─────────────────────────────────────┬──────────────────────────────────────┘  │  │
│  │                                        ▼                                         │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                      RELATIONAL SCHEMA MODULES                             │  │  │
│  │  │  Tenancy • Assets • SIEM Logs • Detections • Alerts • Incidents • Cases     │  │  │
│  │  │  MITRE • Threat Intel • Compliance • Malware • Training • Audit Events     │  │  │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer Responsibilities & Execution Boundaries

| Layer / Subsystem | Execution Environment | Core Responsibilities | Forbidden Responsibilities |
|---|---|---|---|
| **Client Browser** | Web Browser | Rendering Base44 UI, local interaction state (drawers, modals, tabs), Chart.js/Recharts animations, Command Palette keyboard capture (`Ctrl+K`), Realtime WebSocket event handling. | Direct database queries bypassing API, authorization decisions, raw secret storage, client-side fake data generation. |
| **Next.js Server** | Node.js / Edge Runtime | Server-Side Rendering (SSR), React Server Components (RSC), session cookie verification, Zod input validation, Server Actions for transactional mutations, layout composition. | Persistent background worker loops, raw unauthenticated database bypass, client-side secret exposure. |
| **Supabase Auth** | Supabase Managed Auth | User registration, password hashing (bcrypt/argon2), OTP email dispatch, Google OAuth federation, TOTP MFA challenge verification, JWT session token lifecycle. | Storing tenant application metadata (which belongs in `public.profiles` and `public.memberships`). |
| **PostgreSQL & RLS** | Managed PostgreSQL 15+ | Relational data persistence, foreign key integrity, ACID transactions, multi-tenant data isolation via Row Level Security (RLS), GIN full-text log indexing, append-only audit logging. | Executing long-running external HTTP requests (delegated to Edge Functions). |
| **Supabase Realtime** | Elixir Phoenix PubSub | Broadcasting live alert counters, agent fleet status heartbeats, live SOAR execution logs, and collaborative case updates over WebSockets. | Broadcasting tenant data to unauthorized public channels; bypassing tenant RLS filters. |
| **Edge Functions** | Deno Serverless Runtime | Heavy background orchestration, Canonical Simulation Engine event injection, external Threat Intel lookups (VirusTotal, AbuseIPDB, Shodan), AI Assistant RAG pipeline, PDF report generation. | Storing persistent local filesystem state; bypassing database tenant constraints. |
| **Supabase Storage** | S3-Compatible Storage | Encrypted storage for generated compliance audit reports, exported PDF incident summaries, and uploaded forensic artifacts. | Public world-readable buckets for tenant-sensitive evidence files. |

---

## 4. Multi-Tenant Authorization & Boundary Model

### 4.1 The Security Boundary Invariant
VRSOC enforces a strict, defense-in-depth authorization hierarchy where **PostgreSQL Row Level Security (RLS) is the non-negotiable security boundary**:

```text
User Request
    │
    ▼
[Next.js Middleware] ──────> Validates session cookie presence & active organization context
    │
    ▼
[Server Action / API] ────> Validates Zod schema + evaluates RBAC permissions against memberships
    │
    ▼
[Supabase Client] ────────> Passes authenticated JWT token with active organization claims
    │
    ▼
[PostgreSQL Engine] ──────> RLS Policy verifies user membership in target organization_id
    │
    ├─► Match: Query executes & returns tenant records
    └─► Mismatch: Rejected with 0 records or 403 Access Denied
```

### 4.2 Handling of JWT Claims vs Database Reality
- **JWT / `app_metadata` Role**: Used exclusively for low-latency client UI routing, rendering conditional buttons, and passing active tenant hints.
- **Database Enforcement**: Database RLS policies and server-side functions query `public.memberships` directly to verify active status. If an administrator revokes a user's membership in Organization A, the user is blocked at the database layer on their very next query regardless of what token claims they hold.

---

## 5. Canonical Telemetry & Simulation Pipeline Architecture

VRSOC's signature feature is the **Canonical Shared Telemetry Pipeline**. Disconnected, screen-specific fake data generators are strictly prohibited across the codebase.

```text
┌────────────────────────────────────────┐
│     INSTRUCTOR / SCENARIO TRIGGER      │
│  (e.g. Brute Force Attack LAB-01)      │
└──────────────────┬─────────────────────┘
                   │ Invokes Edge Function / Scenario Script
                   ▼
┌────────────────────────────────────────┐
│    SYNTHETIC TELEMETRY GENERATOR       │
│  Dispatches normalized WinEvent (4625),│
│  Syslog, Firewall, and EDR payloads    │
└──────────────────┬─────────────────────┘
                   │ Batch INSERT with organization_id
                   ▼
┌────────────────────────────────────────┐
│    PUBLIC.EVENTS / PUBLIC.LOGS         │
│  Stored in partitioned PostgreSQL log  │
│  table with JSONB schema normalization │
└──────────────────┬─────────────────────┘
                   │ Realtime CDC / Query Hook
                   ▼
┌────────────────────────────────────────┐
│     DETECTION EVALUATION ENGINE        │
│  Evaluates Sigma Rules & Thresholds    │
│  (e.g. 5+ failed logins within 60s)    │
└──────────────────┬─────────────────────┘
                   │ Match Found -> Generates Alert
                   ▼
┌────────────────────────────────────────┐
│       SHARED SOC ALERT QUEUE           │
│  Inserted in public.alerts             │
│  - Severity: Critical (Score: 95)      │
│  - MITRE Mapping: T1110 (Brute Force)  │
│  - Affected Asset: DC-01               │
└──────────────────┬─────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐ ┌──────────────────┐
│  CORE SOC TRIAGE │ │  SOAR SUBSYSTEM  │
│  Alert Feed      │ │  Playbook Run    │
│  Log Explorer    │ │  Auto Firewall   │
│  Incident Board  │ │  Approval Queue  │
│  Case Dossier    │ │  Live Execution  │
└────────┬─────────┘ └────────┬─────────┘
         │                    │
         └─────────┬──────────┘
                   ▼
┌────────────────────────────────────────┐
│    INTELLIGENCE & EDUCATIONAL LAYER    │
│  - Realtime Analytics & MTTD/MTTR      │
│  - Compliance Audit Scorecard Evidence │
│  - Grounded AI Security Explanation    │
│  - Automated Student Lab Grading       │
└────────────────────────────────────────┘
```

---

## 6. AI Security Assistant Subsystem Architecture

The AI Security Assistant (`/ai-assistant`) is architected as a context-grounded retrieval-augmented generation (RAG) system running server-side:

```text
[Analyst in UI clicks "Ask AI Assistant" on Alert ALT-2026-0342]
                           │
                           ▼
[Edge Function: ai-security-assistant]
  ├── 1. Fetch Alert ALT-2026-0342 metadata (title, severity, risk score)
  ├── 2. Fetch Triggering Log Samples from public.events
  ├── 3. Fetch Affected Asset Profile (hostname, OS, isolation state)
  ├── 4. Fetch MITRE ATT&CK guidance for mapped technique (T1110)
  ├── 5. Fetch Related Knowledge Center educational summary
  └── 6. Assemble Structured Prompt with strict defensive system instructions
                           │
                           ▼
[LLM Provider: Google Gemini / Anthropic via secure server SDK]
  - Explains root cause
  - Analyzes attack mechanism
  - Suggests SIEM search queries
  - Recommends defensive containment steps
  - Rejects any requests for exploit/malware code
                           │
                           ▼
[Streams response back to client browser via Server-Sent Events / SSE]
```

---

## 7. Frontend Layout Architecture & Base44 Parity

The frontend architecture faithfully reconstructs Base44's visual and functional hierarchy using Next.js App Router:

```text
apps/web/app/
├── (auth)/                          # Unauthenticated Auth Zone
│   ├── layout.tsx                   # Centered dark gradient background
│   ├── login/page.tsx               # /login (Base44 koe)
│   ├── register/page.tsx            # /register (Base44 Foe)
│   ├── forgot-password/page.tsx     # /forgot-password (Base44 zoe)
│   └── reset-password/page.tsx      # /reset-password (Base44 Uoe)
│
├── (dashboard)/                     # Authenticated Application Zone
│   ├── layout.tsx                   # AppShell: Sidebar (240px) + Topbar + Org Switcher
│   ├── page.tsx                     # / Dashboard (Base44 dNe)
│   ├── agents/page.tsx              # /agents EDR Fleet (Base44 YNe)
│   ├── alerts/page.tsx              # /alerts Triage & Drawer (Base44 QNe)
│   ├── incidents/page.tsx           # /incidents Kanban (Base44 JNe)
│   ├── detections/page.tsx          # /detections Sigma Rules (Base44 eOe)
│   ├── mitre/page.tsx               # /mitre Attack Matrix (Base44 dOe)
│   ├── logs/page.tsx                # /logs SIEM Explorer (Base44 hOe)
│   ├── cases/page.tsx               # /cases Case Dossiers (Base44 pOe)
│   ├── analytics/page.tsx           # /analytics KPI Charts (Base44 vOe)
│   ├── ai-assistant/page.tsx        # /ai-assistant Chat (Base44 FIe)
│   ├── knowledge/page.tsx           # /knowledge Articles (Base44 zIe)
│   ├── settings/page.tsx            # /settings Tabbed Prefs (Base44 YIe)
│   │
│   ├── soar/                        # SOAR Subsystem Zone (15 Routes)
│   │   ├── page.tsx                 # /soar Overview (Base44 sDe)
│   │   ├── automation/page.tsx      # /soar/automation Visual Runner (Base44 cDe)
│   │   ├── playbooks/page.tsx       # /soar/playbooks Catalog (Base44 dDe)
│   │   ├── builder/page.tsx         # /soar/builder Node Graph Canvas (Base44 hDe)
│   │   ├── enrichment/page.tsx      # /soar/enrichment Threat Intel (Base44 mDe)
│   │   ├── ai-engine/page.tsx       # /soar/ai-engine Risk Matrix (Base44 yDe)
│   │   ├── actions/page.tsx         # /soar/actions Primitives (Base44 vDe)
│   │   ├── approvals/page.tsx       # /soar/approvals Queue (Base44 bDe)
│   │   ├── cases/page.tsx           # /soar/cases SOAR Dossiers (Base44 _De)
│   │   ├── incident/[id]/page.tsx   # /soar/incident/:id Deep Dive (Base44 kDe)
│   │   ├── history/page.tsx         # /soar/history Audit (Base44 CDe)
│   │   ├── live/page.tsx            # /soar/live Realtime Console (Base44 PDe)
│   │   ├── reports/page.tsx         # /soar/reports Generator (Base44 EDe)
│   │   ├── simulation/page.tsx      # /soar/simulation Lab Trigger (Base44 TDe)
│   │   └── settings/page.tsx        # /soar/settings SOAR Policies (Base44 RDe)
│   │
│   └── (extensions)/                # Master Spec Extensions
│       ├── compliance/page.tsx      # /compliance ISO/NIST Scorecards
│       ├── vulnerabilities/page.tsx # /vulnerabilities CVE/CVSS Tracker
│       ├── malware-analysis/page.tsx# /malware-analysis Static/Sandbox Reports
│       ├── fim/page.tsx             # /fim File Integrity Monitoring
│       ├── threat-hunting/page.tsx  # /threat-hunting Attack Graph Canvas
│       ├── training/cohorts/page.tsx# /training/cohorts Class Roster & Grades
│       └── audit/page.tsx           # /audit Immutable Security Trail
```

---

## 8. External Integration Boundaries

1. **Threat Intelligence Providers**: External queries to VirusTotal, AbuseIPDB, AlienVault OTX, and Shodan are routed strictly through Supabase Edge Functions with secret API keys stored in server environment variables. Local caching prevents repeated external API calls.
2. **Notification Adapters**: Outbound webhooks, Slack alerts, Microsoft Teams messages, and SMTP emails are dispatched via background Edge Functions with retry and dead-letter queue policies.
3. **Report Export Services**: Edge functions generate structured PDFs using Headless Chromium or lightweight server-side PDF generators, saving compiled files directly to private Supabase Storage buckets with signed download URLs.
