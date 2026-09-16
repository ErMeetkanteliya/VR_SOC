# VRSOC Architecture Constitution — Security Architecture

## 1. Document Overview

This document defines the comprehensive security architecture and defense-in-depth model for the VRSOC SaaS platform. It governs authentication boundaries, multi-tenant database isolation, server-side authorization enforcement, cryptographic key management, input/output validation, attack surface hardening, and immutable audit logging.

---

## 2. The Core Security Boundary Model

VRSOC rejects client-centric security models and establishes a multi-layered server and database boundary:

```text
                                  ┌────────────────────────────────────────┐
                                  │             CLIENT BROWSER             │
                                  │  - Untrusted Execution Environment     │
                                  │  - UI Conditional Rendering Only       │
                                  └──────────────────┬─────────────────────┘
                                                     │ HTTPS Request
                                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: EDGE & MIDDLEWARE BOUNDARY (Next.js Server)                                     │
│ - Session Cookie Integrity Check (HttpOnly, SameSite=Lax, Secure)                        │
│ - TLS 1.3 Termination & Security Headers (CSP, HSTS, X-Frame-Options: DENY)              │
│ - Global IP Rate Limiting & Brute Force Throttling                                       │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: APPLICATION & SERVER ACTION BOUNDARY (Node.js / Edge Functions)                 │
│ - Zod Schema Payload Validation (Strict sanitization & typing)                           │
│ - Server-Side RBAC Guard (Queries public.memberships for role authorization)             │
│ - Context-Grounded Business Logic Execution                                              │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │ Authenticated Connection + User Context
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: DATABASE & ROW LEVEL SECURITY (RLS) BOUNDARY (PostgreSQL 15+)                   │
│ - Non-negotiable multi-tenant isolation on EVERY table (organization_id)                 │
│ - SQL-level read/write/delete permission policies                                        │
│ - Append-only immutable audit logging                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. JWT Claims vs Database Security Boundary

> **MANDATORY SECURITY INVARIANT**:
> `app_metadata` in JWT tokens provides convenient client-side context for UI routing and header rendering, but it is **NEVER the sole source of truth for authorization**.
> 
> 1. The **authoritative security boundary** is PostgreSQL Row Level Security (RLS) policies evaluated directly against `public.memberships`.
> 2. Database policies and Server Actions query the live `memberships` table for the user's active status and role.
> 3. If an administrator revokes a user's membership or downgrades their role in Organization A, the user's permissions are revoked immediately at the database layer on their next request, regardless of whether their cached JWT token has expired.

---

## 4. Multi-Tenant Row Level Security (RLS) Policy Architecture

Every operational table in PostgreSQL enforces four baseline RLS policies:

### 4.1 Tenant Select Policy (Read Isolation)
```sql
CREATE POLICY tenant_select_policy ON public.alerts
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid() AND status = 'Active'
  )
);
```

### 4.2 Tenant Insert Policy (Write Isolation & Role Check)
```sql
CREATE POLICY tenant_insert_policy ON public.alerts
FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid() 
      AND status = 'Active'
      AND role IN ('Super Admin', 'Instructor', 'SOC Analyst', 'Incident Responder', 'Threat Hunter')
  )
);
```

### 4.3 Tenant Update Policy (Modification Guard)
```sql
CREATE POLICY tenant_update_policy ON public.alerts
FOR UPDATE TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid() 
      AND status = 'Active'
      AND role IN ('Super Admin', 'Instructor', 'SOC Analyst', 'Incident Responder', 'Threat Hunter')
  )
);
```

### 4.4 Tenant Delete Policy (Restricted Admin Delete)
```sql
CREATE POLICY tenant_delete_policy ON public.alerts
FOR DELETE TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid() 
      AND status = 'Active'
      AND role = 'Super Admin'
  )
);
```

---

## 5. Client Forbidden Actions (Zero-Trust Invariants)

The browser client is an untrusted environment. The frontend is **STRICTLY PROHIBITED** from deciding or executing the following:

1. **The client NEVER decides its own organization membership or role permissions.**
2. **The client NEVER decides whether a detection rule triggered.**
3. **The client NEVER decides whether an automated SOAR action is approved without server validation.**
4. **The client NEVER generates or compiles executable attack code or raw exploits.**
5. **The client NEVER holds direct database connection strings with service-role privileges.**
6. **The client NEVER mutates or deletes audit logs.**
7. **The client NEVER executes external Threat Intel lookups directly using private provider API keys.**

---

## 6. Secrets Management & API Key Security

### 6.1 Server Secrets Storage
- `SUPABASE_SERVICE_ROLE_KEY`, `VIRUSTOTAL_API_KEY`, `GEMINI_API_KEY`, and SMTP credentials reside strictly in server-side environment variables (`.env.local` / Supabase Vault / Edge Function secrets).
- **Zero Client Leakage**: Server secrets are never prefixed with `NEXT_PUBLIC_`.

### 6.2 Application API Keys Architecture
- Programmatic API keys issued to organizations for external telemetry ingestion:
  1. Key format: `vrsoc_live_<32_character_random_hex>`.
  2. Storage: Stored hashed using SHA-256 (`api_key_hash`) in `public.api_keys`. Raw keys are displayed only once upon creation.
  3. Tenant Binding: Explicitly bound to a single `organization_id` and assigned granular scopes (e.g. `telemetry:ingest`).
  4. Instant Revocation: Admin can revoke keys instantaneously, invalidating all subsequent API requests.

---

## 7. Web Application Hardening & Defense in Depth

### 7.1 Cross-Site Scripting (XSS) Prevention
- React automatic JSX escaping for all dynamic user inputs.
- Markdown article content and analyst notes sanitized using DOMPurify with strict HTML tag whitelisting.

### 7.2 Cross-Site Request Forgery (CSRF) Mitigation
- Next.js Server Actions utilize native origin headers and cryptographic action IDs.
- Supabase session cookies configured with `SameSite=Lax` and `Secure`.

### 7.3 Content Security Policy (CSP) Headers
```text
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https:;
connect-src 'self' wss://*.supabase.co https://*.supabase.co;
frame-ancestors 'none';
object-src 'none';
```

---

## 8. Immutable Security Audit Logging

All administrative, authentication, and security containment actions write to `public.audit_events`:

```sql
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,
  resource_type VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64),
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### Database-Level Append-Only Guarantee
```sql
CREATE POLICY audit_events_select_policy ON public.audit_events
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid() AND role IN ('Super Admin', 'Auditor')
  )
);

-- Note: No UPDATE or DELETE policies exist for audit_events (strictly immutable).
```
