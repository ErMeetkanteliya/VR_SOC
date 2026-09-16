# VRSOC Product Specification — User Flows

## 1. Document Overview

This document specifies the end-to-end user and operational workflows across the VRSOC platform. Each workflow models the complete state transition sequence following the formal lifecycle format:

```text
START
  → ACTION
  → UI RESPONSE
  → DATA CHANGE
  → NAVIGATION
  → NEXT ACTION
```

---

## 2. Authentication Flow

```text
START: Unauthenticated user navigates to https://vrsoc.app/login
  → ACTION: User enters email and password, clicks "Log in" (or clicks "Continue with Google")
  → UI RESPONSE: Submit button displays loading spinner; form inputs are disabled
  → DATA CHANGE: Supabase Auth validates credentials; generates JWT access_token & refresh_token; sets HttpOnly session cookies; creates/updates public.profiles entry; writes user.login audit event
  → NAVIGATION: Browser redirects from /login to / (SOC Dashboard)
  → NEXT ACTION: User lands on SOC Dashboard with active organization telemetry loaded
```

---

## 3. Organization Onboarding Flow

```text
START: New authenticated user has no existing organization membership
  → ACTION: User enters Organization Name (e.g. "Cyber Defense Academy"), selects tier, and clicks "Create Organization"
  → UI RESPONSE: Modal shows initialization progress bar ("Provisioning tenant database partition...")
  → DATA CHANGE: Inserts new record in public.organizations; inserts public.memberships record setting user as 'Super Admin'; creates default asset groups ('Domain Controllers', 'Workstations', 'Servers'); seeds baseline detection rules
  → NAVIGATION: Modal closes; Topbar Organization Switcher updates to newly created organization; page refreshes dashboard context
  → NEXT ACTION: User proceeds to invite team members or deploy initial agents
```

---

## 4. User Invitation Flow

```text
START: Organization Admin navigates to /settings (Team tab)
  → ACTION: Admin enters member email ("student1@university.edu"), selects role ("Student"), and clicks "Send Invitation"
  → UI RESPONSE: Success toast notification "Invitation dispatched to student1@university.edu"; pending invite added to table
  → DATA CHANGE: Inserts record in public.invitations with cryptographic token and 7-day expiration; sends email with accept link; writes audit log entry
  → NAVIGATION: Invitee clicks link in email, navigating to /register?invite=...
  → NEXT ACTION: Invitee sets password -> Inserts record in public.memberships with 'Student' role -> Lands on student workspace
```

---

## 5. Agent Management & Host Isolation Flow

```text
START: SOC Analyst observes suspicious outbound traffic from host WS-FIN-04 on /agents
  → ACTION: Analyst clicks actions menu on WS-FIN-04 row and selects "Isolate Host"
  → UI RESPONSE: Confirmation modal appears: "Are you sure you want to isolate WS-FIN-04 from the network? All traffic except SOC telemetry will be dropped."
  → ACTION: Analyst enters isolation reason ("Ransomware pre-cursor detected") and clicks "Confirm Isolation"
  → DATA CHANGE: Asset WS-FIN-04 status updated to 'Isolated'; inserts asset_containment record; generates asset.isolated telemetry event; triggers critical alert in /alerts; logs audit trail
  → NAVIGATION: Agent status badge in table turns glowing red with 'Isolated' tag
  → NEXT ACTION: Analyst navigates to /alerts to investigate the root cause
```

---

## 6. Alert Triage Flow

```text
START: SOC Analyst views /alerts with 5 critical alerts pending triage
  → ACTION: Analyst clicks on alert "Brute Force Authentication Attack (DC-01)"
  → UI RESPONSE: Investigation drawer slides out from right showing Risk Score 95/100, mapped MITRE T1110, triggering Windows Event 4625 logs, and asset DC-01 profile
  → ACTION: Analyst clicks "Acknowledge" button
  → DATA CHANGE: Alert status changes from 'Open' to 'Acknowledged'; assignee_id set to current user; writes alert.acknowledged event to alert_history
  → NAVIGATION: Drawer reflects 'Acknowledged' state and displays Analyst Comment input
  → NEXT ACTION: Analyst posts investigative finding: "Repeated failed logins from IP 198.51.100.24 targeting svc_backup"
```

---

## 7. Alert to Incident Escalation Flow

