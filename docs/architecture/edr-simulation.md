# Architecture: EDR Simulation & Endpoint Investigation

> **Subsystem:** Phase 17 — EDR Simulation & Endpoint Investigation Workbench  
> **Target Technology:** Next.js (App Router) + TypeScript + PostgreSQL (Supabase) + Vitest + Playwright  
> **Status:** Authoritative Architecture Reference  

---

## 1. Overview & Pipeline Placement

The **EDR Simulation & Endpoint Investigation** layer represents the endpoint telemetry collection, safe educational simulation, and forensic investigation engine of VRSOC. It integrates seamlessly into the canonical Phase 13–16 telemetry, SIEM, and detection pipeline.

```text
+-------------------------------------------------------------------------+
|                  EDR Simulation Scenarios (Phase 17)                    |
|  (Process Tree, Registry, Files, Sockets, Services, Tasks, Startup, USB) |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|              Phase 13 Ingestion & Normalization Pipeline                |
|               (Validation -> Parsing -> Normalization -> Persistence)   |
|   -> public.events, public.processes, public.files,                     |
|      public.network_connections, public.registry_events,                |
|      public.endpoint_services, public.scheduled_task_events,            |
|      public.startup_items, public.usb_events                            |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        Phase 14 SIEM Layer                              |
|          (Search, Filtering, Timeline, Telemetry Correlation)           |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    Phase 15 Detection Engine                            |
|             (Sigma & Composite Heuristic Detection Rules)               |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    Phase 16 Alerts & Triage Layer                       |
|               (Deduplication, Risk Scoring, Triage Workbench)           |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|               Phase 17 EDR Investigation Workbench (/edr)               |
|      (Hierarchical Process Tree, Forensic Activity Tabs, Pivots)        |
+-------------------------------------------------------------------------+
```

### 1.1 Strict Boundary Invariants
1. **Canonical Pipeline Invariant**: EDR simulations do NOT bypass ingestion. All simulated endpoint telemetry flows through `processTelemetryBatch()` (`Validation -> Parsing -> Normalization -> Enrichment -> Persistence`).
2. **Reuse Existing Canonical Entities**: Extends existing `public.processes`, `public.files`, `public.network_connections`, and `public.events` rather than creating duplicate tables.
3. **Safe Defensive/Educational Simulation**: Prohibits real endpoint command execution, live malware payload generation, exploit code, offensive tools, and credential dumping.
4. **Tenant Isolation**: All endpoint data, process records, and activity streams are strictly partitioned by `organization_id` with PostgreSQL Row Level Security (RLS) and server-side RBAC guards.
5. **No Premature Architecture**: No external telemetry brokers (Kafka, ClickHouse, Elasticsearch). All storage and indexing resides in PostgreSQL/Supabase.

---

## 2. EDR Telemetry Domain Models

Phase 17 introduces 5 focused telemetry models while reusing existing process, file, and network tables.

### 2.1 Extended Entity Schema Summary

| Table | Telemetry Domain | Key Fields | Indexes |
| :--- | :--- | :--- | :--- |
| `public.processes` | Process Execution | `pid`, `ppid`, `process_name`, `command_line`, `image_path`, `integrity_level`, `sha256` | `(organization_id, asset_id, started_at)` |
| `public.registry_events` | Registry Keys & Values | `hive`, `key_path`, `value_name`, `value_data`, `action`, `process_id` | `(organization_id, asset_id, occurred_at)` |
| `public.files` | File System Activity | `file_path`, `file_name`, `file_size`, `sha256`, `action`, `file_type` | `(organization_id, asset_id, created_at)` |
| `public.network_connections` | Sockets & NetFlow | `source_ip`, `source_port`, `dest_ip`, `dest_port`, `protocol`, `process_id` | `(organization_id, asset_id, started_at)` |
| `public.endpoint_services` | Service Management | `service_name`, `display_name`, `binary_path`, `start_type`, `status`, `action` | `(organization_id, asset_id, occurred_at)` |
| `public.scheduled_task_events` | Task Scheduler / Persistence | `task_name`, `task_path`, `action`, `action_type`, `command`, `trigger_type` | `(organization_id, asset_id, occurred_at)` |
| `public.startup_items` | Autoruns & Run Keys | `item_name`, `item_type`, `location`, `command_line`, `is_enabled`, `action` | `(organization_id, asset_id, occurred_at)` |
| `public.usb_events` | Removable Media | `vendor_id`, `product_id`, `serial_number`, `device_name`, `action`, `mount_point` | `(organization_id, asset_id, occurred_at)` |

---

## 3. Hierarchical Process Tree Engine

The EDR investigation engine reconstructs parent-child execution hierarchies from flat process telemetry via `buildProcessTree()` in `apps/web/lib/edr/process-tree.ts`.

