import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARAIEnginePage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/ai-engine"
      title="AI Decision Engine"
      category="SOAR Orchestration"
      description="Autonomous response recommendation, anomaly correlation, and AI-guided triage decisions."
      plannedPhase="Phase 25 — AI SOAR Engine"
    />
  );
}
