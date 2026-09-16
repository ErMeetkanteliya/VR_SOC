# VR_SOC.md

# VRSOC — Enterprise SOC Training & Simulation SaaS
## Master Roadmap for Rebuilding the Base44 Prototype with Next.js + Supabase + Antigravity

**Project Name:** VRSOC  
**Tagline:** Learn • Detect • Investigate • Defend  
**Current Prototype:** `https://vrsoc.base44.app/`  
**Target Backend Platform:** Supabase  
**Primary Agent/IDE:** Google Antigravity  
**Repository Status:** No local source repository exists at project start  
**Document Role:** Master implementation roadmap and operating contract

---

# 1. PROJECT CONTEXT

VRSOC is an enterprise-style Cyber Security Operations Center (SOC) training and simulation platform.

The supplied VRSOC master specification defines the intended functional scope, including:

- authentication and MFA
- organizations and teams
- role-based access
- SOC dashboards
- agent management
- SIEM
- EDR
- XDR
- threat detection
- MITRE ATT&CK
- compliance
- audit
- vulnerability management
- malware analysis
- file integrity monitoring
- threat hunting
- incident response
- alert management
- case management
- log exploration
- knowledge center
- simulation labs
- analytics
- reports
- notifications
- API management
- settings
- AI Security Assistant

The platform is explicitly intended for education and defensive simulation only.

It must not contain:

- offensive hacking tools
- exploit generation
- malware generation
- phishing-kit generation
- credential harvesting
- attack automation

All adversarial behavior and malware-related workflows must remain safe, simulated, and educational.

---

# 2. STARTING POINT

## 2.1 What exists

At project start, the development team has:

1. The live Base44 VRSOC demo/application:
   `https://vrsoc.base44.app/`
2. The VRSOC master specification.
3. A Supabase project/database that will become the backend/data foundation.

## 2.2 What does not exist

There is currently no known local VRSOC source repository.

Do not assume access to:

- Base44 source code
- Base44 private backend code
- Base44 private database
- Base44 internal infrastructure
- Base44 server implementation
- Base44 environment variables
- Base44 deployment configuration

The Base44 application is therefore treated as a **black-box product reference**.

---

# 3. PRIMARY PRODUCT REQUIREMENT

## 3.1 Exact Base44 UI/UX replication

The new VRSOC frontend must reproduce the existing Base44 VRSOC demo as closely as technically possible.

The Base44 application is the **visual and interaction source of truth** for the existing product experience.

The rebuild must aim to preserve:

- information architecture
- navigation structure
- screen hierarchy
- layout
- spacing
- typography
- colors
- cards
- tables
- charts
- forms
- badges
- icons
- tabs
- modals
- drawers
- dropdowns
- filters
- search
- command palette
- loading states
- empty states
- error states
- success states
- hover states
- active states
- transitions
- animations
- responsive behavior
- major user workflows
- terminology and labels

The goal is **not merely to create a similar cybersecurity dashboard**.

The goal is:

> Rebuild the VRSOC Base44 product experience in a new production architecture while keeping the frontend experience visually and behaviorally equivalent wherever observable.

---

# 4. BASE44 REFERENCE VS NEW IMPLEMENTATION

These are separate concerns.

## 4.1 Base44 provides the reference for

- UI
- UX
- navigation
- workflows
- visible content
- visible demo data
- visible states
- interaction patterns
- current product information architecture

## 4.2 New VRSOC provides the implementation for

- frontend
- authentication
- authorization
- database
- tenant isolation
- API/service logic
- telemetry
- detection
- simulation
- storage
- realtime
- reporting
- integrations
- AI

The new application must not attempt to reproduce unknown Base44 internal architecture.

---

# 5. OBSERVATION RULE

All reverse-engineering results must be classified as:

```text
OBSERVED
INFERRED
UNKNOWN
TARGET
```

Example:

```text
OBSERVED:
The dashboard displays Active Alerts.

INFERRED:
The application has an alert data concept.

UNKNOWN:
How Base44 stores the alert records internally.

TARGET:
The new VRSOC application will model alerts in Supabase/PostgreSQL.
```

The agent must never turn an inference into a fact.

---

# 6. REVERSE-ENGINEERING OBJECTIVE

The reverse-engineering phase must produce enough information that a frontend engineer could reproduce the Base44 interface without continuously reopening the original application.

The agent must inspect the live application as a black box.

## 6.1 UI inventory

Capture:

- page layouts
- sidebar
- topbar
- navigation
- cards
- metric widgets
- tables
- forms
- charts
- dialogs
- drawers
- tabs
- filters
- search
- pagination
- badges
- status indicators
- severity indicators
- icons
- visual states
- animations
- responsive behavior

## 6.2 Screen inventory

Record every reachable screen and route.

For each screen document:

```text
Route
Purpose
Layout
Components
Visible data
Actions
Navigation
Validation
Loading state
Empty state
Error state
Success state
Responsive behavior
Screenshot
```

