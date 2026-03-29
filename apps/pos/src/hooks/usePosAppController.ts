import { useEffect, useMemo, useState } from "react";
import { products } from "../localData";
import {
  applyStockDeduction,
  applyStockReturn,
  readLocalSales,
  readProducts,
  readSaleById,
  saveLocalSale,
  saveProducts,
  updateLocalSaleStatus
} from "../database";
import { syncPendingSales } from "../sync";
import { env } from "../config";
import type { HeldOrder } from "../components/HoldOrdersBar";
import type { ProductItem } from "../localData";
import type {
  ActiveSection,
  CartItem,
  PaymentBreakdown,
  PaymentMethod,
  UserRole
} from "../types";
import {
  allowedSectionsByRole,
  defaultSectionByRole,
  emptyPaymentBreakdown,
  getMobileRoleNavGridClass,
  mobileRoleNavByRole
} from "../appConfig";
import {
  addCashMovement,
  closeShift,
  getActiveShift,
  openShift,
  readShiftSessions,
  type CashMovementType,
  type ShiftSession
} from "../shift";
import {
  createApprovalRequest,
  findApprovalRequestById,
  readApprovalRequests,
  readApprovalRules,
  resolveApprovalRequest,
  saveApprovalRules,
  type ApprovalDecision,
  type ApprovalRequest,
  type ApprovalRules
} from "../approvals";
import { appendAuditLog, readAuditLogs, type AuditLogEntry } from "../auditLog";
import { getCurrentAuthUser, signOutUser, type AuthenticatedUser } from "../auth";
import { useManagedUsers } from "./useManagedUsers";
import { printSaleReceipt } from "../utils/receiptPrinter";
import type { AppViewProps } from "../components/AppView";

type UsePosAppControllerResult = {
  authReady: boolean;
  authUser: AuthenticatedUser | null;
  handleAuthSuccess: (user: AuthenticatedUser) => void;
  appViewProps: AppViewProps | null;
};

