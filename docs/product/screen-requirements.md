# VRSOC Product Specification — Screen Requirements

## 1. Document Overview

This document defines the complete screen-by-screen technical specification for the VRSOC frontend rebuild. It provides the layout geometry, component hierarchy, data contracts, interactive states, role permissions, responsive behaviors, and Base44 parity requirements necessary for a frontend engineer to implement each view with visual and functional fidelity without repeatedly opening the reference prototype.

All visual styles must strictly align with the extracted Base44 Design Tokens:
- **Base Background**: `#0A0A0A` (Near Black)
- **Primary Burgundy Accent**: `#5B0A0A` / `#B71C1C`
- **Bright Red Action Accent**: `#E53935` (`rgb(229, 57, 53)`)
- **Card & Panel Glass**: `#161616` with `border: 1px solid rgba(255, 255, 255, 0.05)`
- **Typography**: Inter / System UI, strict font-size and weight hierarchy
- **Sidebar**: 240px fixed width (collapsible to 64px on mobile)

---

## 2. Authentication Screens

### 2.1 Login Screen (`/login`)
- **Route**: `/login`
- **Purpose**: Authenticate existing platform users via Email/Password or Google OAuth.
- **Page Structure**:
  - Centered card container (`max-w-md w-full mx-auto`) over dark gradient backdrop (`bg-[#0A0A0A]`).
  - Top logo badge: `#5B0A0A` rounded square with "VS" monogram.
  - Header: Title `Welcome back` (`text-2xl font-bold text-white`), subtitle `Log in to your account` (`text-sm text-white/60`).
- **Major Components**:
  - `OAuthButton`: Google branding, variant `outline`, border `white/10`, text "Continue with Google".
  - `Divider`: "OR CONTINUE WITH" text flanked by horizontal border lines.
  - `FormField (Email)`: Input with user icon, placeholder `name@example.com`, autofocus.
  - `FormField (Password)`: Input type `password`, key icon, "Forgot password?" right-aligned link.
  - `SubmitButton`: Full-width button with `#E53935` background, text "Log in", loading spinner.
  - `Footer`: Text "Don't have an account? Create one" linking to `/register`.
- **Data Required**:
  - None on load. Form submissions require `{ email, password }` or OAuth redirect.
- **User Actions**:
  - Submit login credentials; click Google OAuth; navigate to register or forgot password.
- **Navigation**:
  - Successful login -> Redirect to `/` (or stored redirect URL).
- **States**:
  - *Loading*: Button spinner active, inputs disabled.
  - *Error*: Red alert banner (`bg-red-500/10 border-red-500/20 text-red-400`) displaying error message.
  - *Empty/Default*: Clean input fields with validation hints.
- **Permissions**: Public (Unauthenticated). Authenticated users automatically redirect to `/`.
- **Responsive Requirements**: Full viewport height, card padded with `p-6` to `p-8`, centered on all screens.
- **Base44 Parity**: Exact layout, logo badge geometry, spacing, and placeholder text matching Base44 `koe` component.

---

### 2.2 Registration Screen (`/register`)
- **Route**: `/register`
- **Purpose**: Register a new student or analyst and verify their email via a 6-digit OTP code.
- **Page Structure**:
  - Two-step wizard within a centered auth card (`max-w-md`).
  - **Step 1 (Details)**: Email, Full Name, Password, Confirm Password, Organization Name (optional).
  - **Step 2 (Verification)**: Header "Verify your email", instruction "We sent a 6-digit code to <email>", segmented OTP input boxes, "Verify Code" button, "Resend Code" link.
- **Major Components**:
  - Step 1: Input fields with icons, password strength indicator, "Create account" submit button.
  - Step 2: 6-digit PIN input with auto-focus advancing, 60-second countdown timer for resend.
- **Data Required**:
  - Form state: `{ email, full_name, password, otp_code }`.
- **User Actions**:
  - Enter registration details -> Advance to OTP verification -> Submit valid OTP -> Account confirmed.
- **States**:
  - *Loading*: Spinners on submit and resend actions.
  - *Error*: Inline field validation errors (password mismatch, weak password, invalid OTP).
  - *Success*: Banner "Account verified successfully! Redirecting...".
- **Permissions**: Public.
- **Base44 Parity**: Replicates Base44 `Foe` two-step OTP registration flow.

---

