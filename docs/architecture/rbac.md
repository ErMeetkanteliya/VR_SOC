# VRSOC Architecture Specification — Role-Based Access Control (RBAC)

> **Phase:** 08 — Role-Based Access Control (RBAC)  
> **Status:** RATIFIED & IMPLEMENTED  
> **Authoritative Security Boundary:** PostgreSQL 15+ Row Level Security (RLS) + Live `public.memberships` verification + Server-Side Authorization Guards

---

## 1. Executive Summary

VRSOC implements a centralized, decoupled **Role-Based Access Control (RBAC)** architecture designed for multi-tenant cyber defense training and enterprise SecOps simulation.

Authorization is strictly permission-based and follows the formal decoupled model:

```text
User 
  → Organization Membership 
  → Assigned Role 
  → Scoped Permissions 
  → Target Resource 
  → Permitted Action (Create, Read, Update, Delete, Execute)
```

### Non-Negotiable Invariants
1. **Frontend Role Checks are UX Only**: Conditional rendering, hidden buttons, and route navigation guards provide user experience hints; they are **NEVER** the security boundary.
2. **PostgreSQL RLS & Server Guards are Authoritative**: All database mutations and API/Server Action executions validate permissions server-side against live rows in `public.memberships`.
3. **Strict Organization Scoping**: A user's role in Organization A grants zero permissions in Organization B.
4. **Anti-Self-Role Escalation**: Users cannot elevate or mutate their own role, enforced at both the PostgreSQL trigger layer and server application layer.
5. **Zero Role Hierarchy Fallbacks**: Authorization decisions evaluate explicit permissions via `hasPermission(role, permission)` rather than arbitrary numeric role hierarchies.

---

## 2. Canonical Enterprise Roles

VRSOC defines 8 distinct platform roles within each organization partition:

| Role | Persona | Scope & Primary Capabilities |
|---|---|---|
| **Super Admin** | SecOps Director / Tenant Owner | Global organization administration, user management, role assignments, API keys, system audit logs. |
| **Instructor** | Training Lead / Professor | Scenario creation, lab launching, cohort management, grading, full defensive telemetry access. |
| **Student** | Cyber Defense Trainee | Defensive alert triage, guided investigations, evidence collection, lab scenario execution, quiz taking. |
| **SOC Analyst** | Frontline Tier 1/2/3 Analyst | Real-time alert triage, incident escalation, host containment, log correlation, playbook execution. |
| **Incident Responder** | Senior Responder / Commander | Full incident handling, forensic investigation, host quarantine, case dossiers, playbook authoring and approvals. |
| **Threat Hunter** | Detection Engineer / Hunter | Raw log querying, custom Sigma detection rule engineering, MITRE technique mapping, hypothesis testing. |
| **Auditor** | GRC Analyst / Compliance Lead | Read-only access to all telemetry, compliance scorecards, control updating, immutable audit log inspection. |
| **Viewer** | Executive Stakeholder | Read-only high-level dashboards, KPI analytics, and exported summary reports. |

---

## 3. Granular Permissions Catalog

Permissions follow the standard `<domain>:<resource>:<action>` format:

