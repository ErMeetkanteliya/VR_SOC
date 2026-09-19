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
  "open",
  "acknowledged",
  "in_progress",
  "escalated" ,
  "closed",
  "false_positive",
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

// Phase 17 EDR Enums
export const RegistryHiveSchema = z.enum(["HKLM", "HKCU", "HKCR", "HKU", "HKCC", "HKPD"]);
export const RegistryActionSchema = z.enum(["Created", "Modified", "Deleted", "Queried", "Renamed", "SetSecurity"]);
export const ServiceStartTypeSchema = z.enum(["Auto", "Manual", "Disabled", "Boot", "System", "Delayed"]);
export const ServiceStatusSchema = z.enum(["Running", "Stopped", "Paused", "StartPending", "StopPending", "Installed", "Deleted"]);
export const ServiceActionSchema = z.enum(["Installed", "Started", "Stopped", "Modified", "Deleted", "Configured"]);
export const ScheduledTaskActionSchema = z.enum(["Created", "Modified", "Deleted", "Triggered", "Enabled", "Disabled", "Executed"]);
export const ScheduledTaskTriggerSchema = z.enum(["AtLogon", "AtStartup", "Daily", "Weekly", "Interval", "OnIdle", "OnEvent", "Custom"]);
export const StartupItemLocationSchema = z.enum(["RegistryRun", "StartupFolder", "TaskScheduler", "Service", "Winlogon", "BootExecute"]);
export const StartupItemActionSchema = z.enum(["Added", "Modified", "Removed", "Enabled", "Disabled"]);
export const UsbDeviceActionSchema = z.enum(["Connected", "Disconnected", "Mounted", "Unmounted", "FileRead", "FileWritten", "Blocked"]);
export const EdrActivityCategorySchema = z.enum([
  "all",
  "processes",
  "files",
  "network",
  "registry",
  "services",
  "tasks",
  "startup",
  "usb",
  "timeline",
  "alerts",
]);
export const EdrSimulationScenarioTypeSchema = z.enum([
  "process_masquerading",
  "registry_run_persistence",
  "suspicious_file_drop",
  "c2_network_beaconing",
  "malicious_service_install",
  "scheduled_task_creation",
  "startup_folder_hijack",
  "unauthorized_usb_insertion",
  "multi_stage_endpoint_attack",
]);

