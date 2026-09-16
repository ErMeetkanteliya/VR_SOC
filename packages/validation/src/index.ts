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
export type CreateSocIdentityInput = z.infer<typeof CreateSocIdentitySchema>;
export type CreateTelemetryEventInput = z.infer<typeof CreateTelemetryEventSchema>;
export type IngestLogInput = z.infer<typeof IngestLogSchema>;
export type CreateProcessRecordInput = z.infer<typeof CreateProcessRecordSchema>;
export type CreateFileRecordInput = z.infer<typeof CreateFileRecordSchema>;
export type CreateNetworkConnectionInput = z.infer<typeof CreateNetworkConnectionSchema>;
export type ClientEnv = z.infer<typeof ClientEnvSchema>;
export type ServerEnv = z.infer<typeof ServerEnvSchema>;
