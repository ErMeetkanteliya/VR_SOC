# Core SOC Data Model Architecture — Phase 10

> **Status:** APPROVED & IMPLEMENTED  
> **Document Version:** 1.0.0  
> **Target System:** PostgreSQL 15+ / Supabase  
> **Reference:** `VR_SOC.md` Phase 10, `docs/architecture/data-architecture.md`

---

## 1. Executive Overview

Phase 10 establishes the canonical, normalized, tenant-isolated relational data foundation for VRSOC. All downstream modules—including Agent Management (Phase 11), Telemetry & Log Ingestion (Phase 12), SIEM (Phase 13), EDR/XDR (Phase 14), Detection Rules & MITRE ATT&CK (Phase 15), Alerts & Cases (Phase 16), Threat Hunting (Phase 17), SOAR Playbooks (Phase 18), Analytics & Reports (Phase 19), and AI Security Assistant (Phase 20)—rely strictly upon this relational baseline.

```text
                               ┌────────────────────────┐
                               │     organizations      │
                               └───────────┬────────────┘
                                           │ 1:N
            ┌──────────────────────────────┼──────────────────────────────┐
            │                              │                              │
            ▼                              ▼                              ▼
    ┌──────────────┐               ┌──────────────┐               ┌──────────────┐
    │ asset_groups │               │soc_identities│               │     logs     │
    └───────┬──────┘               └───────┬──────┘               └──────────────┘
            │ 1:N                          │                              ▲
            ▼                              │                              │ 1:N
    ┌──────────────┐                       │                              │
    │    assets    │◄──────────────────────┼──────────────────────────────┤
    └───────┬──────┘                       │                              │
            │ 1:1                          │                              │
            ▼                              ▼                              │
    ┌──────────────┐               ┌──────────────┐                       │
    │    agents    │◄──────────────┤    events    ├───────────────────────┘
    └───────┬──────┘               └───┬───┬───┬──┘
            │                          │   │   │
            ├──────────────────────────┘   │   └──────────────────────────┐
            │                              │                              │
            ▼                              ▼                              ▼
    ┌──────────────┐               ┌──────────────┐               ┌──────────────┐
    │  processes   │               │    files     │               │  net_conns   │
    └──────────────┘               └──────────────┘               └──────────────┘
```

---

## 2. Core Entities & Schema Definitions

### 2.1 Asset Groups (`public.asset_groups`)
Logical organizational clusters for grouping endpoints, servers, network appliances, and cloud workloads.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `name TEXT NOT NULL`
- `description TEXT`
- `criticality TEXT NOT NULL CHECK (criticality IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium'`
- `tags TEXT[] DEFAULT '{}'`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- **Constraint**: `UNIQUE (id, organization_id)`

### 2.2 Assets (`public.assets`)
Definitive inventory of enterprise infrastructure and endpoints observed or managed within the simulated SOC environment.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `asset_group_id UUID REFERENCES public.asset_groups(id) ON DELETE SET NULL`
- `hostname TEXT NOT NULL`
- `display_name TEXT`
- `asset_type TEXT NOT NULL CHECK (asset_type IN ('Workstation', 'Server', 'Domain Controller', 'Cloud Instance', 'Network Device', 'Container', 'Endpoint', 'Other')) DEFAULT 'Endpoint'`
- `os_type TEXT NOT NULL CHECK (os_type IN ('Windows', 'Linux', 'macOS', 'Android', 'iOS', 'NetworkOS', 'Other')) DEFAULT 'Windows'`
- `os_version TEXT`
- `ip_address TEXT`
- `mac_address TEXT`
- `criticality TEXT NOT NULL CHECK (criticality IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium'`
- `status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive', 'Decommissioned', 'Compromised', 'Isolated')) DEFAULT 'Active'`
- `is_isolated BOOLEAN NOT NULL DEFAULT false`
- `tags TEXT[] DEFAULT '{}'`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- **Structural Foreign Key**: `FOREIGN KEY (asset_group_id, organization_id) REFERENCES public.asset_groups(id, organization_id) ON DELETE SET NULL`
- **Constraint**: `UNIQUE (id, organization_id)`

