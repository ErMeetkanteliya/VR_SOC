import { z } from "zod";

export const UserRoleSchema = z.enum([
  "Super Admin",
  "Instructor",
  "Student",
  "SOC Analyst",
  "Incident Responder",
  "Threat Hunter",
  "Auditor",
  "Viewer",
]);

export const MembershipStatusSchema = z.enum(["active", "inactive", "revoked", "pending"]);

export const OrganizationStatusSchema = z.enum(["active", "suspended", "archived"]);

export const SeverityLevelSchema = z.enum([
  "Critical",
  "High",
  "Medium",
  "Low",
  "Informational",
  "critical",
  "high",
  "medium",
  "low",
  "informational",
]);

export const AlertStatusSchema = z.enum([
  "Open",
  "Acknowledged",
  "In Progress",
  "Escalated",
  "Closed",
  "False Positive",
]);

export const AssetTypeSchema = z.enum([
  "Endpoint",
  "Server",
  "Domain Controller",
  "Firewall",
  "Cloud VM",
  "Container",
]);

export const OSTypeSchema = z.enum([
  "Windows",
  "Linux",
  "macOS",
  "NetworkOS",
  "Cloud",
]);

export const AssetStatusSchema = z.enum([
  "Active",
  "Warning",
  "Critical",
  "Isolated",
  "Decommissioned",
  "Offline",
]);

export const AgentStatusSchema = z.enum([
  "Online",
  "Warning",
  "Critical",
  "Offline",
  "Updating",
  "Pending",
  "Error",
]);

export const IdentityAccountTypeSchema = z.enum(["User", "Admin", "Service", "System"]);

export const LogLevelSchema = z.enum([
  "DEBUG",
  "INFO",
  "NOTICE",
  "WARN",
  "ERROR",
  "CRIT",
  "ALERT",
  "EMERG",
]);

export const LogParseStatusSchema = z.enum(["Raw", "Parsed", "Failed", "Dropped"]);

export const NetworkProtocolSchema = z.enum(["TCP", "UDP", "ICMP", "DNS", "HTTP", "HTTPS", "TLS"]);

export const NetworkDirectionSchema = z.enum(["Inbound", "Outbound", "Internal", "Lateral"]);

export const NetworkConnectionStatusSchema = z.enum([
  "Established",
  "Closed",
  "Blocked",
  "Listening",
  "SYN_SENT",
  "Time_Wait",
]);

// Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const VerifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  token: z.string().length(6, "OTP code must be 6 digits"),
  type: z.enum(["signup", "recovery", "email", "magiclink"]).default("signup"),
});

// Multi-Tenancy Validation Schemas
export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters").max(64, "Organization name too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(48, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

export const InviteMemberSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  email: z.string().email("Invalid email address"),
  role: UserRoleSchema.default("SOC Analyst"),
});

export const CreateTeamSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  name: z.string().min(2, "Team name must be at least 2 characters").max(64),
  description: z.string().max(255).optional(),
});

export const PermissionSchema = z.enum([
  // Identity & Organizations
  "org:members:invite",
  "org:members:remove",
  "org:members:update_role",
  "org:settings:manage",
  "org:api_keys:manage",
  // SOC Telemetry & Agents
  "agents:read",
  "agents:isolate",
  "agents:restart",
  "agents:collect_logs",
  "telemetry:read",
  "telemetry:query",
  // Detections & MITRE
  "detections:read",
  "detections:create",
  "detections:update",
  "detections:delete",
  "detections:test",
  "mitre:read",
  "mitre:simulate",
  // Alerts & Incidents
  "alerts:read",
  "alerts:triage",
  "alerts:comment",
  "alerts:escalate",
  "incidents:read",
  "incidents:create",
  "incidents:update_status",
  "incidents:assign",
  "incidents:close",
  // Cases & Evidence
  "cases:read",
  "cases:create",
  "cases:add_evidence",
  "cases:add_notes",
  "cases:close",
  // SOAR & Automation
  "soar:playbooks:read",
  "soar:playbooks:create",
  "soar:playbooks:update",
  "soar:playbooks:execute",
  "soar:actions:execute",
  "soar:approvals:manage",
  // Training & Simulation
  "simulation:scenarios:read",
  "simulation:scenarios:create",
  "simulation:scenarios:launch",
  "training:cohorts:manage",
  "training:quizzes:take",
  "training:submissions:grade",
  // Compliance & GRC
  "compliance:read",
  "compliance:update_controls",
  "compliance:export",
  // Audit & Reporting
  "reports:generate",
  "reports:export",
  "audit:read",
]);

