/**
 * VRSOC Log / Event Pipeline — Phase 13
 *
 * Canonical ingestion pipeline for all synthetic telemetry processing.
 * Consumes Phase 12 simulation contracts and persists to Phase 10 schema.
 *
 * Pipeline stages:
 * 1. Validation (validate.ts)
 * 2. Parsing (parse.ts)
 * 3. Normalization (normalize.ts)
 * 4. Enrichment (enrich.ts)
 * 5. Persistence (persist.ts)
 *
 * Orchestrated by orchestrator.ts
 */

export { PIPELINE_CONFIG, SUPPORTED_SOURCES, SUPPORTED_SOURCE_TYPES, SUPPORTED_CATEGORIES } from "./config";
export { validateTelemetryPayload, validateTelemetryBatch } from "./validate";
export { parseTelemetryPayload, type ParsedPayload } from "./parse";
export { normalizePipelinePayload, type NormalizedPipelinePackage } from "./normalize";
export { enrichPipelinePayload, type EnrichmentContext, type EnrichedPipelinePackage } from "./enrich";
export { persistPipelinePackage } from "./persist";
export { processTelemetryEvent, processTelemetryBatch } from "./orchestrator";
