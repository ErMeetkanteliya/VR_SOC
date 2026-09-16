import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function AIAssistantPage() {
  return (
    <PlaceholderModulePage
      currentPath="/ai-assistant"
      title="SOC AI Assistant"
      category="Core SOC"
      description="Grounded AI investigation co-pilot, Sigma rule generator, and alert triage assistant."
      plannedPhase="Phase 30 — AI Assistant"
    />
  );
}
