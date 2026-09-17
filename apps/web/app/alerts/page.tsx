import { getAlertsAction, getAlertStatsAction } from "@/lib/alerts/actions";
import { AlertCenterDashboard } from "@/components/alerts/AlertCenterDashboard";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [alertsRes, statsRes] = await Promise.all([
    getAlertsAction({ page: 1, pageSize: 25, timeRange: "24h" }),
    getAlertStatsAction(),
  ]);

  const initialAlerts = alertsRes.success && alertsRes.data ? alertsRes.data.items : [];
  const initialCount = alertsRes.success && alertsRes.data ? alertsRes.data.totalCount : 0;
  const initialStats = statsRes.success && statsRes.data ? statsRes.data : undefined;

  return (
    <AlertCenterDashboard
      initialAlerts={initialAlerts}
      initialTotalCount={initialCount}
      initialStats={initialStats}
    />
  );
}
