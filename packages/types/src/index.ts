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

export type AgentStatus = "Online" | "Warning" | "Critical" | "Offline" | "Updating" | "Pending";

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

export interface Asset {
  id: string;
  organization_id: string;
  hostname: string;
  ip_address: string;
  os_type: "Windows" | "Linux" | "macOS";
  os_version: string;
  criticality: SeverityLevel;
  is_isolated: boolean;
  created_at: string;
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
}

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
