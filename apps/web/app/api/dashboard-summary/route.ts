import { NextRequest, NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/dashboard";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();

  if (!tenantId) {
    return NextResponse.json(
      { ok: false, message: "tenantId is required" },
      { status: 400 }
    );
  }

  try {
    const summary = await getDashboardSummary(tenantId);
    return NextResponse.json({ ok: true, summary });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}
