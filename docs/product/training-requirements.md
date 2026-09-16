# VRSOC Product Specification — Training & Educational Simulation Requirements

## 1. Document Overview

VRSOC is fundamentally a dual-purpose platform: an enterprise-grade Cyber Security Operations Center (SOC) cockpit AND a structured cybersecurity training and simulation academy. 

This document defines the educational architecture, learner progression, instructor supervision, simulation lab integration, and debriefing workflows required by the platform.

---

## 2. Core Educational Personas

### 2.1 The Learner (Student / Junior Analyst)
- **Objectives**: Develop hands-on forensic investigation skills, master SIEM log querying, execute SOAR playbooks, map attacks to MITRE ATT&CK, and formulate defensive containment strategies.
- **Experience**:
  - Access to dedicated educational labs with step-by-step investigation prompts.
  - Interactive Knowledge Center articles with concept checks and quizzes.
  - Sandbox alert queue where simulated incidents flow into real SOC tools.
  - Instant educational feedback and score breakdowns upon lab completion.

### 2.2 The Instructor (Professor / SecOps Lead)
- **Objectives**: Design training curricula, deploy synthetic cyber attack scenarios, monitor cohort progress in real time, review student investigation notes, and provide structured grading.
- **Experience**:
  - Cohort management interface with student roster and performance analytics.
  - Scenario dispatch controls to inject telemetry into student tenant partitions.
  - Grading dashboard to evaluate student forensic hypotheses and evidence tagging.

---

## 3. Educational Simulation Architecture

### 3.1 The Shared Telemetry Pipeline Principle
In strict adherence to the **Golden Product Principle** in `VR_SOC.md`, training labs do NOT use disconnected mock animations or fake data widgets.

When an instructor launches a training scenario, the system executes the **Canonical Simulation Pipeline**:

```text
Instructor Scenario Definition (e.g. "Kerberoasting Attack")
      ↓
Simulation Engine Dispatches Synthetic Telemetry
      ↓
Synthetic Events Ingested into public.events / public.logs
      ↓
SIEM Stream Correlates Events & Evaluates Sigma Detection Rules
      ↓
Alert Generated in /alerts (Tagged with Scenario ID & MITRE Tactic)
      ↓
Student Investigates in Real SOC Tools (/logs, /agents, /threat-hunting)
      ↓
Student Submits Forensic Dossier (Identified Attacker IP, Targeted User, Containment Plan)
      ↓
Automated Evaluation + Instructor Grading + Educational Debrief
```

---

## 4. Standard Scenario Lab Catalog

