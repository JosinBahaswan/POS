import { useEffect, useMemo, useState } from "react";
import type { ActiveSection, UserRole } from "../types";
import { CheckoutConfirmModal } from "./CheckoutConfirmModal";
import type { AppViewProps } from "./appViewProps";
import {
  AppSectionContent,
  DesktopAppFrame,
  MobileAppFrame,
  type DesktopNavItem,
  type MobileRoleNavItem
} from "./app-view";

export type { AppViewProps } from "./appViewProps";

type DesktopUtilityPanel = "settings" | "notifications" | "help" | null;

type DesktopUtilityAction = {
  key: string;
  label: string;
  description: string;
  icon: string;
  tone?: "default" | "danger";
  onClick: () => void;
};

type DesktopNotificationItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone: "info" | "warning" | "error" | "success";
  actionLabel?: string;
  onAction?: () => void;
};

const dedupeDesktopNavItems = (items: DesktopNavItem[], role: UserRole): DesktopNavItem[] => {
  const seenDestinations = new Set<string>();

  return items.filter((item) => {
    const destinationKey = role === "cashier"
      ? `cashier:${item.cashierHash ?? item.section ?? item.key}`
      : `section:${item.section ?? item.key}`;

    if (seenDestinations.has(destinationKey)) {
      return false;
    }

    seenDestinations.add(destinationKey);
    return true;
  });
};

const dedupeMobileNavItems = (items: MobileRoleNavItem[]): MobileRoleNavItem[] => {
  const seenSections = new Set<ActiveSection>();

  return items.filter((item) => {
    if (seenSections.has(item.section)) {
      return false;
    }

    seenSections.add(item.section);
    return true;
  });
};

