/**
 * EDR Educational Simulation Scenarios
 *
 * Generates synthetic, safe endpoint activity bursts conforming to canonical
 * telemetry contracts. All simulations feed directly into the Phase 13
 * pipeline orchestrator (Validation → Parsing → Normalization → Enrichment → Persistence).
 *
 * ABSOLUTE SAFETY INVARIANT:
 * Contains NO offensive exploits, malware payload generation, real credential theft,
 * or host shell executions.
 */

import { processTelemetryBatch } from "@/lib/pipeline/orchestrator";
import type { PipelineIngestionInput } from "@vrsoc/validation";
import type { EdrSimulationScenarioType, PipelineBatchResult } from "@vrsoc/types";

export interface GenerateEdrScenarioOptions {
  organizationId: string;
  assetId: string;
  agentId?: string | null;
  hostname?: string;
}

/**
 * Generates and executes an educational EDR simulation scenario on a target asset.
 */
export async function runEdrSimulationScenario(
  scenarioType: EdrSimulationScenarioType,
  context: GenerateEdrScenarioOptions
): Promise<PipelineBatchResult> {
  const payloads = generateScenarioPayloads(scenarioType, context);
  return await processTelemetryBatch(payloads);
}

/**
 * Compiles synthetic telemetry payloads for a given educational scenario.
 */
