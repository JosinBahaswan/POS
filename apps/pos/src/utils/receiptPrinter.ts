import type { LocalSale } from "../database";

type PrintSaleReceiptInput = {
  sale: LocalSale;
  cashierName?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildItemRows = (sale: LocalSale) =>
  sale.items
    .map((item) => {
      const itemSubtotal = item.price * item.qty;
      return `
        <tr>
          <td class="item-name">${escapeHtml(item.name)}</td>
          <td class="item-qty">${item.qty}x</td>
          <td class="item-total">Rp ${itemSubtotal.toLocaleString("id-ID")}</td>
        </tr>
        <tr class="item-price-row">
          <td colspan="3">@ Rp ${item.price.toLocaleString("id-ID")}</td>
        </tr>
      `;
    })
    .join("");

const buildSplitPaymentRows = (sale: LocalSale, isSplit: boolean) => {
  if (!isSplit || !sale.paymentBreakdown) return "";

  return `
    <div class="kv-row split"><span>Tunai</span><strong>Rp ${sale.paymentBreakdown.cash.toLocaleString("id-ID")}</strong></div>
    <div class="kv-row split"><span>Kartu</span><strong>Rp ${sale.paymentBreakdown.card.toLocaleString("id-ID")}</strong></div>
    <div class="kv-row split"><span>QRIS</span><strong>Rp ${sale.paymentBreakdown.qris.toLocaleString("id-ID")}</strong></div>
  `;
};

const buildReceiptHtml = (input: {
  sale: LocalSale;
  cashierName?: string;
  printedAt: Date;
  completedAt: Date;
  paymentLabel: string;
  splitPaymentRows: string;
  itemRows: string;
}) => {
  const {
    sale,
    cashierName,
    printedAt,
    completedAt,
    paymentLabel,
    splitPaymentRows,
    itemRows
  } = input;
  const loyaltyDiscountRow =
    sale.redeemedAmount !== undefined && sale.redeemedAmount > 0
      ? `<div class="kv-row"><span>Loyalty${sale.redeemedPoints ? ` (${sale.redeemedPoints.toLocaleString("id-ID")} poin)` : ""}</span><strong>- Rp ${Math.round(sale.redeemedAmount).toLocaleString("id-ID")}</strong></div>`
      : "";
  const loyaltyEarnedRow =
    sale.earnedPoints !== undefined && sale.earnedPoints > 0
      ? `<div class="kv-row"><span>Poin Dapat</span><strong>+${sale.earnedPoints.toLocaleString("id-ID")}</strong></div>`
      : "";

  return `
    <html>
      <head>
        <title>Struk ${sale.id}</title>
        <meta charset="utf-8" />
        <style>
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 14px;
            font-family: "Consolas", "Courier New", monospace;
            color: #0f172a;
            background: #ffffff;
          }

          .receipt {
            width: min(100%, 82mm);
            margin: 0 auto;
            border: 1px dashed #cbd5e1;
            border-radius: 12px;
            padding: 12px;
          }

          .center {
            text-align: center;
          }

          .brand {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .subtitle {
            margin: 4px 0 0;
            font-size: 11px;
            color: #475569;
          }

          .meta {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #94a3b8;
          }

          .kv-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            font-size: 11px;
            margin: 2px 0;
          }

          .kv-row strong {
            font-weight: 700;
          }

          .split {
            color: #1e293b;
          }

          .items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
          }

          .items th {
            padding: 6px 0;
            border-top: 1px dashed #94a3b8;
            border-bottom: 1px dashed #94a3b8;
            text-align: left;
            font-size: 11px;
          }

          .items th:last-child,
          .items td:last-child {
            text-align: right;
          }

          .items td {
            padding: 5px 0;
            vertical-align: top;
          }

          .item-name {
            width: 58%;
            padding-right: 6px;
            word-break: break-word;
          }

          .item-qty {
            width: 12%;
            text-align: center;
          }

          .item-total {
            width: 30%;
          }

          .item-price-row td {
            padding: 0 0 4px;
            color: #64748b;
            font-size: 10px;
          }

          .totals {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #94a3b8;
          }

          .totals .grand {
            margin-top: 4px;
            padding-top: 6px;
            border-top: 1px dashed #cbd5e1;
            font-size: 12px;
          }

          .footer {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #94a3b8;
            text-align: center;
            font-size: 10px;
            color: #475569;
            line-height: 1.4;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }

            .receipt {
              width: 100%;
              border: 0;
              border-radius: 0;
              padding: 8mm 6mm;
            }
          }
        </style>
      </head>
      <body>
        <main class="receipt">
          <header class="center">
            <h1 class="brand">POS Terminal</h1>
            <p class="subtitle">Terima kasih sudah berbelanja</p>
          </header>

          <section class="meta">
            <div class="kv-row"><span>No. Struk</span><strong>${sale.id}</strong></div>
            <div class="kv-row"><span>Tanggal</span><strong>${completedAt.toLocaleDateString("id-ID")}</strong></div>
            <div class="kv-row"><span>Jam</span><strong>${completedAt.toLocaleTimeString("id-ID")}</strong></div>
            <div class="kv-row"><span>Kasir</span><strong>${escapeHtml(cashierName || "-")}</strong></div>
            <div class="kv-row"><span>Outlet</span><strong>${escapeHtml(sale.outletId ?? "MAIN")}</strong></div>
            <div class="kv-row"><span>Shift</span><strong>${escapeHtml(sale.shiftId ?? "-")}</strong></div>
          </section>

          <table class="items">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <section class="totals">
            <div class="kv-row"><span>Subtotal</span><strong>Rp ${sale.subtotal.toLocaleString("id-ID")}</strong></div>
            <div class="kv-row"><span>Diskon</span><strong>- Rp ${sale.discountAmount.toLocaleString("id-ID")}</strong></div>
            ${loyaltyDiscountRow}
            <div class="kv-row grand"><span>Total Bayar</span><strong>Rp ${sale.total.toLocaleString("id-ID")}</strong></div>
          </section>

          <section class="meta">
            <div class="kv-row"><span>Metode</span><strong>${paymentLabel}</strong></div>
            ${splitPaymentRows}
            <div class="kv-row"><span>Status</span><strong>${sale.status.toUpperCase()}</strong></div>
            ${loyaltyEarnedRow}
          </section>

          <footer class="footer">
            <div>Printed: ${printedAt.toLocaleString("id-ID")}</div>
            <div>Simpan struk ini sebagai bukti pembayaran</div>
          </footer>
        </main>
      </body>
    </html>
  `;
};

export function printSaleReceipt({ sale, cashierName }: PrintSaleReceiptInput) {
  const printedAt = new Date();
  const completedAt = new Date(sale.createdAt);
  const splitParts = sale.paymentBreakdown
    ? [sale.paymentBreakdown.cash, sale.paymentBreakdown.card, sale.paymentBreakdown.qris].filter((part) => part > 0)
    : [];
  const isSplit = splitParts.length > 1;
  const paymentLabel = isSplit ? "SPLIT" : sale.paymentMethod.toUpperCase();

  const popup = window.open("", "_blank", "width=360,height=600");
  if (!popup) return;

  const receiptHtml = buildReceiptHtml({
    sale,
    cashierName,
    printedAt,
    completedAt,
    paymentLabel,
    splitPaymentRows: buildSplitPaymentRows(sale, isSplit),
    itemRows: buildItemRows(sale)
  });

  popup.document.write(receiptHtml);
  popup.document.close();
  popup.focus();
  popup.print();
}
