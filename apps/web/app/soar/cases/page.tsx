import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARCasesPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/cases"
      title="SOAR Orchestrated Cases"
      category="SOAR Orchestration"
      description="Automated case tracking, playbook task assignments, and evidence dossiers."
      plannedPhase="Phase 17 — Investigation Cases"
    />
  );
}
