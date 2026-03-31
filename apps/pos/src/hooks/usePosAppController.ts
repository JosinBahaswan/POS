import { useEffect, useMemo, useState } from "react";
import { products } from "../localData";
import { useLowStockAlerts } from "./useLowStockAlerts";
import { useRemoteApprovalSync } from "./useRemoteApprovalSync";
import {
  applyStockDeduction,
  applyStockReturn,
  readLocalSales,
  readProducts,
  readSaleById,
  saveLocalSale,
  saveProducts,
  updateLocalSaleStatus,
  readCustomers,
  saveCustomers
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
  UserRole,
  Customer
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
  type ApprovalRequestType,
  type ApprovalDecision,
  type ApprovalRequest,
  type ApprovalRules
} from "../approvals";
import { appendAuditLog, readAuditLogs, type AuditLogEntry } from "../auditLog";
import { getCurrentAuthUser, signOutUser, type AuthenticatedUser } from "../auth";
import { useManagedUsers } from "./useManagedUsers";
import { printSaleReceipt } from "../utils/receiptPrinter";
import {
  readManagerSystemSettings,
  saveManagerSystemSettings,
  type ManagerSystemSettings,
  type ManagerSystemSettingsInput
} from "../managerSettings";
import type { AppViewProps } from "../components/appViewProps";

type UsePosAppControllerResult = {
  authReady: boolean;
  authUser: AuthenticatedUser | null;
  handleAuthSuccess: (user: AuthenticatedUser) => void;
  appViewProps: AppViewProps | null;
};

type CartDraftSnapshot = {
  updatedAt: string;
  items: CartItem[];
  discountPercent: number;
  redeemedPoints: number;
  paymentMethod: PaymentMethod;
  isSplitPayment: boolean;
  paymentBreakdown: PaymentBreakdown;
  cashReceived: number;
  selectedCustomerId?: string;
};

const SHIFT_VARIANCE_REQUIRES_NOTE = 5000;
const HELD_ORDERS_STORAGE_KEY = "pos_held_orders";
const HELD_ORDER_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_HELD_ORDERS = 10;
const CART_DRAFT_STORAGE_KEY = "pos_cart_draft";
const CART_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const LOYALTY_POINT_VALUE = 100;
const LOYALTY_TIER_MULTIPLIER: Record<Customer["member_tier"], number> = {
  Silver: 1,
  Gold: 1.25,
  Platinum: 1.5
};

function getLoyaltyTierMultiplier(tier: Customer["member_tier"] | undefined) {
  if (!tier) return 1;
  return LOYALTY_TIER_MULTIPLIER[tier] ?? 1;
}

function heldOrdersStorageKey(scopeKey: string) {
  return `${HELD_ORDERS_STORAGE_KEY}:${scopeKey}`;
}

function cartDraftStorageKey(scopeKey: string) {
  return `${CART_DRAFT_STORAGE_KEY}:${scopeKey}`;
}

function normalizeCartItems(rawItems: unknown): CartItem[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item) => {
      const candidate = item as Partial<CartItem>;
      if (!candidate.id || !candidate.name) return null;

      const qty = Math.max(0, Math.round(Number(candidate.qty || 0)));
      const price = Math.max(0, Number(candidate.price || 0));
      if (qty <= 0) return null;

      const next: CartItem = {
        id: candidate.id,
        name: candidate.name,
        qty,
        price
      };

      if (candidate.basePrice !== undefined) {
        next.basePrice = Math.max(0, Number(candidate.basePrice || 0));
      }
      if (candidate.promoPercent !== undefined) {
        next.promoPercent = Math.max(0, Math.min(100, Number(candidate.promoPercent || 0)));
      }
      if (candidate.costPrice !== undefined) {
        next.costPrice = Math.max(0, Number(candidate.costPrice || 0));
      }

      return next;
    })
    .filter((item): item is CartItem => item !== null);
}

function normalizeHeldOrder(raw: Partial<HeldOrder>): HeldOrder | null {
  if (!raw.id || typeof raw.id !== "string") return null;
  if (!raw.createdAt || typeof raw.createdAt !== "string") return null;

  const createdAtTs = new Date(raw.createdAt).getTime();
  if (!Number.isFinite(createdAtTs)) return null;

  const normalizedItems = normalizeCartItems(raw.items);

  if (normalizedItems.length === 0) return null;

  const paymentMethod: PaymentMethod =
    raw.paymentMethod === "card" || raw.paymentMethod === "qris" ? raw.paymentMethod : "cash";

  const paymentBreakdown: PaymentBreakdown | undefined = raw.paymentBreakdown
    ? {
        cash: Math.max(0, Number(raw.paymentBreakdown.cash || 0)),
        card: Math.max(0, Number(raw.paymentBreakdown.card || 0)),
        qris: Math.max(0, Number(raw.paymentBreakdown.qris || 0))
      }
    : undefined;

  const expiresAtTsCandidate = typeof raw.expiresAt === "string" ? new Date(raw.expiresAt).getTime() : NaN;
  const expiresAtTs = Number.isFinite(expiresAtTsCandidate)
    ? expiresAtTsCandidate
    : createdAtTs + HELD_ORDER_TTL_MS;

  const fallbackItemCount = normalizedItems.reduce((acc, item) => acc + item.qty, 0);
  const fallbackSubtotal = normalizedItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  return {
    id: raw.id,
    createdAt: new Date(createdAtTs).toISOString(),
    expiresAt: new Date(expiresAtTs).toISOString(),
    itemCount: Math.max(0, Math.round(Number(raw.itemCount || fallbackItemCount))),
    subtotal: Math.max(0, Number(raw.subtotal ?? fallbackSubtotal)),
    discountPercent: Math.max(0, Math.min(100, Number(raw.discountPercent || 0))),
    redeemedPoints: Math.max(0, Math.round(Number(raw.redeemedPoints || 0))),
    selectedCustomerId: typeof raw.selectedCustomerId === "string" ? raw.selectedCustomerId : undefined,
    paymentMethod,
    isSplitPayment: Boolean(raw.isSplitPayment),
    paymentBreakdown,
    items: normalizedItems
  };
}

function normalizeCartDraft(raw: Partial<CartDraftSnapshot>): CartDraftSnapshot | null {
  if (!raw.updatedAt || typeof raw.updatedAt !== "string") return null;

  const updatedAtTs = new Date(raw.updatedAt).getTime();
  if (!Number.isFinite(updatedAtTs)) return null;

  const normalizedItems = normalizeCartItems(raw.items);
  if (normalizedItems.length === 0) return null;

  const paymentMethod: PaymentMethod =
    raw.paymentMethod === "card" || raw.paymentMethod === "qris" ? raw.paymentMethod : "cash";

  const paymentBreakdown: PaymentBreakdown = {
    cash: Math.max(0, Number(raw.paymentBreakdown?.cash || 0)),
    card: Math.max(0, Number(raw.paymentBreakdown?.card || 0)),
    qris: Math.max(0, Number(raw.paymentBreakdown?.qris || 0))
  };

  return {
    updatedAt: new Date(updatedAtTs).toISOString(),
    items: normalizedItems,
    discountPercent: Math.max(0, Math.min(100, Number(raw.discountPercent || 0))),
    redeemedPoints: Math.max(0, Math.round(Number(raw.redeemedPoints || 0))),
    paymentMethod,
    isSplitPayment: Boolean(raw.isSplitPayment),
    paymentBreakdown,
    cashReceived: Math.max(0, Number(raw.cashReceived || 0)),
    selectedCustomerId: typeof raw.selectedCustomerId === "string" ? raw.selectedCustomerId : undefined
  };
}

