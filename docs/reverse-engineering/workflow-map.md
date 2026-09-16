# VRSOC Phase 00 — Workflow Map

## 1. Primary User & Operational Workflows

This document models the core workflows observed across the VRSOC platform, following the formal `START -> ACTION -> UI RESPONSE -> DATA CHANGE -> NAVIGATION -> NEXT ACTION` state progression.

---

### Workflow 1: SOC Alert Triage to Case Creation (The Golden Analyst Path)

```text
[1. START] Analyst lands on SOC Dashboard (/)
     ↓
[2. ACTION] Analyst notices Critical Alert indicator ("Brute Force Attack on DC-01") and clicks "View Alerts"
     ↓
[3. UI RESPONSE] Application transitions to Alerts Management (/alerts)
     ↓
[4. ACTION] Analyst clicks "Investigate" on Alert #1 (INC-2026-0342)
     ↓
[5. UI RESPONSE] Alert Detail Drawer opens displaying:
     - Threat Score: 95/100
     - MITRE Tactic: Credential Access (T1110)
     - Source IP: 185.220.101.42
     - Target Asset: DC-01.corp.internal
     - Raw Telemetry Snippet: 50 failed kerberos login events in 60 seconds
     ↓
[6. ACTION] Analyst clicks "Trigger Threat Enrichment"
     ↓
[7. UI RESPONSE] System queries VirusTotal & AbuseIPDB, updating IP risk badge to "100% Malicious — 42/88 detections"
     ↓
[8. ACTION] Analyst clicks "Escalate to Incident / Case"
     ↓
[9. DATA CHANGE] New Case entity created with status "Detection", priority "P1", assigned to current analyst
     ↓
[10. NAVIGATION] Redirected to Case Management (/cases) with new case highlighted
     ↓
[11. ACTION] Analyst enters investigation notes: "Confirmed external brute force from Tor exit node. Endpoint DC-01 isolated at firewall."
     ↓
[12. NEXT ACTION] Case status updated to "Containment"
```

---

### Workflow 2: Simulation Execution to Detection & Remediation

```text
[1. START] Instructor or Student opens Simulation Lab (/soar/simulation)
     ↓
[2. ACTION] User selects scenario "Brute Force Attack" and clicks "Launch Scenario"
     ↓
[3. UI RESPONSE] Step progression modal displays animated stages:
     - 1. "Generating attack telemetry..."
     - 2. "Ingesting events into SIEM..."
     - 3. "Detection rule matched (BRUTE-FORCE-001)..."
     - 4. "Triggering automated SOAR playbook..."
     ↓
[4. DATA CHANGE] System produces simulated event logs, triggers detection rule, and generates Alert INC-2026-0342
     ↓
[5. NAVIGATION] Auto-redirects to Live Execution View (/soar/live)
     ↓
[6. UI RESPONSE] Real-time streaming log console renders playbook execution steps:
     - [10:32:01] Ingestion: Event received from SIEM connector
     - [10:32:02] Enrichment: VirusTotal reports malicious IP
     - [10:32:03] AI Engine: Score calculated = 95 (Critical)
     - [10:32:04] Approval Request created: "Block IP 185.220.101.42 on Core Firewall"
     ↓
[7. NAVIGATION] User navigates to SOAR Approvals (/soar/approvals)
     ↓
[8. ACTION] Analyst reviews request and clicks "Approve Action"
     ↓
[9. UI RESPONSE] Success toast displayed: "Action executed: Firewall IP blocked"
     ↓
[10. NEXT ACTION] Playbook marks incident as "Contained" and logs execution in History (/soar/history)
```

---

### Workflow 3: Threat Hunting via Log Explorer & MITRE Matrix

```text
[1. START] Threat Hunter opens MITRE ATT&CK Center (/mitre)
     ↓
[2. ACTION] Hunter inspects "Persistence" column and clicks technique "T1053 - Scheduled Task/Job"
     ↓
[3. UI RESPONSE] Drawer displays technique details, common indicators, and Sigma detection logic
     ↓
[4. ACTION] Hunter clicks "Search Telemetry for this Technique"
     ↓
[5. NAVIGATION] Transitions to Log Explorer (/logs?query=event_id:4698 OR process:schtasks.exe)
     ↓
[6. UI RESPONSE] Table displays matching Windows security event logs
     ↓
[7. ACTION] Hunter filters by timeframe (Last 24 Hours) and identifies suspicious task `Updater_System32.bat`
     ↓
[8. NEXT ACTION] Hunter selects "Create IOC Entry" or "Attach Log as Evidence to Case"
```

---

### Workflow 4: Educational Knowledge Center Exploration

```text
[1. START] Student navigates to Knowledge Center (/knowledge)
     ↓
[2. ACTION] Student filters by category "SOAR" and searches "Playbooks"
     ↓
[3. UI RESPONSE] Article cards filter in real-time; displays "Security Orchestration, Automation, and Response (SOAR)" (Intermediate badge)
     ↓
[4. ACTION] Student clicks article card
     ↓
[5. UI RESPONSE] Full-screen article reader renders:
     - Overview of SOAR concepts
     - Interactive Playbook Architecture Diagram
     - Common Playbook Patterns (Phishing, Malware, Brute Force)
     - Link to Launch Interactive Lab: "Try the Brute Force Playbook in Simulation"
     ↓
[6. NEXT ACTION] Student clicks "Try Playbook" -> transitions directly to /soar/automation
```
