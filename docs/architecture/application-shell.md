# Application Shell Architecture — VRSOC Enterprise Platform

## 1. Architectural Overview

The VRSOC Application Shell serves as the unified navigation, contextual, and layout chassis for the enterprise Security Operations Center SaaS platform. It synthesizes the Phase 05 UI Design System, Phase 06 Supabase Authentication, Phase 07 Multi-Tenancy Engine, and Phase 08 Centralized RBAC System into an integrated workspace that faithfully mirrors the Base44 application architecture.

```text
+---------------------------------------------------------------------------------------------------+
|                                       Topbar (64px / Sticky)                                      |
| [Logo / Mobile Toggle]  [Dynamic Breadcrumbs]           [Quick Search] [Org Switcher] [User Menu] |
+-----------------------+---------------------------------------------------------------------------+
| Sidebar (240px Fixed) |                                                                           |
|                       |                                                                           |
| CORE OPERATIONS       |                         Main Content Viewport                             |
| • Dashboard           |                                                                           |
| • Agents (EDR) [156]  |                   (Server Component / Client Island)                      |
| • Alerts [24]         |                                                                           |
| • Incidents [7]       |                                                                           |
| • Threat Detection    |                                                                           |
| • MITRE ATT&CK [78%]  |                                                                           |
| • Log Explorer        |                                                                           |
| • Cases [12]          |                                                                           |
| • Analytics           |                                                                           |
| • AI Assistant [AI]   |                                                                           |
| • Knowledge Center    |                                                                           |
| • Settings            |                                                                           |
|                       |                                                                           |
| SOAR ORCHESTRATION    |                                                                           |
| • SOAR Dashboard      |                                                                           |
| • Automation Pipeline |                                                                           |
| • Playbooks [20]      |                                                                           |
| • Playbook Builder    |                                                                           |
| • Simulation Lab      |                                                                           |
+-----------------------+---------------------------------------------------------------------------+
|                                  Command Palette (Ctrl+K / Modal Overlay)                         |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Shell Components

### 2.1 240px Collapsible Sidebar (`packages/ui/src/components/Sidebar.tsx`)
- **Visual Structure**: 240px fixed width (`w-60`), `#0A0A0A` near-black background, `border-r border-white/[0.08]`.
- **Branding Header**: VRSOC logo monogram (`VS` in `#5B0A0A` badge with `#E53935` border) and uppercase `Enterprise Defense` typography.
- **Navigation Groups**:
  - `Core Operations`: Operational SOC workflows (Dashboard, Agents, Alerts, Incidents, Threat Detection, MITRE ATT&CK, Log Explorer, Cases, Analytics, AI Assistant, Knowledge Center, Settings).
  - `SOAR Orchestration`: Orchestration workflows (SOAR Dashboard, Automation Pipeline, Playbooks, Playbook Builder, Threat Enrichment, AI Engine, Response Actions, Approvals Queue, Live Execution, Simulation Lab, Settings).
- **Badge Indicators**: Integrated count badges (`critical`, `warning`, `ai`, and numeric counters) styled with design system tokens.
- **Active States**: `#5B0A0A`/70 background with `#E53935` left border highlight.
- **Mobile Responsive Drawer**: Slides out on viewports below 1024px with dark backdrop overlay and accessible dismiss triggers.

### 2.2 Topbar (`packages/ui/src/components/Topbar.tsx`)
- **Height & Stickiness**: 64px (`h-16`) sticky header with subtle backdrop blur (`bg-[#0A0A0A]/90`).
- **Dynamic Breadcrumbs Engine**: Auto-computed hierarchy matching current route segments (e.g., `Dashboard / SOAR Dashboard / Automation Pipeline`).
- **Quick Search / Command Trigger**: Dedicated input trigger displaying `Ctrl+K` badge for keyboard-first navigation.
- **Organization Switcher Slot**: Renders the multi-tenant organization context switcher for seamless tenant partitioning.
- **Notifications Bell**: Real-time alert notifications counter trigger.
- **User Profile Menu**: Dropdown menu showing user avatar, verified email, verified role badge, direct links to Platform Settings, Knowledge Center, Design System Showcase, and secure Sign Out action.

### 2.3 Global Command Palette (`packages/ui/src/components/CommandPalette.tsx`)
- **Keyboard Shortcut**: `Ctrl+K` / `Cmd+K` global hotkey interceptor with `Escape` dismiss.
- **Preloaded Index**: Accessible navigation routes and actions dynamically categorized by group (`Core Operations`, `SOAR Orchestration`, `System`).
- **Real-Time Filtering**: Instant client-side fuzzy query search with keyboard arrow navigation (`↑` `↓` `Enter`).

---

## 3. RBAC & Security Integration

### 3.1 Centralized Permission-Based Filtering
- Navigation visibility is governed by `getAccessibleNavGroups(userRole)` in `apps/web/lib/navigation/config.tsx`.
- Maps role permissions directly to route capabilities:
  - `Super Admin`: Complete access across Core Operations, SOAR, and Org Settings.
  - `SOC Analyst`: Access to telemetry, logs, alerts, incidents, cases, and playbooks; settings hidden.
  - `Student`: Read access to scenarios, simulation lab, and knowledge center; administrative routes hidden.
  - `Viewer`: Read-only access across core dashboards.

### 3.2 Authorization Boundary Invariant
> **CRITICAL RULE**: Navigation filtering is strictly a client UX convenience. All database queries, Server Actions, and API mutations independently enforce PostgreSQL Row Level Security (RLS) policies and server-side RBAC permission guards. Hiding a navigation link does not constitute authorization.

---

## 4. Multi-Tenant Context Integration

The application shell seamlessly integrates with Phase 07 multi-tenancy:
1. `getActiveOrganization()` server action resolves the active tenant from verified database memberships.
2. `OrganizationSwitcher` allows authorized users to switch between tenant organizations without leaking data across tenant boundaries.
3. Server Components pass verified organization context down to `AppShellWrapper`.

---

## 5. Roadmap Placeholder Surfaces

To provide a complete navigation surface without polluting the codebase with fake data generators or premature business logic, future modules (`/agents`, `/alerts`, `/incidents`, `/detections`, `/mitre`, `/logs`, `/cases`, `/analytics`, `/ai-assistant`, `/knowledge`, `/settings`, `/soar/*`) are implemented as clean `PlaceholderModulePage` surfaces. Each placeholder explicitly identifies:
- Target module domain and category
- Architectural description
- Planned engineering milestone phase
- Safe navigation escape back to Dashboard
