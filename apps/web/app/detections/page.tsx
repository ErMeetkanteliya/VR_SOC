import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function DetectionsPage() {
  return (
    <PlaceholderModulePage
      currentPath="/detections"
      title="Threat Detection Rules"
      category="Core SOC"
      description="Sigma and YARA rule catalog, telemetry test bench, and custom rule authoring."
      plannedPhase="Phase 13 — Threat Detection Rules"
    />
  );
}
