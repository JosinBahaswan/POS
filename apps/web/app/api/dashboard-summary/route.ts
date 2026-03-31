import { NextRequest, NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/dashboard";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();
  const rawPeriodDays = Number(request.nextUrl.searchParams.get("periodDays") ?? "");
  const rawSource = request.nextUrl.searchParams.get("source")?.trim().toLowerCase() ?? "all";
  const rawDayType = request.nextUrl.searchParams.get("dayType")?.trim().toLowerCase() ?? "all";
  const rawTarget = Number(request.nextUrl.searchParams.get("target") ?? "");
  const periodDays = rawPeriodDays === 7 || rawPeriodDays === 14 || rawPeriodDays === 30
    ? rawPeriodDays
    : 7;
  const source = ["all", "pos-pwa", "web", "mobile", "kiosk", "unknown"].includes(rawSource)
    ? rawSource
    : "all";
  const dayType = ["all", "weekday", "weekend"].includes(rawDayType)
    ? rawDayType
    : "all";
  const monthlyTarget = Number.isFinite(rawTarget) && rawTarget > 0
    ? Math.round(rawTarget)
    : 0;

  if (!tenantId) {
    return NextResponse.json(
      { ok: false, message: "tenantId is required" },
      { status: 400 }
    );
  }

  try {
    const summary = await getDashboardSummary(tenantId, { periodDays, source, dayType, monthlyTarget });
    return NextResponse.json({ ok: true, summary });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
