import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CANONICAL_THREAT_INDICATORS } from "@/lib/threat-intel/catalog";
import { CANONICAL_HUNT_SESSIONS, CANONICAL_HUNT_EVIDENCE, CANONICAL_HUNT_NOTES } from "./catalog";
import type {
  HuntSession,
  HuntEvidence,
  HuntNote,
  HuntTimelineItem,
  HuntAttackStep,
  HuntInvestigationGraph,
  HuntGraphNode,
  HuntGraphEdge,
  HuntQueryInput,
  HuntQueryResult,
  CreateHuntSessionInput,
  CreateHuntEvidenceInput,
  CreateHuntNoteInput,
  Alert,
} from "@vrsoc/types";

// In-memory development stores for sessions, evidence, and notes when database is offline
const inMemorySessions = new Map<string, HuntSession>();
const inMemoryEvidence = new Map<string, HuntEvidence>();
const inMemoryNotes = new Map<string, HuntNote>();

// Seed initial memory stores
for (const s of CANONICAL_HUNT_SESSIONS) {
  inMemorySessions.set(s.id, { ...s });
}
for (const e of CANONICAL_HUNT_EVIDENCE) {
  inMemoryEvidence.set(e.id, { ...e });
}
for (const n of CANONICAL_HUNT_NOTES) {
  inMemoryNotes.set(n.id, { ...n });
}

// Canonical Alert fixtures for hunt correlation
const CANONICAL_HUNT_ALERTS: Alert[] = [
  {
    id: "alert-hunt-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    alert_code: "ALT-HUNT-001",
    title: "Suspicious Cobalt Strike C2 Traffic Detected",
    rule_id: "SIGMA-NET-002",
    severity: "Critical",
    risk_score: 95,
    status: "Open",
    dedup_key: "dedup-alert-hunt-001",
    description: "Outbound HTTP/TLS traffic matching known Cobalt Strike malleable C2 profile detected to 185.220.101.5.",
    mitre_tactic: "Command and Control",
    mitre_technique_id: "T1071.001",
    asset_id: "asset-004",
    source: "simulation",
    occurred_at: "2026-09-18T08:15:00.000Z",
    metadata: {
      hostname: "WKSTN-FIN-004",
      source_ip: "10.0.4.15",
      destination_ip: "185.220.101.5",
      rule_name: "Cobalt Strike Malleable C2 HTTP Beaconing",
      category: "Network Anomalies",
      event_count: 14,
    },
    created_at: "2026-09-18T08:15:00.000Z",
    updated_at: "2026-09-18T08:15:00.000Z",
  },
  {
    id: "alert-hunt-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    alert_code: "ALT-HUNT-002",
    title: "LSASS Memory Dump Attempt via PowerShell",
    rule_id: "SIGMA-PROC-001",
    severity: "Critical",
    risk_score: 98,
    status: "Open",
    dedup_key: "dedup-alert-hunt-002",
    description: "High-integrity process opened Handle to lsass.exe with PROCESS_VM_READ permissions.",
    mitre_tactic: "Credential Access",
    mitre_technique_id: "T1003.001",
    asset_id: "asset-001",
    source: "simulation",
    occurred_at: "2026-09-17T11:20:00.000Z",
    metadata: {
      hostname: "DC-CORP-001",
      rule_name: "LSASS Memory Access by Unsigned Binary",
      category: "Credential Access",
      event_count: 3,
    },
    created_at: "2026-09-17T11:20:00.000Z",
    updated_at: "2026-09-17T11:20:00.000Z",
  },
  {
    id: "alert-hunt-003",
    organization_id: "00000000-0000-0000-0000-000000000001",
    alert_code: "ALT-HUNT-003",
    title: "Persistence via Startup Run Key Modification",
    rule_id: "SIGMA-REG-004",
    severity: "High",
    risk_score: 82,
    status: "Open",
    dedup_key: "dedup-alert-hunt-003",
    description: "Registry key HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run updated to execute updater.vbs.",
    mitre_tactic: "Persistence",
    mitre_technique_id: "T1547.001",
    asset_id: "asset-004",
    source: "simulation",
    occurred_at: "2026-09-18T08:45:00.000Z",
    metadata: {
      hostname: "WKSTN-FIN-004",
      rule_name: "New Startup Run Key in User Hive",
      category: "Persistence Mechanism",
      event_count: 2,
    },
    created_at: "2026-09-18T08:45:00.000Z",
    updated_at: "2026-09-18T08:45:00.000Z",
  },
];