## 6.3 Workflow inventory

Record:

```text
START
→ ACTION
→ UI RESPONSE
→ DATA CHANGE
→ NAVIGATION
→ NEXT ACTION
```

Example:

```text
Alerts
→ Open alert
→ Alert detail
→ Investigate
→ Create incident
→ Assign analyst
→ Add evidence
→ Update status
```

## 6.4 Browser/network observations

Where the browser exposes the information, inspect:

- network requests
- fetch/XHR requests
- request methods
- response status
- response payloads
- visible endpoint paths
- browser console errors
- failed requests
- client-side storage that is safely observable

Do not assume that an observable endpoint represents the complete backend architecture.

---

# 7. REVERSE-ENGINEERING DELIVERABLES

Create:

```text
docs/reverse-engineering/
├── executive-summary.md
├── route-inventory.md
├── screen-inventory.md
├── navigation-map.md
├── workflow-map.md
├── ui-specification.md
├── component-inventory.md
├── visible-data-inventory.md
├── data-entity-hypotheses.md
├── observable-api-map.md
├── permissions-observations.md
├── responsive-behavior.md
├── simulation-behavior.md
├── base44-content-catalog.md
├── current-gaps.md
├── unknowns.md
└── screenshots/
```

Every major screen should have a corresponding reference screenshot where possible.

---

# 8. PRODUCT SOURCE-OF-TRUTH HIERARCHY

When requirements overlap or appear different, use this hierarchy:

## Level 1 — Explicit product requirement

The VRSOC master specification defines the intended functional scope.

## Level 2 — Base44 observable behavior

The live Base44 application defines the current UI/UX/product behavior that must be replicated.

## Level 3 — Architecture decisions in this document

This roadmap defines how the new implementation will be engineered.

## Level 4 — Agent inference

Inference may only be used when necessary and must be explicitly documented.

Never silently invent requirements.

---

# 9. TARGET TECHNOLOGY STACK

## 9.1 Frontend

Use:

- Next.js
- TypeScript
- Tailwind CSS
- reusable VRSOC UI system
- React Server Components where beneficial
- client components only where interactivity requires them
- Redux Toolkit only where shared client state is justified
- RTK Query only where it adds clear value
- Zod for validation
- React Hook Form where appropriate
- Playwright for browser/E2E tests
- Vitest for unit tests

## 9.2 Backend and Data Platform

Use Supabase as the default production backend foundation:

- PostgreSQL
- Supabase Auth
- Row Level Security
- Realtime
- Storage
- Edge Functions

Do not introduce NestJS as the default backend.

A separate backend service is permitted only when a measurable technical requirement justifies it.

Potential future reasons could include:

- sustained high-volume telemetry processing
- long-running worker processes
- specialized stream processing
- advanced integrations
- backend workloads unsuitable for the chosen Supabase execution model

Until such a requirement exists, additional backend infrastructure is unnecessary.

---

# 10. WHY SUPABASE

VRSOC contains strongly relational data:

```text
Organization
 ├── Teams
 │    └── Users
 │
 ├── Assets
 │    └── Agents
 │
 ├── Events
 │    └── Logs
 │
 ├── Alerts
 │    └── Incidents
 │         └── Cases
 │
 ├── MITRE mappings
 ├── Compliance findings
 └── Training data
```

PostgreSQL is well suited to these relationships.

Supabase also provides:

- authentication
- database
- RLS
- realtime
- object storage
- server-side functions

This makes it a strong initial architecture for the VRSOC SaaS.

---

# 11. MULTI-TENANT ARCHITECTURE

VRSOC is a SaaS product.

Tenant isolation is therefore a core security requirement.

Conceptually:

```text
Organization
    │
    ├── Memberships
    ├── Teams
    ├── Assets
    ├── Agents
    ├── Events
    ├── Logs
    ├── Alerts
    ├── Incidents
    ├── Cases
    ├── Reports
    └── Training data
```

All tenant-owned records must be organization-scoped.

Frontend filtering is NOT considered security.

Supabase/PostgreSQL RLS must enforce tenant boundaries.

---

# 12. AUTHENTICATION

Use Supabase Auth for:

- registration
- login
- logout
- password recovery
- email verification
- sessions
- MFA support
- user identity

Do not create a second custom password/session system.

Application profile information belongs in application tables.

---

# 13. ROLES

The VRSOC specification defines:

```text
Super Admin
Instructor
Student
SOC Analyst
Incident Responder
Threat Hunter
Auditor
Viewer
```

Implement permission management as a proper authorization system rather than scattering role checks throughout the UI.

Conceptually:

```text
Role
→ Permission
→ Resource
→ Action
```

Authorization must be enforced server-side.

---

# 14. TARGET REPOSITORY STRUCTURE

