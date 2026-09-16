# VRSOC Product Specification — Functional Requirements

## 1. Document Overview

This document specifies the comprehensive functional requirements for the VRSOC SaaS platform. It synthesizes the observable user experience and interaction patterns from the Base44 reference prototype (`https://vrsoc.base44.app/`) with the enterprise multi-tenancy, telemetry simulation, educational workflows, and defensive security requirements defined in the VRSOC Master Specification (`VR_SOC.md`).

All functional domains are structured with rigorous operational definitions:
- **Purpose**: Core problem solved by the capability.
- **Actors**: System and user personas involved.
- **Inputs**: Data, triggers, and state prerequisites.
- **Outputs**: Generated artifacts, state mutations, and telemetry events.
- **Workflow**: Step-by-step operational lifecycle.
- **Business Rules**: Invariant constraints, validations, and domain logic.
- **Dependencies**: Prerequisites across the shared SOC data pipeline.
- **Security Considerations**: Multi-tenancy isolation, RBAC gating, and defensive constraints.

---

## 2. Authentication & Identity Management

### 2.1 Purpose
Provide secure, multi-tenant credential management, identity verification, session persistence, and Multi-Factor Authentication (MFA) powered natively by Supabase Auth.

### 2.2 Actors
- Unauthenticated Visitors
- All Registered Users (Students, Instructors, Analysts, Admins)
- Identity Provider (Google OAuth)

### 2.3 Inputs
- Email address, password, password confirmation.
- One-Time Password (OTP) 6-digit verification code.
- OAuth authorization tokens (Google).
- Password recovery tokens.
- Time-based One-Time Password (TOTP) MFA tokens.

### 2.4 Outputs
- JWT session tokens (`access_token`, `refresh_token`).
- Verified user profile record.
- Security audit log entries (`user.login`, `user.logout`, `user.mfa_enrolled`, `user.failed_login`).
- Redirection to dashboard (`/`) or requested deep link.

### 2.5 Workflow
1. **Registration**: User submits email + password -> Supabase creates pending user -> 6-digit OTP sent via email -> User enters code -> Account confirmed -> Default personal organization initialized.
2. **Login**: User submits credentials or clicks Google OAuth -> Supabase validates credentials/MFA -> Generates JWT with tenant metadata -> Session stored in secure HTTP-only cookies -> Redirect to active organization dashboard.
3. **Password Recovery**: User requests reset -> Email with secure time-limited token sent -> User enters new password on `/reset-password?token=...` -> Password updated -> Existing sessions invalidated.
4. **MFA Challenge**: If user has MFA enabled -> Authenticator app TOTP code requested post-credential validation -> Session issued only upon valid code verification.

### 2.6 Business Rules
- Passwords must meet minimum complexity (>= 8 characters, alphanumeric + special character).
- Rate limiting must throttle repeated failed logins (maximum 5 attempts per IP/account per 15 minutes before temporary lockout).
- User identity is tied to an internal `auth.users` UUID; all application profile metadata resides in `public.profiles`.

### 2.7 Dependencies
- Supabase Auth service.
- SMTP email delivery provider for OTP and password recovery.

### 2.8 Security Considerations
- Session tokens must be stored in secure, `SameSite=Lax`, `HttpOnly` cookies for SSR/Next.js protection.
- No client-side storage of raw passwords.
- Failed authentication triggers synthetic SIEM telemetry for self-monitoring SOC simulations.

---

## 3. Organizations, Teams & Multi-Tenancy

### 3.1 Purpose
Isolate enterprise tenants, university cohorts, and training groups into strict data partitions enforced at the database level via PostgreSQL Row Level Security (RLS).

### 3.2 Actors
- Super Admin
- Organization Admin / Instructor
- Members / Students / Analysts

### 3.3 Inputs
- Organization name, slug, billing tier, avatar.
- Member email invitations with assigned role.
- Team name, description, assigned members.

### 3.4 Outputs
- Organization record (`id`, `name`, `slug`, `created_at`).
- Membership records (`organization_id`, `user_id`, `role`, `status`).
- Team records (`id`, `organization_id`, `name`).
- Contextual JWT claims or active tenant session headers.

### 3.5 Workflow
1. User creates or is invited to an organization.
2. User selects active organization via Topbar Organization Switcher.
3. All subsequent queries, telemetry streams, alerts, cases, and logs automatically scope to the active `organization_id`.
4. Organization Admin invites members via email with role assignment (`Student`, `SOC Analyst`, `Instructor`, etc.).
5. Invitee accepts invitation -> Membership activated -> User gains tenant-scoped access.

