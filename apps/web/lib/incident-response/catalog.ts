import type {
  Incident,
  IncidentStage,
  IncidentPlaybook,
  IncidentTask,
  IncidentHistoryItem,
  IncidentEvidence,
  IncidentNote,
  IncidentOverviewStats,
} from "@vrsoc/types";

// ==============================================================================
// Incident Lifecycle State Machine Rules & Order
// ==============================================================================

export const STAGE_LIFECYCLE_ORDER: IncidentStage[] = [
  "Detection",
  "Analysis",
  "Containment",
  "Eradication",
  "Recovery",
  "Lessons Learned",
  "Closed",
];

export const VALID_STAGE_TRANSITIONS: Record<IncidentStage, IncidentStage[]> = {
  Detection: ["Analysis", "Containment", "Closed"],
  Analysis: ["Containment", "Detection", "Closed"],
  Containment: ["Eradication", "Analysis", "Closed"],
  Eradication: ["Recovery", "Containment", "Closed"],
  Recovery: ["Lessons Learned", "Eradication", "Closed"],
  "Lessons Learned": ["Closed", "Recovery"],
  Closed: ["Lessons Learned", "Analysis"], // Reopening for post-incident review
};

export function isValidStageTransition(currentStage: IncidentStage, nextStage: IncidentStage): boolean {
  if (currentStage === nextStage) return true;
  const allowed = VALID_STAGE_TRANSITIONS[currentStage];
  return allowed ? allowed.includes(nextStage) : false;
}

// ==============================================================================
// Canonical Incident Response Playbooks (Defensive & Educational)
// ==============================================================================