```text
vrsoc/
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── lib/
│       ├── hooks/
│       └── tests/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed/
│   └── config.toml
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   ├── security/
│   └── config/
│
├── docs/
│   ├── reverse-engineering/
│   ├── product/
│   ├── architecture/
│   ├── security/
│   ├── api/
│   └── phase-reports/
│
├── tests/
│   └── fixtures/
│
├── AGENTS.md
├── ROADMAP.md
├── VR_SOC.md
├── README.md
├── package.json
└── pnpm-workspace.yaml
```

If the project remains a single Next.js deployable, preserve the domain boundaries even when separate services are not required.

---

# 15. VRSOC DESIGN SYSTEM

The Base44 application is the visual reference.

The new design system should preserve the reference UI rather than inventing an unrelated design.

The VRSOC specification defines:

- dark mode
- premium cybersecurity theme
- glassmorphism
- smooth animations
- professional typography
- interactive charts
- modern tables
- animated graphs
- resizable widgets
- global search
- command palette
- responsive design
- mobile support

Base colors specified by the master product specification:

```text
Primary:   #5B0A0A
Secondary: #B71C1C
Background:#0A0A0A
Cards:     #161616
Accent:    #E53935
Text:      White
```

Create reusable components for:

```text
AppShell
Sidebar
Topbar
Card
DataTable
Badge
StatusBadge
SeverityBadge
Modal
Drawer
Tabs
Form Controls
Timeline
ChartContainer
Search
CommandPalette
Toast
Skeleton
EmptyState
ErrorState
```

The implementation should reproduce Base44's visual hierarchy and interaction model first.

---

# 16. CORE DOMAIN MODEL

Major domains:

```text
identity
organizations
teams
training
assets
agents
telemetry
logs
detections
alerts
incidents
cases
investigations
mitre
threat-intelligence
compliance
vulnerabilities
malware
fim
analytics
reports
notifications
api
ai
audit
settings
```

Do not create one giant unstructured domain module.

Each domain should own:

- types
- validation
- data access boundaries
- business rules
- tests

---

# 17. SHARED SOC DATA FLOW

The most important technical pipeline is:

```text
Simulation
    ↓
Telemetry
    ↓
Event / Log
    ↓
Normalization
    ↓
Enrichment
    ↓
Correlation
    ↓
Detection Rule
    ↓
Alert
    ↓
Incident
    ↓
Investigation
    ↓
Case
    ↓
Report / Analytics / AI
```

This pipeline must be shared.

Do not create independent fake data systems for each screen.

---

# 18. PHASE ROADMAP

---

# PHASE 00 — BASE44 UI/UX REVERSE ENGINEERING

## Goal

Inspect the live Base44 VRSOC application and produce a complete replication blueprint.

## Do not

- build the replacement application
- create Supabase migrations
- create frontend pages
- invent backend architecture
- modify Base44

## Deliver

The complete reverse-engineering package described in Section 7.

## Completion gate

The phase is complete only when the agent can explain:

- all reachable routes
- all major screens
- primary navigation
- major workflows
- component patterns
- visible content/data
- observable browser behavior
- responsive behavior
- known gaps
- unknowns

Stop after Phase 00.

---

# PHASE 01 — PRODUCT BLUEPRINT

Combine:

```text
Base44 observed behavior
+
VRSOC master specification
+
SaaS requirements
+
Supabase constraints
```

Create:

```text
docs/product/
├── functional-requirements.md
├── screen-requirements.md
├── user-flows.md
├── roles-and-permissions.md
├── data-requirements.md
├── training-requirements.md
├── non-functional-requirements.md
└── acceptance-criteria.md
```

Explicitly identify:

- preserved Base44 behavior
- specification-required additions
- intentionally improved areas
- unresolved questions

---

# PHASE 02 — ARCHITECTURE CONSTITUTION

Create:

```text
AGENTS.md
docs/architecture/system-architecture.md
docs/architecture/domain-boundaries.md
docs/architecture/data-architecture.md
docs/architecture/realtime-architecture.md
docs/architecture/security-architecture.md
docs/development/definition-of-done.md
```

Define:

- naming
- code organization
- state management
- validation
- error handling
- security
- RLS
- testing
- UI replication rules
- documentation rules

---

# PHASE 03 — NEW REPOSITORY BOOTSTRAP

Since no local project exists, create the new repository.

Set up:

- Next.js
- TypeScript
- Tailwind
- pnpm
- linting
- formatting
- environment validation
- testing
- Playwright
- Supabase development connection
- CI pipeline

Initial checks:

```text
lint
typecheck
test
build
```

must pass.

---

# PHASE 04 — SUPABASE FOUNDATION

Configure:

- Supabase project
- local/dev environment
- Supabase clients
- Auth integration
- database migration process
- RLS strategy
- Storage
- Edge Functions
- development seed framework

Do not create every table in one giant migration.

Create schema incrementally by domain.

---

# PHASE 05 — BASE44 UI REPLICATION DESIGN SYSTEM

