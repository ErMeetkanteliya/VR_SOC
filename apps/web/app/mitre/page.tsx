import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function MitrePage() {
  return (
    <PlaceholderModulePage
      currentPath="/mitre"
      title="MITRE ATT&CK Matrix"
      category="Core SOC"
      description="Interactive MITRE matrix, tactic and technique coverage, telemetry search links, and heatmaps."
      plannedPhase="Phase 16 — MITRE ATT&CK Matrix"
    />
  );
}