### 2.3 Agents (`public.agents`)
Defensive telemetry agents deployed to monitored endpoints.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE`
- `agent_version TEXT NOT NULL DEFAULT '1.0.0'`
- `status TEXT NOT NULL CHECK (status IN ('Online', 'Offline', 'Updating', 'Error', 'Pending')) DEFAULT 'Pending'`
- `cpu_usage_pct NUMERIC(5, 2) DEFAULT 0.0 CHECK (cpu_usage_pct >= 0 AND cpu_usage_pct <= 100)`
- `ram_usage_pct NUMERIC(5, 2) DEFAULT 0.0 CHECK (ram_usage_pct >= 0 AND ram_usage_pct <= 100)`
- `disk_usage_pct NUMERIC(5, 2) DEFAULT 0.0 CHECK (disk_usage_pct >= 0 AND disk_usage_pct <= 100)`
- `last_seen_at TIMESTAMPTZ`
- `heartbeat_interval_seconds INT NOT NULL DEFAULT 30 CHECK (heartbeat_interval_seconds >= 5)`
- `capabilities TEXT[] DEFAULT '{telemetry,edr}'`
- `config JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- **Structural Foreign Key**: `FOREIGN KEY (asset_id, organization_id) REFERENCES public.assets(id, organization_id) ON DELETE CASCADE`
- **Constraint**: `UNIQUE (asset_id)` (1:1 relationship between asset and active agent), `UNIQUE (id, organization_id)`

### 2.4 SOC Identities (`public.soc_identities`)
Monitored enterprise user and service accounts within the simulated domain (strictly separated from Supabase authentication users).
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL`
- `username TEXT NOT NULL`
- `display_name TEXT`
- `email TEXT`
- `domain TEXT`
- `account_type TEXT NOT NULL CHECK (account_type IN ('User', 'Service', 'System', 'Admin', 'Guest')) DEFAULT 'User'`
- `is_privileged BOOLEAN NOT NULL DEFAULT false`
- `department TEXT`
- `status TEXT NOT NULL CHECK (status IN ('Active', 'Disabled', 'Locked', 'Suspended')) DEFAULT 'Active'`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- **Constraint**: `UNIQUE (organization_id, username, domain)`, `UNIQUE (id, organization_id)`

### 2.5 Normalized Events (`public.events`)
The central telemetry event stream consumed by SIEM correlation, Sigma rule evaluation, and alert generation.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `occurred_at TIMESTAMPTZ NOT NULL` (Actual occurrence timestamp)
- `source TEXT NOT NULL` (e.g. `Syslog`, `EDR`, `Suricata`, `ActiveDirectory`, `Zeek`, `Auditd`)
- `source_type TEXT NOT NULL` (e.g. `Endpoint`, `Network`, `Identity`, `Cloud`, `Firewall`, `DNS`)
- `category TEXT NOT NULL` (e.g. `ProcessCreation`, `NetworkFlow`, `Authentication`, `FileModification`, `DnsQuery`)
- `event_type TEXT NOT NULL` (e.g. `edr.process.spawn`, `win.event.4624`, `auth.failed`)
- `severity TEXT CHECK (severity IN ('Info', 'Low', 'Medium', 'High', 'Critical')) DEFAULT 'Info'`
- `asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL`
- `agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL`
- `identity_id UUID REFERENCES public.soc_identities(id) ON DELETE SET NULL`
- `process_id UUID` (Cross-referenced to `processes.id`)
- `file_id UUID` (Cross-referenced to `files.id`)
- `network_connection_id UUID` (Cross-referenced to `network_connections.id`)
- `raw_payload TEXT`
- `normalized_fields JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())` (Database ingestion timestamp)
- **Structural Foreign Keys**:
  - `FOREIGN KEY (asset_id, organization_id) REFERENCES public.assets(id, organization_id) ON DELETE SET NULL`
  - `FOREIGN KEY (agent_id, organization_id) REFERENCES public.agents(id, organization_id) ON DELETE SET NULL`
  - `FOREIGN KEY (identity_id, organization_id) REFERENCES public.soc_identities(id, organization_id) ON DELETE SET NULL`
- **Constraint**: `UNIQUE (id, organization_id)`

### 2.6 Raw & Parsed Logs (`public.logs`)
High-throughput log ingestion buffer and audit log retention store.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `event_timestamp TIMESTAMPTZ NOT NULL`
- `source TEXT NOT NULL`
- `source_type TEXT NOT NULL`
- `log_level TEXT NOT NULL CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')) DEFAULT 'INFO'`
- `raw_message TEXT NOT NULL`
- `structured_data JSONB NOT NULL DEFAULT '{}'::jsonb`
- `event_id UUID REFERENCES public.events(id) ON DELETE SET NULL`
- `parse_status TEXT NOT NULL CHECK (parse_status IN ('Parsed', 'Unparsed', 'Failed')) DEFAULT 'Parsed'`
- `parser_name TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- **Structural Foreign Key**: `FOREIGN KEY (event_id, organization_id) REFERENCES public.events(id, organization_id) ON DELETE SET NULL`
- **Constraint**: `UNIQUE (id, organization_id)`

### 2.7 Processes (`public.processes`)
Simulated EDR process trees for tracking command line executions, parent-child process relationships, and code integrity.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE`
- `agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL`
- `identity_id UUID REFERENCES public.soc_identities(id) ON DELETE SET NULL`
- `pid INT NOT NULL`
- `parent_pid INT`
- `parent_process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL`
- `executable_path TEXT NOT NULL`
- `executable_name TEXT NOT NULL`
- `command_line TEXT`
- `working_directory TEXT`
- `sha256 TEXT`
- `md5 TEXT`
- `started_at TIMESTAMPTZ NOT NULL`
- `ended_at TIMESTAMPTZ`
- `is_elevated BOOLEAN NOT NULL DEFAULT false`
- `integrity_level TEXT CHECK (integrity_level IN ('Untrusted', 'Low', 'Medium', 'High', 'System'))`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- **Structural Foreign Keys**:
  - `FOREIGN KEY (asset_id, organization_id) REFERENCES public.assets(id, organization_id) ON DELETE CASCADE`
  - `FOREIGN KEY (agent_id, organization_id) REFERENCES public.agents(id, organization_id) ON DELETE SET NULL`
  - `FOREIGN KEY (identity_id, organization_id) REFERENCES public.soc_identities(id, organization_id) ON DELETE SET NULL`
  - `FOREIGN KEY (parent_process_id, organization_id) REFERENCES public.processes(id, organization_id) ON DELETE SET NULL`
