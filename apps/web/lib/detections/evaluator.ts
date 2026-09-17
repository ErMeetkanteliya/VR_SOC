/**
 * Phase 15: Detection & Correlation Rules — Condition Evaluator
 *
 * Provides safe, bounded, deterministic evaluation of detection rule condition trees
 * against canonical telemetry events and logs.
 *
 * Security & Reliability Invariants:
 * - Zero arbitrary code execution (no eval, no Function constructor)
 * - Zero raw SQL generation or evaluation
 * - Bounded recursion depth for condition trees (max depth 5)
 * - Safe regex testing with error boundary and length limits
 */

import type {
  TelemetryEvent,
  LogRecord,
  RuleCondition,
  FieldCondition,
  LogicalConditionGroup,
  RuleOperator,
} from "@vrsoc/types";

/**
 * Extracts a field value from an event using direct attributes or nested paths.
 */
export function extractFieldValue(
  event: TelemetryEvent | LogRecord,
  fieldPath: string
): unknown {
  const normalized = (event as any).normalized_fields as Record<string, unknown> | undefined;
  const rawPayload = (event as any).raw_payload as Record<string, unknown> | undefined;
  const meta = (event as any).metadata as Record<string, unknown> | undefined;

  // 1. Direct top-level properties
  if (fieldPath in event) {
    return (event as any)[fieldPath];
  }

  // Common aliases
  if (fieldPath === "host" || fieldPath === "hostname" || fieldPath === "asset_hostname") {
    return (
      (event as any).asset?.hostname ||
      (event as any).source_host ||
      normalized?.asset_hostname ||
      normalized?.host
    );
  }

  if (fieldPath === "user" || fieldPath === "username" || fieldPath === "target_user") {
    return (
      (event as any).identity?.username ||
      normalized?.user ||
      normalized?.username ||
      normalized?.target_user ||
      rawPayload?.user
    );
  }

  if (fieldPath === "command_line" || fieldPath === "cmdline") {
    return (
      normalized?.command_line ||
      normalized?.cmdline ||
      rawPayload?.command_line ||
      (event as any).process?.command_line
    );
  }

  if (fieldPath === "process_name" || fieldPath === "process") {
    return (
      normalized?.process_name ||
      rawPayload?.process_name ||
      (event as any).process?.name
    );
  }

  if (fieldPath === "file_path" || fieldPath === "file") {
    return (
      normalized?.file_path ||
      rawPayload?.file_path ||
      (event as any).file?.path
    );
  }

  if (fieldPath === "file_hash" || fieldPath === "sha256") {
    return (
      normalized?.sha256 ||
      normalized?.file_hash ||
      rawPayload?.file_hash ||
      (event as any).file?.sha256
    );
  }

  // 2. Nested normalized_fields lookups
  if (normalized && fieldPath in normalized) {
    return normalized[fieldPath];
  }

  // 3. Nested raw_payload lookups
  if (rawPayload && fieldPath in rawPayload) {
    return rawPayload[fieldPath];
  }

  // 4. Nested metadata lookups
  if (meta && fieldPath in meta) {
    return meta[fieldPath];
  }

  // 5. Dotted path resolution (e.g. "raw_payload.process_id", "normalized_fields.attempt_count")
  if (fieldPath.includes(".")) {
    const parts = fieldPath.split(".");
    let current: any = event;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== "object") {
        return undefined;
      }
      current = current[part];
    }
    return current;
  }

  return undefined;
}

// Alias for convenience
export const extractField = extractFieldValue;

/**
 * Evaluates a single field operator comparison.
 */
