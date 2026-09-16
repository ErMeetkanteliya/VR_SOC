# Agent Management & Endpoint Sensor Architecture — Phase 11

> **Status:** APPROVED & IMPLEMENTED  
> **Document Version:** 1.0.0  
> **Target Module:** `/agents` (Endpoint Sensor Fleet Management)  
> **Reference:** `VR_SOC.md` Phase 11, `docs/architecture/core-soc-data-model.md`

---

## 1. Executive Summary

Phase 11 establishes the enterprise Agent Management console and fleet telemetry interface for VRSOC. Monitored endpoints (domain controllers, database servers, workstations, cloud instances) running synthetic EDR and SOC sensors report telemetry, system resource health (CPU, RAM, Disk), heartbeat liveness, and network routing containment states.

The Agent Management system connects directly to the Phase 10 Supabase data foundation (`public.agents`, `public.assets`, `public.asset_groups`), enforcing strict multi-tenant isolation, RBAC permission guards (`agents:read`, `agents:isolate`), and safe educational simulation triggers.

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           VRSOC Web Client                             │
  │                  (/agents - AgentManagementDashboard)                  │
  └───────────────────┬────────────────────────────────┬───────────────────┘
                      │                                │
                      ▼ Server Actions                 ▼ Server Actions
  ┌─────────────────────────────────────────┐  ┌──────────────────────────┐
  │ getAgents / getAgentById                │  │ isolateAgent             │
  │ (Filtered query with fleet KPI summary) │  │ updateAgentGroup         │
  └───────────────────┬─────────────────────┘  │ simulateAgentState       │
                      │                        │ registerEndpointAgent    │
                      ▼ RLS Protected          └────────────┬─────────────┘
  ┌─────────────────────────────────────────────────────────┼─────────────┐
  │                 Supabase PostgreSQL 15+                 │             │
  │  ┌────────────────┐     ┌────────────────┐     ┌────────▼───────┐     │
  │  │  asset_groups  │◄────┤     assets     │◄────┤     agents     │     │
  │  └────────────────┘ 1:N └────────────────┘ 1:1 └────────────────┘     │
  └───────────────────────────────────────────────────────────────────────┘
```

---

## 2. Domain Entities & Database Mapping

Agent Management operates across three normalized relational tables:

1. **`public.agents`**: Sensor runtime entity.
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
   - `asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE` (1:1 constraint `uq_agents_asset`)
   - `agent_version VARCHAR(32) NOT NULL DEFAULT '1.4.2'`
   - `status VARCHAR(32) NOT NULL CHECK (status IN ('Online', 'Warning', 'Critical', 'Offline', 'Updating', 'Pending', 'Error'))`
   - `cpu_usage_pct`, `ram_usage_pct`, `disk_usage_pct NUMERIC(5,2)`
   - `last_seen_at TIMESTAMPTZ NOT NULL`
   - `heartbeat_interval_seconds INTEGER NOT NULL DEFAULT 30`
   - `capabilities JSONB NOT NULL DEFAULT '["edr", "fim", "telemetry", "isolation"]'::jsonb`
   - `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`

2. **`public.assets`**: Hardware/virtual host entity.
   - `hostname`, `display_name`, `asset_type`, `os_type`, `os_version`, `ip_address`, `mac_address`, `criticality`, `status`, `is_isolated`.

3. **`public.asset_groups`**: Organizational categorization clusters.
   - `name`, `description`, `criticality`.

---

## 3. Security & Multi-Tenant Guarantees

### 3.1 Tenant Scoping
- Every query to `agents`, `assets`, and `asset_groups` is scoped with `WHERE organization_id = active_organization_id`.
- Composite foreign keys `(asset_id, organization_id) REFERENCES assets(id, organization_id)` ensure that cross-tenant asset referencing is rejected by the database engine.

### 3.2 RBAC Permission Guards
- **Viewing Fleet (`agents:read`)**: Permitted for `Super Admin`, `SOC Analyst`, `Incident Responder`, `Threat Hunter`, `Instructor`, `Student`, `Auditor`, `Viewer`.
- **Host Containment / Isolation (`agents:isolate`)**: Strictly guarded. Permitted only for `Super Admin`, `SOC Analyst`, `Incident Responder`, `Instructor`. Read-only roles (`Student`, `Auditor`, `Viewer`) are denied.
- **Audit Logging**: Every host isolation or release mutation is written to `public.audit_events` with the actor ID, target asset ID, and analyst reason.

---

## 4. UI & Interaction Design

### 4.1 Base44 Design System Parity
- **KPI Summary Cards**: Total Fleet Agents, Online Sensors (with emerald status dot), Network Isolated hosts (with warning red indicator), and Fleet Average CPU/RAM utilization.
- **Filtering & Search**: Real-time debounce search across hostname, IP, display name, OS version, agent version, and group name; filter dropdowns for status, OS platform, and asset group.
- **Data Table**: Displays host details, monospace IP/MAC, criticality tier, `StatusBadge`, mini CPU/RAM load bars, containment state, and relative time with full timestamp tooltips.
- **Agent Detail Drawer (`<Drawer>`)**:
  - *Overview Tab*: Hardware specifications, network details, and live sensor performance meters.
  - *Simulation & Actions Tab*: Educational state transition controls and asset group reassignment.
  - *Config & Metadata Tab*: Formatted sensor runtime JSON.
- **Isolate Host Modal (`<Modal>`)**: Confirms network containment action with analyst justification.
- **Register Agent Modal (`<Modal>`)**: Allows adding and enrolling new simulated endpoints.

---

## 5. Safe Educational Simulation Boundary

VRSOC is strictly a defensive cyber training platform:
- Endpoint isolation is a simulated state reflected in `assets.is_isolated = true` and `assets.status = 'Isolated'`.
- No remote command execution, offensive payloads, or destructive scripts are generated.
- State simulation buttons allow students and instructors to simulate heartbeats, disconnects, CPU spikes, and sensor upgrades safely within their tenant boundary.