Translate the reverse-engineered UI into reusable components.

Use Base44 as the visual reference.

Create:

- design tokens
- AppShell
- navigation
- cards
- tables
- forms
- modals
- drawers
- tabs
- badges
- charts
- timeline
- search
- command palette
- loading states
- empty states
- error states

Acceptance requirement:

Representative screens should visually resemble the Base44 source closely before proceeding to large-scale page implementation.

---

# PHASE 06 — AUTHENTICATION

Implement:

- registration
- login
- logout
- password recovery
- email verification
- sessions
- MFA support
- profile

Use Supabase Auth.

---

# PHASE 07 — MULTI-TENANCY

Create:

```text
organizations
memberships
teams
invitations
```

Implement RLS.

Mandatory tests:

```text
Same tenant read
Cross tenant read denied
Same tenant write
Cross tenant write denied
Removed membership denied
```

---

# PHASE 08 — RBAC

Implement:

```text
Super Admin
Instructor
Student
SOC Analyst
Incident Responder
Threat Hunter
Auditor
Viewer
```

Build centralized authorization.

Test both:

```text
allowed actions
denied actions
```

---

# PHASE 09 — APPLICATION SHELL

Implement the Base44-equivalent:

- sidebar
- topbar
- organization switcher
- team selection
- breadcrumbs
- global search
- command palette
- notifications
- profile menu
- responsive navigation

Visual parity is required.

---

# PHASE 10 — CORE SOC DATA MODEL

Create foundational entities:

```text
assets
asset_groups
agents
events
logs
identities
processes
network_connections
files
```

Establish:

- IDs
- tenant ownership
- timestamps
- indexes
- relationships
- RLS

---

# PHASE 11 — AGENT MANAGEMENT

Implement:

- agent list
- agent detail
- health metrics
- CPU
- RAM
- disk
- hostname
- OS
- version
- IP
- group
- last seen
- status history

Simulation states:

```text
Online
Offline
Updating
Error
Pending
```

---

# PHASE 12 — TELEMETRY SIMULATION ENGINE

Build the canonical simulation engine.

Architecture:

```text
Scenario
→ Simulated telemetry
→ Normalized event
→ Stored event
→ Detection consumers
```

Do not create page-specific fake data generators.

---

# PHASE 13 — LOG / EVENT PIPELINE

Implement simulated ingestion from:

- Windows
- Linux
- Syslog
- Firewall
- DNS
- VPN
- Cloud
- Web Server
- Email
- Identity Provider

Implement:

- normalization
- enrichment
- persistence
- search
- filtering
- retention metadata

---

# PHASE 14 — SIEM

Build Base44-equivalent SIEM UI and functionality:

- log explorer
- event search
- filters
- highlighting
- timeline
- correlation
- saved queries
- source views
- dashboard widgets

Charts and counts must come from actual application data.

---

# PHASE 15 — THREAT DETECTION ENGINE

Build reusable rules.

Supported educational detections include:

- authentication failure
- brute force
- credential stuffing
- account lockout
- privilege escalation
- suspicious PowerShell
- encoded PowerShell
- suspicious CMD
- persistence
- scheduled task persistence
- registry persistence
- malware detection
- unauthorized USB
- suspicious service
- DNS tunneling indicators
- network scanning
- port scan detection
- web attack indicators
- impossible travel
- unusual login time
- file integrity violation
- configuration changes

Each alert should support:

```text
Severity
Risk Score
Description
MITRE mapping
Timeline
Affected Asset
Recommended Defensive Actions
```

---

# PHASE 16 — ALERT MANAGEMENT

Implement:

- open
- acknowledged
- closed
- false positive
- critical
- high
- medium
- low
- assignment
- comments
- timeline
- related telemetry
- MITRE
- affected assets

Preserve Base44 UI flow.

---

# PHASE 17 — EDR SIMULATION

Implement:

```text
Processes
Registry
Files
Network Connections
Services
Scheduled Tasks
Startup Items
USB Events
```

Connect EDR data to shared telemetry and detection systems.

---

# PHASE 18 — XDR CORRELATION

Correlate:

```text
Endpoint
Identity
Email
DNS
Cloud
Network
Firewall
Authentication
```

Create cross-source investigation views.

---

# PHASE 19 — MITRE ATT&CK CENTER

Implement:

- tactics
- techniques
- sub-techniques
- coverage
- detection rules
- examples
- mitigations
- detection logic
- search
- filtering
- coverage dashboard

MITRE should be shared platform data.

---

# PHASE 20 — THREAT INTELLIGENCE / IOC

Support:

```text
IP
Domain
URL
Hash
Email
File
```

Relate IOCs to:

```text
Events
Alerts
Incidents
Cases
Assets
Malware
```

---

# PHASE 21 — THREAT HUNTING

Build the investigation workspace:

```text
IOC search
IP
Hash
User
Host
Process
Registry
DNS
```