function pruneExpiredHeldOrders(orders: HeldOrder[], nowTs = Date.now()) {
  let expiredCount = 0;

  const activeOrders = orders.filter((order) => {
    const expiresAtTs = new Date(order.expiresAt ?? order.createdAt).getTime();
    const active = Number.isFinite(expiresAtTs) && expiresAtTs > nowTs;

    if (!active) {
      expiredCount += 1;
    }

    return active;
  });

  return {
    activeOrders,
    expiredCount
  };
}

function readHeldOrders(scopeKey = "default"): HeldOrder[] {
  const raw = localStorage.getItem(heldOrdersStorageKey(scopeKey));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<Partial<HeldOrder>>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeHeldOrder)
      .filter((order): order is HeldOrder => order !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

function writeHeldOrders(orders: HeldOrder[], scopeKey = "default") {
  localStorage.setItem(heldOrdersStorageKey(scopeKey), JSON.stringify(orders));
}

function readCartDraft(scopeKey = "default"): CartDraftSnapshot | null {
  const raw = localStorage.getItem(cartDraftStorageKey(scopeKey));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CartDraftSnapshot>;
    const normalized = normalizeCartDraft(parsed);
    if (!normalized) return null;

    const updatedAtTs = new Date(normalized.updatedAt).getTime();
    const isExpired = Date.now() - updatedAtTs > CART_DRAFT_MAX_AGE_MS;
    if (isExpired) {
      localStorage.removeItem(cartDraftStorageKey(scopeKey));
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

function writeCartDraft(draft: CartDraftSnapshot, scopeKey = "default") {
  localStorage.setItem(cartDraftStorageKey(scopeKey), JSON.stringify(draft));
}

function clearCartDraft(scopeKey = "default") {
  localStorage.removeItem(cartDraftStorageKey(scopeKey));
}

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
  const [heldOrdersScope, setHeldOrdersScope] = useState<string>("default");
  const [heldOrdersHydrated, setHeldOrdersHydrated] = useState<boolean>(false);
  const [cartDraftScope, setCartDraftScope] = useState<string>("default");
  const [cartDraftHydrated, setCartDraftHydrated] = useState<boolean>(false);
  const [pendingCartDraft, setPendingCartDraft] = useState<CartDraftSnapshot | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [activeShift, setActiveShift] = useState<ShiftSession | null>(null);
  const [shiftSessions, setShiftSessions] = useState<ShiftSession[]>([]);
  const [recentShiftHistory, setRecentShiftHistory] = useState<ShiftSession[]>([]);
  const [checkoutError, setCheckoutError] = useState<string>("");
  const [approvalRules, setApprovalRules] = useState<ApprovalRules>(() => readApprovalRules());
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [managerSettings, setManagerSettings] = useState<ManagerSystemSettings>(() => readManagerSystemSettings());
  const [discountApprovalRequestId, setDiscountApprovalRequestId] = useState("");

  const storageScope = authUser?.tenantId || env.VITE_TENANT_ID || "default";
  // Initialize remote approval polling
  useRemoteApprovalSync(storageScope);
  const role: UserRole = authUser?.role ?? "cashier";
  const managerVisibleSections = useMemo<ActiveSection[]>(() => {
    const sections: ActiveSection[] = [];

    if (managerSettings.showReportsSection) sections.push("reports");
    if (managerSettings.showHistorySection) sections.push("history");
    if (managerSettings.showProductsSection) sections.push("products");
    if (managerSettings.showCustomersSection) sections.push("customers");

    return sections.length > 0 ? sections : ["reports"];
  }, [managerSettings]);

  const roleAllowedSections = useMemo<ActiveSection[]>(() => {
    if (role === "manager") {
      return managerVisibleSections;
    }

    return allowedSectionsByRole[role];
  }, [role, managerVisibleSections]);

  const hasProductAccess = role === "owner" || (role === "manager" && managerSettings.showProductsSection);
  const hasReportsAccess = role === "owner" || (role === "manager" && managerSettings.showReportsSection);
  const hasAnalyticsAccess = role === "owner";
  const hasOwnerAccess = role === "owner";
  const hasCustomersAccess = role === "manager" ? managerSettings.showCustomersSection : true;
  const managerCanExportData = role !== "manager" || managerSettings.allowDataExport;
  const managerCanResolveApproval = role !== "manager" || managerSettings.allowApprovalDecision;
  const managerCanDeleteProduct = role !== "manager" || managerSettings.allowProductDelete;
  const managerCanAdjustStock = role !== "manager" || managerSettings.allowStockAdjustment;
  const mobileRoleNavItems =
    role === "manager"
      ? mobileRoleNavByRole[role].filter((item) => roleAllowedSections.includes(item.section))
      : mobileRoleNavByRole[role];
  const mobileRoleNavGridClass = getMobileRoleNavGridClass(mobileRoleNavItems.length);
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

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
    setHeldOrdersHydrated(false);
    setCartDraftHydrated(false);

    const scopedSales = readLocalSales(storageScope);
    const sessions = readShiftSessions(storageScope);
    const scopedHeldOrders = readHeldOrders(storageScope);
    const scopedCartDraft = readCartDraft(storageScope);
    const { activeOrders: activeHeldOrders, expiredCount: expiredHeldOrdersCount } = pruneExpiredHeldOrders(scopedHeldOrders);

    writeHeldOrders(activeHeldOrders, storageScope);

    setProductCatalog(readProducts(products, storageScope));
    setCustomers(readCustomers([], storageScope));
    setAllSales(scopedSales);
    setPendingSales(scopedSales.filter((sale) => !sale.synced).length);
    setApprovalRules(readApprovalRules(storageScope));
    setApprovalRequests(readApprovalRequests(storageScope));
    setAuditLogs(readAuditLogs(storageScope));
    setManagerSettings(readManagerSystemSettings(storageScope));
    setShiftSessions(sessions);
    setActiveShift(getActiveShift(storageScope));
    setRecentShiftHistory(sessions.filter((session) => Boolean(session.closedAt)).slice(0, 5));
    setHeldOrdersScope(storageScope);
    setCartDraftScope(storageScope);
    setDiscountApprovalRequestId("");
    setPendingCartDraft(scopedCartDraft);
    setCart([]);
    setHeldOrders(activeHeldOrders);
    setDiscountPercent(0);
    setRedeemedPoints(0);
    setPaymentMethod("cash");
    setIsSplitPayment(false);
    setSplitPayment(emptyPaymentBreakdown);
    setCashReceived(0);
    setCheckoutError(
      expiredHeldOrdersCount > 0
        ? `${expiredHeldOrdersCount} order tahan kadaluarsa dan dihapus otomatis.`
        : ""
    );
    setHeldOrdersHydrated(true);
    setCartDraftHydrated(true);
  }, [storageScope]);

  useEffect(() => {
    saveProducts(productCatalog, storageScope);
  }, [productCatalog, storageScope]);

  useEffect(() => {
    saveCustomers(customers, storageScope);
  }, [customers, storageScope]);

  useEffect(() => {
    if (!heldOrdersHydrated) return;
    if (heldOrdersScope !== storageScope) return;
    writeHeldOrders(heldOrders, storageScope);
  }, [heldOrders, heldOrdersHydrated, heldOrdersScope, storageScope]);

  useEffect(() => {
    if (!cartDraftHydrated) return;
    if (cartDraftScope !== storageScope) return;

    if (cart.length === 0) {
      if (pendingCartDraft) return;
      clearCartDraft(storageScope);
      return;
    }

    const draftSnapshot: CartDraftSnapshot = {
      updatedAt: new Date().toISOString(),
      items: cart,
      discountPercent,
      redeemedPoints,
      paymentMethod,
      isSplitPayment,
      paymentBreakdown: splitPayment,
      cashReceived,
      selectedCustomerId
    };

    writeCartDraft(draftSnapshot, storageScope);

    if (pendingCartDraft) {
      setPendingCartDraft(null);
    }
  }, [
    cart,
    discountPercent,
    redeemedPoints,
    paymentMethod,
    isSplitPayment,
    splitPayment,
    cashReceived,
    selectedCustomerId,
    cartDraftHydrated,
    cartDraftScope,
    storageScope,
    pendingCartDraft
  ]);

  useEffect(() => {
    if (heldOrders.length === 0) return;

    const intervalId = window.setInterval(() => {
      setHeldOrders((current) => {
        const { activeOrders } = pruneExpiredHeldOrders(current);
        return activeOrders.length === current.length ? current : activeOrders;
      });
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heldOrders.length]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onLocalSync = () => setApprovalRequests(readApprovalRequests(storageScope));

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("local-storage-sync", onLocalSync);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("local-storage-sync", onLocalSync);
    };
  }, [storageScope]);

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
    if (!roleAllowedSections.includes(activeSection)) {
      const fallbackSection = roleAllowedSections[0] ?? defaultSectionByRole[role];
      setActiveSection(fallbackSection);
    }
  }, [role, activeSection, roleAllowedSections]);

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

  const subtotalAfterDiscount = useMemo(
    () => Math.max(0, subtotal - discountAmount),
    [subtotal, discountAmount]
  );

  const maxRedeemablePoints = useMemo(() => {
    if (!selectedCustomer) return 0;

    const availablePoints = Math.max(0, Math.round(Number(selectedCustomer.loyalty_points || 0)));
    const maxByCart = Math.max(0, Math.floor(subtotalAfterDiscount / LOYALTY_POINT_VALUE));
    return Math.min(availablePoints, maxByCart);
  }, [selectedCustomer, subtotalAfterDiscount]);

  const appliedRedeemedPoints = useMemo(
    () => Math.min(Math.max(0, Math.round(Number(redeemedPoints || 0))), maxRedeemablePoints),
    [redeemedPoints, maxRedeemablePoints]
  );

  const loyaltyRedeemAmount = useMemo(
    () => Math.min(subtotalAfterDiscount, appliedRedeemedPoints * LOYALTY_POINT_VALUE),
    [subtotalAfterDiscount, appliedRedeemedPoints]
  );

  const total = useMemo(
    () => Math.max(0, subtotalAfterDiscount - loyaltyRedeemAmount),
    [subtotalAfterDiscount, loyaltyRedeemAmount]
  );

  const selectedCustomerLoyaltyMultiplier = useMemo(
    () => getLoyaltyTierMultiplier(selectedCustomer?.member_tier),
    [selectedCustomer?.member_tier]
  );

  const estimatedEarnedPoints = useMemo(() => {
    if (!selectedCustomer || total <= 0) {
      return 0;
    }

    const baseEarnedPoints = Math.floor(total / 10000);
    return Math.max(0, Math.floor(baseEarnedPoints * selectedCustomerLoyaltyMultiplier));
  }, [selectedCustomer, total, selectedCustomerLoyaltyMultiplier]);

  useEffect(() => {
    setRedeemedPoints((current) => {
      const normalizedCurrent = Math.max(0, Math.round(Number(current || 0)));
      if (normalizedCurrent <= maxRedeemablePoints) return normalizedCurrent;
      return maxRedeemablePoints;
    });
  }, [maxRedeemablePoints]);

  const cartProfitability = useMemo(() => {
    const base = cart.reduce(
      (acc, item) => {
        const qty = Math.max(0, Number(item.qty || 0));
        const unitSell = Math.max(0, Number(item.price || 0));
        const unitCost = Math.max(0, Number(item.costPrice || 0));

        if (qty <= 0) {
          return acc;
        }

        const lineRevenue = unitSell * qty;
        const lineCost = unitCost * qty;

        acc.revenueBeforeDiscount += lineRevenue;
        acc.estimatedCost += lineCost;

        if (unitCost > unitSell) {
          acc.riskyItemCount += qty;
          acc.riskyItemLossAmount += (unitCost - unitSell) * qty;
        }

        return acc;
      },
      {
        revenueBeforeDiscount: 0,
        estimatedCost: 0,
        riskyItemCount: 0,
        riskyItemLossAmount: 0
      }
    );

    const netRevenue = Math.max(0, Number(total || 0));
    const grossProfit = netRevenue - base.estimatedCost;
    const projectedLossAmount = Math.max(0, -grossProfit);

    return {
      revenueBeforeDiscount: base.revenueBeforeDiscount,
      estimatedCost: base.estimatedCost,
      riskyItemCount: base.riskyItemCount,
      riskyItemLossAmount: base.riskyItemLossAmount,
      netRevenue,
      grossProfit,
      grossMarginPercent: netRevenue > 0 ? (grossProfit / netRevenue) * 100 : null,
      hasNegativeMargin: grossProfit < 0,
      projectedLossAmount
    };
  }, [cart, total]);

  const minimumMarginThreshold = useMemo(
    () => Math.max(0, Number(approvalRules.minimumMarginPercentThreshold || 0)),
    [approvalRules.minimumMarginPercentThreshold]
  );

  const discountApprovalThreshold = useMemo(
    () => Math.max(0, Number(approvalRules.largeDiscountPercentThreshold || 0)),
    [approvalRules.largeDiscountPercentThreshold]
  );

  const cartBelowMinimumMarginThreshold = useMemo(() => {
    const marginPercent = cartProfitability.grossMarginPercent;

    if (minimumMarginThreshold <= 0 || marginPercent === null) {
      return false;
    }

    if (cartProfitability.hasNegativeMargin) {
      return false;
    }

    return marginPercent < minimumMarginThreshold;
  }, [minimumMarginThreshold, cartProfitability.grossMarginPercent, cartProfitability.hasNegativeMargin]);

  const validateCartStock = (items: CartItem[]) => {
    for (const cartItem of items) {
      const product = productCatalog.find((entry) => entry.id === cartItem.id);

      if (!product) {
        return {
          valid: false,
          message: `${cartItem.name} sudah tidak ada di katalog. Hapus item dari keranjang.`
        };
      }

      const availableStock = Math.max(0, Number(product.stock || 0));

      if (availableStock <= 0) {
        return {
          valid: false,
          message: `Stok ${product.name} habis. Hapus item dari keranjang.`
        };
      }

      if (cartItem.qty > availableStock) {
        return {
          valid: false,
          message: `Stok ${product.name} tersisa ${availableStock}. Kurangi qty di keranjang sebelum checkout.`
        };
      }
    }

    return {
      valid: true,
      message: ""
    };
  };

  const addItem = (id: string, name: string, price: number) => {
    const item = productCatalog.find((product) => product.id === id);
    if (!item) {
      setCheckoutError("Produk tidak ditemukan.");
      return;
    }

    if (item.stock <= 0) {
      setCheckoutError(`Stok ${item.name} habis.`);
      return;
    }

    let stockLimitMessage = "";

    setCart((current) => {
      const existing = current.find((currentItem) => currentItem.id === id);

      if (existing && existing.qty >= item.stock) {
        stockLimitMessage = `Stok ${item.name} tersisa ${item.stock}.`;
        return current;
      }

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

    if (stockLimitMessage) {
      setCheckoutError(stockLimitMessage);
      return;
    }

    setCheckoutError("");
  };

  const clearCart = () => {
    setCart([]);
    setRedeemedPoints(0);
    setIsSplitPayment(false);
    setSplitPayment(emptyPaymentBreakdown);
    setCashReceived(0);
    setPendingCartDraft(null);
    clearCartDraft(storageScope);
    setCheckoutError("");
  };

  const holdOrder = () => {
    if (cart.length === 0) return;

    const nowTs = Date.now();

    const held: HeldOrder = {
      id: `HOLD-${nowTs}`,
      createdAt: new Date(nowTs).toISOString(),
      expiresAt: new Date(nowTs + HELD_ORDER_TTL_MS).toISOString(),
      itemCount: cart.reduce((acc, item) => acc + item.qty, 0),
      subtotal,
      discountPercent,
      redeemedPoints: appliedRedeemedPoints,
      selectedCustomerId,
      paymentMethod,
      isSplitPayment,
      paymentBreakdown: isSplitPayment ? splitPayment : undefined,
      items: cart
    };

    setHeldOrders((current) => {
      const { activeOrders } = pruneExpiredHeldOrders(current, nowTs);
      return [held, ...activeOrders].slice(0, MAX_HELD_ORDERS);
    });
    clearCart();
    setDiscountPercent(0);
    setPaymentMethod("cash");
    setIsSplitPayment(false);
    setSplitPayment(emptyPaymentBreakdown);
    setCashReceived(0);
    setCheckoutError("");
  };

  const resumeOrder = (id: string) => {
    const { activeOrders: activeHeldOrders, expiredCount } = pruneExpiredHeldOrders(heldOrders);
    if (expiredCount > 0) {
      setHeldOrders(activeHeldOrders);
    }

    const selected = activeHeldOrders.find((order) => order.id === id);
    if (!selected) {
      setCheckoutError("Order tahan tidak ditemukan atau sudah kadaluarsa.");
      return;
    }

    const resumedItems: CartItem[] = [];
    let reducedQtyCount = 0;
    let removedItemCount = 0;

    for (const item of selected.items) {
      const product = productCatalog.find((entry) => entry.id === item.id);
      const availableStock = Math.max(0, Number(product?.stock || 0));

      if (availableStock <= 0) {
        removedItemCount += 1;
        continue;
      }

      const normalizedQty = Math.min(item.qty, availableStock);
      if (normalizedQty < item.qty) {
        reducedQtyCount += item.qty - normalizedQty;
      }

      resumedItems.push({
        ...item,
        qty: normalizedQty
      });
    }

    if (resumedItems.length === 0) {
      setCheckoutError("Order tahan tidak bisa dipulihkan karena stok item sudah habis.");
      return;
    }

    const hasScopedCustomer = typeof selected.selectedCustomerId === "string";
    const selectedHeldCustomer = hasScopedCustomer
      ? customers.find((customer) => customer.id === selected.selectedCustomerId)
      : undefined;
    const selectedHeldCustomerExists = hasScopedCustomer ? Boolean(selectedHeldCustomer) : true;
    const nextSelectedCustomerId = hasScopedCustomer
      ? selectedHeldCustomer?.id
      : selectedCustomerId;
    const resumedSubtotal = resumedItems.reduce((acc, item) => acc + item.qty * item.price, 0);
    const resumedDiscountAmount = Math.min(
      resumedSubtotal,
      resumedSubtotal * (selected.discountPercent / 100)
    );
    const resumedAfterDiscount = Math.max(0, resumedSubtotal - resumedDiscountAmount);
    const maxPointsByCart = Math.max(0, Math.floor(resumedAfterDiscount / LOYALTY_POINT_VALUE));
    const requestedRedeemedPoints = Math.max(0, Math.round(Number(selected.redeemedPoints || 0)));
    const maxPointsByCustomer = selectedHeldCustomer
      ? Math.max(0, Math.round(Number(selectedHeldCustomer.loyalty_points || 0)))
      : 0;
    const normalizedRedeemedPoints = Math.min(requestedRedeemedPoints, maxPointsByCart, maxPointsByCustomer);
    const loyaltyAdjusted = requestedRedeemedPoints !== normalizedRedeemedPoints;

    setCart(resumedItems);
    setDiscountPercent(selected.discountPercent);
    setSelectedCustomerId(nextSelectedCustomerId);
    setRedeemedPoints(normalizedRedeemedPoints);
    setPaymentMethod(selected.paymentMethod);
    setIsSplitPayment(Boolean(selected.isSplitPayment));
    setSplitPayment(selected.paymentBreakdown ?? emptyPaymentBreakdown);
    setHeldOrders(activeHeldOrders.filter((order) => order.id !== id));

    if (reducedQtyCount > 0 || removedItemCount > 0 || !selectedHeldCustomerExists || loyaltyAdjusted) {
      const adjustmentParts = [
        reducedQtyCount > 0 ? `qty dikurangi ${reducedQtyCount}` : "",
        removedItemCount > 0 ? `${removedItemCount} item tidak tersedia` : "",
        !selectedHeldCustomerExists ? "member loyalty tidak ditemukan" : "",
        loyaltyAdjusted ? "poin loyalty disesuaikan" : ""
      ].filter(Boolean);
      setCheckoutError(`Order dipulihkan sebagian (${adjustmentParts.join(" • ")}).`);
      return;
    }

    setCheckoutError("");
  };

  const discardHeldOrder = (id: string) => {
    setHeldOrders((current) => current.filter((order) => order.id !== id));
    setCheckoutError("Order tahan dihapus.");
  };

  const discardExpiredHeldOrders = () => {
    const { activeOrders, expiredCount } = pruneExpiredHeldOrders(heldOrders);

    if (expiredCount <= 0) {
      setCheckoutError("Tidak ada order tahan kadaluarsa.");
      return;
    }

    setHeldOrders(activeOrders);
    setCheckoutError(`${expiredCount} order tahan kadaluarsa dihapus.`);
  };

  const clearAllHeldOrders = () => {
    if (heldOrders.length === 0) {
      setCheckoutError("Tidak ada order tahan untuk dihapus.");
      return;
    }

    setHeldOrders([]);
    setCheckoutError("Semua order tahan dihapus.");
  };

  const restoreCartDraft = () => {
    if (!pendingCartDraft) return;

    const restoredItems: CartItem[] = [];
    let reducedQtyCount = 0;
    let removedItemCount = 0;

    for (const item of pendingCartDraft.items) {
      const product = productCatalog.find((entry) => entry.id === item.id);
      const availableStock = Math.max(0, Number(product?.stock || 0));

      if (availableStock <= 0) {
        removedItemCount += 1;
        continue;
      }

      const normalizedQty = Math.min(item.qty, availableStock);
      if (normalizedQty < item.qty) {
        reducedQtyCount += item.qty - normalizedQty;
      }

      restoredItems.push({
        ...item,
        qty: normalizedQty
      });
    }

    setPendingCartDraft(null);

    if (restoredItems.length === 0) {
      clearCartDraft(storageScope);
      setCheckoutError("Draft keranjang tidak bisa dipulihkan karena stok item sudah habis.");
      return;
    }

    const selectedCustomerExists =
      pendingCartDraft.selectedCustomerId !== undefined &&
      customers.some((customer) => customer.id === pendingCartDraft.selectedCustomerId);
    const draftCustomer = selectedCustomerExists
      ? customers.find((customer) => customer.id === pendingCartDraft.selectedCustomerId)
      : undefined;
    const restoredSubtotal = restoredItems.reduce((acc, item) => acc + item.qty * item.price, 0);
    const restoredDiscountAmount = Math.min(
      restoredSubtotal,
      restoredSubtotal * (pendingCartDraft.discountPercent / 100)
    );
    const restoredAfterDiscount = Math.max(0, restoredSubtotal - restoredDiscountAmount);
    const maxRestoredPointsByCart = Math.max(0, Math.floor(restoredAfterDiscount / LOYALTY_POINT_VALUE));
    const requestedDraftRedeemedPoints = Math.max(0, Math.round(Number(pendingCartDraft.redeemedPoints || 0)));
    const maxRestoredPointsByCustomer = draftCustomer
      ? Math.max(0, Math.round(Number(draftCustomer.loyalty_points || 0)))
      : 0;
    const normalizedDraftRedeemedPoints = Math.min(
      requestedDraftRedeemedPoints,
      maxRestoredPointsByCart,
      maxRestoredPointsByCustomer
    );
    const loyaltyDraftAdjusted = requestedDraftRedeemedPoints !== normalizedDraftRedeemedPoints;

    setCart(restoredItems);
    setDiscountPercent(pendingCartDraft.discountPercent);
    setPaymentMethod(pendingCartDraft.paymentMethod);
    setIsSplitPayment(Boolean(pendingCartDraft.isSplitPayment));
    setSplitPayment(pendingCartDraft.paymentBreakdown);
    setCashReceived(
      pendingCartDraft.isSplitPayment
        ? pendingCartDraft.paymentBreakdown.cash > 0
          ? pendingCartDraft.cashReceived
          : 0
        : pendingCartDraft.paymentMethod === "cash"
          ? pendingCartDraft.cashReceived
          : 0
    );
    setSelectedCustomerId(selectedCustomerExists ? pendingCartDraft.selectedCustomerId : undefined);
    setRedeemedPoints(normalizedDraftRedeemedPoints);

    if (
      reducedQtyCount > 0 ||
      removedItemCount > 0 ||
      (Boolean(pendingCartDraft.selectedCustomerId) && !selectedCustomerExists) ||
      loyaltyDraftAdjusted
    ) {
      const adjustmentParts = [
        reducedQtyCount > 0 ? `qty dikurangi ${reducedQtyCount}` : "",
        removedItemCount > 0 ? `${removedItemCount} item tidak tersedia` : "",
        !selectedCustomerExists && pendingCartDraft.selectedCustomerId ? "member loyalty tidak ditemukan" : "",
        loyaltyDraftAdjusted ? "poin loyalty disesuaikan" : ""
      ].filter(Boolean);
      setCheckoutError(`Draft dipulihkan sebagian (${adjustmentParts.join(" • ")}).`);
      return;
    }

    setCheckoutError("Draft keranjang dipulihkan.");
  };

  const discardCartDraft = () => {
    if (!pendingCartDraft) return;
    setPendingCartDraft(null);
    clearCartDraft(storageScope);
    setCheckoutError("Draft keranjang dihapus.");
  };

  const increaseQty = (id: string) => {
    const product = productCatalog.find((entry) => entry.id === id);
    if (!product) {
      setCheckoutError("Produk tidak ditemukan.");
      return;
    }

    if (product.stock <= 0) {
      setCheckoutError(`Stok ${product.name} habis.`);
      return;
    }

    let stockLimitMessage = "";

    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? (() => {
              if (item.qty >= product.stock) {
                stockLimitMessage = `Stok ${product.name} tersisa ${product.stock}.`;
                return item;
              }

              return { ...item, qty: item.qty + 1 };
            })()
          : item
      )
    );

    if (stockLimitMessage) {
      setCheckoutError(stockLimitMessage);
      return;
    }

    setCheckoutError("");
  };

  const decreaseQty = (id: string) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
    setCheckoutError("");
  };

  const removeItem = (id: string) => {
    setCart((current) => current.filter((item) => item.id !== id));
    setCheckoutError("");
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

  const activeShiftCashSummary = useMemo(() => {
    if (!activeShift) {
      return {
        cashSalesTotal: 0,
        movementNet: 0,
        expectedClosingCash: 0
      };
    }

    const completedShiftSales = allSales.filter(
      (sale) => sale.shiftId === activeShift.id && sale.status === "completed"
    );

    const cashSalesTotal = completedShiftSales.reduce((acc, sale) => {
      if (sale.paymentBreakdown) {
        return acc + Math.max(0, Number(sale.paymentBreakdown.cash || 0));
      }

      return sale.paymentMethod === "cash" ? acc + sale.total : acc;
    }, 0);

    const movementNet = activeShift.movements.reduce((acc, movement) => {
      if (movement.type === "in") return acc + movement.amount;
      return acc - movement.amount;
    }, 0);

    return {
      cashSalesTotal,
      movementNet,
      expectedClosingCash: Math.max(0, activeShift.openingCash + movementNet + cashSalesTotal)
    };
  }, [activeShift, allSales]);

  const checkout = async () => {
    if (cart.length === 0) return;

    const stockValidation = validateCartStock(cart);
    if (!stockValidation.valid) {
      setCheckoutError(stockValidation.message);
      setShowCheckoutConfirm(false);
      return;
    }

    setCheckoutError("");

    const checkoutPaymentMethod = resolveCheckoutPaymentMethod();
    const checkoutPaymentBreakdown = isSplitPayment ? splitPayment : undefined;
    const nowIso = new Date().toISOString();
    const earnedPoints = selectedCustomerId ? estimatedEarnedPoints : 0;
    const pointsDelta = earnedPoints - appliedRedeemedPoints;
    const loyaltyTierLabel = selectedCustomer?.member_tier ? ` ${selectedCustomer.member_tier}` : "";
    const loyaltyMultiplierLabel = selectedCustomerId
      ? selectedCustomerLoyaltyMultiplier.toFixed(2).replace(/\.?0+$/, "")
      : "";

    setProductCatalog((current) => applyStockDeduction(current, cart));

    if (selectedCustomerId && (appliedRedeemedPoints > 0 || earnedPoints > 0)) {
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === selectedCustomerId
            ? {
                ...customer,
                loyalty_points: Math.max(0, customer.loyalty_points + pointsDelta)
              }
            : customer
        )
      );
    }

    saveLocalSale(
      {
        id: `SALE-${Date.now()}`,
        subtotal,
        discountPercent,
        discountAmount,
        redeemedPoints: selectedCustomerId && appliedRedeemedPoints > 0 ? appliedRedeemedPoints : undefined,
        redeemedAmount: selectedCustomerId && loyaltyRedeemAmount > 0 ? loyaltyRedeemAmount : undefined,
        total,
        paymentMethod: checkoutPaymentMethod,
        paymentBreakdown: checkoutPaymentBreakdown,
        shiftId: activeShift?.id,
        outletId: authUser?.tenantCode || "MAIN",
        cashierId: authUser?.id,
        cashierName: authUser?.fullName,
        customerId: selectedCustomerId,
        earnedPoints: selectedCustomerId ? earnedPoints : undefined,
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
      `Total Rp ${total.toLocaleString("id-ID")} • ${cart.reduce((acc, item) => acc + item.qty, 0)} item${
        selectedCustomerId
          ? ` • Loyalty ${pointsDelta >= 0 ? "+" : ""}${pointsDelta} poin${loyaltyTierLabel}${
              loyaltyMultiplierLabel ? ` x${loyaltyMultiplierLabel}` : ""
            }`
          : ""
      }`
    );
    setIsSyncing(false);
    setShowCheckoutConfirm(false);
  };

  const upsertProduct = (product: ProductItem) => {
    if (!hasProductAccess) {
      setCheckoutError("Akun ini tidak punya akses untuk mengubah produk.");
      return;
    }

    const currentProduct = productCatalog.find((item) => item.id === product.id);

    if (role === "manager" && !managerSettings.allowStockAdjustment) {
      const stockChanged = currentProduct
        ? currentProduct.stock !== product.stock
        : product.stock > 0;

      if (stockChanged) {
        setCheckoutError("Owner menonaktifkan izin penyesuaian stok untuk manager.");
        return;
      }
    }

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
    if (!hasProductAccess) {
      setCheckoutError("Akun ini tidak punya akses untuk menghapus produk.");
      return;
    }

    if (role === "manager" && !managerSettings.allowProductDelete) {
      setCheckoutError("Owner menonaktifkan izin hapus produk untuk manager.");
      return;
    }

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

    const stockValidation = validateCartStock(cart);
    if (!stockValidation.valid) {
      setCheckoutError(stockValidation.message);
      return;
    }

    if (redeemedPoints > 0 && !selectedCustomer) {
      setCheckoutError("Pilih member loyalty terlebih dulu untuk menukar poin.");
      return;
    }

    if (redeemedPoints > maxRedeemablePoints) {
      setCheckoutError(`Poin yang ditukar melebihi batas maksimal ${maxRedeemablePoints} poin untuk transaksi ini.`);
      return;
    }

    if (
      selectedCustomer &&
      appliedRedeemedPoints > Math.max(0, Math.round(Number(selectedCustomer.loyalty_points || 0)))
    ) {
      setCheckoutError("Saldo poin pelanggan berubah. Sesuaikan jumlah penukaran poin.");
      return;
    }

    const requiresDiscountApproval = discountPercent > discountApprovalThreshold;
    const marginPercent = cartProfitability.grossMarginPercent;
    const hasLowMarginRisk = cartBelowMinimumMarginThreshold;
    const requiresMarginRiskApproval =
      cartProfitability.riskyItemLossAmount > 0 ||
      cartProfitability.hasNegativeMargin ||
      hasLowMarginRisk;
    const hasCombinedRisk = requiresDiscountApproval && requiresMarginRiskApproval;
    const projectedLossAmount = Math.max(
      cartProfitability.riskyItemLossAmount,
      cartProfitability.projectedLossAmount
    );

    if (role === "cashier" && (requiresDiscountApproval || requiresMarginRiskApproval)) {
      const approvalType: ApprovalRequestType = requiresMarginRiskApproval ? "loss-risk" : "large-discount";
      const reasonParts: string[] = [];

      if (requiresDiscountApproval) {
        reasonParts.push(`Diskon ${discountPercent}% untuk transaksi Rp ${total.toLocaleString("id-ID")}`);
      }

      if (appliedRedeemedPoints > 0) {
        reasonParts.push(
          `Tukar poin ${appliedRedeemedPoints} (Rp ${Math.round(loyaltyRedeemAmount).toLocaleString("id-ID")})`
        );
      }

      if (requiresMarginRiskApproval) {
        if (cartProfitability.riskyItemLossAmount > 0) {
          reasonParts.push(
            `Ada ${cartProfitability.riskyItemCount} item jual di bawah HPP (potensi rugi Rp ${Math.round(cartProfitability.riskyItemLossAmount).toLocaleString("id-ID")})`
          );
        }

        if (cartProfitability.hasNegativeMargin) {
          const marginText = cartProfitability.grossMarginPercent === null
            ? "-"
            : `${cartProfitability.grossMarginPercent.toFixed(1)}%`;
          reasonParts.push(
            `Margin checkout negatif (${marginText}) dengan potensi rugi Rp ${Math.round(cartProfitability.projectedLossAmount).toLocaleString("id-ID")}`
          );
        }

        if (hasLowMarginRisk && marginPercent !== null) {
          reasonParts.push(
            `Margin checkout ${marginPercent.toFixed(1)}% di bawah batas minimum ${minimumMarginThreshold}%`
          );
        }
      }

      const contextHash = `${approvalType}|${discountPercent}|${subtotal}|${Math.round(loyaltyRedeemAmount)}|${appliedRedeemedPoints}|${total}|${Math.round(projectedLossAmount)}|${cartProfitability.riskyItemCount}|${minimumMarginThreshold}|${marginPercent === null ? "-" : marginPercent.toFixed(2)}|${cart
        .map((item) => `${item.id}:${item.qty}:${item.price}:${item.costPrice ?? 0}`)
        .join(";")}`;

      const marginRiskLabel = hasLowMarginRisk && !cartProfitability.hasNegativeMargin && cartProfitability.riskyItemLossAmount <= 0
        ? `margin di bawah ${minimumMarginThreshold}%`
        : "berisiko rugi";

      const pendingApprovalMessage = hasCombinedRisk
        ? `Diskon besar dan transaksi ${marginRiskLabel} menunggu approval manager/owner.`
        : requiresMarginRiskApproval
          ? `Transaksi ${marginRiskLabel} menunggu approval manager/owner.`
          : "Diskon besar menunggu approval manager/owner.";
      const rejectedApprovalMessage = hasCombinedRisk
        ? `Approval transaksi diskon besar dan ${marginRiskLabel} ditolak. Sesuaikan harga/discount atau hubungi manager.`
        : requiresMarginRiskApproval
          ? `Approval transaksi ${marginRiskLabel} ditolak. Sesuaikan harga item atau hubungi manager.`
          : "Approval diskon ditolak. Ubah diskon atau hubungi manager.";
      const newApprovalMessage = hasCombinedRisk
        ? `Diskon besar dan transaksi ${marginRiskLabel} harus disetujui manager/owner sebelum checkout.`
        : requiresMarginRiskApproval
          ? `Transaksi ${marginRiskLabel} harus disetujui manager/owner sebelum checkout.`
          : "Diskon besar harus disetujui manager/owner sebelum checkout.";

      const existingRequest = discountApprovalRequestId
        ? findApprovalRequestById(discountApprovalRequestId, storageScope)
        : null;

      if (existingRequest && existingRequest.contextHash === contextHash) {
        if (existingRequest.status === "pending") {
          setCheckoutError(pendingApprovalMessage);
          return;
        }
        if (existingRequest.status === "rejected") {
          setDiscountApprovalRequestId("");
          setCheckoutError(rejectedApprovalMessage);
          return;
        }
      } else {
        const request = createApprovalRequest(
          {
            type: approvalType,
            requestedBy: authUser?.fullName || "Kasir",
            requestedRole: role,
            reason: reasonParts.join(" • "),
            contextHash,
            subtotal,
            discountPercent,
            discountAmount: discountAmount + loyaltyRedeemAmount,
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
          reasonParts.join(" • ")
        );
        setCheckoutError(newApprovalMessage);
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
  }, [discountPercent, subtotal, cart.length, redeemedPoints, selectedCustomerId]);

  const { lowStockItems } = useLowStockAlerts(productCatalog);
  const lowStockCount = lowStockItems.length;

  const outOfStockCount = useMemo(
    () => productCatalog.filter((item) => item.stock === 0).length,
    [productCatalog]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.qty, 0),
    [cart]
  );

  const pendingCartDraftSummary = useMemo(() => {
    if (!pendingCartDraft) return null;

    return {
      updatedAt: pendingCartDraft.updatedAt,
      itemCount: pendingCartDraft.items.reduce((acc, item) => acc + item.qty, 0),
      subtotal: pendingCartDraft.items.reduce((acc, item) => acc + item.qty * item.price, 0)
    };
  }, [pendingCartDraft]);

  const handleSectionChange = (section: ActiveSection) => {
    if (!roleAllowedSections.includes(section)) return;
    setActiveSection(section);
  };

  const handleSelectCustomer = (id: string | undefined) => {
    setSelectedCustomerId(id);
    if (!id) {
      setRedeemedPoints(0);
    }
    setCheckoutError("");
  };

  const handleRedeemedPointsChange = (value: number) => {
    setRedeemedPoints(Math.max(0, Math.round(Number(value || 0))));
    setCheckoutError("");
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

  const handleApplySplitPaymentPreset = (next: PaymentBreakdown) => {
    const normalized: PaymentBreakdown = {
      cash: Math.max(0, Number(next.cash || 0)),
      card: Math.max(0, Number(next.card || 0)),
      qris: Math.max(0, Number(next.qris || 0))
    };

    setIsSplitPayment(true);
    setSplitPayment(normalized);
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
    const normalizedClosingCash = Math.max(0, Number(closingCash || 0));
    const normalizedNote = note.trim();
    const variance = Math.round(normalizedClosingCash - activeShiftCashSummary.expectedClosingCash);
    const varianceLabel = variance === 0
      ? "selisih Rp 0"
      : `selisih ${variance > 0 ? "+" : "-"}Rp ${Math.abs(variance).toLocaleString("id-ID")}`;

    if (Math.abs(variance) >= SHIFT_VARIANCE_REQUIRES_NOTE && normalizedNote.length === 0) {
      throw new Error(
        `Selisih kas >= Rp ${SHIFT_VARIANCE_REQUIRES_NOTE.toLocaleString("id-ID")}. Isi catatan penutupan untuk alasan selisih.`
      );
    }

    const closingNote = normalizedNote.length > 0
      ? `${normalizedNote} • ${varianceLabel}`
      : varianceLabel;

    const session = closeShift(normalizedClosingCash, closingNote, storageScope, authUser?.fullName);
    refreshShiftState();
    writeAudit(
      "shift_closed",
      "shift",
      session.id,
      `Saldo akhir Rp ${normalizedClosingCash.toLocaleString("id-ID")} • Ekspektasi Rp ${Math.round(activeShiftCashSummary.expectedClosingCash).toLocaleString("id-ID")} • ${varianceLabel}`
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

  const applySaleLoyaltyRollback = (sale: {
    customerId?: string;
    earnedPoints?: number;
    redeemedPoints?: number;
  }) => {
    if (!sale.customerId) return "";

    const earned = Math.max(0, Math.round(Number(sale.earnedPoints || 0)));
    const redeemed = Math.max(0, Math.round(Number(sale.redeemedPoints || 0)));
    const pointsDelta = earned - redeemed;

    if (pointsDelta === 0) return "";

    const customerExists = customers.some((customer) => customer.id === sale.customerId);
    if (!customerExists) return "";

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === sale.customerId
          ? {
              ...customer,
              loyalty_points: Math.max(0, customer.loyalty_points - pointsDelta)
            }
          : customer
      )
    );

    const rollbackPoints = -pointsDelta;
    return `Loyalty ${rollbackPoints >= 0 ? "+" : ""}${rollbackPoints} poin`;
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
    const loyaltyRollbackDetail = applySaleLoyaltyRollback(sale);
    refreshSalesState();
    writeAudit(
      "sale_refunded",
      "sale",
      saleId,
      loyaltyRollbackDetail ? `${reason} • ${loyaltyRollbackDetail}` : reason
    );
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
    const loyaltyRollbackDetail = applySaleLoyaltyRollback(sale);
    refreshSalesState();
    writeAudit(
      "sale_voided",
      "sale",
      saleId,
      loyaltyRollbackDetail ? `${reason} • ${loyaltyRollbackDetail}` : reason
    );
  };

  const handleResolveApprovalRequest = async (
    requestId: string,
    decision: ApprovalDecision,
    note: string
  ) => {
    if (role === "manager" && !managerSettings.allowApprovalDecision) {
      throw new Error("Owner menonaktifkan izin approval untuk manager.");
    }

    const resolved = resolveApprovalRequest(
      requestId,
      decision,
      authUser?.fullName || role,
      note,
      storageScope
    );

    let approvalLoyaltyDetail = "";

    if (decision === "approved" && resolved.saleId && (resolved.type === "refund" || resolved.type === "void")) {
      const sale = readSaleById(resolved.saleId, storageScope);
      if (sale && sale.status === "completed") {
        const status = resolved.type === "refund" ? "refunded" : "voided";
        updateLocalSaleStatus(resolved.saleId, status, storageScope, {
          approvalRequestId: resolved.id,
          approvedBy: authUser?.fullName
        });
        setProductCatalog((current) => applyStockReturn(current, sale.items));
        approvalLoyaltyDetail = applySaleLoyaltyRollback(sale);
      }
    }

    if (decision === "approved" && (resolved.type === "large-discount" || resolved.type === "loss-risk")) {
      setCheckoutError("Approval checkout disetujui. Lanjutkan checkout.");
    }

    refreshApprovalState();
    refreshSalesState();
    writeAudit(
      decision === "approved" ? "approval_approved" : "approval_rejected",
      "approval",
      resolved.id,
      `${resolved.type} • ${note || "tanpa catatan"}${
        approvalLoyaltyDetail ? ` • ${approvalLoyaltyDetail}` : ""
      }`
    );
  };

  const handleUpdateApprovalRules = (input: {
    largeDiscountPercentThreshold: number;
    minimumMarginPercentThreshold: number;
    requireRefundApproval: boolean;
    requireVoidApproval: boolean;
  }) => {
    const next = saveApprovalRules(input, authUser?.fullName || role, storageScope);
    setApprovalRules(next);
    writeAudit(
      "approval_rules_updated",
      "approval-rules",
      undefined,
      `Diskon > ${next.largeDiscountPercentThreshold}% | Margin min ${next.minimumMarginPercentThreshold}% | Refund ${next.requireRefundApproval ? "wajib" : "langsung"} | Void ${next.requireVoidApproval ? "wajib" : "langsung"}`
    );
  };

  const handleUpdateManagerSettings = (input: ManagerSystemSettingsInput) => {
    const next = saveManagerSystemSettings(input, authUser?.fullName || role, storageScope);
    setManagerSettings(next);
    writeAudit(
      "manager_settings_updated",
      "manager-settings",
      undefined,
      `Menu manager: laporan ${next.showReportsSection ? "on" : "off"}, riwayat ${next.showHistorySection ? "on" : "off"}, stok ${next.showProductsSection ? "on" : "off"}, pelanggan ${next.showCustomersSection ? "on" : "off"}`
    );
  };

  const handleCreateCustomer = (input: {
    name: string;
    phone?: string;
    email?: string;
    memberTier?: Customer["member_tier"];
  }) => {
    if (!hasCustomersAccess) {
      throw new Error("Akun ini tidak punya akses untuk menambah pelanggan.");
    }

    const normalizedName = input.name.trim();
    if (!normalizedName) {
      throw new Error("Nama pelanggan wajib diisi.");
    }

    const normalizedPhone = input.phone?.trim() || undefined;
    const normalizedEmail = input.email?.trim().toLowerCase() || undefined;
    const normalizedTier = input.memberTier ?? "Silver";

    if (normalizedPhone && customers.some((customer) => customer.phone?.trim() === normalizedPhone)) {
      throw new Error("Nomor telepon sudah terdaftar untuk pelanggan lain.");
    }

    if (normalizedEmail && customers.some((customer) => customer.email?.trim().toLowerCase() === normalizedEmail)) {
      throw new Error("Email sudah terdaftar untuk pelanggan lain.");
    }

    const customerId = `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    setCustomers((current) => [
      {
        id: customerId,
        name: normalizedName,
        phone: normalizedPhone,
        email: normalizedEmail,
        loyalty_points: 0,
        member_tier: normalizedTier,
        outstanding_debt: 0
      },
      ...current
    ]);

    writeAudit(
      "customer_created",
      "customer",
      customerId,
      `${normalizedName} • Tier ${normalizedTier}${normalizedPhone ? ` • ${normalizedPhone}` : ""}`
    );
  };

  const handleUpdateCustomerTier = (customerId: string, tier: Customer["member_tier"]) => {
    if (!hasCustomersAccess) {
      throw new Error("Akun ini tidak punya akses untuk mengubah tier pelanggan.");
    }

    const targetCustomer = customers.find((customer) => customer.id === customerId);
    if (!targetCustomer) {
      throw new Error("Pelanggan tidak ditemukan.");
    }

    if (targetCustomer.member_tier === tier) {
      return;
    }

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              member_tier: tier
            }
          : customer
      )
    );

    writeAudit(
      "customer_tier_updated",
      "customer",
      customerId,
      `${targetCustomer.name} • ${targetCustomer.member_tier} -> ${tier}`
    );
  };

  const handleSettleCustomerDebt = (customerId: string) => {
    if (!hasCustomersAccess) {
      throw new Error("Akun ini tidak punya akses untuk melunasi kasbon pelanggan.");
    }

    const targetCustomer = customers.find((customer) => customer.id === customerId);
    if (!targetCustomer) {
      throw new Error("Pelanggan tidak ditemukan.");
    }

    const currentDebt = Math.max(0, Number(targetCustomer.outstanding_debt || 0));
    if (currentDebt <= 0) {
      return;
    }

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              outstanding_debt: 0
            }
          : customer
      )
    );

    writeAudit(
      "customer_debt_settled",
      "customer",
      customerId,
      `${targetCustomer.name} • Pelunasan Rp ${Math.round(currentDebt).toLocaleString("id-ID")}`
    );
  };

  const handleAuthSuccess = (user: AuthenticatedUser) => {
    setAuthUser(user);
    if (user.role === "manager") {
      const fallbackSection = managerVisibleSections[0] ?? "reports";
      setActiveSection(fallbackSection);
      return;
    }

    setActiveSection(defaultSectionByRole[user.role]);
  };

  const handleLogout = async () => {
    await signOutUser();
    setAuthUser(null);
    setActiveSection("cashier");
    setCart([]);
    setSelectedCustomerId(undefined);
    setRedeemedPoints(0);
    setPendingCartDraft(null);
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
        storageScopeKey: storageScope,
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
        cartEstimatedCost: Math.round(cartProfitability.estimatedCost),
        cartGrossProfit: Math.round(cartProfitability.grossProfit),
        cartGrossMarginPercent: cartProfitability.grossMarginPercent,
        cartHasNegativeMargin: cartProfitability.hasNegativeMargin,
        cartProjectedLossAmount: Math.round(cartProfitability.projectedLossAmount),
        discountApprovalThreshold,
        cartMinimumMarginThreshold: minimumMarginThreshold,
        cartBelowMinimumMarginThreshold,
        todayRevenue,
        lowStockCount,
        lowStockItems,
        outOfStockCount,
        checkoutError,
        productCatalog,
        customers,
        selectedCustomerId,
        selectedCustomerLoyaltyPoints: selectedCustomer
          ? Math.max(0, Math.round(Number(selectedCustomer.loyalty_points || 0)))
          : 0,
        selectedCustomerMemberTier: selectedCustomer?.member_tier,
        selectedCustomerLoyaltyMultiplier,
        estimatedEarnedPoints,
        selectedCustomerOutstandingDebt: selectedCustomer
          ? Math.max(0, Number(selectedCustomer.outstanding_debt || 0))
          : 0,
        loyaltyPointValue: LOYALTY_POINT_VALUE,
        redeemedPoints: appliedRedeemedPoints,
        loyaltyRedeemAmount: Math.round(loyaltyRedeemAmount),
        maxRedeemablePoints,
        onSelectCustomer: handleSelectCustomer,
        onRedeemedPointsChange: handleRedeemedPointsChange,
        heldOrders,
        pendingCartDraftSummary,
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
        shiftExpectedClosingCash: activeShift ? activeShiftCashSummary.expectedClosingCash : null,
        shiftCashSalesTotal: activeShiftCashSummary.cashSalesTotal,
        shiftVarianceThreshold: SHIFT_VARIANCE_REQUIRES_NOTE,
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
        onApplySplitPaymentPreset: handleApplySplitPaymentPreset,
        onCashReceivedChange: setCashReceived,
        onOpenShift: handleOpenShift,
        onCloseShift: handleCloseShift,
        onAddCashMovement: handleAddCashMovement,
        onIncreaseQty: increaseQty,
        onDecreaseQty: decreaseQty,
        onRemoveItem: removeItem,
        onHoldOrder: holdOrder,
        onResumeOrder: resumeOrder,
        onDiscardHoldOrder: discardHeldOrder,
        onDiscardExpiredHoldOrders: discardExpiredHeldOrders,
        onClearAllHoldOrders: clearAllHeldOrders,
        onRestoreCartDraft: restoreCartDraft,
        onDiscardCartDraft: discardCartDraft,
        onClear: clearCart,
        onCheckout: requestCheckout,
        onPrintReceipt: printReceipt,
        onRequestRefund: handleRequestRefund,
        onRequestVoid: handleRequestVoid,
        onUpsertProduct: upsertProduct,
        onDeleteProduct: deleteProduct,
        onResolveApprovalRequest: handleResolveApprovalRequest,
        onUpdateApprovalRules: handleUpdateApprovalRules,
        onUpdateManagerSettings: handleUpdateManagerSettings,
        onRefreshManagedUsers: () => {
          void refreshManagedUsers();
        },
        onCreateManagedUser: handleCreateManagedUser,
        onUpdateManagedUser: handleUpdateManagedUser,
        onCreateCustomer: handleCreateCustomer,
        onUpdateCustomerTier: handleUpdateCustomerTier,
        onSettleCustomerDebt: handleSettleCustomerDebt,
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