export const CANONICAL_PLAYBOOKS: IncidentPlaybook[] = [
  {
    id: "PB-MAL-001",
    name: "Malware Outbreak & C2 Beaconing Response",
    description: "Standard operating procedure for detecting, containing, and eradicating malware outbreaks and interactive C2 channels.",
    category: "Malware Outbreak",
    mitre_techniques: ["T1059.001", "T1071.001", "T1547.001", "T1566.001"],
    default_tasks: [
      {
        id: "task-pb-1",
        stage: "Detection",
        title: "Verify Detection Telemetry & Initial Alert Fidelity",
        description: "Inspect triggering Sigma rule matches, parent-child process relationships, and network socket indicators.",
        order_index: 1,
      },
      {
        id: "task-pb-2",
        stage: "Analysis",
        title: "Identify Patient Zero & Execution Mechanism",
        description: "Analyze workstation telemetry to determine initial dropper path, phishing vector, and user context.",
        order_index: 2,
      },
      {
        id: "task-pb-3",
        stage: "Containment",
        title: "Isolate Compromised Endpoints & Block C2 Sockets",
        description: "Apply network isolation to affected workstation and add outbound C2 IP/domain block rules at the perimeter.",
        order_index: 3,
      },
      {
        id: "task-pb-4",
        stage: "Eradication",
        title: "Terminate Malicious Processes & Remove Persistence",
        description: "Kill rogue PowerShell/beacon processes, clean Registry Run keys, and purge dropper files from temporary folders.",
        order_index: 4,
      },
      {
        id: "task-pb-5",
        stage: "Recovery",
        title: "Verify System Cleanliness & Restore Network Connectivity",
        description: "Run full endpoint telemetry scans, verify cessation of beaconing, and restore network adapters to active state.",
        order_index: 5,
      },
      {
        id: "task-pb-6",
        stage: "Lessons Learned",
        title: "Post-Incident Review & Detection Rule Tuning",
        description: "Document attack timeline, tune Sigma detection rules for earlier execution catch, and update threat indicator feeds.",
        order_index: 6,
      },
    ],
    is_active: true,
    created_at: "2026-09-18T00:00:00.000Z",
    updated_at: "2026-09-18T00:00:00.000Z",
  },
  {
    id: "PB-RAN-002",
    name: "Ransomware Defense & Rapid Containment",
    description: "Emergency playbook for active ransomware infections, mass encryption behavior, and shadow copy deletion.",
    category: "Ransomware & Destruction",
    mitre_techniques: ["T1486", "T1490", "T1021.002", "T1003.001"],
    default_tasks: [
      {
        id: "task-pb-7",
        stage: "Detection",
        title: "Confirm Mass File Encryption Indicators",
        description: "Identify high-rate file rename/write events and vssadmin shadow copy deletion activity.",
        order_index: 1,
      },
      {
        id: "task-pb-8",
        stage: "Analysis",
        title: "Determine Scope of Lateral Spread",
        description: "Inspect SMB, RDP, and WMI connections originating from suspicious hosts across all subnets.",
        order_index: 2,
      },
      {
        id: "task-pb-9",
        stage: "Containment",
        title: "Sever SMB Shares & Segment Critical Storage",
        description: "Immediately isolate file servers, disconnect unencrypted backup repositories, and isolate patient zero.",
        order_index: 3,
      },
      {
        id: "task-pb-10",
        stage: "Eradication",
        title: "Identify Ransomware Binaries & Kill Encryption Threads",
        description: "Extract payload hashes, terminate malicious parent processes, and disable compromised Active Directory accounts.",
        order_index: 4,
      },
      {
        id: "task-pb-11",
        stage: "Recovery",
        title: "Validate Backup Integrity & Phased Restoration",
        description: "Restore critical systems from verified offline snapshots under isolated staging networks.",
        order_index: 5,
      },
      {
        id: "task-pb-12",
        stage: "Lessons Learned",
        title: "Ransomware Post-Mortem & Defense Hardening",
        description: "Audit backup recovery SLAs, evaluate EDR block effectiveness, and patch ingress vulnerabilities.",
        order_index: 6,
      },
    ],
    is_active: true,
    created_at: "2026-09-18T00:00:00.000Z",
    updated_at: "2026-09-18T00:00:00.000Z",
  },
  {
    id: "PB-CRED-003",
    name: "Credential Harvesting & Lateral Movement",
    description: "Response procedure for LSASS memory dumps, DCSync attacks, and unauthorized administrative traversal.",
    category: "Credential Access",
    mitre_techniques: ["T1003.001", "T1078", "T1021.002"],
    default_tasks: [
      {
        id: "task-pb-13",
        stage: "Detection",
        title: "Validate LSASS Handle or DCSync Telemetry",
        description: "Inspect process memory access events against lsass.exe and RPC directory replication traffic.",
        order_index: 1,
      },
      {
        id: "task-pb-14",
        stage: "Analysis",
        title: "Enumerate Compromised Kerberos/NTLM Identities",
        description: "Identify all accounts logged into affected hosts during the compromise window.",
        order_index: 2,
      },
      {
        id: "task-pb-15",
        stage: "Containment",
        title: "Force Global Password Resets & Revoke Kerberos Tickets",
        description: "Reset passwords for compromised domain accounts and invalidate active Kerberos TGT tickets.",
        order_index: 3,
      },
      {
        id: "task-pb-16",
        stage: "Eradication",
        title: "Purge Credential Dump Utilities & Invalidate Tokens",
        description: "Remove Procdump/Mimikatz artifacts and terminate unauthorized remote sessions.",
        order_index: 4,
      },
      {
        id: "task-pb-17",
        stage: "Recovery",
        title: "Re-enable Accounts with Enforced MFA",
        description: "Restore access with mandatory hardware MFA token registration and privileged workstation access.",
        order_index: 5,
      },
      {
        id: "task-pb-18",
        stage: "Lessons Learned",
        title: "Privileged Identity Hardening Review",
        description: "Review Tier-0 administrative boundaries, enable Credential Guard, and review service account permissions.",
        order_index: 6,
      },
    ],
    is_active: true,
    created_at: "2026-09-18T00:00:00.000Z",
    updated_at: "2026-09-18T00:00:00.000Z",
  },
];

// ==============================================================================
// Canonical Seed Incidents (Tenant: 00000000-0000-0000-0000-000000000001)
// ==============================================================================