### 3.1 Tree Construction Algorithm
1. **PID / PPID Indexing**: Creates a lookup map of all processes on the target asset keyed by `pid`.
2. **Cycle & Orphan Protection**: Identifies root nodes (`ppid === null` or parent not found in dataset) while tracking visited nodes to break circular references.
3. **Suspicion Heuristics**: Evaluates each process against defensive heuristic rules:
   - *Temp/Appdata Execution*: Process executing from `\AppData\`, `\Temp\`, or `/tmp/`.
   - *Command Obfuscation*: Encoded PowerShell (`-enc`, `-encodedcommand`), Base64 payloads, or double extensions (`.pdf.exe`).
   - *Anomalous Parent Relationship*: System binaries (`svchost.exe`, `lsass.exe`) spawned by office applications (`winword.exe`, `excel.exe`) or browsers.
   - *High-Risk Execution*: Known LOLBAS tools (`certutil.exe -urlcache`, `bitsadmin.exe`, `mshta.exe`, `vssadmin.exe delete shadows`).
4. **Tree Node Aggregation**: Outputs structured `EdrProcessTreeNode` instances with child arrays, depth levels, and tagged suspicion metadata.

---

## 4. Educational EDR Simulation Scenarios

The simulation engine provides 9 safe, educational scenarios executing against simulated endpoints:

1. **`process_masquerading`**: Simulates `svchost.exe` executing from `%TEMP%` spawning PowerShell to demonstrate path verification.
2. **`registry_run_persistence`**: Simulates adding a Run key `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` for persistence.
3. **`suspicious_file_drop`**: Simulates dropping a double-extension invoice executable (`invoice_q3.pdf.exe`) into `AppData`.
4. **`c2_network_beaconing`**: Simulates periodic socket connections from PowerShell to an external IP on port 443.
5. **`malicious_service_install`**: Simulates creation of an unauthorized service (`WindowsUpdateHelper`) pointing to `%TEMP%`.
6. **`scheduled_task_creation`**: Simulates creation of a persistence task (`SystemTelemetrySync`) running daily.
7. **`startup_folder_hijack`**: Simulates writing a VBScript file into the Windows Startup autoruns folder.
8. **`unauthorized_usb_insertion`**: Simulates insertion of a non-allowlisted USB mass storage device (`SanDisk Ultra 64GB`).
9. **`multi_stage_endpoint_attack`**: Multi-phase educational chain combining USB insertion -> file drop -> process masquerading -> registry run persistence -> C2 beaconing.

---

## 5. EDR Investigation Workbench Architecture

The EDR workspace (`/edr`) provides a unified, interactive Base44 forensic experience:

- **Endpoint Selector & Fleet Health**: Select target host and view OS, sensor version, IP/MAC, and isolation status.
- **Forensic KPI Cards**: Quick metrics for active processes, open sockets, registry keys, and persistence items.
- **Hierarchical Process Tree (`ProcessTreeView.tsx`)**: Visual collapsible execution tree with PID badges, integrity levels, SHA256 copy helpers, and detection indicators.
- **Forensic Activity Tabs (`EndpointActivityTabs.tsx`)**:
  - *Process Activity*: Flat searchable process table with parent attribution.
  - *File Activity*: File creation/modification events with hashes and paths.
  - *Network Sockets*: Active sockets, source/dest IPs, ports, and protocols.
  - *Registry Changes*: Key creation, value modifications, and hive tracking.
  - *Services & Tasks*: System services and Scheduled Tasks inspection.
  - *Startup & USB*: Autorun items and removable device insertion logs.
  - *Chronological Timeline*: Unified multi-domain event stream.
  - *Related Alerts*: Correlated alerts with 1-click pivot to `/alerts`.
- **1-Click Forensic Pivots**: Quick transition buttons from any endpoint entity into SIEM Logs (`/logs?assetId=...`) or Alerts (`/alerts?query=...`).

---

## 6. Security & Multi-Tenancy

- **Row Level Security (RLS)**: Enforced across all EDR tables (`registry_events`, `endpoint_services`, `scheduled_task_events`, `startup_items`, `usb_events`) ensuring tenant isolation by `organization_id`.
- **Server Actions RBAC**: Requires `telemetry:read` and `agents:read` permissions before querying endpoint data or executing simulation bursts.
- **Zero Cross-Tenant Leakage**: Queries strictly bind `organization_id = auth.current_org_id()`.

---

## 7. Performance & Indexing Strategy

Composite B-tree indexes are added for high-throughput forensic queries:
- `(organization_id, asset_id, occurred_at DESC)` on all telemetry event tables.
- `(organization_id, asset_id, pid)` on `public.processes`.
- `(organization_id, asset_id, task_name)` on `public.scheduled_task_events`.
- `(organization_id, asset_id, service_name)` on `public.endpoint_services`.

---

## 8. Future Integration Roadmap

- **Phase 18 (XDR Correlation)**: Correlating endpoint process trees with network perimeter firewall logs, cloud audit trails, and identity sign-in telemetry.
- **Phase 19 (Incident & Case Management)**: Direct escalation of suspicious process trees and endpoint artifacts into incident dossiers and evidence vaults.
- **Phase 20 (SOAR & Remediation)**: Automated simulation actions (agent network isolation, process termination simulation, file quarantine).
