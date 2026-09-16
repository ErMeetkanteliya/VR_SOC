# VRSOC Product Specification — Data Requirements

## 1. Document Overview

This document specifies the conceptual domain data model for the VRSOC SaaS platform. It synthesizes the entities observed during Phase 00 reverse engineering with the relational multi-tenant architecture and telemetry pipeline required by the VRSOC Master Specification (`VR_SOC.md`).

> **Phase Constraint**: This document defines the **conceptual domain models, relationships, tenant scopes, and lifecycle states**. No physical database migrations, SQL DDL scripts, or indexes are created during Phase 01.

---

## 2. Core Entity Architecture & Tenant Hierarchy

All operational entities within VRSOC adhere to a strict tenant hierarchy rooted in `Organization`:

```text
Organization (Tenant Root)
  ├── Memberships & Teams ──> Users / Profiles
  ├── Assets ──> Agents ──> Identities
  ├── Events / Logs ──> Telemetry (Processes, Network, Files)
  ├── Detection Rules ──> Alerts ──> Incidents ──> Cases ──> Evidence & Timeline
  ├── MITRE Mappings ──> Threat Intelligence (IOCs)
  ├── Compliance Controls & Vulnerabilities & Malware & FIM
  ├── Simulation Scenarios ──> Runs ──> Cohorts & Quizzes ──> Student Progress
  └── Reports, Notifications, API Keys, Audit Events
```

---

## 3. Identity, Tenancy & Access Entities

### 3.1 `Organization`
- **Purpose**: Top-level tenant boundary isolating all enterprise data, telemetry, and users.
- **Tenant Scope**: Tenant Root.
- **Attributes**: `id` (UUID), `name`, `slug`, `billing_tier`, `created_at`, `updated_at`.
- **Relationships**: One-to-many with `Membership`, `Team`, `Asset`, `Alert`, `Incident`, `Log`.

### 3.2 `Profile`
- **Purpose**: Application-level user profile extending the base Supabase `auth.users` identity.
- **Tenant Scope**: Cross-tenant user identity (mapped to organizations via memberships).
- **Attributes**: `id` (UUID matching `auth.users`), `email`, `full_name`, `avatar_url`, `created_at`.
- **Relationships**: One-to-many with `Membership`, `Alert` (as assignee), `CaseNote` (as author).

### 3.3 `Membership`
- **Purpose**: Association between a user and an organization, defining their tenant-scoped RBAC role.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `user_id`, `role` (`Super Admin`, `Instructor`, `Student`, `SOC Analyst`, `Incident Responder`, `Threat Hunter`, `Auditor`, `Viewer`), `status` (`Active`, `Suspended`, `Invited`), `joined_at`.
- **Relationships**: Belongs to `Organization` and `Profile`.

### 3.4 `Team`
- **Purpose**: Sub-organizational grouping for SOC shifts, student cohorts, or engineering units.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `name`, `description`, `created_at`.
- **Relationships**: Belongs to `Organization`; Many-to-many with `Profile`.

### 3.5 `Invitation`
- **Purpose**: Secure tokenized email invite granting entry and role assignment to a new member.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `email`, `role`, `token`, `expires_at`, `created_by`.
- **Lifecycle**: `Pending` -> `Accepted` | `Expired` | `Revoked`.

---

## 4. Asset & Telemetry Entities

### 4.1 `Asset`
- **Purpose**: Hardware, virtual machine, cloud instance, or container monitored by the SOC.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `asset_group_id`, `hostname`, `ip_address`, `mac_address`, `os_type` (`Windows`, `Linux`, `macOS`), `os_version`, `criticality` (`Low`, `Medium`, `High`, `Critical`), `is_isolated` (Boolean), `created_at`.
- **Lifecycle**: `Active` -> `Warning` -> `Isolated` -> `Decommissioned`.

### 4.2 `Agent`
- **Purpose**: EDR sensor daemon installed on an asset transmitting health heartbeats and telemetry.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `asset_id`, `agent_version`, `status` (`Online`, `Warning`, `Critical`, `Offline`, `Updating`), `cpu_usage_pct`, `ram_usage_pct`, `disk_usage_pct`, `last_seen_at`.
- **Relationships**: One-to-one with `Asset`.

### 4.3 `Identity`
- **Purpose**: Monitored corporate user or service account active within the simulated environment.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `username`, `email`, `department`, `account_type` (`User`, `Admin`, `Service`), `is_locked` (Boolean), `last_login_at`.