```text
START: Analyst triaging alert "Brute Force Authentication Attack" determines high severity adversary penetration
  → ACTION: Analyst clicks "Escalate to Incident" button in Alert drawer
  → UI RESPONSE: "Declare Incident" dialog opens, pre-populated with alert title, severity 'Critical', affected asset 'DC-01', and triggering log timestamps
  → ACTION: Analyst selects Lead Responder ("Alex Mercer"), sets incident summary, and clicks "Declare Incident"
  → DATA CHANGE: Inserts new record in public.incidents (INC-2026-0342); updates alert status to 'Escalated'; creates bidirectional link in alert_incidents table; triggers incident.created notification to on-call team
  → NAVIGATION: Redirects to /incidents with new incident card highlighted in 'Analysis' column
  → NEXT ACTION: Lead Responder begins incident containment checklist
```

---

## 8. Incident to Case Dossier Flow

```text
START: Incident Responder handling INC-2026-0342 on /incidents
  → ACTION: Responder clicks "Create Investigation Case" on incident detail view
  → UI RESPONSE: Modal confirms Case creation linking INC-2026-0342 and associated alerts
  → DATA CHANGE: Inserts record in public.cases (CASE-2026-0089); attaches related alerts, assets, and IOCs as evidence records in case_evidence; initializes Case Timeline
  → NAVIGATION: Redirects to /cases (or /soar/cases) with CASE-2026-0089 open
  → NEXT ACTION: Responder adds external threat intel notes and digital forensic artifacts
```

---

## 9. Threat Hunting Workspace Flow

```text
START: Threat Hunter navigates to /threat-hunting
  → ACTION: Hunter enters hypothesis query: "Search for powershell.exe spawning cmd.exe with -enc arguments across all endpoints over last 24h"
  → UI RESPONSE: Search execution spinner; workspace renders interactive Attack Graph and chronological Event Timeline
  → ACTION: Hunter clicks on anomalous node WS-HR-02 -> Graph expands revealing parent process wscript.exe and outbound connection to 203.0.113.88
  → DATA CHANGE: Hunter selects 3 suspicious log events and clicks "Tag as Evidence"; system creates hunting_evidence records
  → NAVIGATION: Hunter clicks "Export to Case" -> Selects existing CASE-2026-0089
  → NEXT ACTION: Evidence items and IOCs appended directly to the Case Dossier
```

---

## 10. MITRE ATT&CK Investigation Flow

```text
START: Security Engineer navigates to /mitre to assess enterprise coverage
  → ACTION: Engineer clicks on Technique T1059.001 ("PowerShell") in the Execution tactic column
  → UI RESPONSE: Technique Detail Drawer slides out displaying: Technique Description, 3 Mapped Sigma Detection Rules, 5 Historical Alerts in current tenant, and "Simulate Technique" button
  → ACTION: Engineer clicks "Simulate Technique"
  → DATA CHANGE: Dispatches synthetic PowerShell execution payload into the Telemetry Pipeline; generates endpoint log; triggers detection rule; fires alert
  → NAVIGATION: Toast notification: "Simulation event dispatched. Alert generated: ALT-2026-0512. Click to view."
  → NEXT ACTION: Engineer clicks toast to verify detection rule accuracy on /alerts
```

---

## 11. Simulation Lab Execution Flow (Shared Telemetry Pipeline)

```text
START: Instructor or Analyst navigates to /soar/simulation (or /training/scenarios)
  → ACTION: User selects scenario "Ransomware Pre-cursor & Lateral Movement" and clicks "Launch Scenario"
  → UI RESPONSE: Simulation progress modal opens displaying 4-step pipeline:
      [✓] Generating synthetic endpoint & network telemetry
      [✓] Ingesting into SIEM & EDR pipeline
      [✓] Evaluating Sigma detection rules
      [✓] Firing alerts and triggering SOAR playbook
  → DATA CHANGE: Simulation Engine generates synthetic Windows Event Logs (4688, 4624, 7045), Syslog, and NetFlow events into public.events; detection engine evaluates rules and creates 3 prioritized alerts; links simulation_run record
  → NAVIGATION: Automatically redirects to /soar/live (Realtime Terminal Execution View)
  → NEXT ACTION: Terminal streams live orchestration logs as the automated playbook executes containment
```

---

## 12. Student Investigation & Learning Flow