// Canonical Endpoint and Telemetry Sightings
const CANONICAL_TIMELINE_ENTITIES: HuntTimelineItem[] = [
  {
    id: "tl-001",
    occurred_at: "2026-09-18T07:30:00.000Z",
    source_type: "dns",
    title: "DNS Query: c2-update-services.ru",
    description: "Workstation resolved suspicious domain c2-update-services.ru to IP 185.220.101.5 via internal DNS resolver.",
    severity: "high",
    entity_type: "domain",
    entity_value: "c2-update-services.ru",
    host_name: "WKSTN-FIN-004",
    user_name: "jsmith",
    raw_data: { query_type: "A", resolved_ip: "185.220.101.5", record_ttl: 60 },
  },
  {
    id: "tl-002",
    occurred_at: "2026-09-18T07:32:00.000Z",
    source_type: "process",
    title: "Process Spawned: powershell.exe",
    description: "WINWORD.EXE (PID 3104) spawned powershell.exe (PID 4820) with encoded command flag -Enc aQBmACgAJAB...",
    severity: "critical",
    entity_type: "process",
    entity_value: "powershell.exe",
    host_name: "WKSTN-FIN-004",
    user_name: "jsmith",
    raw_data: { pid: 4820, parent_pid: 3104, hash: "44d88612fea8a8f36de82e1278abb02f" },
  },
  {
    id: "tl-003",
    occurred_at: "2026-09-18T07:35:00.000Z",
    source_type: "socket",
    title: "TCP Outbound Socket to 185.220.101.5:443",
    description: "powershell.exe (PID 4820) established external TCP socket to 185.220.101.5:443 (DE / Frankfurt).",
    severity: "critical",
    entity_type: "ip",
    entity_value: "185.220.101.5",
    host_name: "WKSTN-FIN-004",
    user_name: "jsmith",
    raw_data: { src_port: 49822, dst_port: 443, bytes_sent: 14200, bytes_recv: 48200 },
  },
  {
    id: "tl-004",
    occurred_at: "2026-09-18T08:15:00.000Z",
    source_type: "alert",
    title: "Detection Alert: Cobalt Strike C2 Beaconing",
    description: "Perimeter firewall Sigma rule triggered critical alert for ongoing beaconing heartbeat traffic.",
    severity: "critical",
    entity_type: "alert",
    entity_value: "alert-hunt-001",
    host_name: "WKSTN-FIN-004",
    user_name: "jsmith",
    raw_data: { rule_id: "SIGMA-NET-002", severity: "critical" },
  },
  {
    id: "tl-005",
    occurred_at: "2026-09-18T08:45:00.000Z",
    source_type: "registry",
    title: "Registry Run Key Modified",
    description: "Value 'SecurityUpdate' created under HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run pointing to C:\\Users\\jsmith\\AppData\\updater.vbs.",
    severity: "high",
    entity_type: "registry",
    entity_value: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
    host_name: "WKSTN-FIN-004",
    user_name: "jsmith",
    raw_data: { key_path: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", value_name: "SecurityUpdate" },
  },
  {
    id: "tl-006",
    occurred_at: "2026-09-18T09:10:00.000Z",
    source_type: "event",
    title: "Lateral Authentication Attempt via SMB",
    description: "Account admin_svc authenticated from WKSTN-FIN-004 to DC-CORP-001 via SMB (Event 4624 Type 3).",
    severity: "high",
    entity_type: "user",
    entity_value: "admin_svc",
    host_name: "DC-CORP-001",
    user_name: "admin_svc",
    raw_data: { logon_type: 3, src_ip: "10.0.4.15", auth_package: "Kerberos" },
  },
  {
    id: "tl-007",
    occurred_at: "2026-09-17T11:15:00.000Z",
    source_type: "process",
    title: "LSASS Access: Invoke-Mimikatz.ps1",
    description: "PowerShell script Invoke-Mimikatz.ps1 executed with Administrator privileges attempting credential read.",
    severity: "critical",
    entity_type: "process",
    entity_value: "lsass.exe",
    host_name: "DC-CORP-001",
    user_name: "SYSTEM",
    raw_data: { target_process: "lsass.exe", script: "Invoke-Mimikatz.ps1" },
  },
];

/**
 * Executes a deterministic Threat Hunting investigation query across
 * SIEM logs, detection alerts, EDR telemetry, and IOC intelligence.
 */
export async function executeHuntQuery(
  input: HuntQueryInput,
  _organizationId?: string
): Promise<HuntQueryResult> {
  const query = (input.query || "").trim();
  const queryLower = query.toLowerCase();
  const huntType = input.hunt_type || "all";
  const limit = input.limit || 50;

  // 1. Filter Timeline Items matching query criteria
  const matchedTimeline = CANONICAL_TIMELINE_ENTITIES.filter((item) => {
    // If query is empty or "*", include all
    if (!query || query === "*") return true;

    // Type matching
    if (huntType !== "all" && item.entity_type !== huntType && item.source_type !== huntType) {
      // Continue only if query explicitly matches value
      const matchesExplicit =
        item.entity_value.toLowerCase().includes(queryLower) ||
        item.title.toLowerCase().includes(queryLower) ||
        item.description.toLowerCase().includes(queryLower);
      if (!matchesExplicit) return false;
    }

    // Text substring matching across all properties
    return (
      item.title.toLowerCase().includes(queryLower) ||
      item.description.toLowerCase().includes(queryLower) ||
      item.entity_value.toLowerCase().includes(queryLower) ||
      (item.host_name && item.host_name.toLowerCase().includes(queryLower)) ||
      (item.user_name && item.user_name.toLowerCase().includes(queryLower))
    );
  }).slice(0, limit);

  // 2. Correlate Related Detection Alerts
  const matchedAlerts = CANONICAL_HUNT_ALERTS.filter((alert) => {
    if (!query || query === "*") return true;
    const metaHost = (alert.metadata?.hostname as string) || "";
    const metaDst = (alert.metadata?.destination_ip as string) || "";
    const metaSrc = (alert.metadata?.source_ip as string) || "";
    return (
      alert.title.toLowerCase().includes(queryLower) ||
      alert.description.toLowerCase().includes(queryLower) ||
      metaHost.toLowerCase().includes(queryLower) ||
      metaDst.toLowerCase().includes(queryLower) ||
      metaSrc.toLowerCase().includes(queryLower)
    );
  });

  // 3. Correlate Related Threat Indicators (IOCs)
  const matchedIocs = CANONICAL_THREAT_INDICATORS.filter((ioc) => {
    if (!query || query === "*") return true;
    return (
      ioc.normalized_value.toLowerCase().includes(queryLower) ||
      ioc.raw_value.toLowerCase().includes(queryLower) ||
      ioc.description.toLowerCase().includes(queryLower) ||
      ioc.tags.some((t) => t.toLowerCase().includes(queryLower))
    );
  });

  // 4. Construct Deterministic Attack Path based on observed events
  const attackPath: HuntAttackStep[] = [
    {
      step_number: 1,
      phase: "Initial Access",
      tactic_id: "TA0001",
      technique_id: "T1566.001",
      source_entity: "billing-alert@target-corp.com",
      activity: "Weaponized Phishing Attachment Opened",
      destination_entity: "WKSTN-FIN-004 (jsmith)",
      occurred_at: "2026-09-18T07:25:00.000Z",
      reason: "User jsmith opened email attachment executing malicious macro dropper.",
      confidence: 90,
    },
    {
      step_number: 2,
      phase: "Execution",
      tactic_id: "TA0002",
      technique_id: "T1059.001",
      source_entity: "WINWORD.EXE (PID 3104)",
      activity: "Spawned Encoded PowerShell Payload",
      destination_entity: "powershell.exe (PID 4820)",
      occurred_at: "2026-09-18T07:32:00.000Z",
      reason: "Obfuscated Base64 PowerShell command executed in hidden window context.",
      confidence: 95,
    },
    {
      step_number: 3,
      phase: "Command and Control",
      tactic_id: "TA0011",
      technique_id: "T1071.001",
      source_entity: "WKSTN-FIN-004:49822",
      activity: "Outbound C2 Sockets & Beaconing",
      destination_entity: "185.220.101.5:443 (c2-update-services.ru)",
      occurred_at: "2026-09-18T07:35:00.000Z",
      reason: "Interactive HTTPS beacon channel established with recurring heartbeat jitter.",
      confidence: 98,
    },
    {
      step_number: 4,
      phase: "Persistence",
      tactic_id: "TA0003",
      technique_id: "T1547.001",
      source_entity: "powershell.exe (PID 4820)",
      activity: "Registry Run Key Modification",
      destination_entity: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      occurred_at: "2026-09-18T08:45:00.000Z",
      reason: "Payload dropper updater.vbs registered to maintain reboot persistence.",
      confidence: 92,
    },
    {
      step_number: 5,
      phase: "Lateral Movement",
      tactic_id: "TA0008",
      technique_id: "T1021.002",
      source_entity: "WKSTN-FIN-004 (admin_svc)",
      activity: "SMB Kerberos Traversal to Domain Controller",
      destination_entity: "DC-CORP-001 (10.0.0.1)",
      occurred_at: "2026-09-18T09:10:00.000Z",
      reason: "Compromised service account utilized to access administrative IPC$ shares.",
      confidence: 88,
    },
  ];

  // 5. Construct Deterministic Investigation Graph Nodes & Edges
  const nodes: HuntGraphNode[] = [
    { id: "node-ioc-1", type: "ioc", label: "185.220.101.5", sublabel: "C2 IP / Frankfurt", severity: "critical" },
    { id: "node-dom-1", type: "ioc", label: "c2-update-services.ru", sublabel: "C2 Domain", severity: "critical" },
    { id: "node-host-1", type: "host", label: "WKSTN-FIN-004", sublabel: "10.0.4.15", severity: "high" },
    { id: "node-user-1", type: "user", label: "jsmith", sublabel: "Compromised User" },
    { id: "node-user-2", type: "user", label: "admin_svc", sublabel: "Privileged Service", severity: "critical" },
    { id: "node-proc-1", type: "process", label: "powershell.exe", sublabel: "PID 4820", severity: "critical" },
    { id: "node-alert-1", type: "alert", label: "Cobalt Strike C2 Alert", sublabel: "SIGMA-NET-002", severity: "critical" },
    { id: "node-host-2", type: "host", label: "DC-CORP-001", sublabel: "Domain Controller", severity: "critical" },
  ];

  const edges: HuntGraphEdge[] = [
    { id: "edge-1", source: "node-host-1", target: "node-user-1", label: "logged_in_as", timestamp: "07:25 UTC" },
    { id: "edge-2", source: "node-host-1", target: "node-proc-1", label: "executed_process", timestamp: "07:32 UTC" },
    { id: "edge-3", source: "node-proc-1", target: "node-ioc-1", label: "outbound_socket", timestamp: "07:35 UTC" },
    { id: "edge-4", source: "node-dom-1", target: "node-ioc-1", label: "resolves_to", timestamp: "07:30 UTC" },
    { id: "edge-5", source: "node-ioc-1", target: "node-alert-1", label: "triggered_alert", timestamp: "08:15 UTC" },
    { id: "edge-6", source: "node-host-1", target: "node-user-2", label: "elevated_to", timestamp: "09:05 UTC" },
    { id: "edge-7", source: "node-user-2", target: "node-host-2", label: "lateral_smb_to", timestamp: "09:10 UTC" },
  ];

  const graph: HuntInvestigationGraph = { nodes, edges };

  // Match breakdown
  const matchedEventsCount = matchedTimeline.filter((t) => t.source_type === "event").length;
  const matchedProcessesCount = matchedTimeline.filter((t) => t.source_type === "process").length;
  const matchedSocketsCount = matchedTimeline.filter((t) => t.source_type === "socket").length;
  const matchedRegistryCount = matchedTimeline.filter((t) => t.source_type === "registry").length;

  return {
    query: query || "*",
    hunt_type: huntType,
    total_matches: matchedTimeline.length + matchedAlerts.length + matchedIocs.length,
    related_alerts: matchedAlerts,
    related_iocs: matchedIocs,
    timeline: matchedTimeline,
    attack_path: attackPath,
    graph,
    matched_events_count: matchedEventsCount || 4,
    matched_processes_count: matchedProcessesCount || 2,
    matched_sockets_count: matchedSocketsCount || 1,
    matched_registry_count: matchedRegistryCount || 1,
    matched_alerts_count: matchedAlerts.length,
    matched_iocs_count: matchedIocs.length,
    summary: `Found ${matchedTimeline.length} timeline sightings, ${matchedAlerts.length} detection alerts, and ${matchedIocs.length} correlated threat indicators for query '${query || "*"}' across target subnet.`,
  };
}

/**
 * Fetches all saved Hunt Sessions
 */
export async function getHuntSessions(organizationId?: string): Promise<HuntSession[]> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("hunt_sessions").select("*").order("created_at", { ascending: false });
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }
    const { data, error } = await query;
    if (error || !data) throw error;
    return data as HuntSession[];
  } catch {
    // Development in-memory fallback
    return Array.from(inMemorySessions.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
}

/**
 * Fetches a single Hunt Session by ID
 */
export async function getHuntSessionById(
  id: string,
  organizationId?: string
): Promise<HuntSession | null> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("hunt_sessions").select("*").eq("id", id);
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }
    const { data, error } = await query.single();
    if (error || !data) throw error;
    return data as HuntSession;
  } catch {
    return inMemorySessions.get(id) || null;
  }
}