// Phase 18 XDR Enums
export const XdrTelemetrySourceSchema = z.enum([
  "endpoint",
  "identity",
  "email",
  "dns",
  "cloud",
  "network",
  "firewall",
  "authentication",
]);
export const DnsQueryTypeSchema = z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "PTR", "SRV", "NS", "SOA"]);
export const EmailActionSchema = z.enum(["Delivered", "Quarantined", "Blocked", "Filtered", "Deleted"]);
export const SpfVerdictSchema = z.enum(["Pass", "Fail", "SoftFail", "Neutral", "None"]);
export const DkimVerdictSchema = z.enum(["Pass", "Fail", "None"]);
export const CloudProviderSchema = z.enum(["AWS", "Azure", "GCP", "Kubernetes", "SaaS"]);
export const CloudStatusSchema = z.enum(["Success", "Failure", "Denied", "Throttled"]);
export const FirewallActionSchema = z.enum(["Allowed", "Blocked", "Dropped", "Rejected", "Alerted"]);
export const XdrRelationshipTypeSchema = z.enum([
  "same_identity",
  "same_asset",
  "same_ip",
  "same_domain",
  "temporal_killchain",
  "cross_source_threat",
  "related_alert",
]);
export const XdrSimulationScenarioTypeSchema = z.enum([
  "phishing_to_endpoint_c2",
  "cloud_credential_theft_and_exfil",
  "lateral_movement_and_domain_recon",
  "ransomware_precursor_chain",
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
  normalizedFields: z.record(z.unknown()).optional(),
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
  registry: z.object({
    hive: RegistryHiveSchema,
    keyPath: z.string(),
    valueName: z.string().optional(),
    valueData: z.string().optional(),
    valueType: z.string().optional(),
    action: RegistryActionSchema,
  }).optional(),
  service: z.object({
    serviceName: z.string(),
    displayName: z.string().optional(),
    executablePath: z.string().optional(),
    startType: ServiceStartTypeSchema.optional(),
    status: ServiceStatusSchema.optional(),
    action: ServiceActionSchema.optional(),
    accountName: z.string().optional(),
  }).optional(),
  scheduledTask: z.object({
    taskName: z.string(),
    taskPath: z.string().optional(),
    action: ScheduledTaskActionSchema.optional(),
    command: z.string().optional(),
    arguments: z.string().optional(),
    runAsUser: z.string().optional(),
    triggerType: ScheduledTaskTriggerSchema.optional(),
  }).optional(),
  startupItem: z.object({
    name: z.string(),
    locationType: StartupItemLocationSchema,
    locationPath: z.string(),
    command: z.string(),
    userContext: z.string().optional(),
    action: StartupItemActionSchema.optional(),
  }).optional(),
  usb: z.object({
    vendorId: z.string().optional(),
    productId: z.string().optional(),
    deviceName: z.string(),
    deviceClass: z.string().optional(),
    serialNumber: z.string().optional(),
    driveLetter: z.string().optional(),
    action: UsbDeviceActionSchema.optional(),
  }).optional(),
  dns: z.object({
    queryDomain: z.string().min(1),
    queryType: DnsQueryTypeSchema.default("A").optional(),
    resolvedIps: z.array(z.string()).optional(),
    responseCode: z.string().default("NOERROR").optional(),
    isMalicious: z.boolean().default(false).optional(),
    threatCategory: z.string().optional(),
  }).optional(),
  email: z.object({
    sender: z.string().min(1),
    recipient: z.string().min(1),
    subject: z.string(),
    messageId: z.string().optional(),
    attachmentName: z.string().optional(),
    attachmentSha256: z.string().optional(),
    attachmentSizeBytes: z.number().optional(),
    action: EmailActionSchema.default("Delivered").optional(),
    spfVerdict: SpfVerdictSchema.default("Pass").optional(),
    dkimVerdict: DkimVerdictSchema.default("Pass").optional(),
    isPhishing: z.boolean().default(false).optional(),
    threatLevel: SeverityLevelSchema.default("Low").optional(),
  }).optional(),
  cloud: z.object({
    cloudProvider: CloudProviderSchema.default("AWS").optional(),
    serviceName: z.string().min(1),
    eventName: z.string().min(1),
    callerIp: z.string().optional(),
    userAgent: z.string().optional(),
    region: z.string().optional(),
    resourceArn: z.string().optional(),
    status: CloudStatusSchema.default("Success").optional(),
    requestParameters: z.record(z.unknown()).optional(),
    responseElements: z.record(z.unknown()).optional(),
  }).optional(),
  firewall: z.object({
    srcIp: z.string(),
    dstIp: z.string(),
    srcPort: z.number().int().min(0).max(65535),
    dstPort: z.number().int().min(0).max(65535),
    protocol: NetworkProtocolSchema.default("TCP").optional(),
    action: FirewallActionSchema.default("Allowed").optional(),
    ruleId: z.string().optional(),
    ruleName: z.string().optional(),
    bytesTransferred: z.number().optional(),
    threatName: z.string().optional(),
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

// ------------------------------------------------------------------------------
// Phase 16 Alerts & Triage Schemas
// ------------------------------------------------------------------------------

export const AlertFilterParamsSchema = z.object({
  query: z.string().max(255).optional(),
  status: z.union([AlertStatusSchema, z.literal("ALL")]).optional(),
  severity: z.union([SeverityLevelSchema, z.literal("ALL")]).optional(),
  ruleId: z.string().max(128).optional(),
  assetId: z.string().uuid().optional(),
  identityId: z.string().uuid().optional(),
  mitreTechniqueId: z.string().max(64).optional(),
  timeRange: z.enum(["1h", "6h", "24h", "7d", "30d", "all"]).default("24h"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  sortBy: z.enum(["occurred_at", "created_at", "severity", "risk_score"]).default("occurred_at"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  organizationId: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
});

export const AlertTriageUpdateSchema = z.object({
  alertId: z.string().uuid("Invalid alert ID format").optional(),
  alert_id: z.string().uuid("Invalid alert ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  status: AlertStatusSchema.optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  note: z.string().max(2000).optional(),
  closedReason: z.string().max(1000).optional(),
  closed_reason: z.string().max(1000).optional(),
}).refine((data) => data.alertId || data.alert_id, {
  message: "Alert ID is required",
});

export const AcknowledgeAlertSchema = z.object({
  alertId: z.string().uuid("Invalid alert ID format").optional(),
  alert_id: z.string().uuid("Invalid alert ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  note: z.string().max(1000).optional(),
}).refine((data) => data.alertId || data.alert_id, {
  message: "Alert ID is required",
});

export const AssignAlertSchema = z.object({
  alertId: z.string().uuid("Invalid alert ID format").optional(),
  alert_id: z.string().uuid("Invalid alert ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  assignedTo: z.string().uuid("Invalid assignee user ID").nullable(),
  assigned_to: z.string().uuid("Invalid assignee user ID").nullable().optional(),
  note: z.string().max(1000).optional(),
}).refine((data) => data.alertId || data.alert_id, {
  message: "Alert ID is required",
});

export const AddAlertNoteSchema = z.object({
  alertId: z.string().uuid("Invalid alert ID format").optional(),
  alert_id: z.string().uuid("Invalid alert ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  note: z.string().min(1, "Note cannot be empty").max(2000),
}).refine((data) => data.alertId || data.alert_id, {
  message: "Alert ID is required",
});

export const CloseAlertSchema = z.object({
  alertId: z.string().uuid("Invalid alert ID format").optional(),
  alert_id: z.string().uuid("Invalid alert ID format").optional(),
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  status: z.enum(["Closed", "False Positive", "closed", "false_positive"]).default("Closed"),
  reason: z.string().min(3, "Closure rationale must be at least 3 characters").max(1000),
  note: z.string().max(1000).optional(),
}).refine((data) => data.alertId || data.alert_id, {
  message: "Alert ID is required",
});

export const CreateAlertFromDetectionSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  organization_id: z.string().uuid("Invalid organization ID format").optional(),
  detectionResult: z.object({
    ruleId: z.string(),
    ruleName: z.string(),
    severity: SeverityLevelSchema,
    matched: z.boolean(),
    evaluatedAt: z.string(),
    evaluationWindow: z.object({
      start: z.string(),
      end: z.string(),
    }),
    matchedEventIds: z.array(z.string()),
    matchedEvents: z.array(z.any()),
    primaryAssetId: z.string().nullable().optional(),
    primaryIdentityId: z.string().nullable().optional(),
    explanation: z.object({
      ruleId: z.string(),
      ruleName: z.string(),
      matched: z.boolean(),
      summary: z.string(),
      details: z.array(z.string()),
      evaluatedCount: z.number(),
      matchedCount: z.number(),
    }),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export type AlertFilterParamsInput = z.infer<typeof AlertFilterParamsSchema>;
export type AlertTriageUpdateInputType = z.infer<typeof AlertTriageUpdateSchema>;
export type AcknowledgeAlertInput = z.infer<typeof AcknowledgeAlertSchema>;
export type AssignAlertInput = z.infer<typeof AssignAlertSchema>;
export type AddAlertNoteInput = z.infer<typeof AddAlertNoteSchema>;
export type CloseAlertInput = z.infer<typeof CloseAlertSchema>;
export type CreateAlertFromDetectionInputType = z.infer<typeof CreateAlertFromDetectionSchema>;

// ------------------------------------------------------------------------------
// Phase 17 EDR Validation Schemas
// ------------------------------------------------------------------------------

export const RegistryEventSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  asset_id: z.string().uuid("Invalid asset ID format"),
  agent_id: z.string().uuid().nullable().optional(),
  process_id: z.string().uuid().nullable().optional(),
  event_id: z.string().uuid().nullable().optional(),
  hive: RegistryHiveSchema,
  key_path: z.string().min(1, "Key path is required"),
  value_name: z.string().nullable().optional(),
  value_data: z.string().nullable().optional(),
  value_type: z.string().default("REG_SZ").optional(),
  action: RegistryActionSchema,
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  metadata: z.record(z.unknown()).default({}),
});

export const EndpointServiceEventSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  asset_id: z.string().uuid("Invalid asset ID format"),
  agent_id: z.string().uuid().nullable().optional(),
  process_id: z.string().uuid().nullable().optional(),
  service_name: z.string().min(1, "Service name is required"),
  display_name: z.string().nullable().optional(),
  executable_path: z.string().nullable().optional(),
  start_type: ServiceStartTypeSchema.default("Auto"),
  status: ServiceStatusSchema.default("Running"),
  action: ServiceActionSchema.default("Modified"),
  account_name: z.string().nullable().optional(),
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  metadata: z.record(z.unknown()).default({}),
});

export const ScheduledTaskEventSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  asset_id: z.string().uuid("Invalid asset ID format"),
  agent_id: z.string().uuid().nullable().optional(),
  process_id: z.string().uuid().nullable().optional(),
  task_name: z.string().min(1, "Task name is required"),
  task_path: z.string().default("\\").optional(),
  action: ScheduledTaskActionSchema.default("Created"),
  command: z.string().nullable().optional(),
  arguments: z.string().nullable().optional(),
  run_as_user: z.string().nullable().optional(),
  trigger_type: ScheduledTaskTriggerSchema.default("Daily"),
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  metadata: z.record(z.unknown()).default({}),
});

export const StartupItemSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  asset_id: z.string().uuid("Invalid asset ID format"),
  agent_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Name is required"),
  location_type: StartupItemLocationSchema,
  location_path: z.string().min(1, "Location path is required"),
  command: z.string().min(1, "Command is required"),
  user_context: z.string().nullable().optional(),
  action: StartupItemActionSchema.default("Added"),
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  metadata: z.record(z.unknown()).default({}),
});

export const UsbDeviceEventSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  asset_id: z.string().uuid("Invalid asset ID format"),
  agent_id: z.string().uuid().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  product_id: z.string().nullable().optional(),
  device_name: z.string().min(1, "Device name is required"),
  device_class: z.string().default("Mass Storage").optional(),
  serial_number: z.string().nullable().optional(),
  drive_letter: z.string().nullable().optional(),
  action: UsbDeviceActionSchema.default("Connected"),
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  metadata: z.record(z.unknown()).default({}),
});

export const EdrFilterParamsSchema = z.object({
  assetId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  timeRange: z.enum(["15m", "30m", "1h", "6h", "12h", "24h", "7d", "30d", "custom", "all"]).optional(),
  startTime: z.string().datetime({ offset: true }).or(z.string()).optional(),
  endTime: z.string().datetime({ offset: true }).or(z.string()).optional(),
  category: EdrActivityCategorySchema.default("all").optional(),
  query: z.string().max(256).optional(),
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(200).default(50).optional(),
  minSeverity: SeverityLevelSchema.optional(),
});

export const SimulateEdrScenarioSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  assetId: z.string().uuid("Invalid asset ID format"),
  scenarioType: EdrSimulationScenarioTypeSchema,
});

