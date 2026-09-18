/**
 * Phase 18 XDR Simulation Scenarios
 *
 * Provides safe, educational, defensive synthetic scenarios that generate
 * cross-source telemetry across Email, Identity/Auth, Endpoint, DNS, Cloud, Network, and Firewall.
 *
 * All payloads strictly pass through the canonical Phase 13 ingestion pipeline.
 */

import type { XdrSimulationScenarioType, PipelineBatchResult } from "@vrsoc/types";
import type { PipelineIngestionInput } from "@vrsoc/validation";
import { processTelemetryBatch } from "@/lib/pipeline/orchestrator";

export interface XdrScenarioDefinition {
  type: XdrSimulationScenarioType;
  title: string;
  description: string;
  sourcesInvolved: string[];
  generatePayloads: (options: {
    organizationId: string;
    targetAssetId: string;
    targetIdentityId: string;
    hostname?: string;
    username?: string;
    ipAddress?: string;
  }) => PipelineIngestionInput[];
}

export const XDR_SIMULATION_SCENARIOS: Record<XdrSimulationScenarioType, XdrScenarioDefinition> = {
  // 1. Phishing Email ➔ User Auth ➔ Endpoint Masquerading ➔ DNS C2 ➔ Outbound Socket ➔ Firewall
  phishing_to_endpoint_c2: {
    type: "phishing_to_endpoint_c2",
    title: "Phishing to Endpoint Masquerading & C2 Callback",
    description: "Simulates an inbound phishing email leading to user logon, cmd.exe execution from %TEMP%, DNS resolution of a C2 domain, and outbound HTTPS traffic.",
    sourcesInvolved: ["Email", "Authentication", "Endpoint", "DNS", "Network", "Firewall"],
    generatePayloads: ({ organizationId, targetAssetId, targetIdentityId, hostname = "WKSTN-FIN-04", username = "jdoe", ipAddress = "10.0.4.84" }) => {
      const now = Date.now();
      const t1 = new Date(now - 15 * 60000).toISOString();
      const t2 = new Date(now - 12 * 60000).toISOString();
      const t3 = new Date(now - 10 * 60000).toISOString();
      const t4 = new Date(now - 8 * 60000).toISOString();
      const t5 = new Date(now - 5 * 60000).toISOString();

      return [
        // Step 1: Inbound Phishing Email
        {
          organizationId,
          identityId: targetIdentityId,
          source: "Email Gateway",
          sourceType: "Email",
          category: "Email",
          eventType: "EMAIL_DELIVERED",
          severity: "Medium",
          occurredAt: t1,
          message: `Inbound email from 'payroll-notification@secure-portal-corp.com' delivered to '${username}@enterprise.corp' with attachment 'invoice_q3.pdf.exe'`,
          normalizedFields: {
            sender: "payroll-notification@secure-portal-corp.com",
            recipient: `${username}@enterprise.corp`,
            subject: "Urgent: Q3 Payroll Review Notice",
            attachment: "invoice_q3.pdf.exe",
          },
          email: {
            sender: "payroll-notification@secure-portal-corp.com",
            recipient: `${username}@enterprise.corp`,
            subject: "Urgent: Q3 Payroll Review Notice",
            attachmentName: "invoice_q3.pdf.exe",
            attachmentSha256: "8e94a8f9c6d3b4e1a0b5c7d8e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
            attachmentSizeBytes: 245760,
            action: "Delivered",
            isPhishing: true,
            threatLevel: "High",
          },
        },
        // Step 2: User Logon
        {
          organizationId,
          assetId: targetAssetId,
          identityId: targetIdentityId,
          source: "Active Directory",
          sourceType: "Authentication",
          category: "Authentication",
          eventType: "USER_LOGON_SUCCESS",
          severity: "Informational",
          occurredAt: t2,
          message: `User '${username}' successfully logged on to host '${hostname}' (Logon Type: Interactive)`,
          normalizedFields: {
            username,
            hostname,
            logonType: "Interactive",
            authStatus: "SUCCESS",
          },
        },
        // Step 3: Endpoint Masquerading Execution
        {
          organizationId,
          assetId: targetAssetId,
          identityId: targetIdentityId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Process",
          eventType: "PROCESS_SPAWNED",
          severity: "High",
          occurredAt: t3,
          message: `Process 'cmd.exe' spawned from anomalous path 'C:\\Users\\${username}\\AppData\\Local\\Temp\\invoice_q3.pdf.exe'`,
          normalizedFields: {
            processName: "cmd.exe",
            executablePath: `C:\\Users\\${username}\\AppData\\Local\\Temp\\invoice_q3.pdf.exe`,
            parentProcess: "explorer.exe",
            integrityLevel: "Medium",
          },
          process: {
            name: "cmd.exe",
            executablePath: `C:\\Users\\${username}\\AppData\\Local\\Temp\\invoice_q3.pdf.exe`,
            commandLine: `cmd.exe /c powershell -nop -w hidden -enc JABjAGwAaQ...`,
            sha256: "8e94a8f9c6d3b4e1a0b5c7d8e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
            integrityLevel: "Medium",
          },
        },
        // Step 4: DNS Resolution of C2 Domain
        {
          organizationId,
          assetId: targetAssetId,
          source: "DNS Server",
          sourceType: "DNS",
          category: "DNS",
          eventType: "DNS_QUERY_RESOLVED",
          severity: "Medium",
          occurredAt: t4,
          message: `Host '${hostname}' queried domain 'cdn-update-secure.net' resolving to '198.51.100.45'`,
          normalizedFields: {
            queryDomain: "cdn-update-secure.net",
            queryType: "A",
            resolvedIp: "198.51.100.45",
          },
          dns: {
            queryDomain: "cdn-update-secure.net",
            queryType: "A",
            resolvedIps: ["198.51.100.45"],
            responseCode: "NOERROR",
            isMalicious: true,
            threatCategory: "C2_Domain",
          },
        },
        // Step 5: Network Socket & Firewall Log
        {
          organizationId,
          assetId: targetAssetId,
          source: "Perimeter Firewall",
          sourceType: "Firewall",
          category: "Network",
          eventType: "FIREWALL_TRAFFIC_ALLOWED",
          severity: "High",
          occurredAt: t5,
          message: `Outbound HTTPS connection from '${ipAddress}:49822' to '198.51.100.45:443' evaluated under rule 'Default_Egress_Allow'`,
          normalizedFields: {
            srcIp: ipAddress,
            dstIp: "198.51.100.45",
            srcPort: 49822,
            dstPort: 443,
            protocol: "TCP",
            action: "Allowed",
          },
          network: {
            srcIp: ipAddress,
            dstIp: "198.51.100.45",
            srcPort: 49822,
            dstPort: 443,
            protocol: "TCP",
            direction: "Outbound",
            status: "Established",
          },
          firewall: {
            srcIp: ipAddress,
            dstIp: "198.51.100.45",
            srcPort: 49822,
            dstPort: 443,
            protocol: "TCP",
            action: "Allowed",
            ruleName: "Default_Egress_Allow",
            bytesTransferred: 14820,
            threatName: "Suspected_C2_Beacon",
          },
        },
      ];
    },
  },

  // 2. Cloud Credential Theft & S3 Data Exfiltration
  cloud_credential_theft_and_exfil: {
    type: "cloud_credential_theft_and_exfil",
    title: "Cloud Credential Access & Data Exfiltration",
    description: "Simulates multiple failed authentications followed by anomalous cloud access key generation and high-volume S3 data retrieval.",
    sourcesInvolved: ["Identity Provider", "Authentication", "Cloud", "Firewall"],
    generatePayloads: ({ organizationId, targetIdentityId, username = "admin.cloud", ipAddress = "203.0.113.88" }) => {
      const now = Date.now();
      const t1 = new Date(now - 20 * 60000).toISOString();
      const t2 = new Date(now - 14 * 60000).toISOString();
      const t3 = new Date(now - 10 * 60000).toISOString();
      const t4 = new Date(now - 3 * 60000).toISOString();

      return [
        // Step 1: Failed Login Anomaly
        {
          organizationId,
          identityId: targetIdentityId,
          source: "Identity Provider",
          sourceType: "Authentication",
          category: "Authentication",
          eventType: "AUTH_BRUTE_FORCE_ATTEMPT",
          severity: "High",
          occurredAt: t1,
          message: `Repeated failed authentication attempts (5 failures) for user '${username}' from external IP '${ipAddress}'`,
          normalizedFields: {
            username,
            callerIp: ipAddress,
            failureCount: 5,
            authStatus: "FAILURE",
          },
        },
        // Step 2: Successful Sign-in from Anomalous Geo
        {
          organizationId,
          identityId: targetIdentityId,
          source: "Identity Provider",
          sourceType: "Authentication",
          category: "Authentication",
          eventType: "AUTH_SUCCESS_ANOMALOUS_IP",
          severity: "High",
          occurredAt: t2,
          message: `Single Sign-On success for privileged identity '${username}' originating from unverified IP '${ipAddress}'`,
          normalizedFields: {
            username,
            callerIp: ipAddress,
            authStatus: "SUCCESS",
          },
        },
        // Step 3: Cloud IAM Access Key Creation
        {
          organizationId,
          identityId: targetIdentityId,
          source: "Cloud Audit",
          sourceType: "Cloud",
          category: "Cloud",
          eventType: "CLOUD_IAM_KEY_CREATED",
          severity: "High",
          occurredAt: t3,
          message: `AWS IAM CreateAccessKey API invoked for account '${username}' from IP '${ipAddress}'`,
          normalizedFields: {
            provider: "AWS",
            service: "iam.amazonaws.com",
            eventName: "CreateAccessKey",
            callerIp: ipAddress,
          },
          cloud: {
            cloudProvider: "AWS",
            serviceName: "iam.amazonaws.com",
            eventName: "CreateAccessKey",
            callerIp: ipAddress,
            region: "us-east-1",
            status: "Success",
            requestParameters: { userName: username },
          },
        },
        // Step 4: S3 Bulk Data Download
        {
          organizationId,
          identityId: targetIdentityId,
          source: "Cloud Audit",
          sourceType: "Cloud",
          category: "Cloud",
          eventType: "CLOUD_S3_BULK_GET",
          severity: "Critical",
          occurredAt: t4,
          message: `AWS S3 GetObject batch download of 1,200 financial objects from bucket 'corp-financial-backups' by IP '${ipAddress}'`,
          normalizedFields: {
            provider: "AWS",
            service: "s3.amazonaws.com",
            eventName: "GetObject",
            bucketName: "corp-financial-backups",
            callerIp: ipAddress,
          },
          cloud: {
            cloudProvider: "AWS",
            serviceName: "s3.amazonaws.com",
            eventName: "GetObject",
            callerIp: ipAddress,
            region: "us-east-1",
            resourceArn: "arn:aws:s3:::corp-financial-backups/*",
            status: "Success",
          },
        },
      ];
    },
  },

  // 3. Lateral Movement & Active Directory Reconnaissance
  lateral_movement_and_domain_recon: {
    type: "lateral_movement_and_domain_recon",
    title: "Lateral Movement & Domain Controller Recon",
    description: "Simulates Kerberos ticket requests, remote PsExec service installation on a domain controller, and internal SMB port scanning.",
    sourcesInvolved: ["Authentication", "Endpoint", "Network", "DNS"],
    generatePayloads: ({ organizationId, targetAssetId, targetIdentityId, hostname = "DC-PRIMARY-01", username = "svc_deploy", ipAddress = "10.0.1.10" }) => {
      const now = Date.now();
      const t1 = new Date(now - 12 * 60000).toISOString();
      const t2 = new Date(now - 9 * 60000).toISOString();
      const t3 = new Date(now - 6 * 60000).toISOString();
      const t4 = new Date(now - 2 * 60000).toISOString();

      return [
        // Step 1: Kerberos Ticket Request
        {
          organizationId,
          assetId: targetAssetId,
          identityId: targetIdentityId,
          source: "Active Directory",
          sourceType: "Authentication",
          category: "Authentication",
          eventType: "KERBEROS_TGS_REQUEST",
          severity: "Medium",
          occurredAt: t1,
          message: `Kerberos TGS ticket requested for SPN 'cifs/DC-PRIMARY-01.corp.internal' by account '${username}'`,
          normalizedFields: {
            username,
            spn: "cifs/DC-PRIMARY-01.corp.internal",
            ticketOptions: "0x40810000",
          },
        },
        // Step 2: Remote Service Installation (PsExec)
        {
          organizationId,
          assetId: targetAssetId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Persistence",
          eventType: "SERVICE_INSTALLED",
          severity: "High",
          occurredAt: t2,
          message: `New system service 'PSEXESVC' installed pointing to 'C:\\Windows\\PSEXESVC.exe'`,
          normalizedFields: {
            serviceName: "PSEXESVC",
            binaryPath: "C:\\Windows\\PSEXESVC.exe",
            startType: "Auto",
          },
          service: {
            serviceName: "PSEXESVC",
            displayName: "PsExec Remote Execution Service",
            executablePath: "C:\\Windows\\PSEXESVC.exe",
            startType: "Auto",
            status: "Running",
            action: "Installed",
          },
        },
        // Step 3: Internal DNS SRV Query
        {
          organizationId,
          assetId: targetAssetId,
          source: "DNS Server",
          sourceType: "DNS",
          category: "DNS",
          eventType: "DNS_SRV_QUERY",
          severity: "Low",
          occurredAt: t3,
          message: `Host '${hostname}' performed SRV query for '_ldap._tcp.dc._msdcs.corp.internal'`,
          normalizedFields: {
            queryDomain: "_ldap._tcp.dc._msdcs.corp.internal",
            queryType: "SRV",
          },
          dns: {
            queryDomain: "_ldap._tcp.dc._msdcs.corp.internal",
            queryType: "SRV",
            resolvedIps: ["10.0.1.10", "10.0.1.11"],
            responseCode: "NOERROR",
          },
        },
        // Step 4: Internal SMB Network Sweep
        {
          organizationId,
          assetId: targetAssetId,
          source: "Zeek",
          sourceType: "Network",
          category: "Network",
          eventType: "NETWORK_SMB_LATERAL_FLOW",
          severity: "High",
          occurredAt: t4,
          message: `High-frequency SMB connections (Port 445) from '${ipAddress}' to multiple internal subnets (10.0.2.0/24)`,
          normalizedFields: {
            srcIp: ipAddress,
            dstPort: 445,
            protocol: "TCP",
            direction: "Lateral",
          },
          network: {
            srcIp: ipAddress,
            dstIp: "10.0.2.55",
            srcPort: 52140,
            dstPort: 445,
            protocol: "TCP",
            direction: "Lateral",
            status: "Established",
          },
        },
      ];
    },
  },

  // 4. Ransomware Precursor Chain (USB ➔ Shadow Copy Deletion ➔ Run Key ➔ C2 Block)
  ransomware_precursor_chain: {
    type: "ransomware_precursor_chain",
    title: "Ransomware Precursor: USB Drop to Perimeter Block",
    description: "Simulates an unauthorized USB device insertion, vssadmin shadow copy deletion, registry run persistence, and a blocked perimeter C2 connection.",
    sourcesInvolved: ["Endpoint", "PnP Manager", "DNS", "Firewall"],
    generatePayloads: ({ organizationId, targetAssetId, hostname = "SRV-DATA-02", ipAddress = "10.0.2.14" }) => {
      const now = Date.now();
      const t1 = new Date(now - 14 * 60000).toISOString();
      const t2 = new Date(now - 11 * 60000).toISOString();
      const t3 = new Date(now - 8 * 60000).toISOString();
      const t4 = new Date(now - 3 * 60000).toISOString();

      return [
        // Step 1: USB Insertion
        {
          organizationId,
          assetId: targetAssetId,
          source: "PnP Manager",
          sourceType: "Endpoint",
          category: "Hardware",
          eventType: "USB_DEVICE_INSERTED",
          severity: "Medium",
          occurredAt: t1,
          message: `Removable USB Mass Storage device 'Kingston DataTraveler 3.0' connected to '${hostname}' (Drive: E:)`,
          normalizedFields: {
            deviceName: "Kingston DataTraveler 3.0",
            driveLetter: "E:",
            vendorId: "0951",
            productId: "1666",
          },
          usb: {
            deviceName: "Kingston DataTraveler 3.0",
            vendorId: "0951",
            productId: "1666",
            driveLetter: "E:",
            action: "Connected",
          },
        },
        // Step 2: Shadow Copy Deletion via vssadmin
        {
          organizationId,
          assetId: targetAssetId,
          source: "VSS Admin",
          sourceType: "Endpoint",
          category: "Execution",
          eventType: "SHADOW_COPIES_DELETED",
          severity: "Critical",
          occurredAt: t2,
          message: `Command 'vssadmin.exe delete shadows /all /quiet' executed on '${hostname}' to inhibit system recovery`,
          normalizedFields: {
            processName: "vssadmin.exe",
            commandLine: "vssadmin.exe delete shadows /all /quiet",
          },
          process: {
            name: "vssadmin.exe",
            executablePath: "C:\\Windows\\System32\\vssadmin.exe",
            commandLine: "vssadmin.exe delete shadows /all /quiet",
            integrityLevel: "High",
          },
        },
        // Step 3: Registry Run Key Persistence
        {
          organizationId,
          assetId: targetAssetId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Persistence",
          eventType: "REGISTRY_RUN_KEY_CREATED",
          severity: "High",
          occurredAt: t3,
          message: `Registry Run value 'WinUpdateSync' added under HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run pointing to 'C:\\ProgramData\\updater.exe'`,
          normalizedFields: {
            hive: "HKLM",
            keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            valueName: "WinUpdateSync",
          },
          registry: {
            hive: "HKLM",
            keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            valueName: "WinUpdateSync",
            valueData: "C:\\ProgramData\\updater.exe",
            action: "Created",
          },
        },
        // Step 4: Perimeter Firewall Block
        {
          organizationId,
          assetId: targetAssetId,
          source: "Perimeter Firewall",
          sourceType: "Firewall",
          category: "Network",
          eventType: "FIREWALL_TRAFFIC_BLOCKED",
          severity: "Critical",
          occurredAt: t4,
          message: `Outbound connection from '${ipAddress}:50114' to known ransomware C2 IP '185.220.101.5:8080' blocked by Rule 'Block_Known_Threat_Feeds'`,
          normalizedFields: {
            srcIp: ipAddress,
            dstIp: "185.220.101.5",
            dstPort: 8080,
            action: "Blocked",
          },
          firewall: {
            srcIp: ipAddress,
            dstIp: "185.220.101.5",
            srcPort: 50114,
            dstPort: 8080,
            protocol: "TCP",
            action: "Blocked",
            ruleName: "Block_Known_Threat_Feeds",
            threatName: "Known_Ransomware_C2",
          },
        },
      ];
    },
  },
};

/**
 * Executes a simulated multi-source XDR scenario and passes all telemetry through the Phase 13 pipeline.
 */
export async function executeXdrSimulationScenario(options: {
  organizationId: string;
  scenarioType: XdrSimulationScenarioType;
  targetAssetId?: string;
  targetIdentityId?: string;
}): Promise<PipelineBatchResult> {
  const scenario = XDR_SIMULATION_SCENARIOS[options.scenarioType];
  if (!scenario) {
    throw new Error(`Unknown XDR simulation scenario type: ${options.scenarioType}`);
  }

  const assetId = options.targetAssetId || "00000000-0000-0000-0000-000000000001";
  const identityId = options.targetIdentityId || "00000000-0000-0000-0000-000000000002";

  const payloads = scenario.generatePayloads({
    organizationId: options.organizationId,
    targetAssetId: assetId,
    targetIdentityId: identityId,
  });

  return await processTelemetryBatch(payloads, {
    skipDeduplication: true,
  });
}
