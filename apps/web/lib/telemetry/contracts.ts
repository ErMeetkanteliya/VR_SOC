import type {
  TelemetryEvent,
  LogRecord,
  ProcessRecord,
  FileRecord,
  NetworkConnectionRecord,
  RegistryEvent,
  EndpointServiceEvent,
  ScheduledTaskEvent,
  StartupItem,
  UsbDeviceEvent,
  RegistryHive,
  RegistryAction,
  ServiceStartType,
  ServiceStatus,
  ServiceAction,
  ScheduledTaskAction,
  ScheduledTaskTrigger,
  StartupItemLocation,
  StartupItemAction,
  UsbDeviceAction,
  SeverityLevel,
  LogLevel,
  LogParseStatus,
  NetworkProtocol,
  NetworkDirection,
  NetworkConnectionStatus,
} from "@vrsoc/types";

/**
 * Distinguishes Normalized Events from Raw/Ingested Logs:
 * 
 * 1. Normalized Event (public.events):
 *    - Structured domain entity representing a semantic security event
 *      (e.g., "AUTHENTICATION_FAILED", "PROCESS_SPAWNED", "SUSPICIOUS_NETWORK_CONNECTION").
 *    - Joined with Asset, Agent, and SocIdentity contexts.
 *    - Intended for correlation engines, detection rules, alert generation, and analytics.
 * 
 * 2. Log Record (public.logs):
 *    - Ingested raw or semi-structured log line from syslog, Windows Event Log, CEF, or JSON streams.
 *    - Contains facility, source_host, message, log_level, and raw payload text.
 *    - References parent event (if correlated/parsed) or stands alone for SIEM search/compliance.
 */

export interface RawTelemetryPayload {
  source: string;
  sourceType: string;
  category: string;
  eventType: string;
  severity: SeverityLevel;
  logLevel?: LogLevel;
  occurredAt?: string;
  message: string;
  rawLog?: string;
  normalizedFields?: Record<string, unknown>;
  tags?: string[];
  process?: {
    pid?: number;
    ppid?: number;
    name: string;
    executablePath: string;
    commandLine?: string;
    sha256?: string;
    md5?: string;
    username?: string;
    integrityLevel?: "Low" | "Medium" | "High" | "System";
  };
  file?: {
    path: string;
    name: string;
    extension?: string;
    sizeBytes?: number;
    sha256?: string;
    isExecutable?: boolean;
    isHidden?: boolean;
  };
  network?: {
    srcIp: string;
    dstIp: string;
    srcPort: number;
    dstPort: number;
    protocol?: NetworkProtocol;
    direction?: NetworkDirection;
    status?: NetworkConnectionStatus;
    bytesSent?: number;
    bytesReceived?: number;
  };
  registry?: {
    hive: RegistryHive;
    keyPath: string;
    valueName?: string;
    valueData?: string;
    valueType?: string;
    action: RegistryAction;
  };
  service?: {
    serviceName: string;
    displayName?: string;
    executablePath?: string;
    startType?: ServiceStartType;
    status?: ServiceStatus;
    action?: ServiceAction;
    accountName?: string;
  };
  scheduledTask?: {
    taskName: string;
    taskPath?: string;
    action?: ScheduledTaskAction;
    command?: string;
    arguments?: string;
    runAsUser?: string;
    triggerType?: ScheduledTaskTrigger;
  };
  startupItem?: {
    name: string;
    locationType: StartupItemLocation;
    locationPath: string;
    command: string;
    userContext?: string;
    action?: StartupItemAction;
  };
  usb?: {
    vendorId?: string;
    productId?: string;
    deviceName: string;
    deviceClass?: string;
    serialNumber?: string;
    driveLetter?: string;
    action?: UsbDeviceAction;
  };
}

