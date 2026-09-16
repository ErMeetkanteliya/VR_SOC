# VRSOC Phase 00 — Navigation Map

## 1. Primary Navigation Architecture

The VRSOC application uses a unified AppShell layout featuring:
- **Left Sidebar**: 240px wide, dark themed (`#0D0D0D` / `#161616`), collapsible on tablet/mobile screens.
- **Topbar**: Fixed height (64px / 4rem), containing breadcrumbs, global search / Command Palette trigger (`Ctrl+K`), system status badge, notifications drawer trigger, and user profile dropdown.
- **Main Viewport**: Scrollable fluid container (`max-w-7xl` or full-width flex) with dark glassmorphic cards and 24px content padding.

---

## 2. Sidebar Navigation Items

The primary navigation menu is divided into two distinct sections: **Core SOC** and **SOAR Suite**:

### 2.1 Core SOC Section
| Label | Icon | Route Path | Badge / Indicator |
|---|---|---|---|
| **Dashboard** | `LayoutDashboard` (`UC`) | `/` | — |
| **Agents** | `Server` / `ShieldAlert` (`Sv`) | `/agents` | Total count (`156`) |
| **Alerts** | `AlertTriangle` (`Tl`) | `/alerts` | Active count (`24`, Red) |
| **Incidents** | `Flame` / `ShieldAlert` (`Jh`) | `/incidents` | Open count (`7`, Amber) |
| **Threat Detection** | `Crosshair` / `Shield` (`Kr`) | `/detections` | Rules count (`48`) |
| **MITRE ATT&CK** | `Grid` / `Layers` (`Hu`) | `/mitre` | Coverage (`78%`) |
| **Log Explorer** | `Terminal` / `FileText` (`FC`) | `/logs` | Live pulse dot |
| **Cases** | `Briefcase` / `Folder` (`zC`) | `/cases` | Open count (`12`) |
| **Analytics** | `BarChart3` / `TrendingUp` (`Vu`) | `/analytics` | — |
| **AI Assistant** | `Bot` / `Sparkles` (`Lg`) | `/ai-assistant` | `AI` chip |
| **Knowledge Center** | `BookOpen` / `GraduationCap` (`$C`) | `/knowledge` | Article count (`24`) |
| **Settings** | `Settings` / `Sliders` (`WC`) | `/settings` | — |

### 2.2 SOAR Suite Section
| Label | Icon | Route Path | Section Header |
|---|---|---|---|
| **SOAR Dashboard** | `Activity` (`Rl`) | `/soar` | **SOAR ORCHESTRATION** |
| **Automation Pipeline** | `Workflow` / `GitBranch` (`GF`) | `/soar/automation` | — |
| **Playbooks** | `BookMarked` (`BF`) | `/soar/playbooks` | Active count (`20`) |
| **Playbook Builder** | `Sliders` / `Cpu` (`KF`) | `/soar/builder` | Visual editor |
| **Threat Enrichment** | `Globe` / `Radar` (`Ko`) | `/soar/enrichment` | — |
| **AI Decision Engine** | `Brain` / `Cpu` (`yv`) | `/soar/ai-engine` | — |
| **Response Actions** | `Zap` / `ShieldCheck` (`LC`) | `/soar/actions` | Primitives count (`16`) |
| **Approvals** | `CheckCircle2` / `UserCheck` (`Xh`) | `/soar/approvals` | Pending count (`3`, Amber) |
| **SOAR Cases** | `FolderKanban` (`vv`) | `/soar/cases` | — |
| **History** | `History` / `Clock` (`Yh`) | `/soar/history` | Execution log |
| **Live Execution** | `Radio` / `Play` (`VC`) | `/soar/live` | Streaming terminal |
| **Reports** | `FileSpreadsheet` (`Jn`) | `/soar/reports` | Export hub |
| **Simulation** | `FlaskConical` / `PlaySquare` (`Tf`) | `/soar/simulation` | Lab launcher |
| **SOAR Settings** | `Wrench` (`WC`) | `/soar/settings` | Automation policies |

---

## 3. Topbar & Context Controls

- **Breadcrumbs**: Dynamic path renderer (e.g. `Home > SOAR > Playbook Builder`).
- **Global Search / Command Palette (`Ctrl+K` / `Cmd+K`)**:
  - Search routes, alerts, cases, MITRE techniques, and knowledge articles.
  - Quick action shortcuts (e.g., "Declare Incident", "Launch Brute Force Simulation", "Open AI Assistant").
- **System Status Indicator**: Pill badge with green pulsing dot ("All Systems Normal" / "Telemetry Ingestion Active").
- **Notifications Trigger**: Bell icon with unread count badge; opens slide-out drawer with recent critical alerts and task completions.
- **User Profile Menu**:
  - Displays user avatar, full name, role (e.g. `Lead SOC Analyst`).
  - Dropdown options: "My Profile" (`/settings?tab=profile`), "Security & MFA" (`/settings?tab=security`), "API Keys" (`/settings?tab=api`), "Sign Out" (`/login`).

---

## 4. Deep Navigation & Cross-Screen Links

```text
[Alerts Table (/alerts)]
  └── Click "Investigate" ──> Opens Alert Investigation Drawer OR navigates to [/soar/incident/:id]
        ├── Button: "Declare Incident" ──> Navigates to [/incidents] (pre-populates form)
        ├── Button: "Trigger Playbook" ──> Navigates to [/soar/playbooks] (filters relevant playbook)
        └── Button: "Ask AI Assistant" ──> Navigates to [/ai-assistant] (sends alert context)

[Simulation Lab (/soar/simulation)]
  └── Click "Launch Scenario" ──> Progress steps modal ──> Navigates to [/soar/live]
        └── On completion ──> Generates Alert in [/alerts] & Incident in [/incidents]

[MITRE Matrix (/mitre)]
  └── Click Technique (e.g. T1110) ──> Detail Modal ──> Button "Search Logs for T1110" ──> Navigates to [/logs?query=T1110]
```
