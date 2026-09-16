# VRSOC Architecture Specification — Multi-Tenancy

> **Phase:** 07 — Multi-Tenancy  
> **Status:** RATIFIED & IMPLEMENTED  
> **Authoritative Security Layer:** PostgreSQL 15+ Row Level Security (RLS) + Live `public.memberships` state

---

## 1. Executive Architecture Summary

VRSOC is architected as an enterprise-grade multi-tenant SaaS platform where every operational entity (assets, agents, detection rules, alerts, incidents, cases, simulation runs, compliance scorecards, and audit events) strictly belongs to an **Organization partition**.

Tenant boundaries are enforced at the PostgreSQL database engine layer via Row Level Security (RLS). Frontend filtering and JWT metadata are strictly UX conveniences and are never treated as security boundaries.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   auth.users                                           │
│                       (Authenticated User Identity)                                    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ 1:N
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                public.memberships                                      │
│                (user_id, organization_id, role, status='active')                       │
│                         ★ Authoritative Security Anchor ★                              │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ N:1
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               public.organizations                                     │
│                     (id, name, slug, status, created_by)                               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ 1:N
                ┌───────────────────────────┼───────────────────────────┐
                ▼                           ▼                           ▼
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│     public.teams       │  │  public.invitations    │  │ Tenant Resources       │
│ (id, org_id, name)     │  │ (id, org_id, email)    │  │ (alerts, incidents,    │
└────────────────────────┘  └────────────────────────┘  │  assets, cases...)     │
                                                        └────────────────────────┘
```

---

## 2. Multi-Tenant Entity Schema

### 2.1 `public.organizations`
Represents the top-level customer, university, or enterprise tenant boundary.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name TEXT NOT NULL`
- `slug TEXT NOT NULL UNIQUE` (used for tenant vanity routing: `vrsoc.app/org/:slug`)
- `status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived'))`
- `created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`

### 2.2 `public.memberships`
Represents the live authorization relationship connecting an authenticated user to an organization.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `role TEXT NOT NULL DEFAULT 'SOC Analyst' CHECK (role IN ('Super Admin', 'Instructor', 'Student', 'SOC Analyst', 'Incident Responder', 'Threat Hunter', 'Auditor', 'Viewer'))`
- `status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked', 'pending'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `CONSTRAINT uq_memberships_org_user UNIQUE (organization_id, user_id)`

### 2.3 `public.teams`
Subgroups within an organization (e.g. "Incident Response Blue Team", "SOC Tier 1 Monitoring", "Cyber Range Cohort A").
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `name TEXT NOT NULL`
- `description TEXT DEFAULT ''`
- `created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
- `CONSTRAINT uq_teams_org_name UNIQUE (organization_id, name)`

### 2.4 `public.team_members`
Junction mapping memberships to teams.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE`
- `membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE`
- `CONSTRAINT uq_team_members_team_membership UNIQUE (team_id, membership_id)`

### 2.5 `public.invitations`
Pending team member invitations with cryptographic 7-day expiration tokens.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `email TEXT NOT NULL`
- `role TEXT NOT NULL DEFAULT 'Student'`
- `token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex')`
- `invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`
- `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))`
- `expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days')`

---

## 3. Row Level Security (RLS) & Tenant Isolation Invariants

### 3.1 Non-Negotiable RLS Rule
Every tenant-scoped table in PostgreSQL MUST enable RLS and enforce tenant membership:
```sql
CREATE POLICY "tenant_isolation_select" ON public.alerts
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

### 3.2 Anti-Spoofing & Instant Revocation
1. **Client Spoofing Prohibited:** Even if a malicious client passes an arbitrary `organization_id` in an API payload or Server Action, PostgreSQL RLS rejects the query with zero rows returned or a constraint violation unless `auth.uid()` holds an active membership record in that specific organization.
2. **Instant Revocation:** If an administrator updates a membership to `status = 'revoked'` or deletes the row, all database access for that user to that tenant drops instantaneously with zero TTL delay.
3. **Stale JWT Protection:** `app_metadata` in JWT tokens provides client UI hints only. The database always evaluates against live rows in `public.memberships`.

---

## 4. Transactional Organization Creation

To eliminate race conditions and partial states, organization creation is executed via PostgreSQL Security Definer function `public.create_organization(org_name, org_slug)`:
1. Inserts record into `public.organizations`.
2. Inserts creator into `public.memberships` as `role = 'Super Admin'` and `status = 'active'`.
3. Seeds default operational teams (`SOC Operations Team`, `Incident Response Lead Team`).
4. Commits atomically or rolls back completely on constraint violation.

---

## 5. Tenant Resolution Architecture

1. **Active Organization Cookie (`vrsoc_active_org`):** Stored as an `HttpOnly`, `SameSite=Lax` cookie indicating the user's preferred organization context.
2. **Server-Side Verification (`getActiveOrganization()`):** Always cross-references the cookie ID against the live database query `public.memberships.select()`.
3. **Fallback Resolution:** If no cookie is present or the selected organization is no longer valid (e.g. membership revoked), the system automatically defaults to the user's primary active membership.
