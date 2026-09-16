# VRSOC Phase 00 — Base44 Content Catalog

This catalog documents all visible strings, mock entity names, hostnames, IP addresses, usernames, and educational copy found across the Base44 application for reproduction in the seed and demo datasets.

---

## 1. Organizations, Assets & Infrastructure

- **Mock Organization Name**: `VRSOC Enterprise Defense Lab` / `CyberGuard Global`
- **Domain Controller Hosts**: `DC-01.corp.internal` (`10.0.1.10`), `DC-02.corp.internal` (`10.0.1.11`)
- **Database Servers**: `SQL-PROD-01.corp.internal` (`10.0.1.45`), `DB-CLUSTER-02.corp.internal` (`10.0.1.46`)
- **Endpoints / Workstations**:
  - `WKSTN-084.corp.internal` (`10.0.4.84`)
  - `FINANCE-PC-12.corp.internal` (`10.0.2.12`)
  - `HR-LAPTOP-05.corp.internal` (`10.0.2.55`)
  - `DEV-BOX-33.corp.internal` (`10.0.3.33`)
- **External Threat IPs (Simulated)**:
  - `185.220.101.42` (Tor Exit Node / Russian Federation)
  - `45.142.214.19` (Known Bulletproof Host / Netherlands)
  - `194.26.29.112` (Command & Control Server / Germany)

---

## 2. Personas & User Accounts

- **Administrative Accounts**: `admin_svc`, `svc_sql_admin`, `domain_admin`
- **SOC Analysts**: `J. Smith (Lead SOC Analyst)`, `A. Patel (Incident Responder)`, `E. Davis (Threat Hunter)`
- **Standard Employees**: `j.miller (Sales Associate)`, `s.jenkins (Finance Specialist)`, `m.taylor (HR Manager)`

---

## 3. Threat Intelligence Provider Names & Indicators

- **VirusTotal**: Scans hashes/URLs, detection ratio `42/88`, engine verdicts (`Kaspersky: Trojan.Generic`, `CrowdStrike: Malicious_Confidence_90%`).
- **AbuseIPDB**: Confidence Score `100%`, Total Reports `1,420`, Category `Hacking / Brute Force`.
- **AlienVault OTX**: `3 Active Pulses` (`CobaltStrike C2 Infrastructure 2026`).
- **Shodan**: Open Ports `22 (SSH)`, `80 (HTTP)`, `443 (HTTPS)`, `3389 (RDP exposed)`.

---

## 4. UI Copy, Taglines & Labels

- **Tagline**: `Learn • Detect • Investigate • Defend`
- **App Title**: `VRSOC — Cyber Defense Training`
- **Platform Description**: `An interactive, enterprise-grade training platform designed to simulate a real-world Security Operations Center for cybersecurity professionals and students to practice detection, investigation, and incident response.`