```text
START: Student logs into VRSOC for assigned lab "Triage Credential Stuffing Attack"
  → ACTION: Student opens /alerts and locates assigned scenario alert ALT-2026-0410
  → UI RESPONSE: Alert drawer displays educational guidance prompt: "Identify the attacking source IP, the targeted user accounts, and determine if any login succeeded."
  → ACTION: Student navigates to /logs, constructs query: "source:auth event_id:4625", and identifies 50 failed attempts followed by 1 successful Event ID 4624 for user svc_sql
  → ACTION: Student returns to /alerts, clicks "Add Note", types forensic findings, and clicks "Submit Lab Solution"
  → DATA CHANGE: Inserts student_submission record with answers, query history, and timestamps; updates student progress score
  → NAVIGATION: Student receives instant educational score breakdown and explanation debrief
  → NEXT ACTION: Student reviews learning takeaways in Knowledge Center
```

---

## 13. Instructor Cohort & Lab Management Flow

```text
START: Instructor navigates to /training/cohorts
  → ACTION: Instructor clicks "Create Cohort" -> Enters "Fall 2026 SOC Cohort A" -> Assigns 25 students
  → ACTION: Instructor selects "Scenario Lab 03 — Suspicious Scheduled Task Persistence" -> Sets due date and clicks "Assign Scenario"
  → DATA CHANGE: Inserts cohort_assignments records for all 25 students; generates individualized simulation seeds per student tenant partition; sends in-app notification to students
  → NAVIGATION: Cohort dashboard displays live student progress matrix (Submitted: 18/25, Average Score: 88%)
  → NEXT ACTION: Instructor reviews individual student investigation notes and grades submissions
```

---

## 14. Compliance & Audit Posture Review Flow

```text
START: Compliance Auditor navigates to /compliance
  → ACTION: Auditor selects "ISO/IEC 27001:2022" framework scorecard
  → UI RESPONSE: Dashboard displays overall compliance score 92%, showing Pass/Fail badges across 93 control clauses
  → ACTION: Auditor clicks on Control A.12.4.1 ("Event Logging")
  → UI RESPONSE: Drawer reveals automated evidence mapping: active log retention policies, agent coverage (97.5%), and SIEM ingestion health checks
  → ACTION: Auditor clicks "Export Compliance Package"
  → DATA CHANGE: System compiles compliance scorecard, control evidence, and telemetry audit trail into a signed PDF/CSV export; logs audit event
  → NAVIGATION: Browser downloads ISO27001_Audit_Report_2026.pdf
  → NEXT ACTION: Auditor attaches report to external compliance dossier
```

---

## 15. Reporting Workflow

```text
START: SOC Manager navigates to /soar/reports (or /analytics)
  → ACTION: Manager clicks "Generate Report" -> Selects Template "Executive Monthly Threat Summary" -> Selects Date Range "Last 30 Days"
  → UI RESPONSE: Report Preview pane renders interactive document with Executive Summary, MTTD/MTTR metrics, Alert Severity Distribution, Top MITRE Techniques, and Resolved Incidents
  → ACTION: Manager clicks "Export as PDF"
  → DATA CHANGE: Edge function compiles structured report data, renders server-side document, stores in Supabase Storage, and generates signed download URL
  → NAVIGATION: PDF downloaded to local machine
  → NEXT ACTION: Manager delivers executive brief to leadership
```

---

## 16. AI Security Assistant Analyst Workflow

```text
START: Analyst inspecting unfamiliar encoded PowerShell alert on /alerts
  → ACTION: Analyst clicks "Ask AI Assistant" inside the Alert Drawer
  → UI RESPONSE: AI Assistant drawer slides open, pre-loaded with alert context, encoded command string, and affected asset hostname
  → ACTION: Analyst submits query: "Decode this PowerShell payload, explain what it is attempting to do, and give me containment steps."
  → UI RESPONSE: AI streams structured response:
      1. Decoded command: DownloadString from remote IP 198.51.100.12/stage2.ps1
      2. Threat explanation: Living-off-the-Land memory injection technique (MITRE T1059.001)
      3. Investigation queries for SIEM
      4. Recommended containment: Isolate host WS-FIN-04 immediately and revoke user credentials
      5. Link to Knowledge Center article: "Deep-Dive into PowerShell Defense"
  → DATA CHANGE: Chat message stored in ai_conversations table linked to alert ID
  → NEXT ACTION: Analyst clicks "Execute Isolation" directly from AI recommendation
```
