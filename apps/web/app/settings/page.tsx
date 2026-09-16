import { PlaceholderModulePage } from "@/components/shell/PlaceholderModulePage";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <PlaceholderModulePage
      currentPath="/settings"
      title="Platform & Tenant Settings"
      category="Core SOC"
      description="Organization configuration, security policies, API center, and system audit logs."
      plannedPhase="Phase 32 — Settings"
    />
  );
}
