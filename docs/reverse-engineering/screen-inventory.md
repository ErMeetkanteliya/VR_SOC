# VRSOC Phase 00 — Screen Inventory

This document provides a screen-by-screen specification for all reachable views within the VRSOC Base44 application.

---

## 1. Authentication Screens

### 1.1 Login Screen (`/login`)
- **Component Symbol**: `koe`
- **Purpose**: Authenticate returning users via email/password or Google OAuth.
- **Layout**: Centered card (`max-w-md`) over dark gradient background. Header with VRSOC logo (`#5B0A0A` rounded badge with "VS" text) and title "Welcome back", subtitle "Log in to your account".
- **Components**:
  - Google OAuth Button (`Me` with variant `outline`, Google icon `x8`, text "Continue with Google")
  - Divider ("OR CONTINUE WITH")
  - Email Input (`pt` with user icon, autofocus, required)
  - Password Input (`pt` type password, key icon)
  - Submit Button ("Log in", primary accent `#E53935`)
  - Footer Links: "Don't have an account? Create one" (`/register`), "Forgot password?" (`/forgot-password`)
- **State Behavior**:
  - *Loading*: Button spinner, inputs disabled.
  - *Error*: Red banner with message (`Invalid email or password`).
  - *Success*: Token stored in `localStorage` (`base44_access_token`), redirect to `/`.

### 1.2 Registration Screen (`/register`)
- **Component Symbol**: `Foe`
- **Purpose**: Register a new user and verify their email via OTP code.
- **Layout**: Two-step form in a centered auth card.
  - *Step 1*: Email, Password, Confirm Password.
  - *Step 2* (OTP verification): Displays "Verify your email - We sent a code to <email>", 6-digit OTP input, "Verify Code" button, "Resend Code" link.
- **Validation**: Email format check, password confirmation matching.

### 1.3 Forgot Password & Reset Password Screens (`/forgot-password`, `/reset-password`)
- **Component Symbols**: `zoe`, `Uoe`
- **Purpose**: Self-service credential recovery.
- **Components**:
  - `/forgot-password`: Email input, "Send reset link" button, success state confirmation ("If an account exists with that email, you'll receive a password reset link shortly").
  - `/reset-password`: Token validation from URL query (`?token=...`), new password, confirm password, submit button.

---

## 2. Core SOC Screens

### 2.1 SOC Dashboard (`/`)
- **Component Symbol**: `dNe`
- **Purpose**: Primary situational awareness cockpit for the SOC team.
- **Layout**:
  - Top header: "Security Operations Center", subtitle "Real-time threat monitoring and incident response", live pulse indicator ("SYSTEM OPERATIONAL - LIVE").
  - Top KPI Stat Grid (4 cards):
    1. Active Alerts (e.g. `24`, +12% badge, critical red indicator)
    2. Open Incidents (e.g. `7`, amber indicator)
    3. Active Agents (e.g. `156 / 160`, green health badge)
    4. MITRE ATT&CK Coverage (e.g. `78%`, purple indicator)
  - Middle Charts Row (2 columns):
    - Left: Realtime Alert Ingestion Stream (Area chart, time vs volume)
    - Right: Threat Category Distribution (Bar / Donut chart)
  - Bottom Row:
    - Recent Critical Alerts Table (columns: Severity badge, Alert Title, MITRE Tactic, Asset, Time, Action "Investigate")
    - Quick Action Buttons: "Run Simulation", "Deploy Agent", "Export Report".

### 2.2 Agent Management (`/agents`)
- **Component Symbol**: `YNe`
- **Purpose**: EDR endpoint and sensor fleet oversight.
- **Layout**:
  - Filter bar: Search by hostname/IP, OS filter dropdown (Windows, Linux, macOS), Status filter (Online, Offline, Warning, Updating).
  - Health Metrics Bar: Online (`142`), Warning (`18`), Critical (`5`), Offline (`12`).
  - Agents Data Table:
    - Columns: Hostname, IP Address, OS / Version, Agent Version, CPU / RAM / Disk gauges, Last Seen timestamp, Status badge, Actions (Isolate, Collect Logs, Restart).
  - Empty State: "No agents found matching the selected filters".

### 2.3 Alert Management (`/alerts`)
- **Component Symbol**: `QNe`
- **Purpose**: Alert triage, prioritization, assignment, and escalation.
- **Layout**:
  - Severity Filter Tabs: All, Critical (`red`), High (`orange`), Medium (`amber`), Low (`blue`).
  - Search Input: Search by alert title, MITRE technique, affected user, IP.
  - Alert Card Feed / Table:
    - Alert Title (e.g. "Brute Force Authentication Attack", "Suspicious PowerShell Encoded Command", "Unauthorized USB Storage Device Detected")
    - Severity Badge & Risk Score (e.g. `Critical - 95/100`)
    - Affected Asset / User (e.g. `DC-01.corp.internal`, `admin_svc`)
    - MITRE Mapping (e.g. `T1110 - Brute Force`, `T1059.001 - PowerShell`)
    - Action Buttons: "Investigate" (opens drawer/modal), "Acknowledge", "Escalate to Incident", "Mark False Positive".

