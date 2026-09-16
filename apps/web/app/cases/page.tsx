import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function CasesPage() {
  return (
    <PlaceholderModulePage
      currentPath="/cases"
      title="Investigation Cases"
      category="Core SOC"
      description="Collaborative SOC case management, timeline dossiers, evidence locker, and task delegation."
      plannedPhase="Phase 17 — Investigation Cases"
    />
  );
}