export function AppView({
  authUser,
  storageScopeKey,
  role,
  activeSection,
  hasProductAccess,
  hasReportsAccess,
  hasAnalyticsAccess,
  hasOwnerAccess,
  hasCustomersAccess,
  managerSettings,
  managerCanExportData,
  managerCanResolveApproval,
  managerCanDeleteProduct,
  managerCanAdjustStock,
  mobileRoleNavItems,
  mobileRoleNavGridClass,
  isOnline,
  pendingSales,
  isSyncing,
  cartItemCount,
  total,
  cartEstimatedCost,
  cartGrossProfit,
  cartGrossMarginPercent,
  cartHasNegativeMargin,
  cartProjectedLossAmount,
  discountApprovalThreshold,
  cartMinimumMarginThreshold,
  cartBelowMinimumMarginThreshold,
  todayRevenue,
  lowStockCount,
  lowStockItems,
  outOfStockCount,
  checkoutError,
  productCatalog,
  customers,
  selectedCustomerId,
  selectedCustomerLoyaltyPoints,
  selectedCustomerMemberTier,
  selectedCustomerLoyaltyMultiplier,
  estimatedEarnedPoints,
  selectedCustomerOutstandingDebt,
  loyaltyPointValue,
  redeemedPoints,
  loyaltyRedeemAmount,
  maxRedeemablePoints,
  onSelectCustomer,
  onRedeemedPointsChange,
  heldOrders,
  pendingCartDraftSummary,
  allSales,
  cart,
  subtotal,
  discountPercent,
  manualDiscountAmount,
  autoPromotionDiscountAmount,
  appliedAutoDiscountLabels,
  discountAmount,
  paymentMethod,
  isSplitPayment,
  splitPayment,
  cashReceived,
  changeAmount,
  activeShift,
  shiftExpectedClosingCash,
  shiftCashSalesTotal,
  shiftVarianceThreshold,
  recentShiftHistory,
  shiftSessions,
  approvalRequests,
  managedUsers,
  usersLoading,
  usersError,
  approvalRules,
  auditLogs,
  showCheckoutConfirm,
  onSectionChange: onSectionChangeProp,
  onLogout,
  onAddItem,
  onDiscountChange,
  onPaymentMethodChange,
  onSplitPaymentToggle,
  onSplitPaymentAmountChange,
  onApplySplitPaymentPreset,
  onCashReceivedChange,
  onOpenShift,
  onCloseShift,
  onAddCashMovement,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
  onHoldOrder,
  onResumeOrder,
  onDiscardHoldOrder,
  onDiscardExpiredHoldOrders,
  onClearAllHoldOrders,
  onRestoreCartDraft,
  onDiscardCartDraft,
  onClear,
  onCheckout,
  onPrintReceipt,
  onRequestRefund,
  onRequestVoid,
  onUpsertProduct,
  onDeleteProduct,
  onResolveApprovalRequest,
  onUpdateApprovalRules,
  onUpdateManagerSettings,
  onRefreshManagedUsers,
  onCreateManagedUser,
  onUpdateManagedUser,
  onCreateCustomer,
  onUpdateCustomerTier,
  onSettleCustomerDebt,
  onCloseCheckoutConfirm,
  onConfirmCheckout
}: AppViewProps) {
  const [isOwnerMoreOpen, setIsOwnerMoreOpen] = useState(false);
  const [desktopCashierHash, setDesktopCashierHash] = useState<"home" | "products" | "cart" | "history">("home");
  const [desktopUtilityPanel, setDesktopUtilityPanel] = useState<DesktopUtilityPanel>(null);

  const isDesktopSettingsOpen = desktopUtilityPanel === "settings";
  const isDesktopNotificationsOpen = desktopUtilityPanel === "notifications";
  const isDesktopHelpOpen = desktopUtilityPanel === "help";

  const ownerPrimarySections: ActiveSection[] = ["analytics", "reports", "history"];
  const isOwner = role === "owner";

  const uniqueMobileRoleNavItems = useMemo(
    () => dedupeMobileNavItems(mobileRoleNavItems),
    [mobileRoleNavItems]
  );

  const primaryNavItems = isOwner
    ? uniqueMobileRoleNavItems.filter((item) => ownerPrimarySections.includes(item.section))
    : uniqueMobileRoleNavItems;

  const overflowNavItems = isOwner
    ? uniqueMobileRoleNavItems.filter((item) => !ownerPrimarySections.includes(item.section))
    : [];

  const isOverflowSectionActive = overflowNavItems.some((item) => item.section === activeSection);

  const mobileNavGridClass =
    isOwner && overflowNavItems.length > 0
      ? "mx-auto grid max-w-md grid-cols-4 gap-2"
      : mobileRoleNavGridClass;

  const handleSectionSelect = (section: ActiveSection) => {
    onSectionChangeProp(section);
    setIsOwnerMoreOpen(false);
    setDesktopUtilityPanel(null);
  };

  const canOpenSection = (section: ActiveSection) => {
    if (section === "cashier") return role === "cashier";
    if (section === "products") return hasProductAccess;
    if (section === "reports") return hasReportsAccess;
    if (section === "history") return hasReportsAccess;
    if (section === "analytics") return hasAnalyticsAccess;
    if (section === "users") return hasOwnerAccess;
    if (section === "customers") return hasCustomersAccess;
    if (section === "suppliers") return hasProductAccess;
    if (section === "promotions") return hasProductAccess;
    return false;
  };

  const openFirstAvailableSection = (sections: ActiveSection[]) => {
    const nextSection = sections.find((candidate) => canOpenSection(candidate));
    if (!nextSection) return false;
    handleSectionSelect(nextSection);
    return true;
  };

  const navigateCashierHash = (hash: "home" | "products" | "cart" | "history") => {
    handleSectionSelect("cashier");
    window.location.hash = hash;
    setDesktopCashierHash(hash);
  };

  const closeDesktopUtilityPanel = () => {
    setDesktopUtilityPanel(null);
  };

  useEffect(() => {
    if (role !== "cashier") return;

    const syncHash = () => {
      const rawHash = window.location.hash.replace("#", "");
      if (rawHash === "products" || rawHash === "cart" || rawHash === "history") {
        setDesktopCashierHash(rawHash);
        return;
      }
      setDesktopCashierHash("home");
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, [role]);

  const desktopNavItems = useMemo<DesktopNavItem[]>(() => {
    const rawItems: DesktopNavItem[] = [];

    if (role === "cashier") {
      rawItems.push(
        { key: "register", label: "Register", icon: "point_of_sale", section: "cashier", cashierHash: "home" },
        { key: "history", label: "History", icon: "receipt_long", section: "cashier", cashierHash: "history" },
        { key: "catalog", label: "Catalog", icon: "inventory_2", section: "cashier", cashierHash: "products" },
        { key: "cart", label: "Cart", icon: "shopping_cart", section: "cashier", cashierHash: "cart" }
      );

      return dedupeDesktopNavItems(rawItems, role);
    }

    if (role === "owner") {
      if (hasAnalyticsAccess) {
        rawItems.push({ key: "command", label: "Owner Dashboard", icon: "analytics", section: "analytics" });
      }
      if (hasReportsAccess) {
        rawItems.push({ key: "overview", label: "Laporan", icon: "dashboard", section: "reports" });
      }
      if (hasReportsAccess) {
        rawItems.push({ key: "transactions", label: "Transactions", icon: "receipt_long", section: "history" });
      }
      if (hasProductAccess) {
        rawItems.push({ key: "catalog", label: "Catalog", icon: "inventory_2", section: "products" });
        rawItems.push({ key: "operations", label: "Operasional", icon: "factory", section: "suppliers" });
        rawItems.push({ key: "promotions", label: "Promo", icon: "campaign", section: "promotions" });
      }
      if (hasOwnerAccess) {
        rawItems.push({ key: "team", label: "Team", icon: "groups", section: "users" });
      }
      if (hasCustomersAccess) {
        rawItems.push({ key: "customers", label: "Customers", icon: "group", section: "customers" });
      }

      return dedupeDesktopNavItems(rawItems, role);
    }

    if (hasReportsAccess) {
      rawItems.push({ key: "dashboard", label: "Dashboard", icon: "dashboard", section: "reports" });
      rawItems.push({ key: "history", label: "History", icon: "receipt_long", section: "history" });
    }
    if (hasProductAccess) {
      rawItems.push({ key: "catalog", label: "Catalog", icon: "inventory_2", section: "products" });
      rawItems.push({ key: "operations", label: "Operasional", icon: "factory", section: "suppliers" });
      rawItems.push({ key: "promotions", label: "Promo", icon: "campaign", section: "promotions" });
    }
    if (hasCustomersAccess) {
      rawItems.push({ key: "customers", label: "Customers", icon: "group", section: "customers" });
    }

    return dedupeDesktopNavItems(rawItems, role);
  }, [
    role,
    hasAnalyticsAccess,
    hasReportsAccess,
    hasProductAccess,
    hasOwnerAccess,
    hasCustomersAccess
  ]);

  const desktopSectionTitle = useMemo(() => {
    if (role === "cashier") {
      if (desktopCashierHash === "history") return "Transaction History";
      if (desktopCashierHash === "products") return "Product Catalog";
      if (desktopCashierHash === "cart") return "Current Checkout";
      return "Cashier Portal";
    }

    if (activeSection === "reports") return role === "owner" ? "Owner Performance View" : "Executive Summary";
    if (activeSection === "history") return "Transaction History";
    if (activeSection === "products") return "Product Catalog Management";
    if (activeSection === "analytics") return "Owner Command Center";
    if (activeSection === "users") return "Team Management";
    if (activeSection === "customers") return "Customer Workspace";
    if (activeSection === "suppliers") return "Operational Workspace";
    if (activeSection === "promotions") return "Promotion & Bundle Workspace";
    return "Merchant Pro";
  }, [role, activeSection, desktopCashierHash]);

  const handleDesktopNavClick = (item: DesktopNavItem) => {
    if (item.section) {
      handleSectionSelect(item.section);
    }

    if (role === "cashier" && item.cashierHash) {
      window.location.hash = item.cashierHash;
      setDesktopCashierHash(item.cashierHash);
    }
  };

  const isDesktopNavActive = (item: DesktopNavItem) => {
    if (role === "cashier") {
      return item.cashierHash === desktopCashierHash;
    }
    return item.section === activeSection;
  };

  const handleDesktopSettingsClick = () => {
    setDesktopUtilityPanel((current) => (current === "settings" ? null : "settings"));
  };

  const handleDesktopNotificationsClick = () => {
    setDesktopUtilityPanel((current) => (current === "notifications" ? null : "notifications"));
  };

  const handleDesktopHelpClick = () => {
    setDesktopUtilityPanel((current) => (current === "help" ? null : "help"));
  };

  const openDashboardWorkspace = () => {
    if (role === "cashier") {
      navigateCashierHash("home");
      return;
    }

    if (role === "owner") {
      openFirstAvailableSection(["analytics", "reports", "history", "products", "suppliers", "promotions", "customers", "users"]);
      return;
    }

    openFirstAvailableSection(["reports", "history", "products", "suppliers", "promotions", "customers"]);
  };

  const openHistoryWorkspace = () => {
    if (role === "cashier") {
      navigateCashierHash("history");
      return;
    }
    openFirstAvailableSection(["history", "reports", "analytics", "products", "suppliers", "promotions", "customers"]);
  };

  const openCatalogWorkspace = () => {
    if (role === "cashier") {
      navigateCashierHash("products");
      return;
    }
    openFirstAvailableSection(["products", "suppliers", "promotions", "reports", "history", "analytics", "customers"]);
  };

  const openCheckoutWorkspace = () => {
    if (role === "cashier") {
      navigateCashierHash("cart");
      return;
    }
    openFirstAvailableSection(["reports", "history", "products", "suppliers", "promotions", "customers"]);
  };

  const openTeamWorkspace = () => {
    if (role === "owner") {
      openFirstAvailableSection(["users", "customers", "analytics", "reports"]);
      return;
    }
    openFirstAvailableSection(["customers", "reports", "history"]);
  };

  const runUtilityAction = (callback: () => void) => {
    callback();
    closeDesktopUtilityPanel();
  };

  const pendingApprovalCount = approvalRequests.reduce((count, request) => {
    if (request.status === "pending") {
      return count + 1;
    }
    return count;
  }, 0);

  const desktopNotifications: DesktopNotificationItem[] = [];

  if (!isOnline) {
    desktopNotifications.push({
      id: "offline",
      title: "Perangkat Sedang Offline",
      description: "Transaksi tetap disimpan lokal. Sinkronisasi akan berjalan saat koneksi kembali.",
      icon: "wifi_off",
      tone: "warning",
      actionLabel: "Lihat Riwayat",
      onAction: () => runUtilityAction(openHistoryWorkspace)
    });
  }

  if (pendingSales > 0) {
    desktopNotifications.push({
      id: "pending-sales",
      title: `${pendingSales} transaksi menunggu sinkronisasi`,
      description: "Periksa transaksi tertunda agar data pusat tetap konsisten.",
      icon: "sync_problem",
      tone: "warning",
      actionLabel: "Buka Riwayat",
      onAction: () => runUtilityAction(openHistoryWorkspace)
    });
  }

  if (checkoutError.trim().length > 0) {
    desktopNotifications.push({
      id: "checkout-error",
      title: "Checkout terakhir gagal diproses",
      description: checkoutError,
      icon: "error",
      tone: "error",
      actionLabel: role === "cashier" ? "Lanjutkan Checkout" : "Lihat Operasional",
      onAction: () => runUtilityAction(openCheckoutWorkspace)
    });
  }

  if (isSyncing) {
    desktopNotifications.push({
      id: "syncing",
      title: "Sinkronisasi sedang berjalan",
      description: "Sistem sedang mengirim data terbaru ke cloud.",
      icon: "sync",
      tone: "info"
    });
  }

  if (lowStockItems.length > 0 && role !== "cashier") {
    desktopNotifications.push({
      id: "low-stock",
      title: `${lowStockItems.length} produk hampir habis`,
      description: "Lakukan restock untuk mencegah gangguan penjualan di kasir.",
      icon: "inventory",
      tone: "warning",
      actionLabel: "Kelola Katalog",
      onAction: () => runUtilityAction(openCatalogWorkspace)
    });
  }

  if (pendingApprovalCount > 0 && role !== "cashier") {
    desktopNotifications.push({
      id: "approvals",
      title: `${pendingApprovalCount} approval menunggu keputusan`,
      description: "Review permintaan refund, void, atau perubahan data sensitif.",
      icon: "approval_delegation",
      tone: "info",
      actionLabel: "Buka Dashboard",
      onAction: () => runUtilityAction(openDashboardWorkspace)
    });
  }

  if (desktopNotifications.length === 0) {
    desktopNotifications.push({
      id: "all-clear",
      title: "Semua notifikasi sudah bersih",
      description: "Tidak ada peringatan penting untuk saat ini.",
      icon: "task_alt",
      tone: "success"
    });
  }

  const notificationCount = desktopNotifications.filter(
    (item) => item.onAction || item.tone === "warning" || item.tone === "error"
  ).length;

  const desktopSettingsActions: DesktopUtilityAction[] = role === "cashier"
    ? [
        {
          key: "settings-cashier-home",
          label: "Ringkasan Register",
          description: "Kembali ke layar utama kasir dan status shift aktif.",
          icon: "point_of_sale",
          onClick: () => runUtilityAction(openDashboardWorkspace)
        },
        {
          key: "settings-cashier-history",
          label: "Riwayat Sinkronisasi",
          description: "Pantau transaksi offline dan status pengiriman data.",
          icon: "history",
          onClick: () => runUtilityAction(openHistoryWorkspace)
        },
        {
          key: "settings-logout",
          label: "Keluar dari Aplikasi",
          description: "Akhiri sesi akun saat ini dengan aman.",
          icon: "logout",
          tone: "danger",
          onClick: () => runUtilityAction(onLogout)
        }
      ]
    : role === "owner"
      ? [
          {
            key: "settings-owner-command",
            label: "Owner Command Center",
            description: "Lihat performa outlet dan status operasional lintas tim.",
            icon: "dashboard",
            onClick: () => runUtilityAction(openDashboardWorkspace)
          },
          {
            key: "settings-owner-governance",
            label: "Aturan Governance",
            description: "Kelola aturan approval dan kebijakan akses manager.",
            icon: "policy",
            onClick: () => runUtilityAction(() => openFirstAvailableSection(["analytics", "reports", "history"]))
          },
          {
            key: "settings-owner-team",
            label: "Manajemen Tim",
            description: "Atur akun owner, manager, cashier, dan data pelanggan.",
            icon: "groups",
            onClick: () => runUtilityAction(openTeamWorkspace)
          },
          {
            key: "settings-logout",
            label: "Keluar dari Aplikasi",
            description: "Akhiri sesi akun saat ini dengan aman.",
            icon: "logout",
            tone: "danger",
            onClick: () => runUtilityAction(onLogout)
          }
        ]
      : [
          {
            key: "settings-manager-dashboard",
            label: "Dashboard Operasional",
            description: "Pantau KPI harian, shift, dan progres approval cabang.",
            icon: "dashboard",
            onClick: () => runUtilityAction(openDashboardWorkspace)
          },
          {
            key: "settings-manager-products",
            label: "Pengelolaan Produk",
            description: "Masuk ke katalog untuk update harga, stok, dan visibilitas.",
            icon: "inventory_2",
            onClick: () => runUtilityAction(openCatalogWorkspace)
          },
          {
            key: "settings-manager-customers",
            label: "Workspace Pelanggan",
            description: "Lihat basis pelanggan dan aktivitas transaksi terbaru.",
            icon: "group",
            onClick: () => runUtilityAction(openTeamWorkspace)
          },
          {
            key: "settings-logout",
            label: "Keluar dari Aplikasi",
            description: "Akhiri sesi akun saat ini dengan aman.",
            icon: "logout",
            tone: "danger",
            onClick: () => runUtilityAction(onLogout)
          }
        ];

  const desktopHelpActions: DesktopUtilityAction[] = role === "cashier"
    ? [
        {
          key: "help-cashier-cart",
          label: "Buka Keranjang",
          description: "Lanjutkan checkout aktif dan validasi pembayaran.",
          icon: "shopping_cart",
          onClick: () => runUtilityAction(() => navigateCashierHash("cart"))
        },
        {
          key: "help-cashier-products",
          label: "Cari Produk",
          description: "Akses katalog produk untuk transaksi berikutnya.",
          icon: "inventory_2",
          onClick: () => runUtilityAction(() => navigateCashierHash("products"))
        },
        {
          key: "help-cashier-history",
          label: "Lihat Riwayat",
          description: "Pantau transaksi yang sudah tercatat.",
          icon: "receipt_long",
          onClick: () => runUtilityAction(() => navigateCashierHash("history"))
        }
      ]
    : role === "owner"
      ? [
          {
            key: "help-owner-analytics",
            label: "Buka Governance",
            description: "Kelola aturan approval dan hak akses manager.",
            icon: "policy",
            onClick: () => runUtilityAction(() => openFirstAvailableSection(["analytics", "reports", "history"]))
          },
          {
            key: "help-owner-users",
            label: "Kelola Tim",
            description: "Atur user owner, manager, dan cashier.",
            icon: "groups",
            onClick: () => runUtilityAction(() => openFirstAvailableSection(["users", "customers"]))
          },
          {
            key: "help-owner-reports",
            label: "Ringkasan Operasional",
            description: "Buka laporan periodik outlet.",
            icon: "insights",
            onClick: () => runUtilityAction(() => openFirstAvailableSection(["reports", "history"]))
          }
        ]
      : [
          {
            key: "help-manager-reports",
            label: "Buka Dashboard",
            description: "Pantau KPI, shift, dan approval operasional.",
            icon: "dashboard",
            onClick: () => runUtilityAction(() => openFirstAvailableSection(["reports", "history"]))
          },
          {
            key: "help-manager-products",
            label: "Kelola Stok",
            description: "Masuk ke katalog untuk restock dan update produk.",
            icon: "inventory_2",
            onClick: () => runUtilityAction(() => openFirstAvailableSection(["products"]))
          },
          {
            key: "help-manager-customers",
            label: "Workspace Pelanggan",
            description: "Akses data pelanggan dan aktivitasnya.",
            icon: "group",
            onClick: () => runUtilityAction(() => openFirstAvailableSection(["customers", "reports"]))
          }
        ];

  const desktopUtilityActions = isDesktopSettingsOpen ? desktopSettingsActions : desktopHelpActions;

  const desktopUtilityPanelHeading = isDesktopNotificationsOpen
    ? {
        eyebrow: "Notifikasi",
        title: "Pusat Notifikasi",
        subtitle: "Pantau sinkronisasi, stok, approval, dan isu checkout terbaru."
      }
    : isDesktopSettingsOpen
      ? {
          eyebrow: "Settings",
          title: "Kontrol Workspace",
          subtitle: "Atur alur kerja cepat sesuai peran yang sedang aktif."
        }
      : {
          eyebrow: "Quick Help",
          title: "Aksi Cepat Terminal",
          subtitle: "Shortcut operasional untuk berpindah ke area yang paling sering dipakai."
        };

  const sectionContentProps = {
    storageScopeKey,
    role,
    activeSection,
    hasProductAccess,
    hasReportsAccess,
    hasAnalyticsAccess,
    hasOwnerAccess,
    hasCustomersAccess,
    managerSettings,
    managerCanExportData,
    managerCanResolveApproval,
    managerCanDeleteProduct,
    managerCanAdjustStock,
    productCatalog,
    customers,
    selectedCustomerId,
    selectedCustomerLoyaltyPoints,
    selectedCustomerMemberTier,
    selectedCustomerLoyaltyMultiplier,
    estimatedEarnedPoints,
    selectedCustomerOutstandingDebt,
    loyaltyPointValue,
    redeemedPoints,
    loyaltyRedeemAmount,
    maxRedeemablePoints,
    onSelectCustomer,
    onRedeemedPointsChange,
    heldOrders,
    pendingCartDraftSummary,
    allSales,
    cart,
    subtotal,
    discountPercent,
    manualDiscountAmount,
    autoPromotionDiscountAmount,
    appliedAutoDiscountLabels,
    discountAmount,
    total,
    paymentMethod,
    isSplitPayment,
    splitPayment,
    cashReceived,
    changeAmount,
    activeShift,
    shiftExpectedClosingCash,
    shiftCashSalesTotal,
    shiftVarianceThreshold,
    recentShiftHistory,
    shiftSessions,
    approvalRequests,
    managedUsers,
    usersLoading,
    usersError,
    approvalRules,
    auditLogs,
    isSyncing,
    onAddItem,
    cartEstimatedCost,
    cartGrossProfit,
    cartGrossMarginPercent,
    cartHasNegativeMargin,
    cartProjectedLossAmount,
    discountApprovalThreshold,
    cartMinimumMarginThreshold,
    cartBelowMinimumMarginThreshold,
    onDiscountChange,
    onPaymentMethodChange,
    onSplitPaymentToggle,
    onSplitPaymentAmountChange,
    onApplySplitPaymentPreset,
    onCashReceivedChange,
    onOpenShift,
    onCloseShift,
    onAddCashMovement,
    onIncreaseQty,
    onDecreaseQty,
    onRemoveItem,
    onHoldOrder,
    onResumeOrder,
    onDiscardHoldOrder,
    onDiscardExpiredHoldOrders,
    onClearAllHoldOrders,
    onRestoreCartDraft,
    onDiscardCartDraft,
    onClear,
    onCheckout,
    onPrintReceipt,
    onRequestRefund,
    onRequestVoid,
    onUpsertProduct,
    onDeleteProduct,
    onResolveApprovalRequest,
    onUpdateApprovalRules,
    onUpdateManagerSettings,
    onRefreshManagedUsers,
    onCreateManagedUser,
    onUpdateManagedUser,
    onCreateCustomer,
    onUpdateCustomerTier,
    onSettleCustomerDebt
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileAppFrame
        isOnline={isOnline}
        pendingSales={pendingSales}
        isSyncing={isSyncing}
        cartItemCount={cartItemCount}
        total={total}
        todayRevenue={todayRevenue}
        lowStockCount={lowStockCount}
        lowStockItems={lowStockItems}
        outOfStockCount={outOfStockCount}
        checkoutError={checkoutError}
        role={role}
        activeSection={activeSection}
        authUser={authUser}
        hasOwnerAccess={hasOwnerAccess}
        primaryNavItems={primaryNavItems}
        overflowNavItems={overflowNavItems}
        mobileNavGridClass={mobileNavGridClass}
        isOwnerMoreOpen={isOwnerMoreOpen}
        isOverflowSectionActive={isOverflowSectionActive}
        onToggleOwnerMore={() => setIsOwnerMoreOpen((current) => !current)}
        onSectionSelect={handleSectionSelect}
        onLogout={onLogout}
      >
        <AppSectionContent layout="mobile" {...sectionContentProps} />
      </MobileAppFrame>

      <DesktopAppFrame
        role={role}
        authUser={authUser}
        desktopNavItems={desktopNavItems}
        desktopSectionTitle={desktopSectionTitle}
        checkoutError={checkoutError}
        onDesktopNavClick={handleDesktopNavClick}
        isDesktopNavActive={isDesktopNavActive}
        onNewSale={() => {
          window.location.hash = "cart";
          setDesktopCashierHash("cart");
        }}
        onSettingsClick={handleDesktopSettingsClick}
        onNotificationsClick={handleDesktopNotificationsClick}
        onHelpClick={handleDesktopHelpClick}
        notificationCount={notificationCount}
        isSettingsOpen={isDesktopSettingsOpen}
        isNotificationsOpen={isDesktopNotificationsOpen}
        isHelpOpen={isDesktopHelpOpen}
        onLogout={onLogout}
      >
        <AppSectionContent layout="desktop" {...sectionContentProps} />
      </DesktopAppFrame>

      {desktopUtilityPanel && (
        <div className="hidden lg:block">
          <button
            type="button"
            className="fixed inset-0 z-[70] cursor-default bg-slate-950/35"
            aria-label="Tutup panel utilitas"
            onClick={closeDesktopUtilityPanel}
          />
          <aside className="fixed right-6 top-20 z-[71] w-[min(92vw,24rem)] rounded-2xl border border-outline-variant/30 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  {desktopUtilityPanelHeading.eyebrow}
                </p>
                <h2 className="font-headline text-xl font-extrabold text-on-surface">{desktopUtilityPanelHeading.title}</h2>
                <p className="mt-1 text-xs text-on-surface-variant">{desktopUtilityPanelHeading.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={closeDesktopUtilityPanel}
                className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant transition hover:bg-slate-200/70"
                aria-label="Tutup panel utilitas"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {isDesktopNotificationsOpen ? (
              <div className="grid gap-2">
                {desktopNotifications.map((notification) => {
                  const cardToneClass = notification.tone === "error"
                    ? "border-error/30 bg-error-container/35"
                    : notification.tone === "warning"
                      ? "border-amber-200 bg-amber-50/95"
                      : notification.tone === "success"
                        ? "border-emerald-200 bg-emerald-50/95"
                        : "border-outline-variant/35 bg-surface-container-low";

                  const iconToneClass = notification.tone === "error"
                    ? "bg-error/15 text-error"
                    : notification.tone === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : notification.tone === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-primary/10 text-primary";

                  const actionToneClass = notification.tone === "error"
                    ? "bg-error/10 text-error hover:bg-error/20"
                    : notification.tone === "warning"
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      : notification.tone === "success"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-primary/10 text-primary hover:bg-primary/15";

                  return (
                    <article
                      key={notification.id}
                      className={`rounded-xl border px-3 py-3 ${cardToneClass}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${iconToneClass}`}>
                          <span className="material-symbols-outlined text-[18px]">{notification.icon}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-on-surface">{notification.title}</span>
                          <span className="mt-0.5 block text-xs text-on-surface-variant">{notification.description}</span>
                        </span>
                      </div>
                      {notification.actionLabel && notification.onAction ? (
                        <button
                          type="button"
                          onClick={notification.onAction}
                          className={`mt-3 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${actionToneClass}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          <span>{notification.actionLabel}</span>
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <>
                {isDesktopSettingsOpen ? (
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-surface-container-low px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-on-surface-variant">Jaringan</p>
                      <p className={`text-xs font-semibold ${isOnline ? "text-emerald-700" : "text-amber-700"}`}>
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-on-surface-variant">Sinkronisasi</p>
                      <p className={`text-xs font-semibold ${isSyncing ? "text-primary" : "text-on-surface"}`}>
                        {isSyncing ? "Berjalan" : "Standby"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-on-surface-variant">Pending</p>
                      <p className="text-xs font-semibold text-on-surface">{pendingSales}</p>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-2">
                  {desktopUtilityActions.map((action) => {
                    const isDangerAction = action.tone === "danger";
                    return (
                      <button
                        key={action.key}
                        type="button"
                        onClick={action.onClick}
                        className={`flex items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                          isDangerAction
                            ? "bg-error-container/45 hover:bg-error-container/70"
                            : "bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                            isDangerAction ? "bg-error/15 text-error" : "bg-primary/10 text-primary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-on-surface">{action.label}</span>
                          <span className="mt-0.5 block text-xs text-on-surface-variant">{action.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      <CheckoutConfirmModal
        open={showCheckoutConfirm}
        itemCount={cart.reduce((acc, item) => acc + item.qty, 0)}
        subtotal={subtotal}
        total={total}
        manualDiscountAmount={manualDiscountAmount}
        autoPromotionDiscountAmount={autoPromotionDiscountAmount}
        appliedAutoDiscountLabels={appliedAutoDiscountLabels}
        paymentMethod={paymentMethod}
        isSplitPayment={isSplitPayment}
        paymentBreakdown={isSplitPayment ? splitPayment : undefined}
        loyaltyPreview={selectedCustomerId
          ? {
              tier: selectedCustomerMemberTier || "Silver",
              earnedPoints: estimatedEarnedPoints,
              redeemedPoints,
              redeemedAmount: loyaltyRedeemAmount
            }
          : null}
        loading={isSyncing}
        onClose={onCloseCheckoutConfirm}
        onConfirm={onConfirmCheckout}
      />
    </div>
  );
}
