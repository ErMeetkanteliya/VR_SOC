# VRSOC Phase 00 — Visual Reference & Screenshot Catalog

This directory stores visual layouts, CSS styles, component snapshots, and reference captures for the 32 reverse-engineered VRSOC Base44 screens.

---

## 1. Master Screen Layout Specifications

| Screen Name | Route | Key Visual Hierarchy | Primary Color Accent |
|---|---|---|---|
| **SOC Dashboard** | `/` | 4 Metric KPI Cards + 2 Main Analytics Charts + Critical Alerts Table | Red `#EF4444`, Amber `#F59E0B` |
| **Agent Management** | `/agents` | Metric Status Bar + Filter Inputs + Fleet Health Table | Green `#22C55E`, Blue `#3B82F6` |
| **Alert Management** | `/alerts` | Severity Filter Tabs + Search Input + Alert Feed Cards + Investigation Drawer | Red `#EF4444`, Orange `#F97316` |
| **Incident Response** | `/incidents` | Lifecycle Phase Pills (Detection -> Containment -> Recovery) + Incident Dossiers | Amber `#F59E0B` |
| **Threat Detection** | `/detections` | Category Pills + Rule Status Toggles + Sigma/YARA Editor | Blue `#3B82F6` |
| **MITRE ATT&CK Matrix** | `/mitre` | 12-Column Tactic Grid + Coverage Percentage Headers + Interactive Technique Cards | Purple `#A855F7`, Cyan `#06B6D4` |
| **Log Explorer (SIEM)** | `/logs` | Lucene Search Bar + Timestamp Controls + Monospace Log Stream Console | Cyan `#06B6D4`, White `#FFFFFF` |
| **Case Management** | `/cases` | "New Case" Button + Priority Badges + Investigation Notes Feed | Orange `#F97316` |
| **SOC Analytics** | `/analytics` | MTTD/MTTR Stat Cards + 4 Recharts Visualizations (Volume, Auth, Tactics, Fleet) | Emerald `#10B981`, Red `#EF4444` |
| **AI Security Assistant** | `/ai-assistant` | Full-Height Chat Interface + Suggested Prompt Chips + Markdown Response View | Cyan `#06B6D4`, Red `#E53935` |
| **Knowledge Center** | `/knowledge` | Difficulty Badges (Beginner/Intermediate/Advanced) + Article Cards + Drawer Reader | Green `#22C55E`, Amber `#F59E0B` |
| **SOAR Dashboard** | `/soar` | Automation Rate Gauge + Playbook Run Metrics + Live Approval Queue | Purple `#A855F7`, Red `#E53935` |
| **SOAR Playbook Builder** | `/soar/builder` | Visual Node Canvas (Trigger, Threat Intel, AI Decision, Firewall Block, End) | Multi-Color Node Palette |
| **SOAR Live Execution** | `/soar/live` | Realtime Dark Terminal Console with streaming log entries | Slate `#090D16`, Green `#22C55E` |

---

## 2. Visual Reference Asset Sources

- The application styling is defined in `scratch/index.css` and compiled within `scratch/index.js`.
- Master logo mark: SVG rounded rect `#5B0A0A` with bold white text "VS".
- Favicon / PWA icon: `https://media.base44.com/images/public/6a55f6efe8da4e1559b8a51b/0274fe9be_logo.png`.
