import React from "react";
import { getActiveOrganization } from "@/lib/tenant/actions";
import { getXdrCorrelations, getXdrInvestigationPackage } from "@/lib/xdr/investigation-service";
import { XdrInvestigationWorkbench } from "@/components/xdr/XdrInvestigationWorkbench";
import { EmptyState } from "@vrsoc/ui";
import { ShieldAlert } from "lucide-react";


export const dynamic = "force-dynamic";

export default async function XdrPage({
  searchParams,
}: {
  searchParams: Promise<{ correlationId?: string; query?: string; assetId?: string; identityId?: string }>;
}) {
  const { organization } = await getActiveOrganization();

  if (!organization) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-gray-400" />}
          title="Organization Membership Required"
          description="Please select or join an active organization to access the XDR correlation workbench."
        />
      </div>
    );
  }

  const params = await searchParams;
  const correlations = await getXdrCorrelations({
    organizationId: organization.id,
    filters: {
      query: params.query,
      assetId: params.assetId,
      identityId: params.identityId,
    },
  });

  const selectedCorrId = params.correlationId || correlations[0]?.id || "";
  const initialPackage = await getXdrInvestigationPackage({
    organizationId: organization.id,
    correlationId: selectedCorrId,
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <XdrInvestigationWorkbench
        initialCorrelations={correlations}
        initialPackage={initialPackage}
      />
    </div>
  );
}