- **Constraint**: `UNIQUE (id, organization_id)`

### 2.8 Files (`public.files`)
Simulated file system objects tracked by EDR, File Integrity Monitoring (FIM), and forensic investigation workflows.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE`
- `file_path TEXT NOT NULL`
- `file_name TEXT NOT NULL`
- `file_extension TEXT`
- `file_size_bytes BIGINT`
- `sha256 TEXT`
- `sha1 TEXT`
- `md5 TEXT`
- `is_directory BOOLEAN NOT NULL DEFAULT false`
- `is_signed BOOLEAN`
- `signature_signer TEXT`
- `signature_status TEXT CHECK (signature_status IN ('Valid', 'Invalid', 'Unsigned', 'Expired', 'Revoked'))`
- `permissions TEXT`
- `file_created_at TIMESTAMPTZ`
- `file_modified_at TIMESTAMPTZ`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- **Structural Foreign Key**: `FOREIGN KEY (asset_id, organization_id) REFERENCES public.assets(id, organization_id) ON DELETE CASCADE`
- **Constraint**: `UNIQUE (id, organization_id)`

### 2.9 Network Connections (`public.network_connections`)
Simulated NetFlow, firewall session, and socket connection records.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE`
- `asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL`
- `process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL`
- `src_ip TEXT NOT NULL`
- `src_port INT NOT NULL CHECK (src_port >= 0 AND src_port <= 65535)`
- `dst_ip TEXT NOT NULL`
- `dst_port INT NOT NULL CHECK (dst_port >= 0 AND dst_port <= 65535)`
- `protocol TEXT NOT NULL CHECK (protocol IN ('TCP', 'UDP', 'ICMP', 'DNS', 'HTTP', 'HTTPS', 'TLS', 'SSH', 'RDP', 'OTHER')) DEFAULT 'TCP'`
- `direction TEXT NOT NULL CHECK (direction IN ('Inbound', 'Outbound', 'Internal', 'Unknown')) DEFAULT 'Outbound'`
- `status TEXT NOT NULL CHECK (status IN ('Established', 'Closed', 'Listening', 'Blocked', 'SYN_SENT', 'TimeWait')) DEFAULT 'Established'`
- `bytes_sent BIGINT DEFAULT 0 CHECK (bytes_sent >= 0)`
- `bytes_received BIGINT DEFAULT 0 CHECK (bytes_received >= 0)`
- `duration_ms INT DEFAULT 0 CHECK (duration_ms >= 0)`
- `started_at TIMESTAMPTZ NOT NULL`
- `ended_at TIMESTAMPTZ`
- `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
- **Structural Foreign Keys**:
  - `FOREIGN KEY (asset_id, organization_id) REFERENCES public.assets(id, organization_id) ON DELETE SET NULL`
  - `FOREIGN KEY (process_id, organization_id) REFERENCES public.processes(id, organization_id) ON DELETE SET NULL`
- **Constraint**: `UNIQUE (id, organization_id)`

---

## 3. Multi-Tenancy & Structural Cross-Tenant Prevention

### 3.1 Composite Foreign Key Invariant
In multi-tenant relational systems, a common security flaw is allowing a record in Tenant A to reference a foreign key belonging to Tenant B (`event(org_id = A, asset_id = B)`).

To make cross-tenant foreign referencing structurally impossible at the PostgreSQL engine level:
1. Every parent table enforces a composite unique constraint: `UNIQUE (id, organization_id)`.
2. Every child table referencing the parent uses a composite foreign key:
   ```sql
   FOREIGN KEY (asset_id, organization_id)
     REFERENCES public.assets(id, organization_id)
     ON DELETE CASCADE;
   ```
3. PostgreSQL immediately rejects any `INSERT` or `UPDATE` where the child's `organization_id` does not match the parent's `organization_id`.

### 3.2 Row Level Security (RLS)
RLS is explicitly enabled on all 9 tables:
```sql
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
```

Policies verify active membership in `public.memberships`:
```sql
CREATE POLICY "<table_name>_select_org_members"
  ON public.<table_name>
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = <table_name>.organization_id
        AND m.user_id = auth.uid()
        AND m.is_active = true
    )
  );
