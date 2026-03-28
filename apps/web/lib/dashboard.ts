import { getSupabaseServerClient } from "./supabase-server";

export type DashboardSummary = {
  tenantId: string;
  todayRevenue: number;
  todayTransactions: number;
  pendingSync: number;
  subscriptionStatus: string;
  lastTransactionAt: string | null;
};

export async function getDashboardSummary(tenantId: string): Promise<DashboardSummary> {
  const supabase = getSupabaseServerClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [salesResult, subscriptionResult, pendingResult] = await Promise.all([
    supabase
      .from("sales")
      .select("id,total,created_at")
      .eq("tenant_id", tenantId)
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("subscriptions")
      .select("status")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("source", "pos-pwa")
  ]);

  const salesRows = salesResult.data ?? [];
  const todayRevenue = salesRows.reduce((sum, row) => sum + Number(row.total), 0);
  const todayTransactions = salesRows.length;
  const lastTransactionAt = salesRows[0]?.created_at ?? null;

  return {
    tenantId,
    todayRevenue,
    todayTransactions,
    pendingSync: pendingResult.count ?? 0,
    subscriptionStatus: subscriptionResult.data?.status ?? "unknown",
    lastTransactionAt
  };
}
