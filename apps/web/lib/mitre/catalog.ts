/**
 * Phase 19: MITRE ATT&CK Catalog
 *
 * Authoritative, versioned Enterprise ATT&CK matrix dataset providing
 * canonical tactics, techniques, sub-techniques, mitigations, detection guidance,
 * and realistic threat examples for VRSOC.
 */

import type { MitreTactic, MitreTechnique, MitreMitigationRef } from "@vrsoc/types";

export const CANONICAL_MITRE_TACTICS: MitreTactic[] = [
  {
    id: "tac-recon",
    external_id: "TA0043",
    name: "Reconnaissance",
    description: "The adversary is trying to gather information they can use to plan future operations.",
    order_index: 1,
  },
  {
    id: "tac-resource-dev",
    external_id: "TA0042",
    name: "Resource Development",
    description: "The adversary is trying to establish resources they can use to support operations.",
    order_index: 2,
  },
  {
    id: "tac-initial-access",
    external_id: "TA0001",
    name: "Initial Access",
    description: "The adversary is trying to get into your enterprise network or cloud perimeter.",
    order_index: 3,
  },
  {
    id: "tac-execution",
    external_id: "TA0002",
    name: "Execution",
    description: "The adversary is trying to run malicious code on an endpoint or server.",
    order_index: 4,
  },
  {
    id: "tac-persistence",
    external_id: "TA0003",
    name: "Persistence",
    description: "The adversary is trying to maintain their foothold across restarts and credential resets.",
    order_index: 5,
  },
  {
    id: "tac-priv-esc",
    external_id: "TA0004",
    name: "Privilege Escalation",
    description: "The adversary is trying to gain higher-level permissions (SYSTEM, root, Domain Admin).",
    order_index: 6,
  },
  {
    id: "tac-defense-evasion",
    external_id: "TA0005",
    name: "Defense Evasion",
    description: "The adversary is trying to avoid detection and bypass EDR, AV, or firewall security controls.",
    order_index: 7,
  },
  {
    id: "tac-cred-access",
    external_id: "TA0006",
    name: "Credential Access",
    description: "The adversary is trying to steal account names, hashes, tokens, and passwords.",
    order_index: 8,
  },
  {
    id: "tac-discovery",
    external_id: "TA0007",
    name: "Discovery",
    description: "The adversary is trying to observe and explore your environment and network topology.",
    order_index: 9,
  },
  {
    id: "tac-lateral-move",
    external_id: "TA0008",
    name: "Lateral Movement",
    description: "The adversary is trying to pivot through your network and access remote systems.",
    order_index: 10,
  },
  {
    id: "tac-collection",
    external_id: "TA0009",
    name: "Collection",
    description: "The adversary is trying to gather sensitive data of interest to their operational goal.",
    order_index: 11,
  },
  {
    id: "tac-c2",
    external_id: "TA0011",
    name: "Command and Control",
    description: "The adversary is trying to communicate with compromised systems to control them.",
    order_index: 12,
  },
  {
    id: "tac-exfil",
    external_id: "TA0010",
    name: "Exfiltration",
    description: "The adversary is trying to steal and package data outside your organization.",
    order_index: 13,
  },
  {
    id: "tac-impact",
    external_id: "TA0040",
    name: "Impact",
    description: "The adversary is trying to manipulate, interrupt, encrypt, or destroy your systems and data.",
    order_index: 14,
  },
];

export const CANONICAL_MITRE_MITIGATIONS: MitreMitigationRef[] = [
  {
    external_id: "M1036",
    name: "Account Use Policies",
    description: "Configure policies regarding account usage, password complexity, and session timeouts.",
  },
  {
    external_id: "M1040",
    name: "Behavior Prevention on Endpoint",
    description: "Use EDR capabilities to identify and prevent suspicious behavior process hierarchies.",
  },
  {
    external_id: "M1026",
    name: "Privileged Account Management",
    description: "Manage creation, modification, use, and permissions of privileged admin accounts.",
  },
  {
    external_id: "M1047",
    name: "Audit & Centralized Logging",
    description: "Enable comprehensive auditing across endpoint, authentication, DNS, and network streams.",
  },
  {
    external_id: "M1049",
    name: "Antivirus/Antimalware",
    description: "Deploy updated antivirus signatures and real-time behavioral heuristic scanning.",
  },
  {
    external_id: "M1042",
    name: "Disable or Restrict Ports/Protocols",
    description: "Close unused listening ports and block insecure protocols such as SMBv1 or Telnet.",
  },
  {
    external_id: "M1018",
    name: "User Security Training",
    description: "Train employees to recognize spearphishing, suspicious links, and social engineering lures.",
  },
  {
    external_id: "M1054",
    name: "Software Configuration & Hardening",
    description: "Apply secure CIS benchmarks, disable PowerShell v2, and enforce constrained language mode.",
  },
  {
    external_id: "M1038",
    name: "Execution Prevention",
    description: "Block execution of unauthorized code via AppLocker, WDAC, or Software Restriction Policies.",
  },
  {
    external_id: "M1053",
    name: "Data Backup & Recovery",
    description: "Maintain immutable, offline backups to ensure recovery from ransomware destruction.",
  },
];

