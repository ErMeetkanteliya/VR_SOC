import { getSimulationScenarios, getSimulationRuns } from "@/lib/simulation/actions";
import { getTelemetryEvents, getTelemetryStats } from "@/lib/telemetry/actions";
import { getAgents } from "@/lib/agents/actions";
import { getActiveOrganization } from "@/lib/tenant/actions";
import { SimulationLabDashboard } from "@/components/simulation/SimulationLabDashboard";
import { EmptyState } from "@vrsoc/ui";
import { Layers } from "lucide-react";
import type { Asset } from "@vrsoc/types";

export const dynamic = "force-dynamic";

export default async function SOARSimulationPage() {
  const { organization } = await getActiveOrganization();

  if (!organization) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<Layers className="w-8 h-8 text-gray-400" />}
          title="Organization Membership Required"
          description="Please select or join an active organization to access the cyber simulation lab."
        />
      </div>
    );
  }

  // Fetch initial telemetry and simulation state
  const [scenariosRes, runsRes, eventsRes, statsRes, agentsRes] = await Promise.all([
    getSimulationScenarios(),
    getSimulationRuns({ pageSize: 10 }),
    getTelemetryEvents({ pageSize: 25 }),
    getTelemetryStats(),
    getAgents({ pageSize: 50 }),
  ]);

  const scenarios = scenariosRes.success && scenariosRes.data ? scenariosRes.data : [];
  const runs = runsRes.success && runsRes.data ? runsRes.data : [];
  const events = eventsRes.success && eventsRes.data ? eventsRes.data.events : [];
  const stats = statsRes.success && statsRes.data ? statsRes.data : {
    totalEvents: 0,
    totalLogs: 0,
    eventsLastHour: 0,
    activeSimulations: 0,
    severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
    categoryBreakdown: {},
    sourceBreakdown: {},
  };

  const assets: Asset[] =
    agentsRes.success && agentsRes.data
      ? agentsRes.data.agents.map((a) => a.asset).filter((asset): asset is Asset => Boolean(asset))
      : [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <SimulationLabDashboard
        initialScenarios={scenarios}
        initialRuns={runs}
        initialEvents={events}
        initialStats={stats}
        assets={assets}
      />
    </div>
  );
}
