import type { ThreatIndicator, IocRelationship, IocOverviewStats } from "@vrsoc/types";

/**
 * Authoritative Canonical Development & Simulation Threat Intelligence Dataset
 * Note: Explicitly marked as development / educational simulation data.
 */
export const CANONICAL_THREAT_INDICATORS: ThreatIndicator[] = [
  {
    id: "ioc-ip-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "ip",
    normalized_value: "185.220.101.5",
    raw_value: "185[.]220[.]101[.]5",
    ip_version: "v4",
    confidence: 95,
    severity: "critical",
    threat_types: ["c2", "tor_exit", "scanner"],
    source: "simulation",
    tags: ["CobaltStrike", "TorNode", "RussianInfrastructure"],
    description: "Active Command & Control (C2) endpoint utilized in Cobalt Strike simulation campaigns and automated port scans.",
    first_seen: "2026-08-10T14:22:00.000Z",
    last_seen: "2026-09-18T08:15:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      asn: "AS60729",
      country: "DE",
      city: "Frankfurt",
      reputation_score: 98,
    },
    created_at: "2026-08-10T14:22:00.000Z",
    updated_at: "2026-09-18T08:15:00.000Z",
  },
  {
    id: "ioc-domain-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "domain",
    normalized_value: "c2-update-services.ru",
    raw_value: "hxxps://c2-update-services[.]ru/beacon",
    confidence: 90,
    severity: "critical",
    threat_types: ["c2", "botnet"],
    source: "simulation",
    tags: ["CobaltStrike", "MalleableC2", "FastFlux"],
    description: "Domain hosting Malleable C2 HTTP traffic profiles observed during simulated endpoint beaconing.",
    first_seen: "2026-08-12T09:00:00.000Z",
    last_seen: "2026-09-18T07:45:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      registrar: "Reg.ru",
      dns_records: ["185.220.101.5", "194.26.29.112"],
    },
    created_at: "2026-08-12T09:00:00.000Z",
    updated_at: "2026-09-18T07:45:00.000Z",
  },
  {
    id: "ioc-domain-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "domain",
    normalized_value: "secure-login-microsoft.com.co",
    raw_value: "secure-login-microsoft[.]com[.]co",
    confidence: 85,
    severity: "high",
    threat_types: ["phishing", "credential_harvesting"],
    source: "simulation",
    tags: ["Phishing", "AITM", "Office365Spoof"],
    description: "Adversary-in-the-Middle (AiTM) phishing proxy domain cloning Microsoft 365 login portals.",
    first_seen: "2026-08-15T11:30:00.000Z",
    last_seen: "2026-09-17T19:20:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      whois_created: "2026-08-14",
      ssl_issuer: "Let's Encrypt",
    },
    created_at: "2026-08-15T11:30:00.000Z",
    updated_at: "2026-09-17T19:20:00.000Z",
  },
  {
    id: "ioc-url-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "url",
    normalized_value: "https://c2-update-services.ru/payloads/beacon.bin",
    raw_value: "hxxps://c2-update-services[.]ru/payloads/beacon.bin",
    confidence: 95,
    severity: "critical",
    threat_types: ["dropper", "payload_delivery"],
    source: "simulation",
    tags: ["PayloadDownload", "CobaltStrike", "Stager"],
    description: "Direct URL serving raw encrypted stage-2 shellcode payloads for memory injection.",
    first_seen: "2026-08-12T09:15:00.000Z",
    last_seen: "2026-09-18T07:30:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      content_type: "application/octet-stream",
      payload_size_bytes: 284160,
    },
    created_at: "2026-08-12T09:15:00.000Z",
    updated_at: "2026-09-18T07:30:00.000Z",
  },
  {
    id: "ioc-hash-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "hash",
    normalized_value: "44d88612fea8a8f36de82e1278abb02f",
    raw_value: "44D88612FEA8A8F36DE82E1278ABB02F",
    hash_type: "md5",
    confidence: 90,
    severity: "high",
    threat_types: ["trojan", "dropper"],
    source: "simulation",
    tags: ["Emotet", "DropperMD5", "MalwareStager"],
    description: "MD5 hash signature for polymorphic malicious Word document dropper delivering banking trojans.",
    first_seen: "2026-08-01T10:00:00.000Z",
    last_seen: "2026-09-16T15:00:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      file_type: "Composite Document File V2 (DOC)",
      vt_detections: 58,
    },
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-09-16T15:00:00.000Z",
  },
  {
    id: "ioc-hash-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "hash",
    normalized_value: "a2b8e39d41ef4873919864299b801a2489c72e411b0e36b85d957102e3b8a1c9",
    raw_value: "0xa2b8e39d41ef4873919864299b801a2489c72e411b0e36b85d957102e3b8a1c9",
    hash_type: "sha256",
    confidence: 100,
    severity: "critical",
    threat_types: ["credential_theft", "hacktool"],
    source: "simulation",
    tags: ["Mimikatz", "LSASSDump", "Kerberoast"],
    description: "SHA256 signature of compiled Mimikatz binary used for memory injection and LSASS credential dumping.",
    first_seen: "2026-07-20T08:00:00.000Z",
    last_seen: "2026-09-18T06:00:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      imphash: "1b34e567fa098234",
      entropy: 7.21,
    },
    created_at: "2026-07-20T08:00:00.000Z",
    updated_at: "2026-09-18T06:00:00.000Z",
  },
  {
    id: "ioc-email-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "email",
    normalized_value: "security-alert@microsoft-support-verify.com",
    raw_value: "security-alert[@]microsoft-support-verify[.]com",
    confidence: 88,
    severity: "high",
    threat_types: ["phishing", "social_engineering"],
    source: "simulation",
    tags: ["Spearphishing", "ExecutiveImpersonation", "UrgentInvoice"],
    description: "Sender address utilized in spearphishing email campaigns spoofing urgent security verification alerts.",
    first_seen: "2026-08-20T12:00:00.000Z",
    last_seen: "2026-09-17T14:10:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      spf_pass: false,
      dmarc_status: "fail",
    },
    created_at: "2026-08-20T12:00:00.000Z",
    updated_at: "2026-09-17T14:10:00.000Z",
  },
  {
    id: "ioc-file-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "file",
    normalized_value: "invoke-mimikatz.ps1",
    raw_value: "C:\\Windows\\Temp\\Invoke-Mimikatz.ps1",
    confidence: 92,
    severity: "critical",
    threat_types: ["hacktool", "script"],
    source: "simulation",
    tags: ["PowerShell", "CredentialAccess", "In-Memory"],
    description: "PowerShell script designed to inject reflective DLLs into memory to dump plaintext passwords.",
    first_seen: "2026-08-05T16:00:00.000Z",
    last_seen: "2026-09-18T05:20:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      execution_context: "powershell.exe -ep bypass",
      target_process: "lsass.exe",
    },
    created_at: "2026-08-05T16:00:00.000Z",
    updated_at: "2026-09-18T05:20:00.000Z",
  },
  {
    id: "ioc-file-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "file",
    normalized_value: "svchost_updater.exe",
    raw_value: "C:\\Users\\Public\\svchost_updater.exe",
    confidence: 80,
    severity: "medium",
    threat_types: ["persistence", "masquerading"],
    source: "simulation",
    tags: ["Masquerading", "ServicePersistence"],
    description: "Masquerading executable installed under user profile imitating standard Windows svchost service.",
    first_seen: "2026-08-25T13:00:00.000Z",
    last_seen: "2026-09-16T11:00:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      publisher: "Unsigned",
      startup_key: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
    },
    created_at: "2026-08-25T13:00:00.000Z",
    updated_at: "2026-09-16T11:00:00.000Z",
  },
  {
    id: "ioc-ip-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_type: "ip",
    normalized_value: "194.26.29.112",
    raw_value: "194[.]26[.]29[.]112:443",
    ip_version: "v4",
    confidence: 85,
    severity: "high",
    threat_types: ["c2", "ransomware_distribution"],
    source: "simulation",
    tags: ["BlackCat", "Ransomware", "C2Infrastructure"],
    description: "Ransomware staging infrastructure utilized for exfiltrating sensitive archives before payload execution.",
    first_seen: "2026-08-18T10:00:00.000Z",
    last_seen: "2026-09-18T04:00:00.000Z",
    status: "active",
    is_global: true,
    metadata: {
      asn: "AS48259",
      country: "RU",
    },
    created_at: "2026-08-18T10:00:00.000Z",
    updated_at: "2026-09-18T04:00:00.000Z",
  },
];