export const UpdateMemberRoleSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  targetUserId: z.string().uuid("Invalid target user ID format"),
  newRole: UserRoleSchema,
});

export const RemoveMemberSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  targetUserId: z.string().uuid("Invalid target user ID format"),
});

export const CheckPermissionSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  permission: PermissionSchema,
});

export const HostIsolationSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID format"),
  reason: z.string().min(5, "Isolation reason must be at least 5 characters"),
});

export const DeclareIncidentSchema = z.object({
  title: z.string().min(3, "Incident title must be at least 3 characters"),
  severity: SeverityLevelSchema,
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  leadResponderId: z.string().uuid().optional(),
  affectedAssetIds: z.array(z.string().uuid()).min(1, "Select at least one affected asset"),
});

// ------------------------------------------------------------------------------
// Phase 10 Core SOC Data Model Schemas
// ------------------------------------------------------------------------------

export const CreateAssetGroupSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  name: z.string().min(2, "Asset group name must be at least 2 characters").max(128),
  description: z.string().max(500).optional(),
  criticality: SeverityLevelSchema.default("Medium"),
  metadata: z.record(z.unknown()).default({}),
});

export const CreateAssetSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  assetGroupId: z.string().uuid("Invalid asset group ID format").optional().nullable(),
  hostname: z.string().min(1, "Hostname is required").max(255),
  displayName: z.string().max(255).optional().nullable(),
  assetType: AssetTypeSchema.default("Endpoint"),
  osType: OSTypeSchema.default("Linux"),
  osVersion: z.string().max(128).optional().nullable(),
  ipAddress: z.string().max(45).optional().nullable(),
  macAddress: z.string().max(48).optional().nullable(),
  criticality: SeverityLevelSchema.default("Medium"),
  status: AssetStatusSchema.default("Active"),
  isIsolated: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
});

export const UpdateAssetSchema = CreateAssetSchema.partial().omit({ organizationId: true });

export const AgentHeartbeatSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  assetId: z.string().uuid("Invalid asset ID format"),
  agentVersion: z.string().max(32).default("1.4.2"),
  status: AgentStatusSchema.default("Online"),
  cpuUsagePct: z.number().min(0).max(100).default(0),
  ramUsagePct: z.number().min(0).max(100).default(0),
  diskUsagePct: z.number().min(0).max(100).default(0),
  capabilities: z.array(z.string()).default(["edr", "fim", "telemetry", "isolation"]),
  metadata: z.record(z.unknown()).default({}),
});

export const FilterAgentsSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  osType: z.string().optional(),
  assetGroupId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

export const IsolateAgentSchema = z.object({
  agentId: z.string().uuid("Invalid agent ID format"),
  isolate: z.boolean(),
  reason: z.string().max(255).optional(),
});

export const UpdateAgentGroupSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID format"),
  assetGroupId: z.string().uuid("Invalid asset group ID format").optional().nullable(),
});

export const SimulateAgentStateSchema = z.object({
  agentId: z.string().uuid("Invalid agent ID format"),
  newStatus: AgentStatusSchema,
  cpuUsagePct: z.number().min(0).max(100).optional(),
  ramUsagePct: z.number().min(0).max(100).optional(),
  diskUsagePct: z.number().min(0).max(100).optional(),
});

export const RegisterEndpointAgentSchema = z.object({
  hostname: z.string().min(1, "Hostname is required").max(255),
  displayName: z.string().max(255).optional(),
  assetType: AssetTypeSchema.default("Endpoint"),
  osType: OSTypeSchema.default("Windows"),
  osVersion: z.string().max(128).default("Windows 11 Enterprise"),
  ipAddress: z.string().max(45).default("10.0.4.100"),
  macAddress: z.string().max(48).optional(),
  criticality: SeverityLevelSchema.default("Medium"),
  assetGroupId: z.string().uuid().optional().nullable(),
  agentVersion: z.string().max(32).default("1.4.2"),
  status: AgentStatusSchema.default("Online"),
});

