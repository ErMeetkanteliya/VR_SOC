import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <PlaceholderModulePage
      currentPath="/analytics"
      title="Analytics & Executive Metrics"
      category="Core SOC"
      description="MTTD, MTTR, false positive ratios, analyst throughput, and executive reporting."
      plannedPhase="Phase 28 — Analytics & Metrics"
    />
  );
}