### 4.4 `Event / Log`
- **Purpose**: Normalized security telemetry log ingested from endpoint, network, and cloud sensors.
- **Tenant Scope**: Organization-scoped (Partitioned).
- **Attributes**: `id`, `organization_id`, `timestamp`, `source_type` (`WindowsEventLog`, `Syslog`, `Firewall`, `DNS`, `Auth`, `EDR`, `CloudTrail`), `event_id`, `severity` (`Informational`, `Low`, `Medium`, `High`, `Critical`), `asset_id`, `identity_id`, `raw_payload` (JSONB), `normalized_fields` (JSONB: `process_name`, `cmdline`, `src_ip`, `dst_ip`, `src_port`, `dst_port`, `file_hash`).
- **Relationships**: Belongs to `Organization`, references `Asset` and `Identity`.

---

## 5. Detection & Threat Entities

### 5.1 `DetectionRule`
- **Purpose**: Sigma, YARA, or behavioral rule evaluating telemetry streams to generate alerts.
- **Tenant Scope**: Organization-scoped (plus global platform templates).
- **Attributes**: `id`, `organization_id`, `name`, `description`, `rule_type` (`Sigma`, `YARA`, `Behavioral`, `Threshold`), `severity` (`Critical`, `High`, `Medium`, `Low`), `mitre_technique_id`, `query_logic` (Text / YAML), `is_enabled` (Boolean), `eval_frequency_seconds`, `last_triggered_at`.
- **Relationships**: References `MitreTechnique`; Has many `Alert`.

### 5.2 `MitreTechnique`
- **Purpose**: Canonical MITRE ATT&CK reference data representing tactics and techniques.
- **Tenant Scope**: Global Platform Catalog.
- **Attributes**: `id` (e.g. `T1059.001`), `tactic` (`Initial Access`, `Execution`, `Persistence`, etc.), `name`, `description`, `url`, `detection_guidance`, `mitigations`.
- **Relationships**: Has many `DetectionRule`, `Alert`, `SimulationScenario`.

### 5.3 `ThreatIntelligence (IOC)`
- **Purpose**: Indicator of Compromise record enriched with reputation scores.
- **Tenant Scope**: Organization-scoped + Global Feed.
- **Attributes**: `id`, `organization_id`, `ioc_type` (`IP`, `Domain`, `URL`, `SHA256`, `MD5`, `Email`), `value`, `threat_actor`, `confidence_score` (0-100), `reputation_source` (VirusTotal, AbuseIPDB, AlienVault), `is_malicious` (Boolean).

---

## 6. Alert, Incident & Case Entities

### 6.1 `Alert`
- **Purpose**: Prioritized security alert raised by a detection rule or simulation scenario.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `alert_code` (`ALT-2026-XXXX`), `rule_id`, `title`, `description`, `severity` (`Critical`, `High`, `Medium`, `Low`), `risk_score` (0-100), `status` (`Open`, `Acknowledged`, `In Progress`, `Escalated`, `Closed`, `False Positive`), `asset_id`, `identity_id`, `mitre_technique_id`, `assignee_id`, `triggered_at`, `closed_at`.
- **Lifecycle**: `Open` -> `Acknowledged` -> `In Progress` -> `Escalated` | `Closed` | `False Positive`.
- **Relationships**: Has many `AlertComment`, `AlertHistory`; Belongs to `Incident` (optional).

### 6.2 `AlertComment`
- **Purpose**: Analyst notes and findings added during alert triage.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `alert_id`, `author_id`, `content` (Markdown), `created_at`.

### 6.3 `Incident`
- **Purpose**: Formally declared security incident managed through the NIST SP 800-61 lifecycle.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `incident_number` (`INC-2026-XXXX`), `title`, `summary`, `severity` (`Critical`, `High`, `Medium`, `Low`), `stage` (`Detection`, `Analysis`, `Containment`, `Eradication`, `Recovery`, `Lessons Learned`, `Closed`), `lead_responder_id`, `sla_deadline_at`, `declared_at`, `closed_at`.
- **Lifecycle**: `Detection` -> `Analysis` -> `Containment` -> `Eradication` -> `Recovery` -> `Lessons Learned` -> `Closed`.
- **Relationships**: Many-to-many with `Alert`, `Asset`; Has many `Case`, `IncidentTask`.

### 6.4 `Case`
- **Purpose**: Comprehensive investigation dossier binding incidents, evidence, IOCs, and timelines.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `case_number` (`CASE-2026-XXXX`), `incident_id`, `title`, `description`, `priority` (`P1`, `P2`, `P3`, `P4`), `status` (`Open`, `Active`, `Closed`), `created_by`, `created_at`.
- **Relationships**: Has many `CaseEvidence`, `CaseNote`, `CaseTimelineEntry`.

