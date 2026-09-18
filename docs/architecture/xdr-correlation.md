# Architecture: XDR Correlation & Multi-Source Investigation

> **Subsystem:** Phase 18 — XDR Correlation & Multi-Source Telemetry  
> **Target Technology:** Next.js (App Router) + TypeScript + PostgreSQL (Supabase) + Vitest + Playwright  
> **Status:** Authoritative Architecture Reference  

---

## 1. Overview & Pipeline Placement

The **XDR Correlation & Multi-Source Investigation Layer** serves as the cross-domain correlation engine for VRSOC. It correlates canonical telemetry across 8 distinct enterprise attack surfaces without building parallel ingestion pipelines or disconnected fake datasets.

```text
+-----------------------------------------------------------------------------------------+
|                               Multi-Source Telemetry Surfaces                           |
|   (Endpoint, Identity, Email Gateway, DNS Server, Cloud Audit, NetFlow, Firewall, Auth) |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                       Phase 13 Ingestion & Normalization Pipeline                       |
|                 (Validation -> Parsing -> Normalization -> Persistence)                 |
|   -> public.events, public.logs, public.processes, public.files,                        |
|      public.network_connections, public.registry_events, public.dns_events,             |
|      public.email_events, public.cloud_events, public.firewall_events                    |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                Phase 14 SIEM Query Layer                                |
|                   (Multi-Field Search, Faceted Filtering, SIEM Timelines)               |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                             Phase 15 Detection Rule Engine                              |
|                          (Sigma Rules & Composite Thresholds)                           |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                             Phase 16 Alerts & Triage Layer                              |
|                         (Deduplication & Triage Queue Workbench)                        |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                         Phase 17 EDR Endpoint Investigation                             |
|                        (Process Tree & Endpoint Deep Dives)                             |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                         Phase 18 XDR Correlation Layer (/xdr)                           |
|       (Deterministic Cross-Source Convergence, Relationship Matrix, Unified Timeline)   |
+-----------------------------------------------------------------------------------------+
```

### 1.1 Strict Boundary Invariants
1. **Canonical Pipeline Invariant**: All XDR telemetry (DNS, Email, Cloud, Firewall, Auth) routes strictly through `processTelemetryBatch()` (`Validation -> Parsing -> Normalization -> Persistence`).
2. **Deterministic & Explainable**: Strictly rule-based, deterministic correlation using verified shared entities (IPs, domains, identities, assets, hashes) and bounded temporal ordering. No probabilistic ML, AI guessing, or graph neural networks.
3. **Bounded Correlation Windows**: Correlation searches enforce strict time limits (default 60 minutes, maximum 24 hours/7 days) to prevent unbounded cross-tenant table scans or database starvation.
4. **Tenant Isolation**: All queries, correlation clusters, and multi-source event tables strictly enforce `organization_id` partitioning with PostgreSQL Row Level Security (RLS) and server-side RBAC guards.
5. **No Premature Big Data Daemons**: PostgreSQL/Supabase remains the single source of truth; no Kafka, OpenSearch, ClickHouse, or Neo4j.

---

## 2. Supported Data Sources & Entity Schemas

Phase 18 introduces 4 focused schema tables while seamlessly correlating existing process, network, and event tables:

| Source Domain | Table | Key Fields | Primary Index |
| :--- | :--- | :--- | :--- |
| **DNS** | `public.dns_events` | `query_domain`, `query_type`, `resolved_ips`, `response_code`, `is_malicious` | `(organization_id, query_domain)`, `(organization_id, occurred_at DESC)` |
| **Email** | `public.email_events` | `sender`, `recipient`, `subject`, `attachment_name`, `attachment_sha256`, `action`, `is_phishing` | `(organization_id, identity_id, occurred_at DESC)`, `(organization_id, attachment_sha256)` |
| **Cloud** | `public.cloud_events` | `cloud_provider`, `service_name`, `event_name`, `caller_ip`, `region`, `resource_arn`, `status` | `(organization_id, identity_id, occurred_at DESC)`, `(organization_id, caller_ip)` |
| **Firewall** | `public.firewall_events` | `src_ip`, `dst_ip`, `src_port`, `dst_port`, `protocol`, `action`, `rule_name`, `threat_name` | `(organization_id, occurred_at DESC)`, `(organization_id, src_ip, dst_ip)` |
| **Endpoint** | `public.processes`, `public.files`, `public.registry_events` | `pid`, `ppid`, `name`, `executable_path`, `command_line`, `sha256`, `integrity_level` | `(organization_id, asset_id, started_at DESC)` |
| **Network** | `public.network_connections` | `src_ip`, `dst_ip`, `src_port`, `dst_port`, `protocol`, `direction`, `status` | `(organization_id, started_at DESC)`, `(organization_id, src_ip, dst_ip)` |
| **Identity & Auth** | `public.soc_identities`, `public.events` | `username`, `email`, `domain`, `account_type`, `is_privileged`, `is_locked` | `(organization_id, username)` |
| **Correlation** | `public.xdr_correlations` | `correlation_code`, `title`, `relationship_type`, `confidence_score`, `primary_entity_type` | `(organization_id, created_at DESC)`, `(organization_id, relationship_type)` |