export interface NormalizedTelemetryPackage {
  event: Omit<TelemetryEvent, "id" | "created_at">;
  log: Omit<LogRecord, "id" | "created_at">;
  process?: Omit<ProcessRecord, "id" | "created_at">;
  file?: Omit<FileRecord, "id" | "created_at" | "updated_at">;
  network?: Omit<NetworkConnectionRecord, "id" | "created_at">;
  registry?: Omit<RegistryEvent, "id" | "created_at">;
  service?: Omit<EndpointServiceEvent, "id" | "created_at">;
  scheduledTask?: Omit<ScheduledTaskEvent, "id" | "created_at">;
  startupItem?: Omit<StartupItem, "id" | "created_at">;
  usb?: Omit<UsbDeviceEvent, "id" | "created_at">;
}

/**
 * Transforms a raw telemetry description into canonical database entity packages.
 */
export function normalizeTelemetryPayload(
  organizationId: string,
  payload: RawTelemetryPayload,
  context?: {
    assetId?: string | null;
    agentId?: string | null;
    identityId?: string | null;
    sourceHost?: string;
  }
): NormalizedTelemetryPackage {
  const occurredAt = payload.occurredAt || new Date().toISOString();
  const logLevel: LogLevel = payload.logLevel || (payload.severity === "Critical" ? "CRIT" : payload.severity === "High" ? "ERROR" : payload.severity === "Medium" ? "WARN" : "INFO");
  const parseStatus: LogParseStatus = "Parsed";

  const event: Omit<TelemetryEvent, "id" | "created_at"> = {
    organization_id: organizationId,
    occurred_at: occurredAt,
    source: payload.source,
    source_type: payload.sourceType,
    category: payload.category,
    event_type: payload.eventType,
    severity: payload.severity,
    asset_id: context?.assetId || null,
    agent_id: context?.agentId || null,
    identity_id: context?.identityId || null,
    raw_payload: (payload.normalizedFields || {}) as Record<string, unknown>,
    normalized_fields: {
      message: payload.message,
      ...(payload.normalizedFields || {}),
    },
    tags: payload.tags || [payload.category.toLowerCase().replace(/\s+/g, "_")],
  };

  const log: Omit<LogRecord, "id" | "created_at"> = {
    organization_id: organizationId,
    logged_at: occurredAt,
    facility: payload.sourceType.toLowerCase(),
    log_level: logLevel,
    source_host: context?.sourceHost || payload.source,
    service_name: payload.source,
    message: payload.message,
    raw_log: payload.rawLog || `[${occurredAt}] [${logLevel}] [${payload.source}] ${payload.message}`,
    parse_status: parseStatus,
    parser_name: "vrsoc-canonical-normalizer",
    metadata: {
      category: payload.category,
      event_type: payload.eventType,
    },
  };

  let process: Omit<ProcessRecord, "id" | "created_at"> | undefined;
  if (payload.process && context?.assetId) {
    process = {
      organization_id: organizationId,
      asset_id: context.assetId,
      agent_id: context.agentId || null,
      pid: payload.process.pid || Math.floor(1000 + Math.random() * 9000),
      ppid: payload.process.ppid !== undefined ? payload.process.ppid : 4,
      name: payload.process.name,
      executable_path: payload.process.executablePath,
      command_line: payload.process.commandLine || payload.process.executablePath,
      username: payload.process.username || "SYSTEM",
      sha256: payload.process.sha256 || null,
      md5: payload.process.md5 || null,
      started_at: occurredAt,
      integrity_level: payload.process.integrityLevel || "Medium",
      metadata: {},
    };
  }

  let file: Omit<FileRecord, "id" | "created_at" | "updated_at"> | undefined;
  if (payload.file && context?.assetId) {
    file = {
      organization_id: organizationId,
      asset_id: context.assetId,
      path: payload.file.path,
      name: payload.file.name,
      extension: payload.file.extension || payload.file.name.split(".").pop() || null,
      size_bytes: payload.file.sizeBytes || 1024,
      sha256: payload.file.sha256 || null,
      is_signed: false,
      is_hidden: payload.file.isHidden || false,
      is_executable: payload.file.isExecutable || false,
      metadata: {},
    };
  }

  let network: Omit<NetworkConnectionRecord, "id" | "created_at"> | undefined;
  if (payload.network && context?.assetId) {
    network = {
      organization_id: organizationId,
      asset_id: context.assetId,
      src_ip: payload.network.srcIp,
      dst_ip: payload.network.dstIp,
      src_port: payload.network.srcPort,
      dst_port: payload.network.dstPort,
      protocol: payload.network.protocol || "TCP",
      direction: payload.network.direction || "Outbound",
      status: payload.network.status || "Established",
      bytes_sent: payload.network.bytesSent || 512,
      bytes_received: payload.network.bytesReceived || 1024,
      duration_ms: 250,
      started_at: occurredAt,
      metadata: {},
    };
  }

  let registry: Omit<RegistryEvent, "id" | "created_at"> | undefined;
  if (payload.registry && context?.assetId) {
    registry = {
      organization_id: organizationId,
      asset_id: context.assetId,
      agent_id: context.agentId || null,
      hive: payload.registry.hive,
      key_path: payload.registry.keyPath,
      value_name: payload.registry.valueName || null,
      value_data: payload.registry.valueData || null,
      value_type: payload.registry.valueType || "REG_SZ",
      action: payload.registry.action,
      occurred_at: occurredAt,
      metadata: {},
    };
  }

  let service: Omit<EndpointServiceEvent, "id" | "created_at"> | undefined;
  if (payload.service && context?.assetId) {
    service = {
      organization_id: organizationId,
      asset_id: context.assetId,
      agent_id: context.agentId || null,
      service_name: payload.service.serviceName,
      display_name: payload.service.displayName || payload.service.serviceName,
      executable_path: payload.service.executablePath || null,
      start_type: payload.service.startType || "Auto",
      status: payload.service.status || "Running",
      action: payload.service.action || "Modified",
      account_name: payload.service.accountName || "LocalSystem",
      occurred_at: occurredAt,
      metadata: {},
    };
  }

  let scheduledTask: Omit<ScheduledTaskEvent, "id" | "created_at"> | undefined;
  if (payload.scheduledTask && context?.assetId) {
    scheduledTask = {
      organization_id: organizationId,
      asset_id: context.assetId,
      agent_id: context.agentId || null,
      task_name: payload.scheduledTask.taskName,
      task_path: payload.scheduledTask.taskPath || "\\",
      action: payload.scheduledTask.action || "Created",
      command: payload.scheduledTask.command || null,
      arguments: payload.scheduledTask.arguments || null,
      run_as_user: payload.scheduledTask.runAsUser || "SYSTEM",
      trigger_type: payload.scheduledTask.triggerType || "Daily",
      occurred_at: occurredAt,
      metadata: {},
    };
  }

  let startupItem: Omit<StartupItem, "id" | "created_at"> | undefined;
  if (payload.startupItem && context?.assetId) {
    startupItem = {
      organization_id: organizationId,
      asset_id: context.assetId,
      agent_id: context.agentId || null,
      name: payload.startupItem.name,
      location_type: payload.startupItem.locationType,
      location_path: payload.startupItem.locationPath,
      command: payload.startupItem.command,
      user_context: payload.startupItem.userContext || "SYSTEM",
      action: payload.startupItem.action || "Added",
      occurred_at: occurredAt,
      metadata: {},
    };
  }

  let usb: Omit<UsbDeviceEvent, "id" | "created_at"> | undefined;
  if (payload.usb && context?.assetId) {
    usb = {
      organization_id: organizationId,
      asset_id: context.assetId,
      agent_id: context.agentId || null,
      vendor_id: payload.usb.vendorId || null,
      product_id: payload.usb.productId || null,
      device_name: payload.usb.deviceName,
      device_class: payload.usb.deviceClass || "Mass Storage",
      serial_number: payload.usb.serialNumber || null,
      drive_letter: payload.usb.driveLetter || null,
      action: payload.usb.action || "Connected",
      occurred_at: occurredAt,
      metadata: {},
    };
  }

  return {
    event,
    log,
    process,
    file,
    network,
    registry,
    service,
    scheduledTask,
    startupItem,
    usb,
  };
}

