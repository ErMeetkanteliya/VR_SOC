import React from "react";
import { getActiveOrganization } from "@/lib/tenant/actions";
import { getEndpointsList, getEndpointInvestigation } from "@/lib/edr/investigation-service";
import { EdrInvestigationWorkbench } from "@/components/edr/EdrInvestigationWorkbench";
import { EmptyState } from "@vrsoc/ui";
import { ShieldAlert, Server } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EdrPage({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string }>;
}) {
  const { organization } = await getActiveOrganization();

  if (!organization) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-gray-400" />}
          title="Organization Membership Required"
          description="Please select or join an active organization to access the EDR investigation console."
        />
      </div>
    );
  }

  const endpoints = await getEndpointsList(organization.id);
  const params = await searchParams;
  const targetAssetId = params.assetId || endpoints[0]?.id;

  let initialInvestigation = null;
  if (targetAssetId) {
    initialInvestigation = await getEndpointInvestigation(organization.id, targetAssetId);
  }

  if (endpoints.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<Server className="w-8 h-8 text-gray-400" />}
          title="No Endpoints Monitored"
          description="There are currently no endpoint assets registered in this organization fleet. Deploy or simulate an agent to begin EDR investigation."
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <EdrInvestigationWorkbench
        initialEndpoints={endpoints}
        initialInvestigation={initialInvestigation}
      />
    </div>
  );
}