export const CreateSocIdentitySchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  userId: z.string().uuid().optional().nullable(),
  username: z.string().min(1, "Username is required").max(128),
  displayName: z.string().max(255).optional().nullable(),
  email: z.string().email().optional().nullable(),
  domain: z.string().max(128).default("CORP.INTERNAL"),
  department: z.string().max(128).optional().nullable(),
  accountType: IdentityAccountTypeSchema.default("User"),
  isPrivileged: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
});

export const CreateTelemetryEventSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  occurredAt: z.string().datetime().optional(),
  source: z.string().min(1, "Source is required").max(64),
  sourceType: z.string().min(1, "Source type is required").max(64),
  category: z.string().min(1, "Category is required").max(64),
  eventType: z.string().min(1, "Event type is required").max(128),
  severity: SeverityLevelSchema.default("Informational"),
  assetId: z.string().uuid().optional().nullable(),
  agentId: z.string().uuid().optional().nullable(),
  identityId: z.string().uuid().optional().nullable(),
  rawPayload: z.record(z.unknown()).optional().nullable(),
  normalizedFields: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
});

export const IngestLogSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  eventId: z.string().uuid().optional().nullable(),
  loggedAt: z.string().datetime().optional(),
  facility: z.string().max(64).default("user"),
  logLevel: LogLevelSchema.default("INFO"),
  sourceHost: z.string().max(255).optional().nullable(),
  serviceName: z.string().max(128).optional().nullable(),
  message: z.string().min(1, "Log message is required"),
  rawLog: z.string().optional().nullable(),
  parseStatus: LogParseStatusSchema.default("Parsed"),
  parserName: z.string().max(64).optional().nullable(),
  metadata: z.record(z.unknown()).default({}),
});

export const CreateProcessRecordSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  assetId: z.string().uuid("Invalid asset ID format"),
  agentId: z.string().uuid().optional().nullable(),
  pid: z.number().int().positive(),
  ppid: z.number().int().positive().optional().nullable(),
  processGuid: z.string().max(64).optional().nullable(),
  parentProcessGuid: z.string().max(64).optional().nullable(),
  name: z.string().min(1, "Process name required").max(255),
  executablePath: z.string().min(1, "Executable path required"),
  commandLine: z.string().optional().nullable(),
  identityId: z.string().uuid().optional().nullable(),
  username: z.string().max(128).optional().nullable(),
  sha256: z.string().length(64).optional().nullable(),
  md5: z.string().length(32).optional().nullable(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional().nullable(),
  integrityLevel: z.enum(["Low", "Medium", "High", "System"]).default("Medium"),
  metadata: z.record(z.unknown()).default({}),
});

export const CreateFileRecordSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  assetId: z.string().uuid("Invalid asset ID format"),
  path: z.string().min(1, "File path is required"),
  name: z.string().min(1, "File name is required").max(255),
  extension: z.string().max(32).optional().nullable(),
  sizeBytes: z.number().int().nonnegative().default(0),
  sha256: z.string().length(64).optional().nullable(),
  md5: z.string().length(32).optional().nullable(),
  isSigned: z.boolean().default(false),
  signerName: z.string().max(255).optional().nullable(),
  isHidden: z.boolean().default(false),
  isExecutable: z.boolean().default(false),
  permissions: z.string().max(32).optional().nullable(),
  owner: z.string().max(128).optional().nullable(),
  fileCreatedAt: z.string().datetime().optional().nullable(),
  fileModifiedAt: z.string().datetime().optional().nullable(),
  metadata: z.record(z.unknown()).default({}),
});

