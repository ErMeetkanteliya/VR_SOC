# Architecture: Detection & Correlation Engine

> **Subsystem:** Phase 15 — Detection & Correlation Engine  
> **Target Technology:** Next.js (App Router) + TypeScript + PostgreSQL (Supabase) + Vitest  
> **Status:** Authoritative Architecture Reference

---

## 1. Overview & Canonical Pipeline Placement

The **Detection & Correlation Engine** is the foundational defensive rule evaluation engine for VRSOC. It evaluates normalized telemetry streams persisted in PostgreSQL (`public.events`, `public.logs`) and generates structured match results with clear explanations and event attribution.

The engine sits strictly inside the canonical telemetry and response lifecycle:

```text
Simulation / EDR Agent Telemetry
              ↓
Phase 13 Ingestion & Normalization Pipeline (public.events, public.logs)
              ↓
Phase 14 SIEM Query Layer
              ↓
Phase 15 Detection & Correlation Engine (Authoritative Evaluation Boundary)
              ↓
Phase 16 Alerts & Deduplication Layer (Future)
              ↓
Phase 17+ Incident Response, Case Dossiers & SOAR Actions
```

### 1.1 Strict Boundary Invariants
1. **No Alert Entities in Phase 15**: Phase 15 produces structured detection results (`DetectionExecutionResult`), not alerts, incident tickets, or cases. Phase 16 converts detection results into alerts and manages deduplication.
2. **Deterministic Evaluation**: Given the same telemetry records and evaluation window, the engine produces identical match results and explanation traces.
3. **No Arbitrary Code / SQL Execution**: The condition language is strictly data-driven with bounded comparison operators. Arbitrary JavaScript (`eval`, `new Function`), dynamic SQL injection, or unvalidated regex lookups are strictly prohibited.
4. **PostgreSQL as Canonical Execution Store**: No secondary streaming platforms (Kafka, OpenSearch, Redis Streams) or heavy external rule engines are introduced.

---

## 2. Detection Rule Contract & Schema

Detection rules are strictly typed via `@vrsoc/types` and validated at runtime using `@vrsoc/validation`.

### 2.1 Rule Types
- **`single_event`**: Matches when any individual telemetry event satisfies the rule condition tree (signature detection).
- **`threshold`**: Matches when the count of matching telemetry events within the evaluation window exceeds or meets `threshold_count` (e.g., &ge; 5 failed logins within 15 minutes).
- **`correlation`**: Evaluates cluster groupings across assets or identities (e.g., &ge; 2 correlated suspicious events across the same endpoint).
- **`sequence`**: Matches sequential operations across an evaluation window.

### 2.2 Rule Schema Attributes
```typescript
export interface DetectionRule {
  id: string;                                // UUID or built-in system ID
  organization_id?: string | null;           // Tenant UUID (null for system baselines)
  name: string;                              // Descriptive rule title
  description?: string | null;               // Detailed detection rationale
  severity: SeverityLevel;                   // "Critical" | "High" | "Medium" | "Low" | "Informational"
  rule_type: DetectionRuleType;              // "single_event" | "threshold" | "correlation" | "sequence"
  category: string;                          // Category (auth, process, file, network, etc.)
  mitre_tactic?: string | null;              // MITRE ATT&CK Tactic (e.g. "Execution")
  mitre_technique_id?: string | null;        // MITRE Technique ID (e.g. "T1059.001")
  mitre_technique_name?: string | null;      // MITRE Technique Name (e.g. "PowerShell")
  is_enabled: boolean;                       // Activation state
  is_system: boolean;                        // System baseline vs custom tenant rule
  evaluation_window_minutes?: number;        // Lookback window (e.g. 15 minutes)
  threshold_count?: number;                  // Required event threshold (default: 1)
  conditions: RuleCondition;                 // Structured FieldCondition or LogicalConditionGroup
  tags?: string[];                           // Categorization tags
  metadata?: Record<string, unknown>;        // Additional metadata / remediation guidance
  created_by?: string | null;                // User ID who authored custom rule
  created_at: string;
  updated_at: string;
}
```

---

## 3. Condition Language & Operator Model

Condition trees are evaluated recursively up to a strict maximum depth of 5 to prevent pathological recursion.

