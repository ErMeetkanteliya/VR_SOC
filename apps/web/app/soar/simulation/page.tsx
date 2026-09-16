import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARSimulationPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/simulation"
      title="Simulation Lab"
      category="SOAR Orchestration"
      description="Synthetic attack simulation engine, automated scenario runs, and response evaluation."
      plannedPhase="Phase 26 — Simulation Lab"
    />
  );
}