export const GetProcessTreeSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  assetId: z.string().uuid("Invalid asset ID format"),
});

export const GetEndpointInvestigationSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  assetId: z.string().uuid("Invalid asset ID format"),
  filters: EdrFilterParamsSchema.optional(),
});

export type RegistryEventInput = z.infer<typeof RegistryEventSchema>;
export type EndpointServiceEventInput = z.infer<typeof EndpointServiceEventSchema>;
export type ScheduledTaskEventInput = z.infer<typeof ScheduledTaskEventSchema>;
export type StartupItemInput = z.infer<typeof StartupItemSchema>;
export type UsbDeviceEventInput = z.infer<typeof UsbDeviceEventSchema>;
export type EdrFilterParamsInput = z.infer<typeof EdrFilterParamsSchema>;
export type SimulateEdrScenarioInputType = z.infer<typeof SimulateEdrScenarioSchema>;
export type GetProcessTreeInputType = z.infer<typeof GetProcessTreeSchema>;
export type GetEndpointInvestigationInputType = z.infer<typeof GetEndpointInvestigationSchema>;

// ------------------------------------------------------------------------------
// Phase 18 XDR Validation Schemas
// ------------------------------------------------------------------------------

export const DnsEventSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  asset_id: z.string().uuid().nullable().optional(),
  agent_id: z.string().uuid().nullable().optional(),
  process_id: z.string().uuid().nullable().optional(),
  query_domain: z.string().min(1, "Query domain is required"),
  query_type: DnsQueryTypeSchema.default("A"),
  resolved_ips: z.array(z.string()).default([]),
  response_code: z.string().default("NOERROR"),
  is_malicious: z.boolean().default(false),
  threat_category: z.string().nullable().optional(),
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  metadata: z.record(z.unknown()).default({}),
});

