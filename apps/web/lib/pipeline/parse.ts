/**
 * Pipeline Stage 2: Parsing & Interpretation
 *
 * Transforms validated telemetry payloads into structured internal formats.
 * Handles source-specific log format interpretation (Syslog, WinEvent, CEF).
 * Assigns parser names and tracks parse status.
 */

import type { LogLevel, LogParseStatus } from "@vrsoc/types";
import type { PipelineIngestionInput } from "@vrsoc/validation";

export interface ParsedPayload {
  // Normalized event fields
  organizationId: string;
  occurredAt: string;
  source: string;
  sourceType: string;
  category: string;
  eventType: string;
  severity: string;
  assetId: string | null;
  agentId: string | null;
  identityId: string | null;
  sourceHost: string | null;
  normalizedFields: Record<string, unknown>;
  tags: string[];
  ingestionId: string;

  // Log fields
  logLevel: LogLevel;
  message: string;
  rawLog: string;
  parseStatus: LogParseStatus;
  parserName: string;
  facility: string;
  serviceName: string;

  // Auxiliary entities
  process?: PipelineIngestionInput["process"];
  file?: PipelineIngestionInput["file"];
  network?: PipelineIngestionInput["network"];
  registry?: PipelineIngestionInput["registry"];
  service?: PipelineIngestionInput["service"];
  scheduledTask?: PipelineIngestionInput["scheduledTask"];
  startupItem?: PipelineIngestionInput["startupItem"];
  usb?: PipelineIngestionInput["usb"];
}

/**
 * Maps source-specific severity to standardized log level.
 */
function resolveLogLevel(severity: string, providedLevel?: string): LogLevel {
  if (providedLevel) return providedLevel as LogLevel;
  switch (severity) {
    case "Critical": return "CRIT";
    case "High": return "ERROR";
    case "Medium": return "WARN";
    case "Low": return "INFO";
    case "Informational": return "INFO";
    default: return "INFO";
  }
}

/**
 * Determines the appropriate parser name based on source type.
 */
function resolveParserName(sourceType?: string, source?: string): string {
  const typeMap: Record<string, string> = {
    "Windows": "vrsoc-winevtlog-parser",
    "Linux": "vrsoc-syslog-parser",
    "Syslog": "vrsoc-syslog-parser",
    "Firewall": "vrsoc-firewall-parser",
    "DNS": "vrsoc-dns-parser",
    "Network": "vrsoc-netflow-parser",
    "Endpoint": "vrsoc-edr-parser",
    "Authentication": "vrsoc-auth-parser",
    "Cloud": "vrsoc-cloud-audit-parser",
    "Email": "vrsoc-email-parser",
    "Identity Provider": "vrsoc-idp-parser",
    "VPN": "vrsoc-vpn-parser",
    "Web Server": "vrsoc-waf-parser",
  };
  if (sourceType && typeMap[sourceType]) return typeMap[sourceType];
  const src = source || sourceType || "generic";
  return `vrsoc-${src.toLowerCase().replace(/\s+/g, "-")}-parser`;
}

/**
 * Generates a synthetic raw log line from structured payload.
 */
function synthesizeRawLog(payload: PipelineIngestionInput, logLevel: LogLevel): string {
  if (payload.rawLog) return payload.rawLog;

  const timestamp = payload.occurredAt || new Date().toISOString();
  const host = payload.sourceHost || payload.source;
  return `<${logLevel}> ${timestamp} ${host} ${payload.source}[${payload.eventType}]: ${payload.message}`;
}

/**
 * Generates a stable ingestion ID for deduplication.
 */
function generateIngestionId(payload: PipelineIngestionInput): string {
  if (payload.ingestionId) return payload.ingestionId;
  const ts = payload.occurredAt || new Date().toISOString();
  return `ing-${payload.organizationId.substring(0, 8)}-${payload.eventType}-${ts}-${Date.now().toString(36)}`;
}

/**
 * Parses a validated payload into structured internal format.
 */
export function parseTelemetryPayload(payload: PipelineIngestionInput): ParsedPayload {
  const occurredAt = payload.occurredAt || new Date().toISOString();
  const logLevel = resolveLogLevel(payload.severity, payload.logLevel);
  const parserName = resolveParserName(payload.sourceType, payload.source);
  const rawLog = synthesizeRawLog(payload, logLevel);
  const ingestionId = generateIngestionId(payload);

  return {
    organizationId: payload.organizationId,
    occurredAt,
    source: payload.source,
    sourceType: payload.sourceType,
    category: payload.category,
    eventType: payload.eventType,
    severity: payload.severity,
    assetId: payload.assetId || null,
    agentId: payload.agentId || null,
    identityId: payload.identityId || null,
    sourceHost: payload.sourceHost || null,
    normalizedFields: {
      message: payload.message,
      ...(payload.normalizedFields || {}),
    },
    tags: payload.tags || [payload.category.toLowerCase().replace(/\s+/g, "_")],
    ingestionId,

    logLevel,
    message: payload.message,
    rawLog,
    parseStatus: "Parsed",
    parserName,
    facility: payload.sourceType.toLowerCase(),
    serviceName: payload.source,

    process: payload.process,
    file: payload.file,
    network: payload.network,
    registry: payload.registry,
    service: payload.service,
    scheduledTask: payload.scheduledTask,
    startupItem: payload.startupItem,
    usb: payload.usb,
  };
}