export const CreateNetworkConnectionSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  assetId: z.string().uuid().optional().nullable(),
  processId: z.string().uuid().optional().nullable(),
  srcIp: z.string().min(1, "Source IP is required").max(45),
  dstIp: z.string().min(1, "Destination IP is required").max(45),
  srcPort: z.number().int().min(0).max(65535),
  dstPort: z.number().int().min(0).max(65535),
  protocol: NetworkProtocolSchema.default("TCP"),
  direction: NetworkDirectionSchema.default("Outbound"),
  status: NetworkConnectionStatusSchema.default("Established"),
  bytesSent: z.number().int().nonnegative().default(0),
  bytesReceived: z.number().int().nonnegative().default(0),
  durationMs: z.number().int().nonnegative().default(0),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional().nullable(),
  metadata: z.record(z.unknown()).default({}),
});

// ------------------------------------------------------------------------------
// Phase 12 Telemetry Engine & Simulation Pipeline Schemas
// ------------------------------------------------------------------------------

export const SimulationScenarioCategorySchema = z.enum([
  "Authentication Attacks",
  "Endpoint Execution",
  "Persistence Mechanism",
  "Network Anomalies",
  "Hardware Additions",
  "Ransomware & Destruction",
  "Cloud & Identity",
]);

export const SimulationStatusSchema = z.enum([
  "Pending",
  "Running",
  "Completed",
  "Failed",
  "Cancelled",
]);

export const LaunchSimulationSchema = z.object({
  scenarioId: z.string().min(1, "Scenario ID is required"),
  targetAssetId: z.string().optional().nullable(),
  targetAgentId: z.string().optional().nullable(),
  targetIdentityId: z.string().optional().nullable(),
  parameters: z.record(z.unknown()).default({}),
});

export const CancelSimulationSchema = z.object({
  simulationRunId: z.string().min(1, "Simulation run ID is required"),
  reason: z.string().max(255).optional(),
});

export const FilterSimulationScenariosSchema = z.object({
  category: z.string().optional(),
  severity: z.string().optional(),
  search: z.string().optional(),
});