Output:

```text
Related Alerts
Timeline
Related Assets
Related Users
Attack Path
Evidence
Analyst Notes
```

This should be a real investigation workspace rather than a CRUD page.

---

# PHASE 22 — INCIDENT RESPONSE

Implement:

```text
Detection
→ Analysis
→ Containment
→ Eradication
→ Recovery
→ Lessons Learned
```

Include:

- playbooks
- task checklists
- assignments
- ownership
- status history
- timeline
- evidence
- notes

---

# PHASE 23 — CASE MANAGEMENT

Build:

```text
Case
├── Alerts
├── Incidents
├── Evidence
├── IOC
├── Timeline
├── Notes
├── Attachments
└── Investigation History
```

---

# PHASE 24 — KNOWLEDGE CENTER

Implement the educational content platform.

Topics include:

- SOC
- SIEM
- SOAR
- EDR
- XDR
- NDR
- MDR
- Threat Intelligence
- IOC
- IOA
- MITRE ATT&CK
- YARA
- Sigma
- CVE
- CVSS
- OWASP
- Incident Response
- Digital Forensics
- Windows Logs
- Linux Logs
- Authentication
- Cloud Security
- Email Security
- Network Security
- Zero Trust
- Risk Management
- Compliance

Content types:

- articles
- diagrams
- examples
- quizzes
- progress tracking

---

# PHASE 25 — SIMULATION LAB

Instructor creates safe scenarios:

- multiple failed logins
- account lockout
- malware alert
- USB connection
- PowerShell execution
- suspicious process
- file modification
- firewall block
- DNS anomaly
- privilege escalation
- network scan

The scenario must use the real telemetry pipeline:

```text
Scenario
→ Telemetry
→ Event/Log
→ Correlation
→ Detection
→ Alert
→ MITRE
→ Investigation
```

No disconnected fake screens.

---

# PHASE 26 — TRAINING PROGRESS

Implement:

- student progress
- lab completion
- scores
- attempts
- quizzes
- scenario assignments
- instructor overview
- team/cohort analytics

---

# PHASE 27 — COMPLIANCE CENTER

Support:

```text
ISO/IEC 27001
NIST Cybersecurity Framework
PCI DSS
HIPAA
GDPR
CIS Controls
```

Implement:

- control status
- passed controls
- failed controls
- recommendations
- mapped findings
- audit history

Compliance findings should connect to actual platform findings where possible.

---

# PHASE 28 — VULNERABILITY MANAGEMENT

Implement:

```text
Assets
CVE
CVSS
Severity
Affected Software
Remediation
Patch Status
Risk Score
Exploit Availability
Trends
```

Keep it educational and defensive.

---

# PHASE 29 — MALWARE ANALYSIS

Implement simulated information for:

```text
File
MD5
SHA1
SHA256
File Size
Digital Signature
Behavior
Processes
Network Connections
Registry Changes
Dropped Files
IOCs
Family Classification
MITRE Mapping
Timeline
Static Analysis Summary
Sandbox Summary
```

Do not create malware or offensive automation.

---

# PHASE 30 — FILE INTEGRITY MONITORING

Support:

- file creation
- deletion
- modification
- permission changes
- integrity violations

Connect FIM events to the shared telemetry/detection architecture.

---

# PHASE 31 — ANALYTICS

Build reusable analytics for:

- alerts
- incidents
- threat trends
- authentication trends
- endpoint health
- agent statistics
- MITRE coverage
- compliance
- vulnerability trends
- malware trends
- executive dashboard
- SOC KPI dashboard

No hardcoded production-looking metrics.

---

# PHASE 32 — AUDIT CENTER

Track:

- user login
- configuration changes
- policy updates
- user creation
- agent changes
- permission changes
- detection rule changes

Implement append-oriented audit records and timeline views.

---

# PHASE 33 — REPORTING ENGINE

Create one report engine with templates for:

- executive summary
- technical summary
- incident summary
- threat statistics
- compliance
- MITRE mapping
- recommendations
- timeline

Exports:

```text
PDF
CSV
JSON
```

---

# PHASE 34 — REALTIME

Use Supabase Realtime where appropriate for:

- alerts
- agent status
- simulation events
- dashboard counters
- notifications
- investigation updates

Do not expose tenant data through public realtime channels.

---

# PHASE 35 — NOTIFICATIONS

Support:

- in-app
- email
- Slack
- Microsoft Teams
- webhooks

Use a common notification abstraction with channel adapters.

---

# PHASE 36 — API CENTER

Implement:

- REST API
- API keys
- scoped permissions
- usage statistics
- documentation
- rate limits
- webhooks

API keys must be:

- scoped
- revocable
- tenant-bound
- auditable

---

# PHASE 37 — SETTINGS

Implement:

- organizations
- teams
- users
- roles
- alert rules
- agent policies
- notification settings
- appearance
- language
- security
- backups

