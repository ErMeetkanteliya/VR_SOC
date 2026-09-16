import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function AgentsPage() {
  return (
    <PlaceholderModulePage
      currentPath="/agents"
      title="Endpoint Agents (EDR Fleet)"
      category="Core SOC"
      description="Live endpoint sensors, host isolation, process monitoring, and telemetry health."
      plannedPhase="Phase 11 — Agent Fleet & Assets"
    />
  );
}
