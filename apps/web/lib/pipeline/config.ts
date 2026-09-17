/**
 * Pipeline Configuration & Constants
 *
 * Defines the canonical source taxonomy, supported categories, and pipeline
 * processing configuration for the VRSOC telemetry ingestion pipeline.
 */

import type { PipelineConfig } from "@vrsoc/types";

/**
 * Canonical list of supported synthetic telemetry sources.
 * These are educational/simulated sources only.
 */
export const SUPPORTED_SOURCES = [
  "Windows Event Log",
  "Syslog",
  "EDR Agent",
  "Suricata",
  "Zeek",
  "Auditd",
  "Active Directory",
  "Firewall",
  "DNS Server",
  "VPN Gateway",
  "Cloud Audit",
  "Web Application Firewall",
  "Email Gateway",
  "Identity Provider",
  "Endpoint",
  "PnP Manager",
  "Perimeter Firewall",
  "VSS Admin",
] as const;

export const SUPPORTED_SOURCE_TYPES = [
  "Windows",
  "Linux",
  "Syslog",
  "Firewall",
  "DNS",
  "VPN",
  "Cloud",
  "Web Server",
  "Email",
  "Identity Provider",
  "Endpoint",
  "Authentication",
  "Network",
] as const;

export const SUPPORTED_CATEGORIES = [
  "Authentication",
  "Process",
  "Network",
  "File",
  "Hardware",
  "Identity",
  "Persistence",
  "Execution",
  "Encryption",
  "DNS",
  "Cloud",
  "Email",
  "VPN",
  "Web",
] as const;

export const PIPELINE_CONFIG: PipelineConfig = {
  enableDeduplication: true,
  enableEnrichment: true,
  maxBatchSize: 100,
  supportedSources: SUPPORTED_SOURCES,
  supportedSourceTypes: SUPPORTED_SOURCE_TYPES,
  supportedCategories: SUPPORTED_CATEGORIES,
};
