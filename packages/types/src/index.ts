// ==============================================================================
// VRSOC — Core Domain Type Definitions
// ==============================================================================

export const ALL_USER_ROLES = [
  "Super Admin",
  "Instructor",
  "Student",
  "SOC Analyst",
  "Incident Responder",
  "Threat Hunter",
  "Auditor",
  "Viewer",
] as const;

export type UserRole = (typeof ALL_USER_ROLES)[number];

export type Permission =
  // Identity & Organizations
  | "org:members:invite"
  | "org:members:remove"
  | "org:members:update_role"
  | "org:settings:manage"
  | "org:api_keys:manage"
  // SOC Telemetry & Agents
  | "agents:read"
  | "agents:isolate"
  | "agents:restart"
  | "agents:collect_logs"
  | "telemetry:read"
  | "telemetry:query"
  // Detections & MITRE
  | "detections:read"
  | "detections:create"
  | "detections:update"
  | "detections:delete"
  | "detections:test"
  | "mitre:read"
  | "mitre:simulate"
  // Alerts & Incidents
  | "alerts:read"
  | "alerts:triage"
  | "alerts:comment"
  | "alerts:escalate"
  | "incidents:read"
  | "incidents:create"
  | "incidents:update_status"
  | "incidents:assign"
  | "incidents:close"
  // Cases & Evidence
  | "cases:read"
  | "cases:create"
  | "cases:add_evidence"
  | "cases:add_notes"
  | "cases:close"
  // SOAR & Automation
  | "soar:playbooks:read"
  | "soar:playbooks:create"
  | "soar:playbooks:update"
  | "soar:playbooks:execute"
  | "soar:actions:execute"
  | "soar:approvals:manage"
  // Training & Simulation
  | "simulation:scenarios:read"
  | "simulation:scenarios:create"
  | "simulation:scenarios:launch"
  | "training:cohorts:manage"
  | "training:quizzes:take"
  | "training:submissions:grade"
  // Compliance & GRC
  | "compliance:read"
  | "compliance:update_controls"
  | "compliance:export"
  // Audit & Reporting
  | "reports:generate"
  | "reports:export"
  | "audit:read";

export interface AuthorizeOptions {
  organizationId: string;
  permission: Permission;
}

export interface AuthorizeResult {
  authorized: boolean;
  userId?: string;
  organizationId?: string;
  role?: UserRole;
  error?: string;
}

export type MembershipStatus = "active" | "inactive" | "revoked" | "pending";

export type OrganizationStatus = "active" | "suspended" | "archived";

export type SeverityLevel =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Informational"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "informational";

export type AlertStatus =
  | "Open"
  | "Acknowledged"
  | "In Progress"
  | "Escalated"
  | "Closed"
  | "False Positive"
  | "open"
  | "acknowledged"
  | "in_progress"
  | "escalated"
  | "closed"
  | "false_positive";

export type IncidentStage =
  | "Detection"
  | "Analysis"
  | "Containment"
  | "Eradication"
  | "Recovery"
  | "Lessons Learned"
  | "Closed";

export type AgentStatus = "Online" | "Warning" | "Critical" | "Offline" | "Updating" | "Pending" | "Error";

export type AssetType = "Endpoint" | "Server" | "Domain Controller" | "Firewall" | "Cloud VM" | "Container";

export type OSType = "Windows" | "Linux" | "macOS" | "NetworkOS" | "Cloud";

export type AssetStatus = "Active" | "Warning" | "Critical" | "Isolated" | "Decommissioned" | "Offline";

export type IdentityAccountType = "User" | "Admin" | "Service" | "System";

export type LogLevel = "DEBUG" | "INFO" | "NOTICE" | "WARN" | "ERROR" | "CRIT" | "ALERT" | "EMERG";

export type LogParseStatus = "Raw" | "Parsed" | "Failed" | "Dropped";

export type NetworkProtocol = "TCP" | "UDP" | "ICMP" | "DNS" | "HTTP" | "HTTPS" | "TLS";

export type NetworkDirection = "Inbound" | "Outbound" | "Internal" | "Lateral";

export type NetworkConnectionStatus = "Established" | "Closed" | "Blocked" | "Listening" | "SYN_SENT" | "Time_Wait";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
  organization?: Organization;
  profile?: Profile;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  membership_id: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  token: string;
  invited_by?: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
}

export interface TenantContext {
  activeOrganization: Organization | null;
  userMemberships: Membership[];
  isLoading: boolean;
}