### 2.3 Password Recovery Screens (`/forgot-password`, `/reset-password`)
- **Routes**: `/forgot-password`, `/reset-password`
- **Purpose**: Self-service account recovery via secure time-limited email tokens.
- **Page Structure**:
  - `/forgot-password`: Single email input, "Send reset link" button, back-to-login link.
  - `/reset-password`: Query param validation (`?token=...`), New Password and Confirm Password inputs.
- **States**:
  - *Success on Forgot Password*: Replaces form with confirmation message: "Check your email. If an account exists, a reset link has been dispatched."
  - *Error on Reset Password*: Invalid/expired token warning with "Request new link" action.
- **Permissions**: Public.

---

## 3. Core SOC Screens

### 3.1 SOC Operations Dashboard (`/`)
- **Route**: `/`
- **Purpose**: Central situational awareness cockpit displaying real-time metrics, threat telemetry trends, active alert feeds, and quick action shortcuts.
- **Page Structure**:
  - **Header Bar**: Title "Security Operations Center", subtitle "Real-time threat monitoring and incident response", Live Pulse indicator ("SYSTEM OPERATIONAL - LIVE" in glowing green badge).
  - **KPI Stat Grid (4 Cards across `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)**:
    1. *Active Alerts*: Count `24`, +12% delta badge, critical red border glow.
    2. *Open Incidents*: Count `7`, amber indicator, average MTTA `4.2m`.
    3. *Active Agents*: Count `156 / 160`, green health progress indicator (97.5% online).
    4. *MITRE ATT&CK Coverage*: Percentage `78%`, purple badge, 12 tactics mapped.
  - **Middle Visualizations (`grid-cols-1 lg:grid-cols-3 gap-6`)**:
    - *Left (2 cols)*: Realtime Alert Ingestion Stream (Interactive Area Chart with time range tabs: 1h, 24h, 7d).
    - *Right (1 col)*: Threat Category Distribution (Donut Chart: Credential Access 35%, Execution 25%, Lateral Movement 20%, Exfiltration 20%).
  - **Bottom Section**:
    - *Recent Critical Alerts Table*: Columns for Severity, Alert Title, MITRE Tactic, Affected Asset, Timestamp, Actions ("Investigate", "Dismiss").
    - *Quick Action Toolbar*: Buttons for "Run Simulation Lab", "Deploy Agent", "Generate Report", "AI Assistant".
- **Data Required**:
  - `metrics`: `{ active_alerts, open_incidents, total_agents, online_agents, mitre_coverage }`.
  - `chart_data`: Timeseries ingestion arrays and category distribution breakdown.
  - `recent_alerts`: Array of top 5 critical/high alerts with asset and MITRE joins.
- **User Actions**:
  - Filter timeseries chart; click "Investigate" to open alert modal/drawer; trigger quick action buttons.
- **States**:
  - *Loading*: Skeleton shimmer cards for KPI stats and charts.
  - *Empty*: Placeholder for alerts table ("No active critical alerts detected").
- **Permissions**: All authenticated roles (Student, Analyst, Responder, Hunter, Instructor, Admin, Auditor, Viewer).
- **Responsive Requirements**: Stack stat cards on mobile, horizontal scroll for tables, collapsed chart heights.
- **Base44 Parity**: Exact layout, color tokens, and widget geometry matching Base44 `dNe` component.

---

### 3.2 Agent Management (`/agents`)
- **Route**: `/agents`
- **Purpose**: EDR fleet oversight, endpoint sensor health tracking, system metric monitoring, and host containment.
- **Page Structure**:
  - **Header & Health Summary**: Title "Endpoint Agents", subtitle "EDR sensor fleet monitoring and telemetry status".
  - **Status Summary Bar**: 4 pill cards showing counts for `Online` (green), `Warning` (amber), `Critical` (red), `Offline` (gray).
  - **Filter & Search Bar**: Search input (hostname/IP), OS dropdown (Windows, Linux, macOS), Status dropdown, "Deploy Agent" button.
  - **Agent Data Table**:
    - Columns: Hostname, IP Address, Operating System / Version, Agent Version, CPU / RAM / Disk gauges, Last Seen (relative time), Status Badge, Actions menu.
    - Row Actions: "Isolate Host", "Collect Triage Logs", "Restart Agent", "View Telemetry".
- **Data Required**:
  - List of agent entities with joined asset telemetry, system resource metrics, and status flags.
- **User Actions**:
  - Filter/search agent fleet; click an agent row to view detailed drawer; trigger "Isolate Host" containment command.
- **States**:
  - *Loading*: Table skeleton loader.
  - *Empty*: "No agents found matching search criteria."
- **Permissions**: Analysts and above for isolation; Students have read-only view.
- **Base44 Parity**: Replicates Base44 `YNe` layout, CPU/RAM progress gauges, and status badges.

---

### 3.3 Alert Management (`/alerts`)
- **Route**: `/alerts`
- **Purpose**: Triage, prioritization, assignment, investigation, and escalation of security alerts.
- **Page Structure**:
  - **Severity Filter Tabs**: `All (24)`, `Critical (5)`, `High (8)`, `Medium (7)`, `Low (4)`.
  - **Search & Filter Controls**: Search bar (keyword, MITRE ID, IP, username), Status filter (`Open`, `Acknowledged`, `In Progress`, `Closed`), Assignee filter.
  - **Alert Feed Table**:
    - Columns: Severity (Badge with icon and risk score e.g. `Critical 95`), Alert Title, Affected Asset & User, MITRE Mapping (`T1110 - Brute Force`), Trigger Timestamp, Assignee avatar, Actions.
    - Quick Actions: "Acknowledge", "Escalate to Incident", "Mark False Positive", "Investigate".
  - **Investigation Drawer**: Slides out from right upon clicking an alert:
    - Summary, Risk Score, Triggering telemetry logs with JSON viewer, Affected Asset details, MITRE technique description, Analyst comments feed, "Add Comment" box.
- **Data Required**:
  - Alert records with asset, MITRE, assignee, comments, and telemetry event joins.
- **User Actions**:
  - Filter alerts; open investigation drawer; acknowledge alert; escalate to incident; post triage comments.
- **Permissions**: SOC Analysts, Responders, Hunters, Students (in training mode).
- **Base44 Parity**: Replicates Base44 `QNe` component and slide-out investigation drawer.

---

### 3.4 Incident Response (`/incidents`)
- **Route**: `/incidents`
- **Purpose**: Incident handling lifecycle orchestration across NIST SP 800-61 stages.
- **Page Structure**:
  - **Header**: "Incident Response", "Declare Incident" primary button (`bg-[#E53935]`).
  - **Lifecycle Board / Kanban View**:
    - Columns: `Detection`, `Analysis`, `Containment`, `Eradication`, `Recovery`, `Lessons Learned`, `Closed`.
    - Incident Cards: Incident Number (`INC-2026-0342`), Title, Severity Badge, Lead Responder Avatar, SLA countdown timer, Affected Systems count.
  - **Declare Incident Dialog**: Form with Title, Severity, Lead Assignee, Summary, and Affected Asset multi-selector.
- **Data Required**:
  - Incident records with stage, severity, responder, and linked alerts/cases.
- **User Actions**:
  - Drag-and-drop incidents between lifecycle columns; click incident card to view `/soar/incident/:id` or deep incident dossier; declare new incident.
- **Permissions**: Incident Responders, SOC Leads, Instructors.
- **Base44 Parity**: Replicates Base44 `JNe` Kanban board and incident cards.

---

### 3.5 Threat Detection Rules (`/detections`)
- **Route**: `/detections`
- **Purpose**: Manage, test, and tune Sigma rules, YARA rules, and threshold-based detection logic.
- **Page Structure**:
  - **Category Tabs**: Credential Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Lateral Movement, C2, Exfiltration.
  - **Rule List Table**:
    - Columns: Rule Name, Rule Type (Sigma, YARA, Behavioral, Threshold), MITRE Technique ID, Severity, Status (Toggle Switch: Enabled/Disabled), Last Triggered, Actions ("Edit", "Test Rule", "Duplicate").
  - **Rule Editor Modal**: Code editor with YAML/Sigma syntax highlighting, description input, and test dataset runner.
- **Data Required**:
  - Detection rule records with MITRE mappings, trigger statistics, and YAML logic.
- **Permissions**: Threat Hunters, Admins, Instructors. Students view in read-only mode.
- **Base44 Parity**: Replicates Base44 `eOe` rule list and toggle switches.

---

### 3.6 MITRE ATT&CK Center (`/mitre`)
- **Route**: `/mitre`
- **Purpose**: Interactive enterprise attack matrix visualization, tactic coverage heatmaps, and technique inspection.
- **Page Structure**:
  - **Matrix Header**: Overall coverage score (e.g. `78%`), total techniques monitored (`142 / 193`), "Export Matrix" button.
  - **14 Tactic Columns Grid**:
    - Column Headers: Tactic Name (e.g. *Initial Access*, *Execution*, *Persistence*) + Coverage Percentage badge.
    - Technique Cards: Technique Name + ID (e.g. `T1059.001 - PowerShell`), background color indicator reflecting detection coverage status (Covered = green tint, Partial = amber tint, Uncovered = muted gray).
  - **Technique Detail Drawer**:
    - Technique ID, Tactic, Description, Mapped Detection Rules list, Simulated Test Scenarios, and Recommended Defensive Mitigations.
- **Data Required**:
  - MITRE framework hierarchy + tenant detection rule mappings + alert history counts.
- **User Actions**:
  - Click technique to open drawer; search matrix by keyword; launch simulated test from drawer.
- **Base44 Parity**: Replicates Base44 `dOe` matrix grid and technique drawer.

---

### 3.7 Log Explorer / SIEM (`/logs`)
- **Route**: `/logs`
- **Purpose**: High-throughput log investigation, filtering, syntax-highlighted search, and event correlation.
- **Page Structure**:
  - **Query Bar**: Search input with Lucene/SQL query syntax, "Run Query" button, time-range dropdown (Last 15m, 1h, 24h, 7d).
  - **Facet Filters (Left Sidebar)**: Log Sources (Windows Event, Syslog, Firewall, DNS, CloudTrail), Severity, Hosts, Event IDs.
  - **Event Stream Table (Main Area)**:
    - Columns: Timestamp (monospace), Source badge, Hostname, Event Type / ID, Severity, Message summary.
    - Expandable Row: Expands full JSON payload with copyable keys and values.
- **Data Required**:
  - Normalized event records from the telemetry database.
- **User Actions**:
  - Execute queries; click facets to add filters; expand JSON payload; click "Create Alert Rule from Query".
- **Base44 Parity**: Replicates Base44 `hOe` query bar and expandable log view.

---

### 3.8 Case Management (`/cases`)
- **Route**: `/cases`
- **Purpose**: Multi-alert investigation dossiers combining evidence, IOCs, timelines, and collaborative analyst notes.
- **Page Structure**:
  - **Header**: "Investigation Cases", "New Case" button.
  - **Case Cards Feed**:
    - Priority Badge (`P1 Critical`, `P2 High`, `P3 Medium`), Status Badge (`Detection`, `Analysis`, `Closed`), Case Title, Description summary, Lead Investigator.
    - Timestamped Analyst Notes block with formatted markdown.
    - "Add Note" dialog button.
- **Data Required**:
  - Case records with joined evidence, notes, IOCs, and alerts.
- **Base44 Parity**: Replicates Base44 `pOe` case cards and notes structure.

---

### 3.9 SOC Analytics (`/analytics`)
- **Route**: `/analytics`
- **Purpose**: Executive and operational metrics, SOC performance KPIs, and historical threat trends.
- **Page Structure**:
  - **Top KPI Cards**: MTTD (`4.2m`), MTTR (`23m`), Alert Closure Rate (`94%`), False Positive Rate (`12%`).
  - **4 Core Charts**:
    1. *Alert Volume by Severity*: Stacked bar chart across last 30 days.
    2. *Authentication Trends*: Area chart showing Successful vs Failed logins over 24 hours.
    3. *MITRE Tactic Frequency*: Horizontal bar chart highlighting top attack vectors.
    4. *Endpoint Fleet Health*: Donut chart showing healthy, warned, and isolated hosts.
- **Data Required**:
  - Aggregated analytics timeseries and distribution summaries.
- **Base44 Parity**: Replicates Base44 `vOe` analytics dashboard.

---

### 3.10 AI Security Assistant (`/ai-assistant`)
- **Route**: `/ai-assistant`
- **Purpose**: Conversational cyber defense educator grounded in active SOC telemetry.
- **Page Structure**:
  - **Chat Area (`h-[calc(100vh-8rem)]`)**:
    - Header: AI Security Assistant with pulse badge "READY - GROUNDED ON SOC DATA".
    - Message Stream: User messages (right aligned) and AI responses (left aligned with avatar and markdown renderer).
    - Suggested Prompt Pills: "Explain Brute Force detection", "How to contain ransomware", "Analyze encoded PowerShell".
    - Bottom Input Bar: Text input with send button and attachment/context picker.
- **Data Required**:
  - Conversation history + active tenant SOC context.
- **Base44 Parity**: Replicates Base44 `FIe` chat layout and suggested prompts.

---

### 3.11 Knowledge Center (`/knowledge`)
- **Route**: `/knowledge`
- **Purpose**: Educational library of cybersecurity concepts, architectural guides, and quiz checkpoints.
- **Page Structure**:
  - **Category Tabs & Search**: Tabs (All, SOC, SIEM, SOAR, EDR, XDR, NDR, Threat Intel, MITRE, Forensics, Cloud), search bar.
  - **Article Cards Grid**:
    - Category Tag, Difficulty Badge (`Beginner` green, `Intermediate` amber, `Advanced` red), Article Title, Excerpt, Reading time (e.g. `5 min read`).
  - **Article Reader View**:
    - "<- Back to Knowledge Center" top button, Full Markdown content, Diagrams, Key Takeaways callout box, Related Simulation Labs link.
- **Data Required**:
  - Knowledge article records with markdown text, difficulty, and tags.
- **Base44 Parity**: Replicates Base44 `zIe` article catalog and detail view.

---

### 3.12 Platform Settings (`/settings`)
- **Route**: `/settings`
- **Purpose**: User profile management, security settings (MFA), notification webhooks, API keys, and tenant configuration.
- **Page Structure**:
  - **Tabbed Container**: `Profile`, `Security & MFA`, `Notifications`, `API Keys`, `Organization & Teams`.
- **Base44 Parity**: Replicates Base44 `YIe` tabbed settings layout.

---

## 4. SOAR Subsystem Screens (Complete 15-Screen Catalog)

### 4.1 SOAR Dashboard (`/soar`)
- **Route**: `/soar`
- **Purpose**: Orchestration overview displaying automated MTTR reduction, active playbook runs, and pending approval queues.
- **Components**: Automation rate gauge (e.g. `84%`), Playbooks executed stat, Active approvals counter, Recent playbook execution feed.
- **Base44 Parity**: Replicates Base44 `sDe`.

### 4.2 SOAR Automation Pipeline (`/soar/automation`)
- **Route**: `/soar/automation`
- **Purpose**: Interactive 5-stage visual runner for automated incident remediation.
- **Components**: Visual stage progression bar (Ingestion -> Normalization -> Threat Enrichment -> AI Decision -> Automated Response) with animated pulse nodes and streaming execution console.
- **Base44 Parity**: Replicates Base44 `cDe`.

### 4.3 SOAR Playbooks Catalog (`/soar/playbooks`)
- **Route**: `/soar/playbooks`
- **Purpose**: Searchable library of 20+ automated security playbooks (Brute Force, Ransomware, Phishing, IP Block).
- **Components**: Category filter, trigger badge, "Run Simulation" button, "Edit in Builder" button.
- **Base44 Parity**: Replicates Base44 `dDe`.

### 4.4 SOAR Visual Playbook Builder (`/soar/builder`)
- **Route**: `/soar/builder`
- **Purpose**: Drag-and-drop workflow canvas for designing automated remediation logic.
- **Components**: Node toolbox (Trigger, Threat Intel, Condition, AI Decision, Firewall Block, Endpoint Isolate, Ticket Create, Notification, End), interactive canvas with connecting bezier curves, property inspector drawer.
- **Base44 Parity**: Replicates Base44 `hDe`.

### 4.5 SOAR Threat Enrichment (`/soar/enrichment`)
- **Route**: `/soar/enrichment`
- **Purpose**: Multi-source threat intelligence lookup engine.
- **Components**: Observable input (IP, Hash, Domain), lookup button, provider cards (VirusTotal 42/88, AbuseIPDB 100%, AlienVault OTX 3 Pulses, Shodan open ports 22, 80, 443).
- **Base44 Parity**: Replicates Base44 `mDe`.

### 4.6 SOAR AI Decision Engine (`/soar/ai-engine`)
- **Route**: `/soar/ai-engine`
- **Purpose**: Risk scoring policy configuration and automated decision threshold matrix.
- **Components**: Weighted risk sliders (Known Malware +40, Impossible Travel +25, Critical Asset +20), Decision tier badges (Low, Medium, High, Severe, Critical).
- **Base44 Parity**: Replicates Base44 `yDe`.

### 4.7 SOAR Response Actions (`/soar/actions`)
- **Route**: `/soar/actions`
- **Purpose**: Catalog of individual remediation primitives across Network, Endpoint, IAM, and Communications.
- **Components**: Action cards with "Test Execution" button and live output terminal.
- **Base44 Parity**: Replicates Base44 `vDe`.

### 4.8 SOAR Approvals Queue (`/soar/approvals`)
- **Route**: `/soar/approvals`
- **Purpose**: Human-in-the-loop authorization queue for high-impact containment actions.
- **Components**: Pending/Approved/Rejected filter, action card with affected asset impact, "Approve" (green) button, "Reject" (red) button with reason modal.
- **Base44 Parity**: Replicates Base44 `bDe`.

### 4.9 SOAR Cases (`/soar/cases`)
- **Route**: `/soar/cases`
- **Purpose**: Automated cases created directly from SOAR playbook execution.
- **Base44 Parity**: Replicates Base44 `_De`.

### 4.10 SOAR Incident Detail (`/soar/incident/:id`)
- **Route**: `/soar/incident/:id`
- **Purpose**: Deep forensic dossier for a specific incident with raw telemetry stream, evidence timeline, and playbook execution history.
- **Base44 Parity**: Replicates Base44 `kDe`.

### 4.11 SOAR Execution History (`/soar/history`)
- **Route**: `/soar/history`
- **Purpose**: Chronological audit trail of all automated playbook runs with execution times, statuses, and affected assets.
- **Base44 Parity**: Replicates Base44 `CDe`.

### 4.12 SOAR Live Execution Stream (`/soar/live`)
- **Route**: `/soar/live`
- **Purpose**: Real-time terminal-style execution viewer showing step-by-step stdout logs of active orchestration workflows.
- **Base44 Parity**: Replicates Base44 `PDe`.

### 4.13 SOAR Reports (`/soar/reports`)
- **Route**: `/soar/reports`
- **Purpose**: Report generator for Executive Summaries, Technical Incident Dossiers, and SOAR metrics.
- **Base44 Parity**: Replicates Base44 `EDe`.

### 4.14 SOAR Simulation Lab (`/soar/simulation`)
- **Route**: `/soar/simulation`
- **Purpose**: Interactive scenario launcher triggering safe synthetic cyber incidents.
- **Components**: Scenario selection cards (Brute Force, Ransomware, Exfiltration, Phishing), "Launch Scenario" button, multi-step progress modal redirecting to Live Execution.
- **Base44 Parity**: Replicates Base44 `TDe`.

### 4.15 SOAR Settings (`/soar/settings`)
- **Route**: `/soar/settings`
- **Purpose**: Policy configuration for Automation Modes (Manual, Semi-Automatic, Fully Automatic) and Threat Intel API keys.
- **Base44 Parity**: Replicates Base44 `RDe`.

---

## 5. Platform & Educational Extensions (Master Spec Required)

### 5.1 Compliance Center (`/compliance`)
- **Route**: `/compliance`
- **Purpose**: Framework compliance scorecards (ISO 27001, NIST CSF, PCI DSS, HIPAA, CIS Controls) with mapped telemetry evidence.
- **Components**: Framework selector, compliance score percentage rings, control status list (Passed, Failed, Needs Review), remediation task recommendations.

### 5.2 Vulnerability Management (`/vulnerabilities`)
- **Route**: `/vulnerabilities`
- **Purpose**: Asset-linked CVE/CVSS tracking, severity categorization, and patch management status.
- **Components**: Severity metric cards, Vulnerability Data Table (CVE ID, Affected Software, CVSS Score, Severity Badge, Patch Status, Exploitable Indicator).

### 5.3 Malware Analysis (`/malware-analysis`)
- **Route**: `/malware-analysis`
- **Purpose**: Safe educational static and sandbox analysis reports for simulated malicious payloads.
- **Components**: File hash lookup, static properties table (PE headers, hashes, digital signature), sandbox behavioral timeline, dropped files list, YARA matches.

### 5.4 File Integrity Monitoring (`/fim`)
- **Route**: `/fim`
- **Purpose**: Real-time monitoring of file modifications, creations, deletions, and permission changes across critical system paths.
- **Components**: Critical paths status summary, real-time FIM event table with path diff highlighting.

### 5.5 Threat Hunting Workspace (`/threat-hunting`)
- **Route**: `/threat-hunting`
- **Purpose**: Active multi-dimensional hunting canvas linking observables to attack graphs and evidence notebooks.
- **Components**: Query builder, Timeline graph, Asset-User relationship map, Evidence clipboard.

### 5.6 Educational Lab Management (`/training/cohorts`, `/training/scenarios`, `/training/quizzes`)
- **Routes**: `/training/cohorts`, `/training/scenarios`, `/training/quizzes`
- **Purpose**: Instructor management of student cohorts, scenario assignments, and quiz evaluations.
- **Components**: Cohort progress matrix, student scoreboards, scenario assignment drawer, quiz builder.