### 3.6 Business Rules
- Every operational entity in VRSOC (assets, alerts, cases, logs, playbooks) MUST contain an `organization_id` foreign key.
- A user can belong to multiple organizations with different roles in each.
- An organization must always retain at least one Super Admin / Org Owner.

### 3.7 Dependencies
- Identity domain (`public.profiles`).
- PostgreSQL Row Level Security (RLS) policies.

### 3.8 Security Considerations
- Frontend filtering is NOT security; PostgreSQL RLS must enforce `organization_id` tenancy checks on every query.
- Cross-tenant data leaks are strictly prevented at the SQL layer.

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Purpose
Enforce least-privilege access across operational SOC tooling, educational lab controls, and administrative settings.

### 4.2 Actors
1. **Super Admin**: Complete platform & multi-tenant administrative control.
2. **Instructor**: Lab scenario creator, cohort supervisor, student progress grading.
3. **Student**: Educational lab participant, alert investigator, quiz taker.
4. **SOC Analyst (Tier 1/2/3)**: Operational alert triage, event correlation, playbook runner.
5. **Incident Responder**: Incident commander, forensic investigator, containment operator.
6. **Threat Hunter**: Deep log explorer, custom detection rule creator, IOC investigator.
7. **Auditor**: Read-only compliance reviewer, audit log inspector.
8. **Viewer**: Read-only executive dashboard and report consumer.

### 4.3 Inputs
- User membership role in the active organization.
- Resource ID and requested action (`create`, `read`, `update`, `delete`, `execute`).

### 4.4 Outputs
- Authorization decision (`ALLOW` or `DENY`).
- Conditional UI rendering (action buttons enabled/hidden).
- Audit log entry on privileged authorization attempts.

### 4.5 Business Rules
- All authorization decisions must be validated server-side (Next.js Server Actions / Supabase RLS / Edge Functions).
- Role permissions are additive per organization membership.
- Students cannot modify production detection rules or delete shared assets.
- Viewers and Auditors have strictly immutable read-only capabilities across operational tables.

### 4.6 Dependencies
- Organization membership records.
- RLS security helper functions (`current_user_has_role()`).

### 4.7 Security Considerations
- Privilege escalation attempts must log a high-severity security audit event.

---

## 5. SOC Dashboard & Situational Awareness

### 5.1 Purpose
Provide the primary real-time operational cockpit for SOC monitoring, metric visualization, active threat tracking, and quick triage actions.

### 5.2 Actors
- SOC Analysts, Incident Responders, Threat Hunters, Instructors, Viewers.

### 5.3 Inputs
- Organization-scoped live alert feed, open incidents count, active agent fleet health, MITRE ATT&CK coverage score.
- Time range filters (Last 15m, 1h, 24h, 7d).

### 5.4 Outputs
- Realtime KPI stat cards (Active Alerts, Open Incidents, Active Agents, MITRE Coverage).
- Ingestion velocity area chart and threat category breakdown donut chart.
- Recent Critical Alerts interactive table with direct "Investigate" actions.
- Quick navigation shortcuts ("Run Simulation", "Deploy Agent", "Export Report").

### 5.5 Workflow
1. User loads `/`.
2. Dashboard subscribes to Supabase Realtime channel for live alert counters and agent status changes.
3. Charts render aggregated metrics dynamically computed from organization logs and alerts.
4. Clicking "Investigate" on an alert navigates directly to Alert Details or launches the investigation drawer.

### 5.6 Business Rules
- Dashboard numbers must represent actual organization data, not hardcoded mock strings.
- Status indicator in header must display "SYSTEM OPERATIONAL - LIVE" with pulsing green/red health status based on agent fleet availability.

### 5.7 Dependencies
- Telemetry, Alerts, Incidents, and Agents domains.

### 5.8 Security Considerations
- Realtime WebSocket channels must validate tenant authorization before broadcasting state mutations.

---

## 6. Agent Management (EDR Fleet Oversight)

### 6.1 Purpose
Simulate enterprise endpoint agent fleet management, monitoring host health, OS metrics, telemetry transmission, and remote containment actions.

### 6.2 Actors
- SOC Analysts, Incident Responders, Instructors.