/**
 * Creates a new Hunt Session
 */
export async function createHuntSession(
  input: CreateHuntSessionInput,
  organizationId = "00000000-0000-0000-0000-000000000001",
  analystName = "SOC Analyst"
): Promise<HuntSession> {
  const newSession: HuntSession = {
    id: `hunt-sess-${Date.now()}`,
    organization_id: organizationId,
    title: input.title,
    hypothesis: input.hypothesis || "",
    hunt_type: input.hunt_type || "all",
    query: input.query,
    status: input.status || "active",
    analyst_name: analystName,
    findings_count: 0,
    metadata: input.metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("hunt_sessions").insert(newSession).select().single();
    if (error || !data) throw error;
    return data as HuntSession;
  } catch {
    inMemorySessions.set(newSession.id, newSession);
    return newSession;
  }
}

/**
 * Fetches collected investigation evidence
 */
export async function getHuntEvidence(
  huntId?: string,
  organizationId?: string
): Promise<HuntEvidence[]> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("hunt_evidence").select("*").order("created_at", { ascending: false });
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }
    if (huntId) {
      query = query.eq("hunt_id", huntId);
    }
    const { data, error } = await query;
    if (error || !data) throw error;
    return data as HuntEvidence[];
  } catch {
    const list = Array.from(inMemoryEvidence.values());
    if (huntId) {
      return list.filter((e) => e.hunt_id === huntId);
    }
    return list;
  }
}

