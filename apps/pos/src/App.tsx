import { useEffect, useMemo, useState } from "react";
import { products } from "./localData";
import { readLocalSales, readProducts, readRecentSales, saveLocalSale, saveProducts, applyStockDeduction } from "./database";
import { syncPendingSales } from "./sync";
import { env } from "./config";
import { CheckoutConfirmModal } from "./components/CheckoutConfirmModal";
import type { HeldOrder } from "./components/HoldOrdersBar";
import type { ProductItem } from "./localData";
import { TopHeader } from "./components/TopHeader";
import { CashierPage } from "./pages/CashierPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersPage } from "./pages/UsersPage";
import type { ActiveSection, CartItem, PaymentMethod, UserRole } from "./types";
import { AuthScreen } from "./components/AuthScreen";
import {
  createManagedUser,
  getCurrentAuthUser,
  listManagedUsers,
  signOutUser,
  updateManagedUser,
  type AuthenticatedUser,
  type ManagedUser,
  type ManagedUserRole
} from "./auth";

const allowedSectionsByRole: Record<UserRole, ActiveSection[]> = {
  cashier: ["cashier"],
  manager: ["products", "reports"],
  owner: ["reports", "users"]
};

const defaultSectionByRole: Record<UserRole, ActiveSection> = {
  cashier: "cashier",
  manager: "products",
  owner: "reports"
};

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>("cashier");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productCatalog, setProductCatalog] = useState<ProductItem[]>(products);
  const [pendingSales, setPendingSales] = useState<number>(0);
  const [recentSales, setRecentSales] = useState(() => readRecentSales(6));
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState<boolean>(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [checkoutError, setCheckoutError] = useState<string>("");
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const storageScope = authUser?.tenantId || env.VITE_TENANT_ID || "default";
  const role: UserRole = authUser?.role ?? "cashier";
  const hasProductAccess = role === "manager";
  const hasReportsAccess = role === "owner" || role === "manager";
  const hasOwnerAccess = role === "owner";

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
    setProductCatalog(readProducts(products, storageScope));
    setPendingSales(readLocalSales(storageScope).filter((sale) => !sale.synced).length);
    setRecentSales(readRecentSales(6, storageScope));
    setCart([]);
    setHeldOrders([]);
    setDiscountPercent(0);
    setPaymentMethod("cash");
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
      setPendingSales(result.pending);
      setRecentSales(readRecentSales(6, storageScope));
      setIsSyncing(false);
    })();
  }, [isOnline, authUser?.tenantId, storageScope]);

  useEffect(() => {
    if (paymentMethod !== "cash") {
      setCashReceived(0);
    }
  }, [paymentMethod]);

  useEffect(() => {
    const allowedSections = allowedSectionsByRole[role];
    if (!allowedSections.includes(activeSection)) {
      setActiveSection(defaultSectionByRole[role]);
    }
  }, [role, activeSection]);

  useEffect(() => {
    if (!hasOwnerAccess) {
      setManagedUsers([]);
      setUsersError("");
      return;
    }

    let cancelled = false;

    void (async () => {
      setUsersLoading(true);
      setUsersError("");

      try {
        const users = await listManagedUsers();
        if (!cancelled) {
          setManagedUsers(users);
        }
      } catch (err) {
        if (!cancelled) {
          setUsersError(err instanceof Error ? err.message : "Gagal memuat akun staf.");
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasOwnerAccess, authUser?.tenantId]);

  const addItem = (id: string, name: string, price: number) => {
    const item = productCatalog.find((product) => product.id === id);
    if (!item || item.stock <= 0) return;

    setCart((current) => {
      const existing = current.find((item) => item.id === id);
      if (!existing) return [...current, { id, name, price, qty: 1 }];
      return current.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      );
    });
  };

  const clearCart = () => setCart([]);

  const holdOrder = () => {
    if (cart.length === 0) return;

    const held: HeldOrder = {
      id: `HOLD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      itemCount: cart.reduce((acc, item) => acc + item.qty, 0),
      subtotal,
      discountPercent,
      paymentMethod,
      items: cart
    };

    setHeldOrders((current) => [held, ...current].slice(0, 10));
    clearCart();
    setDiscountPercent(0);
    setPaymentMethod("cash");
    setCashReceived(0);
    setCheckoutError("");
  };

  const resumeOrder = (id: string) => {
    const selected = heldOrders.find((order) => order.id === id);
    if (!selected) return;

    setCart(selected.items);
    setDiscountPercent(selected.discountPercent);
    setPaymentMethod(selected.paymentMethod);
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

  const checkout = async () => {
    if (cart.length === 0) return;

    setProductCatalog((current) => applyStockDeduction(current, cart));

    saveLocalSale({
      id: `SALE-${Date.now()}`,
      subtotal,
      discountPercent,
      discountAmount,
      total,
      paymentMethod,
      createdAt: new Date().toISOString(),
      items: cart
    }, storageScope);
    clearCart();
    setDiscountPercent(0);
    setPaymentMethod("cash");
    setCashReceived(0);

    setIsSyncing(true);
    const result = await syncPendingSales({
      supabaseUrl: env.VITE_SUPABASE_URL,
      supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
      tenantId: authUser?.tenantId || env.VITE_TENANT_ID,
      scopeKey: storageScope
    });

    setPendingSales(result.pending);
    setRecentSales(readRecentSales(6, storageScope));
    setIsSyncing(false);
    setShowCheckoutConfirm(false);
  };

  const upsertProduct = (product: ProductItem) => {
    setProductCatalog((current) => {
      const exists = current.some((item) => item.id === product.id);
      if (!exists) return [product, ...current];
      return current.map((item) => (item.id === product.id ? product : item));
    });
  };

  const deleteProduct = (id: string) => {
    setProductCatalog((current) => current.filter((item) => item.id !== id));
  };

  const printReceipt = (saleId: string) => {
    const sale = readLocalSales(storageScope).find((item) => item.id === saleId);
    if (!sale) return;

    const popup = window.open("", "_blank", "width=360,height=600");
    if (!popup) return;

    const rows = sale.items
      .map((item) => `<tr><td>${item.name}</td><td>${item.qty}</td><td>Rp ${(item.price * item.qty).toLocaleString("id-ID")}</td></tr>`)
      .join("");

    popup.document.write(`
      <html>
        <head><title>Struk ${sale.id}</title></head>
        <body style="font-family:Arial,sans-serif;padding:16px;">
          <h3>POS Terminal</h3>
          <p>ID: ${sale.id}<br/>Tanggal: ${new Date(sale.createdAt).toLocaleString("id-ID")}</p>
          <table width="100%" border="0" cellspacing="0" cellpadding="4">
            <thead><tr><th align="left">Produk</th><th align="left">Qty</th><th align="left">Subtotal</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <hr/>
          <p>Subtotal: Rp ${sale.subtotal.toLocaleString("id-ID")}<br/>
          Diskon: Rp ${sale.discountAmount.toLocaleString("id-ID")}<br/>
          Total: Rp ${sale.total.toLocaleString("id-ID")}<br/>
          Metode: ${sale.paymentMethod.toUpperCase()}</p>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const requestCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === "cash" && cashReceived < total) {
      setCheckoutError("Uang diterima belum cukup.");
      return;
    }
    setCheckoutError("");
    setShowCheckoutConfirm(true);
  };

  const todayRevenue = useMemo(
    () => recentSales.reduce((acc, sale) => acc + sale.total, 0),
    [recentSales]
  );

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    const raw = subtotal * (discountPercent / 100);
    return Math.min(raw, subtotal);
  }, [discountPercent, subtotal]);

  const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);
  const changeAmount = useMemo(() => Math.max(cashReceived - total, 0), [cashReceived, total]);

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

  const refreshManagedUsers = async () => {
    if (!hasOwnerAccess) return;

    setUsersLoading(true);
    setUsersError("");
    try {
      const users = await listManagedUsers();
      setManagedUsers(users);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Gagal memuat akun staf.");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateManagedUser = async (input: {
    email: string;
    password: string;
    fullName: string;
    role: ManagedUserRole;
  }) => {
    await createManagedUser(input);
    await refreshManagedUsers();
  };

  const handleUpdateManagedUser = async (input: {
    userId: string;
    role?: ManagedUserRole;
    isActive?: boolean;
    fullName?: string;
  }) => {
    await updateManagedUser(input);
    await refreshManagedUsers();
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
    setHeldOrders([]);
    setManagedUsers([]);
    setUsersError("");
  };

  if (!authReady) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6">
        <section className="mx-auto max-w-xl rounded-3xl bg-surface-container-low p-5 text-center editorial-shadow">
          <p className="text-sm font-medium text-on-surface-variant">Memuat akun POS...</p>
        </section>
      </main>
    );
  }

  if (!authUser) {
    return <AuthScreen onAuthenticated={handleAuthSuccess} />;
  }

  return (
    <main className="min-h-screen bg-background px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <TopHeader
          isOnline={isOnline}
          pendingSales={pendingSales}
          isSyncing={isSyncing}
          cartItemCount={cartItemCount}
          total={total}
          todayRevenue={todayRevenue}
          lowStockCount={lowStockCount}
          outOfStockCount={outOfStockCount}
          checkoutError={checkoutError}
          role={role}
          section={activeSection}
          userName={authUser.fullName}
          tenantName={authUser.tenantName}
          tenantCode={authUser.tenantCode}
          joinCode={hasOwnerAccess ? authUser.joinCode : undefined}
          onLogout={handleLogout}
          onSectionChange={handleSectionChange}
        />

        {activeSection === "cashier" && (
          <CashierPage
            products={productCatalog}
            heldOrders={heldOrders}
            sales={recentSales}
            cart={cart}
            subtotal={subtotal}
            discountPercent={discountPercent}
            discountAmount={discountAmount}
            total={total}
            paymentMethod={paymentMethod}
            cashReceived={cashReceived}
            changeAmount={changeAmount}
            isSyncing={isSyncing}
            onAddItem={addItem}
            onDiscountChange={setDiscountPercent}
            onPaymentMethodChange={setPaymentMethod}
            onCashReceivedChange={setCashReceived}
            onIncreaseQty={increaseQty}
            onDecreaseQty={decreaseQty}
            onRemoveItem={removeItem}
            onHoldOrder={holdOrder}
            onResumeOrder={resumeOrder}
            onClear={clearCart}
            onCheckout={requestCheckout}
            onPrintReceipt={printReceipt}
          />
        )}

        {hasProductAccess && activeSection === "products" && (
          <ProductsPage products={productCatalog} onUpsert={upsertProduct} onDelete={deleteProduct} />
        )}

        {hasReportsAccess && activeSection === "reports" && <ReportsPage sales={readLocalSales(storageScope)} />}

        {hasOwnerAccess && activeSection === "users" && (
          <UsersPage
            users={managedUsers}
            loading={usersLoading}
            error={usersError}
            onRefresh={() => {
              void refreshManagedUsers();
            }}
            onCreateUser={handleCreateManagedUser}
            onUpdateUser={handleUpdateManagedUser}
          />
        )}
      </div>
      <CheckoutConfirmModal
        open={showCheckoutConfirm}
        itemCount={cart.reduce((acc, item) => acc + item.qty, 0)}
        total={total}
        paymentMethod={paymentMethod}
        loading={isSyncing}
        onClose={() => setShowCheckoutConfirm(false)}
        onConfirm={checkout}
      />
    </main>
  );
}

export default App;
