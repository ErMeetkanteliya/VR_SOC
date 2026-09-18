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
    registry: parsed.registry ? {
      hive: parsed.registry.hive,
      keyPath: parsed.registry.keyPath,
      valueName: parsed.registry.valueName,
      valueData: parsed.registry.valueData,
      valueType: parsed.registry.valueType,
      action: parsed.registry.action,
    } : undefined,
    service: parsed.service ? {
      serviceName: parsed.service.serviceName,
      displayName: parsed.service.displayName,
      executablePath: parsed.service.executablePath,
      startType: parsed.service.startType,
      status: parsed.service.status,
      action: parsed.service.action,
      accountName: parsed.service.accountName,
    } : undefined,
    scheduledTask: parsed.scheduledTask ? {
      taskName: parsed.scheduledTask.taskName,
      taskPath: parsed.scheduledTask.taskPath,
      action: parsed.scheduledTask.action,
      command: parsed.scheduledTask.command,
      arguments: parsed.scheduledTask.arguments,
      runAsUser: parsed.scheduledTask.runAsUser,
      triggerType: parsed.scheduledTask.triggerType,
    } : undefined,
    startupItem: parsed.startupItem ? {
      name: parsed.startupItem.name,
      locationType: parsed.startupItem.locationType,
      locationPath: parsed.startupItem.locationPath,
      command: parsed.startupItem.command,
      userContext: parsed.startupItem.userContext,
      action: parsed.startupItem.action,
    } : undefined,
    usb: parsed.usb ? {
      vendorId: parsed.usb.vendorId,
      productId: parsed.usb.productId,
      deviceName: parsed.usb.deviceName,
      deviceClass: parsed.usb.deviceClass,
      serialNumber: parsed.usb.serialNumber,
      driveLetter: parsed.usb.driveLetter,
      action: parsed.usb.action,
    } : undefined,
    dns: parsed.dns ? {
      queryDomain: parsed.dns.queryDomain,
      queryType: parsed.dns.queryType,
      resolvedIps: parsed.dns.resolvedIps,
      responseCode: parsed.dns.responseCode,
      isMalicious: parsed.dns.isMalicious,
      threatCategory: parsed.dns.threatCategory,
    } : undefined,
    email: parsed.email ? {
      sender: parsed.email.sender,
      recipient: parsed.email.recipient,
      subject: parsed.email.subject,
      messageId: parsed.email.messageId,
      attachmentName: parsed.email.attachmentName,
      attachmentSha256: parsed.email.attachmentSha256,
      attachmentSizeBytes: parsed.email.attachmentSizeBytes,
      action: parsed.email.action,
      spfVerdict: parsed.email.spfVerdict,
      dkimVerdict: parsed.email.dkimVerdict,
      isPhishing: parsed.email.isPhishing,
      threatLevel: parsed.email.threatLevel,
    } : undefined,
    cloud: parsed.cloud ? {
      cloudProvider: parsed.cloud.cloudProvider,
      serviceName: parsed.cloud.serviceName,
      eventName: parsed.cloud.eventName,
      callerIp: parsed.cloud.callerIp,
      userAgent: parsed.cloud.userAgent,
      region: parsed.cloud.region,
      resourceArn: parsed.cloud.resourceArn,
      status: parsed.cloud.status,
      requestParameters: parsed.cloud.requestParameters,
      responseElements: parsed.cloud.responseElements,
    } : undefined,
    firewall: parsed.firewall ? {
      srcIp: parsed.firewall.srcIp,
      dstIp: parsed.firewall.dstIp,
      srcPort: parsed.firewall.srcPort,
      dstPort: parsed.firewall.dstPort,
      protocol: parsed.firewall.protocol,
      action: parsed.firewall.action,
      ruleId: parsed.firewall.ruleId,
      ruleName: parsed.firewall.ruleName,
      bytesTransferred: parsed.firewall.bytesTransferred,
      threatName: parsed.firewall.threatName,
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