Maintain Base44 interaction patterns while improving implementation quality.

---

# PHASE 38 — AI SECURITY ASSISTANT

Implement only after the structured SOC data is available.

The AI assistant should use VRSOC context:

```text
Alert
+ Related Logs
+ Timeline
+ Asset
+ User
+ MITRE
+ Case
+ Knowledge Content
```

It should explain:

- what happened
- why it was detected
- contributing logs
- relevant MITRE technique
- possible impact
- next investigation steps
- defensive containment guidance
- recovery guidance
- related learning content

The AI must teach and explain, not merely classify.

Do not build a generic chatbot disconnected from VRSOC data.

---

# PHASE 39 — SECURITY HARDENING

Perform dedicated security validation for:

- authentication
- authorization
- RLS
- tenant isolation
- XSS
- CSRF
- CORS
- injections
- rate limiting
- session security
- MFA
- API keys
- webhooks
- file uploads
- audit logs
- secrets
- dependency vulnerabilities

Mandatory negative tests:

```text
Organization A → Organization B data
Viewer → write endpoint
Student → privileged endpoint
Removed member → protected resource
Revoked API key → API
Expired session → protected resource
```

---

# PHASE 40 — AUTOMATED TESTING

Required test layers:

```text
Unit
Integration
Database/RLS
API
Authorization
Tenant isolation
E2E
Browser
Simulation
```

Golden path:

```text
Register
→ Verify
→ Login
→ Create Organization
→ Invite Member
→ Create Agent
→ Run Simulation
→ Generate Telemetry
→ Generate Detection
→ Create Alert
→ Investigate
→ Create Incident
→ Create Case
→ Generate Report
```

The golden path must pass before production release.

---

# PHASE 41 — OBSERVABILITY & PERFORMANCE

Instrument:

- API latency
- database latency
- simulation latency
- detection latency
- alert-generation latency
- realtime connections
- failed requests
- function failures
- background processing
- application errors

Use structured logs and health checks.

Do not optimize based on assumptions.

Measure first.

---

# PHASE 42 — PRODUCTION DEPLOYMENT

Create:

```text
development
staging
production
```

Implement:

- CI/CD
- migrations
- secrets management
- backups
- rollback process
- health checks
- monitoring
- deployment documentation

---

# PHASE 43 — BASE44 VISUAL PARITY AUDIT

Perform a screen-by-screen comparison:

```text
Base44 screen
      ↓
New VRSOC screen
      ↓
Compare
      ↓
Fix
```

Review:

- layout
- spacing
- typography
- colors
- cards
- tables
- charts
- icons
- controls
- modal behavior
- navigation
- loading states
- empty states
- errors
- animations
- responsive/mobile behavior

The objective is visual and behavioral parity with the observable Base44 reference.

Do not redesign arbitrarily in this phase.

---

# PHASE 44 — RELEASE READINESS

Final checklist:

```text
[ ] Base44 reverse engineering complete
[ ] UI replication blueprint complete
[ ] Product requirements complete
[ ] Architecture documented
[ ] Repository initialized
[ ] Supabase configured
[ ] Authentication secure
[ ] Tenant isolation verified
[ ] RLS verified
[ ] RBAC verified
[ ] Design system stable
[ ] UI parity validated
[ ] Telemetry pipeline stable
[ ] Detection engine stable
[ ] Alerts stable
[ ] Investigations stable
[ ] Incidents stable
[ ] Cases stable
[ ] Training system stable
[ ] Simulation lab stable
[ ] Compliance stable
[ ] Analytics stable
[ ] Reports stable
[ ] Notifications stable
[ ] API stable
[ ] AI assistant grounded
[ ] Security review complete
[ ] Automated tests pass
[ ] Golden path passes
[ ] Performance reviewed
[ ] Backups verified
[ ] Rollback verified
[ ] Production monitoring active
```

---

# 19. ANTIGRAVITY OPERATING PROTOCOL

Antigravity must work strictly phase-by-phase.

It must never be asked to "build all of VRSOC".

Every execution follows:

```text
READ
↓
INSPECT
↓
PLAN
↓
IMPLEMENT
↓
TEST
↓
BROWSER VERIFY
↓
SECURITY VERIFY
↓
DOCUMENT
↓
STOP
```

---

# 20. MANDATORY ANTIGRAVITY RULES

