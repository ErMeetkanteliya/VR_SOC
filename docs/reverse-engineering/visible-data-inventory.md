# VRSOC Phase 00 — Visible Data Inventory & Demo Catalog

This catalog documents the exact demonstration data objects discovered inside the Base44 bundle so they can be accurately seeded into the new Supabase database.

---

## 1. Demo Alerts Dataset (`ZNe`)

1. **Alert 1**:
   - `id`: `1`
   - `title`: "Brute Force Authentication Attack"
   - `severity`: `critical`
   - `risk`: `95`
   - `category`: "Credential Access"
   - `mitre_tactic`: "Credential Access"
   - `mitre_technique`: "T1110 - Brute Force"
   - `asset`: "DC-01.corp.internal"
   - `source_ip`: "185.220.101.42"
   - `user`: "admin_svc"
   - `status`: "open"
   - `description`: "Over 50 failed Kerberos authentication attempts within 60 seconds from an external IP."

2. **Alert 2**:
   - `id`: `2`
   - `title`: "Suspicious Encoded PowerShell Execution"
   - `severity`: `critical`
   - `risk`: `90`
   - `category`: "Execution"
   - `mitre_tactic`: "Execution"
   - `mitre_technique`: "T1059.001 - PowerShell"
   - `asset`: "WKSTN-084.corp.internal"
   - `source_ip`: "10.0.4.84"
   - `user`: "j.miller"
   - `status`: "open"
   - `description`: "PowerShell spawned with Base64 encoded payload and execution bypass parameters."

3. **Alert 3**:
   - `id`: `3`
   - `title`: "Unauthorized USB Mass Storage Device Inserted"
   - `severity`: `medium`
   - `risk`: `55`
   - `category`: "Initial Access"
   - `mitre_tactic`: "Initial Access"
   - `mitre_technique`: "T1200 - Hardware Additions"
   - `asset`: "FINANCE-PC-12.corp.internal"
   - `source_ip`: "10.0.2.12"
   - `user`: "s.jenkins"
   - `status`: "open"
   - `description`: "USB mass storage device VID_0781 / PID_5567 plugged into restricted workstation."

4. **Alert 4**:
   - `id`: `4`
   - `title`: "Potential Kerberoasting Activity Detected"
   - `severity`: `high`
   - `risk`: `82`
   - `category`: "Credential Access"
   - `mitre_tactic`: "Credential Access"
   - `mitre_technique`: "T1558.003 - Kerberoasting"
   - `asset`: "DC-02.corp.internal"
   - `source_ip`: "10.0.1.45"
   - `user`: "svc_sql_admin"
   - `status`: "open"
   - `description`: "Anomalous volume of TGS service ticket requests with weak RC4 encryption."

---

## 2. Playbooks Catalog (`uDe`)

The catalog contains **20 predefined automated response playbooks**, including:
1. **Brute Force Response** (Category: Brute Force, Triggers: Failed Logins > 20, Actions: Block Firewall IP, Disable User, Notify SOC).
2. **Ransomware Containment** (Category: Malware, Triggers: File Canary Triggered, Actions: Isolate Host, Kill Process, Snapshot Memory).
3. **Phishing Triage** (Category: Email, Triggers: User Reported Email, Actions: Scan URL via VirusTotal, Delete from Mailbox, Search Similar).
4. **Malicious IP Block** (Category: Network, Triggers: High Risk IOC Match, Actions: Add to Firewall Blacklist, Reset Active Sessions).
5. **Privilege Escalation Defense** (Category: IAM, Triggers: Unexpected Group Membership Change, Actions: Revoke Admin Rights, Lock Account).

---

## 3. Simulation Scenarios (`NDe`)

1. **Brute Force Attack** (`id`: `brute_force`, Severity: `critical`, Target: Domain Controller).
2. **Ransomware Outbreak** (`id`: `ransomware`, Severity: `critical`, Target: Endpoint Fleet).
3. **PowerShell Memory Injection** (`id`: `powershell_exec`, Severity: `high`, Target: Workstation).
4. **USB Data Exfiltration** (`id`: `usb_exfil`, Severity: `medium`, Target: Finance Workstation).
5. **DNS Tunneling Indicator** (`id`: `dns_tunnel`, Severity: `high`, Target: External Gateway).

---

## 4. Knowledge Center Articles (`$j`)

Contains 24 detailed cybersecurity educational modules spanning:
- `SOC`: Security Operations Center Architecture & Tier Responsibilities
- `SIEM`: Log Ingestion, Normalization, Correlation Rules, and Query Syntax
- `SOAR`: Orchestration Concepts, Playbook Design, Human Approvals
- `EDR`: Endpoint Telemetry, Kernel Drivers, Process Trees, Memory Scans
- `XDR`: Cross-Layer Telemetry Correlation (Identity + Endpoint + Cloud)
- `MITRE ATT&CK`: Tactics, Techniques, Sub-Techniques, and Coverage Metrics
- `YARA & Sigma`: Signature and Detection Rule Engineering
- `Digital Forensics`: Artifact Extraction, Memory Dumps, Timeline Reconstruction
