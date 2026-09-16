# VRSOC Product Specification — Roles and Permissions

## 1. Document Overview

This document specifies the target Role-Based Access Control (RBAC) and Multi-Tenant Authorization architecture for the VRSOC platform. 

The Base44 reference prototype was implemented as an open, flat-role demonstration. In contrast, the production VRSOC SaaS must implement strict, server-side authorization partitioned by Organization and enforced at the database layer using PostgreSQL Row Level Security (RLS) and cryptographic JWT claims.

---

## 2. Authorization Model & Architecture

VRSOC models authorization using the formal decoupled standard:

```text
User 
  → Organization Membership 
  → Assigned Role 
  → Scoped Permissions 
  → Target Resource 
  → Permitted Actions (Create, Read, Update, Delete, Execute)
```

### 2.1 Core Architectural Principles
1. **Frontend Role Checks Are NOT Security**: UI conditional rendering (such as hiding an "Isolate Host" button) is purely for user experience. Every API route, Server Action, Edge Function, and SQL query must validate permissions server-side.
2. **Tenant Boundary Invariant**: All permissions are evaluated strictly *within* the scope of the active `organization_id`. A Super Admin in Organization A has zero access or privileges in Organization B unless explicitly invited and assigned a role within Organization B.
3. **Defense in Depth**: Authorization is enforced across three sequential layers:
   - *Layer 1 (Edge / Middleware)*: Next.js Middleware verifies valid session token and organization membership.
   - *Layer 2 (Application / Server Actions)*: Zod schemas and authorization guards validate role permissions before executing business logic.
   - *Layer 3 (Database / RLS)*: PostgreSQL Row Level Security policies enforce multi-tenant isolation and role-specific SQL read/write rules.

---

## 3. Platform Enterprise Roles

| Role | Target Persona | Primary Domain Scope | Base Route Access |
|---|---|---|---|
| **Super Admin** | Enterprise SecOps Director / Tenant Owner | Global organization administration, user management, billing, system audit logs, global security policies. | All routes + Tenant Administration |
| **Instructor** | Cybersecurity Professor / Training Lead | Scenario creation, lab launching, student cohort management, grading, educational telemetry control. | All SOC routes + Lab & Cohort Manager |
| **Student** | Cyber Defense Learner / Trainee | Alert triage, guided investigations, quiz completions, educational lab scenarios, knowledge reading. | Operational SOC triage, Labs, Knowledge |
| **SOC Analyst (Tier 1/2/3)** | Frontline SOC Security Analyst | Real-time alert triage, incident escalation, log correlation, playbook runner, triage commenting. | All Core SOC & SOAR operational routes |
| **Incident Responder** | Senior Responder / Incident Commander | Full incident handling, forensic investigation, host containment, case dossiers, remediation playbooks. | Full Incident & Case Management |
| **Threat Hunter** | Advanced SecOps / Detection Engineer | Raw log querying, hypothesis testing, custom Sigma/YARA detection rule engineering, MITRE mapping. | SIEM, Detection Rules, MITRE, Hunting |
| **Auditor** | GRC Analyst / Compliance Officer | Read-only access to all telemetry, compliance frameworks, audit trails, and reporting engines. | Read-only across Telemetry, GRC, Audit |
| **Viewer** | Executive / Stakeholder | Read-only high-level dashboards, KPI analytics, and exported summary reports. | Dashboard, Analytics, Reports only |

---

## 4. Granular Permissions Catalog

Permissions are structured as `<domain>:<resource>:<action>`:

```text
# Identity & Organizations
org:members:invite
org:members:remove
org:members:update_role
org:settings:manage
org:api_keys:manage

# SOC Telemetry & Agents
agents:read
agents:isolate
agents:restart
agents:collect_logs
telemetry:read
telemetry:query

# Detections & MITRE
detections:read
detections:create
detections:update
detections:delete
detections:test
mitre:read
mitre:simulate

# Alerts & Incidents
alerts:read
alerts:triage
alerts:comment
alerts:escalate
incidents:read
incidents:create
incidents:update_status
incidents:assign
incidents:close

# Cases & Evidence
cases:read
cases:create
cases:add_evidence
cases:add_notes
cases:close

# SOAR & Automation
soar:playbooks:read
soar:playbooks:create
soar:playbooks:update
soar:playbooks:execute
soar:actions:execute
soar:approvals:manage

# Training & Simulation
simulation:scenarios:read
simulation:scenarios:create
simulation:scenarios:launch
training:cohorts:manage
training:quizzes:take
training:submissions:grade

# Compliance & GRC
compliance:read
compliance:update_controls
compliance:export

# Audit & Reporting
reports:generate
reports:export
audit:read
```