export const CANONICAL_MITRE_TECHNIQUES: MitreTechnique[] = [
  // ============================================================================
  // INITIAL ACCESS (TA0001)
  // ============================================================================
  {
    id: "tech-t1566",
    external_id: "T1566",
    name: "Phishing",
    description: "Adversaries may send phishing messages to gain access to victim systems via email, messaging, or social media.",
    tactic_external_id: "TA0001",
    tactic_name: "Initial Access",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS", "Cloud"],
    data_sources: ["Email Gateway", "Network Traffic", "User Activity"],
    detection_guidance: "Monitor inbound email logs for suspicious attachment types (.iso, .exe, .xlsm), spoofed headers (failed SPF/DKIM), and rapid burst campaigns.",
    examples: [
      {
        source_or_actor: "APT29 / Nobelium",
        description: "Delivered malicious ISO attachments masquerading as diplomatic invitations via weaponized spearphishing emails.",
      },
      {
        source_or_actor: "FIN7",
        description: "Sent weaponized DOCX documents containing macro payloads to human resources and finance staff.",
      },
    ],
    mitigations: [
      { external_id: "M1018", name: "User Training", description: "Educate users against clicking unsolicited links or attachments." },
      { external_id: "M1047", name: "Audit", description: "Inspect email telemetry for high-risk inbound attachments." },
    ],
  },
  {
    id: "tech-t1566-001",
    external_id: "T1566.001",
    name: "Spearphishing Attachment",
    description: "Adversaries may send spearphishing emails with a malicious file attachment in an attempt to gain initial access.",
    tactic_external_id: "TA0001",
    tactic_name: "Initial Access",
    is_subtechnique: true,
    parent_technique_id: "T1566",
    platforms: ["Windows", "macOS", "Linux"],
    data_sources: ["Email Gateway", "File Activity"],
    detection_guidance: "Correlate email arrival with file drop events in user %TEMP% or %DOWNLOADS% folders.",
    examples: [
      {
        source_or_actor: "Emotet",
        description: "Packaged malicious VBA macro spreadsheets inside password-protected ZIP attachments.",
      },
    ],
    mitigations: [
      { external_id: "M1049", name: "Antivirus/Antimalware", description: "Scan inbound email attachments using dynamic sandbox analysis." },
    ],
  },
  {
    id: "tech-t1190",
    external_id: "T1190",
    name: "Exploit Public-Facing Application",
    description: "Adversaries may attempt to exploit a vulnerability in an Internet-facing software or web service to gain access.",
    tactic_external_id: "TA0001",
    tactic_name: "Initial Access",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "Cloud", "Network"],
    data_sources: ["Web Application Firewall", "Application Logs", "Network Traffic"],
    detection_guidance: "Look for unexpected web server child processes (e.g. w3wp.exe spawning cmd.exe or bash.exe).",
    examples: [
      {
        source_or_actor: "ProxyLogon Exploitation",
        description: "Exploited Microsoft Exchange unauthenticated RCE vulnerabilities (CVE-2021-26855) to drop web shells.",
      },
    ],
    mitigations: [
      { external_id: "M1042", name: "Disable Ports", description: "Segment perimeter DMZ web servers from internal sensitive databases." },
    ],
  },
  {
    id: "tech-t1200",
    external_id: "T1200",
    name: "Hardware Additions",
    description: "Adversaries may introduce computer accessories, external flash storage, or modified hardware to gain unauthorized access.",
    tactic_external_id: "TA0001",
    tactic_name: "Initial Access",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Windows Event Log (Event ID 2003 / PnP)", "Hardware Additions", "EDR Telemetry"],
    detection_guidance: "Detect USB storage insertion events, PnP hardware registration, and unexpected HID keyboard emulation.",
    examples: [
      {
        source_or_actor: "FIN7 BadUSB Attacks",
        description: "Mailed malicious USB drives that emulated keyboard keystrokes to execute PowerShell downloaders.",
      },
    ],
    mitigations: [
      { external_id: "M1036", name: "Account Use Policies", description: "Disable USB mass storage ports on restricted workstation endpoints." },
    ],
  },
  {
    id: "tech-t1078",
    external_id: "T1078",
    name: "Valid Accounts",
    description: "Adversaries may obtain and abuse credentials of existing enterprise or cloud accounts as a means of gaining Initial Access, Persistence, or Privilege Escalation.",
    tactic_external_id: "TA0001",
    tactic_name: "Initial Access",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "Cloud", "Identity"],
    data_sources: ["Authentication Logs", "IdP Sign-in Logs", "Cloud Trail"],
    detection_guidance: "Detect impossible travel anomalies, concurrent sign-ins from disparate autonomous systems, and abnormal user agent strings.",
    examples: [
      {
        source_or_actor: "Lapsus$",
        description: "Purchased stolen employee session cookies from underground initial access brokers to bypass MFA.",
      },
    ],
    mitigations: [
      { external_id: "M1036", name: "Account Use Policies", description: "Enforce FIDO2 phishing-resistant multi-factor authentication." },
    ],
  },

  // ============================================================================
  // EXECUTION (TA0002)
  // ============================================================================
  {
    id: "tech-t1059",
    external_id: "T1059",
    name: "Command and Scripting Interpreter",
    description: "Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.",
    tactic_external_id: "TA0002",
    tactic_name: "Execution",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Process Creation", "Command Execution", "Script Block Logs"],
    detection_guidance: "Monitor command line parameters for known obfuscation flags, pipe commands, and child processes of Office applications.",
    examples: [
      {
        source_or_actor: "Cobalt Strike",
        description: "Executes in-memory reflective loaders using command scripting interpreters.",
      },
    ],
    mitigations: [
      { external_id: "M1038", name: "Execution Prevention", description: "Restrict PowerShell script execution using AppLocker and Constrained Language Mode." },
    ],
  },
  {
    id: "tech-t1059-001",
    external_id: "T1059.001",
    name: "PowerShell",
    description: "Adversaries may abuse PowerShell commands and scripts for executing malicious payloads, lateral discovery, and in-memory downloaders.",
    tactic_external_id: "TA0002",
    tactic_name: "Execution",
    is_subtechnique: true,
    parent_technique_id: "T1059",
    platforms: ["Windows"],
    data_sources: ["Process Creation (Sysmon Event ID 1)", "PowerShell Script Block Logging (Event ID 4104)"],
    detection_guidance: "Inspect command line for -EncodedCommand, -enc, DownloadString, Invoke-Expression, or Bypass execution policies.",
    examples: [
      {
        source_or_actor: "Wizard Spider / Ryuk",
        description: "Executed PowerShell download cradles to fetch secondary beacon implants.",
      },
    ],
    mitigations: [
      { external_id: "M1054", name: "Software Configuration", description: "Enable PowerShell Script Block Logging and AMSI deep buffer inspection." },
    ],
  },
  {
    id: "tech-t1059-003",
    external_id: "T1059.003",
    name: "Windows Command Shell",
    description: "Adversaries may abuse cmd.exe to execute commands or batch files on compromised Windows hosts.",
    tactic_external_id: "TA0002",
    tactic_name: "Execution",
    is_subtechnique: true,
    parent_technique_id: "T1059",
    platforms: ["Windows"],
    data_sources: ["Process Creation", "Command Line"],
    detection_guidance: "Look for cmd.exe /c executing discovery commands (whoami, net view, ipconfig) in rapid succession.",
    examples: [
      {
        source_or_actor: "QakBot",
        description: "Spawned cmd.exe child processes from Microsoft Word to execute batch reconnaissance scripts.",
      },
    ],
    mitigations: [
      { external_id: "M1038", name: "Execution Prevention", description: "Audit and restrict cmd.exe execution for non-administrative accounts." },
    ],
  },
  {
    id: "tech-t1053",
    external_id: "T1053",
    name: "Scheduled Task/Job",
    description: "Adversaries may abuse task scheduling functionality to facilitate initial or recurring execution of malicious code.",
    tactic_external_id: "TA0002",
    tactic_name: "Execution",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Scheduled Task Creation", "Process Creation"],
    detection_guidance: "Monitor Task Scheduler logs and schtasks.exe command line parameters creating tasks with short recurrence timers.",
    examples: [
      {
        source_or_actor: "Conti Ransomware",
        description: "Created scheduled tasks to maintain execution persistence prior to enterprise encryption.",
      },
    ],
    mitigations: [
      { external_id: "M1026", name: "Privileged Account Management", description: "Restrict task creation privileges to authorized administrators." },
    ],
  },
  {
    id: "tech-t1053-005",
    external_id: "T1053.005",
    name: "Scheduled Task",
    description: "Adversaries may abuse the Windows Task Scheduler (schtasks.exe) to execute programs at system startup or on a scheduled cadence.",
    tactic_external_id: "TA0002",
    tactic_name: "Execution",
    is_subtechnique: true,
    parent_technique_id: "T1053",
    platforms: ["Windows"],
    data_sources: ["Windows Event Log (Event ID 4698 / 4702)", "Process Creation"],
    detection_guidance: "Correlate schtasks /create /tn commands with executable binaries in user temp directories or disguised script paths.",
    examples: [
      {
        source_or_actor: "BlackCat / ALPHV",
        description: "Scheduled recurring tasks to restart proxy tunnels if terminated by analysts.",
      },
    ],
    mitigations: [
      { external_id: "M1047", name: "Audit", description: "Audit Task Scheduler registry keys and XML task definitions under C:\\Windows\\System32\\Tasks." },
    ],
  },

  // ============================================================================
  // PERSISTENCE (TA0003)
  // ============================================================================
  {
    id: "tech-t1547",
    external_id: "T1547",
    name: "Boot or Logon Autostart Execution",
    description: "Adversaries may configure system settings to automatically execute a program during system boot or logon to maintain persistence.",
    tactic_external_id: "TA0003",
    tactic_name: "Persistence",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Registry Changes", "File Modification", "Autoruns"],
    detection_guidance: "Monitor registry write events to Run, RunOnce, and Winlogon keys across HKLM and HKCU hives.",
    examples: [
      {
        source_or_actor: "TrickBot",
        description: "Added Run registry keys pointing to disguised svchost.exe executables in AppData.",
      },
    ],
    mitigations: [
      { external_id: "M1040", name: "Behavior Prevention", description: "Use EDR to block unauthorized modifications to Autostart registry locations." },
    ],
  },
  {
    id: "tech-t1547-001",
    external_id: "T1547.001",
    name: "Registry Run Keys / Startup Folder",
    description: "Adversaries may achieve persistence by adding an entry to the Run or RunOnce keys in the registry or adding files to the Startup folder.",
    tactic_external_id: "TA0003",
    tactic_name: "Persistence",
    is_subtechnique: true,
    parent_technique_id: "T1547",
    platforms: ["Windows"],
    data_sources: ["Sysmon Event ID 13", "Registry Events", "File Creation in Startup folder"],
    detection_guidance: "Detect modifications to HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run pointing to binaries outside Program Files.",
    examples: [
      {
        source_or_actor: "Carbanak",
        description: "Maintained persistence by writing backdoor paths into the Run registry key.",
      },
    ],
    mitigations: [
      { external_id: "M1047", name: "Audit", description: "Regularly baseline and audit registry run key changes across fleet endpoints." },
    ],
  },
  {
    id: "tech-t1543",
    external_id: "T1543",
    name: "Create or Modify System Process",
    description: "Adversaries may create or modify system-level processes, such as system services or daemons, to repeatedly execute malicious payloads.",
    tactic_external_id: "TA0003",
    tactic_name: "Persistence",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Service Installation (Event ID 7045)", "Process Creation"],
    detection_guidance: "Look for sc.exe create or powershell New-Service commands referencing non-standard binPaths.",
    examples: [
      {
        source_or_actor: "DarkSide",
        description: "Created temporary Windows services to execute ransomware encryptors with SYSTEM privileges.",
      },
    ],
    mitigations: [
      { external_id: "M1026", name: "Privileged Account Management", description: "Prohibit standard users from creating or modifying Windows services." },
    ],
  },
  {
    id: "tech-t1543-003",
    external_id: "T1543.003",
    name: "Windows Service",
    description: "Adversaries may create or modify Windows services to execute malicious code automatically upon system boot with SYSTEM privileges.",
    tactic_external_id: "TA0003",
    tactic_name: "Persistence",
    is_subtechnique: true,
    parent_technique_id: "T1543",
    platforms: ["Windows"],
    data_sources: ["System Event Log (Event ID 7045)", "Registry HKLM\\SYSTEM\\CurrentControlSet\\Services"],
    detection_guidance: "Detect service installation events where the binary path points to user-writable directories.",
    examples: [
      {
        source_or_actor: "PsExec Abuse",
        description: "Installs PSEXESVC service remotely to establish interactive SYSTEM shells.",
      },
    ],
    mitigations: [
      { external_id: "M1040", name: "Behavior Prevention", description: "Enforce code signing validation for all installed Windows services." },
    ],
  },

  // ============================================================================
  // PRIVILEGE ESCALATION (TA0004)
  // ============================================================================
  {
    id: "tech-t1548",
    external_id: "T1548",
    name: "Abuse Elevation Control Mechanism",
    description: "Adversaries may circumvent mechanisms designed to control elevation of privileges on systems.",
    tactic_external_id: "TA0004",
    tactic_name: "Privilege Escalation",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Process Creation", "Integrity Level Changes"],
    detection_guidance: "Monitor for processes spawned with High or System integrity from Medium integrity parent processes without user prompt.",
    examples: [
      {
        source_or_actor: "LockBit",
        description: "Abused CMSTP and fodhelper.exe registry hijack methods to bypass Windows UAC silently.",
      },
    ],
    mitigations: [
      { external_id: "M1054", name: "Software Configuration", description: "Set UAC elevation prompt behavior to Always Notify." },
    ],
  },
  {
    id: "tech-t1068",
    external_id: "T1068",
    name: "Exploitation for Privilege Escalation",
    description: "Adversaries may exploit software vulnerabilities in elevated services or the OS kernel to elevate privileges.",
    tactic_external_id: "TA0004",
    tactic_name: "Privilege Escalation",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["System Crash Logs", "Process Creation"],
    detection_guidance: "Detect sudden integrity elevation of non-standard binaries and kernel exploit signatures.",
    examples: [
      {
        source_or_actor: "PrintNightmare (CVE-2021-34527)",
        description: "Exploited Windows Print Spooler service to execute arbitrary DLLs with SYSTEM privileges.",
      },
    ],
    mitigations: [
      { external_id: "M1042", name: "Disable Protocols", description: "Disable Print Spooler on domain controllers and sensitive servers." },
    ],
  },

  // ============================================================================
  // DEFENSE EVASION (TA0005)
  // ============================================================================
  {
    id: "tech-t1036",
    external_id: "T1036",
    name: "Masquerading",
    description: "Adversaries may manipulate features of artifacts (names, paths, metadata) to make them appear legitimate to defenders.",
    tactic_external_id: "TA0005",
    tactic_name: "Defense Evasion",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Process Creation", "File Metadata"],
    detection_guidance: "Inspect process names matching core OS binaries (svchost.exe, lsass.exe) located outside System32.",
    examples: [
      {
        source_or_actor: "Stuxnet",
        description: "Masqueraded driver files with forged digital certificates from legitimate hardware vendors.",
      },
    ],
    mitigations: [
      { external_id: "M1040", name: "Behavior Prevention", description: "Verify binary path integrity and cryptographic signatures using EDR." },
    ],
  },
  {
    id: "tech-t1036-005",
    external_id: "T1036.005",
    name: "Match Legitimate Name or Location",
    description: "Adversaries may match or approximate the name or location of legitimate files, processes, or directories to deceive analysts.",
    tactic_external_id: "TA0005",
    tactic_name: "Defense Evasion",
    is_subtechnique: true,
    parent_technique_id: "T1036",
    platforms: ["Windows", "Linux"],
    data_sources: ["Sysmon Process Creation", "File Creation"],
    detection_guidance: "Alert on svch0st.exe, scvhost.exe, or svchost.exe running from C:\\Users\\... or C:\\Temp.",
    examples: [
      {
        source_or_actor: "RedLine Stealer",
        description: "Dropped payload named chrome_installer.exe inside user AppData directory.",
      },
    ],
    mitigations: [
      { external_id: "M1049", name: "Antivirus", description: "Block unsigned executables executing from user writable directories." },
    ],
  },
  {
    id: "tech-t1027",
    external_id: "T1027",
    name: "Obfuscated Files or Information",
    description: "Adversaries may make their payloads, strings, or network communications difficult to discover or analyze through encoding or encryption.",
    tactic_external_id: "TA0005",
    tactic_name: "Defense Evasion",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS", "Cloud"],
    data_sources: ["Command Line", "File Contents", "Network Payloads"],
    detection_guidance: "Detect base64 strings, XOR decoding loops, high entropy file sections, and double file extensions.",
    examples: [
      {
        source_or_actor: "SolarWinds SUNBURST",
        description: "Employed steganography and custom domain DGA algorithms to obfuscate C2 traffic.",
      },
    ],
    mitigations: [
      { external_id: "M1054", name: "Software Configuration", description: "Enable AMSI inspection to deobfuscate in-memory scripting buffers." },
    ],
  },
  {
    id: "tech-t1112",
    external_id: "T1112",
    name: "Modify Registry",
    description: "Adversaries may interact with the Windows Registry to hide configuration information, disable security tools, or evade detection.",
    tactic_external_id: "TA0005",
    tactic_name: "Defense Evasion",
    is_subtechnique: false,
    platforms: ["Windows"],
    data_sources: ["Sysmon Event ID 12/13/14", "Registry Audit"],
    detection_guidance: "Detect modifications to DisableRealtimeMonitoring, DisableAntiSpyware, or TamperProtection registry keys.",
    examples: [
      {
        source_or_actor: "HermeticWiper",
        description: "Modified registry keys to disable VSS service and corrupt crash dump configurations.",
      },
    ],
    mitigations: [
      { external_id: "M1040", name: "Behavior Prevention", description: "Enable Windows Defender Tamper Protection to prevent registry tampering." },
    ],
  },

  // ============================================================================
  // CREDENTIAL ACCESS (TA0006)
  // ============================================================================
  {
    id: "tech-t1110",
    external_id: "T1110",
    name: "Brute Force",
    description: "Adversaries may use brute force techniques to attempt credential guessing or password spraying against accounts.",
    tactic_external_id: "TA0006",
    tactic_name: "Credential Access",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "Cloud", "Identity"],
    data_sources: ["Authentication Logs", "VPN Logs", "Domain Controller Event ID 4625"],
    detection_guidance: "Detect high volume of failed sign-ins from single IP targeting multiple accounts (spray) or single account (guess).",
    examples: [
      {
        source_or_actor: "Midnight Blizzard / APT29",
        description: "Conducted residential proxy password spray attacks against legacy test tenant environments.",
      },
    ],
    mitigations: [
      { external_id: "M1036", name: "Account Use Policies", description: "Enforce smart lockout policies, CAPTCHA rate limiting, and conditional access MFA." },
    ],
  },
  {
    id: "tech-t1110-001",
    external_id: "T1110.001",
    name: "Password Guessing",
    description: "Adversaries may systematically guess passwords on a system or service to acquire valid credentials for a specific account.",
    tactic_external_id: "TA0006",
    tactic_name: "Credential Access",
    is_subtechnique: true,
    parent_technique_id: "T1110",
    platforms: ["Windows", "Linux", "Cloud", "Identity"],
    data_sources: ["Authentication Events", "Active Directory Event 4625"],
    detection_guidance: "Threshold correlation: >= 3 failed logon attempts within 15 minutes targeting the same username.",
    examples: [
      {
        source_or_actor: "Sandworm Team",
        description: "Targeted critical operational infrastructure with automated dictionary guessing attacks.",
      },
    ],
    mitigations: [
      { external_id: "M1036", name: "Account Use Policies", description: "Lock accounts temporarily after repeated consecutive failed authentication attempts." },
    ],
  },
  {
    id: "tech-t1110-003",
    external_id: "T1110.003",
    name: "Password Spraying",
    description: "Adversaries may use a single common password against many different user accounts to avoid account lockouts.",
    tactic_external_id: "TA0006",
    tactic_name: "Credential Access",
    is_subtechnique: true,
    parent_technique_id: "T1110",
    platforms: ["Windows", "Cloud", "Identity"],
    data_sources: ["IdP Sign-in Logs", "Azure AD Sign-ins"],
    detection_guidance: "Detect single source IP attempting identical password hash across > 10 distinct organizational usernames.",
    examples: [
      {
        source_or_actor: "Volt Typhoon",
        description: "Used password spraying via compromised SOHO routers to obtain valid enterprise user credentials.",
      },
    ],
    mitigations: [
      { external_id: "M1036", name: "Account Use Policies", description: "Enforce dynamic IP reputation blocking and banned password lists." },
    ],
  },
  {
    id: "tech-t1003",
    external_id: "T1003",
    name: "OS Credential Dumping",
    description: "Adversaries may attempt to dump credentials to obtain cleartext passwords or NTLM password hashes from memory.",
    tactic_external_id: "TA0006",
    tactic_name: "Credential Access",
    is_subtechnique: false,
    platforms: ["Windows", "Linux"],
    data_sources: ["Sysmon Event ID 10 (ProcessAccess)", "LSASS Memory Access"],
    detection_guidance: "Monitor for OpenProcess calls with PROCESS_VM_READ access masks targeting lsass.exe.",
    examples: [
      {
        source_or_actor: "Mimikatz",
        description: "Extracts plaintext credentials and Kerberos tickets directly from lsass.exe memory space.",
      },
    ],
    mitigations: [
      { external_id: "M1054", name: "Software Configuration", description: "Enable Windows Credential Guard (LSA Protection / RunAsPPL)." },
    ],
  },

  // ============================================================================
  // DISCOVERY (TA0007)
  // ============================================================================
  {
    id: "tech-t1046",
    external_id: "T1046",
    name: "Network Service Discovery",
    description: "Adversaries may attempt to get a listing of services running on remote hosts to identify exploitable targets and lateral paths.",
    tactic_external_id: "TA0007",
    tactic_name: "Discovery",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "Network"],
    data_sources: ["Network Traffic / NetFlow", "Firewall Logs", "EDR Socket Telemetry"],
    detection_guidance: "Detect rapid TCP SYN bursts or port sweeps scanning ports 445, 3389, 22, and 80 across internal subnet ranges.",
    examples: [
      {
        source_or_actor: "WannaCry Ransomware",
        description: "Scanned internal subnets and Internet IP ranges for open SMB port 445 to spread EternalBlue.",
      },
    ],
    mitigations: [
      { external_id: "M1042", name: "Disable Ports", description: "Segment internal VLANs with micro-segmentation firewalls to prevent lateral scanning." },
    ],
  },
  {
    id: "tech-t1082",
    external_id: "T1082",
    name: "System Information Discovery",
    description: "Adversaries may attempt to get detailed information about the operating system and hardware configuration.",
    tactic_external_id: "TA0007",
    tactic_name: "Discovery",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Process Creation", "Command Execution"],
    detection_guidance: "Detect execution of systeminfo.exe, hostname, uname -a, or wmic qfe in rapid succession.",
    examples: [
      {
        source_or_actor: "IcedID",
        description: "Ran systeminfo.exe immediately following initial macro execution to fingerprint sandbox environments.",
      },
    ],
    mitigations: [
      { external_id: "M1047", name: "Audit", description: "Audit command line executions and alert on automated discovery script sequences." },
    ],
  },

  // ============================================================================
  // LATERAL MOVEMENT (TA0008)
  // ============================================================================
  {
    id: "tech-t1021",
    external_id: "T1021",
    name: "Remote Services",
    description: "Adversaries may use valid credentials to log in to remote services such as RDP, SSH, or SMB to pivot across the enterprise.",
    tactic_external_id: "TA0008",
    tactic_name: "Lateral Movement",
    is_subtechnique: false,
    platforms: ["Windows", "Linux"],
    data_sources: ["Authentication Logs (Logon Type 3 / 10)", "Network Connections"],
    detection_guidance: "Detect anomalous RDP/SMB connections between workstation endpoints (workstation-to-workstation traffic).",
    examples: [
      {
        source_or_actor: "BlackMatter",
        description: "Used stolen domain administrator credentials to establish remote SMB sessions across all hypervisors.",
      },
    ],
    mitigations: [
      { external_id: "M1042", name: "Disable Ports", description: "Block workstation-to-workstation SMB and RDP traffic using host firewalls." },
    ],
  },
  {
    id: "tech-t1021-002",
    external_id: "T1021.002",
    name: "SMB/Windows Admin Shares",
    description: "Adversaries may abuse Windows SMB shares (such as C$, ADMIN$, IPC$) to remotely transfer files and execute malicious payloads.",
    tactic_external_id: "TA0008",
    tactic_name: "Lateral Movement",
    is_subtechnique: true,
    parent_technique_id: "T1021",
    platforms: ["Windows"],
    data_sources: ["Security Event Log (Event ID 5140)", "Network Traffic"],
    detection_guidance: "Detect access to ADMIN$ share followed immediately by remote service creation or file drops.",
    examples: [
      {
        source_or_actor: "NotPetya",
        description: "Utilized PsExec and WMIC over SMB ADMIN$ shares to automatically distribute ransomware across corporate networks.",
      },
    ],
    mitigations: [
      { external_id: "M1026", name: "Privileged Account Management", description: "Disable default administrative shares where unnecessary." },
    ],
  },

  // ============================================================================
  // COLLECTION (TA0009)
  // ============================================================================
  {
    id: "tech-t1005",
    external_id: "T1005",
    name: "Data from Local System",
    description: "Adversaries may search local system sources, such as file systems and databases, to find files of interest and sensitive data prior to exfiltration.",
    tactic_external_id: "TA0009",
    tactic_name: "Collection",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["File Access", "Process Creation"],
    detection_guidance: "Detect rapid directory traversal and mass archive creation (.zip, .7z) in user home directories.",
    examples: [
      {
        source_or_actor: "Volt Typhoon",
        description: "Searched domain controller volumes for ntds.dit Active Directory database archives.",
      },
    ],
    mitigations: [
      { external_id: "M1036", name: "Account Use Policies", description: "Enforce least privilege file permissions to restrict access to sensitive corporate directories." },
    ],
  },
  {
    id: "tech-t1114",
    external_id: "T1114",
    name: "Email Collection",
    description: "Adversaries may target user email to collect sensitive communications, attachments, and credentials.",
    tactic_external_id: "TA0009",
    tactic_name: "Collection",
    is_subtechnique: false,
    platforms: ["Cloud", "Windows"],
    data_sources: ["Mailbox Access Logs", "M365 Audit Logs"],
    detection_guidance: "Detect new mailbox forwarding rules or bulk export of OST/PST files.",
    examples: [
      {
        source_or_actor: "APT29",
        description: "Created malicious email forwarding rules to exfiltrate executive communications to external dropboxes.",
      },
    ],
    mitigations: [
      { external_id: "M1047", name: "Audit", description: "Alert on automated external email forwarding rules created by users." },
    ],
  },
  {
    id: "tech-t1114-002",
    external_id: "T1114.002",
    name: "Remote Email Collection",
    description: "Adversaries may abuse Exchange Web Services (EWS) or Microsoft Graph APIs to remotely collect email messages from cloud mailboxes.",
    tactic_external_id: "TA0009",
    tactic_name: "Collection",
    is_subtechnique: true,
    parent_technique_id: "T1114",
    platforms: ["Cloud", "Windows"],
    data_sources: ["Cloud API Audit Logs", "Exchange Logs"],
    detection_guidance: "Monitor for Graph API calls querying Mail.ReadWrite permissions from unauthorized application service principals.",
    examples: [
      {
        source_or_actor: "Midnight Blizzard",
        description: "Abused OAuth application permissions to silently read enterprise cloud mailboxes via Graph API.",
      },
    ],
    mitigations: [
      { external_id: "M1026", name: "Privileged Account Management", description: "Audit and restrict OAuth application consented permissions in tenant IdP." },
    ],
  },

  // ============================================================================
  // COMMAND AND CONTROL (TA0011)
  // ============================================================================
  {
    id: "tech-t1071",
    external_id: "T1071",
    name: "Application Layer Protocol",
    description: "Adversaries may communicate using application layer protocols (HTTP, HTTPS, DNS, SMTP) to blend in with legitimate network traffic.",
    tactic_external_id: "TA0011",
    tactic_name: "Command and Control",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "Cloud", "Network"],
    data_sources: ["DNS Queries", "Proxy Logs", "TLS Inspection Telemetry"],
    detection_guidance: "Detect beaconing intervals (jittered regular HTTP POSTs) and connections to freshly registered domains (< 7 days old).",
    examples: [
      {
        source_or_actor: "Sliver / Mythic C2",
        description: "Communicated with remote command servers using encrypted HTTPS requests disguised as Microsoft telemetry.",
      },
    ],
    mitigations: [
      { external_id: "M1047", name: "Audit", description: "Deploy outbound TLS inspection and proxy category filtering." },
    ],
  },
  {
    id: "tech-t1071-001",
    external_id: "T1071.001",
    name: "Web Protocols",
    description: "Adversaries may communicate using HTTP/HTTPS to blend C2 beacon traffic with normal user web browsing.",
    tactic_external_id: "TA0011",
    tactic_name: "Command and Control",
    is_subtechnique: true,
    parent_technique_id: "T1071",
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Web Proxy Logs", "EDR Network Events"],
    detection_guidance: "Detect non-browser processes (powershell.exe, rundll32.exe) making outbound HTTPS connections.",
    examples: [
      {
        source_or_actor: "Bumblebee Loader",
        description: "Used HTTPS websockets for structured C2 tasking and DLL payload delivery.",
      },
    ],
    mitigations: [
      { external_id: "M1049", name: "Antivirus", description: "Inspect outbound web traffic with web application security gateways." },
    ],
  },
  {
    id: "tech-t1071-004",
    external_id: "T1071.004",
    name: "DNS",
    description: "Adversaries may communicate using the Domain Name System (DNS) application layer protocol to avoid network boundary detection.",
    tactic_external_id: "TA0011",
    tactic_name: "Command and Control",
    is_subtechnique: true,
    parent_technique_id: "T1071",
    platforms: ["Windows", "Linux", "Network"],
    data_sources: ["DNS Query Logs", "Passive DNS"],
    detection_guidance: "Detect high-volume anomalous TXT/NULL query bursts, unusually long domain labels (> 50 chars), and base64 encoded DNS tunnels.",
    examples: [
      {
        source_or_actor: "OilRig / APT34",
        description: "Utilized custom DNS tunneling tool (DNSpionage) to transmit encoded commands and exfiltrate credentials.",
      },
    ],
    mitigations: [
      { external_id: "M1047", name: "Audit", description: "Route all enterprise DNS through internal validating resolvers with DNS sinkholing enabled." },
    ],
  },

  // ============================================================================
  // EXFILTRATION (TA0010)
  // ============================================================================
  {
    id: "tech-t1052",
    external_id: "T1052",
    name: "Exfiltration Over Physical Medium",
    description: "Adversaries may attempt to exfiltrate data via physical media, such as a removable thumb drive or external hard disk.",
    tactic_external_id: "TA0010",
    tactic_name: "Exfiltration",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["Removable Media Events", "File Activity"],
    detection_guidance: "Correlate mass file copy operations to removable drive volumes (e.g. E:\\ or F:\\) following credential discovery.",
    examples: [
      {
        source_or_actor: "Agent.BTZ",
        description: "Exfiltrated collected military network configuration logs to infected flash drive media.",
      },
    ],
    mitigations: [
      { external_id: "M1036", name: "Account Use Policies", description: "Enforce Data Loss Prevention (DLP) rules blocking file writes to removable drives." },
    ],
  },
  {
    id: "tech-t1052-001",
    external_id: "T1052.001",
    name: "Exfiltration over USB",
    description: "Adversaries may attempt to exfiltrate sensitive files and archive packages over connected USB flash storage.",
    tactic_external_id: "TA0010",
    tactic_name: "Exfiltration",
    is_subtechnique: true,
    parent_technique_id: "T1052",
    platforms: ["Windows", "Linux"],
    data_sources: ["EDR File Events", "USB Telemetry"],
    detection_guidance: "Alert on rapid file write bursts to removable drive letters within 10 minutes of sensitive folder exploration.",
    examples: [
      {
        source_or_actor: "Insider Threat Campaign",
        description: "Copied intellectual property archives to encrypted personal USB drives before resignation.",
      },
    ],
    mitigations: [
      { external_id: "M1047", name: "Audit", description: "Maintain continuous forensic audit trails of all removable media write operations." },
    ],
  },
  {
    id: "tech-t1567",
    external_id: "T1567",
    name: "Exfiltration to Cloud Storage",
    description: "Adversaries may exfiltrate data to a cloud storage service (Mega, OneDrive, AWS S3, Google Drive) rather than over their primary C2 channel.",
    tactic_external_id: "TA0010",
    tactic_name: "Exfiltration",
    is_subtechnique: false,
    platforms: ["Windows", "Cloud", "Network"],
    data_sources: ["Cloud Proxy Logs", "Network Connections", "CASB Alerts"],
    detection_guidance: "Detect command line utilities (rclone, mega-cmd) uploading encrypted multi-gigabyte archives to consumer cloud storage endpoints.",
    examples: [
      {
        source_or_actor: "LockBit 3.0",
        description: "Used rclone.exe with custom API tokens to exfiltrate victim file shares to MEGA.nz cloud buckets.",
      },
    ],
    mitigations: [
      { external_id: "M1042", name: "Disable Protocols", description: "Block unauthorized cloud file-sharing services via CASB / Web Gateway." },
    ],
  },

  // ============================================================================
  // IMPACT (TA0040)
  // ============================================================================
  {
    id: "tech-t1486",
    external_id: "T1486",
    name: "Data Encrypted for Impact",
    description: "Adversaries may encrypt data on target systems to interrupt availability to system and network resources (Ransomware).",
    tactic_external_id: "TA0040",
    tactic_name: "Impact",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "macOS"],
    data_sources: ["File Modification Bursts", "Canary File Traps", "EDR Ransomware Telemetry"],
    detection_guidance: "Detect high-frequency file rename and write events (> 50 files/sec), canary file modification, and ransom note creation (.txt/.html).",
    examples: [
      {
        source_or_actor: "WannaCry / LockBit / Black Basta",
        description: "Utilized AES/RSA hybrid encryption algorithms to rapidly encrypt local documents and attached network shares.",
      },
    ],
    mitigations: [
      { external_id: "M1053", name: "Data Backup", description: "Maintain air-gapped, immutable backups and deploy EDR automated ransomware isolation." },
    ],
  },
  {
    id: "tech-t1490",
    external_id: "T1490",
    name: "Inhibit System Recovery",
    description: "Adversaries may delete or remove built-in data and operating system recovery mechanisms to prevent recovery from ransomware.",
    tactic_external_id: "TA0040",
    tactic_name: "Impact",
    is_subtechnique: false,
    platforms: ["Windows", "Linux"],
    data_sources: ["Sysmon Process Creation", "Command Execution"],
    detection_guidance: "Alert on vssadmin.exe delete shadows, wmic shadowcopy delete, bcdedit /set {default} recoveryenabled No, or wbadmin delete catalog.",
    examples: [
      {
        source_or_actor: "Ryuk Ransomware",
        description: "Executed batch commands calling vssadmin.exe delete shadows /all /quiet prior to file encryption.",
      },
    ],
    mitigations: [
      { external_id: "M1040", name: "Behavior Prevention", description: "Block non-whitelisted processes from invoking vssadmin or tampering with Volume Shadow Copies." },
    ],
  },
  {
    id: "tech-t1531",
    external_id: "T1531",
    name: "Account Access Removal",
    description: "Adversaries may interrupt availability of system and network resources by inhibiting access to accounts (password resets, account deletions).",
    tactic_external_id: "TA0040",
    tactic_name: "Impact",
    is_subtechnique: false,
    platforms: ["Windows", "Linux", "Cloud", "Identity"],
    data_sources: ["Active Directory Logs (Event 4726/4724)", "Cloud Audit"],
    detection_guidance: "Detect bulk password resets or mass administrative account deletions within a short timeframe.",
    examples: [
      {
        source_or_actor: "HermeticWiper",
        description: "Revoked administrative accounts and scrambled passwords before wiping master boot records.",
      },
    ],
    mitigations: [
      { external_id: "M1026", name: "Privileged Account Management", description: "Require dual-custody authorization for emergency break-glass administrative changes." },
    ],
  },

  // ============================================================================
  // RECONNAISSANCE (TA0043) & RESOURCE DEVELOPMENT (TA0042)
  // ============================================================================
  {
    id: "tech-t1595",
    external_id: "T1595",
    name: "Active Scanning",
    description: "Adversaries may execute active reconnaissance scans to gather information that can be used during targeting.",
    tactic_external_id: "TA0043",
    tactic_name: "Reconnaissance",
    is_subtechnique: false,
    platforms: ["Network"],
    data_sources: ["Network Traffic", "Firewall Logs"],
    detection_guidance: "Detect mass internet scanning sweeps targeting perimeter IP ranges.",
    examples: [
      {
        source_or_actor: "Mirai Botnet",
        description: "Scanned the IPv4 address space looking for open Telnet and SSH ports on IoT devices.",
      },
    ],
    mitigations: [
      { external_id: "M1042", name: "Disable Ports", description: "Hide non-public services behind zero-trust network access gateways." },
    ],
  },
  {
    id: "tech-t1595-001",
    external_id: "T1595.001",
    name: "Port Scanning",
    description: "Adversaries may scan victim IP blocks to identify listening network ports and exposed services.",
    tactic_external_id: "TA0043",
    tactic_name: "Reconnaissance",
    is_subtechnique: true,
    parent_technique_id: "T1595",
    platforms: ["Network"],
    data_sources: ["Network Traffic", "Firewall Denies"],
    detection_guidance: "Identify IP addresses generating excessive TCP SYN packets to multiple destination ports.",
    examples: [
      {
        source_or_actor: "Shodan / Adversary Scanners",
        description: "Automated port sweeps identifying exposed RDP (3389) and SMB (445) ports.",
      },
    ],
    mitigations: [
      { external_id: "M1042", name: "Disable Ports", description: "Configure edge firewalls with rate-limiting and drop rules for unassigned ports." },
    ],
  },
  {
    id: "tech-t1583",
    external_id: "T1583",
    name: "Acquire Infrastructure",
    description: "Adversaries may acquire infrastructure (domains, virtual servers, IP blocks) that can be used during targeting.",
    tactic_external_id: "TA0042",
    tactic_name: "Resource Development",
    is_subtechnique: false,
    platforms: ["Cloud", "Network"],
    data_sources: ["Threat Intelligence", "WHOIS Records"],
    detection_guidance: "Correlate newly registered domains with typosquatting keywords matching enterprise brands.",
    examples: [
      {
        source_or_actor: "Scattered Spider",
        description: "Registered deceptive domains mimicking corporate Okta login portals to conduct SMS phishing.",
      },
    ],
    mitigations: [
      { external_id: "M1018", name: "User Training", description: "Maintain continuous brand domain monitoring and brand protection takedowns." },
    ],
  },
];
