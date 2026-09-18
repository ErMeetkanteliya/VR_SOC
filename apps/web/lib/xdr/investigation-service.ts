/**
 * XDR Investigation Service
 *
 * Provides cross-source correlation querying, comprehensive investigation package compilation,
 * and unified chronological timeline generation across 8 distinct telemetry surfaces.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  XdrCorrelationResult,
  XdrInvestigationPackage,
  XdrTimelineItem,
  XdrFilterParams,
  XdrTelemetrySource,
  Asset,
  SocIdentity,
  Alert,
  DnsEvent,
  EmailEvent,
  CloudEvent,
  FirewallEvent,
  ProcessRecord,
  NetworkConnectionRecord,
  TelemetryEvent,
  LogRecord,
} from "@vrsoc/types";
import { correlateMultiSourceTelemetry } from "./correlation-engine";

export async function getXdrCorrelations(params: {
  organizationId: string;
  filters?: XdrFilterParams;
}): Promise<XdrCorrelationResult[]> {
  const supabase = await createServerSupabaseClient();

  // 1. Try querying persisted correlations
  const { data: dbCorrelations } = await supabase
    .from("xdr_correlations")
    .select("*")
    .eq("organization_id", params.organizationId)
    .order("created_at", { ascending: false });

  if (dbCorrelations && dbCorrelations.length > 0) {
    let filtered = dbCorrelations as unknown as XdrCorrelationResult[];

    if (params.filters?.query) {
      const q = params.filters.query.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.correlation_code.toLowerCase().includes(q) ||
          c.primary_entity_name.toLowerCase().includes(q)
      );
    }

    if (params.filters?.relationshipType && params.filters.relationshipType !== "ALL") {
      filtered = filtered.filter((c) => c.relationship_type === params.filters?.relationshipType);
    }

    if (params.filters?.minSeverity && params.filters.minSeverity !== "ALL") {
      filtered = filtered.filter((c) => c.severity === params.filters?.minSeverity);
    }

    return filtered;
  }

  // 2. Fallback: Query live domain records and run correlation engine
  const [
    { data: assets },
    { data: identities },
    { data: dnsEvents },
    { data: emailEvents },
    { data: cloudEvents },
    { data: firewallEvents },
    { data: processes },
    { data: networkConnections },
    { data: alerts },
    { data: events },
  ] = await Promise.all([
    supabase.from("assets").select("*").eq("organization_id", params.organizationId).limit(20),
    supabase.from("soc_identities").select("*").eq("organization_id", params.organizationId).limit(20),
    supabase.from("dns_events").select("*").eq("organization_id", params.organizationId).limit(50),
    supabase.from("email_events").select("*").eq("organization_id", params.organizationId).limit(50),
    supabase.from("cloud_events").select("*").eq("organization_id", params.organizationId).limit(50),
    supabase.from("firewall_events").select("*").eq("organization_id", params.organizationId).limit(50),
    supabase.from("processes").select("*").eq("organization_id", params.organizationId).limit(50),
    supabase.from("network_connections").select("*").eq("organization_id", params.organizationId).limit(50),
    supabase.from("alerts").select("*").eq("organization_id", params.organizationId).limit(20),
    supabase.from("events").select("*").eq("organization_id", params.organizationId).limit(100),
  ]);

  const liveDataset = {
    organizationId: params.organizationId,
    assets: (assets as Asset[]) || [],
    identities: (identities as SocIdentity[]) || [],
    dnsEvents: (dnsEvents as DnsEvent[]) || [],
    emailEvents: (emailEvents as EmailEvent[]) || [],
    cloudEvents: (cloudEvents as CloudEvent[]) || [],
    firewallEvents: (firewallEvents as FirewallEvent[]) || [],
    processes: (processes as ProcessRecord[]) || [],
    networkConnections: (networkConnections as NetworkConnectionRecord[]) || [],
    alerts: (alerts as Alert[]) || [],
    events: (events as TelemetryEvent[]) || [],
  };

  const correlated = correlateMultiSourceTelemetry(liveDataset);

  if (correlated.length > 0) {
    return correlated;
  }

  // 3. Built-in Deterministic Demo Correlations if workspace has not been populated
  return generateDemoCorrelations(params.organizationId);
}

/**
 * Compiles a deep XDR investigation package for a given correlation ID.
 */
