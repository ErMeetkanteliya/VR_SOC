/**
 * EDR Endpoint Investigation Service
 *
 * Provides tenant-isolated database queries for deep endpoint forensics:
 * - Process tree reconstruction
 * - File system modifications
 * - Network socket connections
 * - Windows registry modifications
 * - System services & Scheduled tasks
 * - Startup items (autoruns) & USB device events
 * - Unified chronological endpoint activity timeline
 * - Direct pivots into SIEM and Alert triage
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildProcessTree } from "./process-tree";
import type {
  Asset,
  Agent,
  ProcessRecord,
  FileRecord,
  NetworkConnectionRecord,
  RegistryEvent,
  EndpointServiceEvent,
  ScheduledTaskEvent,
  StartupItem,
  UsbDeviceEvent,
  EndpointTimelineItem,
  EndpointInvestigationPackage,
  EndpointInvestigationSummary,
  EdrFilterParams,
  Alert,
  TelemetryEvent,
} from "@vrsoc/types";

export interface EndpointOption {
  id: string;
  hostname: string;
  displayName: string | null;
  assetType: string;
  osType: string;
  osVersion: string | null;
  ipAddress: string | null;
  status: string;
  isIsolated: boolean;
  agentId: string | null;
  agentStatus: string | null;
  agentVersion: string | null;
  lastSeenAt: string | null;
}

/**
 * Lists all endpoints and joined agent metadata for organization dropdown selector.
 */
export async function getEndpointsList(organizationId: string): Promise<EndpointOption[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("assets")
    .select(`
      id,
      hostname,
      display_name,
      asset_type,
      os_type,
      os_version,
      ip_address,
      status,
      is_isolated,
      agents (
        id,
        status,
        agent_version,
        last_seen_at
      )
    `)
    .eq("organization_id", organizationId)
    .order("hostname", { ascending: true });

  if (error) {
    console.error("[getEndpointsList] Error querying assets:", error.message);
  }

  const dbList = (data || []).map((row: any) => {
    const agent = Array.isArray(row.agents) ? row.agents[0] : row.agents;
    return {
      id: row.id,
      hostname: row.hostname,
      displayName: row.display_name,
      assetType: row.asset_type,
      osType: row.os_type,
      osVersion: row.os_version,
      ipAddress: row.ip_address,
      status: row.status,
      isIsolated: !!row.is_isolated,
      agentId: agent?.id || null,
      agentStatus: agent?.status || null,
      agentVersion: agent?.agent_version || null,
      lastSeenAt: agent?.last_seen_at || null,
    };
  });

  if (dbList.length > 0) {
    return dbList;
  }

  // Fallback demonstration fleet
  return [
    {
      id: "asset-demo-1",
      hostname: "WKSTN-084.corp.internal",
      displayName: "Executive Endpoint 084",
      assetType: "Endpoint",
      osType: "Windows",
      osVersion: "Windows 11 Enterprise 23H2",
      ipAddress: "10.0.4.84",
      status: "Active",
      isIsolated: false,
      agentId: "agent-demo-1",
      agentStatus: "Online",
      agentVersion: "1.4.2-edr",
      lastSeenAt: new Date().toISOString(),
    },
    {
      id: "asset-demo-2",
      hostname: "FINANCE-PC-12.corp.internal",
      displayName: "Finance Workstation 12",
      assetType: "Endpoint",
      osType: "Windows",
      osVersion: "Windows 11 Enterprise 23H2",
      ipAddress: "10.0.2.12",
      status: "Active",
      isIsolated: false,
      agentId: "agent-demo-2",
      agentStatus: "Online",
      agentVersion: "1.4.2-edr",
      lastSeenAt: new Date().toISOString(),
    },
    {
      id: "asset-demo-3",
      hostname: "DC-01.corp.internal",
      displayName: "Primary Domain Controller",
      assetType: "Domain Controller",
      osType: "Windows",
      osVersion: "Windows Server 2022 Datacenter",
      ipAddress: "10.0.1.10",
      status: "Active",
      isIsolated: false,
      agentId: "agent-demo-3",
      agentStatus: "Online",
      agentVersion: "1.4.2-edr",
      lastSeenAt: new Date().toISOString(),
    },
    {
      id: "asset-demo-4",
      hostname: "SQL-PROD-01.corp.internal",
      displayName: "Enterprise Core Database",
      assetType: "Server",
      osType: "Windows",
      osVersion: "Windows Server 2022 Standard",
      ipAddress: "10.0.1.45",
      status: "Active",
      isIsolated: false,
      agentId: "agent-demo-4",
      agentStatus: "Online",
      agentVersion: "1.4.2-edr",
      lastSeenAt: new Date().toISOString(),
    },
  ];
}