### 3.1 Supported Comparison Operators
| Operator | Type | Description |
| :--- | :--- | :--- |
| `equals` | Equality | Case-insensitive string equality, numeric equality, or boolean match |
| `not_equals` | Inequality | Negated equality comparison |
| `contains` | Substring / Array | Substring search or item lookup in arrays |
| `not_contains` | Substring / Array | Negated substring search |
| `starts_with` | Prefix | Case-insensitive prefix check |
| `ends_with` | Suffix | Case-insensitive suffix check |
| `greater_than` | Numeric | Numeric `>` comparison |
| `greater_than_or_equal` | Numeric | Numeric `>=` comparison |
| `less_than` | Numeric | Numeric `<` comparison |
| `less_than_or_equal` | Numeric | Numeric `<=` comparison |
| `in` | Set Membership | Array membership or comma-separated string item matching |
| `not_in` | Set Membership | Negated array or comma-separated item matching |
| `exists` | Existence | Non-null, non-undefined, non-empty check |
| `not_exists` | Existence | Null, undefined, or empty check |
| `regex` | Pattern Match | Bounded regex matching (pattern max length &le; 256 characters) |

### 3.2 Logical Group Combinations
- **`AND`**: All nested condition child nodes must evaluate to `true`.
- **`OR`**: At least one nested condition child node must evaluate to `true`.
- **`NOT`**: Inverts evaluation of nested sub-conditions (matches if none evaluate to true).

---

## 4. Built-in System Baseline Rules

The detection engine provides 7 authoritative, pre-tuned baseline rules covering the Phase 12 educational simulation scenarios:

1. **`rule-brute-force-auth`** (MITRE `T1110.001` - Password Guessing): Threshold &ge; 5 failed authentications within 15 minutes.
2. **`rule-powershell-encoded-exec`** (MITRE `T1059.001` - PowerShell): Detects PowerShell execution with `-enc` / `-encodedcommand` or hidden window switches.
3. **`rule-scheduled-task-persistence`** (MITRE `T1053.005` - Scheduled Task): Detects `schtasks.exe /create` persistence indicators.
4. **`rule-ransomware-vssadmin-deletion`** (MITRE `T1490` - Inhibit System Recovery): Detects `vssadmin.exe delete shadows /all /quiet`.
5. **`rule-network-port-scan`** (MITRE `T1046` - Network Service Discovery): Detects rapid TCP SYN port scan bursts.
6. **`rule-usb-unauthorized-hardware`** (MITRE `T1200` - Hardware Additions): Detects unauthorized removable USB mass storage device connections.
7. **`rule-canary-file-modification`** (MITRE `T1486` - Data Encrypted for Impact): Detects unauthorized canary/honeypot file modifications.

---

## 5. Structured Detection Result & Phase 16 Boundary

When a rule is evaluated against telemetry, it yields a `DetectionExecutionResult`:

```typescript
export interface DetectionExecutionResult {
  ruleId: string;
  ruleName: string;
  severity: SeverityLevel;
  matched: boolean;
  evaluatedAt: string;
  evaluationWindow: {
    start: string;
    end: string;
  };
  matchedEventIds: string[];
  matchedEvents: TelemetryEvent[];
  primaryAssetId?: string | null;
  primaryIdentityId?: string | null;
  explanation: {
    ruleId: string;
    ruleName: string;
    matched: boolean;
    summary: string;
    details: string[];
    evaluatedCount: number;
    matchedCount: number;
  };
  metadata?: Record<string, unknown>;
}
```

### Phase 16 Alerting Readiness
- **Deduplication Key**: Phase 16 can use `ruleId + primaryAssetId + evaluationWindow` to deduplicate matches.
- **Traceability**: All matched record IDs are explicitly captured in `matchedEventIds`.
- **Explainability**: `details` contains step-by-step match logs displaying exact field values and matched operators for analyst review.

---

## 6. Security, RBAC & Multi-Tenancy

- **Database RLS Policies**: Enforced on `public.detection_rules`. Authenticated users can read their tenant's rules + global system rules (`is_system = true`). Users can only insert, update, or delete rules belonging to their active tenant (`organization_id = auth.current_org_id()`).
- **Server Action Authorization**: Evaluates permissions (`detections:read`, `detections:create`, `detections:update`, `detections:delete`, `detections:test`) via authoritative RBAC guards.
- **System Rule Immutability**: System baseline rules cannot be modified or deleted via API.