1. Read `VR_SOC.md` and `AGENTS.md` before every phase.
2. Read the current phase requirements before editing.
3. Inspect the existing implementation before modifying it.
4. Work only on the requested phase.
5. Do not silently implement future phases.
6. Never invent missing Base44 behavior.
7. Separate OBSERVED, INFERRED, UNKNOWN and TARGET information.
8. Preserve Base44 UI/UX unless an explicit product requirement requires change.
9. Reuse shared components.
10. Do not duplicate business rules.
11. Do not trust frontend-only authorization.
12. Enforce tenant isolation at the data/security layer.
13. Add loading, empty, error and success states to user-facing features.
14. Add tests for important workflows.
15. Run browser verification for UI changes.
16. Do not introduce NestJS or another backend framework without an explicit architecture decision.
17. Do not introduce infrastructure merely because it is technically possible.
18. Do not create offensive cybersecurity capabilities.
19. Keep malware/attack behavior simulated and educational.
20. Do not modify unrelated features.
21. Document assumptions.
22. Document known limitations.
23. Do not mark a phase complete when required checks fail.
24. Stop after completing the requested phase.

---

# 21. DEFINITION OF DONE

A phase is complete only when:

```text
Implementation complete
AND
Type checking passes
AND
Lint passes
AND
Relevant tests pass
AND
Browser verification passes where applicable
AND
Security review completed where applicable
AND
Documentation updated
AND
No unrelated regression introduced
```

Every phase creates:

```text
docs/phase-reports/phase-XX.md
```

Required contents:

```text
Objective
Implemented
Files changed
Database changes
Security considerations
Tests executed
Browser verification
Known issues
Assumptions
Next-phase dependencies
```

---

# 22. UI REPLICATION RULE

When a Base44 reference exists for a feature:

1. Preserve major layout relationships.
2. Preserve information hierarchy.
3. Preserve terminology.
4. Preserve primary workflows.
5. Preserve interaction patterns.
6. Preserve important visual states.
7. Preserve responsive behavior where observable.
8. Use the shared VRSOC design system.
9. Improve accessibility and engineering quality without unnecessarily altering the user experience.
10. Do not replace the Base44 design with a completely different interface for convenience.

The desired result is:

```text
Base44 VRSOC
      ≈
New VRSOC Frontend
```

in observable UI/UX and workflows.

---

# 23. DATA MIGRATION / CONTENT REPLICATION RULE

The Base44 application may contain visible demonstration content and records.

The reverse-engineering phase must identify:

```text
Visible product content
Visible example data
Visible demo scenarios
Visible labels
Visible reference values
```

Where such information is legally and technically available for reuse, recreate equivalent application seed/content data in the new VRSOC system.

Do not claim to have copied Base44 private backend data unless actual authorized access is provided.

Target architecture:

```text
Base44 visible reference
          ↓
Content/data inventory
          ↓
New Supabase seed/content model
          ↓
New VRSOC frontend
```

---

# 24. FRONTEND IMPLEMENTATION PRINCIPLE

The new frontend should not start from a blank generic dashboard.

It should be derived from:

```text
Base44 Reverse Engineering
          ↓
UI specification
          ↓
Reusable design system
          ↓
Page implementation
          ↓
Supabase integration
```

The frontend should consume real Supabase-backed application data after the corresponding domain exists.

Do not hardcode fake production-looking data into completed screens.

Demo/test seed data is acceptable when explicitly identified as seed data.

---

# 25. GOLDEN PRODUCT PRINCIPLE

The Simulation Lab must not be a collection of disconnected animations.

The same simulation event should travel through the system:

```text
Instructor scenario
        ↓
Simulation Engine
        ↓
Telemetry
        ↓
Events / Logs
        ↓
Correlation
        ↓
Detection
        ↓
Alert
        ↓
MITRE
        ↓
Investigation
        ↓
Incident
        ↓
Case
        ↓
Analytics / Report
        ↓
AI Explanation
```

This shared pipeline is a core differentiator of VRSOC.

---

# 26. FINAL TARGET ARCHITECTURE

```text
                         VRSOC
                           │
               ┌───────────┴───────────┐
               │                       │
          Next.js Frontend          Supabase
               │                       │
       ┌───────┼────────┐       ┌──────┼───────────┐
       │       │        │       │      │            │
      UI     Server   Client   Auth  Postgres     Realtime
       │                         │      │            │
       └─────────────────────────┴──────┴────────────┘
                                  │
                           Edge Functions
                                  │
                        Secure server operations
                                  │
                          Simulation / Services
                                  │
        ┌─────────────────────────┼────────────────────────┐
        │                         │                        │
    Telemetry                Detection                 Learning
        │                         │                        │
   Events / Logs              Alerts                  Labs
   Assets / Agents            Incidents                Quizzes
                              Cases                    Progress
        │                         │                        │
        └─────────────────────────┼────────────────────────┘
                                  │
                         Intelligence Layer
                                  │
                      MITRE / IOC / Compliance
                                  │
                    Analytics / Reports / AI
```

---

# 27. FIRST EXECUTION ORDER

Do not start coding immediately.

Execute:

```text
PHASE 00
Base44 UI/UX Reverse Engineering

        ↓

PHASE 01
Product Blueprint

        ↓

PHASE 02
Architecture Constitution

        ↓

PHASE 03
New Repository Bootstrap

        ↓

PHASE 04
Supabase Foundation

        ↓

PHASE 05
Base44 UI Replication Design System
```

