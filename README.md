# VRSOC — Enterprise SOC Training & Simulation SaaS

> **Tagline:** Learn • Detect • Investigate • Defend  
> **Reference Prototype:** `https://vrsoc.base44.app/`  
> **Target Architecture:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (PostgreSQL, Auth, RLS, Realtime, Storage, Edge Functions)

---

## 1. Overview

VRSOC is an enterprise-grade Cyber Security Operations Center (SOC) training, simulation, and incident response platform. It provides learners and security analysts with hands-on investigation workflows across SIEM log exploration, EDR fleet oversight, Sigma detection engineering, MITRE ATT&CK matrix mapping, SOAR playbook automation, and NIST SP 800-61 incident response handling.

---

## 2. Monorepo Structure

```text
vrsoc/
├── apps/
│   └── web/                     # Next.js App Router frontend application
├── packages/
│   ├── ui/                      # Shared design tokens & UI utility helpers
│   ├── types/                   # Core domain TypeScript type definitions
│   ├── validation/              # Zod validation schemas for all domain entities
│   └── config/                  # Shared Tailwind, TypeScript, and ESLint configurations
├── supabase/
│   ├── migrations/              # Incremental SQL migrations (Phase 04+)
│   ├── functions/               # Supabase Edge Functions
│   └── seed/                    # Development & test seed scripts
├── docs/
│   ├── reverse-engineering/     # Phase 00 Base44 reverse engineering catalog
│   ├── product/                 # Phase 01 Product Blueprint specifications
│   ├── architecture/            # Phase 02 Architecture Constitution & ADRs
│   ├── development/             # Definition of Done & quality standards
│   └── phase-reports/           # Verified milestone phase reports
├── AGENTS.md                    # Authoritative engineering constitution for AI agents & developers
└── VR_SOC.md                    # Master project roadmap & execution contract
```

---

## 3. Local Development Prerequisites

- **Node.js**: `v20.0.0` or higher (tested with Node.js `v22.x`)
- **pnpm**: `v9.0.0` or higher (tested with pnpm `v11.x`)
- **Supabase CLI** (optional for local database): `supabase` CLI

---

## 4. Getting Started

### 4.1 Install Dependencies
```bash
pnpm install
```

### 4.2 Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(No real secrets are required for initial local development or smoke tests).*

### 4.3 Run Local Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the operational bootstrap page.

---

## 5. Quality & Testing Commands

```bash
# Type-check entire monorepo
pnpm typecheck

# Lint all packages and apps
pnpm lint

# Run Vitest unit & integration test suites
pnpm test

# Run Playwright E2E smoke tests
pnpm test:e2e

# Build production Next.js bundle
pnpm build
```

---

## 6. Defensive & Educational Boundary

VRSOC is strictly a defensive cybersecurity training platform. In compliance with [`AGENTS.md`](file:///c:/Users/om/Desktop/VR_SOC/AGENTS.md), the repository strictly prohibits live exploit compilers, offensive hacking tools, malware generation, credential harvesting, or automated attack infrastructure. All adversarial scenarios are safely simulated via synthetic telemetry.
