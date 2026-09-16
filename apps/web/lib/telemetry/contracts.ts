import type {
  TelemetryEvent,
  LogRecord,
  ProcessRecord,
  FileRecord,
  NetworkConnectionRecord,
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
    name: string;
    executablePath: string;
    commandLine?: string;
    sha256?: string;
    md5?: string;
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
}

export interface NormalizedTelemetryPackage {
  event: Omit<TelemetryEvent, "id" | "created_at">;
  log: Omit<LogRecord, "id" | "created_at">;
  process?: Omit<ProcessRecord, "id" | "created_at">;
  file?: Omit<FileRecord, "id" | "created_at" | "updated_at">;
  network?: Omit<NetworkConnectionRecord, "id" | "created_at">;
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
      pid: Math.floor(1000 + Math.random() * 9000),
      ppid: 4, // Default system/explorer parent
      name: payload.process.name,
      executable_path: payload.process.executablePath,
      command_line: payload.process.commandLine || payload.process.executablePath,
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

  return {
    event,
    log,
    process,
    file,
    network,
  };
}