/**
 * Fetches the full forensic investigation package for a single endpoint.
 */
export async function getEndpointInvestigation(
  organizationId: string,
  assetId: string,
  filters: EdrFilterParams = {}
): Promise<EndpointInvestigationPackage | null> {
  const supabase = await createServerSupabaseClient();

  // 1. Fetch Asset
  const { data: assetData, error: assetErr } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  let asset: Asset;
  if (!assetErr && assetData) {
    asset = assetData as Asset;
  } else {
    // Demo fallback asset
    asset = {
      id: assetId,
      organization_id: organizationId,
      hostname: assetId.includes("2")
        ? "FINANCE-PC-12.corp.internal"
        : assetId.includes("3")
        ? "DC-01.corp.internal"
        : "WKSTN-084.corp.internal",
      display_name: "Executive Endpoint 084",
      asset_type: "Endpoint",
      os_type: "Windows",
      os_version: "Windows 11 Enterprise 23H2",
      ip_address: "10.0.4.84",
      criticality: "High",
      status: "Active",
      is_isolated: false,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // 2. Fetch Agent (if any)
  const { data: agentData } = await supabase
    .from("agents")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const agent = (agentData as Agent) || null;

  // 3. Fetch Processes
  const { data: processesData } = await supabase
    .from("processes")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("started_at", { ascending: false })
    .limit(100);

  let processes: ProcessRecord[] = (processesData || []) as ProcessRecord[];
  if (processes.length === 0) {
    processes = [
      {
        id: `proc-1-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        pid: 4,
        ppid: 0,
        name: "System",
        executable_path: "ntoskrnl.exe",
        command_line: "ntoskrnl.exe",
        username: "NT AUTHORITY\\SYSTEM",
        integrity_level: "System",
        started_at: new Date(Date.now() - 3600000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: `proc-2-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        pid: 612,
        ppid: 4,
        name: "smss.exe",
        executable_path: "C:\\Windows\\System32\\smss.exe",
        command_line: "\\SystemRoot\\System32\\smss.exe",
        username: "NT AUTHORITY\\SYSTEM",
        integrity_level: "System",
        started_at: new Date(Date.now() - 3500000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 3500000).toISOString(),
      },
      {
        id: `proc-3-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        pid: 840,
        ppid: 612,
        name: "csrss.exe",
        executable_path: "C:\\Windows\\System32\\csrss.exe",
        command_line: "%SystemRoot%\\system32\\csrss.exe ObjectDirectory=\\Windows SharedSection=1024,20480,768",
        username: "NT AUTHORITY\\SYSTEM",
        integrity_level: "System",
        started_at: new Date(Date.now() - 3400000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 3400000).toISOString(),
      },
      {
        id: `proc-4-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        pid: 1040,
        ppid: 840,
        name: "wininit.exe",
        executable_path: "C:\\Windows\\System32\\wininit.exe",
        command_line: "wininit.exe",
        username: "NT AUTHORITY\\SYSTEM",
        integrity_level: "System",
        started_at: new Date(Date.now() - 3300000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 3300000).toISOString(),
      },
      {
        id: `proc-5-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        pid: 1420,
        ppid: 1040,
        name: "services.exe",
        executable_path: "C:\\Windows\\System32\\services.exe",
        command_line: "C:\\Windows\\system32\\services.exe",
        username: "NT AUTHORITY\\SYSTEM",
        integrity_level: "System",
        started_at: new Date(Date.now() - 3200000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 3200000).toISOString(),
      },
      {
        id: `proc-6-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        pid: 2480,
        ppid: 1420,
        name: "svchost.exe",
        executable_path: "C:\\Windows\\System32\\svchost.exe",
        command_line: "C:\\Windows\\system32\\svchost.exe -k DcomLaunch -p",
        username: "NT AUTHORITY\\SYSTEM",
        integrity_level: "System",
        started_at: new Date(Date.now() - 3100000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 3100000).toISOString(),
      },
      {
        id: `proc-7-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        pid: 4820,
        ppid: 2480,
        name: "explorer.exe",
        executable_path: "C:\\Windows\\explorer.exe",
        command_line: "C:\\Windows\\Explorer.EXE",
        username: "CORP\\JohnDoe",
        integrity_level: "Medium",
        started_at: new Date(Date.now() - 2500000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 2500000).toISOString(),
      },
      {
        id: `proc-8-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        pid: 5912,
        ppid: 4820,
        name: "powershell.exe",
        executable_path: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        command_line: "powershell.exe -ExecutionPolicy Bypass -NoProfile",
        username: "CORP\\JohnDoe",
        integrity_level: "Medium",
        started_at: new Date(Date.now() - 180000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 180000).toISOString(),
      },
      {
        id: `proc-9-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        pid: 6840,
        ppid: 5912,
        name: "svchost.exe",
        executable_path: "C:\\Users\\Public\\Temp\\svchost.exe",
        command_line: "C:\\Users\\Public\\Temp\\svchost.exe -k netsvcs",
        username: "CORP\\JohnDoe",
        integrity_level: "High",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        started_at: new Date(Date.now() - 60000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 60000).toISOString(),
      },
    ];
  }

  const processTree = buildProcessTree(processes, { highlightSuspicious: true });

  // 4. Fetch Files
  const { data: filesData } = await supabase
    .from("files")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  let files: FileRecord[] = (filesData || []) as FileRecord[];
  if (files.length === 0) {
    files = [
      {
        id: `file-1-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        path: "C:\\Users\\Public\\Temp\\svchost.exe",
        name: "svchost.exe",
        extension: "exe",
        size_bytes: 458752,
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        is_signed: false,
        is_hidden: false,
        is_executable: true,
        metadata: {},
        created_at: new Date(Date.now() - 65000).toISOString(),
        updated_at: new Date(Date.now() - 65000).toISOString(),
      },
      {
        id: `file-2-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        path: "C:\\Users\\JohnDoe\\Documents\\Financial_Report_Q1.xlsx",
        name: "Financial_Report_Q1.xlsx",
        extension: "xlsx",
        size_bytes: 1048576,
        sha256: "8f434346648f6b96df89dda901c5176b10e6d76ef61fced01388d2cb59a0f962",
        is_signed: false,
        is_hidden: false,
        is_executable: false,
        metadata: {},
        created_at: new Date(Date.now() - 120000).toISOString(),
        updated_at: new Date(Date.now() - 120000).toISOString(),
      },
    ];
  }

  // 5. Fetch Network Connections
  const { data: netData } = await supabase
    .from("network_connections")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("started_at", { ascending: false })
    .limit(100);

  let networkConnections: NetworkConnectionRecord[] = (netData || []) as NetworkConnectionRecord[];
  if (networkConnections.length === 0) {
    networkConnections = [
      {
        id: `net-1-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        src_ip: "10.0.4.84",
        dst_ip: "198.51.100.45",
        src_port: 51234,
        dst_port: 8443,
        protocol: "HTTPS",
        direction: "Outbound",
        status: "Established",
        bytes_sent: 1024,
        bytes_received: 2048,
        duration_ms: 120,
        started_at: new Date(Date.now() - 55000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 55000).toISOString(),
      },
    ];
  }

  // 6. Fetch Registry Events
  const { data: regData } = await supabase
    .from("registry_events")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(100);

  let registryEvents: RegistryEvent[] = (regData || []) as RegistryEvent[];
  if (registryEvents.length === 0) {
    registryEvents = [
      {
        id: `reg-1-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        hive: "HKCU",
        key_path: "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        value_name: "WindowsUpdateAssist",
        value_data: "C:\\Users\\Public\\Temp\\svchost.exe --silent",
        value_type: "REG_SZ",
        action: "Created",
        occurred_at: new Date(Date.now() - 50000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 50000).toISOString(),
      },
    ];
  }

  // 7. Fetch Services
  const { data: serviceData } = await supabase
    .from("endpoint_services")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(100);

  let services: EndpointServiceEvent[] = (serviceData || []) as EndpointServiceEvent[];
  if (services.length === 0) {
    services = [
      {
        id: `svc-1-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        service_name: "WindowsSecurityHealthHelper",
        display_name: "Windows Security Health Telemetry Helper",
        executable_path: "C:\\Users\\Public\\secservice.exe",
        start_type: "Auto",
        status: "Running",
        action: "Installed",
        account_name: "LocalSystem",
        occurred_at: new Date(Date.now() - 40000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 40000).toISOString(),
      },
    ];
  }

  // 8. Fetch Scheduled Tasks
  const { data: taskData } = await supabase
    .from("scheduled_task_events")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(100);

  let scheduledTasks: ScheduledTaskEvent[] = (taskData || []) as ScheduledTaskEvent[];
  if (scheduledTasks.length === 0) {
    scheduledTasks = [
      {
        id: `task-1-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        task_name: "DiskCleanupScheduler",
        task_path: "\\Microsoft\\Windows\\Maintenance\\",
        action: "Created",
        command: "powershell.exe",
        arguments: "-NonInteractive -WindowStyle Hidden -Enc ...",
        run_as_user: "NT AUTHORITY\\SYSTEM",
        trigger_type: "AtLogon",
        occurred_at: new Date(Date.now() - 35000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 35000).toISOString(),
      },
    ];
  }

  // 9. Fetch Startup Items
  const { data: startupData } = await supabase
    .from("startup_items")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(100);

  let startupItems: StartupItem[] = (startupData || []) as StartupItem[];
  if (startupItems.length === 0) {
    startupItems = [
      {
        id: `startup-1-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        name: "StartupHelper.lnk",
        location_type: "StartupFolder",
        location_path: "C:\\Users\\JohnDoe\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\StartupHelper.lnk",
        command: "wscript.exe C:\\Users\\Public\\sync.vbs",
        user_context: "JohnDoe",
        action: "Added",
        occurred_at: new Date(Date.now() - 30000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 30000).toISOString(),
      },
    ];
  }

  // 10. Fetch USB Events
  const { data: usbData } = await supabase
    .from("usb_events")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(100);

  let usbEvents: UsbDeviceEvent[] = (usbData || []) as UsbDeviceEvent[];
  if (usbEvents.length === 0) {
    usbEvents = [
      {
        id: `usb-1-${assetId}`,
        organization_id: organizationId,
        asset_id: assetId,
        vendor_id: "0781",
        product_id: "5581",
        device_name: "SanDisk Ultra USB 3.0",
        device_class: "Mass Storage",
        serial_number: "4C530001230415112341",
        drive_letter: "E:",
        action: "Connected",
        occurred_at: new Date(Date.now() - 25000).toISOString(),
        metadata: {},
        created_at: new Date(Date.now() - 25000).toISOString(),
      },
    ];
  }

  // 11. Fetch Related Alerts
  const { data: alertsData } = await supabase
    .from("alerts")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(20);

  const relatedAlerts: Alert[] = (alertsData || []) as Alert[];

  // 12. Fetch Related Events
  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("asset_id", assetId)
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  const relatedEvents: TelemetryEvent[] = (eventsData || []) as TelemetryEvent[];

  // 13. Compile Unified Chronological Timeline
  const timeline = compileEndpointTimeline({
    processes,
    files,
    networkConnections,
    registryEvents,
    services,
    scheduledTasks,
    startupItems,
    usbEvents,
    relatedAlerts,
    relatedEvents,
    query: filters.query,
    category: filters.category,
  });

  // 14. Compute Summary Stats
  let suspiciousProcessesCount = 0;
  const countSuspicious = (nodes: typeof processTree) => {
    for (const node of nodes) {
      if (node.is_suspicious) suspiciousProcessesCount++;
      if (node.children) countSuspicious(node.children);
    }
  };
  countSuspicious(processTree);

  const summary: EndpointInvestigationSummary = {
    totalProcesses: processes.length,
    suspiciousProcesses: suspiciousProcessesCount,
    fileModifications: files.length,
    networkConnections: networkConnections.length,
    registryChanges: registryEvents.length,
    servicesInstalled: services.length,
    scheduledTasks: scheduledTasks.length,
    startupItems: startupItems.length,
    usbEvents: usbEvents.length,
    activeAlerts: relatedAlerts.filter((a) => a.status !== "Closed" && a.status !== "False Positive").length,
  };

  return {
    asset,
    agent,
    summary,
    processes,
    processTree,
    files,
    networkConnections,
    registryEvents,
    services,
    scheduledTasks,
    startupItems,
    usbEvents,
    timeline,
    relatedAlerts,
    relatedEvents,
  };
}

interface CompileTimelineInput {
  processes: ProcessRecord[];
  files: FileRecord[];
  networkConnections: NetworkConnectionRecord[];
  registryEvents: RegistryEvent[];
  services: EndpointServiceEvent[];
  scheduledTasks: ScheduledTaskEvent[];
  startupItems: StartupItem[];
  usbEvents: UsbDeviceEvent[];
  relatedAlerts: Alert[];
  relatedEvents: TelemetryEvent[];
  query?: string;
  category?: string;
}

/**
 * Merges heterogeneous endpoint events into a unified chronological stream.
 */
export function compileEndpointTimeline(input: CompileTimelineInput): EndpointTimelineItem[] {
  const items: EndpointTimelineItem[] = [];

  // Processes
  if (!input.category || input.category === "all" || input.category === "processes") {
    for (const p of input.processes) {
      items.push({
        id: `proc-${p.id}`,
        occurredAt: p.started_at,
        category: "process",
        action: "Spawned",
        title: `Process Launched: ${p.name}`,
        summary: `PID ${p.pid} (${p.executable_path}) by user ${p.username || "SYSTEM"}`,
        severity: (p.integrity_level === "High" || p.integrity_level === "System") ? "Low" : "Informational",
        source: "EDR Process Monitor",
        details: {
          pid: p.pid,
          ppid: p.ppid,
          commandLine: p.command_line,
          sha256: p.sha256,
          integrityLevel: p.integrity_level,
        },
      });
    }
  }

  // Files
  if (!input.category || input.category === "all" || input.category === "files") {
    for (const f of input.files) {
      const isSus = f.is_executable || f.path.includes("Temp") || f.extension === "locked";
      items.push({
        id: `file-${f.id}`,
        occurredAt: f.file_modified_at || f.file_created_at || f.created_at,
        category: "file",
        action: f.is_executable ? "Executable Drop" : "Modified",
        title: `File Activity: ${f.name}`,
        summary: `Path: ${f.path} (${(f.size_bytes / 1024).toFixed(1)} KB)`,
        severity: isSus ? "Medium" : "Informational",
        source: "EDR FIM",
        details: {
          path: f.path,
          sizeBytes: f.size_bytes,
          sha256: f.sha256,
          isExecutable: f.is_executable,
        },
      });
    }
  }

  // Network Connections
  if (!input.category || input.category === "all" || input.category === "network") {
    for (const n of input.networkConnections) {
      const isExt = n.dst_port === 8443 || n.dst_port === 4444;
      items.push({
        id: `net-${n.id}`,
        occurredAt: n.started_at,
        category: "network",
        action: `${n.direction} ${n.protocol}`,
        title: `Network Connection: ${n.dst_ip}:${n.dst_port}`,
        summary: `${n.src_ip}:${n.src_port} -> ${n.dst_ip}:${n.dst_port} [${n.status}]`,
        severity: isExt ? "High" : "Informational",
        source: "EDR NetFlow",
        details: {
          srcIp: n.src_ip,
          dstIp: n.dst_ip,
          srcPort: n.src_port,
          dstPort: n.dst_port,
          protocol: n.protocol,
          bytesSent: n.bytes_sent,
          bytesReceived: n.bytes_received,
        },
      });
    }
  }

  // Registry Events
  if (!input.category || input.category === "all" || input.category === "registry") {
    for (const r of input.registryEvents) {
      items.push({
        id: `reg-${r.id}`,
        occurredAt: r.occurred_at,
        category: "registry",
        action: r.action,
        title: `Registry ${r.action}: ${r.value_name || r.key_path}`,
        summary: `${r.hive}\\${r.key_path} = ${r.value_data || ""}`,
        severity: r.key_path.includes("CurrentVersion\\Run") ? "High" : "Low",
        source: "EDR Registry Auditing",
        details: {
          hive: r.hive,
          keyPath: r.key_path,
          valueName: r.value_name,
          valueData: r.value_data,
          valueType: r.value_type,
        },
      });
    }
  }

  // Services
  if (!input.category || input.category === "all" || input.category === "services") {
    for (const s of input.services) {
      items.push({
        id: `svc-${s.id}`,
        occurredAt: s.occurred_at,
        category: "service",
        action: s.action,
        title: `Service ${s.action}: ${s.service_name}`,
        summary: `Binary: ${s.executable_path || "N/A"} (${s.start_type}, ${s.status})`,
        severity: s.action === "Installed" ? "High" : "Medium",
        source: "EDR Service Manager",
        details: {
          serviceName: s.service_name,
          displayName: s.display_name,
          executablePath: s.executable_path,
          startType: s.start_type,
          accountName: s.account_name,
        },
      });
    }
  }

  // Scheduled Tasks
  if (!input.category || input.category === "all" || input.category === "tasks") {
    for (const t of input.scheduledTasks) {
      items.push({
        id: `task-${t.id}`,
        occurredAt: t.occurred_at,
        category: "task",
        action: t.action,
        title: `Task ${t.action}: ${t.task_name}`,
        summary: `Command: ${t.command} (${t.trigger_type} as ${t.run_as_user})`,
        severity: t.command?.includes("powershell") ? "High" : "Medium",
        source: "EDR Task Scheduler",
        details: {
          taskName: t.task_name,
          command: t.command,
          arguments: t.arguments,
          triggerType: t.trigger_type,
          runAsUser: t.run_as_user,
        },
      });
    }
  }

  // Startup Items
  if (!input.category || input.category === "all" || input.category === "startup") {
    for (const st of input.startupItems) {
      items.push({
        id: `startup-${st.id}`,
        occurredAt: st.occurred_at,
        category: "startup",
        action: st.action,
        title: `Startup Item ${st.action}: ${st.name}`,
        summary: `Location: ${st.location_type} -> ${st.command}`,
        severity: "Medium",
        source: "EDR Autoruns",
        details: {
          name: st.name,
          locationType: st.location_type,
          locationPath: st.location_path,
          command: st.command,
        },
      });
    }
  }

  // USB Events
  if (!input.category || input.category === "all" || input.category === "usb") {
    for (const u of input.usbEvents) {
      items.push({
        id: `usb-${u.id}`,
        occurredAt: u.occurred_at,
        category: "usb",
        action: u.action,
        title: `USB ${u.action}: ${u.device_name}`,
        summary: `Device: ${u.device_name} (Drive: ${u.drive_letter || "N/A"}, Serial: ${u.serial_number || "N/A"})`,
        severity: u.action === "FileWritten" ? "High" : "Medium",
        source: "EDR Removable Device Monitor",
        details: {
          deviceName: u.device_name,
          vendorId: u.vendor_id,
          productId: u.product_id,
          driveLetter: u.drive_letter,
          serialNumber: u.serial_number,
        },
      });
    }
  }

  // Alerts
  if (!input.category || input.category === "all" || input.category === "alerts") {
    for (const a of input.relatedAlerts) {
      items.push({
        id: `alert-${a.id}`,
        occurredAt: a.created_at,
        category: "alert",
        action: "Triggered",
        title: `Alert: ${a.title}`,
        summary: `Status: ${a.status}, Severity: ${a.severity}`,
        severity: a.severity,
        source: "VRSOC Detection Engine",
        details: {
          alertId: a.id,
          alertCode: a.alert_code,
          status: a.status,
        },
      });
    }
  }

  // Filter by query if present
  let filtered = items;
  if (input.query && input.query.trim()) {
    const q = input.query.toLowerCase().trim();
    filtered = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q)
    );
  }

  // Sort descending by occurredAt
  return filtered.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
}