### 6.3 Inputs
- Agent heartbeat payloads (CPU, RAM, Disk, IP, Status, Process List).
- Admin commands (Isolate Host, Collect Triage Logs, Restart Agent, Assign Asset Group).

### 6.4 Outputs
- Agent inventory table (`hostname`, `ip_address`, `os`, `version`, `status`, `last_seen`).
- System health gauges and status indicators (`Online`, `Warning`, `Critical`, `Offline`, `Updating`).
- Host isolation state mutation on endpoint assets.

### 6.5 Workflow
1. Agent list displays all endpoints within the tenant.
2. Filter bar allows instantaneous filtering by OS (Windows, Linux, macOS), status, and search query.
3. Incident Responder clicks "Isolate Host" on compromised asset `WS-FIN-04`.
4. System sets asset containment flag -> Endpoint network traffic blocked in simulation -> Audit event logged -> Alert status updated.

### 6.6 Business Rules
- Agents missing heartbeats past configured threshold (e.g. 5 minutes) automatically transition to `Offline`.
- Isolated hosts reject outbound simulation traffic except direct SOC management telemetry.

### 6.7 Dependencies
- Asset inventory and telemetry engine.

### 6.8 Security Considerations
- Host isolation commands require `Incident Responder` or `Super Admin` role.

---

## 7. SIEM & Log Explorer

### 7.1 Purpose
High-throughput log exploration, correlation, syntax-highlighted filtering, and deep-dive forensic search across structured log sources.

### 7.2 Actors
- Threat Hunters, SOC Analysts, Students.

### 7.3 Inputs
- Search query (Lucene / SQL syntax, keywords, field filters e.g. `source:windows event_id:4625`).
- Time window selector (Last 15m, 1h, 24h, 7d, Custom Range).
- Source filter (Windows Event Log, Syslog, Firewall, DNS, Authentication, CloudTrail, Proxy).

### 7.4 Outputs
- Chronological log stream table (Timestamp, Source, Host, Severity, Summary).
- Expandable JSON log drawer revealing normalized event payload, raw message, and enrichment metadata.
- Event volume histogram over selected time range.

### 7.5 Workflow
1. User enters query or selects filter facets on `/logs`.
2. Backend queries partitioned `events` / `logs` table.
3. Stream renders matching records with syntax highlighting.
4. Expanding a log line presents complete parsed schema (e.g., `user.name`, `process.name`, `destination.ip`, `network.direction`).
5. Analyst clicks "Create Detection Rule from Query" or "Add to Case".

### 7.6 Business Rules
- Logs must adhere to a normalized schema (Elastic Common Schema / Open Cybersecurity Schema Framework aligned).
- Log retention metadata must be tracked per tenant tier.

### 7.7 Dependencies
- Telemetry ingestion pipeline and PostgreSQL indexing.

### 7.8 Security Considerations
- Sensitive fields (e.g., raw password attempts) must be redacted during normalization.

---

## 8. Threat Detection Engine

### 8.1 Purpose
Define, test, and manage automated detection rules (Sigma rules, YARA signatures, threshold triggers, and behavioral anomalies) that convert telemetry into prioritized alerts.

### 8.2 Actors
- Threat Hunters, Instructors, Super Admins.

### 8.3 Inputs
- Rule definition: Name, Description, Severity (`Critical`, `High`, `Medium`, `Low`), MITRE Technique ID, Logic expression (YAML / Sigma / SQL condition), Window duration.
- Target telemetry stream.

### 8.4 Outputs
- Active detection rule records.
- Triggered alerts dispatched to the shared alert queue.
- Rule execution telemetry (evaluations count, match count, last triggered).

### 8.5 Supported Educational Detection Catalog
1. **Authentication**: Brute force (5+ failed logins in 60s), Account lockout, Pass-the-Hash indicator.
2. **Execution**: Encoded PowerShell execution (`-EncodedCommand`), Suspicious CMD parent-child relationships.
3. **Persistence**: Registry Run key modification, Scheduled task creation in AppData.
4. **Privilege Escalation**: Token impersonation, SUID binary execution.
5. **Defense Evasion**: Security service termination, Log clearing (`wevtutil cl`).
6. **Command & Control**: High-frequency DNS TXT queries (tunneling), Unrecognized outbound beaconing.
7. **Hardware**: Unauthorized USB mass storage attachment.