export const FilterSimulationRunsSchema = z.object({
  scenarioId: z.string().optional(),
  status: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

export const FilterTelemetryEventsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  severity: z.string().optional(),
  assetId: z.string().optional(),
  agentId: z.string().optional(),
  simulationRunId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const FilterLogsSchema = z.object({
  search: z.string().optional(),
  logLevel: z.string().optional(),
  facility: z.string().optional(),
  serviceName: z.string().optional(),
  sourceHost: z.string().optional(),
  parseStatus: z.string().optional(),
  source: z.string().optional(),
  sourceType: z.string().optional(),
  pipelineStatus: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

// Phase 13: Log / Event Pipeline Schemas
export const PipelineStageSchema = z.enum([
  "Received",
  "Validated",
  "Parsed",
  "Normalized",
  "Enriched",
  "Stored",
  "Failed",
]);

export const PipelineIngestionSchema = z.object({
  source: z.string().min(1, "Source is required"),
  sourceType: z.string().min(1, "Source type is required"),
  category: z.string().min(1, "Category is required"),
  eventType: z.string().min(1, "Event type is required"),
  severity: SeverityLevelSchema,
  logLevel: z.enum(["DEBUG", "INFO", "NOTICE", "WARN", "ERROR", "CRIT", "ALERT", "EMERG"]).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  message: z.string().min(1, "Message is required"),
  rawLog: z.string().optional(),
  normalizedFields: z.record(z.unknown()).optional().default({}),
  tags: z.array(z.string()).optional(),
  organizationId: z.string().uuid("Valid organization ID required"),
  assetId: z.string().uuid().optional().nullable(),
  agentId: z.string().uuid().optional().nullable(),
  identityId: z.string().uuid().optional().nullable(),
  sourceHost: z.string().optional(),
  ingestionId: z.string().optional(),
  process: z.object({
    name: z.string(),
    executablePath: z.string(),
    commandLine: z.string().optional(),
    sha256: z.string().optional(),
    integrityLevel: z.enum(["Low", "Medium", "High", "System"]).optional(),
  }).optional(),
  file: z.object({
    path: z.string(),
    name: z.string(),
    extension: z.string().optional(),
    sizeBytes: z.number().optional(),
    sha256: z.string().optional(),
    isExecutable: z.boolean().optional(),
    isHidden: z.boolean().optional(),
  }).optional(),
  network: z.object({
    srcIp: z.string(),
    dstIp: z.string(),
    srcPort: z.number().int().min(0).max(65535),
    dstPort: z.number().int().min(0).max(65535),
    protocol: z.enum(["TCP", "UDP", "ICMP", "DNS", "HTTP", "HTTPS", "TLS"]).optional(),
    direction: z.enum(["Inbound", "Outbound", "Internal", "Lateral"]).optional(),
    status: z.enum(["Established", "Closed", "Blocked", "Listening", "SYN_SENT", "Time_Wait"]).optional(),
  }).optional(),
});

export const PipelineBatchIngestionSchema = z.object({
  payloads: z.array(PipelineIngestionSchema).min(1).max(100),
});

export const FilterPipelineEventsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
  sourceType: z.string().optional(),
  severity: z.string().optional(),
  pipelineStatus: z.string().optional(),
  assetId: z.string().optional(),
  agentId: z.string().optional(),
  identityId: z.string().optional(),
  sourceHost: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

// Environment variable validation schemas
export const ClientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("VRSOC — Cyber Defense Training"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Valid Supabase URL required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "Valid Supabase anon key required"),
});

export const ServerEnvSchema = ClientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "Valid Supabase service role key required").optional(),
  VIRUSTOTAL_API_KEY: z.string().optional(),
  ABUSEIPDB_API_KEY: z.string().optional(),
  SHODAN_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof RemoveMemberSchema>;
export type CheckPermissionInput = z.infer<typeof CheckPermissionSchema>;
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type CreateAssetGroupInput = z.infer<typeof CreateAssetGroupSchema>;
export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;
export type AgentHeartbeatInput = z.infer<typeof AgentHeartbeatSchema>;
export type FilterAgentsInput = z.infer<typeof FilterAgentsSchema>;
export type IsolateAgentInput = z.infer<typeof IsolateAgentSchema>;
export type UpdateAgentGroupInput = z.infer<typeof UpdateAgentGroupSchema>;
export type SimulateAgentStateInput = z.infer<typeof SimulateAgentStateSchema>;
export type RegisterEndpointAgentInput = z.infer<typeof RegisterEndpointAgentSchema>;
export type CreateSocIdentityInput = z.infer<typeof CreateSocIdentitySchema>;
export type CreateTelemetryEventInput = z.infer<typeof CreateTelemetryEventSchema>;
export type IngestLogInput = z.infer<typeof IngestLogSchema>;
export type CreateProcessRecordInput = z.infer<typeof CreateProcessRecordSchema>;
export type CreateFileRecordInput = z.infer<typeof CreateFileRecordSchema>;
export type CreateNetworkConnectionInput = z.infer<typeof CreateNetworkConnectionSchema>;
export type LaunchSimulationInput = z.infer<typeof LaunchSimulationSchema>;
export type CancelSimulationInput = z.infer<typeof CancelSimulationSchema>;
export type FilterSimulationScenariosInput = z.infer<typeof FilterSimulationScenariosSchema>;
export type FilterSimulationRunsInput = z.infer<typeof FilterSimulationRunsSchema>;
export type FilterTelemetryEventsInput = z.infer<typeof FilterTelemetryEventsSchema>;
export type FilterLogsInput = z.infer<typeof FilterLogsSchema>;
export type PipelineIngestionInput = z.infer<typeof PipelineIngestionSchema>;
export type PipelineBatchIngestionInput = z.infer<typeof PipelineBatchIngestionSchema>;
export type FilterPipelineEventsInput = z.infer<typeof FilterPipelineEventsSchema>;
export type ClientEnv = z.infer<typeof ClientEnvSchema>;
export type ServerEnv = z.infer<typeof ServerEnvSchema>;

// ------------------------------------------------------------------------------
// Phase 14 SIEM Core Validation Schemas
// ------------------------------------------------------------------------------

export const SiemTimeRangeSchema = z.enum([
  "15m",
  "30m",
  "1h",
  "6h",
  "12h",
  "24h",
  "7d",
  "30d",
  "custom",
  "all",
]);

export const SiemFilterParamsSchema = z.object({
  query: z.string().max(255).optional(),
  timeRange: SiemTimeRangeSchema.default("24h").optional(),
  startTime: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  endTime: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
  severity: SeverityLevelSchema.or(z.literal("ALL")).default("ALL").optional(),
  source: z.string().max(64).or(z.literal("ALL")).default("ALL").optional(),
  sourceType: z.string().max(64).or(z.literal("ALL")).default("ALL").optional(),
  category: z.string().max(64).or(z.literal("ALL")).default("ALL").optional(),
  eventType: z.string().max(128).optional(),
  assetId: z.string().uuid("Invalid asset UUID").optional(),
  agentId: z.string().uuid("Invalid agent UUID").optional(),
  identityId: z.string().uuid("Invalid identity UUID").optional(),
  username: z.string().max(128).optional(),
  pipelineStatus: z
    .enum(["Received", "Validated", "Parsed", "Normalized", "Enriched", "Stored", "Failed", "ALL"])
    .default("ALL")
    .optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["occurred_at", "created_at", "severity"]).default("occurred_at"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const SiemQuerySchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  filters: SiemFilterParamsSchema.default({}),
});

export const SiemCorrelationQuerySchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  eventId: z.string().uuid("Invalid event ID format"),
  correlationType: z.enum(["asset", "identity", "agent", "ingestion_batch", "time_window"]).default("asset"),
  timeWindowMinutes: z.number().int().min(5).max(1440).default(30),
});

