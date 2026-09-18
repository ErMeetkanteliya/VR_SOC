/**
 * XDR Correlation Engine
 *
 * Provides deterministic, explainable, and bounded cross-source correlation
 * across Endpoint, Identity, Email, DNS, Cloud, Network, Firewall, and Authentication telemetry.
 *
 * Strictly follows deterministic rule matching — no ML, UEBA, or probabilistic guessing.
 */

import type {
  XdrCorrelationResult,
  XdrExplanationStep,
  XdrSharedIdentifiers,
  XdrTelemetrySource,
  TelemetryEvent,
  Alert,
  Asset,
  SocIdentity,
  DnsEvent,
  EmailEvent,
  CloudEvent,
  FirewallEvent,
  ProcessRecord,
  NetworkConnectionRecord,
} from "@vrsoc/types";

export interface CorrelationInputDataset {
  organizationId: string;
  events?: TelemetryEvent[];
  alerts?: Alert[];
  assets?: Asset[];
  identities?: SocIdentity[];
  dnsEvents?: DnsEvent[];
  emailEvents?: EmailEvent[];
  cloudEvents?: CloudEvent[];
  firewallEvents?: FirewallEvent[];
  processes?: ProcessRecord[];
  networkConnections?: NetworkConnectionRecord[];
  timeWindowMinutes?: number;
}

/**
 * Deterministically correlates multi-source records into explainable XDR correlation clusters.
 */
export function correlateMultiSourceTelemetry(dataset: CorrelationInputDataset): XdrCorrelationResult[] {
  const correlations: XdrCorrelationResult[] = [];

  // 1. Correlate by Shared Identity across Email, Auth, Cloud, and Endpoint
  const identityClusters = findIdentityCrossSourceClusters(dataset);
  correlations.push(...identityClusters);

  // 2. Correlate by Shared Asset across Endpoint, Network, DNS, and Firewall
  const assetClusters = findAssetCrossSourceClusters(dataset);
  correlations.push(...assetClusters);


  // 3. Correlate by Shared External IP & Domain across DNS, Network, Firewall, and Cloud
  const networkDomainClusters = findNetworkDomainClusters(dataset);
  correlations.push(...networkDomainClusters);

  // 4. Correlate by Multi-Source Alerts
  const alertClusters = findAlertCrossSourceClusters(dataset);
  correlations.push(...alertClusters);

  // Deduplicate and rank by confidence score
  const uniqueMap = new Map<string, XdrCorrelationResult>();
  for (const c of correlations) {
    if (!uniqueMap.has(c.correlation_code)) {
      uniqueMap.set(c.correlation_code, c);
    }
  }

  return Array.from(uniqueMap.values()).sort((a, b) => b.confidence_score - a.confidence_score);
}

/**
 * Identity Correlation: Links Email Phish / Auth Anomaly / Cloud API Access / Endpoint Execution
 */
