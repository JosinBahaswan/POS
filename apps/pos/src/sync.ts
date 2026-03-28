import { markSalesSynced, readLocalSales } from "./database";

type SyncInput = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  tenantId?: string;
  scopeKey?: string;
};

type SyncResult = {
  pending: number;
  message: string;
};

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

async function postSalesWithRetry(
  url: string,
  anonKey: string,
  payload: unknown
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (response.ok || response.status < 500) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Sync request failed");
}

export async function syncPendingSales(input: SyncInput): Promise<SyncResult> {
  const scopeKey = input.scopeKey ?? "default";
  const unsynced = readLocalSales(scopeKey).filter((sale) => !sale.synced);

  if (unsynced.length === 0) {
    return { pending: 0, message: "Semua transaksi tersinkron" };
  }

  if (!navigator.onLine) {
    return { pending: unsynced.length, message: "Perangkat offline, menunggu jaringan" };
  }

  if (!input.supabaseUrl || !input.supabaseAnonKey || !input.tenantId) {
    return {
      pending: unsynced.length,
      message: "Transaksi tersimpan aman"
    };
  }

  const payload = unsynced.map((sale) => ({
    id: sale.id,
    tenant_id: input.tenantId,
    subtotal: sale.subtotal,
    discount_percent: sale.discountPercent,
    discount_amount: sale.discountAmount,
    total: sale.total,
    payment_method: sale.paymentMethod,
    created_at: sale.createdAt,
    source: "pos-pwa",
    line_items: sale.items
  }));

  try {
    const response = await postSalesWithRetry(
      `${input.supabaseUrl}/rest/v1/sales`,
      input.supabaseAnonKey,
      payload
    );

    if (!response.ok) {
      return {
        pending: unsynced.length,
        message: "Sinkron ditolak server, periksa kredensial tenant"
      };
    }

    markSalesSynced(unsynced.map((sale) => sale.id), scopeKey);
    return { pending: 0, message: "Sinkron sukses" };
  } catch {
    return {
      pending: unsynced.length,
      message: "Sinkron gagal setelah retry, akan dicoba lagi"
    };
  }
}