export function usePosAppController(): UsePosAppControllerResult {
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>("cashier");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productCatalog, setProductCatalog] = useState<ProductItem[]>(products);
  const [allSales, setAllSales] = useState(() => readLocalSales());
  const [pendingSales, setPendingSales] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [splitPayment, setSplitPayment] = useState<PaymentBreakdown>(emptyPaymentBreakdown);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftSession | null>(null);
  const [shiftSessions, setShiftSessions] = useState<ShiftSession[]>([]);
  const [recentShiftHistory, setRecentShiftHistory] = useState<ShiftSession[]>([]);
  const [checkoutError, setCheckoutError] = useState<string>("");
  const [approvalRules, setApprovalRules] = useState<ApprovalRules>(() => readApprovalRules());
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [discountApprovalRequestId, setDiscountApprovalRequestId] = useState("");

  const storageScope = authUser?.tenantId || env.VITE_TENANT_ID || "default";
  const role: UserRole = authUser?.role ?? "cashier";
  const hasProductAccess = role === "manager";
  const hasReportsAccess = role === "owner" || role === "manager";
  const hasAnalyticsAccess = role === "owner";
  const hasOwnerAccess = role === "owner";
  const hasCustomersAccess = true; // All roles can access CRM view broadly, but UI might restrict actions
  const mobileRoleNavItems = mobileRoleNavByRole[role];
  const mobileRoleNavGridClass = getMobileRoleNavGridClass(mobileRoleNavItems.length);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const currentUser = await getCurrentAuthUser();
      if (cancelled) return;
      setAuthUser(currentUser);
      setAuthReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const scopedSales = readLocalSales(storageScope);
    const sessions = readShiftSessions(storageScope);

    setProductCatalog(readProducts(products, storageScope));
    setAllSales(scopedSales);
    setPendingSales(scopedSales.filter((sale) => !sale.synced).length);
    setApprovalRules(readApprovalRules(storageScope));
    setApprovalRequests(readApprovalRequests(storageScope));
    setAuditLogs(readAuditLogs(storageScope));
    setShiftSessions(sessions);
    setActiveShift(getActiveShift(storageScope));
    setRecentShiftHistory(sessions.filter((session) => Boolean(session.closedAt)).slice(0, 5));
    setDiscountApprovalRequestId("");
    setCart([]);
    setHeldOrders([]);
    setDiscountPercent(0);
    setPaymentMethod("cash");
    setIsSplitPayment(false);
    setSplitPayment(emptyPaymentBreakdown);
    setCashReceived(0);
    setCheckoutError("");
  }, [storageScope]);

  useEffect(() => {
    saveProducts(productCatalog, storageScope);
  }, [productCatalog, storageScope]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) return;

    void (async () => {
      setIsSyncing(true);
      const result = await syncPendingSales({
        supabaseUrl: env.VITE_SUPABASE_URL,
        supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
        tenantId: authUser?.tenantId || env.VITE_TENANT_ID,
        scopeKey: storageScope
      });
      setAllSales(readLocalSales(storageScope));
      setPendingSales(result.pending);
      setIsSyncing(false);
    })();
  }, [isOnline, authUser?.tenantId, storageScope]);

  useEffect(() => {
    if (isSplitPayment) {
      if (splitPayment.cash <= 0) {
        setCashReceived(0);
      }
      return;
    }

    if (paymentMethod !== "cash") {
      setCashReceived(0);
    }
  }, [paymentMethod, isSplitPayment, splitPayment.cash]);

  useEffect(() => {
    const allowedSections = allowedSectionsByRole[role];
    if (!allowedSections.includes(activeSection)) {
      setActiveSection(defaultSectionByRole[role]);
    }
  }, [role, activeSection]);

  const refreshSalesState = () => {
    const sales = readLocalSales(storageScope);
    setAllSales(sales);
    setPendingSales(sales.filter((sale) => !sale.synced).length);
  };

  const refreshApprovalState = () => {
    setApprovalRules(readApprovalRules(storageScope));
    setApprovalRequests(readApprovalRequests(storageScope));
  };

  const refreshAuditState = () => {
    setAuditLogs(readAuditLogs(storageScope));
  };

  const writeAudit = (action: string, targetType: string, targetId?: string, detail?: string) => {
    if (!authUser) return;

    appendAuditLog(
      {
        actorName: authUser.fullName,
        actorRole: role,
        action,
        targetType,
        targetId,
        detail
      },
      storageScope
    );
    refreshAuditState();
  };

  const {
    managedUsers,
    usersLoading,
    usersError,
    refreshManagedUsers,
    createManagedUser: handleCreateManagedUser,
    updateManagedUser: handleUpdateManagedUser
  } = useManagedUsers({
    enabled: hasOwnerAccess,
    tenantDependency: authUser?.tenantId,
    writeAudit
  });

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    const raw = subtotal * (discountPercent / 100);
    return Math.min(raw, subtotal);
  }, [discountPercent, subtotal]);

  const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);

  const addItem = (id: string, name: string, price: number) => {
    const item = productCatalog.find((product) => product.id === id);
    if (!item || item.stock <= 0) return;

    setCart((current) => {
      const existing = current.find((currentItem) => currentItem.id === id);
      if (!existing) {
        return [
          ...current,
          {
            id,
            name,
            price,
            qty: 1,
            basePrice: item.price,
            promoPercent: item.promoPercent,
            costPrice: item.costPrice
          }
        ];
      }
      return current.map((currentItem) =>
        currentItem.id === id ? { ...currentItem, qty: currentItem.qty + 1 } : currentItem
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    setIsSplitPayment(false);
    setSplitPayment(emptyPaymentBreakdown);
    setCashReceived(0);
    setCheckoutError("");
  };

  const holdOrder = () => {
    if (cart.length === 0) return;

    const held: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      itemCount: cart.reduce((acc, item) => acc + item.qty, 0),
      subtotal,
      discountPercent,
      paymentMethod,
      isSplitPayment,
      paymentBreakdown: isSplitPayment ? splitPayment : undefined,
      items: cart
    };

    setHeldOrders((current) => [held, ...current].slice(0, 10));
    clearCart();
    setDiscountPercent(0);
    setPaymentMethod("cash");
    setIsSplitPayment(false);
    setSplitPayment(emptyPaymentBreakdown);
    setCashReceived(0);
    setCheckoutError("");
  };

  const resumeOrder = (id: string) => {
    const selected = heldOrders.find((order) => order.id === id);
    if (!selected) return;

    setCart(selected.items);
    setDiscountPercent(selected.discountPercent);
    setPaymentMethod(selected.paymentMethod);
    setIsSplitPayment(Boolean(selected.isSplitPayment));
    setSplitPayment(selected.paymentBreakdown ?? emptyPaymentBreakdown);
    setHeldOrders((current) => current.filter((order) => order.id !== id));
    setCheckoutError("");
  };

  const increaseQty = (id: string) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const decreaseQty = (id: string) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const resolveCheckoutPaymentMethod = (): PaymentMethod => {
    if (!isSplitPayment) return paymentMethod;

    const ranked = [
      { method: "cash" as const, amount: splitPayment.cash },
      { method: "card" as const, amount: splitPayment.card },
      { method: "qris" as const, amount: splitPayment.qris }
    ].sort((a, b) => b.amount - a.amount);

    return ranked[0]?.method ?? paymentMethod;
  };

  const checkout = async () => {
    if (cart.length === 0) return;

    const checkoutPaymentMethod = resolveCheckoutPaymentMethod();
    const checkoutPaymentBreakdown = isSplitPayment ? splitPayment : undefined;
    const nowIso = new Date().toISOString();

    setProductCatalog((current) => applyStockDeduction(current, cart));

    saveLocalSale(
      {
        id: `SALE-${Date.now()}`,
        subtotal,
        discountPercent,
        discountAmount,
        total,
        paymentMethod: checkoutPaymentMethod,
        paymentBreakdown: checkoutPaymentBreakdown,
        shiftId: activeShift?.id,
        outletId: authUser?.tenantCode || "MAIN",
        createdAt: nowIso,
        items: cart
      },
      storageScope
    );

    clearCart();
    setDiscountPercent(0);
    setPaymentMethod("cash");
    setIsSplitPayment(false);
    setSplitPayment(emptyPaymentBreakdown);
    setCashReceived(0);
    setDiscountApprovalRequestId("");

    setIsSyncing(true);
    const result = await syncPendingSales({
      supabaseUrl: env.VITE_SUPABASE_URL,
      supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
      tenantId: authUser?.tenantId || env.VITE_TENANT_ID,
      scopeKey: storageScope
    });

    refreshSalesState();
    setPendingSales(result.pending);
    writeAudit(
      "checkout_confirmed",
      "sale",
      undefined,
      `Total Rp ${total.toLocaleString("id-ID")} • ${cart.reduce((acc, item) => acc + item.qty, 0)} item`
    );
    setIsSyncing(false);
    setShowCheckoutConfirm(false);
  };

  const upsertProduct = (product: ProductItem) => {
    const currentProduct = productCatalog.find((item) => item.id === product.id);

    setProductCatalog((current) => {
      const exists = current.some((item) => item.id === product.id);
      if (!exists) return [product, ...current];
      return current.map((item) => (item.id === product.id ? product : item));
    });

    if (!currentProduct) {
      writeAudit(
        "product_created",
        "product",
        product.id,
        `${product.name} • Harga Rp ${product.price.toLocaleString("id-ID")} • Promo ${product.promoPercent}%`
      );
      return;
    }

    const stockDelta = product.stock - currentProduct.stock;
    const stockDetail =
      stockDelta !== 0
        ? ` • Stok ${currentProduct.stock} -> ${product.stock}`
        : "";
    writeAudit(
      "product_updated",
      "product",
      product.id,
      `Harga Rp ${currentProduct.price.toLocaleString("id-ID")} -> Rp ${product.price.toLocaleString("id-ID")} • Promo ${currentProduct.promoPercent}% -> ${product.promoPercent}%${stockDetail}`
    );
  };

  const deleteProduct = (id: string) => {
    const product = productCatalog.find((item) => item.id === id);
    setProductCatalog((current) => current.filter((item) => item.id !== id));
    writeAudit("product_deleted", "product", id, product ? `${product.name}` : undefined);
  };

  const printReceipt = (saleId: string) => {
    const sale = readLocalSales(storageScope).find((item) => item.id === saleId);
    if (!sale) return;

    printSaleReceipt({
      sale,
      cashierName: authUser?.fullName
    });
  };

  const requestCheckout = () => {
    if (cart.length === 0) return;

    if (!activeShift) {
      setCheckoutError("Shift belum dibuka. Buka shift dulu di Home Kasir.");
      return;
    }

    if (role === "cashier" && discountPercent > approvalRules.largeDiscountPercentThreshold) {
      const contextHash = `${discountPercent}|${subtotal}|${total}|${cart.map((item) => `${item.id}:${item.qty}`).join(";")}`;
      const existingRequest = discountApprovalRequestId
        ? findApprovalRequestById(discountApprovalRequestId, storageScope)
        : null;

      if (existingRequest && existingRequest.contextHash === contextHash) {
        if (existingRequest.status === "pending") {
          setCheckoutError("Diskon besar menunggu approval manager/owner.");
          return;
        }
        if (existingRequest.status === "rejected") {
          setDiscountApprovalRequestId("");
          setCheckoutError("Approval diskon ditolak. Ubah diskon atau hubungi manager.");
          return;
        }
      } else {
        const request = createApprovalRequest(
          {
            type: "large-discount",
            requestedBy: authUser?.fullName || "Kasir",
            requestedRole: role,
            reason: `Diskon ${discountPercent}% untuk transaksi Rp ${total.toLocaleString("id-ID")}`,
            contextHash,
            subtotal,
            discountPercent,
            discountAmount,
            total,
            itemCount: cart.reduce((acc, item) => acc + item.qty, 0)
          },
          storageScope
        );

        setDiscountApprovalRequestId(request.id);
        setApprovalRequests(readApprovalRequests(storageScope));
        writeAudit(
          "approval_requested",
          "approval",
          request.id,
          `Diskon ${discountPercent}% • Total Rp ${total.toLocaleString("id-ID")}`
        );
        setCheckoutError("Diskon besar harus disetujui manager/owner sebelum checkout.");
        return;
      }
    }

    if (isSplitPayment) {
      const splitTotal = splitPayment.cash + splitPayment.card + splitPayment.qris;
      const splitTotalRounded = Math.round(splitTotal);
      const totalRounded = Math.round(total);

      if (splitTotalRounded !== totalRounded) {
        setCheckoutError("Nominal split payment harus sama dengan total transaksi.");
        return;
      }

      if (splitPayment.cash > 0 && cashReceived < splitPayment.cash) {
        setCheckoutError("Uang tunai diterima belum cukup untuk porsi tunai.");
        return;
      }
    } else if (paymentMethod === "cash" && cashReceived < total) {
      setCheckoutError("Uang diterima belum cukup.");
      return;
    }

    setCheckoutError("");
    setShowCheckoutConfirm(true);
  };

  const todayRevenue = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return allSales
      .filter((sale) => sale.status === "completed" && new Date(sale.createdAt).getTime() >= startToday)
      .reduce((acc, sale) => acc + sale.total, 0);
  }, [allSales]);

  const cashTargetAmount = useMemo(
    () => (isSplitPayment ? splitPayment.cash : paymentMethod === "cash" ? total : 0),
    [isSplitPayment, splitPayment.cash, paymentMethod, total]
  );

  const changeAmount = useMemo(
    () => Math.max(cashReceived - cashTargetAmount, 0),
    [cashReceived, cashTargetAmount]
  );

  useEffect(() => {
    setDiscountApprovalRequestId("");
  }, [discountPercent, subtotal, cart.length]);

  const lowStockCount = useMemo(
    () => productCatalog.filter((item) => item.stock > 0 && item.stock <= 5).length,
    [productCatalog]
  );

  const outOfStockCount = useMemo(
    () => productCatalog.filter((item) => item.stock === 0).length,
    [productCatalog]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.qty, 0),
    [cart]
  );

  const handleSectionChange = (section: ActiveSection) => {
    const allowedSections = allowedSectionsByRole[role];
    if (!allowedSections.includes(section)) return;
    setActiveSection(section);
  };

  const handleSplitPaymentToggle = (enabled: boolean) => {
    setIsSplitPayment(enabled);
    if (!enabled) {
      setSplitPayment(emptyPaymentBreakdown);
    }
    setCheckoutError("");
  };

  const handleSplitPaymentAmountChange = (method: PaymentMethod, amount: number) => {
    const normalized = Math.max(0, Number(amount || 0));
    setSplitPayment((current) => ({
      ...current,
      [method]: normalized
    }));
    setCheckoutError("");
  };

  const refreshShiftState = () => {
    const sessions = readShiftSessions(storageScope);
    setShiftSessions(sessions);
    setActiveShift(getActiveShift(storageScope));
    setRecentShiftHistory(sessions.filter((session) => Boolean(session.closedAt)).slice(0, 5));
  };

  const handleOpenShift = (openingCash: number) => {
    const session = openShift(openingCash, storageScope, {
      openedById: authUser?.id,
      openedByName: authUser?.fullName,
      outletId: authUser?.tenantCode || "MAIN"
    });
    refreshShiftState();
    writeAudit(
      "shift_opened",
      "shift",
      session.id,
      `Saldo awal Rp ${openingCash.toLocaleString("id-ID")}`
    );
  };

  const handleCloseShift = (closingCash: number, note: string) => {
    const session = closeShift(closingCash, note, storageScope, authUser?.fullName);
    refreshShiftState();
    writeAudit(
      "shift_closed",
      "shift",
      session.id,
      `Saldo akhir Rp ${closingCash.toLocaleString("id-ID")}${note ? ` • ${note}` : ""}`
    );
  };

  const handleAddCashMovement = (type: CashMovementType, amount: number, note: string) => {
    addCashMovement(type, amount, note, storageScope);
    refreshShiftState();
    writeAudit(
      "cash_movement",
      "shift",
      activeShift?.id,
      `${type === "in" ? "Kas masuk" : "Kas keluar"} Rp ${amount.toLocaleString("id-ID")}${note ? ` • ${note}` : ""}`
    );
  };

  const requestSaleApproval = (type: "refund" | "void", saleId: string, reason: string) => {
    const sale = readSaleById(saleId, storageScope);
    if (!sale) {
      setCheckoutError("Transaksi tidak ditemukan untuk approval.");
      return;
    }

    if (sale.status !== "completed") {
      setCheckoutError("Transaksi ini sudah tidak bisa diajukan refund/void.");
      return;
    }

    const request = createApprovalRequest(
      {
        type,
        saleId,
        requestedBy: authUser?.fullName || "Kasir",
        requestedRole: role,
        reason,
        subtotal: sale.subtotal,
        discountPercent: sale.discountPercent,
        discountAmount: sale.discountAmount,
        total: sale.total,
        itemCount: sale.items.reduce((acc, item) => acc + item.qty, 0)
      },
      storageScope
    );

    setApprovalRequests(readApprovalRequests(storageScope));
    writeAudit(
      "approval_requested",
      "approval",
      request.id,
      `${type.toUpperCase()} untuk ${saleId} • ${reason}`
    );
    setCheckoutError(`Pengajuan ${type === "refund" ? "refund" : "void"} dikirim untuk approval manager/owner.`);
  };

  const handleRequestRefund = (saleId: string, reason: string) => {
    if (role === "cashier" || approvalRules.requireRefundApproval) {
      requestSaleApproval("refund", saleId, reason);
      return;
    }

    const sale = readSaleById(saleId, storageScope);
    if (!sale || sale.status !== "completed") return;

    updateLocalSaleStatus(saleId, "refunded", storageScope, {
      approvedBy: authUser?.fullName
    });
    setProductCatalog((current) => applyStockReturn(current, sale.items));
    refreshSalesState();
    writeAudit("sale_refunded", "sale", saleId, reason);
  };

  const handleRequestVoid = (saleId: string, reason: string) => {
    if (role === "cashier" || approvalRules.requireVoidApproval) {
      requestSaleApproval("void", saleId, reason);
      return;
    }

    const sale = readSaleById(saleId, storageScope);
    if (!sale || sale.status !== "completed") return;

    updateLocalSaleStatus(saleId, "voided", storageScope, {
      approvedBy: authUser?.fullName
    });
    setProductCatalog((current) => applyStockReturn(current, sale.items));
    refreshSalesState();
    writeAudit("sale_voided", "sale", saleId, reason);
  };

  const handleResolveApprovalRequest = async (
    requestId: string,
    decision: ApprovalDecision,
    note: string
  ) => {
    const resolved = resolveApprovalRequest(
      requestId,
      decision,
      authUser?.fullName || role,
      note,
      storageScope
    );

    if (decision === "approved" && resolved.saleId && (resolved.type === "refund" || resolved.type === "void")) {
      const sale = readSaleById(resolved.saleId, storageScope);
      if (sale && sale.status === "completed") {
        const status = resolved.type === "refund" ? "refunded" : "voided";
        updateLocalSaleStatus(resolved.saleId, status, storageScope, {
          approvalRequestId: resolved.id,
          approvedBy: authUser?.fullName
        });
        setProductCatalog((current) => applyStockReturn(current, sale.items));
      }
    }

    if (decision === "approved" && resolved.type === "large-discount") {
      setCheckoutError("Approval diskon disetujui. Lanjutkan checkout.");
    }

    refreshApprovalState();
    refreshSalesState();
    writeAudit(
      decision === "approved" ? "approval_approved" : "approval_rejected",
      "approval",
      resolved.id,
      `${resolved.type} • ${note || "tanpa catatan"}`
    );
  };

  const handleUpdateApprovalRules = (input: {
    largeDiscountPercentThreshold: number;
    requireRefundApproval: boolean;
    requireVoidApproval: boolean;
  }) => {
    const next = saveApprovalRules(input, authUser?.fullName || role, storageScope);
    setApprovalRules(next);
    writeAudit(
      "approval_rules_updated",
      "approval-rules",
      undefined,
      `Diskon > ${next.largeDiscountPercentThreshold}% | Refund ${next.requireRefundApproval ? "wajib" : "langsung"} | Void ${next.requireVoidApproval ? "wajib" : "langsung"}`
    );
  };

  const handleAuthSuccess = (user: AuthenticatedUser) => {
    setAuthUser(user);
    setActiveSection(defaultSectionByRole[user.role]);
  };

  const handleLogout = async () => {
    await signOutUser();
    setAuthUser(null);
    setActiveSection("cashier");
    setCart([]);
    setAllSales([]);
    setHeldOrders([]);
    setIsSplitPayment(false);
    setSplitPayment(emptyPaymentBreakdown);
    setActiveShift(null);
    setShiftSessions([]);
    setRecentShiftHistory([]);
    setApprovalRequests([]);
    setAuditLogs([]);
    setDiscountApprovalRequestId("");
  };

  const appViewProps: AppViewProps | null = authUser
    ? {
        authUser,
        role,
        activeSection,
        hasProductAccess,
        hasReportsAccess,
        hasAnalyticsAccess,
        hasOwnerAccess,
        hasCustomersAccess,
        mobileRoleNavItems,
        mobileRoleNavGridClass,
        isOnline,
        pendingSales,
        isSyncing,
        cartItemCount,
        total,
        todayRevenue,
        lowStockCount,
        outOfStockCount,
        checkoutError,
        productCatalog,
        heldOrders,
        allSales,
        cart,
        subtotal,
        discountPercent,
        discountAmount,
        paymentMethod,
        isSplitPayment,
        splitPayment,
        cashReceived,
        changeAmount,
        activeShift,
        recentShiftHistory,
        shiftSessions,
        approvalRequests,
        managedUsers,
        usersLoading,
        usersError,
        approvalRules,
        auditLogs,
        showCheckoutConfirm,
        onSectionChange: handleSectionChange,
        onLogout: handleLogout,
        onAddItem: addItem,
        onDiscountChange: setDiscountPercent,
        onPaymentMethodChange: setPaymentMethod,
        onSplitPaymentToggle: handleSplitPaymentToggle,
        onSplitPaymentAmountChange: handleSplitPaymentAmountChange,
        onCashReceivedChange: setCashReceived,
        onOpenShift: handleOpenShift,
        onCloseShift: handleCloseShift,
        onAddCashMovement: handleAddCashMovement,
        onIncreaseQty: increaseQty,
        onDecreaseQty: decreaseQty,
        onRemoveItem: removeItem,
        onHoldOrder: holdOrder,
        onResumeOrder: resumeOrder,
        onClear: clearCart,
        onCheckout: requestCheckout,
        onPrintReceipt: printReceipt,
        onRequestRefund: handleRequestRefund,
        onRequestVoid: handleRequestVoid,
        onUpsertProduct: upsertProduct,
        onDeleteProduct: deleteProduct,
        onResolveApprovalRequest: handleResolveApprovalRequest,
        onUpdateApprovalRules: handleUpdateApprovalRules,
        onRefreshManagedUsers: () => {
          void refreshManagedUsers();
        },
        onCreateManagedUser: handleCreateManagedUser,
        onUpdateManagedUser: handleUpdateManagedUser,
        onCloseCheckoutConfirm: () => setShowCheckoutConfirm(false),
        onConfirmCheckout: checkout
      }
    : null;

  return {
    authReady,
    authUser,
    handleAuthSuccess,
    appViewProps
  };
}