---

## 5. Role-to-Permission Matrix

| Permission Domain | Action | Super Admin | Instructor | Student | SOC Analyst | Incident Responder | Threat Hunter | Auditor | Viewer |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Organization & Users** | Invite / Remove Members | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** |
| | Manage API Keys & Settings | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** |
| **Agents & EDR** | View Agent Fleet | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| | Isolate Compromised Host | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **DENY** |
| | Restart Agent / Collect Logs | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| **SIEM & Logs** | Query Log Explorer | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** |
| **Detections & Rules** | View Detection Rules | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| | Create / Edit / Delete Rules | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **DENY** | **ALLOW** | **DENY** | **DENY** |
| | Test Rules on Telemetry | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| **Alerts** | View Alerts | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| | Triage / Acknowledge / Comment | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| | Escalate to Incident | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| **Incidents & Cases** | Declare Incident | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| | Transition Lifecycle Stage | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **ALLOW** | **DENY** | **DENY** | **DENY** |
| | Add Evidence & Case Notes | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| | Close Incident / Case | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **ALLOW** | **DENY** | **DENY** | **DENY** |
| **SOAR & Playbooks** | View Playbooks & History | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| | Create / Edit in Builder | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| | Execute Automated Actions | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **DENY** |
| | Approve / Reject in Queue | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **ALLOW** | **DENY** | **DENY** | **DENY** |
| **Simulation & Training** | Launch Simulation Lab | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| | Create / Edit Scenarios | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** |
| | Manage Cohorts & Grade | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** |
| | Submit Lab / Take Quiz | **ALLOW** | **DENY** | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** |
| **Compliance & Audit** | View Compliance Scorecard | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| | Update Control Statuses | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **ALLOW** | **DENY** |
| | View Immutable Audit Logs | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **ALLOW** | **DENY** |
| **Reporting** | Generate & Export Reports | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |

---

## 6. Multi-Tenant Isolation & Row Level Security (RLS)

### 6.1 Tenant Scoping Rules
- Every operational database table includes `organization_id UUID NOT NULL REFERENCES organizations(id)`.
- Supabase Auth JWT tokens include custom claims:
  ```json
  {
    "sub": "user-uuid-1234",
    "email": "analyst@vrsoc.app",
    "app_metadata": {
      "active_org_id": "org-uuid-5678",
      "org_role": "SOC Analyst"
    }
  }
  ```

### 6.2 Mandatory RLS Policy Architecture
Every tenant-scoped table must implement the following baseline RLS policies in PostgreSQL:

1. **Select Policy (Tenant Read)**:
   - Allows reading records where `organization_id = (current_setting('app.current_org_id'))::uuid` AND user is an active member of that organization.
2. **Insert Policy (Tenant Write)**:
   - Validates that inserted `organization_id` matches the user's active tenant AND the user holds a non-viewer role with `INSERT` capability for that resource.
3. **Update Policy (Tenant Update)**:
   - Ensures updates only target records owned by the active tenant AND user has appropriate editor/analyst role permissions.
4. **Delete Policy (Tenant Delete)**:
   - Strictly restricted to `Super Admin` (or `Instructor` for educational artifacts) within the active organization.

### 6.3 Negative Security Testing Verification Requirement
The automated test suite in Phase 08 & 39 must explicitly execute negative authorization assertions:
- **Assertion 1**: User in Org A querying `/api/alerts` with Org B's ID receives `404 Not Found` or `403 Forbidden` (zero cross-tenant data leakage).
- **Assertion 2**: Student role attempting `POST /api/agents/isolate` receives `403 Forbidden`.
- **Assertion 3**: Viewer role attempting `PATCH /api/detections/rule-1` receives `403 Forbidden`.
- **Assertion 4**: Removed organization member attempting any authenticated query is rejected immediately upon membership revocation.