```text
# Identity & Organizations
org:members:invite           # Invite new members to organization
org:members:remove           # Remove member from organization
org:members:update_role      # Assign or change member role
org:settings:manage          # Manage organization name, slug, settings
org:api_keys:manage          # Manage integration API keys

# SOC Telemetry & Agents
agents:read                  # View agent fleet status & telemetry
agents:isolate               # Quarantine compromised host from network
agents:restart               # Restart endpoint agent daemon
agents:collect_logs          # Collect live forensic endpoint bundle
telemetry:read               # Read normalized log events
telemetry:query              # Execute complex telemetry search queries

# Detections & MITRE
detections:read              # View detection rules catalog
detections:create            # Author new Sigma / YARA detection rules
detections:update            # Edit existing detection rule definitions
detections:delete            # Delete detection rules
detections:test              # Test detection rules against telemetry
mitre:read                   # View MITRE ATT&CK matrix mappings
mitre:simulate               # Simulate MITRE technique executions

# Alerts & Incidents
alerts:read                  # View security alerts feed
alerts:triage                # Acknowledge, comment, or assign alert
alerts:comment               # Add forensic comments to alert
alerts:escalate              # Escalate alert to formal incident
incidents:read               # View incident management dossiers
incidents:create             # Declare formal security incident
incidents:update_status      # Transition incident lifecycle stage
incidents:assign             # Assign lead responder to incident
incidents:close              # Close and finalize incident

# Cases & Evidence
cases:read                   # View investigation case files
cases:create                 # Open new investigation case
cases:add_evidence           # Attach forensic artifacts and indicators
cases:add_notes              # Add chronological analyst case notes
cases:close                  # Close investigation case

# SOAR & Automation
soar:playbooks:read          # View automated response playbooks
soar:playbooks:create        # Author new SOAR workflow playbooks
soar:playbooks:update        # Edit SOAR workflow graph
soar:playbooks:execute       # Trigger playbook execution
soar:actions:execute         # Execute individual containment actions
soar:approvals:manage        # Approve or reject queued SOAR actions

# Training & Simulation
simulation:scenarios:read    # View cyber range simulation scenarios
simulation:scenarios:create  # Author synthetic attack scenarios
simulation:scenarios:launch  # Launch synthetic telemetry stream
training:cohorts:manage      # Manage student cohorts and assignments
training:quizzes:take        # Submit answers to educational quizzes
training:submissions:grade   # Grade student investigation writeups

# Compliance & GRC
compliance:read              # View compliance frameworks (SOC2, NIST, ISO)
compliance:update_controls   # Update audit control implementation status
compliance:export            # Export compliance audit package

# Audit & Reporting
reports:generate             # Generate PDF/CSV analytics reports
reports:export               # Export security analytics summaries
audit:read                   # Inspect immutable platform audit events
```

---

## 4. Role-to-Permission Matrix

| Permission Domain | Action | Super Admin | Instructor | Student | SOC Analyst | Incident Responder | Threat Hunter | Auditor | Viewer |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Organization & Users** | Invite / Remove Members | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** |
| | Update Member Roles | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** |
| | Manage Settings & API Keys | **ALLOW** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** |
| **Agents & EDR** | View Fleet Telemetry | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| | Isolate Compromised Host | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **DENY** |
| | Restart Agent / Collect Logs | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| **SIEM & Logs** | Query Log Explorer | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** |
| **Detections & Rules** | View Detection Rules | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| | Create / Edit / Delete Rules | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **DENY** | **ALLOW** | **DENY** | **DENY** |
| | Test Rules on Telemetry | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
| **Alerts** | View Alerts | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| | Triage / Comment | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY** | **DENY** |
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

## 5. Security & Enforcement Architecture

### 5.1 Layer 1: PostgreSQL RLS & Database Triggers (`20260916000002_rbac_policies.sql`)
1. **Helper Function `public.has_role(org_id, allowed_roles)`**: Evaluates user's live membership record where `status = 'active'`.
2. **Anti-Self-Role Escalation Trigger `trg_prevent_self_role_escalation`**:
   ```sql
   IF NEW.user_id = auth.uid() AND OLD.role IS DISTINCT FROM NEW.role THEN
     RAISE EXCEPTION 'Privilege escalation rejected: Users cannot modify their own role.';
   END IF;
   ```
3. **Orphan Organization Protection Trigger `trg_prevent_last_admin_removal`**:
   Guarantees an organization cannot remove its last active `Super Admin`.

### 5.2 Layer 2: Server-Side Authorization Guard (`apps/web/lib/rbac/server.ts`)
```ts
export async function authorizePermission({
  organizationId,
  permission,
  supabase,
}: ServerAuthorizeOptions): Promise<ServerAuthorizeOutput>
```
1. Authenticates session via `supabase.auth.getUser()`.
2. Queries PostgreSQL `public.memberships` for live active record.
3. Evaluates `hasPermission(role, permission)`.
4. Returns typed authorization payload or throws structured `401` / `403` error.

### 5.3 Layer 3: Client UX Helper (`apps/web/lib/rbac/client.tsx`)
```tsx
<Can role={activeRole} perform="agents:isolate">
  <Button variant="destructive" onClick={handleIsolate}>Isolate Host</Button>
</Can>
```
Purely for client presentation; underlying Server Action executes `requirePermission({ organizationId, permission: "agents:isolate" })`.