export const EmailEventSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  identity_id: z.string().uuid().nullable().optional(),
  sender: z.string().min(1, "Sender is required"),
  recipient: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  message_id: z.string().nullable().optional(),
  attachment_name: z.string().nullable().optional(),
  attachment_sha256: z.string().nullable().optional(),
  attachment_size_bytes: z.number().nullable().optional(),
  action: EmailActionSchema.default("Delivered"),
  spf_verdict: SpfVerdictSchema.nullable().optional(),
  dkim_verdict: DkimVerdictSchema.nullable().optional(),
  is_phishing: z.boolean().default(false),
  threat_level: SeverityLevelSchema.default("Low"),
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  metadata: z.record(z.unknown()).default({}),
});

export const CloudEventSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  identity_id: z.string().uuid().nullable().optional(),
  cloud_provider: CloudProviderSchema.default("AWS"),
  service_name: z.string().min(1, "Service name is required"),
  event_name: z.string().min(1, "Event name is required"),
  caller_ip: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  region: z.string().default("us-east-1").optional(),
  resource_arn: z.string().nullable().optional(),
  status: CloudStatusSchema.default("Success"),
  request_parameters: z.record(z.unknown()).default({}),
  response_elements: z.record(z.unknown()).default({}),
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  metadata: z.record(z.unknown()).default({}),
});

export const FirewallEventSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  asset_id: z.string().uuid().nullable().optional(),
  src_ip: z.string().min(1, "Source IP is required"),
  dst_ip: z.string().min(1, "Destination IP is required"),
  src_port: z.number().int().min(0).max(65535),
  dst_port: z.number().int().min(0).max(65535),
  protocol: NetworkProtocolSchema.default("TCP"),
  action: FirewallActionSchema.default("Allowed"),
  rule_id: z.string().nullable().optional(),
  rule_name: z.string().nullable().optional(),
  bytes_transferred: z.number().default(0).optional(),
  threat_name: z.string().nullable().optional(),
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  metadata: z.record(z.unknown()).default({}),
});