// ------------------------------------------------------------------------------
// Phase 10 Core SOC Domain Entities
// ------------------------------------------------------------------------------

export interface AssetGroup {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  criticality: SeverityLevel;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Asset {
  id: string;
  organization_id: string;
  asset_group_id?: string | null;
  hostname: string;
  display_name?: string | null;
  asset_type: AssetType;
  os_type: OSType;
  os_version?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  criticality: SeverityLevel;
  status: AssetStatus;
  is_isolated: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  group?: AssetGroup;
  agent?: Agent;
}

export interface Agent {
  id: string;
  organization_id: string;
  asset_id: string;
  agent_version: string;
  status: AgentStatus;
  cpu_usage_pct: number;
  ram_usage_pct: number;
  disk_usage_pct: number;
  last_seen_at: string;
  heartbeat_interval_seconds: number;
  capabilities: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  asset?: Asset;
}

export interface AgentWithAsset extends Agent {
  asset: Asset;
}

export interface AgentFleetSummary {
  totalAgents: number;
  onlineAgents: number;
  offlineAgents: number;
  updatingAgents: number;
  errorAgents: number;
  pendingAgents: number;
  isolatedAgents: number;
  avgCpuUsagePct: number;
  avgRamUsagePct: number;
  avgDiskUsagePct: number;
}

export interface SocIdentity {
  id: string;
  organization_id: string;
  user_id?: string | null;
  username: string;
  display_name?: string | null;
  email?: string | null;
  domain: string;
  department?: string | null;
  account_type: IdentityAccountType;
  is_privileged: boolean;
  is_locked: boolean;
  last_login_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TelemetryEvent {
  id: string;
  organization_id: string;
  occurred_at: string;
  source: string;
  source_type: string;
  category: string;
  event_type: string;
  severity: SeverityLevel;
  asset_id?: string | null;
  agent_id?: string | null;
  identity_id?: string | null;
  raw_payload?: Record<string, unknown> | null;
  normalized_fields: Record<string, unknown>;
  tags?: string[];
  pipeline_status?: PipelineStage;
  ingestion_id?: string | null;
  source_host?: string | null;
  created_at: string;
  asset?: Asset;
  agent?: Agent;
  identity?: SocIdentity;
}

export interface LogRecord {
  id: string;
  organization_id: string;
  event_id?: string | null;
  logged_at: string;
  facility: string;
  log_level: LogLevel;
  source_host?: string | null;
  service_name?: string | null;
  message: string;
  raw_log?: string | null;
  parse_status: LogParseStatus;
  parser_name?: string | null;
  pipeline_status?: PipelineStage;
  ingestion_id?: string | null;
  source?: string | null;
  source_type?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  event?: TelemetryEvent;
}

export interface ProcessRecord {
  id: string;
  organization_id: string;
  asset_id: string;
  agent_id?: string | null;
  pid: number;
  ppid?: number | null;
  process_guid?: string | null;
  parent_process_guid?: string | null;
  name: string;
  executable_path: string;
  command_line?: string | null;
  identity_id?: string | null;
  username?: string | null;
  sha256?: string | null;
  md5?: string | null;
  started_at: string;
  ended_at?: string | null;
  integrity_level?: "Low" | "Medium" | "High" | "System";
  metadata?: Record<string, unknown>;
  created_at: string;
  asset?: Asset;
  agent?: Agent;
  identity?: SocIdentity;
}

export interface FileRecord {
  id: string;
  organization_id: string;
  asset_id: string;
  path: string;
  name: string;
  extension?: string | null;
  size_bytes: number;
  sha256?: string | null;
  md5?: string | null;
  is_signed: boolean;
  signer_name?: string | null;
  is_hidden: boolean;
  is_executable: boolean;
  permissions?: string | null;
  owner?: string | null;
  file_created_at?: string | null;
  file_modified_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  asset?: Asset;
}

export interface NetworkConnectionRecord {
  id: string;
  organization_id: string;
  asset_id?: string | null;
  process_id?: string | null;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: NetworkProtocol;
  direction: NetworkDirection;
  status: NetworkConnectionStatus;
  bytes_sent: number;
  bytes_received: number;
  duration_ms: number;
  started_at: string;
  ended_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  asset?: Asset;
  process?: ProcessRecord;
}

// ------------------------------------------------------------------------------
// Alerts & Incidents
// ------------------------------------------------------------------------------

export interface Alert {
  id: string;
  organization_id: string;
  rule_id?: string | null;
  alert_code: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  risk_score: number;
  status: AlertStatus;
  source: string;
  occurred_at: string;
  triggered_at?: string;
  asset_id?: string | null;
  agent_id?: string | null;
  identity_id?: string | null;
  matched_event_ids?: string[];
  mitre_tactic?: string | null;
  mitre_technique_id?: string | null;
  mitre_technique_name?: string | null;
  explanation?: DetectionMatchExplanation | Record<string, unknown> | null;
  dedup_key: string;
  assigned_to?: string | null;
  assignee_id?: string | null;
  assignee?: { id: string; email?: string; full_name?: string } | null;
  asset?: Asset | null;
  identity?: SocIdentity | null;
  acknowledged_at?: string | null;
  closed_at?: string | null;
  closed_reason?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  organization_id: string;
  alert_id: string;
  actor_id?: string | null;
  actor?: { id: string; email?: string; full_name?: string } | null;
  action: string;
  previous_status?: string | null;
  new_status?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AlertFilterParams {
  query?: string;
  status?: AlertStatus | "ALL";
  severity?: SeverityLevel | "ALL";
  ruleId?: string;
  assetId?: string;
  identityId?: string;
  mitreTechniqueId?: string;
  timeRange?: "1h" | "6h" | "24h" | "7d" | "30d" | "all";
  page?: number;
  pageSize?: number;
  sortBy?: "occurred_at" | "created_at" | "severity" | "risk_score";
  sortDirection?: "asc" | "desc";
}

export interface AlertTriageUpdateInput {
  alertId: string;
  organizationId?: string;
  status?: AlertStatus;
  assignedTo?: string | null;
  note?: string;
  closedReason?: string;
}

export interface CreateAlertFromDetectionInput {
  organizationId: string;
  detectionResult: DetectionExecutionResult;
  rule?: DetectionRule;
}

export interface Incident {
  id: string;
  organization_id: string;
  incident_number: string;
  title: string;
  summary: string;
  severity: SeverityLevel;
  stage: IncidentStage;
  lead_responder_id?: string;
  declared_at: string;
  closed_at?: string;
}

// ------------------------------------------------------------------------------
// Phase 12 Telemetry Engine & Simulation Pipeline Entities
// ------------------------------------------------------------------------------

export type SimulationScenarioCategory =
  | "Authentication Attacks"
  | "Endpoint Execution"
  | "Persistence Mechanism"
  | "Network Anomalies"
  | "Hardware Additions"
  | "Ransomware & Destruction"
  | "Cloud & Identity";

export type SimulationStatus = "Pending" | "Running" | "Completed" | "Failed" | "Cancelled";

export interface SimulationScenarioStep {
  step: number;
  delay_ms: number;
  description: string;
  source: string;
  source_type: string;
  category: string;
  event_type: string;
  severity: SeverityLevel;
  log_level: LogLevel;
  log_message: string;
  raw_log?: string;
  mitre_tactic?: string;
  mitre_technique?: string;
  normalized_fields: Record<string, unknown>;
  process?: {
    name: string;
    executablePath: string;
    commandLine?: string;
    sha256?: string;
    integrityLevel?: "Low" | "Medium" | "High" | "System";
  };
  file?: {
    path: string;
    name: string;
    extension?: string;
    sizeBytes?: number;
    sha256?: string;
    isExecutable?: boolean;
    isHidden?: boolean;
  };
  network?: {
    srcIp: string;
    dstIp: string;
    srcPort: number;
    dstPort: number;
    protocol?: NetworkProtocol;
    direction?: NetworkDirection;
    status?: NetworkConnectionStatus;
  };
}

export interface SimulationScenario {
  id: string;
  organization_id?: string | null;
  slug: string;
  name: string;
  category: SimulationScenarioCategory;
  severity: SeverityLevel;
  description: string;
  learning_outcome: string;
  mitre_tactics: string[];
  mitre_techniques: string[];
  duration_seconds: number;
  event_sequence: SimulationScenarioStep[];
  is_system: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SimulationRun {
  id: string;
  organization_id: string;
  scenario_id: string;
  status: SimulationStatus;
  target_asset_id?: string | null;
  target_agent_id?: string | null;
  target_identity_id?: string | null;
  initiated_by?: string | null;
  events_generated_count: number;
  logs_generated_count: number;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
  started_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  scenario?: SimulationScenario;
  target_asset?: Asset;
  target_agent?: Agent;
  target_identity?: SocIdentity;
}

export interface SimulationRunEvent {
  id: string;
  organization_id: string;
  simulation_run_id: string;
  event_id: string;
  sequence_number: number;
  created_at: string;
  event?: TelemetryEvent;
}

export interface TelemetryStats {
  totalEvents: number;
  totalLogs: number;
  eventsLastHour: number;
  activeSimulations: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };
  categoryBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
}

export interface HealthCheckResponse {
  status: "operational" | "degraded" | "down";
  timestamp: string;
  version: string;
  services: {
    database: "connected" | "disconnected" | "mock";
    auth: "ready" | "unavailable";
    telemetry: "active" | "standby";
  };
}

// ------------------------------------------------------------------------------
// Phase 13 Log / Event Pipeline
// ------------------------------------------------------------------------------

export type PipelineStage = "Received" | "Validated" | "Parsed" | "Normalized" | "Enriched" | "Stored" | "Failed";

export interface PipelineResult {
  success: boolean;
  stage: PipelineStage;
  eventId?: string;
  logId?: string;
  ingestionId: string;
  processingDurationMs: number;
  enrichments?: string[];
  error?: string;
  failedStage?: PipelineStage;
}

export interface PipelineBatchResult {
  processed: number;
  succeeded: number;
  failed: number;
  duplicatesSkipped: number;
  results: PipelineResult[];
  totalDurationMs: number;
}

export interface IngestionMetrics {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  totalDuplicatesSkipped: number;
  avgProcessingDurationMs: number;
  sourceDistribution: Record<string, number>;
  severityDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  pipelineStatusDistribution: Record<string, number>;
  lastProcessedAt?: string;
}

export interface PipelineConfig {
  enableDeduplication: boolean;
  enableEnrichment: boolean;
  maxBatchSize: number;
  supportedSources: readonly string[];
  supportedSourceTypes: readonly string[];
  supportedCategories: readonly string[];
}

// ------------------------------------------------------------------------------
// Phase 14 SIEM Core Entities & Query Contracts
// ------------------------------------------------------------------------------

export type SiemTimeRange =
  | "15m"
  | "30m"
  | "1h"
  | "6h"
  | "12h"
  | "24h"
  | "7d"
  | "30d"
  | "custom"
  | "all";

export interface SiemFilterParams {
  query?: string;
  timeRange?: SiemTimeRange;
  startTime?: string;
  endTime?: string;
  severity?: SeverityLevel | "ALL";
  source?: string | "ALL";
  sourceType?: string | "ALL";
  category?: string | "ALL";
  eventType?: string;
  assetId?: string;
  agentId?: string;
  identityId?: string;
  username?: string;
  pipelineStatus?: PipelineStage | "ALL";
  page?: number;
  pageSize?: number;
  sortBy?: "occurred_at" | "created_at" | "severity";
  sortDirection?: "asc" | "desc";
}

export interface SiemQueryResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  durationMs: number;
  appliedFilters: SiemFilterParams;
}

export type SiemCorrelationType =
  | "asset"
  | "identity"
  | "agent"
  | "ingestion_batch"
  | "time_window";

export interface SiemCorrelatedGroup {
  correlationType: SiemCorrelationType;
  correlationKey: string;
  label: string;
  reason: string;
  events: TelemetryEvent[];
  count: number;
  timeSpan: {
    start: string;
    end: string;
  };
}

export interface SiemTimelineItem {
  id: string;
  occurredAt: string;
  createdAt: string;
  type: "event" | "log";
  title: string;
  source: string;
  sourceType?: string;
  severity: SeverityLevel;
  category: string;
  summary: string;
  assetHostname?: string;
  assetId?: string;
  username?: string;
  details: Record<string, unknown>;
  rawEvent?: TelemetryEvent;
  rawLog?: LogRecord;
}

export interface SavedQuery {
  id: string;
  organization_id: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  query_type: "events" | "logs" | "correlated";
  filters: Partial<SiemFilterParams>;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedQueryInput {
  name: string;
  description?: string;
  queryType?: "events" | "logs" | "correlated";
  filters: Partial<SiemFilterParams>;
  isPinned?: boolean;
}

// ------------------------------------------------------------------------------
// Phase 15 Detection & Correlation Rules
// ------------------------------------------------------------------------------

export type DetectionRuleType =
  | "single_event"
  | "threshold"
  | "correlation"
  | "sequence";

export type RuleOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "exists"
  | "not_exists"
  | "regex";

export interface FieldCondition {
  field: string;
  operator: RuleOperator;
  value: unknown;
}

export interface LogicalConditionGroup {
  operator?: "AND" | "OR" | "NOT";
  logicalOperator?: "AND" | "OR" | "NOT";
  conditions: (FieldCondition | LogicalConditionGroup)[];
}

export type RuleCondition = FieldCondition | LogicalConditionGroup;

export interface DetectionRule {
  id: string;
  organization_id?: string | null;
  name: string;
  description?: string | null;
  severity: SeverityLevel;
  rule_type: DetectionRuleType;
  category: string;
  mitre_tactic?: string | null;
  mitre_technique_id?: string | null;
  mitre_technique_name?: string | null;
  is_enabled: boolean;
  is_system: boolean;
  evaluation_window_minutes?: number;
  threshold_count?: number;
  conditions: RuleCondition;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDetectionRuleInput {
  organization_id?: string;
  organizationId?: string;
  name: string;
  description?: string;
  severity?: SeverityLevel;
  rule_type?: DetectionRuleType;
  ruleType?: DetectionRuleType;
  category?: string;
  mitre_tactic?: string;
  mitreTactic?: string;
  mitre_technique_id?: string;
  mitreTechniqueId?: string;
  mitre_technique_name?: string;
  mitreTechniqueName?: string;
  is_enabled?: boolean;
  isEnabled?: boolean;
  evaluation_window_minutes?: number;
  evaluationWindowMinutes?: number;
  threshold_count?: number;
  thresholdCount?: number;
  conditions: RuleCondition;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateDetectionRuleInput {
  id: string;
  organization_id?: string;
  organizationId?: string;
  name?: string;
  description?: string;
  severity?: SeverityLevel;
  rule_type?: DetectionRuleType;
  ruleType?: DetectionRuleType;
  category?: string;
  mitre_tactic?: string;
  mitreTactic?: string;
  mitre_technique_id?: string;
  mitreTechniqueId?: string;
  mitre_technique_name?: string;
  mitreTechniqueName?: string;
  is_enabled?: boolean;
  isEnabled?: boolean;
  evaluation_window_minutes?: number;
  evaluationWindowMinutes?: number;
  threshold_count?: number;
  thresholdCount?: number;
  conditions?: RuleCondition;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DetectionMatchExplanation {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  summary: string;
  details: string[];
  evaluatedCount: number;
  matchedCount: number;
}

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
  explanation: DetectionMatchExplanation;
  metadata?: Record<string, unknown>;
}

// ------------------------------------------------------------------------------
// Phase 17 EDR Simulation & Endpoint Investigation Types
// ------------------------------------------------------------------------------

export type RegistryHive = "HKLM" | "HKCU" | "HKCR" | "HKU" | "HKCC" | "HKPD";
export type RegistryAction = "Created" | "Modified" | "Deleted" | "Queried" | "Renamed" | "SetSecurity";

export interface RegistryEvent {
  id: string;
  organization_id: string;
  asset_id: string;
  agent_id?: string | null;
  process_id?: string | null;
  event_id?: string | null;
  hive: RegistryHive;
  key_path: string;
  value_name?: string | null;
  value_data?: string | null;
  value_type?: string;
  action: RegistryAction;
  occurred_at: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type ServiceStartType = "Auto" | "Manual" | "Disabled" | "Boot" | "System" | "Delayed";
export type ServiceStatus = "Running" | "Stopped" | "Paused" | "StartPending" | "StopPending" | "Installed" | "Deleted";
export type ServiceAction = "Installed" | "Started" | "Stopped" | "Modified" | "Deleted" | "Configured";

export interface EndpointServiceEvent {
  id: string;
  organization_id: string;
  asset_id: string;
  agent_id?: string | null;
  process_id?: string | null;
  service_name: string;
  display_name?: string | null;
  executable_path?: string | null;
  start_type: ServiceStartType;
  status: ServiceStatus;
  action: ServiceAction;
  account_name?: string | null;
  occurred_at: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type ScheduledTaskAction = "Created" | "Modified" | "Deleted" | "Triggered" | "Enabled" | "Disabled" | "Executed";
export type ScheduledTaskTrigger = "AtLogon" | "AtStartup" | "Daily" | "Weekly" | "Interval" | "OnIdle" | "OnEvent" | "Custom";

export interface ScheduledTaskEvent {
  id: string;
  organization_id: string;
  asset_id: string;
  agent_id?: string | null;
  process_id?: string | null;
  task_name: string;
  task_path?: string;
  action: ScheduledTaskAction;
  command?: string | null;
  arguments?: string | null;
  run_as_user?: string | null;
  trigger_type: ScheduledTaskTrigger;
  occurred_at: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type StartupItemLocation = "RegistryRun" | "StartupFolder" | "TaskScheduler" | "Service" | "Winlogon" | "BootExecute";
export type StartupItemAction = "Added" | "Modified" | "Removed" | "Enabled" | "Disabled";

export interface StartupItem {
  id: string;
  organization_id: string;
  asset_id: string;
  agent_id?: string | null;
  name: string;
  location_type: StartupItemLocation;
  location_path: string;
  command: string;
  user_context?: string | null;
  action: StartupItemAction;
  occurred_at: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type UsbDeviceAction = "Connected" | "Disconnected" | "Mounted" | "Unmounted" | "FileRead" | "FileWritten" | "Blocked";

export interface UsbDeviceEvent {
  id: string;
  organization_id: string;
  asset_id: string;
  agent_id?: string | null;
  vendor_id?: string | null;
  product_id?: string | null;
  device_name: string;
  device_class?: string;
  serial_number?: string | null;
  drive_letter?: string | null;
  action: UsbDeviceAction;
  occurred_at: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface EdrProcessTreeNode {
  id: string;
  pid: number;
  ppid?: number | null;
  process_guid?: string | null;
  parent_process_guid?: string | null;
  name: string;
  executable_path: string;
  command_line?: string | null;
  username?: string | null;
  sha256?: string | null;
  started_at: string;
  ended_at?: string | null;
  integrity_level?: "Low" | "Medium" | "High" | "System" | null;
  is_suspicious?: boolean;
  suspicious_reasons?: string[];
  event_count?: number;
  children: EdrProcessTreeNode[];
}

export type EdrActivityCategory =
  | "all"
  | "processes"
  | "files"
  | "network"
  | "registry"
  | "services"
  | "tasks"
  | "startup"
  | "usb"
  | "timeline"
  | "alerts";

export interface EdrFilterParams {
  assetId?: string;
  agentId?: string;
  timeRange?: SiemTimeRange;
  startTime?: string;
  endTime?: string;
  category?: EdrActivityCategory;
  query?: string;
  page?: number;
  pageSize?: number;
  minSeverity?: SeverityLevel;
}

export interface EndpointTimelineItem {
  id: string;
  occurredAt: string;
  category: "process" | "file" | "network" | "registry" | "service" | "task" | "startup" | "usb" | "alert" | "event";
  action: string;
  title: string;
  summary: string;
  severity: SeverityLevel;
  source: string;
  details: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EndpointInvestigationSummary {
  totalProcesses: number;
  suspiciousProcesses: number;
  fileModifications: number;
  networkConnections: number;
  registryChanges: number;
  servicesInstalled: number;
  scheduledTasks: number;
  startupItems: number;
  usbEvents: number;
  activeAlerts: number;
}

export interface EndpointInvestigationPackage {
  asset: Asset;
  agent?: Agent | null;
  summary: EndpointInvestigationSummary;
  processes: ProcessRecord[];
  processTree: EdrProcessTreeNode[];
  files: FileRecord[];
  networkConnections: NetworkConnectionRecord[];
  registryEvents: RegistryEvent[];
  services: EndpointServiceEvent[];
  scheduledTasks: ScheduledTaskEvent[];
  startupItems: StartupItem[];
  usbEvents: UsbDeviceEvent[];
  timeline: EndpointTimelineItem[];
  relatedAlerts: Alert[];
  relatedEvents: TelemetryEvent[];
}

export type EdrSimulationScenarioType =
  | "process_masquerading"
  | "registry_run_persistence"
  | "suspicious_file_drop"
  | "c2_network_beaconing"
  | "malicious_service_install"
  | "scheduled_task_creation"
  | "startup_folder_hijack"
  | "unauthorized_usb_insertion"
  | "multi_stage_endpoint_attack";

export interface SimulateEdrScenarioInput {
  organizationId: string;
  assetId: string;
  scenarioType: EdrSimulationScenarioType;
}
