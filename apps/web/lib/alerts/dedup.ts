/**
 * Phase 16: Alert Deduplication Key Generator
 *
 * Computes stable, deterministic deduplication keys for incoming detection results.
 * Prevents redundant alert generation for the same recurring condition within
 * an evaluation time bucket.
 */

import type { DetectionExecutionResult } from "@vrsoc/types";

/**
 * Computes a deterministic deduplication key for a detection result.
 * Format: `ruleId:assetRef:identityRef:timeBucket`
 */
export function generateAlertDedupKey(
  detectionResult: DetectionExecutionResult,
  bucketWindowMinutes: number = 30
): string {
  const ruleKey = detectionResult.ruleId || "unknown-rule";
  const assetKey = detectionResult.primaryAssetId || "global-asset";
  const identityKey = detectionResult.primaryIdentityId || "global-identity";

  // Bucket the timestamp to the specified window (default 30 mins)
  const evalDate = new Date(detectionResult.evaluatedAt);
  const epochMs = evalDate.getTime();
  const bucketMs = bucketWindowMinutes * 60 * 1000;
  const bucketIndex = Math.floor(epochMs / bucketMs);

  return `${ruleKey}:${assetKey}:${identityKey}:${bucketIndex}`;
}
