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

export type SeverityLevel = "Critical" | "High" | "Medium" | "Low" | "Informational";

export type AlertStatus =
  | "Open"
  | "Acknowledged"
  | "In Progress"
  | "Escalated"
  | "Closed"
  | "False Positive";

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
  alert_code: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  risk_score: number;
  status: AlertStatus;
  asset_id?: string;
  mitre_technique_id?: string;
  assignee_id?: string;
  triggered_at: string;
  closed_at?: string;
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