### 8.6 Business Rules
- Disabled rules are excluded from live telemetry evaluation.
- Rules must map to at least one valid MITRE ATT&CK technique code.

### 8.7 Dependencies
- Telemetry pipeline and MITRE knowledge base.

### 8.8 Security Considerations
- Rule logic cannot execute arbitrary code; evaluation is sandboxed within safe query parameters.

---

## 9. Alert Management & Triage

### 9.1 Purpose
Provide end-to-end alert ingestion, severity prioritization, ownership assignment, timeline review, analyst commenting, and escalation to incident status.

### 9.2 Actors
- SOC Analysts (Tier 1/2/3), Incident Responders, Students.

### 9.3 Inputs
- Alerts generated by detection rules, simulation scenarios, or manual analyst creation.
- Triage actions: Assign user, change status (`Open`, `Acknowledged`, `In Progress`, `Closed`, `False Positive`), add comment, escalate to incident.

### 9.4 Outputs
- Updated alert state, severity badge, risk score (0-100).
- Linked incident or case record.
- Complete audit trail of analyst triage actions.

### 9.5 Workflow
1. Alert arrives in `/alerts` feed with severity badge and risk score.
2. Analyst reviews affected asset, mapped MITRE technique, and triggering telemetry logs.
3. Analyst clicks "Acknowledge" -> Status updates to `Acknowledged` -> Assigned to analyst.
4. Analyst reviews correlated events -> Determines high threat impact -> Clicks "Escalate to Incident".
5. New Incident dialog opens pre-populated with alert context.

### 9.6 Business Rules
- Escalating an alert marks the alert status as `Escalated` and links it bidirectionally to the new incident.
- Closing an alert requires a resolution reason (`Resolved`, `False Positive`, `Duplicate`, `Training Exercise`).

### 9.7 Dependencies
- Detection Engine, Assets, and Incidents domains.

### 9.8 Security Considerations
- Alert updates are restricted to tenant members with Analyst or above permissions.

---

## 10. Incident Response & Lifecycle Tracking

### 10.1 Purpose
Orchestrate structured incident handling following the NIST SP 800-61 lifecycle (Detection -> Analysis -> Containment -> Eradication -> Recovery -> Post-Incident Lessons Learned).

### 10.2 Actors
- Incident Responders, SOC Lead, Instructors.

### 10.3 Inputs
- Escalated alerts or direct incident declaration form (Title, Severity, Summary, Lead Responder, Affected Systems).
- Phase transition actions and task checklist completions.

### 10.4 Outputs
- Incident record (`INC-YYYY-XXXX`).
- Interactive Kanban lifecycle board.
- SLA countdown timer and activity timeline.
- Attached forensic evidence and case artifacts.

### 10.5 Workflow
1. Incident declared on `/incidents`.
2. Lead Responder assigned; incident appears in `Analysis` stage.
3. Responder executes playbook containment steps (e.g. Isolate DC-01, Reset compromised credentials).
4. Responder moves incident through `Containment` -> `Eradication` -> `Recovery`.
5. Post-incident review document generated with automated timeline compilation -> Incident moved to `Closed`.

### 10.6 Business Rules
- An incident cannot transition to `Closed` without completing mandatory containment and root cause summary fields.
- Incidents automatically aggregate all related alerts, assets, and affected identities.

### 10.7 Dependencies
- Alerts, Assets, Cases, and SOAR Playbooks domains.

### 10.8 Security Considerations
- High-severity incidents generate urgent notifications across configured tenant communication channels.

---

## 11. SOAR Subsystem (Orchestration & Automated Response)

### 11.1 Purpose
Replicate the comprehensive 15-screen Base44 SOAR orchestration suite, enabling automated threat enrichment, visual playbook design, AI-assisted risk scoring, human-in-the-loop approvals, and live execution streaming.

### 11.2 Actors
- SOC Analysts, Incident Responders, Instructors, Super Admins.

