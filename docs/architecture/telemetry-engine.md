# Architecture Document — Telemetry Engine & Simulation Pipeline

> **Module:** Telemetry Engine & Simulation Pipeline  
> **Phase:** 12  
> **Authoritative Specification:** `VR_SOC.md` § Golden Product Principle & Telemetry Pipeline  
> **Target Technology:** Next.js Server Actions + PostgreSQL (Supabase `public.events`, `public.logs`, `public.simulation_scenarios`, `public.simulation_runs`)

---

## 1. Architectural Purpose & Golden Product Principle

The **Telemetry Engine & Simulation Pipeline** provides the single, canonical synthetic data generation system for the entire VRSOC platform.

### The Golden Product Principle
Individual feature screens (SOC Dashboard, Agents, SIEM Log Explorer, Detection Rules, Alert Triage, Incident Dossiers, Cases) must **NEVER** use disconnected client-side mock timers or hardcoded fake arrays.

All simulated activity must flow through the canonical shared pipeline:

```text
Simulation Scenario Definition
      ↓
Simulation Engine (Server Action / Background Pipeline)
      ↓
Synthetic Telemetry Ingestion (Syslog, WinEventLog, NetFlow, EDR)
      ↓
Normalization into public.events & public.logs
      ↓
[Future Phase 14: Detection Rule Evaluation & Sigma Engine]
      ↓
[Future Phase 15: Alert Generation & MITRE ATT&CK Mapping]
      ↓
[Future Phase 17: Incident Declaration & Case Management]
      ↓
[Future Phase 26: SOAR Automated Playbook Execution]
```

---

## 2. Event vs. Log Architectural Distinction

VRSOC explicitly separates normalized semantic security events from raw/ingested log records:

```text
┌────────────────────────────────────────────────────────┐
│                   Raw Log Ingestion                    │
│                      (public.logs)                     │
│  - facility, log_level (DEBUG..EMERG), source_host     │
│  - message, raw_log (Syslog RFC 5424 / CEF / JSON)     │
│  - parse_status ('Raw' | 'Parsed' | 'Dropped')         │
└───────────────────────────┬────────────────────────────┘
                            │ (Parsed & Correlated)
                            ▼
┌────────────────────────────────────────────────────────┐
│                Normalized Telemetry Event              │
│                     (public.events)                    │
│  - organization_id, occurred_at, source, source_type   │
│  - category (Auth, Process, Network, File, Hardware)   │
│  - event_type (AUTH_FAILED, PROCESS_CREATE, C2_BEACON) │
│  - severity (Informational, Low, Medium, High, Crit)   │
│  - asset_id, agent_id, identity_id (Foreign Keys)      │
│  - normalized_fields (JSONB), tags (TEXT[])            │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌─────────────────┐ ┌────────────────┐ ┌────────────────┐
│   Processes     │ │     Files      │ │  NetConns      │
│(public.processes│ │ (public.files) │ │ (public.net...)│
│- pid, ppid, sha │ │ - path, sha256 │ │ - src/dst IP   │
│- command_line   │ │ - is_hidden    │ │ - ports, proto │
└─────────────────┘ └────────────────┘ └────────────────┘
```

---

## 3. Canonical Simulation Scenario Model

Scenarios represent multi-stage educational cyber exercises with deterministic step sequences:

| Scenario Slug | Category | Severity | MITRE Techniques | Key Learning Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `brute-force-auth` | Authentication Attacks | High | T1110.001, T1110.003 | Detect rapid logon failures, inspect source IPs, handle account lockout. |
| `powershell-encoded-exec` | Endpoint Execution | Critical | T1059.001, T1027, T1071 | De-obfuscate Base64 command strings, trace process lineage, isolate host. |
| `scheduled-task-persistence` | Persistence Mechanism | High | T1053.005, T1059.003 | Correlate Event 4698 with dropped `.bat` scripts in AppData. |
| `ransomware-precursor` | Ransomware & Destruction | Critical | T1490, T1486 | Recognize shadow copy deletion commands (`vssadmin`) & canary tampering. |
| `network-port-scan` | Network Anomalies | Medium | T1046, T1595.001 | Analyze TCP SYN bursts in firewall logs, identify internal scan sources. |
| `usb-unauthorized-hardware` | Hardware Additions | Low | T1091, T1052.001 | Inspect device vendor IDs in PnP logs, enforce removable media DLP. |

---

## 4. Simulation Lifecycle & Concurrency

```text
       ┌──────────┐
       │ Pending  │
       └────┬─────┘
            │ Server Action / Engine trigger
            ▼
       ┌──────────┐      Analyst Cancellation
       │ Running  ├────────────────────────────┐
       └────┬─────┘                            │
            │                                  │
     Success│ Failure                          ▼
     ┌──────┴──────┐                     ┌───────────┐
     ▼             ▼                     │ Cancelled │
┌───────────┐ ┌────────┐                 └───────────┘
│ Completed │ │ Failed │
└───────────┘ └────────┘
```

- **Idempotency**: Runs are keyed by unique `simulation_runs.id`.
- **Concurrency**: Multiple scenarios may run concurrently for a tenant without state collision; individual runs are atomic and scoped by `organization_id`.
- **Target Asset Scoping**: An active run may target a specific tenant endpoint (`assets.id`) or automatically resolve the first active host in the tenant fleet.

---

## 5. Security & Multi-Tenancy Invariants

1. **Strict Tenant Scoping**:
   ```sql
   simulation_runs.organization_id 
     = assets.organization_id 
     = agents.organization_id 
     = events.organization_id 
     = logs.organization_id
   ```
2. **Cross-Tenant Prevention**:
   Targeting an asset belonging to Organization B while acting in Organization A is rejected with `403/404` at the server boundary before any event is generated.
3. **RBAC Permission Gate**:
   - `simulation:scenarios:read` / `telemetry:read`: Permitted for all authenticated roles (`Viewer` through `Super Admin`).
   - `simulation:scenarios:launch`: Restricted to operational roles (`Student`, `SOC Analyst`, `Incident Responder`, `Threat Hunter`, `Instructor`, `Super Admin`). Denied for `Viewer` and `Auditor`.
4. **Safety Boundary**:
   The engine generates **purely synthetic telemetry records** inside PostgreSQL. No live socket connections to external adversary servers, no live malware execution, and no destructive OS mutations are performed.

---

## 6. Future Integration Roadmap

- **Phase 13 (Log Explorer & SIEM)**: Queries `public.logs` and `public.events` via search and structured time-series queries.
- **Phase 14 (Detection Rules & Sigma Engine)**: Evaluates Sigma detection rules against the streaming `public.events` pipeline.
- **Phase 15 (Alert Generation)**: Generates actionable SOC alerts linked to MITRE ATT&CK techniques when simulation events match detection criteria.
