import { NextResponse } from "next/server";
import { VRSOC_CONFIG } from "@vrsoc/config";
import type { HealthCheckResponse } from "@vrsoc/types";

export async function GET() {
  const healthData: HealthCheckResponse = {
    status: "operational",
    timestamp: new Date().toISOString(),
    version: VRSOC_CONFIG.version,
    services: {
      database: "mock",
      auth: "ready",
      telemetry: "active",
    },
  };

  return NextResponse.json(healthData, { status: 200 });
}
