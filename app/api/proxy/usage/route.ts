// Returns aggregated proxy usage for a given service and date range.
// Used by anthropicSource, openaiSource, and geminiSource to populate the dashboard.

import { NextRequest, NextResponse } from "next/server";
import { getProxyLogs, aggregateByDay, ProxyService } from "@/lib/proxyStore";
import { ServiceType } from "@/lib/constants/services";

const VALID_SERVICES: ProxyService[] = [
  ServiceType.Anthropic,
  ServiceType.OpenAI,
  ServiceType.Gemini,
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const service = searchParams.get("service") as ProxyService | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!service || !VALID_SERVICES.includes(service) || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing or invalid params" }, { status: 400 });
  }

  const logs = getProxyLogs(service, startDate, endDate);
  const dailyRecords = aggregateByDay(logs);
  const totalCostUsd = dailyRecords.reduce((s, r) => s + r.costUsd, 0);

  return NextResponse.json({ dailyRecords, totalCostUsd });
}
