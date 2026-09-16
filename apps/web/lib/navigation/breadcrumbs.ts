export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  agents: "Agents (EDR)",
  alerts: "Alerts",
  incidents: "Incidents",
  detections: "Threat Detection",
  mitre: "MITRE ATT&CK",
  logs: "Log Explorer",
  cases: "Cases",
  analytics: "Analytics",
  "ai-assistant": "AI Assistant",
  knowledge: "Knowledge Center",
  settings: "Settings",
  soar: "SOAR Dashboard",
  automation: "Automation Pipeline",
  playbooks: "Playbooks",
  builder: "Playbook Builder",
  enrichment: "Threat Enrichment",
  "ai-engine": "AI Decision Engine",
  actions: "Response Actions",
  approvals: "Approvals Queue",
  history: "Execution History",
  live: "Live Execution",
  reports: "Reports Hub",
  simulation: "Simulation Lab",
  "design-system": "Design System",
};

/**
 * Generates hierarchical breadcrumbs dynamically from the current pathname.
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname || pathname === "/") {
    return [{ label: "Dashboard", href: "/" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Dashboard", href: "/" }];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;
    currentPath += `/${segment}`;

    const formattedFallback = segment
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    const label = ROUTE_LABELS[segment] || formattedFallback;

    breadcrumbs.push({
      label,
      href: i === segments.length - 1 ? undefined : currentPath,
    });
  }

  return breadcrumbs;
}