export const XdrSharedIdentifiersSchema = z.object({
  ips: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  usernames: z.array(z.string()).optional(),
  emails: z.array(z.string()).optional(),
  hashes: z.array(z.string()).optional(),
  hostnames: z.array(z.string()).optional(),
});

export const XdrExplanationStepSchema = z.object({
  step: z.number().int().min(1),
  title: z.string().min(1),
  source: XdrTelemetrySourceSchema,
  description: z.string(),
  timestamp: z.string(),
  evidence: z.record(z.unknown()).default({}),
});

export const XdrCorrelationResultSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  correlation_code: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  severity: SeverityLevelSchema.default("High"),
  relationship_type: XdrRelationshipTypeSchema,
  confidence_score: z.number().int().min(0).max(100).default(85),
  primary_entity_type: z.enum(["asset", "identity", "ip", "domain", "alert"]),
  primary_entity_id: z.string().min(1),
  primary_entity_name: z.string().min(1),
  time_window_start: z.string(),
  time_window_end: z.string(),
  duration_minutes: z.number().int().default(60),
  explanation: z.array(XdrExplanationStepSchema),
  shared_identifiers: XdrSharedIdentifiersSchema.default({}),
  source_counts: z.record(z.number()).default({}),
  matched_event_ids: z.array(z.string()).default([]),
  related_asset_ids: z.array(z.string()).default([]),
  related_identity_ids: z.array(z.string()).default([]),
  related_alert_ids: z.array(z.string()).default([]),
  status: z.enum(["Active", "Investigating", "Resolved", "Dismissed"]).default("Active"),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const XdrFilterParamsSchema = z.object({
  query: z.string().max(256).optional(),
  sources: z.array(XdrTelemetrySourceSchema).optional(),
  relationshipType: z.union([XdrRelationshipTypeSchema, z.literal("ALL")]).default("ALL").optional(),
  minSeverity: z.union([SeverityLevelSchema, z.literal("ALL")]).default("ALL").optional(),
  timeRange: z.enum(["15m", "30m", "1h", "6h", "12h", "24h", "7d", "30d", "custom", "all"]).optional(),
  startTime: z.string().datetime({ offset: true }).or(z.string()).optional(),
  endTime: z.string().datetime({ offset: true }).or(z.string()).optional(),
  assetId: z.string().uuid().optional(),
  identityId: z.string().uuid().optional(),
  ipAddress: z.string().optional(),
  domain: z.string().optional(),
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(100).default(20).optional(),
});

export const SimulateXdrScenarioSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  scenarioType: XdrSimulationScenarioTypeSchema,
  targetAssetId: z.string().uuid().optional(),
  targetIdentityId: z.string().uuid().optional(),
});

export const GetXdrInvestigationSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID format").optional(),
  correlationId: z.string().min(1, "Correlation ID required"),
  filters: XdrFilterParamsSchema.optional(),
});

export type DnsEventInput = z.infer<typeof DnsEventSchema>;
export type EmailEventInput = z.infer<typeof EmailEventSchema>;
export type CloudEventInput = z.infer<typeof CloudEventSchema>;
export type FirewallEventInput = z.infer<typeof FirewallEventSchema>;
export type XdrCorrelationResultInput = z.infer<typeof XdrCorrelationResultSchema>;
export type XdrFilterParamsInput = z.infer<typeof XdrFilterParamsSchema>;
export type SimulateXdrScenarioInputType = z.infer<typeof SimulateXdrScenarioSchema>;
export type GetXdrInvestigationInputType = z.infer<typeof GetXdrInvestigationSchema>;

// ==============================================================================
// Phase 19: MITRE ATT&CK Intelligence & Entity Validation
// ==============================================================================

export const MitreTacticIdSchema = z.enum([
  "TA0043",
  "TA0042",
  "TA0001",
  "TA0002",
  "TA0003",
  "TA0004",
  "TA0005",
  "TA0006",
  "TA0007",
  "TA0008",
  "TA0009",
  "TA0011",
  "TA0010",
  "TA0040",
]);

export const MitreTacticSchema = z.object({
  id: z.string().min(1),
  external_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  order_index: z.number().int().default(0),
  technique_count: z.number().int().optional(),
});

export const MitreMitigationRefSchema = z.object({
  external_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
});

export const MitreExampleRefSchema = z.object({
  source_or_actor: z.string().min(1),
  description: z.string(),
  reference_url: z.string().optional(),
});