export async function getXdrInvestigationPackage(params: {
  organizationId: string;
  correlationId: string;
  filters?: XdrFilterParams;
}): Promise<XdrInvestigationPackage> {
  const correlations = await getXdrCorrelations({
    organizationId: params.organizationId,
    filters: params.filters,
  });

  const correlation =
    correlations.find((c) => c.id === params.correlationId || c.correlation_code === params.correlationId) ||
    correlations[0] ||
    generateDemoCorrelations(params.organizationId)[0]!;

  const supabase = await createServerSupabaseClient();

  // Fetch contextual entities
  const [
    { data: assetData },
    { data: identityData },
    { data: relatedAlertsData },
    { data: dnsData },
    { data: emailData },
    { data: cloudData },
    { data: fwData },
    { data: processData },
    { data: socketData },
    { data: eventData },
    { data: logData },
  ] = await Promise.all([
    correlation.primary_entity_type === "asset"
      ? supabase.from("assets").select("*").eq("id", correlation.primary_entity_id).maybeSingle()
      : Promise.resolve({ data: null }),
    correlation.primary_entity_type === "identity"
      ? supabase.from("soc_identities").select("*").eq("id", correlation.primary_entity_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("alerts").select("*").eq("organization_id", params.organizationId).limit(10),
    supabase.from("dns_events").select("*").eq("organization_id", params.organizationId).limit(20),
    supabase.from("email_events").select("*").eq("organization_id", params.organizationId).limit(20),
    supabase.from("cloud_events").select("*").eq("organization_id", params.organizationId).limit(20),
    supabase.from("firewall_events").select("*").eq("organization_id", params.organizationId).limit(20),
    supabase.from("processes").select("*").eq("organization_id", params.organizationId).limit(20),
    supabase.from("network_connections").select("*").eq("organization_id", params.organizationId).limit(20),
    supabase.from("events").select("*").eq("organization_id", params.organizationId).limit(50),
    supabase.from("logs").select("*").eq("organization_id", params.organizationId).limit(50),
  ]);

  const dnsEvents = (dnsData as DnsEvent[]) || [];
  const emailEvents = (emailData as EmailEvent[]) || [];
  const cloudEvents = (cloudData as CloudEvent[]) || [];
  const firewallEvents = (fwData as FirewallEvent[]) || [];
  const processes = (processData as ProcessRecord[]) || [];
  const networkConnections = (socketData as NetworkConnectionRecord[]) || [];
  const events = (eventData as TelemetryEvent[]) || [];
  const logs = (logData as LogRecord[]) || [];
  const relatedAlerts = (relatedAlertsData as Alert[]) || [];

  const timeline = compileXdrTimeline({
    correlation,
    dnsEvents,
    emailEvents,
    cloudEvents,
    firewallEvents,
    processes,
    networkConnections,
    events,
    logs,
  });

  const sourceDistribution: Record<XdrTelemetrySource, number> = {
    endpoint: processes.length,
    identity: events.filter((e) => e.category === "Identity").length,
    email: emailEvents.length,
    dns: dnsEvents.length,
    cloud: cloudEvents.length,
    network: networkConnections.length,
    firewall: firewallEvents.length,
    authentication: events.filter((e) => e.category === "Authentication" || e.source_type === "Authentication").length,
  };

  return {
    correlation,
    primaryAsset: (assetData as Asset) || null,
    primaryIdentity: (identityData as SocIdentity) || null,
    relatedAssets: assetData ? [assetData as Asset] : [],
    relatedIdentities: identityData ? [identityData as SocIdentity] : [],
    relatedAlerts,
    timeline,
    sourceDistribution,
    dnsEvents,
    emailEvents,
    cloudEvents,
    firewallEvents,
    processes,
    networkConnections,
    events,
    logs,
  };
}

/**
 * Compiles a unified multi-source chronological forensic timeline.
 */
export function compileXdrTimeline(input: {
  correlation: XdrCorrelationResult;
  dnsEvents: DnsEvent[];
  emailEvents: EmailEvent[];
  cloudEvents: CloudEvent[];
  firewallEvents: FirewallEvent[];
  processes: ProcessRecord[];
  networkConnections: NetworkConnectionRecord[];
  events: TelemetryEvent[];
  logs: LogRecord[];
}): XdrTimelineItem[] {
  const items: XdrTimelineItem[] = [];

  // 1. Explanation steps from correlation
  for (const exp of input.correlation.explanation) {
    items.push({
      id: `exp-${exp.step}-${exp.source}`,
      occurredAt: exp.timestamp,
      source: exp.source,
      category: "Correlated Step",
      action: exp.title,
      title: exp.title,
      summary: exp.description,
      severity: input.correlation.severity,
      details: exp.evidence,
      rawPayload: exp.evidence,
    });
  }

  // 2. DNS events
  for (const dns of input.dnsEvents) {
    items.push({
      id: dns.id,
      occurredAt: dns.occurred_at,
      source: "dns",
      category: "DNS",
      action: `DNS Query ${dns.query_type}`,
      title: `DNS: ${dns.query_domain}`,
      summary: `Domain ${dns.query_domain} resolved to ${dns.resolved_ips?.join(", ") || "NXDOMAIN"} (Code: ${dns.response_code})`,
      severity: dns.is_malicious ? "High" : "Low",
      details: { queryDomain: dns.query_domain, queryType: dns.query_type, resolvedIps: dns.resolved_ips, isMalicious: dns.is_malicious },
      rawPayload: dns as unknown as Record<string, unknown>,
    });
  }

  // 3. Email events
  for (const mail of input.emailEvents) {
    items.push({
      id: mail.id,
      occurredAt: mail.occurred_at,
      source: "email",
      category: "Email",
      action: `Email ${mail.action}`,
      title: `Email: ${mail.subject}`,
      summary: `From '${mail.sender}' to '${mail.recipient}' [SPF: ${mail.spf_verdict || "N/A"}, Phish: ${mail.is_phishing ? "YES" : "NO"}]`,
      severity: mail.threat_level,
      details: { sender: mail.sender, recipient: mail.recipient, subject: mail.subject, attachment: mail.attachment_name },
      rawPayload: mail as unknown as Record<string, unknown>,
    });
  }

  // 4. Cloud events
  for (const cloud of input.cloudEvents) {
    items.push({
      id: cloud.id,
      occurredAt: cloud.occurred_at,
      source: "cloud",
      category: "Cloud",
      action: cloud.event_name,
      title: `Cloud API: ${cloud.service_name} / ${cloud.event_name}`,
      summary: `Provider ${cloud.cloud_provider} API operation '${cloud.event_name}' executed from IP '${cloud.caller_ip || "unknown"}' (${cloud.status})`,
      severity: cloud.status === "Failure" ? "High" : "Informational",
      details: { service: cloud.service_name, event: cloud.event_name, callerIp: cloud.caller_ip, region: cloud.region },
      rawPayload: cloud as unknown as Record<string, unknown>,
    });
  }

  // 5. Firewall events
  for (const fw of input.firewallEvents) {
    items.push({
      id: fw.id,
      occurredAt: fw.occurred_at,
      source: "firewall",
      category: "Firewall",
      action: `Traffic ${fw.action}`,
      title: `Firewall: ${fw.src_ip} ➔ ${fw.dst_ip}:${fw.dst_port}`,
      summary: `Rule '${fw.rule_name || fw.rule_id || "Default"}' verdict '${fw.action}' on ${fw.protocol} traffic`,
      severity: fw.action === "Blocked" ? "Critical" : "Medium",
      details: { srcIp: fw.src_ip, dstIp: fw.dst_ip, dstPort: fw.dst_port, action: fw.action, rule: fw.rule_name },
      rawPayload: fw as unknown as Record<string, unknown>,
    });
  }

  // 6. Processes
  for (const proc of input.processes) {
    items.push({
      id: proc.id,
      occurredAt: proc.started_at,
      source: "endpoint",
      category: "Process",
      action: "Process Spawned",
      title: `Process: ${proc.name}`,
      summary: `PID ${proc.pid} executed '${proc.command_line || proc.executable_path}' (User: ${proc.username || "SYSTEM"})`,
      severity: "Medium",
      username: proc.username || undefined,
      details: { pid: proc.pid, ppid: proc.ppid, name: proc.name, path: proc.executable_path, hash: proc.sha256 },
      rawPayload: proc as unknown as Record<string, unknown>,
    });
  }

  // Deduplicate by ID and sort chronologically (most recent first)
  const uniqueMap = new Map<string, XdrTimelineItem>();
  for (const item of items) {
    uniqueMap.set(item.id, item);
  }

  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}

/**
 * Generates deterministic fallback demo correlations for initial workspace viewing.
 */
function generateDemoCorrelations(organizationId: string): XdrCorrelationResult[] {
  const now = Date.now();

  return [
    {
      id: "demo-corr-01",
      organization_id: organizationId,
      correlation_code: "XDR-CORR-2026-0814",
      title: "Cross-Source Spear Phishing & Endpoint Masquerading Chain",
      description: "Inbound malicious email with PDF executable leading to workstation logon, cmd.exe masquerading, C2 domain resolution, and outbound firewall-allowed beaconing.",
      severity: "Critical",
      relationship_type: "temporal_killchain",
      confidence_score: 96,
      primary_entity_type: "identity",
      primary_entity_id: "00000000-0000-0000-0000-000000000002",
      primary_entity_name: "jdoe (Jane Doe)",
      time_window_start: new Date(now - 30 * 60000).toISOString(),
      time_window_end: new Date(now - 5 * 60000).toISOString(),
      duration_minutes: 25,
      explanation: [
        {
          step: 1,
          title: "Inbound Phishing Email Delivered",
          source: "email",
          description: "Malicious email from 'payroll-notification@secure-portal-corp.com' containing attachment 'invoice_q3.pdf.exe' delivered to 'jdoe@enterprise.corp'.",
          timestamp: new Date(now - 25 * 60000).toISOString(),
          evidence: { sender: "payroll-notification@secure-portal-corp.com", attachment: "invoice_q3.pdf.exe" },
        },
        {
          step: 2,
          title: "Interactive User Authentication",
          source: "authentication",
          description: "User 'jdoe' logged on interactively to workstation 'WKSTN-FIN-04' (10.0.4.84).",
          timestamp: new Date(now - 20 * 60000).toISOString(),
          evidence: { username: "jdoe", hostname: "WKSTN-FIN-04", ip: "10.0.4.84" },
        },
        {
          step: 3,
          title: "Masquerading Process Execution",
          source: "endpoint",
          description: "Process 'cmd.exe' spawned from %TEMP% directory executing encoded PowerShell commands (PID: 4920).",
          timestamp: new Date(now - 15 * 60000).toISOString(),
          evidence: { processName: "cmd.exe", pid: 4920, path: "C:\\Users\\jdoe\\AppData\\Local\\Temp\\invoice_q3.pdf.exe" },
        },
        {
          step: 4,
          title: "C2 Domain DNS Resolution",
          source: "dns",
          description: "Host queried domain 'cdn-update-secure.net' resolving to external IP '198.51.100.45'.",
          timestamp: new Date(now - 10 * 60000).toISOString(),
          evidence: { domain: "cdn-update-secure.net", resolvedIp: "198.51.100.45" },
        },
        {
          step: 5,
          title: "Perimeter Firewall Egress Connection",
          source: "firewall",
          description: "Outbound HTTPS connection from '10.0.4.84' to '198.51.100.45:443' matched Default Egress rule.",
          timestamp: new Date(now - 5 * 60000).toISOString(),
          evidence: { srcIp: "10.0.4.84", dstIp: "198.51.100.45", port: 443, action: "Allowed" },
        },
      ],
      shared_identifiers: {
        ips: ["10.0.4.84", "198.51.100.45"],
        domains: ["cdn-update-secure.net", "enterprise.corp"],
        usernames: ["jdoe"],
        emails: ["jdoe@enterprise.corp"],
        hostnames: ["WKSTN-FIN-04"],
      },
      source_counts: {
        email: 1,
        authentication: 1,
        endpoint: 2,
        dns: 1,
        firewall: 1,
        network: 1,
      },
      matched_event_ids: ["evt-01", "evt-02", "evt-03", "evt-04", "evt-05"],
      related_asset_ids: ["00000000-0000-0000-0000-000000000001"],
      related_identity_ids: ["00000000-0000-0000-0000-000000000002"],
      related_alert_ids: ["alt-01"],
      status: "Active",
      metadata: { attackVector: "Phishing to Egress C2" },
      created_at: new Date(now - 30 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-corr-02",
      organization_id: organizationId,
      correlation_code: "XDR-CORR-2026-0922",
      title: "Cloud Account Takeover & S3 Exfiltration",
      description: "Brute force authentication anomaly against cloud identity provider followed by IAM access key creation and bulk S3 object retrieval.",
      severity: "High",
      relationship_type: "same_identity",
      confidence_score: 92,
      primary_entity_type: "identity",
      primary_entity_id: "00000000-0000-0000-0000-000000000003",
      primary_entity_name: "admin.cloud (Cloud Operations)",
      time_window_start: new Date(now - 45 * 60000).toISOString(),
      time_window_end: new Date(now - 12 * 60000).toISOString(),
      duration_minutes: 33,
      explanation: [
        {
          step: 1,
          title: "Brute Force Authentication Anomaly",
          source: "authentication",
          description: "Multiple failed sign-in attempts (5) from unverified IP '203.0.113.88'.",
          timestamp: new Date(now - 40 * 60000).toISOString(),
          evidence: { failureCount: 5, callerIp: "203.0.113.88" },
        },
        {
          step: 2,
          title: "Privileged AWS Access Key Creation",
          source: "cloud",
          description: "IAM CreateAccessKey API invoked for 'admin.cloud' from external IP '203.0.113.88'.",
          timestamp: new Date(now - 25 * 60000).toISOString(),
          evidence: { api: "CreateAccessKey", service: "IAM", callerIp: "203.0.113.88" },
        },
        {
          step: 3,
          title: "High-Volume S3 Data Retrieval",
          source: "cloud",
          description: "Bulk GetObject calls on bucket 'corp-financial-backups' transferring 850MB.",
          timestamp: new Date(now - 12 * 60000).toISOString(),
          evidence: { bucket: "corp-financial-backups", transferredBytes: 891289600 },
        },
      ],
      shared_identifiers: {
        ips: ["203.0.113.88"],
        usernames: ["admin.cloud"],
      },
      source_counts: {
        authentication: 2,
        cloud: 2,
      },
      matched_event_ids: ["evt-06", "evt-07", "evt-08"],
      related_asset_ids: [],
      related_identity_ids: ["00000000-0000-0000-0000-000000000003"],
      related_alert_ids: ["alt-02"],
      status: "Active",
      metadata: { attackVector: "Cloud Credential Theft" },
      created_at: new Date(now - 45 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-corr-03",
      organization_id: organizationId,
      correlation_code: "XDR-CORR-2026-1045",
      title: "Ransomware Precursor: USB Insertion & Shadow Copy Invalidation",
      description: "Removable mass storage device attached to server followed by shadow copy deletion attempt and perimeter C2 firewall block.",
      severity: "Critical",
      relationship_type: "same_asset",
      confidence_score: 95,
      primary_entity_type: "asset",
      primary_entity_id: "00000000-0000-0000-0000-000000000004",
      primary_entity_name: "SRV-DATA-02 (Core File Server)",
      time_window_start: new Date(now - 20 * 60000).toISOString(),
      time_window_end: new Date(now - 2 * 60000).toISOString(),
      duration_minutes: 18,
      explanation: [
        {
          step: 1,
          title: "Unauthorized USB Device Insertion",
          source: "endpoint",
          description: "Mass Storage 'Kingston DataTraveler 3.0' mounted on server 'SRV-DATA-02' (Drive: E:).",
          timestamp: new Date(now - 18 * 60000).toISOString(),
          evidence: { device: "Kingston DataTraveler 3.0", driveLetter: "E:" },
        },
        {
          step: 2,
          title: "Volume Shadow Copy Deletion",
          source: "endpoint",
          description: "Command 'vssadmin.exe delete shadows /all /quiet' executed by high-integrity process.",
          timestamp: new Date(now - 10 * 60000).toISOString(),
          evidence: { command: "vssadmin.exe delete shadows /all /quiet" },
        },
        {
          step: 3,
          title: "Perimeter Firewall Blocked Ransomware C2",
          source: "firewall",
          description: "Outbound communication to known ransomware C2 IP '185.220.101.5:8080' blocked by firewall feed rule.",
          timestamp: new Date(now - 2 * 60000).toISOString(),
          evidence: { dstIp: "185.220.101.5", action: "Blocked" },
        },
      ],
      shared_identifiers: {
        ips: ["10.0.2.14", "185.220.101.5"],
        hostnames: ["SRV-DATA-02"],
      },
      source_counts: {
        endpoint: 2,
        firewall: 1,
      },
      matched_event_ids: ["evt-09", "evt-10", "evt-11"],
      related_asset_ids: ["00000000-0000-0000-0000-000000000004"],
      related_identity_ids: [],
      related_alert_ids: ["alt-03"],
      status: "Active",
      metadata: { attackVector: "Ransomware Precursor" },
      created_at: new Date(now - 20 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
