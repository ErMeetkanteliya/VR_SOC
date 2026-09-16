# VRSOC Product Specification — Acceptance Criteria

## 1. Document Overview

This document specifies the testable, unambiguous acceptance criteria for the VRSOC platform rebuild. Every criterion is formulated as an objective verification assertion that can be evaluated via automated unit/integration tests, Playwright end-to-end browser suites, or security penetration tests.

---

## 2. Authentication & Identity Acceptance Criteria

- [ ] **AC-AUTH-01**: A new user can register with an email and password, receive a 6-digit OTP verification code via email, and activate their account upon entering the valid code.
- [ ] **AC-AUTH-02**: An unauthenticated user cannot access protected routes (e.g. `/`, `/alerts`, `/agents`, `/soar`) and is immediately redirected to `/login`.
- [ ] **AC-AUTH-03**: A user entering invalid credentials receives a clear error banner without disclosing whether the email or password was incorrect.
- [ ] **AC-AUTH-04**: A user submitting 5 consecutive invalid login attempts within 15 minutes is temporarily throttled with a rate-limit error response.
- [ ] **AC-AUTH-05**: An authenticated user with MFA enabled is prompted for their 6-digit TOTP code and is denied session tokens until valid code submission.
- [ ] **AC-AUTH-06**: Clicking "Continue with Google" successfully initiates OAuth redirection and creates/links a user profile upon successful provider callback.

---

## 3. Multi-Tenancy & Tenant Isolation Acceptance Criteria

- [ ] **AC-TENANT-01**: A user belonging to Organization A cannot read, query, update, or delete any record (alert, incident, agent, log, case, rule) belonging to Organization B.
- [ ] **AC-TENANT-02**: Direct SQL queries or API calls bypassing frontend parameters using another tenant's `organization_id` return zero records or `403 Forbidden` via PostgreSQL RLS.
- [ ] **AC-TENANT-03**: Switching the active organization in the Topbar Organization Switcher immediately updates all dashboard counters, alert feeds, and telemetry streams to the newly selected organization.
- [ ] **AC-TENANT-04**: An organization admin can invite a new user by email with a designated role; the invitation token expires automatically after 7 days.
- [ ] **AC-TENANT-05**: Revoking a user's membership in Organization A immediately blocks their access to Organization A's resources on their next request.

---

## 4. Role-Based Access Control (RBAC) Acceptance Criteria

- [ ] **AC-RBAC-01**: A user with the `Student` role cannot modify detection rules, delete assets, approve SOAR firewall blocks, or modify organization settings.
- [ ] **AC-RBAC-02**: A user with the `Viewer` or `Auditor` role has strictly read-only capabilities and receives `403 Forbidden` upon attempting any `INSERT`, `UPDATE`, or `DELETE` mutation on operational SOC tables.
- [ ] **AC-RBAC-03**: An `Incident Responder` or `SOC Analyst` can acknowledge alerts, post analyst comments, escalate alerts to incidents, and execute containment actions.
- [ ] **AC-RBAC-04**: An `Instructor` can create simulation cohorts, launch scenarios, and grade student lab submissions.
- [ ] **AC-RBAC-05**: A `Super Admin` can perform all administrative, operational, and tenant management actions.

---

## 5. Agent Management & EDR Acceptance Criteria

- [ ] **AC-AGENT-01**: The `/agents` view renders the complete inventory of monitored endpoints with hostname, IP address, OS type/version, CPU/RAM/Disk gauges, and relative last-seen timestamps.
- [ ] **AC-AGENT-02**: An agent failing to report heartbeats within 5 minutes automatically transitions from `Online` to `Offline` status.
- [ ] **AC-AGENT-03**: Triggering "Isolate Host" on asset `WS-FIN-04` sets `is_isolated = true`, emits a critical security alert, logs an audit record, and updates the UI status badge to a glowing red `Isolated` tag.
- [ ] **AC-AGENT-04**: Filter dropdowns for OS (Windows, Linux, macOS) and Status (Online, Offline, Warning, Isolated) filter the table dynamically without page reload.

---

## 6. Threat Detection & Alert Triage Acceptance Criteria