export const MitreTechniqueSchema = z.object({
  id: z.string().min(1),
  external_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  tactic_external_id: z.string().min(1),
  tactic_name: z.string().min(1),
  is_subtechnique: z.boolean().default(false),
  parent_technique_id: z.string().nullable().optional(),
  platforms: z.array(z.string()).default([]),
  data_sources: z.array(z.string()).default([]),
  detection_guidance: z.string().default(""),
  examples: z.array(MitreExampleRefSchema).default([]),
  mitigations: z.array(MitreMitigationRefSchema).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const MitreCoverageFilterStatusSchema = z.enum(["all", "covered", "uncovered"]);

export const MitreTechniqueFilterSchema = z.object({
  tactic_id: z.string().optional(),
  search: z.string().max(256).optional(),
  coverage_status: MitreCoverageFilterStatusSchema.optional().default("all"),
  platform: z.string().optional(),
  is_subtechnique: z.boolean().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(200).optional().default(50),
});

export const MitreTenantMappingSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  technique_external_id: z.string().min(1),
  coverage_status: z.enum(["covered", "partially_covered", "uncovered"]).default("covered"),
  custom_notes: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
});

export type MitreTacticInput = z.infer<typeof MitreTacticSchema>;
export type MitreTechniqueInput = z.infer<typeof MitreTechniqueSchema>;
export type MitreTechniqueFilterInput = z.infer<typeof MitreTechniqueFilterSchema>;
export type MitreTenantMappingInput = z.infer<typeof MitreTenantMappingSchema>;

// ==============================================================================
// Phase 20: Threat Intelligence & Canonical IOC Validation Schemas
// ==============================================================================

export const IocTypeSchema = z.enum(["ip", "domain", "url", "hash", "email", "file"]);

export const IocHashTypeSchema = z.enum(["md5", "sha1", "sha256", "sha512"]);

export const IocIpVersionSchema = z.enum(["v4", "v6"]);

export const IocStatusSchema = z.enum(["active", "deprecated", "whitelisted", "false_positive"]);

export const IocSeveritySchema = z.enum(["critical", "high", "medium", "low", "informational"]);

export const IocSourceSchema = z.enum(["manual", "simulation", "alienvault", "virustotal", "misp", "threatconnect", "feed"]);

export const IocRelationshipTargetTypeSchema = z.enum(["event", "alert", "incident", "case", "asset", "malware"]);

export const IocRelationshipTypeSchema = z.enum([
  "observed_in",
  "attributed_to",
  "targeted_at",
  "blocked_by",
  "dropped_by",
  "communicated_with",
]);