Only after these foundations are complete should feature-domain implementation begin.

---

# 28. PHASE 00 — READY-TO-PASTE ANTIGRAVITY PROMPT

Use the following as the first Antigravity task:

```text
You are the Principal Engineer responsible for reverse engineering the
existing VRSOC Base44 application before rebuilding it.

There is currently NO local VRSOC source repository.

Existing live product reference:

https://vrsoc.base44.app/

The VRSOC master specification is also available in the project context.

YOUR TASK IS PHASE 00 ONLY.

DO NOT BUILD THE NEW VRSOC APPLICATION.

DO NOT CREATE SUPABASE TABLES.

DO NOT CREATE FRONTEND COMPONENTS.

DO NOT CREATE THE NEW BACKEND.

DO NOT MODIFY THE BASE44 APPLICATION.

OBJECTIVE

Black-box reverse engineer the existing Base44 VRSOC application.

The purpose is to produce enough documentation that another engineer can
rebuild the VRSOC frontend with highly faithful visual and behavioral parity.

The Base44 application is the UI/UX reference.

The VRSOC master specification is the intended product specification.

You must keep those sources conceptually separate.

INSPECT

1. Every reachable route.
2. Every reachable page.
3. Navigation hierarchy.
4. Sidebar.
5. Topbar.
6. Dashboard widgets.
7. Cards.
8. Tables.
9. Charts.
10. Forms.
11. Filters.
12. Search.
13. Command palette.
14. Tabs.
15. Modals.
16. Drawers.
17. Dropdowns.
18. Badges.
19. Severity indicators.
20. Status indicators.
21. Loading states.
22. Empty states.
23. Error states.
24. Success states.
25. Hover states.
26. Active states.
27. Animations and transitions.
28. Responsive/mobile behavior.
29. Authentication behavior that is observable.
30. User workflows.
31. SOC workflows.
32. Simulation workflows.
33. Alert workflows.
34. Incident workflows.
35. Case workflows.
36. Investigation workflows.
37. Training/knowledge workflows.
38. Visible data/content.
39. Observable browser network behavior.
40. Observable API requests/responses where available.
41. Browser console/runtime errors.

FOR EACH SCREEN DOCUMENT

- route
- purpose
- layout
- component hierarchy
- visible text
- visible data
- controls
- actions
- navigation
- validation
- loading state
- empty state
- error state
- success state
- responsive behavior
- screenshot

FOR EACH USER WORKFLOW DOCUMENT

START
→ ACTION
→ UI RESPONSE
→ DATA CHANGE
→ NAVIGATION
→ NEXT ACTION

CLASSIFY EVERY DISCOVERY AS

OBSERVED
INFERRED
UNKNOWN

DO NOT PRESENT INFERENCES AS FACTS.

CREATE

docs/reverse-engineering/
├── executive-summary.md
├── route-inventory.md
├── screen-inventory.md
├── navigation-map.md
├── workflow-map.md
├── ui-specification.md
├── component-inventory.md
├── visible-data-inventory.md
├── data-entity-hypotheses.md
├── observable-api-map.md
├── permissions-observations.md
├── responsive-behavior.md
├── simulation-behavior.md
├── base44-content-catalog.md
├── current-gaps.md
├── unknowns.md
└── screenshots/

IMPORTANT PRODUCT REQUIREMENT

The future VRSOC frontend must closely reproduce the Base44 UI/UX.

Therefore document visual information carefully:

- dimensions
- spacing
- alignment
- typography
- colors
- borders
- shadows
- glass effects
- component states
- layout relationships
- responsive changes
- interaction patterns
- animations

Do not merely describe a page as "dark dashboard".

Record enough detail to reproduce it.

IF LOGIN IS REQUIRED

Use a dedicated test account if authorized.

Do not expose or record personal credentials.

FINAL OUTPUT

Produce a final executive summary containing:

1. What was observed.
2. What is inferred.
3. What remains unknown.
4. All reachable routes.
5. All major screens.
6. Major workflows.
7. Major UI patterns.
8. Visible data/content that should be recreated.
9. Observable API/network behavior.
10. Differences between Base44 and the VRSOC specification.
11. Information required for the next phase.

STOP.

Do not continue to Phase 01.
```

---

# 29. SUCCESS CRITERIA FOR THE ENTIRE PROJECT

The project succeeds when the final VRSOC system provides:

```text
Base44-level UI/UX continuity
+
production-grade Next.js frontend
+
Supabase-backed SaaS architecture
+
multi-tenant security
+
RBAC
+
shared telemetry simulation
+
real SOC workflows
+
training workflows
+
analytics
+
reporting
+
realtime capabilities
+
AI-assisted investigation
+
automated testing
+
production security
```

The final product should feel like the same VRSOC product that users saw in the Base44 demo, while being implemented as a maintainable, secure, extensible production system under the project's control.