export function generateScenarioPayloads(
  scenarioType: EdrSimulationScenarioType,
  context: GenerateEdrScenarioOptions
): PipelineIngestionInput[] {
  const { organizationId, assetId, agentId, hostname = "WORKSTATION-01" } = context;
  const now = new Date();
  const getOffsetTime = (secondsAgo: number) =>
    new Date(now.getTime() - secondsAgo * 1000).toISOString();

  switch (scenarioType) {
    case "process_masquerading": {
      // 1. Parent process (powershell) spawns masqueraded svchost.exe from Temp
      const parentPid = 4820;
      const childPid = 5912;
      return [
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Process Activity",
          eventType: "PROCESS_SPAWNED",
          severity: "Low",
          occurredAt: getOffsetTime(120),
          message: `Process powershell.exe (PID: ${parentPid}) launched by analyst.`,
          sourceHost: hostname,
          process: {
            name: "powershell.exe",
            executablePath: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
            commandLine: "powershell.exe -ExecutionPolicy Bypass",
            sha256: "9b9090623a31e860959a72491a92a548abfa419fe0e7f7ca7d2d3a339908cfcb",
            integrityLevel: "Medium",
          },
        },
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Process Activity",
          eventType: "SUSPICIOUS_PROCESS_MASQUERADING",
          severity: "High",
          occurredAt: getOffsetTime(60),
          message: `Masqueraded binary svchost.exe (PID: ${childPid}) spawned from non-standard directory C:\\Users\\Public\\Temp\\svchost.exe with parent powershell.exe.`,
          sourceHost: hostname,
          process: {
            name: "svchost.exe",
            executablePath: "C:\\Users\\Public\\Temp\\svchost.exe",
            commandLine: "C:\\Users\\Public\\Temp\\svchost.exe -k netsvcs",
            sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            integrityLevel: "High",
          },
        },
      ];
    }

    case "registry_run_persistence": {
      return [
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Registry Activity",
          eventType: "REGISTRY_KEY_MODIFIED",
          severity: "High",
          occurredAt: getOffsetTime(45),
          message: `Autorun persistence key added in HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run pointing to C:\\Users\\Public\\updater.exe`,
          sourceHost: hostname,
          registry: {
            hive: "HKCU",
            keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            valueName: "WindowsUpdateAssist",
            valueData: "C:\\Users\\Public\\updater.exe --silent",
            valueType: "REG_SZ",
            action: "Created",
          },
          process: {
            name: "reg.exe",
            executablePath: "C:\\Windows\\System32\\reg.exe",
            commandLine: 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v WindowsUpdateAssist /t REG_SZ /d "C:\\Users\\Public\\updater.exe --silent" /f',
            sha256: "f2c45e69e46a3b2b4e805d76d4982631a0e1c070f6f966b9d6a36f866465492d",
            integrityLevel: "Medium",
          },
        },
      ];
    }

    case "suspicious_file_drop": {
      return [
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "File Activity",
          eventType: "FILE_CREATED",
          severity: "Medium",
          occurredAt: getOffsetTime(90),
          message: `Executable file dropped into AppData Temp folder: invoice_march_2026.pdf.exe`,
          sourceHost: hostname,
          file: {
            path: "C:\\Users\\JohnDoe\\AppData\\Local\\Temp\\invoice_march_2026.pdf.exe",
            name: "invoice_march_2026.pdf.exe",
            extension: "exe",
            sizeBytes: 458752,
            sha256: "5d41402abc4b2a76b9719d911017c592b0e7e0e7a4b0870ecb6f3c1a96c3f684",
            isExecutable: true,
            isHidden: false,
          },
        },
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "File Activity",
          eventType: "FILE_MODIFIED",
          severity: "High",
          occurredAt: getOffsetTime(30),
          message: `Multiple documents rapidly modified and renamed with .locked extension in Documents directory.`,
          sourceHost: hostname,
          file: {
            path: "C:\\Users\\JohnDoe\\Documents\\Financial_Q1_Report.xlsx.locked",
            name: "Financial_Q1_Report.xlsx.locked",
            extension: "locked",
            sizeBytes: 1048576,
            sha256: "8f434346648f6b96df89dda901c5176b10e6d76ef61fced01388d2cb59a0f962",
            isExecutable: false,
            isHidden: false,
          },
        },
      ];
    }

    case "c2_network_beaconing": {
      return [
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Network Activity",
          eventType: "NETWORK_CONNECTION_ESTABLISHED",
          severity: "High",
          occurredAt: getOffsetTime(80),
          message: `Repeated outbound HTTPS connection to suspicious external IP 198.51.100.45:8443 at regular 30-second beacon intervals.`,
          sourceHost: hostname,
          network: {
            srcIp: "10.0.4.84",
            dstIp: "198.51.100.45",
            srcPort: 51234,
            dstPort: 8443,
            protocol: "HTTPS",
            direction: "Outbound",
            status: "Established",
          },
          process: {
            name: "svchost.exe",
            executablePath: "C:\\Users\\Public\\Temp\\svchost.exe",
            commandLine: "C:\\Users\\Public\\Temp\\svchost.exe -k netsvcs",
            sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            integrityLevel: "High",
          },
        },
      ];
    }

    case "malicious_service_install": {
      return [
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Service Activity",
          eventType: "SERVICE_CREATED",
          severity: "Critical",
          occurredAt: getOffsetTime(50),
          message: `New system service installed with unquoted path: WindowsSecurityHealthHelper -> C:\\Users\\Public\\secservice.exe`,
          sourceHost: hostname,
          service: {
            serviceName: "WindowsSecurityHealthHelper",
            displayName: "Windows Security Health Telemetry Helper",
            executablePath: "C:\\Users\\Public\\secservice.exe",
            startType: "Auto",
            status: "Running",
            action: "Installed",
            accountName: "LocalSystem",
          },
          process: {
            name: "sc.exe",
            executablePath: "C:\\Windows\\System32\\sc.exe",
            commandLine: 'sc.exe create "WindowsSecurityHealthHelper" binPath= "C:\\Users\\Public\\secservice.exe" start= auto',
            sha256: "3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b8552",
            integrityLevel: "High",
          },
        },
      ];
    }

    case "scheduled_task_creation": {
      return [
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Scheduled Tasks",
          eventType: "SCHEDULED_TASK_CREATED",
          severity: "High",
          occurredAt: getOffsetTime(40),
          message: `New scheduled task created: \\Microsoft\\Windows\\Maintenance\\DiskCleanupScheduler running encoded script at logon.`,
          sourceHost: hostname,
          scheduledTask: {
            taskName: "DiskCleanupScheduler",
            taskPath: "\\Microsoft\\Windows\\Maintenance\\",
            action: "Created",
            command: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
            arguments: "-NonInteractive -WindowStyle Hidden -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA...",
            runAsUser: "NT AUTHORITY\\SYSTEM",
            triggerType: "AtLogon",
          },
          process: {
            name: "schtasks.exe",
            executablePath: "C:\\Windows\\System32\\schtasks.exe",
            commandLine: 'schtasks /create /tn "\\Microsoft\\Windows\\Maintenance\\DiskCleanupScheduler" /tr "powershell.exe -Enc ..." /sc onlogon /ru "SYSTEM"',
            sha256: "1f83f343e18f60868f32aa6e6194ee37e1d45e3b2e532b7ac5f149e814e67785",
            integrityLevel: "High",
          },
        },
      ];
    }

    case "startup_folder_hijack": {
      return [
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Startup Items",
          eventType: "STARTUP_ITEM_ADDED",
          severity: "Medium",
          occurredAt: getOffsetTime(35),
          message: `Startup folder item added: StartupHelper.lnk pointing to C:\\Users\\Public\\sync.vbs`,
          sourceHost: hostname,
          startupItem: {
            name: "StartupHelper.lnk",
            locationType: "StartupFolder",
            locationPath: "C:\\Users\\JohnDoe\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\StartupHelper.lnk",
            command: "wscript.exe C:\\Users\\Public\\sync.vbs",
            userContext: "JohnDoe",
            action: "Added",
          },
        },
      ];
    }

    case "unauthorized_usb_insertion": {
      return [
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "USB Activity",
          eventType: "USB_DEVICE_CONNECTED",
          severity: "Medium",
          occurredAt: getOffsetTime(100),
          message: `Removable USB Storage inserted: SanDisk Ultra USB 3.0 (Serial: 4C530001230415112341) mounted as E:`,
          sourceHost: hostname,
          usb: {
            vendorId: "0781",
            productId: "5581",
            deviceName: "SanDisk Ultra USB 3.0",
            deviceClass: "Mass Storage",
            serialNumber: "4C530001230415112341",
            driveLetter: "E:",
            action: "Connected",
          },
        },
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "File Activity",
          eventType: "FILE_COPIED_TO_REMOVABLE",
          severity: "High",
          occurredAt: getOffsetTime(20),
          message: `Confidential file Customer_Database_Backup.csv copied to removable drive E:\\Export\\Customer_Database_Backup.csv`,
          sourceHost: hostname,
          file: {
            path: "E:\\Export\\Customer_Database_Backup.csv",
            name: "Customer_Database_Backup.csv",
            extension: "csv",
            sizeBytes: 15728640,
            sha256: "e43b110902c345c2eb310247ec630e01deb2b07673ac670ae59c879861ec6149",
            isExecutable: false,
            isHidden: false,
          },
        },
      ];
    }

    case "multi_stage_endpoint_attack": {
      // Combines Initial Execution -> Masquerading -> Persistence -> C2 Beaconing
      return [
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "File Activity",
          eventType: "FILE_CREATED",
          severity: "Medium",
          occurredAt: getOffsetTime(180),
          message: `Suspicious archive extracted in Temp folder: payload_march.zip -> secupdate.exe`,
          sourceHost: hostname,
          file: {
            path: "C:\\Users\\Public\\Temp\\secupdate.exe",
            name: "secupdate.exe",
            extension: "exe",
            sizeBytes: 742192,
            sha256: "7b434346648f6b96df89dda901c5176b10e6d76ef61fced01388d2cb59a0f961",
            isExecutable: true,
          },
        },
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Process Activity",
          eventType: "PROCESS_SPAWNED",
          severity: "High",
          occurredAt: getOffsetTime(120),
          message: `Process secupdate.exe (PID: 7120) spawned from C:\\Users\\Public\\Temp\\`,
          sourceHost: hostname,
          process: {
            name: "secupdate.exe",
            executablePath: "C:\\Users\\Public\\Temp\\secupdate.exe",
            commandLine: "C:\\Users\\Public\\Temp\\secupdate.exe --daemon",
            sha256: "7b434346648f6b96df89dda901c5176b10e6d76ef61fced01388d2cb59a0f961",
            integrityLevel: "High",
          },
        },
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Registry Activity",
          eventType: "REGISTRY_KEY_MODIFIED",
          severity: "High",
          occurredAt: getOffsetTime(90),
          message: `Run Key persistence added: HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\SecDaemon`,
          sourceHost: hostname,
          registry: {
            hive: "HKLM",
            keyPath: "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            valueName: "SecDaemon",
            valueData: "C:\\Users\\Public\\Temp\\secupdate.exe --daemon",
            valueType: "REG_SZ",
            action: "Created",
          },
        },
        {
          organizationId,
          assetId,
          agentId,
          source: "EDR Agent",
          sourceType: "Endpoint",
          category: "Network Activity",
          eventType: "SUSPICIOUS_C2_TRAFFIC",
          severity: "Critical",
          occurredAt: getOffsetTime(30),
          message: `Outbound HTTPS C2 traffic detected to unknown remote IP 203.0.113.88:443`,
          sourceHost: hostname,
          network: {
            srcIp: "10.0.4.84",
            dstIp: "203.0.113.88",
            srcPort: 49812,
            dstPort: 443,
            protocol: "HTTPS",
            direction: "Outbound",
            status: "Established",
          },
        },
      ];
    }

    default:
      return [];
  }
}