### 11.3 Subsystem Modules & Capabilities
1. **SOAR Dashboard (`/soar`)**: Realtime overview of automation rate, executed playbooks, pending approvals, and MTTR reduction.
2. **Automation Pipeline (`/soar/automation`)**: Visual 5-stage runner (Ingestion -> Normalization -> Threat Enrichment -> AI Decision -> Automated Response) with live pulse indicators.
3. **Playbooks Catalog (`/soar/playbooks`)**: Catalog of 20+ automated workflows (Brute Force Response, Ransomware Containment, Phishing Triage, Malicious IP Block, etc.) with trigger rules and simulation modes.
4. **Visual Playbook Builder (`/soar/builder`)**: Interactive node graph designer (Trigger, Threat Intel, Condition, AI Decision, Firewall Block, Endpoint Isolate, Ticket Create, Notification, End).
5. **Threat Enrichment (`/soar/enrichment`)**: Multi-source IOC intelligence aggregation (VirusTotal, AbuseIPDB, AlienVault OTX, Shodan).
6. **AI Decision Engine (`/soar/ai-engine`)**: Configurable risk-weight matrix (Known Malware +40, Impossible Travel +25, Critical Asset +20) mapping to 5 automated action tiers.
7. **Response Actions (`/soar/actions`)**: Direct execution catalog for Network, Endpoint, IAM, and Communication containment primitives.
8. **Human Approvals Queue (`/soar/approvals`)**: Authorization queue for high-impact actions (e.g. Isolate Domain Controller) with Approve/Reject workflows.
9. **Live Execution Stream (`/soar/live`)**: Terminal-style real-time log runner streaming execution steps.
10. **SOAR History & Cases (`/soar/history`, `/soar/cases`)**: Execution audit records and SOAR-generated case records.
11. **SOAR Simulation (`/soar/simulation`)**: Interactive scenario trigger linking directly into the shared telemetry stream.
12. **SOAR Settings (`/soar/settings`)**: Automation modes (Manual, Semi-Automatic, Fully Automatic) and approval timeout thresholds.

### 11.4 Business Rules
- High-impact actions (Host Isolation, Firewall Rule Modification) in `Semi-Automatic` mode MUST halt and generate an entry in `/soar/approvals` before proceeding.
- Live execution streaming must dispatch step-by-step logs over Supabase Realtime / Server-Sent Events.

### 11.5 Dependencies
- Threat Intelligence, Alerts, Assets, and Telemetry engine.

### 11.6 Security Considerations
- Approval tokens are single-use, cryptographically verified, and audit-logged.

---

## 12. MITRE ATT&CK Center

### 12.1 Purpose
Interactive enterprise matrix navigation, coverage visualization, technique-to-rule mapping, and simulation scenario testing across the MITRE ATT&CK Enterprise framework.

### 12.2 Actors
- Threat Hunters, SOC Analysts, Instructors, Students.

### 12.3 Inputs
- MITRE Matrix framework data (14 Tactics: Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Command and Control, Exfiltration, Impact, etc.).
- Active tenant detection rules and simulation scenarios.

### 12.4 Outputs
- Visual Matrix Grid with per-tactic coverage heatmaps and percentages.
- Interactive Technique Detail Drawer: Technique description, Sigma detection rules, sub-techniques, mitigations, and "Launch Simulation Test" action.

### 12.5 Business Rules
- Coverage percentage is calculated dynamically based on enabled detection rules mapped to each tactic's techniques.
- Clicking a technique reveals real-time alert history associated with that technique in the current tenant.

### 12.6 Dependencies
- Detection rules and Telemetry domains.

---

## 13. Threat Intelligence & Threat Hunting

### 13.1 Purpose
Provide an IOC lookup engine (IP, Domain, URL, Hash, Email) and an active hunting workspace that queries across endpoint, network, and identity telemetry to uncover stealthy adversary activity.

### 13.2 Actors
- Threat Hunters, Incident Responders.

### 13.3 Inputs
- Search observables: SHA256 hashes, IPv4/IPv6 addresses, FQDNs, user handles, process names.
- Hunting hypotheses and queries.

### 13.4 Outputs
- Correlated Hunting Workspace: Related Alerts, Chronological Telemetry Timeline, Affected Assets, User Identities, Attack Graph, Evidence Notebook.
- Threat Intelligence reputation cards (VirusTotal score, AbuseIPDB confidence, threat actor attribution).

### 13.5 Workflow
1. Hunter inputs suspicious hash or IP into `/threat-hunting`.
2. Workspace executes federated search across logs, process trees, network flows, and alerts.
3. System visualizes attack path and affected blast radius.
4. Hunter tags findings as "Evidence" and exports directly to a Case Dossier.

---

## 14. Educational Simulation Lab & Training Engine

### 14.1 Purpose
Allow instructors and students to execute realistic, defensive-only cyber incident simulations that flow through the shared telemetry pipeline, test student investigation competence, and track educational progress.

