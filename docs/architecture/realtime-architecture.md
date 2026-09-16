# VRSOC Architecture Constitution — Realtime Architecture

## 1. Document Overview

This document specifies the real-time event streaming and synchronization architecture for the VRSOC platform. Powered by Supabase Realtime (Elixir Phoenix PubSub and PostgreSQL Change Data Capture / CDC), the realtime subsystem delivers low-latency live telemetry streams, active alert notifications, agent fleet heartbeats, and terminal execution logs while strictly enforcing multi-tenant isolation.

---

## 2. Realtime Event Inventory & Evaluation

| Event Domain | Realtime Channel | Trigger Source | Payload Characteristics | Client Consumer |
|---|---|---|---|---|
| **Alert Notifications** | `org:<org_id>:alerts` | `public.alerts` INSERT / UPDATE | Lightweight: `{ id, alert_code, title, severity, risk_score, asset_hostname }` | AppShell Topbar Badge, Alert Feed (`/alerts`), SOC Dashboard (`/`) |
| **Agent Fleet Health** | `org:<org_id>:agents` | `public.agents` Heartbeat / Status Mutation | Periodic status & resource gauges: `{ id, hostname, status, cpu, ram, last_seen }` | Agent Management (`/agents`), Dashboard KPI Card |
| **Simulation Live Stream** | `org:<org_id>:simulation:<run_id>` | Simulation Engine Execution Stream | High-frequency log steps: `{ timestamp, step_name, status, log_message }` | Live Execution Terminal (`/soar/live`, `/soar/automation`) |
| **Incident / Case Updates** | `org:<org_id>:incidents` | `public.incidents` / `public.case_notes` | Collaborative update: `{ incident_id, stage, assignee, new_note }` | Incident Kanban (`/incidents`), Case Dossier (`/cases`) |
| **In-App Notifications** | `user:<user_id>:notifications` | `public.notifications` INSERT | User-specific alert: `{ id, title, message, action_url, read }` | Topbar Notification Dropdown |

---

## 3. Channel Architecture & Security Model

```text
                               ┌────────────────────────────────────────┐
                               │           CLIENT BROWSER               │
                               │  Establishes authenticated WebSocket   │
                               │  connection passing Supabase JWT       │
                               └──────────────────┬─────────────────────┘
                                                  │ WSS + JWT Bearer
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │       SUPABASE REALTIME SERVER         │
                               │  Validates JWT & Evaluates RLS Policy  │
                               └──────────────────┬─────────────────────┘
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 │                                                                 │
                 ▼                                                                 ▼
┌────────────────────────────────────────┐                       ┌───────────────────────────────────┐
│     TENANT CHANNEL (ORGANIZATION)      │                       │     PRIVATE USER CHANNEL          │
│     Channel: org:<org_id>:alerts       │                       │     Channel: user:<user_id>:notif │
│  - RLS verifies membership in org_id   │                       │  - RLS verifies auth.uid() == id  │
│  - Rejects cross-tenant connections    │                       │  - Delivers direct user alerts    │
└────────────────────────────────────────┘                       └───────────────────────────────────┘
```

### 3.1 Channel Naming Conventions
1. **Tenant Broadcast Channels**: `org:<org_id>:<topic>` (e.g. `org:550e8400-e29b-41d4-a716-446655440000:alerts`).
2. **Simulation Execution Channels**: `org:<org_id>:simulation:<run_id>`.
3. **Private User Channels**: `user:<user_id>:notifications`.

### 3.2 Security Invariant: Strict Tenant Channel Isolation
> **MANDATORY RULE**: Public unauthenticated realtime channels are strictly prohibited across the entire codebase.
> 
> All Realtime channels:
> 1. Must validate the connecting user's authenticated Supabase session.
> 2. Must verify that the user is an active member of `org_id` in `public.memberships` before granting channel subscription.
> 3. Must never broadcast sensitive payloads (such as user password hashes or secret tokens) over WebSocket streams.

---

## 4. Payload Size & Optimization Rules

1. **Lightweight Delta Broadcasts**: Realtime event payloads must not transmit massive nested JSON blobs. Instead, broadcasts transmit lightweight event descriptors (e.g., `{ event: "ALERT_CREATED", alert_id: "...", severity: "Critical" }`).
2. **Client-Side Cache Invalidation**: Upon receiving a realtime delta, the frontend updates local counters or selectively refetches detailed entity records via React Server Component revalidation (`revalidatePath` / Server Actions).
3. **Terminal Log Streaming**: Live simulation console streams (`/soar/live`) transmit individual log line chunks (`{ seq: 4, msg: "Sigma Rule Matched: PowerShell Encoded Command", status: "SUCCESS" }`) at controlled 500ms–1000ms intervals to prevent client rendering lockup.

---

## 5. Client Subscription Lifecycle & State Synchronization

```text
[Component Mounts (e.g. /alerts)]
       │
       ▼
[Initialize Supabase Realtime Channel]
       │
       ▼
[Subscribe with Channel Filter: org_id]
       │
       ├─► [Online]: Listen for INSERT / UPDATE -> Merge into UI state
       │
       ├─► [Connection Lost]: Enter Exponential Backoff Reconnection (1s, 2s, 4s, 8s max)
       │
       └─► [Reconnected]: Trigger full state refresh to reconcile missed events during disconnection
```

### Reconnection & Missed-Event Reconcile
When a network interruption occurs, the client enters a reconnect loop. Upon reconnection, the client automatically executes an active data query to ensure that any alerts or status changes created during the offline window are accurately rendered.
