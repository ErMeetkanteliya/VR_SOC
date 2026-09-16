# VRSOC Phase 00 — Simulation Behavior & Telemetry Pipeline

## 1. Observed Base44 Simulation Behavior

- **Component**: `TDe` (`/soar/simulation`) and `cDe` (`/soar/automation`).
- **Observed Flow**:
  1. User selects a scenario (e.g. `Brute Force Attack`).
  2. Client-side timer steps through 4 progress stages:
     - "Generating incident..."
     - "Feeding to SOAR pipeline..."
     - "Triggering playbook..."
     - "Redirecting to Live View..."
  3. Redirects to `/soar/live` (`PDe`) where simulated log events stream into the terminal console at 1.0s - 1.5s intervals.
- **Classification**:
  - *OBSERVED*: Interactive client-side simulation simulation trigger and streaming terminal presentation.
  - *INFERRED*: In Base44, the simulation is largely an orchestrated frontend visualization driven by timer sequences and static JSON arrays.
  - *UNKNOWN*: Whether Base44 had any backend worker simulating network traffic.

---

## 2. Target Production Simulation Pipeline (Section 8 & 25)

In strict adherence to the **Golden Product Principle** in `VR_SOC.md`, the production VRSOC simulation engine will NOT use disconnected fake data generators for each screen.

### 2.1 The Canonical Simulation Pipeline

```text
Instructor Scenario Definition
      ↓
Simulation Engine (Edge Function / Background Job)
      ↓
Synthetic Telemetry Stream (Syslog, WinEventLog, Netflow, EDR)
      ↓
Event / Log Ingestion & Normalization
      ↓
Stream Correlation & Detection Rule Evaluation
      ↓
Alert Generation (Mapped to MITRE ATT&CK)
      ↓
Incident Declaration & Case Dossier
      ↓
SOAR Playbook Execution (Auto / Human Approval)
      ↓
Analytics, Reports, and Grounded AI Security Explanation
```

---

## 3. Supported Educational Simulation Scenarios

1. **Authentication Attacks**:
   - Multiple failed Kerberos/NTLM logins -> Account lockout -> Brute force detection rule -> Alert + Firewall block action.
2. **Endpoint Execution**:
   - Suspicious PowerShell command with `-EncodedCommand` and `-ExecutionPolicy Bypass` -> EDR process alert -> Host isolation action.
3. **Persistence Mechanism**:
   - Scheduled task creation targeting anomalous `.bat` script in `AppData` -> Persistence detection rule -> Registry audit alert.
4. **Hardware Additions**:
   - Unauthorized USB mass storage insertion -> Hardware addition event -> Host lockdown action.
5. **Network Anomalies**:
   - High-frequency DNS TXT record queries -> DNS tunneling indicator -> Perimeter DNS sinkhole action.
