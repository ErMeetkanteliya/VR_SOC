/**
 * Pipeline Orchestrator
 *
 * Chains all pipeline stages into a single processing flow:
 * Validation → Parsing → Normalization → Enrichment → Persistence
 *
 * Handles:
 * - Single event processing
 * - Batch processing
 * - Enrichment context resolution from Supabase
 * - Tenant isolation verification
 * - Processing metrics collection
 * - Graceful error handling at each stage
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateTelemetryPayload } from "./validate";
import { parseTelemetryPayload } from "./parse";
import { normalizePipelinePayload } from "./normalize";
import { enrichPipelinePayload, type EnrichmentContext } from "./enrich";
import { persistPipelinePackage } from "./persist";
import { PIPELINE_CONFIG } from "./config";
import type { PipelineResult, PipelineBatchResult } from "@vrsoc/types";

/**
 * Processes a single telemetry payload through all pipeline stages.
 */
export async function processTelemetryEvent(
  payload: unknown,
  options?: {
    skipDeduplication?: boolean;
    skipEnrichment?: boolean;
  }
): Promise<PipelineResult> {
  const startTime = Date.now();

  // Stage 1: Validation
  const validation = validateTelemetryPayload(payload);
  if (!validation.valid || !validation.data) {
    return {
      success: false,
      stage: "Failed",
      failedStage: "Validated",
      ingestionId: "",
      processingDurationMs: Date.now() - startTime,
      error: validation.errors?.join("; ") || "Validation failed.",
    };
  }

  const validatedData = validation.data;

  // Stage 2: Parsing
  const parsed = parseTelemetryPayload(validatedData);

  // Stage 3: Normalization
  const normalized = normalizePipelinePayload(parsed);

  // Stage 4: Enrichment
  let enrichmentContext: EnrichmentContext = {};
  if (!options?.skipEnrichment && PIPELINE_CONFIG.enableEnrichment) {
    enrichmentContext = await resolveEnrichmentContext(
      validatedData.organizationId,
      validatedData.assetId || null,
      validatedData.agentId || null,
      validatedData.identityId || null
    );
  }
  const enriched = enrichPipelinePayload(normalized, enrichmentContext);

  // Stage 5: Persistence
  const result = await persistPipelinePackage(enriched, {
    skipDeduplication: options?.skipDeduplication,
  });

  return result;
}

/**
 * Processes a batch of telemetry payloads through the pipeline.
 */
export async function processTelemetryBatch(
  payloads: unknown[],
  options?: {
    skipDeduplication?: boolean;
    skipEnrichment?: boolean;
  }
): Promise<PipelineBatchResult> {
  const startTime = Date.now();
  const maxBatch = PIPELINE_CONFIG.maxBatchSize;
  const limitedPayloads = payloads.slice(0, maxBatch);

  const results: PipelineResult[] = [];
  let succeeded = 0;
  let failed = 0;
  let duplicatesSkipped = 0;

  for (const payload of limitedPayloads) {
    const result = await processTelemetryEvent(payload, options);
    results.push(result);

    if (result.success) {
      succeeded++;
    } else if (result.error?.includes("duplicate")) {
      duplicatesSkipped++;
    } else {
      failed++;
    }
  }

  return {
    processed: limitedPayloads.length,
    succeeded,
    failed,
    duplicatesSkipped,
    results,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Resolves enrichment context from the database for a given set of entity references.
 * This performs read-only queries to gather context data.
 */
async function resolveEnrichmentContext(
  organizationId: string,
  assetId: string | null,
  agentId: string | null,
  identityId: string | null
): Promise<EnrichmentContext> {
  const context: EnrichmentContext = {};

  try {
    const supabase = await createServerSupabaseClient();

    // Resolve asset context
    if (assetId) {
      const { data: asset } = await supabase
        .from("assets")
        .select("hostname, asset_type, criticality, asset_groups(name)")
        .eq("id", assetId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (asset) {
        context.assetHostname = asset.hostname;
        context.assetType = asset.asset_type;
        context.assetCriticality = asset.criticality;
        if (asset.asset_groups && typeof asset.asset_groups === "object" && "name" in asset.asset_groups) {
          context.assetGroupName = (asset.asset_groups as { name: string }).name;
        }
      }
    }

    // Resolve agent context
    if (agentId) {
      const { data: agent } = await supabase
        .from("agents")
        .select("agent_version, status")
        .eq("id", agentId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (agent) {
        context.agentVersion = agent.agent_version;
        context.agentStatus = agent.status;
      }
    }

    // Resolve identity context
    if (identityId) {
      const { data: identity } = await supabase
        .from("soc_identities")
        .select("username, domain, account_type, is_privileged")
        .eq("id", identityId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (identity) {
        context.identityUsername = identity.username;
        context.identityDomain = identity.domain;
        context.identityAccountType = identity.account_type;
        context.identityIsPrivileged = identity.is_privileged;
      }
    }
  } catch (err) {
    console.warn("[resolveEnrichmentContext] Enrichment query failed (using empty context):", err);
  }

  return context;
}