export const CANONICAL_INCIDENTS: Incident[] = [
  {
    id: "inc-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_code: "INC-2026-001",
    title: "Active Cobalt Strike C2 Outbreak on Finance Subnet",
    description: "Outbound HTTP/TLS malleable C2 beaconing detected from WKSTN-FIN-004 to known adversary IP 185.220.101.5 following malicious phishing document execution.",
    summary: "Workstation WKSTN-FIN-004 compromised via email macro attachment; interactive C2 channel established with persistence via HKCU Startup Run key.",
    severity: "Critical",
    priority: "P1",
    stage: "Containment",
    status: "In Progress",
    source_alert_id: "alert-hunt-001",
    source_alert_ids: ["alert-hunt-001", "alert-hunt-003"],
    assigned_to: "00000000-0000-0000-0000-000000000002",
    assignee_name: "Alex Mercer (Incident Lead)",
    lead_responder_name: "Alex Mercer",
    affected_assets: ["WKSTN-FIN-004"],
    affected_identities: ["jsmith@target-corp.com"],
    mitre_tactics: ["Initial Access", "Execution", "Command and Control", "Persistence"],
    mitre_techniques: ["T1566.001", "T1059.001", "T1071.001", "T1547.001"],
    playbook_id: "PB-MAL-001",
    playbook_name: "Malware Outbreak & C2 Beaconing Response",
    stage_timestamps: {
      Detection: "2026-09-18T08:15:00.000Z",
      Analysis: "2026-09-18T08:30:00.000Z",
      Containment: "2026-09-18T08:45:00.000Z",
    },
    declared_at: "2026-09-18T08:20:00.000Z",
    created_at: "2026-09-18T08:20:00.000Z",
    updated_at: "2026-09-18T08:50:00.000Z",
    tasks_total: 6,
    tasks_completed: 2,
    evidence_count: 3,
    notes_count: 2,
  },
  {
    id: "inc-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_code: "INC-2026-002",
    title: "Domain Controller LSASS Memory Access & DCSync",
    description: "High-integrity process opened handle to lsass.exe on primary domain controller DC-CORP-001 with PROCESS_VM_READ rights.",
    summary: "Suspicious credential extraction attempt detected against core Domain Controller. Potential Tier-0 administrative compromise.",
    severity: "Critical",
    priority: "P1",
    stage: "Analysis",
    status: "Open",
    source_alert_id: "alert-hunt-002",
    source_alert_ids: ["alert-hunt-002"],
    assigned_to: "00000000-0000-0000-0000-000000000003",
    assignee_name: "Elena Rostova (SOC Analyst)",
    lead_responder_name: "Elena Rostova",
    affected_assets: ["DC-CORP-001"],
    affected_identities: ["svc_backup_admin", "krbtgt"],
    mitre_tactics: ["Credential Access", "Privilege Escalation"],
    mitre_techniques: ["T1003.001", "T1078"],
    playbook_id: "PB-CRED-003",
    playbook_name: "Credential Harvesting & Lateral Movement",
    stage_timestamps: {
      Detection: "2026-09-17T11:20:00.000Z",
      Analysis: "2026-09-17T11:35:00.000Z",
    },
    declared_at: "2026-09-17T11:25:00.000Z",
    created_at: "2026-09-17T11:25:00.000Z",
    updated_at: "2026-09-17T11:40:00.000Z",
    tasks_total: 6,
    tasks_completed: 1,
    evidence_count: 2,
    notes_count: 1,
  },
  {
    id: "inc-003",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_code: "INC-2026-003",
    title: "Rogue Registry Run Key Persistence on Workstation",
    description: "Startup Run key HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run modified to trigger updater.vbs dropper on login.",
    summary: "Persistence mechanism installed on WKSTN-FIN-004. Eradicated and verified in post-incident review.",
    severity: "High",
    priority: "P2",
    stage: "Closed",
    status: "Closed",
    source_alert_id: "alert-hunt-003",
    source_alert_ids: ["alert-hunt-003"],
    assigned_to: "00000000-0000-0000-0000-000000000002",
    assignee_name: "Alex Mercer (Incident Lead)",
    lead_responder_name: "Alex Mercer",
    affected_assets: ["WKSTN-FIN-004"],
    affected_identities: ["jsmith@target-corp.com"],
    mitre_tactics: ["Persistence"],
    mitre_techniques: ["T1547.001"],
    playbook_id: "PB-MAL-001",
    playbook_name: "Malware Outbreak & C2 Beaconing Response",
    stage_timestamps: {
      Detection: "2026-09-16T14:00:00.000Z",
      Analysis: "2026-09-16T14:15:00.000Z",
      Containment: "2026-09-16T14:30:00.000Z",
      Eradication: "2026-09-16T15:00:00.000Z",
      Recovery: "2026-09-16T15:30:00.000Z",
      "Lessons Learned": "2026-09-16T16:00:00.000Z",
      Closed: "2026-09-16T16:30:00.000Z",
    },
    declared_at: "2026-09-16T14:05:00.000Z",
    closed_at: "2026-09-16T16:30:00.000Z",
    closure_reason: "Remediation verified. Registry key removed, dropper file purged, and Sigma rule coverage updated.",
    closure_notes: "Endpoint re-scanned and confirmed clean. No secondary droppers identified.",
    created_at: "2026-09-16T14:05:00.000Z",
    updated_at: "2026-09-16T16:30:00.000Z",
    tasks_total: 6,
    tasks_completed: 6,
    evidence_count: 2,
    notes_count: 3,
  },
];

