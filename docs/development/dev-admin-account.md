# DEV-ONLY Super Admin Account Setup & Architecture

> **Purpose:** Provides a deterministic, frictionless Super Admin developer account for local development and E2E testing across all VRSOC modules without requiring live database authentication credentials or external cloud infrastructure.

---

## 1. Overview & Operating Model

VRSOC supports a zero-friction development authentication pathway specifically active when `NODE_ENV === "development"`. This allows engineers to sign in directly through the standard login page (`/login`) and immediately receive a fully resolved `Super Admin` role in the active development tenant organization (`Cyber Defense Academy`).

### Golden Architecture Invariant

```text
Development Mode:
  DEV Credentials in .env.local
        ↓
  Normal /login Form Submission
        ↓
  Server-Side Dev Auth Validation (NODE_ENV === "development")
        ↓
  Issue Development Session Cookie (`vrsoc_dev_session`)
        ↓
  Resolve Tenant Context (`Cyber Defense Academy`) & Super Admin RBAC
        ↓
  Full Access to All VRSOC Modules & Protected Server Actions

Production Mode:
  NODE_ENV === "production"
        ↓
  Dev Auth Guard Strictly Rejects Any Dev Auth Path
        ↓
  Normal Supabase Auth / PostgreSQL RLS / Tenant Resolution
```

---

## 2. Environment Variables

The development account is configured via local environment variables stored strictly in `.env.local` (which is excluded from source control).

| Variable Name | Environment | Default / Placeholder | Description |
| :--- | :--- | :--- | :--- |
| `DEV_ADMIN_EMAIL` | Development Only | `dev-admin@vrsoc.local` | Deterministic local admin email |
| `DEV_ADMIN_PASSWORD` | Development Only | *(Configured locally in `.env.local`)* | Server-only strong development password |

### `.env.example` Reference Template

```bash
# -----------------------------------------------------------------------------
# 7. DEVELOPMENT & TESTING TEST ACCOUNTS (DEV-ONLY)
# -----------------------------------------------------------------------------
DEV_ADMIN_EMAIL=dev-admin@example.local
DEV_ADMIN_PASSWORD=change-me-in-local-env
```

> [!CAUTION]
> **Never commit real password strings to Git or documentation.**
> The `.env.local` file is explicitly ignored in `.gitignore`. The password variable does NOT have a `NEXT_PUBLIC_` prefix and is never exposed to browser bundles, error logs, or client-side JavaScript.

---

## 3. Setup Instructions

1. **Configure Local Environment**:
   Open or create `.env.local` in the project root:
   ```bash
   DEV_ADMIN_EMAIL="dev-admin@vrsoc.local"
   DEV_ADMIN_PASSWORD="<Your-Secure-Local-Password>"
   ```

2. **Start the Development Server**:
   ```bash
   pnpm dev
   ```

3. **Log In**:
   - Navigate to `http://localhost:3000/login`.
   - Enter your configured `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD`.
   - Click **Log in**.
   - You will be authenticated as `Super Admin` with full tenant membership in `Cyber Defense Academy`.

---

## 4. Development-Only Security Guards

The development authentication path is guarded by multiple layers of defense:

1. **Environment Gate (`isDevAuthAllowed`)**:
   ```typescript
   export function isDevAuthAllowed(): boolean {
     return process.env.NODE_ENV === "development";
   }
   ```
   If `NODE_ENV === "production"`, `isDevAuthAllowed()` returns `false` unconditionally.

2. **Server-Side Only Execution**:
   All credential validation takes place inside server actions and Server Components (`apps/web/lib/auth/dev-auth.ts`). Client components never receive or process the development secret.

3. **Zero Universal Bypass**:
   The development authentication logic only triggers when the submitted email and password match `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD`. Random, invalid, or empty passwords will be rejected with `Invalid email or password`.

4. **Middleware Protection**:
   `apps/web/middleware.ts` recognizes `vrsoc_dev_session` exclusively in non-production environments. In production, requests without a valid Supabase JWT session cookie are immediately redirected to `/login`.

---

## 5. Super Admin Access & Role Resolution

When authenticated as the Dev Super Admin, the application grants:

- **Active Organization:** `Cyber Defense Academy` (`org-cyber-defense-academy`).
- **Resolved Role:** `Super Admin` (Level 100).
- **Permissions:** All 18 granular platform permissions (`all`, `org:manage`, `rbac:manage`, `sim:launch`, `soar:execute`, `intel:feed:manage`, etc.).
- **Accessible Modules:**
  - Security Operations Dashboard (`/`)
  - Endpoint Fleet & EDR Investigation (`/agents`, `/edr`)
  - XDR Correlation (`/xdr`)
  - Alerts & Incident Dossiers (`/alerts`, `/incidents`)
  - Sigma Detection Engine (`/detections`)
  - MITRE ATT&CK Matrix & Coverage (`/mitre`)
  - Threat Intelligence & Threat Hunting (`/threat-intel`, `/threat-hunting`)
  - SOAR Orchestration & Playbooks (`/soar`, `/soar/automation`, `/soar/playbooks`)
  - Audit Logs & Settings (`/settings`)

---

## 6. Changing Credentials

To change the local development credentials:
1. Update `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD` in `.env.local`.
2. Wrap password values in quotes if they contain special characters (e.g. `!`, `$`, `#`).
3. Restart the Next.js development server (`pnpm dev`).

---

## 7. Limitations of the Development Authentication Path

- **Non-Production Only:** Disabled and non-functional in production builds.
- **Single Tenant Context:** Resolves default development organization (`Cyber Defense Academy`). Multi-tenant switching to non-existent mock organizations is restricted to existing seed definitions.
- **Simulated Identity:** Uses synthetic user identifiers (`usr-dev-superadmin-001`) designed for offline local development without requiring an active Supabase Postgres container.