function findIdentityCrossSourceClusters(dataset: CorrelationInputDataset): XdrCorrelationResult[] {

  const clusters: XdrCorrelationResult[] = [];
  const identities = dataset.identities || [];
  const emailEvents = dataset.emailEvents || [];
  const cloudEvents = dataset.cloudEvents || [];
  const events = dataset.events || [];
  const processes = dataset.processes || [];

  for (const identity of identities) {
    const userEmails = emailEvents.filter(
      (e) => e.identity_id === identity.id || (identity.email && e.recipient.toLowerCase() === identity.email.toLowerCase())
    );
    const userCloud = cloudEvents.filter((c) => c.identity_id === identity.id);
    const userEvents = events.filter((ev) => ev.identity_id === identity.id);
    const userProcesses = processes.filter(
      (p) => p.identity_id === identity.id || (p.username && p.username.toLowerCase().includes(identity.username.toLowerCase()))
    );

    const activeSources: XdrTelemetrySource[] = [];
    if (userEmails.length > 0) activeSources.push("email");
    if (userCloud.length > 0) activeSources.push("cloud");
    if (userProcesses.length > 0) activeSources.push("endpoint");
    if (userEvents.some((e) => e.category === "Authentication" || e.source_type === "Authentication")) {
      activeSources.push("authentication");
    }

    // Require at least 2 distinct sources for a valid XDR correlation
    if (activeSources.length >= 2) {
      const explanation: XdrExplanationStep[] = [];
      let stepNum = 1;
      const matchedEventIds: string[] = [];

      if (userEmails.length > 0) {
        const topEmail = userEmails[0]!;
        explanation.push({
          step: stepNum++,
          title: `Inbound Email Activity (${topEmail.action})`,
          source: "email",
          description: `User received email from '${topEmail.sender}' with subject '${topEmail.subject}'${topEmail.attachment_name ? ` containing attachment '${topEmail.attachment_name}'` : ""}.`,
          timestamp: topEmail.occurred_at,
          evidence: { sender: topEmail.sender, subject: topEmail.subject, attachment: topEmail.attachment_name, isPhishing: topEmail.is_phishing },
        });
        matchedEventIds.push(topEmail.id);
      }

      const authEvents = userEvents.filter((e) => e.category === "Authentication" || e.source_type === "Authentication");
      if (authEvents.length > 0) {
        const topAuth = authEvents[0]!;
        explanation.push({
          step: stepNum++,
          title: `Identity Authentication Event (${topAuth.event_type})`,
          source: "authentication",
          description: `User '${identity.username}' authenticated on ${topAuth.source_host || "workstation"} with status ${topAuth.severity}.`,
          timestamp: topAuth.occurred_at,
          evidence: { username: identity.username, eventType: topAuth.event_type, sourceHost: topAuth.source_host },
        });
        matchedEventIds.push(topAuth.id);
      }

      if (userProcesses.length > 0) {
        const topProc = userProcesses[0]!;
        explanation.push({
          step: stepNum++,
          title: `Endpoint Process Execution (${topProc.name})`,
          source: "endpoint",
          description: `Process '${topProc.name}' executed under account '${identity.username}' (PID: ${topProc.pid}).`,
          timestamp: topProc.started_at,
          evidence: { processName: topProc.name, pid: topProc.pid, commandLine: topProc.command_line, sha256: topProc.sha256 },
        });
        matchedEventIds.push(topProc.id);
      }

      if (userCloud.length > 0) {
        const topCloud = userCloud[0]!;
        explanation.push({
          step: stepNum++,
          title: `Cloud Infrastructure Activity (${topCloud.cloud_provider} ${topCloud.service_name})`,
          source: "cloud",
          description: `API call '${topCloud.event_name}' executed on ${topCloud.service_name} from IP '${topCloud.caller_ip || "unknown"}'.`,
          timestamp: topCloud.occurred_at,
          evidence: { provider: topCloud.cloud_provider, eventName: topCloud.event_name, callerIp: topCloud.caller_ip, status: topCloud.status },
        });
        matchedEventIds.push(topCloud.id);
      }

      const timestamps = explanation.map((e) => new Date(e.timestamp).getTime()).filter((t) => !isNaN(t));
      const startTime = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : new Date().toISOString();
      const endTime = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : new Date().toISOString();

      const sourceCounts: Partial<Record<XdrTelemetrySource, number>> = {
        email: userEmails.length,
        cloud: userCloud.length,
        endpoint: userProcesses.length,
        authentication: authEvents.length,
      };

      const sharedIdentifiers: XdrSharedIdentifiers = {
        usernames: [identity.username],
        emails: identity.email ? [identity.email] : [],
        domains: [identity.domain],
      };

      clusters.push({
        id: `xdr-corr-id-${identity.id.substring(0, 8)}`,
        organization_id: dataset.organizationId,
        correlation_code: `XDR-ID-${identity.username.toUpperCase()}`,
        title: `Correlated Cross-Source Activity for Identity '${identity.display_name || identity.username}'`,
        description: `Correlated ${activeSources.join(", ")} activity involving user identity '${identity.username}' across multiple enterprise surfaces.`,
        severity: userEmails.some((e) => e.is_phishing) || userCloud.some((c) => c.status === "Failure") ? "High" : "Medium",
        relationship_type: "same_identity",
        confidence_score: calculateConfidenceScore(activeSources.length, matchedEventIds.length),
        primary_entity_type: "identity",
        primary_entity_id: identity.id,
        primary_entity_name: identity.display_name || identity.username,
        time_window_start: startTime,
        time_window_end: endTime,
        duration_minutes: Math.max(15, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)),
        explanation,
        shared_identifiers: sharedIdentifiers,
        source_counts: sourceCounts,
        matched_event_ids: matchedEventIds,
        related_asset_ids: [],
        related_identity_ids: [identity.id],
        related_alert_ids: [],
        status: "Active",
        metadata: { identityType: identity.account_type, isPrivileged: identity.is_privileged },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return clusters;
}

/**
 * Asset Correlation: Links Endpoint Execution ➔ Outbound Socket ➔ DNS Query ➔ Firewall Action
 */
function findAssetCrossSourceClusters(dataset: CorrelationInputDataset): XdrCorrelationResult[] {
  const clusters: XdrCorrelationResult[] = [];
  const assets = dataset.assets || [];
  const dnsEvents = dataset.dnsEvents || [];
  const firewallEvents = dataset.firewallEvents || [];
  const processes = dataset.processes || [];
  const networkConnections = dataset.networkConnections || [];

  for (const asset of assets) {
    const hostProcesses = processes.filter((p) => p.asset_id === asset.id);
    const hostSockets = networkConnections.filter((n) => n.asset_id === asset.id);
    const hostDns = dnsEvents.filter((d) => d.asset_id === asset.id);
    const hostFw = firewallEvents.filter(
      (f) => f.asset_id === asset.id || (asset.ip_address && (f.src_ip === asset.ip_address || f.dst_ip === asset.ip_address))
    );

    const activeSources: XdrTelemetrySource[] = [];
    if (hostProcesses.length > 0) activeSources.push("endpoint");
    if (hostSockets.length > 0) activeSources.push("network");
    if (hostDns.length > 0) activeSources.push("dns");
    if (hostFw.length > 0) activeSources.push("firewall");

    if (activeSources.length >= 2) {
      const explanation: XdrExplanationStep[] = [];
      let stepNum = 1;
      const matchedEventIds: string[] = [];
      const sharedIps = new Set<string>();
      const sharedDomains = new Set<string>();

      if (asset.ip_address) sharedIps.add(asset.ip_address);

      if (hostProcesses.length > 0) {
        const topProc = hostProcesses[0]!;
        explanation.push({
          step: stepNum++,
          title: `Endpoint Masquerading / Execution (${topProc.name})`,
          source: "endpoint",
          description: `Process '${topProc.name}' executed on host '${asset.hostname}' from path '${topProc.executable_path}'.`,
          timestamp: topProc.started_at,
          evidence: { processName: topProc.name, pid: topProc.pid, path: topProc.executable_path },
        });
        matchedEventIds.push(topProc.id);
      }

      if (hostDns.length > 0) {
        const topDns = hostDns[0]!;
        sharedDomains.add(topDns.query_domain);
        if (topDns.resolved_ips && topDns.resolved_ips.length > 0) {
          topDns.resolved_ips.forEach((ip) => sharedIps.add(ip));
        }
        explanation.push({
          step: stepNum++,
          title: `DNS Name Resolution (${topDns.query_domain})`,
          source: "dns",
          description: `Host performed DNS resolution for '${topDns.query_domain}' (${topDns.query_type} query) resolving to ${topDns.resolved_ips?.join(", ") || "NXDOMAIN"}.`,
          timestamp: topDns.occurred_at,
          evidence: { queryDomain: topDns.query_domain, queryType: topDns.query_type, resolvedIps: topDns.resolved_ips, isMalicious: topDns.is_malicious },
        });
        matchedEventIds.push(topDns.id);
      }

      if (hostSockets.length > 0) {
        const topSocket = hostSockets[0]!;
        sharedIps.add(topSocket.dst_ip);
        explanation.push({
          step: stepNum++,
          title: `Outbound Network Socket (${topSocket.dst_ip}:${topSocket.dst_port})`,
          source: "network",
          description: `Outbound ${topSocket.protocol} connection established to '${topSocket.dst_ip}:${topSocket.dst_port}' (${topSocket.status}).`,
          timestamp: topSocket.started_at,
          evidence: { srcIp: topSocket.src_ip, dstIp: topSocket.dst_ip, dstPort: topSocket.dst_port, protocol: topSocket.protocol },
        });
        matchedEventIds.push(topSocket.id);
      }

      if (hostFw.length > 0) {
        const topFw = hostFw[0]!;
        sharedIps.add(topFw.dst_ip);
        explanation.push({
          step: stepNum++,
          title: `Perimeter Firewall Rule Match (${topFw.action})`,
          source: "firewall",
          description: `Firewall logged rule '${topFw.rule_name || topFw.rule_id || "Default"}' with action '${topFw.action}' for traffic to '${topFw.dst_ip}:${topFw.dst_port}'.`,
          timestamp: topFw.occurred_at,
          evidence: { srcIp: topFw.src_ip, dstIp: topFw.dst_ip, action: topFw.action, rule: topFw.rule_name },
        });
        matchedEventIds.push(topFw.id);
      }

      const timestamps = explanation.map((e) => new Date(e.timestamp).getTime()).filter((t) => !isNaN(t));
      const startTime = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : new Date().toISOString();
      const endTime = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : new Date().toISOString();

      const sourceCounts: Partial<Record<XdrTelemetrySource, number>> = {
        endpoint: hostProcesses.length,
        network: hostSockets.length,
        dns: hostDns.length,
        firewall: hostFw.length,
      };

      const hasThreat = hostDns.some((d) => d.is_malicious) || hostFw.some((f) => f.action === "Blocked");

      clusters.push({
        id: `xdr-corr-asset-${asset.id.substring(0, 8)}`,
        organization_id: dataset.organizationId,
        correlation_code: `XDR-HOST-${asset.hostname.toUpperCase()}`,
        title: `Correlated Multi-Source Killchain on Host '${asset.display_name || asset.hostname}'`,
        description: `Correlated ${activeSources.join(", ")} telemetry representing an endpoint-to-network activity chain on '${asset.hostname}'.`,
        severity: hasThreat ? "Critical" : "High",
        relationship_type: "temporal_killchain",
        confidence_score: calculateConfidenceScore(activeSources.length, matchedEventIds.length),
        primary_entity_type: "asset",
        primary_entity_id: asset.id,
        primary_entity_name: asset.display_name || asset.hostname,
        time_window_start: startTime,
        time_window_end: endTime,
        duration_minutes: Math.max(15, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)),
        explanation,
        shared_identifiers: {
          ips: Array.from(sharedIps),
          domains: Array.from(sharedDomains),
          hostnames: [asset.hostname],
        },
        source_counts: sourceCounts,
        matched_event_ids: matchedEventIds,
        related_asset_ids: [asset.id],
        related_identity_ids: [],
        related_alert_ids: [],
        status: "Active",
        metadata: { osType: asset.os_type, ipAddress: asset.ip_address, criticality: asset.criticality },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return clusters;
}

/**
 * Network & Domain Correlation: Links DNS Query ➔ Network Socket ➔ Firewall Log ➔ Cloud IP
 */
function findNetworkDomainClusters(dataset: CorrelationInputDataset): XdrCorrelationResult[] {
  const clusters: XdrCorrelationResult[] = [];
  const dnsEvents = dataset.dnsEvents || [];
  const firewallEvents = dataset.firewallEvents || [];
  const networkConnections = dataset.networkConnections || [];
  const cloudEvents = dataset.cloudEvents || [];

  // Group by external IP
  const ipMap = new Map<string, { dns: DnsEvent[]; sockets: NetworkConnectionRecord[]; fw: FirewallEvent[]; cloud: CloudEvent[] }>();

  for (const dns of dnsEvents) {
    if (dns.resolved_ips) {
      for (const ip of dns.resolved_ips) {
        if (!ipMap.has(ip)) ipMap.set(ip, { dns: [], sockets: [], fw: [], cloud: [] });
        ipMap.get(ip)!.dns.push(dns);
      }
    }
  }

  for (const socket of networkConnections) {
    if (!ipMap.has(socket.dst_ip)) ipMap.set(socket.dst_ip, { dns: [], sockets: [], fw: [], cloud: [] });
    ipMap.get(socket.dst_ip)!.sockets.push(socket);
  }

  for (const fw of firewallEvents) {
    if (!ipMap.has(fw.dst_ip)) ipMap.set(fw.dst_ip, { dns: [], sockets: [], fw: [], cloud: [] });
    ipMap.get(fw.dst_ip)!.fw.push(fw);
  }

  for (const cloud of cloudEvents) {
    if (cloud.caller_ip) {
      if (!ipMap.has(cloud.caller_ip)) ipMap.set(cloud.caller_ip, { dns: [], sockets: [], fw: [], cloud: [] });
      ipMap.get(cloud.caller_ip)!.cloud.push(cloud);
    }
  }

  for (const [ip, group] of ipMap.entries()) {
    // Exclude internal RFC 1918 loopback addresses from external IP cluster
    if (ip.startsWith("127.") || ip === "0.0.0.0" || ip === "::1") continue;

    const sources: XdrTelemetrySource[] = [];
    if (group.dns.length > 0) sources.push("dns");
    if (group.sockets.length > 0) sources.push("network");
    if (group.fw.length > 0) sources.push("firewall");
    if (group.cloud.length > 0) sources.push("cloud");

    if (sources.length >= 2) {
      const explanation: XdrExplanationStep[] = [];
      let stepNum = 1;
      const matchedEventIds: string[] = [];
      const domains = new Set<string>();

      if (group.dns.length > 0) {
        const topDns = group.dns[0]!;
        domains.add(topDns.query_domain);
        explanation.push({
          step: stepNum++,
          title: `DNS Domain Resolution (${topDns.query_domain} ➔ ${ip})`,
          source: "dns",
          description: `DNS query for domain '${topDns.query_domain}' resolved to target IP '${ip}'.`,
          timestamp: topDns.occurred_at,
          evidence: { domain: topDns.query_domain, ip },
        });
        matchedEventIds.push(topDns.id);
      }

      if (group.sockets.length > 0) {
        const topSocket = group.sockets[0]!;
        explanation.push({
          step: stepNum++,
          title: `Network Communication (${ip}:${topSocket.dst_port})`,
          source: "network",
          description: `Outbound ${topSocket.protocol} connection initiated to target IP '${ip}:${topSocket.dst_port}'.`,
          timestamp: topSocket.started_at,
          evidence: { srcIp: topSocket.src_ip, dstIp: ip, port: topSocket.dst_port },
        });
        matchedEventIds.push(topSocket.id);
      }

      if (group.fw.length > 0) {
        const topFw = group.fw[0]!;
        explanation.push({
          step: stepNum++,
          title: `Firewall Inspection (${topFw.action})`,
          source: "firewall",
          description: `Firewall evaluated traffic to '${ip}:${topFw.dst_port}' with verdict '${topFw.action}'.`,
          timestamp: topFw.occurred_at,
          evidence: { dstIp: ip, action: topFw.action, rule: topFw.rule_name },
        });
        matchedEventIds.push(topFw.id);
      }

      if (group.cloud.length > 0) {
        const topCloud = group.cloud[0]!;
        explanation.push({
          step: stepNum++,
          title: `Cloud Infrastructure Access (${topCloud.service_name})`,
          source: "cloud",
          description: `Cloud API operation '${topCloud.event_name}' originated from IP '${ip}'.`,
          timestamp: topCloud.occurred_at,
          evidence: { callerIp: ip, eventName: topCloud.event_name, service: topCloud.service_name },
        });
        matchedEventIds.push(topCloud.id);
      }

      const timestamps = explanation.map((e) => new Date(e.timestamp).getTime()).filter((t) => !isNaN(t));
      const startTime = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : new Date().toISOString();
      const endTime = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : new Date().toISOString();

      clusters.push({
        id: `xdr-corr-ip-${ip.replace(/[^a-zA-Z0-9]/g, "-")}`,
        organization_id: dataset.organizationId,
        correlation_code: `XDR-NET-${ip}`,
        title: `Cross-Source Network Threat Correlation for IP '${ip}'`,
        description: `Correlated ${sources.join(", ")} telemetry associated with external IP destination '${ip}'.`,
        severity: group.fw.some((f) => f.action === "Blocked") || group.dns.some((d) => d.is_malicious) ? "Critical" : "High",
        relationship_type: "same_ip",
        confidence_score: calculateConfidenceScore(sources.length, matchedEventIds.length),
        primary_entity_type: "ip",
        primary_entity_id: ip,
        primary_entity_name: ip,
        time_window_start: startTime,
        time_window_end: endTime,
        duration_minutes: Math.max(15, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)),
        explanation,
        shared_identifiers: {
          ips: [ip],
          domains: Array.from(domains),
        },
        source_counts: {
          dns: group.dns.length,
          network: group.sockets.length,
          firewall: group.fw.length,
          cloud: group.cloud.length,
        },
        matched_event_ids: matchedEventIds,
        related_asset_ids: [],
        related_identity_ids: [],
        related_alert_ids: [],
        status: "Active",
        metadata: { ipAddress: ip },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return clusters;
}

/**
 * Alert Correlation: Correlates multiple alerts matching the same host or user
 */
function findAlertCrossSourceClusters(dataset: CorrelationInputDataset): XdrCorrelationResult[] {
  const clusters: XdrCorrelationResult[] = [];
  const alerts = dataset.alerts || [];

  if (alerts.length >= 2) {
    const assetAlertMap = new Map<string, Alert[]>();
    for (const alert of alerts) {
      if (alert.asset_id) {
        if (!assetAlertMap.has(alert.asset_id)) assetAlertMap.set(alert.asset_id, []);
        assetAlertMap.get(alert.asset_id)!.push(alert);
      }
    }

    for (const [assetId, assetAlerts] of assetAlertMap.entries()) {
      if (assetAlerts.length >= 2) {
        const topAlert = assetAlerts[0]!;
        const explanation: XdrExplanationStep[] = assetAlerts.map((a, idx) => ({
          step: idx + 1,
          title: `Alert Triggered: ${a.title}`,
          source: a.source.toLowerCase().includes("endpoint") ? "endpoint" : "network",
          description: `Severity ${a.severity} alert '${a.title}' (${a.alert_code}) triggered with risk score ${a.risk_score}.`,
          timestamp: a.occurred_at,
          evidence: { alertCode: a.alert_code, mitreTactic: a.mitre_tactic, mitreTechnique: a.mitre_technique_id, riskScore: a.risk_score },
        }));

        const timestamps = assetAlerts.map((a) => new Date(a.occurred_at).getTime()).filter((t) => !isNaN(t));
        const startTime = timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : new Date().toISOString();
        const endTime = timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : new Date().toISOString();

        clusters.push({
          id: `xdr-corr-alerts-${assetId.substring(0, 8)}`,
          organization_id: dataset.organizationId,
          correlation_code: `XDR-ALT-${topAlert.alert_code}`,
          title: `Aggregated Multi-Alert Threat Cluster on Asset`,
          description: `Multiple high-severity alerts (${assetAlerts.map((a) => a.alert_code).join(", ")}) converged on the same host entity.`,
          severity: "Critical",
          relationship_type: "related_alert",
          confidence_score: 95,
          primary_entity_type: "alert",
          primary_entity_id: topAlert.id,
          primary_entity_name: topAlert.alert_code,
          time_window_start: startTime,
          time_window_end: endTime,
          duration_minutes: Math.max(15, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)),
          explanation,
          shared_identifiers: {},
          source_counts: { endpoint: assetAlerts.length },
          matched_event_ids: assetAlerts.flatMap((a) => a.matched_event_ids || []),
          related_asset_ids: [assetId],
          related_identity_ids: assetAlerts.map((a) => a.identity_id).filter(Boolean) as string[],
          related_alert_ids: assetAlerts.map((a) => a.id),
          status: "Active",
          metadata: { alertCount: assetAlerts.length },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  return clusters;
}

/**
 * Deterministic Confidence Score Calculation:
 * Base: 70
 * + 8 points per distinct telemetry source
 * + 2 points per verified evidence event
 * Capped at 98%.
 */
function calculateConfidenceScore(sourceCount: number, eventCount: number): number {
  const base = 70;
  const sourceBonus = Math.min(20, sourceCount * 7);
  const eventBonus = Math.min(8, eventCount * 2);
  return Math.min(98, base + sourceBonus + eventBonus);
}