### 2.4 Incident Response (`/incidents`)
- **Component Symbol**: `JNe`
- **Purpose**: Full lifecycle tracking of declared security incidents.
- **Layout**:
  - Kanban / Stage Filter: Detection -> Analysis -> Containment -> Eradication -> Recovery -> Lessons Learned -> Closed.
  - Incident Card Grid:
    - Incident Number (e.g. `INC-2026-0342`), Title, Severity, Lead Responder, SLA timer, Affected systems count.
  - Modal / Drawer: "Declare Incident" form with title, severity, summary, and affected assets selector.

### 2.5 Threat Detection Rules (`/detections`)
- **Component Symbol**: `eOe`
- **Purpose**: Management of detection engineering logic, Sigma rules, and threshold triggers.
- **Layout**:
  - Categories: Credential Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Lateral Movement, Exfiltration.
  - Rule List: Rule Name, Rule Type (Sigma, YARA, Behavioral, Threshold), MITRE Technique ID, Severity, Status (Enabled / Disabled toggle), Edit logic button.

### 2.6 MITRE ATT&CK Center (`/mitre`)
- **Component Symbol**: `dOe`
- **Purpose**: Interactive MITRE ATT&CK Matrix navigation and enterprise coverage visualization.
- **Layout**:
  - Tactics Column Grid: Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Command and Control, Exfiltration, Impact.
  - Coverage Percentage Header for each tactic.
  - Interactive Technique Cards: Clicking opens drawer with Technique description, associated detection rules, and simulated test scenarios.

### 2.7 Log Explorer / SIEM (`/logs`)
- **Component Symbol**: `hOe`
- **Purpose**: High-throughput log investigation, filtering, and query workspace.
- **Layout**:
  - Query Input Bar: Lucene / SQL style search bar with "Run Query" button and time-range selector (Last 15m, 1h, 24h, 7d).
  - Log Stream Table: Timestamp, Source (Firewall, Windows Event Log, Syslog, DNS, Auth), Host, Severity, Raw Message summary.
  - Log Detail Expandable Row: Full JSON representation of normalized event telemetry.

### 2.8 Case Management (`/cases`)
- **Component Symbol**: `pOe`
- **Purpose**: Comprehensive investigation dossiers combining alerts, evidence, IOCs, and analyst notes.
- **Layout**:
  - Header with "New Case" button (opens modal).
  - Case Feed:
    - Priority (`P1`, `P2`, `P3`), Status (`Detection`, `Analysis`, `Closed`), Title, Description.
    - Timestamped Analyst Notes block.
    - "Add Note" button opening note submission dialog.

### 2.9 SOC Analytics (`/analytics`)
- **Component Symbol**: `vOe`
- **Purpose**: Executive and operational metrics, trends, and KPIs.
- **Layout**:
  - Top Metrics (4 cards): MTTD (`4.2m`), MTTR (`23m`), Closure Rate (`94%`), False Positive Rate (`12%`).
  - Charts:
    1. Alert Volume by Severity (Weekly stacked bar chart)
    2. Authentication Trends (Hourly success vs failed area chart)
    3. MITRE Tactic Frequency (Horizontal bar chart)
    4. Endpoint Health Distribution (Donut chart)

### 2.10 AI Security Assistant (`/ai-assistant`)
- **Component Symbol**: `FIe`
- **Purpose**: Interactive conversational cyber defense educator.
- **Layout**: Full-height chat interface (`h-[calc(100vh-8rem)]`) with message history stream, suggested prompt pills ("Explain Brute Force detection", "How to contain ransomware", "Analyze encoded PowerShell"), markdown response renderer, and message input bar.

### 2.11 Knowledge Center (`/knowledge`)
- **Component Symbol**: `zIe`
- **Purpose**: Educational reference library with structured articles and guides.
- **Layout**:
  - Category Filter: All, SOC, SIEM, SOAR, EDR, XDR, NDR, Threat Intel, MITRE, Digital Forensics, Cloud Security.
  - Search bar.
  - Article Grid: Title, Category, Difficulty badge (`beginner` green, `intermediate` amber, `advanced` red), Preview snippet.
  - Article Detail View (with "<- Back to Knowledge Center" button): Full educational markdown article, key takeaways, diagrams, and related simulation labs.

