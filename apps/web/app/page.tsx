import { getDashboardSummary } from "@/lib/dashboard";
import { DashboardPdfButton } from "./components/DashboardPdfButton";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);

export default async function Home() {
  const tenantId = process.env.NEXT_PUBLIC_DEMO_TENANT_ID?.trim();

  let summary = null;
  if (tenantId) {
    try {
      summary = await getDashboardSummary(tenantId);
    } catch {
      summary = null;
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-sky to-blue-100 p-8">
      <section className="mx-auto max-w-4xl rounded-2xl border border-blue-100 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy">POS SaaS Control Center</h1>
            <p className="mt-3 text-slate-600">
              Portal ini untuk owner memantau penjualan, status langganan, dan konfigurasi toko.
            </p>
          </div>

          <DashboardPdfButton summary={summary} tenantId={tenantId} />
        </div>

        {!tenantId ? (
          <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
            Set `NEXT_PUBLIC_DEMO_TENANT_ID` untuk menampilkan ringkasan tenant di dashboard.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h2 className="text-sm text-slate-600">Omzet Hari Ini</h2>
              <p className="mt-1 text-2xl font-semibold text-navy">
                {formatCurrency(summary?.todayRevenue ?? 0)}
              </p>
            </article>
            <article className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h2 className="text-sm text-slate-600">Jumlah Transaksi</h2>
              <p className="mt-1 text-2xl font-semibold text-navy">
                {summary?.todayTransactions ?? 0}
              </p>
            </article>
            <article className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h2 className="text-sm text-slate-600">Status Subscription</h2>
              <p className="mt-1 text-2xl font-semibold text-navy">
                {summary?.subscriptionStatus ?? "unknown"}
              </p>
            </article>
            <article className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h2 className="text-sm text-slate-600">Pending Sinkronisasi</h2>
              <p className="mt-1 text-2xl font-semibold text-navy">
                {summary?.pendingSync ?? 0}
              </p>
            </article>
            <article className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <h2 className="text-sm text-slate-600">Transaksi Terakhir</h2>
              <p className="mt-1 text-sm font-semibold text-navy">
                {summary?.lastTransactionAt
                  ? new Date(summary.lastTransactionAt).toLocaleString("id-ID")
                  : "Belum ada"}
              </p>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