- [ ] **AC-ALERT-01**: A triggered detection rule generates an alert containing: Alert Title, Severity (`Critical`, `High`, `Medium`, `Low`), Risk Score (0-100), Mapped MITRE Technique ID, Affected Asset, and Timestamp.
- [ ] **AC-ALERT-02**: Clicking an alert row opens an investigation drawer containing the parsed triggering log JSON, asset profile, MITRE technique guidance, and analyst comments feed.
- [ ] **AC-ALERT-03**: Clicking "Acknowledge" updates alert status from `Open` to `Acknowledged` and assigns ownership to the current user.
- [ ] **AC-ALERT-04**: Clicking "Escalate to Incident" opens the incident declaration dialog pre-populated with alert details; completing the dialog creates an incident record and updates the alert status to `Escalated`.

---

## 7. SIEM & Log Explorer Acceptance Criteria

- [ ] **AC-LOG-01**: The `/logs` view renders normalized event records with timestamps, log source badges (Windows, Syslog, Firewall, DNS), hostnames, and message summaries.
- [ ] **AC-LOG-02**: Expanding any log row reveals the complete, formatted JSON representation of the normalized telemetry payload.
- [ ] **AC-LOG-03**: Submitting a search query (e.g. `source:auth event_id:4625`) filters matching records within the selected time window (15m, 1h, 24h, 7d).

---

## 8. Incident & Case Management Acceptance Criteria

- [ ] **AC-INC-01**: Incidents are displayed in an interactive Kanban board categorized across NIST SP 800-61 stages (`Detection`, `Analysis`, `Containment`, `Eradication`, `Recovery`, `Lessons Learned`, `Closed`).
- [ ] **AC-INC-02**: Moving an incident card across stages updates the incident `stage` in the database and logs a stage-transition audit event.
- [ ] **AC-CASE-01**: An analyst can create an Investigation Case, link multiple related alerts, attach tagged forensic evidence items, and record markdown analyst notes.

---

## 9. Simulation Engine & Training Acceptance Criteria

- [ ] **AC-SIM-01**: Launching a scenario (e.g. *Brute Force Attack*) from `/soar/simulation` dispatches synthetic telemetry directly into the shared `public.events` / `public.logs` pipeline.
- [ ] **AC-SIM-02**: Synthetic simulation events evaluate against active Sigma detection rules and trigger corresponding alerts in `/alerts` with full MITRE mappings.
- [ ] **AC-SIM-03**: Ingested simulation telemetry streams into the live terminal console (`/soar/live`) with real-time step progressions.
- [ ] **AC-TRAIN-01**: A student can open an assigned lab, review the mission brief, conduct queries in the SIEM, tag evidence items, and submit their investigative findings.
- [ ] **AC-TRAIN-02**: Upon lab submission, the automated scoring engine grades the student's solution, updates their progress score, and presents an educational debrief panel.

---

## 10. SOAR Subsystem Acceptance Criteria

- [ ] **AC-SOAR-01**: The `/soar/playbooks` catalog displays all 20+ automated response playbooks with category filters and trigger badges.
- [ ] **AC-SOAR-02**: High-impact automated actions (e.g. Isolate Domain Controller) executed in Semi-Automatic mode pause execution and generate a pending entry in `/soar/approvals`.
- [ ] **AC-SOAR-03**: Approving or rejecting an item in `/soar/approvals` resumes or terminates the playbook run and writes an auditable decision log with approver identity.
- [ ] **AC-SOAR-04**: The Visual Playbook Builder (`/soar/builder`) allows users to connect trigger, threat intel, condition, AI decision, action, and end nodes into a valid workflow graph.

---

## 11. AI Security Assistant Acceptance Criteria

- [ ] **AC-AI-01**: The AI Security Assistant (`/ai-assistant`) consumes structured active SOC context (alert metadata, triggering logs, asset profile, MITRE technique).
- [ ] **AC-AI-02**: The AI assistant provides structured educational explanations: root cause analysis, threat mechanisms, investigation queries, and defensive containment steps.
- [ ] **AC-AI-03**: The AI assistant strictly rejects prompts requesting exploit code generation, malware compilation, or offensive hacking instructions.

---

## 12. Base44 Visual & UX Parity Acceptance Criteria

- [ ] **AC-UI-01**: All 32 reachable routes extracted during Phase 00 are functional and accessible in the target application.
- [ ] **AC-UI-02**: The dark cybersecurity aesthetic, `#0A0A0A` background, `#161616` card glassmorphism, `#5B0A0A` / `#E53935` primary accents, and severity badge color matrices match the Base44 reference.
- [ ] **AC-UI-03**: All interactive tables, drawers, modals, tabs, command palette (`Ctrl+K`), and collapsible sidebar behaviors function with visual parity to Base44.