/**
 * Pre-linked IOC Relationships linking indicators to events, alerts, and assets
 */
export const CANONICAL_IOC_RELATIONSHIPS: IocRelationship[] = [
  {
    id: "rel-001",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_id: "ioc-ip-001",
    target_type: "alert",
    target_id: "alert-001",
    relationship_type: "observed_in",
    context: {
      alert_title: "Suspicious Cobalt Strike C2 Traffic",
      severity: "critical",
      mitre_technique: "T1071.001",
    },
    first_seen: "2026-09-18T08:15:00.000Z",
    last_seen: "2026-09-18T08:15:00.000Z",
    created_at: "2026-09-18T08:15:00.000Z",
  },
  {
    id: "rel-002",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_id: "ioc-ip-001",
    target_type: "event",
    target_id: "event-net-001",
    relationship_type: "communicated_with",
    context: {
      dest_ip: "185.220.101.5",
      dest_port: 443,
      bytes_sent: 4520,
    },
    first_seen: "2026-09-18T08:14:30.000Z",
    last_seen: "2026-09-18T08:14:30.000Z",
    created_at: "2026-09-18T08:14:30.000Z",
  },
  {
    id: "rel-003",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_id: "ioc-ip-001",
    target_type: "asset",
    target_id: "asset-ws-01",
    relationship_type: "targeted_at",
    context: {
      hostname: "WS-FINANCE-01",
      ip_address: "10.0.1.45",
    },
    first_seen: "2026-09-18T08:14:00.000Z",
    last_seen: "2026-09-18T08:15:00.000Z",
    created_at: "2026-09-18T08:15:00.000Z",
  },
  {
    id: "rel-004",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_id: "ioc-hash-002",
    target_type: "alert",
    target_id: "alert-002",
    relationship_type: "observed_in",
    context: {
      alert_title: "LSASS Memory Dump via Mimikatz",
      severity: "critical",
      mitre_technique: "T1003.001",
    },
    first_seen: "2026-09-18T06:00:00.000Z",
    last_seen: "2026-09-18T06:00:00.000Z",
    created_at: "2026-09-18T06:00:00.000Z",
  },
  {
    id: "rel-005",
    organization_id: "00000000-0000-0000-0000-000000000001",
    ioc_id: "ioc-file-001",
    target_type: "asset",
    target_id: "asset-dc-01",
    relationship_type: "dropped_by",
    context: {
      hostname: "DC-PRIMARY-01",
      ip_address: "10.0.0.1",
    },
    first_seen: "2026-09-18T05:20:00.000Z",
    last_seen: "2026-09-18T05:20:00.000Z",
    created_at: "2026-09-18T05:20:00.000Z",
  },
];

/**
 * Calculates deterministic overview KPI stats for threat indicators
 */
export function calculateIocOverviewStats(
  iocs: ThreatIndicator[],
  relationships: IocRelationship[] = []
): IocOverviewStats {
  const stats: IocOverviewStats = {
    total_iocs: iocs.length,
    active_iocs: 0,
    critical_high_count: 0,
    total_sightings: relationships.length,
    by_type: {
      ip: 0,
      domain: 0,
      url: 0,
      hash: 0,
      email: 0,
      file: 0,
    },
    by_severity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    },
    by_status: {
      active: 0,
      deprecated: 0,
      whitelisted: 0,
      false_positive: 0,
    },
  };

  for (const ioc of iocs) {
    if (ioc.status === "active") stats.active_iocs++;
    if (ioc.severity === "critical" || ioc.severity === "high") stats.critical_high_count++;

    if (stats.by_type[ioc.ioc_type] !== undefined) {
      stats.by_type[ioc.ioc_type]++;
    }

    if (stats.by_severity[ioc.severity] !== undefined) {
      stats.by_severity[ioc.severity]++;
    }

    if (stats.by_status[ioc.status] !== undefined) {
      stats.by_status[ioc.status]++;
    }
  }

  return stats;
}
