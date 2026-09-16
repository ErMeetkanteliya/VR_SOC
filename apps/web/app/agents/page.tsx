import { getAgents } from "@/lib/agents/actions";
import { AgentManagementDashboard } from "@/components/agents/AgentManagementDashboard";
import { getActiveOrganization } from "@/lib/tenant/actions";
import { EmptyState } from "@vrsoc/ui";
import { Server } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const { organization } = await getActiveOrganization();

  if (!organization) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<Server className="w-8 h-8 text-gray-400" />}
          title="Organization Membership Required"
          description="Please select or join an active organization to access the endpoint agent management console."
        />
      </div>
    );
  }

  // Fetch initial fleet data
  const result = await getAgents();

  const agents = result.success && result.data ? result.data.agents : [];
  const summary = result.success && result.data ? result.data.summary : {
    totalAgents: 0,
    onlineAgents: 0,
    offlineAgents: 0,
    updatingAgents: 0,
    errorAgents: 0,
    pendingAgents: 0,
    isolatedAgents: 0,
    avgCpuUsagePct: 0,
    avgRamUsagePct: 0,
    avgDiskUsagePct: 0,
  };
  const assetGroups = result.success && result.data ? result.data.assetGroups : [];
  const totalCount = result.success && result.data ? result.data.totalCount : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <AgentManagementDashboard
        initialAgents={agents}
        initialSummary={summary}
        initialAssetGroups={assetGroups}
        totalCount={totalCount}
      />
    </div>
  );
}