### 14.2 Actors
- Instructors, Students.

### 14.3 Inputs
- Scenario catalog selection (Brute Force, Encoded PowerShell, Scheduled Task Persistence, USB Exfiltration, DNS Tunneling, Ransomware Pre-cursor).
- Student quiz answers, investigation notes, and lab completion submissions.

### 14.4 Outputs
- Synthetic telemetry stream injected into the live SIEM/EDR database.
- Real detection alerts triggered for student triage.
- Student scoring, lab attempt records, quiz results, and cohort progress analytics.

### 14.5 Educational Rules
- NO offensive hacking tools, malware generation, or exploit delivery are permitted; all adversarial events are safely simulated via synthesized logs and telemetry.
- Every scenario must provide educational debriefs explaining the MITRE technique, root cause, detection logic, and defensive containment.

### 14.6 Dependencies
- Telemetry simulation engine, Knowledge Center, Detection Engine.

---

## 15. Knowledge Center & Educational Content

### 15.1 Purpose
Structured educational repository providing in-depth articles, architectural diagrams, defensive playbooks, and quizzes covering 24+ core cybersecurity topics.

### 15.2 Actors
- Students, Analysts, Instructors.

### 15.3 Content Catalog
- SOC Foundations, SIEM Architecture, SOAR Automation, EDR/XDR, NDR, Threat Intelligence & IOCs, MITRE ATT&CK, Sigma Rules, YARA Signatures, CVE & CVSS, OWASP Top 10, Incident Response (NIST), Digital Forensics, Windows Event Logs, Linux Auditing, Zero Trust Architecture, Cloud Security.

### 15.4 Features
- Category and difficulty filter badges (`Beginner`, `Intermediate`, `Advanced`).
- Markdown article reader with syntax highlighting, visual diagrams, and embedded quiz checkpoints.
- Student reading progress and bookmarking.

---

## 16. Compliance & Vulnerability Management

### 16.1 Purpose
Provide enterprise compliance posture tracking (ISO/IEC 27001, NIST CSF, PCI DSS, HIPAA, GDPR, CIS Controls) and CVE/CVSS vulnerability tracking linked to asset inventory.

### 16.2 Features
- **Compliance Center**: Framework scorecards, control pass/fail status, automated audit evidence mapping from telemetry, and remediation recommendations.
- **Vulnerability Management**: Asset CVE tracking, CVSS 3.1 score distribution, patch status (`Unpatched`, `In Progress`, `Patched`), and exploit availability flags.

---

## 17. Malware Analysis & File Integrity Monitoring (FIM)

### 17.1 Purpose
Defensive, simulated static and sandbox malware analysis reporting alongside real-time endpoint file integrity monitoring.

### 17.2 Features
- **Malware Analysis**: Simulated sample reports (MD5/SHA256, File size, Digital signature status, Behavioral analysis, Dropped files, Network C2 beacons, YARA matches).
- **FIM**: Real-time tracking of file creations, deletions, modifications, and permission tampering across critical system directories (`/etc/`, `C:\Windows\System32\`, web roots).

---

## 18. Analytics, Reporting & Audit Center

### 18.1 Purpose
Aggregate operational SOC metrics, generate executive/technical compliance reports in PDF/CSV/JSON, and maintain an immutable audit trail of all platform actions.

### 18.2 Capabilities
- **Analytics**: MTTD, MTTR, triage volume, alert severity trends, MITRE coverage trends.
- **Reporting Engine**: One-click generation of Executive Summaries, Technical Incident Dossiers, and Compliance Audit Packages.
- **Audit Center**: Immutable append-only log of user logins, rule updates, isolation commands, and playbook executions.

---

## 19. AI Security Assistant

### 19.1 Purpose
Context-aware conversational cybersecurity educator and investigation assistant grounded in active VRSOC tenant data.

### 19.2 Capabilities
- Ingests structured context (Alert metadata, triggering log samples, affected asset profile, MITRE technique, active case notes).
- Explains:
  1. What occurred and why the alert triggered.
  2. The threat mechanism and potential adversary objectives.
  3. Step-by-step investigation queries for the analyst.
  4. Defensive containment and remediation guidance.
  5. Related Knowledge Center articles for deeper study.
- **Strict Guardrails**: Refuses requests to generate malicious code, exploits, or offensive attack tools.
