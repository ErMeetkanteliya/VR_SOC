import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SOARPlaybooksPage() {
  return (
    <PlaceholderModulePage
      currentPath="/soar/playbooks"
      title="Playbooks Catalog"
      category="SOAR Orchestration"
      description="Standardized incident response playbooks, automation recipes, and execution runbooks."
      plannedPhase="Phase 22 — Playbooks Hub"
    />
  );
}
