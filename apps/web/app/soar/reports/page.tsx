import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARReportsPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/reports"
      title="SOAR Reports Hub"
      category="SOAR Orchestration"
      description="Automated report builder, regulatory compliance exports, and incident post-mortems."
      plannedPhase="Phase 28 — Analytics & Metrics"
    />
  );
}
