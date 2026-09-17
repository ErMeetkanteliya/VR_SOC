import { executeSiemEventsAction, executeSiemLogsAction, getSavedQueriesAction } from "@/lib/siem/actions";
import { SiemCoreExplorer } from "@/components/siem/SiemCoreExplorer";

export const dynamic = "force-dynamic";

export default async function SiemPage() {
  const [evRes, logRes, sqRes] = await Promise.all([
    executeSiemEventsAction({ filters: { page: 1, pageSize: 25, timeRange: "24h" } }),
    executeSiemLogsAction({ filters: { page: 1, pageSize: 25, timeRange: "24h" } }),
    getSavedQueriesAction(),
  ]);

  const events = evRes.success && evRes.data ? evRes.data.items : [];
  const eventCount = evRes.success && evRes.data ? evRes.data.totalCount : 0;
  const logs = logRes.success && logRes.data ? logRes.data.items : [];
  const logCount = logRes.success && logRes.data ? logRes.data.totalCount : 0;
  const savedQueries = sqRes.success && sqRes.data ? sqRes.data : [];

  return (
    <SiemCoreExplorer
      initialEvents={events}
      initialLogs={logs}
      initialSavedQueries={savedQueries}
      initialEventCount={eventCount}
      initialLogCount={logCount}
    />
  );
}
