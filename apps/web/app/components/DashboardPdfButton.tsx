"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardSummary } from "@/lib/dashboard";

type DashboardPdfButtonProps = {
  summary: DashboardSummary | null;
  tenantId?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);

const formatDateTime = (value: string | null) => {
  if (!value) return "Belum ada transaksi";
  return new Date(value).toLocaleString("id-ID");
};

const normalizeSubscription = (status: string) => {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export function DashboardPdfButton({ summary, tenantId }: DashboardPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = () => {
    if (!summary || !tenantId || isExporting) return;

    setIsExporting(true);

    try {
      const generatedAt = new Date();
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 76, 92);
      doc.rect(0, 0, pageWidth, 128, "F");
      doc.setFillColor(20, 111, 138);
      doc.rect(0, 96, pageWidth, 32, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Laporan Dashboard POS", 40, 54);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Tenant: ${tenantId}`, 40, 76);
      doc.text(`Dibuat: ${generatedAt.toLocaleString("id-ID")}`, 40, 94);

      const cardY = 154;
      const cardGap = 16;
      const cardWidth = (pageWidth - 80 - cardGap) / 2;
      const cardHeight = 86;

      const drawCard = (
        x: number,
        y: number,
        title: string,
        value: string,
        accent: [number, number, number]
      ) => {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, cardWidth, cardHeight, 10, 10, "F");
        doc.setFillColor(accent[0], accent[1], accent[2]);
        doc.roundedRect(x, y, 6, cardHeight, 6, 6, "F");

        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(title, x + 16, y + 24);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.text(value, x + 16, y + 54, { maxWidth: cardWidth - 24 });
      };

      drawCard(40, cardY, "Omzet Hari Ini", formatCurrency(summary.todayRevenue), [20, 184, 166]);
      drawCard(40 + cardWidth + cardGap, cardY, "Jumlah Transaksi", String(summary.todayTransactions), [59, 130, 246]);
      drawCard(40, cardY + cardHeight + cardGap, "Status Subscription", normalizeSubscription(summary.subscriptionStatus), [14, 165, 233]);
      drawCard(40 + cardWidth + cardGap, cardY + cardHeight + cardGap, "Pending Sync", String(summary.pendingSync), [245, 158, 11]);

      autoTable(doc, {
        startY: cardY + cardHeight * 2 + cardGap + 28,
        margin: { left: 40, right: 40 },
        head: [["Ringkasan", "Nilai"]],
        body: [
          ["ID Tenant", summary.tenantId],
          ["Omzet Hari Ini", formatCurrency(summary.todayRevenue)],
          ["Jumlah Transaksi Hari Ini", String(summary.todayTransactions)],
          ["Pending Sinkronisasi", String(summary.pendingSync)],
          ["Status Subscription", normalizeSubscription(summary.subscriptionStatus)],
          ["Transaksi Terakhir", formatDateTime(summary.lastTransactionAt)]
        ],
        styles: {
          fontSize: 10,
          textColor: [30, 41, 59],
          cellPadding: 8,
          lineColor: [226, 232, 240],
          lineWidth: 0.6
        },
        headStyles: {
          fillColor: [15, 76, 92],
          textColor: [255, 255, 255],
          fontStyle: "bold"
        },
        columnStyles: {
          0: {
            fontStyle: "bold",
            fillColor: [241, 245, 249]
          }
        },
        alternateRowStyles: {
          fillColor: [250, 252, 255]
        }
      });

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Dokumen ini dibuat otomatis oleh POS SaaS Control Center.", 40, 805);

      doc.save(`laporan-dashboard-${tenantId}-${generatedAt.toISOString().slice(0, 10)}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownloadPdf}
      disabled={!summary || !tenantId || isExporting}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isExporting ? "Mempersiapkan PDF..." : "Download Laporan PDF"}
    </button>
  );
}
