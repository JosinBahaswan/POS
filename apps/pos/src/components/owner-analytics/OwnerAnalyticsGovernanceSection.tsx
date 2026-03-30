import type { ApprovalRules } from "../../approvals";
import type { AuditLogEntry } from "../../auditLog";
import type { ManagerSystemSettings, ManagerSystemSettingsInput } from "../../managerSettings";

type OwnerAnalyticsGovernanceSectionProps = {
  threshold: number;
  setThreshold: (value: number) => void;
  requireRefundApproval: boolean;
  setRequireRefundApproval: (value: boolean) => void;
  requireVoidApproval: boolean;
  setRequireVoidApproval: (value: boolean) => void;
  approvalRules: ApprovalRules;
  managerSettings: ManagerSystemSettings;
  managerSettingsDraft: ManagerSystemSettingsInput;
  onManagerSettingsDraftChange: (value: ManagerSystemSettingsInput) => void;
  auditLogs: AuditLogEntry[];
  onSaveRules: () => void;
  onSaveManagerSettings: () => void;
};

export function OwnerAnalyticsGovernanceSection({
  threshold,
  setThreshold,
  requireRefundApproval,
  setRequireRefundApproval,
  requireVoidApproval,
  setRequireVoidApproval,
  approvalRules,
  managerSettings,
  managerSettingsDraft,
  onManagerSettingsDraftChange,
  auditLogs,
  onSaveRules,
  onSaveManagerSettings
}: OwnerAnalyticsGovernanceSectionProps) {
  const updateManagerSettings = (patch: Partial<ManagerSystemSettingsInput>) => {
    onManagerSettingsDraftChange({
      ...managerSettingsDraft,
      ...patch
    });
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid gap-4">
        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Aturan Approval</h3>

          <div className="mt-3 grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
              Threshold Diskon Besar (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value || 0))}
              className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            />

            <label className="mt-1 flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Refund wajib approval</span>
              <input
                type="checkbox"
                checked={requireRefundApproval}
                onChange={(event) => setRequireRefundApproval(event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Void wajib approval</span>
              <input
                type="checkbox"
                checked={requireVoidApproval}
                onChange={(event) => setRequireVoidApproval(event.target.checked)}
              />
            </label>

            <button
              type="button"
              onClick={onSaveRules}
              className="mt-1 h-10 rounded-xl bg-primary text-sm font-semibold text-on-primary"
            >
              Simpan Aturan Approval
            </button>

            <p className="text-xs text-on-surface-variant">
              Terakhir diubah: {new Date(approvalRules.updatedAt).toLocaleString("id-ID")} oleh {approvalRules.updatedBy}
            </p>
          </div>
        </article>

        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Pengaturan Akses Manager</h3>

          <div className="mt-3 grid gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Visibilitas Menu</p>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Menu Produk</span>
              <input
                type="checkbox"
                checked={managerSettingsDraft.showProductsSection}
                onChange={(event) => updateManagerSettings({ showProductsSection: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Menu Laporan</span>
              <input
                type="checkbox"
                checked={managerSettingsDraft.showReportsSection}
                onChange={(event) => updateManagerSettings({ showReportsSection: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Menu Riwayat</span>
              <input
                type="checkbox"
                checked={managerSettingsDraft.showHistorySection}
                onChange={(event) => updateManagerSettings({ showHistorySection: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Menu Pelanggan</span>
              <input
                type="checkbox"
                checked={managerSettingsDraft.showCustomersSection}
                onChange={(event) => updateManagerSettings({ showCustomersSection: event.target.checked })}
              />
            </label>

            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Izin Aksi Sistem</p>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Ekspor data</span>
              <input
                type="checkbox"
                checked={managerSettingsDraft.allowDataExport}
                onChange={(event) => updateManagerSettings({ allowDataExport: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Approve/reject request</span>
              <input
                type="checkbox"
                checked={managerSettingsDraft.allowApprovalDecision}
                onChange={(event) => updateManagerSettings({ allowApprovalDecision: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Hapus produk</span>
              <input
                type="checkbox"
                checked={managerSettingsDraft.allowProductDelete}
                onChange={(event) => updateManagerSettings({ allowProductDelete: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-3 py-2 text-sm text-on-surface">
              <span>Penyesuaian stok (+/-/opname)</span>
              <input
                type="checkbox"
                checked={managerSettingsDraft.allowStockAdjustment}
                onChange={(event) => updateManagerSettings({ allowStockAdjustment: event.target.checked })}
              />
            </label>

            <button
              type="button"
              onClick={onSaveManagerSettings}
              className="mt-1 h-10 rounded-xl bg-primary text-sm font-semibold text-on-primary"
            >
              Simpan Pengaturan Manager
            </button>

            <p className="text-xs text-on-surface-variant">
              Terakhir diubah: {new Date(managerSettings.updatedAt).toLocaleString("id-ID")} oleh {managerSettings.updatedBy}
            </p>
          </div>
        </article>
      </div>

      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Audit Log Operasional</h3>
        {auditLogs.length === 0 ? (
          <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
            Belum ada audit log.
          </p>
        ) : (
          <ul className="mt-3 grid max-h-[340px] gap-2 overflow-auto pr-1">
            {auditLogs.slice(0, 40).map((log) => (
              <li key={log.id} className="rounded-xl bg-surface-container-lowest p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface">{log.action}</p>
                  <span className="text-[11px] text-on-surface-variant">{new Date(log.createdAt).toLocaleString("id-ID")}</span>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {log.actorName} ({log.actorRole}) • {log.targetType}
                  {log.targetId ? `:${log.targetId}` : ""}
                </p>
                {log.detail && <p className="mt-1 text-xs text-on-surface-variant">{log.detail}</p>}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