// ==============================================================================
// Canonical Incident Tasks
// ==============================================================================

export const CANONICAL_INCIDENT_TASKS: IncidentTask[] = [
  {
    id: "task-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    playbook_id: "PB-MAL-001",
    stage: "Detection",
    title: "Verify Detection Telemetry & Initial Alert Fidelity",
    description: "Inspect triggering Sigma rule matches, parent-child process relationships, and network socket indicators.",
    status: "completed",
    order_index: 1,
    assigned_to: "Alex Mercer",
    completed_at: "2026-09-18T08:25:00.000Z",
    completed_by: "Alex Mercer",
    notes: "Verified Sigma alert SIGMA-NET-002 HTTP Beaconing matches known Cobalt Strike profile.",
    created_at: "2026-09-18T08:20:00.000Z",
    updated_at: "2026-09-18T08:25:00.000Z",
  },
  {
    id: "task-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    playbook_id: "PB-MAL-001",
    stage: "Analysis",
    title: "Identify Patient Zero & Execution Mechanism",
    description: "Analyze workstation telemetry to determine initial dropper path, phishing vector, and user context.",
    status: "completed",
    order_index: 2,
    assigned_to: "Alex Mercer",
    completed_at: "2026-09-18T08:40:00.000Z",
    completed_by: "Alex Mercer",
    notes: "Patient zero confirmed as WKSTN-FIN-004 (user jsmith). Phishing attachment Invoice_Sep2026.docm executed powershell.exe dropper.",
    created_at: "2026-09-18T08:20:00.000Z",
    updated_at: "2026-09-18T08:40:00.000Z",
  },
  {
    id: "task-003",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    playbook_id: "PB-MAL-001",
    stage: "Containment",
    title: "Isolate Compromised Endpoints & Block C2 Sockets",
    description: "Apply network isolation to affected workstation and add outbound C2 IP/domain block rules at the perimeter.",
    status: "in_progress",
    order_index: 3,
    assigned_to: "Alex Mercer",
    created_at: "2026-09-18T08:20:00.000Z",
    updated_at: "2026-09-18T08:45:00.000Z",
  },
  {
    id: "task-004",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    playbook_id: "PB-MAL-001",
    stage: "Eradication",
    title: "Terminate Malicious Processes & Remove Persistence",
    description: "Kill rogue PowerShell/beacon processes, clean Registry Run keys, and purge dropper files from temporary folders.",
    status: "pending",
    order_index: 4,
    assigned_to: "Elena Rostova",
    created_at: "2026-09-18T08:20:00.000Z",
    updated_at: "2026-09-18T08:20:00.000Z",
  },
  {
    id: "task-005",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    playbook_id: "PB-MAL-001",
    stage: "Recovery",
    title: "Verify System Cleanliness & Restore Network Connectivity",
    description: "Run full endpoint telemetry scans, verify cessation of beaconing, and restore network adapters to active state.",
    status: "pending",
    order_index: 5,
    created_at: "2026-09-18T08:20:00.000Z",
    updated_at: "2026-09-18T08:20:00.000Z",
  },
  {
    id: "task-006",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    playbook_id: "PB-MAL-001",
    stage: "Lessons Learned",
    title: "Post-Incident Review & Detection Rule Tuning",
    description: "Document attack timeline, tune Sigma detection rules for earlier execution catch, and update threat indicator feeds.",
    status: "pending",
    order_index: 6,
    created_at: "2026-09-18T08:20:00.000Z",
    updated_at: "2026-09-18T08:20:00.000Z",
  },
];

// ==============================================================================
// Canonical Incident History Items (State Machine Audit Trail)
// ==============================================================================

export const CANONICAL_INCIDENT_HISTORY: IncidentHistoryItem[] = [
  {
    id: "hist-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    actor_name: "Alex Mercer",
    action_type: "declared",
    previous_stage: null,
    new_stage: "Detection",
    rationale: "Incident declared following correlation of Cobalt Strike C2 beaconing with phishing document execution.",
    created_at: "2026-09-18T08:20:00.000Z",
  },
  {
    id: "hist-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    actor_name: "Alex Mercer",
    action_type: "stage_transition",
    previous_stage: "Detection",
    new_stage: "Analysis",
    rationale: "Initial telemetry confirmed genuine high-fidelity adversary activity. Scope analysis initiated.",
    created_at: "2026-09-18T08:30:00.000Z",
  },
  {
    id: "hist-003",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    actor_name: "Alex Mercer",
    action_type: "evidence_attached",
    rationale: "Attached C2 network socket evidence to 185.220.101.5:443.",
    created_at: "2026-09-18T08:35:00.000Z",
  },
  {
    id: "hist-004",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    actor_name: "Alex Mercer",
    action_type: "stage_transition",
    previous_stage: "Analysis",
    new_stage: "Containment",
    rationale: "Patient zero identified. Proceeding to host network isolation and perimeter firewall blocking.",
    created_at: "2026-09-18T08:45:00.000Z",
  },
];

