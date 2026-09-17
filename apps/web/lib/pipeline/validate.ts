/**
 * Pipeline Stage 1: Validation
 *
 * Validates incoming telemetry payloads before further pipeline processing.
 * Rejects malformed timestamps, invalid source types, missing required fields,
 * and potentially forged tenant/resource IDs.
 */

import { PipelineIngestionSchema } from "@vrsoc/validation";
import type { PipelineStage } from "@vrsoc/types";
import type { z } from "zod";

export interface ValidationResult {
  valid: boolean;
  stage: PipelineStage;
  data?: z.infer<typeof PipelineIngestionSchema>;
  errors?: string[];
}

/**
 * Validates a raw telemetry payload against the PipelineIngestionSchema.
 * Returns a structured validation result with parsed data or errors.
 */
export function validateTelemetryPayload(
  payload: unknown
): ValidationResult {
  const result = PipelineIngestionSchema.safeParse(payload);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    return {
      valid: false,
      stage: "Failed",
      errors,
    };
  }

  // Additional semantic validation beyond Zod schema
  const data = result.data;
  const semanticErrors: string[] = [];

  // Validate occurred_at is not in the far future (> 5 minutes ahead)
  if (data.occurredAt) {
    const eventTime = new Date(data.occurredAt).getTime();
    const futureLimit = Date.now() + 5 * 60 * 1000;
    if (eventTime > futureLimit) {
      semanticErrors.push("occurredAt: Event timestamp is more than 5 minutes in the future.");
    }
  }

  // Validate organization ID is not empty UUID
  if (data.organizationId === "00000000-0000-0000-0000-000000000000") {
    semanticErrors.push("organizationId: Null UUID is not a valid organization.");
  }

  if (semanticErrors.length > 0) {
    return {
      valid: false,
      stage: "Failed",
      errors: semanticErrors,
    };
  }

  return {
    valid: true,
    stage: "Validated",
    data,
  };
}

/**
 * Validates a batch of telemetry payloads.
 * Returns individual results for each payload.
 */
export function validateTelemetryBatch(
  payloads: unknown[]
): ValidationResult[] {
  return payloads.map((payload) => validateTelemetryPayload(payload));
}
