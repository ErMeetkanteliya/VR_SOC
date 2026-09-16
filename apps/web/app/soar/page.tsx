import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARDashboardPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar"
      title="SOAR Orchestration Hub"
      category="SOAR Orchestration"
      description="Security Orchestration, Automation, and Response central control plane and execution metrics."
      plannedPhase="Phase 20 — SOAR Overview"
    />
  );
}