export const ThreatIndicatorSchema = z.object({
  id: z.string().uuid("Invalid IOC ID format"),
  organization_id: z.string().uuid("Invalid organization ID format"),
  ioc_type: IocTypeSchema,
  normalized_value: z.string().min(1, "Normalized value is required"),
  raw_value: z.string().min(1, "Raw value is required"),
  hash_type: IocHashTypeSchema.nullable().optional(),
  ip_version: IocIpVersionSchema.nullable().optional(),
  confidence: z.number().int().min(0).max(100).default(80),
  severity: IocSeveritySchema.default("medium"),
  threat_types: z.array(z.string()).default([]),
  source: z.string().default("manual"),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
  first_seen: z.string().datetime().optional(),
  last_seen: z.string().datetime().optional(),
  status: IocStatusSchema.default("active"),
  is_global: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const CreateIocInputSchema = z.object({
  ioc_type: IocTypeSchema,
  value: z.string().min(1, "Indicator value is required").max(2048, "Indicator value is too long"),
  hash_type: IocHashTypeSchema.nullable().optional(),
  confidence: z.number().int().min(0).max(100).optional().default(80),
  severity: IocSeveritySchema.optional().default("medium"),
  threat_types: z.array(z.string().max(64)).optional().default([]),
  source: z.string().max(64).optional().default("manual"),
  tags: z.array(z.string().max(64)).optional().default([]),
  description: z.string().max(2000).optional().default(""),
  status: IocStatusSchema.optional().default("active"),
  first_seen: z.string().datetime().optional(),
  last_seen: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const UpdateIocInputSchema = z.object({
  id: z.string().uuid("Invalid IOC ID format"),
  confidence: z.number().int().min(0).max(100).optional(),
  severity: IocSeveritySchema.optional(),
  threat_types: z.array(z.string().max(64)).optional(),
  tags: z.array(z.string().max(64)).optional(),
  description: z.string().max(2000).optional(),
  status: IocStatusSchema.optional(),
  last_seen: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const IocRelationshipSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid("Invalid organization ID format"),
  ioc_id: z.string().uuid("Invalid IOC ID format"),
  target_type: IocRelationshipTargetTypeSchema,
  target_id: z.string().min(1, "Target ID is required"),
  relationship_type: IocRelationshipTypeSchema.default("observed_in"),
  context: z.record(z.unknown()).default({}),
  first_seen: z.string().datetime().optional(),
  last_seen: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
});

export const CreateIocRelationshipInputSchema = z.object({
  ioc_id: z.string().uuid("Invalid IOC ID format"),
  target_type: IocRelationshipTargetTypeSchema,
  target_id: z.string().min(1, "Target ID is required"),
  relationship_type: IocRelationshipTypeSchema.optional().default("observed_in"),
  context: z.record(z.unknown()).optional().default({}),
});

export const IocFilterSchema = z.object({
  search: z.string().max(256).optional(),
  ioc_type: z.union([IocTypeSchema, z.literal("all")]).optional().default("all"),
  severity: z.union([IocSeveritySchema, z.literal("all")]).optional().default("all"),
  status: z.union([IocStatusSchema, z.literal("all")]).optional().default("all"),
  source: z.string().optional().default("all"),
  threat_type: z.string().optional(),
  tag: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(200).optional().default(25),
  sortBy: z.enum(["last_seen", "first_seen", "confidence", "severity", "created_at"]).optional().default("last_seen"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ThreatIndicatorInput = z.infer<typeof ThreatIndicatorSchema>;
export type CreateIocValidationInput = z.infer<typeof CreateIocInputSchema>;
export type UpdateIocValidationInput = z.infer<typeof UpdateIocInputSchema>;
export type IocRelationshipValidationInput = z.infer<typeof IocRelationshipSchema>;
export type CreateIocRelationshipValidationInput = z.infer<typeof CreateIocRelationshipInputSchema>;
export type IocFilterValidationInput = z.infer<typeof IocFilterSchema>;

// ------------------------------------------------------------------------------
// Phase 21 Threat Hunting & Investigation Schemas
// ------------------------------------------------------------------------------

export const HuntTypeSchema = z.enum([
  "all",
  "ioc",
  "ip",
  "hash",
  "user",
  "host",
  "process",
  "registry",
  "dns",
]);

export const HuntSessionStatusSchema = z.enum([
  "active",
  "completed",
  "saved",
  "archived",
]);

export const HuntEvidenceTargetTypeSchema = z.enum([
  "event",
  "alert",
  "ioc",
  "process",
  "socket",
  "registry",
]);

export const HuntQueryInputSchema = z.object({
  query: z.string().min(1, "Query is required").max(500),
  hunt_type: HuntTypeSchema.optional().default("all"),
  time_range: z.enum(["1h", "24h", "7d", "30d", "all"]).optional().default("24h"),
  entity_value: z.string().max(255).optional(),
  host_name: z.string().max(128).optional(),
  user_name: z.string().max(128).optional(),
  limit: z.number().int().min(1).max(200).optional().default(50),
});

export const CreateHuntSessionInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  hypothesis: z.string().max(2000).optional(),
  hunt_type: HuntTypeSchema.optional().default("all"),
  query: z.string().min(1, "Query is required").max(500),
  status: HuntSessionStatusSchema.optional().default("active"),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const CreateHuntEvidenceInputSchema = z.object({
  hunt_id: z.string().uuid().optional(),
  target_type: HuntEvidenceTargetTypeSchema,
  target_id: z.string().min(1, "Target ID is required").max(128),
  summary: z.string().min(1, "Summary is required").max(500),
  description: z.string().max(2000).optional(),
  confidence: z.number().int().min(0).max(100).optional().default(85),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const CreateHuntNoteInputSchema = z.object({
  hunt_id: z.string().uuid().optional(),
  content: z.string().min(1, "Content is required").max(5000),
  tags: z.array(z.string().max(64)).optional().default([]),
});

export type HuntQueryValidationInput = z.infer<typeof HuntQueryInputSchema>;
export type CreateHuntSessionValidationInput = z.infer<typeof CreateHuntSessionInputSchema>;
// ------------------------------------------------------------------------------
// Phase 22 Incident Response Validation Schemas
// ------------------------------------------------------------------------------

export const IncidentStageSchema = z.enum([
  "Detection",
  "Analysis",
  "Containment",
  "Eradication",
  "Recovery",
  "Lessons Learned",
  "Closed",
]);

export const IncidentPrioritySchema = z.enum([
  "P1",
  "P2",
  "P3",
  "P4",
  "Critical",
  "High",
  "Medium",
  "Low",
]);

export const IncidentStatusSchema = z.enum([
  "Open",
  "In Progress",
  "Contained",
  "Resolved",
  "Closed",
  "open",
  "in_progress",
  "contained",
  "resolved",
  "closed",
]);

export const IncidentTaskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);

export const IncidentEvidenceTypeSchema = z.enum([
  "alert",
  "event",
  "process",
  "socket",
  "registry",
  "ioc",
  "hunt_evidence",
  "file",
]);

export const IncidentFilterParamsSchema = z.object({
  search: z.string().max(255).optional(),
  stage: z.union([IncidentStageSchema, z.literal("all")]).optional().default("all"),
  severity: z.union([SeverityLevelSchema, z.literal("all")]).optional().default("all"),
  priority: z.union([IncidentPrioritySchema, z.literal("all")]).optional().default("all"),
  status: z.union([IncidentStatusSchema, z.literal("all")]).optional().default("all"),
  assigned_to: z.string().max(128).optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});

export const CreateIncidentInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(4000).optional(),
  severity: SeverityLevelSchema.optional().default("High"),
  priority: IncidentPrioritySchema.optional().default("P2"),
  stage: IncidentStageSchema.optional().default("Detection"),
  playbook_id: z.string().max(64).optional(),
  source_alert_id: z.string().uuid().optional(),
  source_alert_ids: z.array(z.string()).optional().default([]),
  assigned_to: z.string().uuid().optional(),
  assignee_name: z.string().max(128).optional(),
  affected_assets: z.array(z.string().max(128)).optional().default([]),
  affected_identities: z.array(z.string().max(128)).optional().default([]),
  mitre_tactics: z.array(z.string().max(128)).optional().default([]),
  mitre_techniques: z.array(z.string().max(64)).optional().default([]),
});

export const DeclareIncidentFromAlertInputSchema = z.object({
  alert_id: z.string().min(1, "Alert ID is required"),
  title: z.string().max(255).optional(),
  severity: SeverityLevelSchema.optional(),
  priority: IncidentPrioritySchema.optional().default("P2"),
  playbook_id: z.string().max(64).optional(),
  assigned_to: z.string().uuid().optional(),
  assignee_name: z.string().max(128).optional(),
  rationale: z.string().max(2000).optional(),
});

export const UpdateIncidentInputSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(4000).optional(),
  severity: SeverityLevelSchema.optional(),
  priority: IncidentPrioritySchema.optional(),
  status: IncidentStatusSchema.optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  assignee_name: z.string().max(128).nullable().optional(),
  affected_assets: z.array(z.string().max(128)).optional(),
  affected_identities: z.array(z.string().max(128)).optional(),
  mitre_tactics: z.array(z.string().max(128)).optional(),
  mitre_techniques: z.array(z.string().max(64)).optional(),
  playbook_id: z.string().max(64).nullable().optional(),
  playbook_name: z.string().max(255).nullable().optional(),
});

export const TransitionIncidentStageInputSchema = z.object({
  incident_id: z.string().min(1, "Incident ID is required"),
  new_stage: IncidentStageSchema,
  rationale: z.string().max(2000).optional(),
  actor_name: z.string().max(128).optional(),
});

export const CreateIncidentTaskInputSchema = z.object({
  incident_id: z.string().min(1, "Incident ID is required"),
  stage: IncidentStageSchema,
  title: z.string().min(1, "Task title is required").max(255),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().max(128).optional(),
  order_index: z.number().int().min(0).optional().default(0),
});

export const UpdateIncidentTaskInputSchema = z.object({
  id: z.string().min(1, "Task ID is required"),
  status: IncidentTaskStatusSchema.optional(),
  completed_by: z.string().max(128).optional(),
  notes: z.string().max(2000).optional(),
  assigned_to: z.string().max(128).optional(),
});

export const CreateIncidentEvidenceInputSchema = z.object({
  incident_id: z.string().min(1, "Incident ID is required"),
  target_type: IncidentEvidenceTypeSchema,
  target_id: z.string().min(1, "Target ID is required").max(255),
  summary: z.string().min(1, "Summary is required").max(500),
  description: z.string().max(2000).optional(),
  confidence: z.number().int().min(0).max(100).optional().default(90),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const CreateIncidentNoteInputSchema = z.object({
  incident_id: z.string().min(1, "Incident ID is required"),
  content: z.string().min(1, "Content is required").max(5000),
  tags: z.array(z.string().max(64)).optional().default([]),
});

export const CloseIncidentInputSchema = z.object({
  incident_id: z.string().min(1, "Incident ID is required"),
  closure_reason: z.string().min(1, "Closure reason is required").max(500),
  closure_notes: z.string().max(4000).optional(),
  actor_name: z.string().max(128).optional(),
});

export type IncidentFilterValidationInput = z.infer<typeof IncidentFilterParamsSchema>;
export type CreateIncidentValidationInput = z.infer<typeof CreateIncidentInputSchema>;
export type DeclareIncidentValidationInput = z.infer<typeof DeclareIncidentFromAlertInputSchema>;
export type UpdateIncidentValidationInput = z.infer<typeof UpdateIncidentInputSchema>;
export type TransitionIncidentStageValidationInput = z.infer<typeof TransitionIncidentStageInputSchema>;
export type CreateIncidentTaskValidationInput = z.infer<typeof CreateIncidentTaskInputSchema>;
export type UpdateIncidentTaskValidationInput = z.infer<typeof UpdateIncidentTaskInputSchema>;
export type CreateIncidentEvidenceValidationInput = z.infer<typeof CreateIncidentEvidenceInputSchema>;
export type CreateIncidentNoteValidationInput = z.infer<typeof CreateIncidentNoteInputSchema>;
export type CloseIncidentValidationInput = z.infer<typeof CloseIncidentInputSchema>;