---

## 3. Deterministic XDR Correlation Model

Correlation is computed via `correlateMultiSourceTelemetry()` across 4 core relationship models:

### 3.1 Relationship Types

1. **`same_identity` (Identity Cross-Domain Convergence)**:
   - Links Inbound Phishing Emails received by user ➔ Authentication on workstation ➔ Process execution under user account ➔ Cloud API calls using identity credentials.
2. **`same_asset` (Host Convergence & Killchain)**:
   - Links Masquerading Process execution ➔ Local DNS query for C2 domain ➔ Outbound Network Socket ➔ Perimeter Firewall rule evaluation.
3. **`same_ip` (Target IP Linkage)**:
   - Links DNS query resolving to external IP ➔ Socket connection to that IP ➔ Firewall log for that IP ➔ Cloud API calls originating from that IP.
4. **`same_domain` (Domain Attribution)**:
   - Links Email sender domains ➔ DNS query domains ➔ C2 beaconing domains across multi-host environments.
5. **`temporal_killchain` (Ordered Sequential Activity)**:
   - Orders cross-source events occurring in rapid sequential proximity (e.g. Email delivered at $t_0$ ➔ Logon at $t_1$ ➔ Execution at $t_2$ ➔ Egress at $t_3$).
6. **`related_alert` (Multi-Alert Convergence)**:
   - Clusters multiple independent detection alerts affecting the same asset or identity.

### 3.2 Confidence Score Algorithm

Confidence score is evaluated deterministically between 70% and 98%:

$$\text{Confidence Score} = \min\left(98, 70 + 7 \times N_{\text{sources}} + 2 \times N_{\text{events}}\right)$$

Where:
- $N_{\text{sources}}$ is the number of distinct telemetry sources involved (Endpoint, Auth, Email, DNS, Cloud, Network, Firewall).
- $N_{\text{events}}$ is the number of verified evidence events in the chain.

---

## 4. Multi-Source Educational Simulation Scenarios

Phase 18 implements 4 realistic educational simulation scenarios:

1. **`phishing_to_endpoint_c2`**:
   - Inbound Phishing Email with `.pdf.exe` attachment -> User interactive logon -> Process masquerading in `%TEMP%` -> DNS C2 resolution -> Outbound HTTPS socket -> Perimeter Firewall allowed log.
2. **`cloud_credential_theft_and_exfil`**:
   - Brute force authentication failures -> Anomalous geo SSO success -> AWS IAM `CreateAccessKey` -> AWS S3 bulk data retrieval.
3. **`lateral_movement_and_domain_recon`**:
   - Kerberos TGS ticket request -> Remote `PsExec` service installation -> Internal DNS SRV query -> Internal SMB port 445 network sweep.
4. **`ransomware_precursor_chain`**:
   - Removable USB device insertion -> `vssadmin` shadow copy deletion -> Registry Run key persistence -> Perimeter Firewall C2 block.

---

## 5. XDR Investigation Workbench UI (`/xdr`)

- **KPI Cards**: Real-time metrics for correlated threats, active telemetry sources, high-confidence chains, and mean correlation duration.
- **Source Matrix Visualizer (`XdrSourceMatrix.tsx`)**: Interactive visual matrix highlighting active telemetry surfaces and sequential killchain progression.
- **Correlation Cluster List (`XdrCorrelationList.tsx`)**: Searchable list of correlation clusters with confidence scores, relationship types, and duration badges.
- **Deep Investigation Detail (`XdrInvestigationDetail.tsx`)**:
  - *Killchain & Identifiers*: Step-by-step verified evidence flow and shared IOCs (IPs, domains, usernames, hashes).
  - *Cross-Source Timeline*: Unified multi-source chronological event stream with source filters and raw JSON drill-down.
  - *Source Telemetry Tables*: Tabulated inspection of DNS, Email, Cloud, and Firewall events.
  - *Entity Context*: Target host and user identity dossiers.
  - *Related Alerts*: Correlated threat alerts with 1-click pivot to `/alerts`.
  - *1-Click Forensic Pivots*: Direct buttons into SIEM (`/logs`), EDR (`/edr`), and Alert Center (`/alerts`).

---

## 6. Security & Multi-Tenancy

- **PostgreSQL RLS Policies**: Enforced across all new tables (`dns_events`, `email_events`, `cloud_events`, `firewall_events`, `xdr_correlations`) preventing cross-tenant leakage.
- **Server Action RBAC Guards**: All read operations require `telemetry:read`; simulation executions require `telemetry:read`.
- **Zero Cross-Tenant Correlation**: Correlation queries strictly bind `organization_id = auth.current_org_id()`.

---

## 7. Next-Phase Dependencies (Phase 19+)

Phase 18 XDR correlation clusters and multi-source evidence packages form the foundational input for:
1. **Phase 19 (Threat Hunting & IOC Engine)**: Query builder across multi-source telemetry and IOC hunting campaigns.
2. **Phase 20 (Incident & Case Dossiers)**: Escalating correlated XDR chains directly into formal incident case files.
3. **Phase 21 (SOAR & Containment)**: Orchestrating cross-domain response actions (blocking firewall IPs, revoking IAM access keys, isolating endpoint agents).