### 2.12 Platform Settings (`/settings`)
- **Component Symbol**: `YIe`
- **Purpose**: User preferences, profile, security credentials, notification channels, and API key management.
- **Layout**: Tabbed interface (`Profile`, `Security`, `Notifications`, `Appearance`, `API Keys`).

---

## 3. SOAR Subsystem Screens

### 3.1 SOAR Dashboard (`/soar`)
- **Component Symbol**: `sDe`
- **Purpose**: Orchestration overview showing automation rates, playbook execution volume, and active approval requests.

### 3.2 SOAR Automation Pipeline (`/soar/automation`)
- **Component Symbol**: `cDe`
- **Purpose**: Step-by-step visual runner for alert ingestion and automated remediation.
- **Steps**: Ingestion -> Normalization -> Threat Enrichment -> AI Decision -> Automated Response.
- **Features**: "Start Pipeline" button, step indicator with animated pulses, live execution log console.

### 3.3 SOAR Playbooks (`/soar/playbooks`)
- **Component Symbol**: `dDe`
- **Purpose**: Catalog of 20+ automated response playbooks (e.g., Brute Force Response, Ransomware Containment, Phishing Triage, Malicious IP Block).
- **Features**: Filter by category, trigger type, execute in simulation mode button, duplicate playbook button.

### 3.4 SOAR Visual Playbook Builder (`/soar/builder`)
- **Component Symbol**: `hDe`
- **Purpose**: Drag-and-drop canvas workflow designer for security playbooks.
- **Nodes**: Trigger, Threat Intel, Condition, AI Decision, Firewall Block, Endpoint Isolate, Ticket Create, Notification, End.

### 3.5 SOAR Threat Enrichment (`/soar/enrichment`)
- **Component Symbol**: `mDe`
- **Purpose**: Multi-source threat intelligence lookup workspace.
- **Integrations**: VirusTotal (`42/88 detections`), AbuseIPDB (`Confidence 100%`), AlienVault OTX (`3 Pulses`), Shodan (Open ports: `22, 80, 443`).

### 3.6 SOAR AI Decision Engine (`/soar/ai-engine`)
- **Component Symbol**: `yDe`
- **Purpose**: Interactive risk scoring and automated decision matrix.
- **Configurable Factors**: Known Malware (+40 pts), Outside Country (+15 pts), Impossible Travel (+25 pts), Critical Asset (+20 pts), Failed Logins (+15 pts).
- **Decision Tiers**: Low (0-20, Log only), Medium (21-40, Notify analyst), High (41-60, Require approval), Severe (61-80, Auto-contain endpoint), Critical (81-100, Full automatic lockdown).

### 3.7 SOAR Response Actions (`/soar/actions`)
- **Component Symbol**: `vDe`
- **Purpose**: Catalog of individual remediation primitives (Network & Firewall, Endpoint & EDR, Identity & IAM, Communication).
- **Features**: Manual execution trigger test with live success/failure feedback.

### 3.8 SOAR Approvals (`/soar/approvals`)
- **Component Symbol**: `bDe`
- **Purpose**: Human-in-the-loop authorization queue for high-impact response actions (e.g. Isolate Domain Controller, Block IP on Core Firewall).
- **Features**: Pending / Approved / Rejected filter, Approve button, Reject button with reason input.

### 3.9 SOAR Cases (`/soar/cases`)
- **Component Symbol**: `_De`
- **Purpose**: SOAR-linked cases generated directly by playbook executions.

### 3.10 SOAR Incident Detail (`/soar/incident/:id`)
- **Component Symbol**: `kDe`
- **Purpose**: Deep-dive triage view for specific incidents with attached evidence, raw telemetry, and playbook runs.

### 3.11 SOAR Execution History (`/soar/history`)
- **Component Symbol**: `CDe`
- **Purpose**: Chronological audit trail of all automated playbook executions with execution duration, status, and affected assets.

### 3.12 SOAR Live Execution (`/soar/live`)
- **Component Symbol**: `PDe`
- **Purpose**: Real-time terminal-style execution stream of running orchestration jobs.

### 3.13 SOAR Reports (`/soar/reports`)
- **Component Symbol**: `EDe`
- **Purpose**: Generate structured markdown/PDF reports (Executive, Technical, Incident-Specific).

### 3.14 SOAR Simulation (`/soar/simulation`)
- **Component Symbol**: `TDe`
- **Purpose**: Interactive cyber attack scenario launcher (Brute Force, Ransomware, Data Exfiltration, Phishing).
- **Features**: Scenario cards with severity badges, "Launch Scenario" button, multi-step execution loader redirecting to Live Execution.

### 3.15 SOAR Settings (`/soar/settings`)
- **Component Symbol**: `RDe`
- **Purpose**: SOAR policy configuration (Automation Mode: Manual, Semi-Automatic, Fully Automatic; Approval timeout duration in minutes; API keys for Threat Intel providers).