```

Write policies (`INSERT`, `UPDATE`, `DELETE`) require non-Viewer roles (`Super Admin`, `SOC Analyst`, `Incident Responder`, `Threat Hunter`, `Instructor`).

---

## 4. Performance & Indexing Strategy

B-Tree and GIN indexes are tailored to anticipated SOC search and correlation query patterns:

| Table | Index Target | Query Pattern |
|---|---|---|
| `asset_groups` | `(organization_id, name)` | Group lookups & listings |
| `assets` | `(organization_id, hostname)` | Fast asset lookups by FQDN |
| `assets` | `(organization_id, ip_address)` | IP to asset correlation |
| `assets` | `(organization_id, status)` | Filter active / isolated systems |
| `agents` | `(organization_id, status)` | Fleet health monitoring |
| `agents` | `(organization_id, last_seen_at DESC)` | Fleet liveness sorting |
| `soc_identities` | `(organization_id, username)` | Account lookups |
| `events` | `(organization_id, occurred_at DESC)` | Primary SIEM event timeline streaming |
| `events` | `(organization_id, event_type)` | Sigma rule event filtering |
| `events` | `(organization_id, source, source_type)` | Source stream filtering |
| `events` | `(organization_id, asset_id, occurred_at DESC)` | Endpoint timeline reconstruction |
| `events` | `(organization_id, identity_id, occurred_at DESC)` | Identity investigation timeline |
| `events` | `USING GIN (normalized_fields)` | Fast JSONB field querying |
| `logs` | `(organization_id, event_timestamp DESC)` | Log stream viewer |
| `processes` | `(organization_id, asset_id, started_at DESC)` | EDR process tree generation |
| `processes` | `(organization_id, parent_pid, started_at)` | Process lineage traversal |
| `processes` | `(organization_id, sha256)` | Hash lookups across endpoints |
| `files` | `(organization_id, asset_id, file_path)` | FIM / path lookups |
| `files` | `(organization_id, sha256)` | File hash searches |
| `network_connections` | `(organization_id, src_ip, dst_ip, started_at DESC)` | NetFlow session analysis |
| `network_connections` | `(organization_id, asset_id, started_at DESC)` | Asset connection history |

---

## 5. Timestamps & Lifecycle Strategy

1. **`occurred_at` / `started_at` / `event_timestamp`**: Immutable telemetry occurrence times assigned by sensor or synthetic scenario generation.
2. **`created_at`**: System record ingestion timestamp into PostgreSQL.
3. **`updated_at`**: Last mutation timestamp.
4. **Lifecycle & Retention**: Telemetry events, logs, processes, and network connections retain strict append-only history. Cascading deletes apply when an entire organization or asset is deleted, preserving relational consistency without orphaned records.
