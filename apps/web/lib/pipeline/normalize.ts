/**
 * Pipeline Stage 3: Normalization
 *
 * Transforms parsed telemetry into canonical database entity packages
 * ready for persistence. Reuses the existing Phase 12 normalization
 * contract from lib/telemetry/contracts.ts.
 *
 * This stage produces the canonical split:
 * - Normalized Event (public.events)
 * - Raw Log (public.logs)
 * - Auxiliary entities: Process, File, Network Connection
 */

import { normalizeTelemetryPayload, type NormalizedTelemetryPackage, type RawTelemetryPayload } from "@/lib/telemetry/contracts";
import type { ParsedPayload } from "./parse";

export interface NormalizedPipelinePackage extends NormalizedTelemetryPackage {
  ingestionId: string;
  sourceHost: string | null;
}

/**
 * Normalizes a parsed payload into canonical database entity packages.
 * Delegates to the existing Phase 12 normalization contract.
 */
export function normalizePipelinePayload(parsed: ParsedPayload): NormalizedPipelinePackage {
  const rawPayload: RawTelemetryPayload = {
    source: parsed.source,
    sourceType: parsed.sourceType,
    category: parsed.category,
    eventType: parsed.eventType,
    severity: parsed.severity as RawTelemetryPayload["severity"],
    logLevel: parsed.logLevel,
    occurredAt: parsed.occurredAt,
    message: parsed.message,
    rawLog: parsed.rawLog,
    normalizedFields: parsed.normalizedFields,
    tags: parsed.tags,
    process: parsed.process ? {
      name: parsed.process.name,
      executablePath: parsed.process.executablePath,
      commandLine: parsed.process.commandLine,
      sha256: parsed.process.sha256,
      integrityLevel: parsed.process.integrityLevel,
    } : undefined,
    file: parsed.file ? {
      path: parsed.file.path,
      name: parsed.file.name,
      extension: parsed.file.extension,
      sizeBytes: parsed.file.sizeBytes,
      sha256: parsed.file.sha256,
      isExecutable: parsed.file.isExecutable,
      isHidden: parsed.file.isHidden,
    } : undefined,
    network: parsed.network ? {
      srcIp: parsed.network.srcIp,
      dstIp: parsed.network.dstIp,
      srcPort: parsed.network.srcPort,
      dstPort: parsed.network.dstPort,
      protocol: parsed.network.protocol as RawTelemetryPayload["network"] extends undefined ? never : NonNullable<RawTelemetryPayload["network"]>["protocol"],
      direction: parsed.network.direction as RawTelemetryPayload["network"] extends undefined ? never : NonNullable<RawTelemetryPayload["network"]>["direction"],
      status: parsed.network.status as RawTelemetryPayload["network"] extends undefined ? never : NonNullable<RawTelemetryPayload["network"]>["status"],
    } : undefined,
  };

  const normalizedPkg = normalizeTelemetryPayload(
    parsed.organizationId,
    rawPayload,
    {
      assetId: parsed.assetId,
      agentId: parsed.agentId,
      identityId: parsed.identityId,
      sourceHost: parsed.sourceHost || parsed.source,
    }
  );

  return {
    ...normalizedPkg,
    ingestionId: parsed.ingestionId,
    sourceHost: parsed.sourceHost,
  };
}