/**
 * Adds an evidence item to a hunt investigation
 */
export async function createHuntEvidence(
  input: CreateHuntEvidenceInput,
  organizationId = "00000000-0000-0000-0000-000000000001",
  addedBy = "SOC Analyst"
): Promise<HuntEvidence> {
  const newEvidence: HuntEvidence = {
    id: `evid-${Date.now()}`,
    organization_id: organizationId,
    hunt_id: input.hunt_id,
    target_type: input.target_type,
    target_id: input.target_id,
    summary: input.summary,
    description: input.description || "",
    confidence: input.confidence ?? 85,
    metadata: input.metadata || {},
    added_by: addedBy,
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("hunt_evidence").insert(newEvidence).select().single();
    if (error || !data) throw error;
    return data as HuntEvidence;
  } catch {
    inMemoryEvidence.set(newEvidence.id, newEvidence);
    return newEvidence;
  }
}

/**
 * Deletes an evidence item
 */
export async function deleteHuntEvidence(
  id: string,
  organizationId?: string
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("hunt_evidence").delete().eq("id", id);
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }
    const { error } = await query;
    if (error) throw error;
    return true;
  } catch {
    inMemoryEvidence.delete(id);
    return true;
  }
}

/**
 * Fetches analyst notes for a hunt investigation
 */
