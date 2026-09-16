# VRSOC Architecture Constitution — Supabase Foundation

## 1. Document Overview

This document specifies the authoritative Supabase foundation for the VRSOC SaaS platform. It establishes the client boundaries, environment configuration, database migration framework, Row Level Security (RLS) policies, privileged service-role boundaries, Storage architecture, Realtime channels, and Edge Function scaffolding that underpin all operational domains.

---

## 2. Supabase Client Architecture

VRSOC enforces a strict 3-tier client architecture in Next.js App Router using `@supabase/ssr` and `@supabase/supabase-js`:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT ENVIRONMENT MAP                                 │
├─────────────────────────┬────────────────────────────┬─────────────────────────────────┤
│ Client Type             │ Implementation Module      │ Scope & Security Rules          │
├─────────────────────────┼────────────────────────────┼─────────────────────────────────┤
│ **Browser Client**      │ `lib/supabase/client.ts`   │ Client Components (`"use client"`). Uses anon key only. │
│ **Server Client**       │ `lib/supabase/server.ts`   │ RSC, Server Actions, Route Handlers. Cookie-based auth. │
│ **Admin / Service Role**│ `lib/supabase/admin.ts`    │ Server-only background tasks. Bypasses RLS. NEVER in browser. │
│ **Middleware Helper**   │ `lib/supabase/middleware.ts`│ Edge Middleware session refreshing and cookie synchronization. │
└─────────────────────────┴────────────────────────────┴─────────────────────────────────┘
```

### 2.1 The Privileged Access Invariant
> **CRITICAL SECURITY INVARIANT**:
> 1. `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to server-side code (`lib/supabase/admin.ts` and Edge Functions).
> 2. It must **NEVER** be prefixed with `NEXT_PUBLIC_` or imported into client components.
> 3. Standard user operations (queries, mutations, actions) must **ALWAYS** use the authenticated server client (`lib/supabase/server.ts`) respecting PostgreSQL Row Level Security (RLS).
> 4. Service-role usage is strictly audited in `public.audit_events`.

---

## 3. Environment Variable Architecture

Environment variables are validated via Zod schemas in `@vrsoc/validation`:

```text
# ------------------------------------------------------------------------------
# Browser-Safe Variables (NEXT_PUBLIC_ prefix)
# Accessible on both client and server
# ------------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="VRSOC — Cyber Defense Training"
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ------------------------------------------------------------------------------
# Server-Only Variables (NO prefix)
# STRICTLY FORBIDDEN from client bundle
# ------------------------------------------------------------------------------
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VIRUSTOTAL_API_KEY=...
ABUSEIPDB_API_KEY=...
SHODAN_API_KEY=...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
```

---

## 4. Database Migration & Schema Foundation

### 4.1 Migration Order & Naming Convention
Migrations reside under `supabase/migrations/` and follow timestamped naming:
```text
YYYYMMDDHHMMSS_<domain_name>.sql
```

### 4.2 Foundational Schema Objects (Phase 04)
1. **Extensions**: `uuid-ossp`, `pgcrypto`.
2. **`public.profiles` Table**:
   - Stores user application metadata, extending `auth.users`.
   - Foreign key: `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`.
   - Columns: `email`, `full_name`, `avatar_url`, `created_at`, `updated_at`.
3. **Automatic Profile Trigger**:
   - `public.handle_new_user()` function automatically creates a `public.profiles` entry whenever a new user registers in `auth.users`.
4. **Automated `updated_at` Trigger**:
   - `public.handle_updated_at()` maintains accurate UTC modification timestamps.

### 4.3 RLS Policy Baseline
- `public.profiles` has RLS enabled.
- **Select Policy**: Users can only query their own profile (`auth.uid() = id`).
- **Update Policy**: Users can only modify their own profile (`auth.uid() = id`).
- Broad permissive policies like `USING (true)` are **STRICTLY PROHIBITED** on user-owned tables.

---

## 5. Storage Architecture

```text
┌────────────────────────┬────────────┬──────────────────────────────────────────────────┐
│ Bucket Name            │ Visibility │ Purpose & Security Controls                      │
├────────────────────────┼────────────┼──────────────────────────────────────────────────┤
│ `reports`              │ **Private**│ Compiled PDF/CSV executive and compliance reports. Signed URL only. │
│ `evidence`             │ **Private**│ Forensic packet captures, log extracts, IOC files. Strict RLS. │
│ `avatars`              │ **Public** │ User and organization profile avatar images. Cached via CDN. │
└────────────────────────┴────────────┴──────────────────────────────────────────────────┘
```

---

## 6. Realtime & Edge Functions Scaffolding

### 6.1 Realtime Invariants
- Realtime channels follow `org:<org_id>:<topic>` naming.
- Realtime WebSocket streams enforce tenant RLS checks before broadcasting change payloads.
- Direct broadcasting of raw credentials or full log dumps over WebSockets is prohibited.

### 6.2 Edge Functions Foundation
- Located under `supabase/functions/`.
- Shared utilities (`_shared/cors.ts`, `_shared/supabaseClient.ts`) standardize CORS headers and client creation across serverless functions.
- `health-check` function verifies Deno runtime availability.

---

## 7. Seed Strategy

- `supabase/seed/seed.sql` establishes the development seed script foundation.
- Domain-specific seed records (Base44 demo datasets, MITRE techniques, Knowledge Center articles, SOAR playbooks) will be populated incrementally in their respective implementation phases.