export const SiemTimelineQuerySchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  assetId: z.string().uuid("Invalid asset UUID").optional(),
  identityId: z.string().uuid("Invalid identity UUID").optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.number().int().min(5).max(200).default(50),
});

export const CreateSavedQuerySchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format"),
  name: z.string().min(2, "Name must be at least 2 characters").max(128),
  description: z.string().max(500).optional(),
  queryType: z.enum(["events", "logs", "correlated"]).default("events"),
  filters: SiemFilterParamsSchema.partial().default({}),
  isPinned: z.boolean().default(false),
});

export const UpdateSavedQuerySchema = z.object({
  id: z.string().uuid("Invalid saved query ID"),
  organizationId: z.string().uuid("Invalid organization ID format"),
  name: z.string().min(2).max(128).optional(),
  description: z.string().max(500).optional(),
  isPinned: z.boolean().optional(),
  filters: SiemFilterParamsSchema.partial().optional(),
});

export const DeleteSavedQuerySchema = z.object({
  id: z.string().uuid("Invalid saved query ID"),
  organizationId: z.string().uuid("Invalid organization ID format"),
});

export type SiemFilterParamsInput = z.infer<typeof SiemFilterParamsSchema>;
export type SiemQueryInput = z.infer<typeof SiemQuerySchema>;
export type SiemCorrelationQueryInput = z.infer<typeof SiemCorrelationQuerySchema>;
export type SiemTimelineQueryInput = z.infer<typeof SiemTimelineQuerySchema>;
export type CreateSavedQueryInput = z.infer<typeof CreateSavedQuerySchema>;
export type UpdateSavedQueryInput = z.infer<typeof UpdateSavedQuerySchema>;
export type DeleteSavedQueryInput = z.infer<typeof DeleteSavedQuerySchema>;

// ------------------------------------------------------------------------------
// Phase 15 Detection & Correlation Rules Validation Schemas
// ------------------------------------------------------------------------------

export const RuleOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "in",
  "not_in",
  "greater_than",
  "greater_than_or_equal",
  "less_than",
  "less_than_or_equal",
  "exists",
  "not_exists",
  "regex",
]);

export const DetectionRuleTypeSchema = z.enum([
  "single_event",
  "threshold",
  "correlation",
  "sequence",
]);

export const FieldConditionSchema = z.object({
  field: z.string().min(1, "Field name is required").max(64),
  operator: RuleOperatorSchema,
  value: z.unknown(),
});

// Recursive logical condition schema (bounded to prevent deep recursion)
export const LogicalConditionGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    operator: z.enum(["AND", "OR", "NOT"]).optional(),
    logicalOperator: z.enum(["AND", "OR", "NOT"]).optional(),
    conditions: z.array(
      z.union([
        FieldConditionSchema,
        LogicalConditionGroupSchema,
      ])
    ).min(1, "Condition group must have at least one condition").max(20, "Condition group exceeds maximum 20 conditions limit"),
  }).refine((data) => data.operator || data.logicalOperator, {
    message: "Logical operator ('AND', 'OR', or 'NOT') is required",
  })
);