export function evaluateFieldOperator(
  actualValue: unknown,
  operator: RuleOperator,
  targetValue: unknown
): boolean {
  // Handle exists / not_exists first
  if (operator === "exists") {
    return actualValue !== null && actualValue !== undefined && actualValue !== "";
  }
  if (operator === "not_exists") {
    return actualValue === null || actualValue === undefined || actualValue === "";
  }

  // If actual value is missing, other comparisons fail
  if (actualValue === null || actualValue === undefined) {
    return false;
  }

  // String comparison helpers
  const actualStr = String(actualValue).trim().toLowerCase();
  const targetStr = String(targetValue).trim().toLowerCase();

  switch (operator) {
    case "equals": {
      if (typeof actualValue === "number" && typeof targetValue === "number") {
        return actualValue === targetValue;
      }
      if (typeof actualValue === "boolean") {
        return Boolean(actualValue) === (targetValue === true || targetValue === "true");
      }
      return actualStr === targetStr;
    }

    case "not_equals": {
      if (typeof actualValue === "number" && typeof targetValue === "number") {
        return actualValue !== targetValue;
      }
      return actualStr !== targetStr;
    }

    case "contains": {
      if (Array.isArray(actualValue)) {
        return actualValue.some((item) => String(item).toLowerCase().includes(targetStr));
      }
      return actualStr.includes(targetStr);
    }

    case "not_contains": {
      if (Array.isArray(actualValue)) {
        return !actualValue.some((item) => String(item).toLowerCase().includes(targetStr));
      }
      return !actualStr.includes(targetStr);
    }

    case "starts_with": {
      return actualStr.startsWith(targetStr);
    }

    case "ends_with": {
      return actualStr.endsWith(targetStr);
    }

    case "in": {
      if (Array.isArray(targetValue)) {
        return targetValue.some((t) => String(t).trim().toLowerCase() === actualStr);
      }
      if (typeof targetValue === "string") {
        const parts = targetValue.split(",").map((s) => s.trim().toLowerCase());
        return parts.includes(actualStr);
      }
      return false;
    }

    case "not_in": {
      if (Array.isArray(targetValue)) {
        return !targetValue.some((t) => String(t).trim().toLowerCase() === actualStr);
      }
      if (typeof targetValue === "string") {
        const parts = targetValue.split(",").map((s) => s.trim().toLowerCase());
        return !parts.includes(actualStr);
      }
      return true;
    }

    case "greater_than": {
      const numAct = Number(actualValue);
      const numTgt = Number(targetValue);
      return !isNaN(numAct) && !isNaN(numTgt) && numAct > numTgt;
    }

    case "greater_than_or_equal": {
      const numAct = Number(actualValue);
      const numTgt = Number(targetValue);
      return !isNaN(numAct) && !isNaN(numTgt) && numAct >= numTgt;
    }

    case "less_than": {
      const numAct = Number(actualValue);
      const numTgt = Number(targetValue);
      return !isNaN(numAct) && !isNaN(numTgt) && numAct < numTgt;
    }

    case "less_than_or_equal": {
      const numAct = Number(actualValue);
      const numTgt = Number(targetValue);
      return !isNaN(numAct) && !isNaN(numTgt) && numAct <= numTgt;
    }

    case "regex": {
      try {
        const pattern = String(targetValue);
        // Bounded regex length check
        if (pattern.length > 256) return false;
        const re = new RegExp(pattern, "i");
        return re.test(String(actualValue));
      } catch {
        return false;
      }
    }

    default:
      return false;
  }
}

/**
 * Evaluates a single FieldCondition against an event.
 */
export function evaluateFieldCondition(
  condition: FieldCondition,
  event: TelemetryEvent | LogRecord
): boolean {
  const actualVal = extractFieldValue(event, condition.field);
  return evaluateFieldOperator(actualVal, condition.operator, condition.value);
}

/**
 * Recursively evaluates a condition node against an event.
 */
export function evaluateCondition(
  condition: RuleCondition,
  event: TelemetryEvent | LogRecord,
  explanations: string[] = [],
  depth: number = 0
): boolean {
  // Prevent stack overflow / pathological recursion
  if (depth > 5) {
    return false;
  }

  // 1. Single Field Condition
  if ("field" in condition) {
    const actualVal = extractFieldValue(event, condition.field);
    const isMatch = evaluateFieldOperator(actualVal, condition.operator, condition.value);

    if (isMatch) {
      explanations.push(
        `Field '${condition.field}' [${String(actualVal)}] ${condition.operator} '${String(condition.value)}'`
      );
    }
    return isMatch;
  }

  // 2. Logical Group Condition (AND, OR, NOT)
  const group = condition as LogicalConditionGroup;
  if (!group.conditions || group.conditions.length === 0) {
    return false;
  }

  const op = group.operator || group.logicalOperator || "AND";

  if (op === "AND") {
    for (const sub of group.conditions) {
      if (!evaluateCondition(sub, event, explanations, depth + 1)) {
        return false;
      }
    }
    return true;
  }

  if (op === "OR") {
    for (const sub of group.conditions) {
      if (evaluateCondition(sub, event, explanations, depth + 1)) {
        return true;
      }
    }
    return false;
  }

  if (op === "NOT") {
    // NOT group matches if none of the subconditions match
    const subMatch = group.conditions.some((sub) =>
      evaluateCondition(sub, event, [], depth + 1)
    );
    if (!subMatch) {
      explanations.push("NOT condition matched (negated sub-rules evaluated false)");
      return true;
    }
    return false;
  }

  return false;
}
