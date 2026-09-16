# VRSOC Phase 00 — Permissions & Access Control Observations

## 1. Observed Base44 Access Control

- **OBSERVED**:
  - The Base44 frontend performs minimal client-side role discrimination.
  - All authenticated sessions can navigate to all sidebar routes (SOAR, Settings, Playbook Builder, AI Assistant, Approvals).
  - Profile menu displays generic user information without explicit role badges or permission gating.
- **INFERRED**:
  - Base44 was constructed as an unrestricted prototype/demo environment.
- **UNKNOWN**:
  - How Base44 internally authorizes actions across different administrative tiers.

---

## 2. Target Production RBAC Architecture

In strict compliance with `VR_SOC.md` (Sections 13 & 16), the production VRSOC platform will implement centralized, server-side Role-Based Access Control:

### 2.1 Enterprise Role Matrix

| Role | Scope & Permissions | Route Restrictions |
|---|---|---|
| **Super Admin** | Full multi-tenant administration, organization management, system audit logs, global policies. | All routes + Tenant Admin. |
| **Instructor** | Create/launch simulation labs, assign cohorts, review student submissions, manage scenario telemetry. | All routes + Lab Creator. |
| **Student** | Triage alerts, investigate assigned cases, execute training playbooks, view educational knowledge articles. | Restricted from creating global detection rules or modifying tenant settings. |
| **SOC Analyst (Tier 1/2/3)** | Alert triage, incident response, threat hunting, log exploration, playbook execution. | Operational SOC & SOAR routes. |
| **Incident Responder** | Full incident management, host isolation, containment execution, forensic case notes. | Full Incident & Case Management. |
| **Threat Hunter** | Query raw logs, correlate telemetry, create detection rules, map MITRE techniques. | SIEM, Detection, MITRE, Hunting. |
| **Auditor** | Read-only access to all telemetry, compliance findings, audit center, reports. | Read-only on all operational data. |
| **Viewer** | Executive dashboards, read-only analytics, exported reports. | Dashboard, Analytics, Reports only. |

---

## 3. Server-Side Enforcement Rules

1. **Frontend Role Checks Are NOT Security**: UI elements (such as "Delete Rule" or "Approve Action") may be conditionally rendered, but the database/API boundary must strictly validate authorizations.
2. **PostgreSQL Row Level Security (RLS)**:
   - Policies will inspect `auth.jwt() -> app_metadata -> role` and verify permissions before allowing `SELECT`, `INSERT`, `UPDATE`, or `DELETE`.
3. **Negative Test Suite Requirement**:
   - Unauthorized role attempts to trigger privileged actions (e.g. `Student` attempting to delete a playbook or approve firewall blocks) must be rejected with `403 Forbidden` / RLS denial.