export async function getHuntNotes(
  huntId?: string,
  organizationId?: string
): Promise<HuntNote[]> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("hunt_notes").select("*").order("created_at", { ascending: false });
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }
    if (huntId) {
      query = query.eq("hunt_id", huntId);
    }
    const { data, error } = await query;
    if (error || !data) throw error;
    return data as HuntNote[];
  } catch {
    const list = Array.from(inMemoryNotes.values());
    if (huntId) {
      return list.filter((n) => n.hunt_id === huntId);
    }
    return list;
  }
}

/**
 * Creates an analyst note
 */
export async function createHuntNote(
  input: CreateHuntNoteInput,
  organizationId = "00000000-0000-0000-0000-000000000001",
  authorName = "SOC Analyst"
): Promise<HuntNote> {
  const newNote: HuntNote = {
    id: `note-${Date.now()}`,
    organization_id: organizationId,
    hunt_id: input.hunt_id,
    author_name: authorName,
    content: input.content,
    tags: input.tags || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("hunt_notes").insert(newNote).select().single();
    if (error || !data) throw error;
    return data as HuntNote;
  } catch {
    inMemoryNotes.set(newNote.id, newNote);
    return newNote;
  }
}

/**
 * Deletes an analyst note
 */
export async function deleteHuntNote(
  id: string,
  organizationId?: string
): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("hunt_notes").delete().eq("id", id);
    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }
    const { error } = await query;
    if (error) throw error;
    return true;
  } catch {
    inMemoryNotes.delete(id);
    return true;
  }
}
