import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARSettingsPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/settings"
      title="SOAR Orchestration Settings"
      category="SOAR Orchestration"
      description="Connector integrations, webhook endpoints, API credentials, and execution worker nodes."
      plannedPhase="Phase 20 — SOAR Overview"
    />
  );
}
