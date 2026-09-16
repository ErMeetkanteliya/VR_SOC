import React from "react";
import type { Permission, UserRole } from "@vrsoc/types";
import { hasPermission } from "@/lib/rbac/permissions";
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Layers,
  FileText,
  Briefcase,
  BarChart3,
  Bot,
  BookOpen,
  Settings,
  Activity,
  Workflow,
  Binary,
  Cpu,
  Globe,
  Sparkles,
  Zap,
  CheckCircle2,
  FolderKanban,
  Clock,
  Radio,
  FileSpreadsheet,
  FlaskConical,
  Wrench,
} from "lucide-react";

export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "critical" | "warning" | "ai";
  permission?: Permission;
}

export interface NavGroupConfig {
  title?: string;
  items: NavItemConfig[];
}

export const BASE44_NAV_GROUPS: NavGroupConfig[] = [
  {
    title: "Core Operations",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/",
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        id: "agents",
        label: "Agents (EDR)",
        href: "/agents",
        icon: <Server className="w-4 h-4" />,
        badge: "156",
        permission: "agents:read",
      },
      {
        id: "alerts",
        label: "Alerts",
        href: "/alerts",
        icon: <AlertTriangle className="w-4 h-4" />,
        badge: "24",
        badgeVariant: "critical",
        permission: "alerts:read",
      },
      {
        id: "incidents",
        label: "Incidents",
        href: "/incidents",
        icon: <Flame className="w-4 h-4" />,
        badge: "7",
        badgeVariant: "warning",
        permission: "incidents:read",
      },
      {
        id: "detections",
        label: "Threat Detection",
        href: "/detections",
        icon: <ShieldAlert className="w-4 h-4" />,
        badge: "48",
        permission: "detections:read",
      },
      {
        id: "mitre",
        label: "MITRE ATT&CK",
        href: "/mitre",
        icon: <Layers className="w-4 h-4" />,
        badge: "78%",
        permission: "mitre:read",
      },
      {
        id: "logs",
        label: "Log Explorer",
        href: "/logs",
        icon: <FileText className="w-4 h-4" />,
        permission: "telemetry:read",
      },
      {
        id: "cases",
        label: "Cases",
        href: "/cases",
        icon: <Briefcase className="w-4 h-4" />,
        badge: "12",
        permission: "cases:read",
      },
      {
        id: "analytics",
        label: "Analytics",
        href: "/analytics",
        icon: <BarChart3 className="w-4 h-4" />,
        permission: "reports:generate",
      },
      {
        id: "ai-assistant",
        label: "AI Assistant",
        href: "/ai-assistant",
        icon: <Bot className="w-4 h-4" />,
        badge: "AI",
        badgeVariant: "ai",
        permission: "telemetry:read",
      },
      {
        id: "knowledge",
        label: "Knowledge Center",
        href: "/knowledge",
        icon: <BookOpen className="w-4 h-4" />,
        badge: "24",
        permission: "simulation:scenarios:read",
      },
      {
        id: "settings",
        label: "Settings",
        href: "/settings",
        icon: <Settings className="w-4 h-4" />,
        permission: "org:settings:manage",
      },
    ],
  },
  {
    title: "SOAR Orchestration",
    items: [
      {
        id: "soar",
        label: "SOAR Dashboard",
        href: "/soar",
        icon: <Activity className="w-4 h-4" />,
        permission: "soar:playbooks:read",
      },
      {
        id: "soar-automation",
        label: "Automation Pipeline",
        href: "/soar/automation",
        icon: <Workflow className="w-4 h-4" />,
        permission: "soar:playbooks:read",
      },
      {
        id: "soar-playbooks",
        label: "Playbooks",
        href: "/soar/playbooks",
        icon: <Binary className="w-4 h-4" />,
        badge: "20",
        permission: "soar:playbooks:read",
      },
      {
        id: "soar-builder",
        label: "Playbook Builder",
        href: "/soar/builder",
        icon: <Cpu className="w-4 h-4" />,
        permission: "soar:playbooks:create",
      },
      {
        id: "soar-enrichment",
        label: "Threat Enrichment",
        href: "/soar/enrichment",
        icon: <Globe className="w-4 h-4" />,
        permission: "soar:playbooks:read",
      },
      {
        id: "soar-ai-engine",
        label: "AI Decision Engine",
        href: "/soar/ai-engine",
        icon: <Sparkles className="w-4 h-4" />,
        permission: "soar:playbooks:read",
      },
      {
        id: "soar-actions",
        label: "Response Actions",
        href: "/soar/actions",
        icon: <Zap className="w-4 h-4" />,
        badge: "16",
        permission: "soar:actions:execute",
      },
      {
        id: "soar-approvals",
        label: "Approvals Queue",
        href: "/soar/approvals",
        icon: <CheckCircle2 className="w-4 h-4" />,
        badge: "3",
        badgeVariant: "warning",
        permission: "soar:approvals:manage",
      },
      {
        id: "soar-cases",
        label: "SOAR Cases",
        href: "/soar/cases",
        icon: <FolderKanban className="w-4 h-4" />,
        permission: "cases:read",
      },
      {
        id: "soar-history",
        label: "Execution History",
        href: "/soar/history",
        icon: <Clock className="w-4 h-4" />,
        permission: "soar:playbooks:read",
      },
      {
        id: "soar-live",
        label: "Live Execution",
        href: "/soar/live",
        icon: <Radio className="w-4 h-4" />,
        permission: "simulation:scenarios:launch",
      },
      {
        id: "soar-reports",
        label: "Reports Hub",
        href: "/soar/reports",
        icon: <FileSpreadsheet className="w-4 h-4" />,
        permission: "reports:export",
      },
      {
        id: "soar-simulation",
        label: "Simulation Lab",
        href: "/soar/simulation",
        icon: <FlaskConical className="w-4 h-4" />,
        permission: "simulation:scenarios:launch",
      },
      {
        id: "soar-settings",
        label: "SOAR Settings",
        href: "/soar/settings",
        icon: <Wrench className="w-4 h-4" />,
        permission: "soar:playbooks:update",
      },
    ],
  },
];

/**
 * Filter navigation groups based on the user's active role permissions.
 * This is strictly a client UX helper for presenting relevant navigation items.
 */
export function getAccessibleNavGroups(
  role: UserRole | string | null | undefined
): NavGroupConfig[] {
  return BASE44_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(role as UserRole, item.permission);
    }),
  })).filter((group) => group.items.length > 0);
}