export const RuleConditionSchema = z.union([
  FieldConditionSchema,
  LogicalConditionGroupSchema,
]);

export const CreateDetectionRuleSchema = z.object({
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  name: z.string().min(3, "Rule name must be at least 3 characters").max(255),
  description: z.string().max(1000).optional(),
  severity: SeverityLevelSchema.default("high"),
  rule_type: DetectionRuleTypeSchema.optional(),
  ruleType: DetectionRuleTypeSchema.optional(),
  category: z.string().min(2).max(64).default("general"),
  mitre_tactic: z.string().max(64).optional(),
  mitreTactic: z.string().max(64).optional(),
  mitre_technique_id: z.string().max(32).optional(),
  mitreTechniqueId: z.string().max(32).optional(),
  mitre_technique_name: z.string().max(128).optional(),
  mitreTechniqueName: z.string().max(128).optional(),
  is_enabled: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  evaluation_window_minutes: z.number().int().min(1).max(1440).optional(),
  evaluationWindowMinutes: z.number().int().min(1).max(1440).optional(),
  threshold_count: z.number().int().min(1).max(10000).optional(),
  thresholdCount: z.number().int().min(1).max(10000).optional(),
  conditions: RuleConditionSchema,
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateDetectionRuleSchema = z.object({
  id: z.string().min(1, "Rule ID is required"),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  name: z.string().min(3).max(255).optional(),
  description: z.string().max(1000).optional(),
  severity: SeverityLevelSchema.optional(),
  rule_type: DetectionRuleTypeSchema.optional(),
  ruleType: DetectionRuleTypeSchema.optional(),
  category: z.string().min(2).max(64).optional(),
  mitre_tactic: z.string().max(64).optional(),
  mitreTactic: z.string().max(64).optional(),
  mitre_technique_id: z.string().max(32).optional(),
  mitreTechniqueId: z.string().max(32).optional(),
  mitre_technique_name: z.string().max(128).optional(),
  mitreTechniqueName: z.string().max(128).optional(),
  is_enabled: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  evaluation_window_minutes: z.number().int().min(1).max(1440).optional(),
  evaluationWindowMinutes: z.number().int().min(1).max(1440).optional(),
  threshold_count: z.number().int().min(1).max(10000).optional(),
  thresholdCount: z.number().int().min(1).max(10000).optional(),
  conditions: RuleConditionSchema.optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const DeleteDetectionRuleSchema = z.object({
  id: z.string().min(1, "Rule ID is required"),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
});

export const ToggleDetectionRuleSchema = z.object({
  id: z.string().min(1, "Rule ID is required"),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  is_enabled: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
});

export const EvaluateDetectionRuleSchema = z.object({
  rule_id: z.string().min(1, "Rule ID is required").optional(),
  id: z.string().min(1).optional(),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  time_window_minutes: z.number().int().min(1).max(1440).optional(),
  timeWindowMinutes: z.number().int().min(1).max(1440).optional(),
}).refine((data) => data.rule_id || data.id, {
  message: "Rule ID (rule_id or id) is required",
});

export const EvaluateAllDetectionRulesSchema = z.object({
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  time_window_minutes: z.number().int().min(1).max(1440).optional(),
  timeWindowMinutes: z.number().int().min(1).max(1440).optional(),
  category: z.string().optional(),
});

export type CreateDetectionRuleInput = z.infer<typeof CreateDetectionRuleSchema>;
export type UpdateDetectionRuleInput = z.infer<typeof UpdateDetectionRuleSchema>;
export type DeleteDetectionRuleInput = z.infer<typeof DeleteDetectionRuleSchema>;
export type ToggleDetectionRuleInput = z.infer<typeof ToggleDetectionRuleSchema>;
export type EvaluateDetectionRuleInput = z.infer<typeof EvaluateDetectionRuleSchema>;
export type EvaluateAllDetectionRulesInput = z.infer<typeof EvaluateAllDetectionRulesSchema>;