// ==============================================================================
// Canonical Incident Evidence References
// ==============================================================================

export const CANONICAL_INCIDENT_EVIDENCE: IncidentEvidence[] = [
  {
    id: "inc-evid-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    target_type: "socket",
    target_id: "185.220.101.5:443",
    summary: "Outbound TLS Socket to Cobalt Strike C2 Server",
    description: "powershell.exe (PID 4820) established external TCP socket to 185.220.101.5:443 (DE / Frankfurt) with recurring 45s heartbeat jitter.",
    confidence: 98,
    metadata: { src_port: 49822, dst_port: 443, bytes_sent: 14200, bytes_recv: 48200 },
    added_by: "Alex Mercer",
    created_at: "2026-09-18T08:35:00.000Z",
  },
  {
    id: "inc-evid-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    target_type: "process",
    target_id: "PID-4820",
    summary: "Obfuscated PowerShell Process Spawned by WINWORD.EXE",
    description: "WINWORD.EXE (PID 3104) spawned powershell.exe (PID 4820) with Base64 encoded payload flag.",
    confidence: 95,
    metadata: { parent_process: "WINWORD.EXE", command_line: "powershell.exe -Enc aQBmACgAJAB..." },
    added_by: "Alex Mercer",
    created_at: "2026-09-18T08:36:00.000Z",
  },
  {
    id: "inc-evid-003",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    target_type: "registry",
    target_id: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater",
    summary: "Startup Run Key Dropper Persistence",
    description: "Payload dropper updater.vbs written to %APPDATA% and registered in user startup run hive.",
    confidence: 92,
    metadata: { value_name: "Updater", value_data: "wscript.exe C:\\Users\\jsmith\\AppData\\Local\\updater.vbs" },
    added_by: "Alex Mercer",
    created_at: "2026-09-18T08:48:00.000Z",
  },
];

// ==============================================================================
// Canonical Incident Notes
// ==============================================================================

export const CANONICAL_INCIDENT_NOTES: IncidentNote[] = [
  {
    id: "inc-note-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    author_name: "Alex Mercer",
    content: "Initial triage completed. Phishing vector confirmed from billing-alert@target-corp.com. User jsmith confirmed opening attachment at 07:25 UTC.",
    tags: ["Initial Triage", "Phishing", "Patient Zero"],
    created_at: "2026-09-18T08:32:00.000Z",
    updated_at: "2026-09-18T08:32:00.000Z",
  },
  {
    id: "inc-note-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    incident_id: "inc-001",
    author_name: "Elena Rostova",
    content: "Host WKSTN-FIN-004 network interface isolated via EDR agent. Perimeter firewall rule deployed to block 185.220.101.5 and domain c2-update-services.ru.",
    tags: ["Containment", "EDR Isolation", "Firewall Block"],
    created_at: "2026-09-18T08:48:00.000Z",
    updated_at: "2026-09-18T08:48:00.000Z",
  },
];

// ==============================================================================
// Helper Function: Compute KPI Stats
// ==============================================================================

export function calculateIncidentOverviewStats(incidents: Incident[]): IncidentOverviewStats {
  const total = incidents.length;
  const active = incidents.filter((i) => i.status !== "Closed" && i.status !== "closed").length;
  const criticalP1 = incidents.filter(
    (i) => (i.severity === "Critical" || i.severity === "critical") || i.priority === "P1"
  ).length;
  const inContainment = incidents.filter(
    (i) => i.stage === "Containment" || i.status === "Contained" || i.status === "contained"
  ).length;
  const resolvedToday = incidents.filter(
    (i) => i.stage === "Closed" || i.status === "Closed" || i.status === "closed"
  ).length;

  return {
    total_incidents: total,
    active_incidents: active,
    critical_p1: criticalP1,
    in_containment: inContainment,
    resolved_today: resolvedToday,
    avg_mttc_hours: 1.2,
    avg_mttr_hours: 3.5,
  };
}
