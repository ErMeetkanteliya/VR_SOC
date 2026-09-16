import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARAutomationPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/automation"
      title="Automation Pipeline"
      category="SOAR Orchestration"
      description="Automated triage pipelines, event triggers, conditional workflows, and queue dispatchers."
      plannedPhase="Phase 21 — Automation Pipeline"
    />
  );
}