| Scenario ID | Title | Category & MITRE | Ingested Telemetry Signatures | Educational Learning Objective |
|---|---|---|---|---|
| **LAB-01** | *Brute Force & Credential Stuffing* | Credential Access (`T1110`) | 50+ Windows Event 4625 (Failed Logins) followed by Event 4624 (Success) from external IP. | Identify brute force patterns, calculate failure rates, formulate account lockout and firewall block actions. |
| **LAB-02** | *Suspicious PowerShell Memory Execution* | Execution (`T1059.001`) | EDR Process event showing `powershell.exe -nop -w hidden -enc...` spawning from `WINWORD.EXE`. | Decode base64 payloads, identify Living-off-the-Land binaries (LOLBins), execute host isolation. |
| **LAB-03** | *Persistence via Scheduled Tasks* | Persistence (`T1053.005`) | Windows Event 7045 (Service installed) and 4698 (Task scheduled) pointing to `.vbs` in `AppData`. | Investigate task scheduler artifacts, analyze persistence mechanisms, inspect registry keys. |
| **LAB-04** | *Unauthorized USB Data Exfiltration* | Exfiltration (`T1052.001`) | Device insertion event (Event 2003) followed by high-volume file read operations in `C:\Confidential\`. | Detect hardware policy violations, correlate user identity with removable media serials. |
| **LAB-05** | *DNS Tunneling & C2 Beaconing* | Command & Control (`T1071.004`) | 200+ DNS queries per minute for high-entropy subdomains (`*.tunnel.badactor.com`) with TXT records. | Analyze DNS request volume, identify encoded data exfiltration, configure perimeter DNS sinkholing. |
| **LAB-06** | *Ransomware Pre-cursor & Lateral Movement* | Lateral Movement (`T1021.002`) | PsExec execution, SMB admin share access (`ADMIN$`), followed by `vssadmin delete shadows` command. | Multi-stage incident triage, rapid containment escalation, shadow copy restoration planning. |

---

## 5. Investigation Learning Flow & Student Experience

### 5.1 Step 1: Scenario Activation
- Student opens the assigned lab in `/training/scenarios`.
- System provisions the scenario telemetry within the student's isolated tenant partition.
- The lab workspace presents the mission brief:
  > **Mission Brief**: "At 09:14 UTC, the perimeter firewall and domain controller reported an authentication anomaly. Triage the generated alert, determine if an account was compromised, locate the lateral movement vector, and submit your containment recommendation."

### 5.2 Step 2: Active Investigation in SOC Tools
- **Alert Triage (`/alerts`)**: Student acknowledges the alert, reviews the risk score and mapped MITRE technique.
- **Log Exploration (`/logs`)**: Student constructs queries in the SIEM to isolate source IP, timestamp range, and targeted usernames.
- **EDR Inspection (`/agents`)**: Student checks host health and process trees for anomalous parent-child relationships.
- **Threat Hunting (`/threat-hunting`)**: Student correlates external IP reputation using Threat Enrichment (VirusTotal, AbuseIPDB).

### 5.3 Step 3: Evidence Tagging & Case Formulation
- Student tags key log lines, IP addresses, and process hashes as **Evidence Items** in the investigation case dossier.
- Student writes analytical notes detailing:
  1. *Root Cause*: Initial access vector.
  2. *Blast Radius*: All compromised hosts and identities.
  3. *Adversary Technique*: Mapped MITRE technique codes.
  4. *Remediation Actions*: Containment steps (host isolation, password reset, firewall rule).

### 5.4 Step 4: Submission & Educational Debrief
- Student clicks "Submit Lab Solution".
- **Automated Scoring Engine**:
  - Compares identified IOCs against the scenario ground truth (Precision & Recall).
  - Checks if appropriate containment action was executed within the simulated SLA window.
  - Scores multiple-choice comprehension questions.
- **Instant Debrief Panel**:
  - Displays correct root cause analysis.
  - Highlights missed telemetry artifacts.
  - Explains the defensive rationale behind recommended mitigations.
  - Recommends related Knowledge Center articles for reinforcement.

---

## 6. Knowledge Center & Quiz System

### 6.1 Interactive Cybersecurity Articles
- **24+ Core Topic Modules**: Comprehensive educational markdown articles spanning SOC, SIEM, SOAR, EDR, XDR, Threat Intel, MITRE ATT&CK, Sigma Rules, YARA, Incident Response, and Digital Forensics.
- **Difficulty Progression**: Content classified into `Beginner` (Foundations), `Intermediate` (Operational Triage), and `Advanced` (Forensics & Detection Engineering).
- **Embedded Visualizations**: Architecture flowcharts, attack tree diagrams, and sample log syntax callouts.

### 6.2 Knowledge Check Quizzes
- Every Knowledge Center module concludes with a 5-to-10 question comprehension quiz.
- Question types: Multiple choice, select-all-that-apply, and log parsing challenges (e.g. "Which field in Windows Event 4625 indicates the logon failure sub-status?").
- Attempts and scores are permanently tracked in `public.student_progress` to contribute to the learner's overall competence scorecard.

---

## 7. Instructor Supervision & Cohort Management

### 7.1 Cohort Administration
- Instructors create Cohorts (e.g. "Cyber Defense 401 — Spring 2026") and assign student rosters.
- Instructors set assignment schedules, scenario deadlines, and custom difficulty parameters.

### 7.2 Live Cohort Progress Matrix
- **Realtime Dashboard**: Displays class-wide completion rates, average scores per lab, and common failure points.
- **Investigation Review**: Instructors can inspect any student's case notes, query history, and tagged evidence to provide personalized mentorship and qualitative feedback.

---

## 8. Defensive & Educational Safety Guardrails

In strict compliance with `VR_SOC.md` (Section 1), the training platform enforces strict defensive boundaries:

1. **Zero Offensive Weaponization**: The platform strictly prohibits tools that generate live malware payloads, compile zero-day exploits, automate external network attacks, or harvest external credentials.
2. **Defensive Mindset**: All labs focus exclusively on detection, triage, threat hunting, digital forensics, incident response, and containment engineering.
3. **Synthetic Grounding**: All simulated network traffic, IP addresses, hostnames, and user identities are synthetically generated and isolated within the platform sandbox.
