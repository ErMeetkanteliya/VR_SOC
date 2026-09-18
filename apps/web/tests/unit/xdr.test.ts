import { describe, it, expect } from "vitest";
import {
  DnsEventSchema,
  EmailEventSchema,
  CloudEventSchema,
  FirewallEventSchema,
  XdrCorrelationResultSchema,
  XdrFilterParamsSchema,
  SimulateXdrScenarioSchema,
  PipelineIngestionSchema,
} from "@vrsoc/validation";
import {
  correlateMultiSourceTelemetry,
  compileXdrTimeline,
} from "../../lib/xdr";
import { XDR_SIMULATION_SCENARIOS } from "../../lib/xdr/simulation-scenarios";
import { normalizeTelemetryPayload } from "../../lib/telemetry/contracts";
import type {
  Asset,
  SocIdentity,
  DnsEvent,
  EmailEvent,
  CloudEvent,
  FirewallEvent,
  ProcessRecord,
  NetworkConnectionRecord,
  TelemetryEvent,
  Alert,
} from "@vrsoc/types";

describe("Phase 18 — XDR Correlation & Multi-Source Telemetry Tests", () => {
  const orgId = "11111111-1111-1111-1111-111111111111";
  const assetId = "22222222-2222-2222-2222-222222222222";
  const identityId = "33333333-3333-3333-3333-333333333333";

  // --------------------------------------------------------------------------
  // 1. Telemetry Entity & Validation Schemas
  // --------------------------------------------------------------------------
  describe("1. XDR Schema Validation", () => {
    it("validates valid DnsEvent payload", () => {
      const validDns = {
        organization_id: orgId,
        asset_id: assetId,
        query_domain: "c2-beacon-malicious.com",
        query_type: "A",
        resolved_ips: ["198.51.100.25"],
        response_code: "NOERROR",
        is_malicious: true,
        occurred_at: new Date().toISOString(),
      };
      const result = DnsEventSchema.safeParse(validDns);
      expect(result.success).toBe(true);
    });

    it("validates valid EmailEvent payload", () => {
      const validEmail = {
        organization_id: orgId,
        identity_id: identityId,
        sender: "phishing@malicious-sender.com",
        recipient: "victim@corp.internal",
        subject: "Action Required: Password Reset",
        action: "Delivered",
        is_phishing: true,
        threat_level: "High",
        occurred_at: new Date().toISOString(),
      };
      const result = EmailEventSchema.safeParse(validEmail);
      expect(result.success).toBe(true);
    });

    it("validates valid CloudEvent payload", () => {
      const validCloud = {
        organization_id: orgId,
        identity_id: identityId,
        cloud_provider: "AWS",
        service_name: "iam.amazonaws.com",
        event_name: "CreateAccessKey",
        caller_ip: "203.0.113.50",
        status: "Success",
        occurred_at: new Date().toISOString(),
      };
      const result = CloudEventSchema.safeParse(validCloud);
      expect(result.success).toBe(true);
    });

    it("validates valid FirewallEvent payload", () => {
      const validFw = {
        organization_id: orgId,
        asset_id: assetId,
        src_ip: "10.0.4.84",
        dst_ip: "198.51.100.25",
        src_port: 51234,
        dst_port: 443,
        protocol: "TCP",
        action: "Blocked",
        rule_name: "Block_Threat_Intel_Feed",
        occurred_at: new Date().toISOString(),
      };
      const result = FirewallEventSchema.safeParse(validFw);
      expect(result.success).toBe(true);
    });

    it("validates XdrCorrelationResultSchema and XdrFilterParamsSchema", () => {
      const validCorr = {
        organization_id: orgId,
        correlation_code: "XDR-TEST-001",
        title: "Test Threat Chain",
        description: "Correlation description",
        severity: "Critical",
        relationship_type: "temporal_killchain",
        confidence_score: 95,
        primary_entity_type: "asset",
        primary_entity_id: assetId,
        primary_entity_name: "WKSTN-TEST",
        time_window_start: new Date().toISOString(),
        time_window_end: new Date().toISOString(),
        duration_minutes: 20,
        explanation: [
          {
            step: 1,
            title: "Test Step",
            source: "endpoint",
            description: "Step description",
            timestamp: new Date().toISOString(),
            evidence: {},
          },
        ],
      };
      expect(XdrCorrelationResultSchema.safeParse(validCorr).success).toBe(true);

      const validFilters = {
        query: "phish",
        sources: ["email", "endpoint"],
        relationshipType: "temporal_killchain",
        page: 1,
        pageSize: 10,
      };
      expect(XdrFilterParamsSchema.safeParse(validFilters).success).toBe(true);

      const validSim = {
        scenarioType: "phishing_to_endpoint_c2",
        targetAssetId: assetId,
      };
      expect(SimulateXdrScenarioSchema.safeParse(validSim).success).toBe(true);
    });

    it("validates PipelineIngestionSchema with embedded multi-source telemetry", () => {
      const payload = {
        organizationId: orgId,
        assetId,
        source: "Perimeter Firewall",
        sourceType: "Firewall",
        category: "Network",
        eventType: "FIREWALL_TRAFFIC_BLOCKED",
        severity: "Critical",
        message: "Outbound C2 connection blocked by perimeter rule",
        firewall: {
          srcIp: "10.0.4.84",
          dstIp: "198.51.100.25",
          srcPort: 51234,
          dstPort: 443,
          protocol: "TCP",
          action: "Blocked",
        },
      };
      const result = PipelineIngestionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

  });

  // --------------------------------------------------------------------------
  // 2. Deterministic Correlation Engine
  // --------------------------------------------------------------------------
  describe("2. Deterministic Correlation Engine", () => {
    it("correlates identity cross-source cluster across Email, Auth, and Endpoint", () => {
      const identity: SocIdentity = {
        id: identityId,
        organization_id: orgId,
        username: "jsmith",
        display_name: "John Smith",
        email: "jsmith@corp.internal",
        domain: "corp.internal",
        account_type: "User",
        is_privileged: false,
        is_locked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const emailEvent: EmailEvent = {
        id: "email-01",
        organization_id: orgId,
        identity_id: identityId,
        sender: "attacker@spoofed.com",
        recipient: "jsmith@corp.internal",
        subject: "Invoice Attached",
        action: "Delivered",
        is_phishing: true,
        threat_level: "High",
        occurred_at: new Date(Date.now() - 15 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const authEvent: TelemetryEvent = {
        id: "auth-01",
        organization_id: orgId,
        identity_id: identityId,
        source: "Active Directory",
        source_type: "Authentication",
        category: "Authentication",
        event_type: "USER_LOGON",
        severity: "Informational",
        occurred_at: new Date(Date.now() - 10 * 60000).toISOString(),
        normalized_fields: { username: "jsmith" },
        created_at: new Date().toISOString(),
      };

      const proc: ProcessRecord = {
        id: "proc-01",
        organization_id: orgId,
        asset_id: assetId,
        identity_id: identityId,
        username: "jsmith",
        pid: 4120,
        name: "cmd.exe",
        executable_path: "C:\\Windows\\System32\\cmd.exe",
        started_at: new Date(Date.now() - 5 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const correlations = correlateMultiSourceTelemetry({
        organizationId: orgId,
        identities: [identity],
        emailEvents: [emailEvent],
        events: [authEvent],
        processes: [proc],
      });

      expect(correlations.length).toBeGreaterThan(0);
      const identityCorr = correlations.find((c) => c.relationship_type === "same_identity");
      expect(identityCorr).toBeDefined();
      expect(identityCorr!.primary_entity_id).toBe(identityId);
      expect(identityCorr!.confidence_score).toBeGreaterThanOrEqual(85);
      expect(identityCorr!.explanation.length).toBe(3);
    });

    it("correlates host killchain across Process, DNS, Network Socket, and Firewall", () => {
      const asset: Asset = {
        id: assetId,
        organization_id: orgId,
        hostname: "WKSTN-EXEC-01",
        display_name: "Executive Workstation",
        asset_type: "Endpoint",
        os_type: "Windows",
        ip_address: "10.0.4.84",
        criticality: "High",
        status: "Active",
        is_isolated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const proc: ProcessRecord = {
        id: "proc-02",
        organization_id: orgId,
        asset_id: assetId,
        pid: 8812,
        name: "powershell.exe",
        executable_path: "C:\\Windows\\System32\\powershell.exe",
        started_at: new Date(Date.now() - 10 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const dns: DnsEvent = {
        id: "dns-01",
        organization_id: orgId,
        asset_id: assetId,
        query_domain: "c2-live-beacon.net",
        query_type: "A",
        resolved_ips: ["198.51.100.45"],
        response_code: "NOERROR",
        is_malicious: true,
        occurred_at: new Date(Date.now() - 8 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const socket: NetworkConnectionRecord = {
        id: "sock-01",
        organization_id: orgId,
        asset_id: assetId,
        src_ip: "10.0.4.84",
        dst_ip: "198.51.100.45",
        src_port: 49200,
        dst_port: 443,
        protocol: "TCP",
        direction: "Outbound",
        status: "Established",
        bytes_sent: 1024,
        bytes_received: 2048,
        duration_ms: 120,
        started_at: new Date(Date.now() - 6 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const fw: FirewallEvent = {
        id: "fw-01",
        organization_id: orgId,
        asset_id: assetId,
        src_ip: "10.0.4.84",
        dst_ip: "198.51.100.45",
        src_port: 49200,
        dst_port: 443,
        protocol: "TCP",
        action: "Allowed",
        rule_name: "Default_Egress",
        occurred_at: new Date(Date.now() - 5 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const correlations = correlateMultiSourceTelemetry({
        organizationId: orgId,
        assets: [asset],
        processes: [proc],
        dnsEvents: [dns],
        networkConnections: [socket],
        firewallEvents: [fw],
      });

      expect(correlations.length).toBeGreaterThan(0);
      const hostCorr = correlations.find((c) => c.primary_entity_type === "asset");
      expect(hostCorr).toBeDefined();
      expect(hostCorr!.primary_entity_id).toBe(assetId);
      expect(hostCorr!.shared_identifiers.ips).toContain("10.0.4.84");
      expect(hostCorr!.shared_identifiers.ips).toContain("198.51.100.45");
      expect(hostCorr!.shared_identifiers.domains).toContain("c2-live-beacon.net");
    });

    it("correlates external IP linkage across DNS, Socket, Firewall, and Cloud", () => {
      const externalIp = "198.51.100.99";

      const dns: DnsEvent = {
        id: "dns-02",
        organization_id: orgId,
        query_domain: "exfil-gateway.io",
        query_type: "A",
        resolved_ips: [externalIp],
        response_code: "NOERROR",
        is_malicious: true,
        occurred_at: new Date(Date.now() - 12 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const fw: FirewallEvent = {
        id: "fw-02",
        organization_id: orgId,
        src_ip: "10.0.1.20",
        dst_ip: externalIp,
        src_port: 50123,
        dst_port: 443,
        protocol: "TCP",
        action: "Blocked",
        rule_name: "Block_High_Risk_Destinations",
        occurred_at: new Date(Date.now() - 8 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const cloud: CloudEvent = {
        id: "cloud-01",
        organization_id: orgId,
        cloud_provider: "AWS",
        service_name: "s3.amazonaws.com",
        event_name: "GetObject",
        caller_ip: externalIp,
        status: "Success",
        occurred_at: new Date(Date.now() - 4 * 60000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const correlations = correlateMultiSourceTelemetry({
        organizationId: orgId,
        dnsEvents: [dns],
        firewallEvents: [fw],
        cloudEvents: [cloud],
      });

      expect(correlations.length).toBeGreaterThan(0);
      const ipCorr = correlations.find((c) => c.primary_entity_type === "ip" && c.primary_entity_id === externalIp);
      expect(ipCorr).toBeDefined();
      expect(ipCorr!.relationship_type).toBe("same_ip");
      expect(ipCorr!.source_counts.dns).toBe(1);
      expect(ipCorr!.source_counts.firewall).toBe(1);
      expect(ipCorr!.source_counts.cloud).toBe(1);
    });

    it("correlates multi-alert clusters on the same host entity", () => {
      const alert1: Alert = {
        id: "alt-01",
        organization_id: orgId,
        alert_code: "ALT-2026-001",
        title: "Malicious Process Masquerading",
        description: "cmd.exe in temp directory",
        severity: "High",
        risk_score: 85,
        status: "Open",
        source: "EDR Agent",
        occurred_at: new Date(Date.now() - 10 * 60000).toISOString(),
        asset_id: assetId,
        dedup_key: "dedup-01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const alert2: Alert = {
        id: "alt-02",
        organization_id: orgId,
        alert_code: "ALT-2026-002",
        title: "C2 Beaconing Detected",
        description: "Repetitive outbound HTTPS connections",
        severity: "Critical",
        risk_score: 95,
        status: "Open",
        source: "Network Sensor",
        occurred_at: new Date(Date.now() - 5 * 60000).toISOString(),
        asset_id: assetId,
        dedup_key: "dedup-02",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const correlations = correlateMultiSourceTelemetry({
        organizationId: orgId,
        alerts: [alert1, alert2],
      });

      expect(correlations.length).toBeGreaterThan(0);
      const alertCorr = correlations.find((c) => c.relationship_type === "related_alert");
      expect(alertCorr).toBeDefined();
      expect(alertCorr!.related_alert_ids).toContain("alt-01");
      expect(alertCorr!.related_alert_ids).toContain("alt-02");
    });
  });


  // --------------------------------------------------------------------------
  // 3. Multi-Source Educational Simulation Scenarios
  // --------------------------------------------------------------------------
  describe("3. Simulation Scenario Generators", () => {
    it("generates valid payloads for phishing_to_endpoint_c2 scenario", () => {
      const scenario = XDR_SIMULATION_SCENARIOS.phishing_to_endpoint_c2;
      const payloads = scenario.generatePayloads({
        organizationId: orgId,
        targetAssetId: assetId,
        targetIdentityId: identityId,
      });

      expect(payloads.length).toBe(5);
      expect(payloads[0]!.email).toBeDefined();
      expect(payloads[1]!.category).toBe("Authentication");
      expect(payloads[2]!.process).toBeDefined();
      expect(payloads[3]!.dns).toBeDefined();
      expect(payloads[4]!.firewall).toBeDefined();
    });

    it("generates valid payloads for cloud_credential_theft_and_exfil scenario", () => {
      const scenario = XDR_SIMULATION_SCENARIOS.cloud_credential_theft_and_exfil;
      const payloads = scenario.generatePayloads({
        organizationId: orgId,
        targetAssetId: assetId,
        targetIdentityId: identityId,
      });

      expect(payloads.length).toBe(4);
      expect(payloads[2]!.cloud).toBeDefined();
      expect(payloads[3]!.cloud).toBeDefined();
    });

    it("generates valid payloads for ransomware_precursor_chain scenario", () => {
      const scenario = XDR_SIMULATION_SCENARIOS.ransomware_precursor_chain;
      const payloads = scenario.generatePayloads({
        organizationId: orgId,
        targetAssetId: assetId,
        targetIdentityId: identityId,
      });

      expect(payloads.length).toBe(4);
      expect(payloads[0]!.usb).toBeDefined();
      expect(payloads[1]!.process).toBeDefined();
      expect(payloads[2]!.registry).toBeDefined();
      expect(payloads[3]!.firewall).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Normalization and Timeline Compiler
  // --------------------------------------------------------------------------
  describe("4. Normalization & Timeline Compilation", () => {
    it("normalizes multi-source raw payloads into canonical database packages", () => {
      const rawPayload = {
        source: "DNS Server",
        sourceType: "DNS",
        category: "DNS",
        eventType: "DNS_RESOLVE",
        severity: "Medium" as const,
        message: "Resolved external domain",
        dns: {
          queryDomain: "malicious-c2.org",
          queryType: "A" as const,
          resolvedIps: ["198.51.100.10"],
          responseCode: "NOERROR",
          isMalicious: true,
        },
      };

      const normalized = normalizeTelemetryPayload(orgId, rawPayload, { assetId });
      expect(normalized.event).toBeDefined();
      expect(normalized.log).toBeDefined();
      expect(normalized.dns).toBeDefined();
      expect(normalized.dns!.query_domain).toBe("malicious-c2.org");
      expect(normalized.dns!.is_malicious).toBe(true);
    });

    it("compiles and chronologically sorts cross-source timeline", () => {
      const correlation = {
        id: "corr-test",
        organization_id: orgId,
        correlation_code: "XDR-TEST-01",
        title: "Test Chain",
        description: "Test description",
        severity: "High" as const,
        relationship_type: "temporal_killchain" as const,
        confidence_score: 90,
        primary_entity_type: "asset" as const,
        primary_entity_id: assetId,
        primary_entity_name: "TEST-HOST",
        time_window_start: new Date().toISOString(),
        time_window_end: new Date().toISOString(),
        duration_minutes: 15,
        explanation: [],
        shared_identifiers: {},
        source_counts: {},
        matched_event_ids: [],
        related_asset_ids: [],
        related_identity_ids: [],
        related_alert_ids: [],
        status: "Active" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const timeline = compileXdrTimeline({
        correlation,
        dnsEvents: [
          {
            id: "dns-t1",
            organization_id: orgId,
            query_domain: "test.com",
            query_type: "A",
            response_code: "NOERROR",
            is_malicious: false,
            occurred_at: new Date("2026-09-18T05:10:00Z").toISOString(),
            created_at: new Date().toISOString(),
          },
        ],
        emailEvents: [
          {
            id: "mail-t1",
            organization_id: orgId,
            sender: "a@b.com",
            recipient: "c@d.com",
            subject: "Test",
            action: "Delivered",
            is_phishing: false,
            threat_level: "Low",
            occurred_at: new Date("2026-09-18T05:00:00Z").toISOString(),
            created_at: new Date().toISOString(),
          },
        ],
        cloudEvents: [],
        firewallEvents: [
          {
            id: "fw-t1",
            organization_id: orgId,
            src_ip: "10.0.0.1",
            dst_ip: "198.51.100.1",
            src_port: 1000,
            dst_port: 80,
            protocol: "TCP",
            action: "Allowed",
            occurred_at: new Date("2026-09-18T05:20:00Z").toISOString(),
            created_at: new Date().toISOString(),
          },
        ],
        processes: [],
        networkConnections: [],
        events: [],
        logs: [],
      });

      expect(timeline.length).toBe(3);
      // Most recent first: 05:20 (firewall) -> 05:10 (dns) -> 05:00 (email)
      expect(timeline[0]!.source).toBe("firewall");
      expect(timeline[1]!.source).toBe("dns");
      expect(timeline[2]!.source).toBe("email");
    });
  });
});