### 6.5 `CaseEvidence`
- **Purpose**: Tagged forensic evidence artifacts attached to an active investigation case.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `case_id`, `evidence_type` (`LogRecord`, `IOC`, `ProcessSnapshot`, `FileHash`, `NetworkFlow`), `reference_id`, `description`, `tagged_by`, `created_at`.

---

## 7. SOAR & Automation Entities

### 7.1 `Playbook`
- **Purpose**: Automated response workflow definition composed of trigger, decision, and action nodes.
- **Tenant Scope**: Organization-scoped + Global Templates.
- **Attributes**: `id`, `organization_id`, `name`, `category` (`Brute Force`, `Ransomware`, `Phishing`, `Malware`), `trigger_type` (`Alert`, `Manual`, `Schedule`), `is_active` (Boolean), `workflow_graph` (JSONB node/edge schema), `created_at`.
- **Relationships**: Has many `PlaybookExecution`.

### 7.2 `PlaybookExecution`
- **Purpose**: Historical audit record of an automated or simulated playbook run.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `playbook_id`, `trigger_event_id`, `status` (`Running`, `Waiting Approval`, `Completed`, `Failed`), `execution_log` (JSONB stream), `started_at`, `completed_at`.

### 7.3 `ApprovalRequest`
- **Purpose**: Human-in-the-loop authorization gate for high-impact automated response actions.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `execution_id`, `action_name` (`Isolate Host`, `Firewall Block IP`, `Disable User`), `target_resource`, `status` (`Pending`, `Approved`, `Rejected`), `approver_id`, `decision_reason`, `decided_at`.

---

## 8. Simulation & Educational Training Entities

### 8.1 `SimulationScenario`
- **Purpose**: Safe educational cyber scenario injecting synthetic telemetry into the SOC pipeline.
- **Tenant Scope**: Global Catalog + Organization Custom.
- **Attributes**: `id`, `title`, `description`, `difficulty` (`Beginner`, `Intermediate`, `Advanced`), `category` (`Authentication`, `Endpoint Execution`, `Persistence`, `Exfiltration`), `mitre_technique_id`, `telemetry_script` (JSONB event sequence), `expected_alert_title`, `created_at`.
- **Relationships**: Has many `SimulationRun`.

### 8.2 `SimulationRun`
- **Purpose**: An active or completed execution of a simulation scenario within a tenant.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `scenario_id`, `launched_by`, `status` (`Queued`, `Injecting`, `Completed`, `Failed`), `events_generated_count`, `alerts_fired_count`, `started_at`, `completed_at`.

### 8.3 `Cohort`
- **Purpose**: Class or training group supervised by instructors.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `name`, `instructor_id`, `created_at`.
- **Relationships**: Many-to-many with `Profile` (students); Has many `CohortAssignment`.

### 8.4 `StudentProgress & Submission`
- **Purpose**: Tracks student lab investigation answers, query logs, quiz scores, and scenario completions.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `student_id`, `scenario_id` / `quiz_id`, `score` (0-100), `answers` (JSONB), `instructor_feedback`, `status` (`In Progress`, `Submitted`, `Graded`), `submitted_at`.

---

## 9. Compliance, Vulnerability, Malware & Audit Entities

### 9.1 `ComplianceFramework & Control`
- **Purpose**: Standard security frameworks (ISO 27001, NIST CSF, PCI DSS) and specific clauses.
- **Attributes**: `id`, `framework_name`, `control_code` (`A.12.4.1`), `title`, `description`, `status` (`Passed`, `Failed`, `Needs Review`), `mapped_evidence_query`.

### 9.2 `Vulnerability (CVE)`
- **Purpose**: Security vulnerabilities mapped to monitored tenant assets.
- **Attributes**: `id`, `organization_id`, `cve_id` (`CVE-2026-1842`), `asset_id`, `cvss_score` (e.g. `9.8`), `severity` (`Critical`, `High`, `Medium`, `Low`), `patch_status` (`Unpatched`, `In Progress`, `Patched`), `is_exploitable` (Boolean).

### 9.3 `AuditEvent`
- **Purpose**: Append-only immutable log of critical administrative, operational, and security actions.
- **Tenant Scope**: Organization-scoped.
- **Attributes**: `id`, `organization_id`, `actor_id`, `action` (`user.login`, `agent.isolate`, `rule.create`, `incident.close`), `resource_type`, `resource_id`, `ip_address`, `user_agent`, `details` (JSONB), `created_at`.
