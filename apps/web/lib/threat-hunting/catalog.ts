import type {
  HuntSession,
  HuntEvidence,
  HuntNote,
  HuntType,
} from "@vrsoc/types";

/**
 * Pre-configured Hypothesis Templates for Threat Hunters
 */
export interface HuntHypothesisTemplate {
  id: string;
  title: string;
  hunt_type: HuntType;
  default_query: string;
  hypothesis: string;
  target_entities: string[];
  mitre_techniques: string[];
  description: string;
}

export const CANONICAL_HUNT_TEMPLATES: HuntHypothesisTemplate[] = [
  {
    id: "HUNT-001",
    title: "Cobalt Strike C2 Beaconing & Sockets",
    hunt_type: "ioc",
    default_query: "185.220.101.5",
    hypothesis: "Adversary is maintaining persistent interactive C2 channels over external IP 185.220.101.5 using Cobalt Strike malleable profiles.",
    target_entities: ["185.220.101.5", "c2-update-services.ru", "WKSTN-FIN-004", "beacon.exe"],
    mitre_techniques: ["T1071.001", "T1573.002"],
    description: "Hunt for recurring beacon intervals, TLS traffic anomalies, and outbound socket connections initiated by spawned powershell.exe or rundll32.exe processes.",
  },
  {
    id: "HUNT-002",
    title: "Credential Access via LSASS Memory Injection",
    hunt_type: "process",
    default_query: "lsass.exe",
    hypothesis: "Adversary executed in-memory credential harvesting against LSASS using Invoke-Mimikatz or procdump.",
    target_entities: ["lsass.exe", "powershell.exe", "Invoke-Mimikatz.ps1", "44d88612fea8a8f36de82e1278abb02f"],
    mitre_techniques: ["T1003.001", "T1059.001"],
    description: "Investigate process handles opened with PROCESS_VM_READ/PROCESS_QUERY_INFORMATION against lsass.exe and anomalous child processes.",
  },
  {
    id: "HUNT-003",
    title: "Persistence via Registry Run Keys",
    hunt_type: "registry",
    default_query: "CurrentVersion\\Run",
    hypothesis: "Adversary established persistence by modifying user/system Run registry keys to execute payload upon system logon.",
    target_entities: ["HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "updater.vbs", "DC-CORP-001"],
    mitre_techniques: ["T1547.001"],
    description: "Inspect newly created or modified registry values in autorun locations executed under unprivileged user contexts.",
  },
  {
    id: "HUNT-004",
    title: "Phishing Dropper & Weaponized Macro Execution",
    hunt_type: "hash",
    default_query: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    hypothesis: "Initial compromise originated via spearphishing attachment delivering an obfuscated macro payload to workstation.",
    target_entities: ["invoice_oct2026.pdf.exe", "billing-alert@target-corp.com", "winword.exe"],
    mitre_techniques: ["T1566.001", "T1204.002"],
    description: "Track weaponized document receipt via email, subsequent spawning of cmd.exe/powershell.exe, and staged payload drops in AppData.",
  },
  {
    id: "HUNT-005",
    title: "Lateral Movement with Privileged Service Account",
    hunt_type: "user",
    default_query: "admin_svc",
    hypothesis: "Compromised service account credentials are being utilized for SMB/WinRM lateral traversal between workstations and domain controllers.",
    target_entities: ["admin_svc", "WKSTN-FIN-004", "DC-CORP-001", "srv-db-01"],
    mitre_techniques: ["T1021.002", "T1078.002"],
    description: "Hunt for anomalous authentication spikes (Event ID 4624 Type 3) originating from non-standard source workstations across internal subnets.",
  },
];

/**
 * Canonical Sample Hunt Sessions for Simulation / Development
 */
export const CANONICAL_HUNT_SESSIONS: HuntSession[] = [
  {
    id: "hunt-sess-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    title: "Investigation into Cobalt Strike C2 Campaign",
    hypothesis: "Suspected external beaconing originating from Finance subnet to known threat actor IP 185.220.101.5.",
    hunt_type: "ioc",
    query: "185.220.101.5",
    status: "active",
    analyst_name: "Senior SOC Hunter",
    findings_count: 8,
    metadata: {
      tags: ["CobaltStrike", "C2", "FinanceSubnet"],
      priority: "critical",
    },
    created_at: "2026-09-18T10:00:00.000Z",
    updated_at: "2026-09-18T14:30:00.000Z",
  },
  {
    id: "hunt-sess-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    title: "LSASS Access Audit on Domain Controller",
    hypothesis: "Verify whether Mimikatz execution occurred on DC-CORP-001 during scheduled maintenance window.",
    hunt_type: "process",
    query: "lsass.exe",
    status: "completed",
    analyst_name: "Lead Responder",
    findings_count: 5,
    metadata: {
      tags: ["CredentialAccess", "LSASS", "DC"],
      priority: "high",
    },
    created_at: "2026-09-17T11:15:00.000Z",
    updated_at: "2026-09-17T16:45:00.000Z",
  },
];

/**
 * Canonical Sample Evidence Items
 */
export const CANONICAL_HUNT_EVIDENCE: HuntEvidence[] = [
  {
    id: "evid-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    hunt_id: "hunt-sess-001",
    target_type: "ioc",
    target_id: "ioc-ip-001",
    summary: "Observed outbound socket connection to C2 IP 185.220.101.5:443 from powershell.exe (PID 4820)",
    description: "Network telemetry confirms TCP handshake followed by continuous 45s heartbeat intervals characteristic of Cobalt Strike beaconing.",
    confidence: 95,
    added_by: "Senior SOC Hunter",
    created_at: "2026-09-18T10:15:00.000Z",
  },
  {
    id: "evid-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    hunt_id: "hunt-sess-001",
    target_type: "alert",
    target_id: "alert-001",
    summary: "Correlated Detection Alert: Suspicious Cobalt Strike C2 Traffic Detected",
    description: "Sigma detection rule SIGMA-NET-002 triggered with critical severity on network perimeter firewall.",
    confidence: 90,
    added_by: "Senior SOC Hunter",
    created_at: "2026-09-18T10:30:00.000Z",
  },
  {
    id: "evid-003",
    organization_id: "00000000-0000-0000-0000-000000000001",
    hunt_id: "hunt-sess-001",
    target_type: "process",
    target_id: "proc-4820",
    summary: "Process Execution: powershell.exe -NoP -NonI -W Hidden -Enc aQBmACgAJAB...",
    description: "Base64 encoded payload executed under compromised user account jsmith on WKSTN-FIN-004.",
    confidence: 95,
    added_by: "Senior SOC Hunter",
    created_at: "2026-09-18T11:00:00.000Z",
  },
];

/**
 * Canonical Sample Hunt Notes
 */
export const CANONICAL_HUNT_NOTES: HuntNote[] = [
  {
    id: "note-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    hunt_id: "hunt-sess-001",
    author_name: "Senior SOC Hunter",
    content: "Initial triage completed. Confirmed that host WKSTN-FIN-004 initiated beaconing at 08:15 UTC. Investigating initial access vector through email logs for user jsmith.",
    tags: ["Triage", "InitialAccess"],
    created_at: "2026-09-18T10:20:00.000Z",
    updated_at: "2026-09-18T10:20:00.000Z",
  },
  {
    id: "note-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    hunt_id: "hunt-sess-001",
    author_name: "Senior SOC Hunter",
    content: "Host isolation recommended. Host WKSTN-FIN-004 has attempted lateral SMB connection to DC-CORP-001 using cached administrator ticket.",
    tags: ["Containment", "LateralMovement"],
    created_at: "2026-09-18T11:45:00.000Z",
    updated_at: "2026-09-18T11:45:00.000Z",
  },
];
