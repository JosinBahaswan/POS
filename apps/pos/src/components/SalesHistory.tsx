import React, { useEffect, useMemo, useState } from "react";
import {
  SaleDetailModal,
  SalesActionModal,
  SalesHistoryDesktop,
  SalesHistoryMobile,
  type ActiveSalesAction,
  type SalesHistoryProps,
  type SalesMethodFilter,
  type SalesStatusFilter,
  saleIsSplitPayment
} from "./sales-history";

export function SalesHistory({ sales, onPrint, onRequestRefund, onRequestVoid }: SalesHistoryProps) {
  const [detailSaleId, setDetailSaleId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SalesStatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<SalesMethodFilter>("all");
  const [activeAction, setActiveAction] = useState<ActiveSalesAction>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 20;

  const sortedSales = useMemo(
    () => [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sales]
  );

  const todayRevenue = useMemo(() => {
    const today = new Date();
    return sortedSales
      .filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return (
          saleDate.getDate() === today.getDate() &&
          saleDate.getMonth() === today.getMonth() &&
          saleDate.getFullYear() === today.getFullYear() &&
          sale.status === "completed"
        );
      })
      .reduce((sum, sale) => sum + sale.total, 0);
  }, [sortedSales]);

  const yesterdayRevenue = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return sortedSales
      .filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return (
          saleDate.getDate() === yesterday.getDate() &&
          saleDate.getMonth() === yesterday.getMonth() &&
          saleDate.getFullYear() === yesterday.getFullYear() &&
          sale.status === "completed"
        );
      })
      .reduce((sum, sale) => sum + sale.total, 0);
  }, [sortedSales]);

  const growthPercent = useMemo(() => {
    if (yesterdayRevenue <= 0) return null;
    return ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
  }, [todayRevenue, yesterdayRevenue]);

  const filteredSales = useMemo(() => {
    return sortedSales.filter((sale) => {
      if (statusFilter !== "all" && sale.status !== statusFilter) {
        return false;
      }

      if (methodFilter === "all") {
        return true;
      }

      if (methodFilter === "split") {
        return saleIsSplitPayment(sale);
      }

      return sale.paymentMethod === methodFilter;
    });
  }, [sortedSales, statusFilter, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, methodFilter]);

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const displayedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage]);

  const pageStartIndex = filteredSales.length === 0 ? 0 : (currentPage - 1) * itemsPerPage;

  const activeSale = useMemo(() => {
    if (!detailSaleId) return null;
    return sortedSales.find((sale) => sale.id === detailSaleId) ?? null;
  }, [detailSaleId, sortedSales]);

  const actionButtonClass =
    "inline-flex h-8 items-center gap-1 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.1em]";

  const exportCsv = () => {
    const rows = [
      [
        "sale_id",
        "created_at",
        "status",
        "payment_method",
        "subtotal",
        "discount_amount",
        "redeemed_points",
        "redeemed_amount",
        "earned_points",
        "total",
        "items_count"
      ],
      ...filteredSales.map((sale) => [
        sale.id,
        sale.createdAt,
        sale.status,
        sale.paymentMethod,
        String(sale.subtotal),
        String(sale.discountAmount),
        String(sale.redeemedPoints ?? 0),
        String(sale.redeemedAmount ?? 0),
        String(sale.earnedPoints ?? 0),
        String(sale.total),
        String(sale.items.reduce((acc, item) => acc + item.qty, 0))
      ])
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sales-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const openActionDialog = (saleId: string, mode: "refund" | "void") => {
    setActiveAction({ saleId, mode });
    setActionReason("");
    setActionError("");
  };

  const closeActionDialog = () => {
    setActiveAction(null);
    setActionReason("");
    setActionError("");
  };

  const submitActionRequest = () => {
    if (!activeAction) return;

    const reason = actionReason.trim();
    if (reason.length < 5) {
      setActionError("Alasan minimal 5 karakter.");
      return;
    }

    if (activeAction.mode === "refund") {
      if (!onRequestRefund) {
        setActionError("Fitur refund belum tersedia.");
        return;
      }
      onRequestRefund(activeAction.saleId, reason);
    } else {
      if (!onRequestVoid) {
        setActionError("Fitur void belum tersedia.");
        return;
      }
      onRequestVoid(activeAction.saleId, reason);
    }

    closeActionDialog();
  };

  return (
    <div className="space-y-4 p-2 sm:space-y-5 sm:p-3 lg:space-y-6 lg:p-4">
      <header className="rounded-3xl bg-[radial-gradient(circle_at_top_left,#f5fbff_0%,#d8f2ff_45%,#bde7ff_100%)] p-5 shadow-[0_26px_60px_-36px_rgba(23,78,120,0.55)] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70 sm:text-[11px]">Terminal Revenue Lens</p>
            <h1 className="font-headline text-[1.75rem] font-extrabold leading-[1.05] text-on-surface sm:text-[2rem] lg:text-[2.25rem]">
              Riwayat Penjualan
            </h1>
            <p className="mt-1 max-w-xl text-sm text-on-surface-variant sm:text-base">
              Pantau setiap transaksi, evaluasi performa kasir, dan tindak lanjuti refund atau void dengan cepat.
            </p>
          </div>

          <div className="self-start rounded-2xl bg-white/80 px-4 py-3 text-xs text-on-surface-variant shadow-sm">
            <p className="font-semibold uppercase tracking-[0.14em]">Last Sync</p>
            <p className="mt-1 text-sm font-bold text-on-surface">{new Date().toLocaleString("id-ID")}</p>
          </div>
        </div>
      </header>

      <SalesHistoryDesktop
        statusFilter={statusFilter}
        methodFilter={methodFilter}
        onStatusFilterChange={setStatusFilter}
        onMethodFilterChange={setMethodFilter}
        onApplyFilter={() => setCurrentPage(1)}
        todayRevenue={todayRevenue}
        growthPercent={growthPercent}
        filteredSales={filteredSales}
        displayedSales={displayedSales}
        currentPage={currentPage}
        totalPages={totalPages}
        pageStartIndex={pageStartIndex}
        onPreviousPage={() => setCurrentPage((current) => Math.max(1, current - 1))}
        onNextPage={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
        onExportCsv={exportCsv}
        onOpenDetail={setDetailSaleId}
        onPrint={onPrint}
        onOpenActionDialog={openActionDialog}
      />

      <SalesHistoryMobile
        sales={sales}
        actionButtonClass={actionButtonClass}
        onOpenDetail={setDetailSaleId}
        onPrint={onPrint}
        onOpenActionDialog={openActionDialog}
      />

      <SaleDetailModal activeSale={activeSale} onClose={() => setDetailSaleId(null)} />

      <SalesActionModal
        activeAction={activeAction}
        actionReason={actionReason}
        actionError={actionError}
        onReasonChange={setActionReason}
        onClose={closeActionDialog}
        onSubmit={submitActionRequest}
      />
    </div>
  );
}
