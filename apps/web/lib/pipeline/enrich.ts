/**
 * Pipeline Stage 4: Enrichment
 *
 * Enriches normalized telemetry with context from existing VRSOC data
 * relationships: asset metadata, agent status, identity attributes.
 *
 * Does NOT introduce external threat intelligence feeds.
 * MITRE enrichment belongs to later phases.
 */

import type { NormalizedPipelinePackage } from "./normalize";

export interface EnrichmentContext {
  assetHostname?: string;
  assetType?: string;
  assetCriticality?: string;
  assetGroupName?: string;
  agentVersion?: string;
  agentStatus?: string;
  identityUsername?: string;
  identityDomain?: string;
  identityAccountType?: string;
  identityIsPrivileged?: boolean;
}

export interface EnrichedPipelinePackage extends NormalizedPipelinePackage {
  enrichments: string[];
  enrichmentContext: EnrichmentContext;
}

/**
 * Enriches a normalized pipeline package with available VRSOC entity context.
 * This function operates on in-memory data; database lookups are performed
 * by the orchestrator before calling this function.
 */
export function enrichPipelinePayload(
  normalized: NormalizedPipelinePackage,
  context: EnrichmentContext
): EnrichedPipelinePackage {
  const enrichments: string[] = [];
  const enrichedFields: Record<string, unknown> = {
    ...(normalized.event.normalized_fields as Record<string, unknown>),
  };

  // Asset enrichment
  if (context.assetHostname) {
    enrichedFields.asset_hostname = context.assetHostname;
    enrichments.push("asset_hostname");
  }
  if (context.assetType) {
    enrichedFields.asset_type = context.assetType;
    enrichments.push("asset_type");
  }
  if (context.assetCriticality) {
    enrichedFields.asset_criticality = context.assetCriticality;
    enrichments.push("asset_criticality");
  }
  if (context.assetGroupName) {
    enrichedFields.asset_group = context.assetGroupName;
    enrichments.push("asset_group");
  }

  // Agent enrichment
  if (context.agentVersion) {
    enrichedFields.agent_version = context.agentVersion;
    enrichments.push("agent_version");
  }
  if (context.agentStatus) {
    enrichedFields.agent_status = context.agentStatus;
    enrichments.push("agent_status");
  }

  // Identity enrichment
  if (context.identityUsername) {
    enrichedFields.identity_username = context.identityUsername;
    enrichments.push("identity_username");
  }
  if (context.identityDomain) {
    enrichedFields.identity_domain = context.identityDomain;
    enrichments.push("identity_domain");
  }
  if (context.identityAccountType) {
    enrichedFields.identity_account_type = context.identityAccountType;
    enrichments.push("identity_account_type");
  }
  if (context.identityIsPrivileged !== undefined) {
    enrichedFields.identity_is_privileged = context.identityIsPrivileged;
    enrichments.push("identity_is_privileged");
  }

  return {
    ...normalized,
    event: {
      ...normalized.event,
      normalized_fields: enrichedFields,
    },
    enrichments,
    enrichmentContext: context,
  };
}
