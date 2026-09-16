// ==============================================================================
// VRSOC — Core Domain Type Definitions
// ==============================================================================

export type UserRole =
  | "Super Admin"
  | "Instructor"
  | "Student"
  | "SOC Analyst"
  | "Incident Responder"
  | "Threat Hunter"
  | "Auditor"
  | "Viewer";

export type MembershipStatus = "Active" | "Suspended" | "Invited";

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
  billing_tier: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  status: MembershipStatus;
  joined_at: string;
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
