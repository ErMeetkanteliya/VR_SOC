import type { UserRole, Permission } from "@vrsoc/types";

/**
 * Authoritative Role-to-Permission mapping table matching docs/product/roles-and-permissions.md
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  "Super Admin": [
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
  ],

  Instructor: [
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
    "training:submissions:grade",
    // Compliance & GRC
    "compliance:read",
    // Audit & Reporting
    "reports:generate",
    "reports:export",
  ],

  Student: [
    // SOC Telemetry & Agents
    "agents:read",
    "telemetry:read",
    "telemetry:query",
    // Detections & MITRE
    "detections:read",
    "mitre:read",
    // Alerts & Incidents
    "alerts:read",
    "alerts:triage",
    "alerts:comment",
    // Cases & Evidence
    "cases:read",
    "cases:add_evidence",
    "cases:add_notes",
    // SOAR & Automation
    "soar:playbooks:read",
    // Training & Simulation
    "simulation:scenarios:read",
    "simulation:scenarios:launch",
    "training:quizzes:take",
    // Compliance & GRC
    "compliance:read",
  ],

  "SOC Analyst": [
    // SOC Telemetry & Agents
    "agents:read",
    "agents:isolate",
    "agents:restart",
    "agents:collect_logs",
    "telemetry:read",
    "telemetry:query",
    // Detections & MITRE
    "detections:read",
    "detections:test",
    "mitre:read",
    "mitre:simulate",
    // Alerts & Incidents
    "alerts:read",
    "alerts:triage",
    "alerts:comment",
    "alerts:escalate",
    // Incidents & Cases
    "incidents:read",
    "incidents:create",
    "incidents:assign",
    "cases:read",
    "cases:create",
    "cases:add_evidence",
    "cases:add_notes",
    // SOAR & Automation
    "soar:playbooks:read",
    "soar:playbooks:execute",
    "soar:actions:execute",
    // Training & Simulation
    "simulation:scenarios:read",
    "simulation:scenarios:launch",
    // Compliance & GRC
    "compliance:read",
    // Audit & Reporting
    "reports:generate",
    "reports:export",
  ],

  "Incident Responder": [
    // SOC Telemetry & Agents
    "agents:read",
    "agents:isolate",
    "agents:restart",
    "agents:collect_logs",
    "telemetry:read",
    "telemetry:query",
    // Detections & MITRE
    "detections:read",
    "detections:test",
    "mitre:read",
    "mitre:simulate",
    // Alerts & Incidents
    "alerts:read",
    "alerts:triage",
    "alerts:comment",
    "alerts:escalate",
    // Incidents & Cases
    "incidents:read",
    "incidents:create",
    "incidents:update_status",
    "incidents:assign",
    "incidents:close",
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
    "simulation:scenarios:launch",
    // Compliance & GRC
    "compliance:read",
    // Audit & Reporting
    "reports:generate",
    "reports:export",
  ],

  "Threat Hunter": [
    // SOC Telemetry & Agents
    "agents:read",
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
    // Incidents & Cases
    "incidents:read",
    "incidents:create",
    "incidents:assign",
    "cases:read",
    "cases:create",
    "cases:add_evidence",
    "cases:add_notes",
    // SOAR & Automation
    "soar:playbooks:read",
    "soar:playbooks:create",
    "soar:playbooks:update",
    // Training & Simulation
    "simulation:scenarios:read",
    "simulation:scenarios:launch",
    // Compliance & GRC
    "compliance:read",
    // Audit & Reporting
    "reports:generate",
    "reports:export",
  ],

  Auditor: [
    // SOC Telemetry & Agents
    "agents:read",
    "telemetry:read",
    "telemetry:query",
    // Detections & MITRE
    "detections:read",
    "mitre:read",
    // Alerts & Incidents
    "alerts:read",
    // Incidents & Cases
    "incidents:read",
    "cases:read",
    // SOAR & Automation
    "soar:playbooks:read",
    // Compliance & GRC
    "compliance:read",
    "compliance:update_controls",
    "compliance:export",
    // Audit & Reporting
    "audit:read",
    "reports:generate",
    "reports:export",
  ],

  Viewer: [
    // SOC Telemetry & Agents
    "agents:read",
    // Detections & MITRE
    "detections:read",
    "mitre:read",
    // Alerts & Incidents
    "alerts:read",
    // SOAR & Automation
    "soar:playbooks:read",
    // Compliance & GRC
    "compliance:read",
    // Audit & Reporting
    "reports:generate",
    "reports:export",
  ],
};

/**
 * Check if a given UserRole has a specific Permission.
 * Authorization is strictly permission-based.
 */
export function hasPermission(role: UserRole | string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const rolePermissions = ROLE_PERMISSIONS[role as UserRole];
  if (!rolePermissions) return false;
  return rolePermissions.includes(permission);
}

/**
 * Returns all allowed permissions for a role.
 */
export function getPermissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
