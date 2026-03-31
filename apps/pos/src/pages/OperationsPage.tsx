import { useEffect, useMemo, useState } from "react";
import type { LocalSale } from "../database";
import type { ProductItem } from "../localData";
import {
  createOpsId,
  readOperationsDataset,
  writeOperationsDataset,
  type FailedProductEntry,
  type JournalEntry,
  type JournalType,
  type OperationsDataset,
  type OpsPromotion,
  type ProductBundle,
  type PromotionScheme,
  type Recipe,
  type RecipeStatus,
  type StockOpnameSession,
  type UnitConversion
} from "../operations";

type OperationsTab =
  | "materials"
  | "recipes"
  | "bundles"
  | "opname"
  | "journals"
  | "failed"
  | "promotions";

type OperationsPageProps = {
  storageScopeKey: string;
  products: ProductItem[];
  sales: LocalSale[];
  managerCanExportData: boolean;
  managerCanAdjustStock: boolean;
  onUpsertProduct?: (product: ProductItem) => void;
  initialTab?: OperationsTab;
};

const TAB_META: Array<{ key: OperationsTab; label: string; icon: string }> = [
  { key: "materials", label: "Bahan & Satuan", icon: "inventory_2" },
  { key: "recipes", label: "Resep", icon: "restaurant_menu" },
  { key: "bundles", label: "Bundle", icon: "deployed_code" },
  { key: "opname", label: "Stok Opname", icon: "fact_check" },
  { key: "journals", label: "Jurnal", icon: "book_2" },
  { key: "failed", label: "Produk Gagal", icon: "error" },
  { key: "promotions", label: "Promo", icon: "campaign" }
];

const inputClass =
  "h-10 rounded-xl border border-outline-variant/40 bg-white px-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const textareaClass =
  "min-h-[92px] rounded-xl border border-outline-variant/40 bg-white px-3 py-2 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function formatCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const content = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(","))
  ].join("\n");

  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getJournalSignedAmount(entry: JournalEntry) {
  if (entry.type === "income") return entry.amount;
  if (entry.type === "expense") return -entry.amount;
  return entry.amount;
}

function getRecipeFoodCost(recipe: Recipe, materialCostMap: Map<string, number>) {
  return recipe.ingredients.reduce((acc, ingredient) => {
    const unitCost = materialCostMap.get(ingredient.materialId) ?? 0;
    return acc + unitCost * ingredient.quantity;
  }, 0);
}

function getRecipeMarginPercent(recipe: Recipe, foodCost: number) {
  if (recipe.sellingPrice <= 0) return 0;
  return ((recipe.sellingPrice - foodCost) / recipe.sellingPrice) * 100;
}

export function OperationsPage({
  storageScopeKey,
  products,
  sales,
  managerCanExportData,
  managerCanAdjustStock,
  onUpsertProduct,
  initialTab = "materials"
}: OperationsPageProps) {
  const [activeTab, setActiveTab] = useState<OperationsTab>(initialTab);
  const [dataset, setDataset] = useState<OperationsDataset>(() => readOperationsDataset(storageScopeKey));
  const [feedback, setFeedback] = useState("");

  const [unitName, setUnitName] = useState("");
  const [unitAbbreviation, setUnitAbbreviation] = useState("");

  const [materialName, setMaterialName] = useState("");
  const [materialUnitId, setMaterialUnitId] = useState("UNIT-KG");
  const [materialStockQty, setMaterialStockQty] = useState("0");
  const [materialMinStockQty, setMaterialMinStockQty] = useState("0");
  const [materialCostPerUnit, setMaterialCostPerUnit] = useState("0");
  const [materialSupplierName, setMaterialSupplierName] = useState("");

  const [conversionFromUnitId, setConversionFromUnitId] = useState("UNIT-KG");
  const [conversionToUnitId, setConversionToUnitId] = useState("UNIT-G");
  const [conversionMultiplier, setConversionMultiplier] = useState("1000");
  const [conversionNote, setConversionNote] = useState("");

  const [recipeName, setRecipeName] = useState("");
  const [recipeProductId, setRecipeProductId] = useState("");
  const [recipeCategory, setRecipeCategory] = useState("Roti");
  const [recipeYield, setRecipeYield] = useState("1");
  const [recipeDuration, setRecipeDuration] = useState("60");
  const [recipeSellingPrice, setRecipeSellingPrice] = useState("0");
  const [recipeStatus, setRecipeStatus] = useState<RecipeStatus>("draft");
  const [recipeNotes, setRecipeNotes] = useState("");
  const [recipeIngredientDraft, setRecipeIngredientDraft] = useState<Record<string, string>>({});

  const [bundleName, setBundleName] = useState("");
  const [bundleDiscountPercent, setBundleDiscountPercent] = useState("0");
  const [bundleProductIds, setBundleProductIds] = useState<string[]>([]);
  const [bundleSelectedProductId, setBundleSelectedProductId] = useState("");

  const [opnameClosingNote, setOpnameClosingNote] = useState("");

  const [journalType, setJournalType] = useState<JournalType>("expense");
  const [journalCategory, setJournalCategory] = useState("Operasional");
  const [journalDescription, setJournalDescription] = useState("");
  const [journalAmount, setJournalAmount] = useState("0");

  const [failedProductName, setFailedProductName] = useState("");
  const [failedProductCatalogId, setFailedProductCatalogId] = useState("");
  const [failedProductQty, setFailedProductQty] = useState("1");
  const [failedProductReason, setFailedProductReason] = useState("");
  const [failedProductLoss, setFailedProductLoss] = useState("0");
  const [failedDeductStock, setFailedDeductStock] = useState(true);
  const [failedCreateJournal, setFailedCreateJournal] = useState(true);

  const [promoName, setPromoName] = useState("");
  const [promoScheme, setPromoScheme] = useState<PromotionScheme>("percent");
  const [promoValue, setPromoValue] = useState("0");
  const [promoStartDate, setPromoStartDate] = useState("");
  const [promoEndDate, setPromoEndDate] = useState("");
  const [promoActive, setPromoActive] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setDataset(readOperationsDataset(storageScopeKey));
    setFeedback("");
  }, [storageScopeKey]);

  useEffect(() => {
    writeOperationsDataset(dataset, storageScopeKey);
  }, [dataset, storageScopeKey]);

  const unitMap = useMemo(() => {
    return new Map(dataset.units.map((unit) => [unit.id, unit]));
  }, [dataset.units]);

  const materialMap = useMemo(() => {
    return new Map(dataset.materials.map((material) => [material.id, material]));
  }, [dataset.materials]);

  const materialCostMap = useMemo(() => {
    return new Map(dataset.materials.map((material) => [material.id, material.costPerUnit]));
  }, [dataset.materials]);

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const selectedFailedCatalogProduct = useMemo(
    () => (failedProductCatalogId ? productMap.get(failedProductCatalogId) ?? null : null),
    [failedProductCatalogId, productMap]
  );

  const failedComputedLossPreview = useMemo(() => {
    if (!selectedFailedCatalogProduct) return 0;
    const quantity = Math.max(0, Number(failedProductQty || 0));
    if (quantity <= 0) return 0;
    return selectedFailedCatalogProduct.costPrice * quantity;
  }, [selectedFailedCatalogProduct, failedProductQty]);

  const activeOpname = useMemo(
    () => dataset.stockOpnames.find((session) => !session.endedAt) ?? null,
    [dataset.stockOpnames]
  );

  const completedSalesTotal = useMemo(
    () => sales.filter((sale) => sale.status === "completed").reduce((acc, sale) => acc + sale.total, 0),
    [sales]
  );

  const lowMaterialCount = useMemo(
    () => dataset.materials.filter((material) => material.stockQty <= material.minStockQty).length,
    [dataset.materials]
  );

  const activeRecipeCount = useMemo(
    () => dataset.recipes.filter((recipe) => recipe.status === "active").length,
    [dataset.recipes]
  );

  const failedLossTotal = useMemo(
    () => dataset.failedProducts.reduce((acc, item) => acc + item.estimatedLoss, 0),
    [dataset.failedProducts]
  );

  const journalBalance = useMemo(
    () => dataset.journals.reduce((acc, entry) => acc + getJournalSignedAmount(entry), 0),
    [dataset.journals]
  );

  const journalIncome = useMemo(
    () => dataset.journals.filter((entry) => entry.type === "income").reduce((acc, entry) => acc + entry.amount, 0),
    [dataset.journals]
  );

  const journalExpense = useMemo(
    () => dataset.journals.filter((entry) => entry.type === "expense").reduce((acc, entry) => acc + entry.amount, 0),
    [dataset.journals]
  );

  const recipeMetrics = useMemo(() => {
    return dataset.recipes.map((recipe) => {
      const foodCost = getRecipeFoodCost(recipe, materialCostMap);
      const marginPercent = getRecipeMarginPercent(recipe, foodCost);
      return {
        recipe,
        foodCost,
        marginPercent
      };
    });
  }, [dataset.recipes, materialCostMap]);

  const upsertDataset = (updater: (current: OperationsDataset) => OperationsDataset) => {
    setDataset((current) => updater(current));
  };

  const clearMessageLater = () => {
    window.setTimeout(() => {
      setFeedback("");
    }, 2400);
  };

  const handleAddUnit = () => {
    const name = unitName.trim();
    const abbreviation = unitAbbreviation.trim();

    if (!name || !abbreviation) {
      setFeedback("Nama satuan dan singkatan wajib diisi.");
      clearMessageLater();
      return;
    }

    const duplicate = dataset.units.some(
      (unit) => unit.name.toLowerCase() === name.toLowerCase() || unit.abbreviation.toLowerCase() === abbreviation.toLowerCase()
    );

    if (duplicate) {
      setFeedback("Satuan dengan nama/singkatan tersebut sudah ada.");
      clearMessageLater();
      return;
    }

    const unitId = `UNIT-${abbreviation.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;

    upsertDataset((current) => ({
      ...current,
      units: [{ id: unitId, name, abbreviation }, ...current.units]
    }));

    setUnitName("");
    setUnitAbbreviation("");
    setMaterialUnitId(unitId);
    setFeedback("Satuan baru berhasil ditambahkan.");
    clearMessageLater();
  };

  const handleAddMaterial = () => {
    const name = materialName.trim();
    if (!name) {
      setFeedback("Nama bahan baku wajib diisi.");
      clearMessageLater();
      return;
    }

    if (!unitMap.has(materialUnitId)) {
      setFeedback("Satuan bahan baku tidak valid.");
      clearMessageLater();
      return;
    }

    const stockQty = Math.max(0, Number(materialStockQty || 0));
    const minStockQty = Math.max(0, Number(materialMinStockQty || 0));
    const costPerUnit = Math.max(0, Number(materialCostPerUnit || 0));
    const timestamp = new Date().toISOString();

    upsertDataset((current) => ({
      ...current,
      materials: [
        {
          id: createOpsId("MAT"),
          name,
          unitId: materialUnitId,
          stockQty,
          minStockQty,
          costPerUnit,
          supplierName: materialSupplierName.trim() || undefined,
          createdAt: timestamp,
          updatedAt: timestamp
        },
        ...current.materials
      ]
    }));

    setMaterialName("");
    setMaterialStockQty("0");
    setMaterialMinStockQty("0");
    setMaterialCostPerUnit("0");
    setMaterialSupplierName("");
    setFeedback("Bahan baku berhasil ditambahkan.");
    clearMessageLater();
  };

  const handleAddConversion = () => {
    const multiplier = Number(conversionMultiplier || 0);

    if (!unitMap.has(conversionFromUnitId) || !unitMap.has(conversionToUnitId) || conversionFromUnitId === conversionToUnitId) {
      setFeedback("Pilih pasangan satuan konversi yang valid.");
      clearMessageLater();
      return;
    }

    if (multiplier <= 0) {
      setFeedback("Nilai konversi harus lebih besar dari 0.");
      clearMessageLater();
      return;
    }

    const nextConversion: UnitConversion = {
      id: createOpsId("CONV"),
      fromUnitId: conversionFromUnitId,
      toUnitId: conversionToUnitId,
      multiplier,
      note: conversionNote.trim() || undefined
    };

    upsertDataset((current) => ({
      ...current,
      conversions: [nextConversion, ...current.conversions]
    }));

    setConversionMultiplier("1");
    setConversionNote("");
    setFeedback("Konversi satuan berhasil ditambahkan.");
    clearMessageLater();
  };

  const handleRecipeIngredientChange = (materialId: string, value: string) => {
    setRecipeIngredientDraft((current) => ({
      ...current,
      [materialId]: value
    }));
  };

  const handleAddRecipe = () => {
    const name = recipeName.trim();
    if (!name) {
      setFeedback("Nama resep wajib diisi.");
      clearMessageLater();
      return;
    }

    const ingredients = dataset.materials
      .map((material) => {
        const quantity = Math.max(0, Number(recipeIngredientDraft[material.id] || 0));
        if (quantity <= 0) return null;
        return {
          materialId: material.id,
          quantity
        };
      })
      .filter((ingredient): ingredient is Recipe["ingredients"][number] => ingredient !== null);

    if (ingredients.length === 0) {
      setFeedback("Minimal pilih 1 bahan untuk resep.");
      clearMessageLater();
      return;
    }

    const now = new Date().toISOString();

    const recipe: Recipe = {
      id: createOpsId("RCP"),
      productId: recipeProductId || undefined,
      name,
      category: recipeCategory.trim() || "Resep",
      yieldPortions: Math.max(1, Math.round(Number(recipeYield || 1))),
      durationMinutes: Math.max(0, Math.round(Number(recipeDuration || 0))),
      sellingPrice: Math.max(0, Number(recipeSellingPrice || 0)),
      status: recipeStatus,
      ingredients,
      notes: recipeNotes.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    upsertDataset((current) => ({
      ...current,
      recipes: [recipe, ...current.recipes]
    }));

    setRecipeName("");
    setRecipeProductId("");
    setRecipeCategory("Roti");
    setRecipeYield("1");
    setRecipeDuration("60");
    setRecipeSellingPrice("0");
    setRecipeStatus("draft");
    setRecipeNotes("");
    setRecipeIngredientDraft({});
    setFeedback("Resep berhasil ditambahkan.");
    clearMessageLater();
  };

  const handleAddBundleProduct = () => {
    if (!bundleSelectedProductId) return;

    setBundleProductIds((current) => {
      if (current.includes(bundleSelectedProductId)) return current;
      return [...current, bundleSelectedProductId];
    });
  };

  const handleRemoveBundleProduct = (productId: string) => {
    setBundleProductIds((current) => current.filter((id) => id !== productId));
  };

  const handleAddBundle = () => {
    const name = bundleName.trim();
    if (!name) {
      setFeedback("Nama bundle wajib diisi.");
      clearMessageLater();
      return;
    }

    if (bundleProductIds.length < 2) {
      setFeedback("Bundle minimal berisi 2 produk.");
      clearMessageLater();
      return;
    }

    const now = new Date().toISOString();

    const bundle: ProductBundle = {
      id: createOpsId("BND"),
      name,
      productIds: bundleProductIds,
      discountPercent: Math.max(0, Math.min(100, Number(bundleDiscountPercent || 0))),
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    upsertDataset((current) => ({
      ...current,
      bundles: [bundle, ...current.bundles]
    }));

    setBundleName("");
    setBundleDiscountPercent("0");
    setBundleProductIds([]);
    setFeedback("Bundle produk berhasil ditambahkan.");
    clearMessageLater();
  };

  const handleStartOpname = () => {
    if (activeOpname) {
      setFeedback("Masih ada sesi opname aktif. Selesaikan terlebih dahulu.");
      clearMessageLater();
      return;
    }

    if (dataset.materials.length === 0) {
      setFeedback("Tambahkan bahan baku terlebih dulu sebelum opname.");
      clearMessageLater();
      return;
    }

    const startedAt = new Date().toISOString();
    const session: StockOpnameSession = {
      id: createOpsId("OPN"),
      startedAt,
      items: dataset.materials.map((material) => ({
        id: createOpsId("OPNITEM"),
        materialId: material.id,
        systemQty: material.stockQty,
        countedQty: material.stockQty,
        variance: 0
      }))
    };

    upsertDataset((current) => ({
      ...current,
      stockOpnames: [session, ...current.stockOpnames]
    }));

    setFeedback("Sesi stock opname dimulai.");
    clearMessageLater();
  };

  const handleUpdateOpnameCount = (materialId: string, countedValue: string) => {
    const countedQty = Math.max(0, Number(countedValue || 0));

    upsertDataset((current) => {
      const session = current.stockOpnames.find((entry) => !entry.endedAt);
      if (!session) return current;

      return {
        ...current,
        stockOpnames: current.stockOpnames.map((entry) => {
          if (entry.id !== session.id) return entry;

          return {
            ...entry,
            items: entry.items.map((item) => {
              if (item.materialId !== materialId) return item;
              return {
                ...item,
                countedQty,
                variance: countedQty - item.systemQty
              };
            })
          };
        })
      };
    });
  };

  const handleFinishOpname = () => {
    upsertDataset((current) => {
      const session = current.stockOpnames.find((entry) => !entry.endedAt);
      if (!session) return current;

      const closedAt = new Date().toISOString();
      const stockByMaterial = new Map(session.items.map((item) => [item.materialId, item.countedQty]));
      const varianceValue = session.items.reduce((acc, item) => {
        if (item.variance === 0) return acc;
        const material = current.materials.find((entry) => entry.id === item.materialId);
        const unitCost = material?.costPerUnit ?? 0;
        return acc + item.variance * unitCost;
      }, 0);
      const varianceItemCount = session.items.filter((item) => item.variance !== 0).length;
      const varianceAmount = Math.round(Math.abs(varianceValue));

      const opnameJournal: JournalEntry | null =
        varianceAmount > 0
          ? {
              id: createOpsId("JRN"),
              createdAt: closedAt,
              type: varianceValue < 0 ? "expense" : "income",
              category: "Stock Opname",
              description: `${session.id} • ${varianceItemCount} item selisih${opnameClosingNote.trim() ? ` • ${opnameClosingNote.trim()}` : ""}`,
              amount: varianceAmount,
              referenceId: session.id
            }
          : null;

      return {
        ...current,
        stockOpnames: current.stockOpnames.map((entry) => {
          if (entry.id !== session.id) return entry;
          return {
            ...entry,
            endedAt: closedAt,
            notes: opnameClosingNote.trim() || entry.notes
          };
        }),
        materials: current.materials.map((material) => {
          const countedQty = stockByMaterial.get(material.id);
          if (countedQty === undefined) return material;

          return {
            ...material,
            stockQty: Math.max(0, countedQty),
            updatedAt: closedAt
          };
        }),
        journals: opnameJournal ? [opnameJournal, ...current.journals] : current.journals
      };
    });

    setOpnameClosingNote("");
    setFeedback("Sesi opname selesai, stok bahan diperbarui, dan jurnal selisih dibuat bila ada nilai perbedaan.");
    clearMessageLater();
  };

  const handleAddJournal = () => {
    const amount = Math.max(0, Number(journalAmount || 0));
    if (amount <= 0) {
      setFeedback("Nominal jurnal harus lebih besar dari 0.");
      clearMessageLater();
      return;
    }

    const entry: JournalEntry = {
      id: createOpsId("JRN"),
      createdAt: new Date().toISOString(),
      type: journalType,
      category: journalCategory.trim() || "Lainnya",
      description: journalDescription.trim() || "-",
      amount
    };

    upsertDataset((current) => ({
      ...current,
      journals: [entry, ...current.journals]
    }));

    setJournalDescription("");
    setJournalAmount("0");
    setFeedback("Jurnal berhasil ditambahkan.");
    clearMessageLater();
  };

  const handleAddFailedProduct = () => {
    const linkedProduct = selectedFailedCatalogProduct;
    const productName = failedProductName.trim() || linkedProduct?.name || "";
    const quantity = Math.max(0, Number(failedProductQty || 0));
    const estimatedLossInput = Math.max(0, Number(failedProductLoss || 0));
    const estimatedLoss = estimatedLossInput > 0
      ? estimatedLossInput
      : linkedProduct
        ? linkedProduct.costPrice * quantity
        : 0;

    if (!productName || quantity <= 0) {
      setFeedback("Nama produk gagal dan kuantitas wajib diisi.");
      clearMessageLater();
      return;
    }

    if (failedProductCatalogId && !linkedProduct) {
      setFeedback("Produk katalog tidak ditemukan. Pilih ulang produk terkait.");
      clearMessageLater();
      return;
    }

    const stockDeductedQty = failedDeductStock && linkedProduct && managerCanAdjustStock
      ? Math.min(quantity, Math.max(0, linkedProduct.stock))
      : 0;

    const timestamp = new Date().toISOString();
    const failedEntryId = createOpsId("FAIL");

    const entry: FailedProductEntry = {
      id: failedEntryId,
      createdAt: timestamp,
      productName,
      productId: linkedProduct?.id,
      quantity,
      stockDeductedQty: stockDeductedQty > 0 ? stockDeductedQty : undefined,
      reason: failedProductReason.trim() || "Tidak lolos QC",
      estimatedLoss
    };

    upsertDataset((current) => ({
      ...current,
      failedProducts: [entry, ...current.failedProducts],
      journals:
        failedCreateJournal && estimatedLoss > 0
          ? [
              {
                id: createOpsId("JRN"),
                createdAt: timestamp,
                type: "expense",
                category: "Produk Gagal",
                description: `${productName} • Qty ${quantity} • ${entry.reason}`,
                amount: estimatedLoss,
                referenceId: failedEntryId
              },
              ...current.journals
            ]
          : current.journals
    }));

    if (stockDeductedQty > 0 && linkedProduct && onUpsertProduct) {
      onUpsertProduct({
        ...linkedProduct,
        stock: Math.max(0, linkedProduct.stock - stockDeductedQty)
      });
    }

    setFailedProductCatalogId("");
    setFailedProductName("");
    setFailedProductQty("1");
    setFailedProductReason("");
    setFailedProductLoss("0");
    setFailedDeductStock(true);
    setFailedCreateJournal(true);

    const stockMessage = failedDeductStock && linkedProduct
      ? managerCanAdjustStock
        ? stockDeductedQty > 0
          ? ` Stok ${stockDeductedQty} unit dipotong.`
          : " Stok tidak berubah (stok sudah 0)."
        : " Stok katalog tidak dipotong karena izin adjust stok nonaktif."
      : "";
    const journalMessage = failedCreateJournal && estimatedLoss > 0
      ? " Jurnal expense otomatis dibuat."
      : "";

    setFeedback(`Produk gagal tercatat.${stockMessage}${journalMessage}`);
    clearMessageLater();
  };

  const handleAddPromotion = () => {
    const name = promoName.trim();
    const value = Math.max(0, Number(promoValue || 0));

    if (!name) {
      setFeedback("Nama promo wajib diisi.");
      clearMessageLater();
      return;
    }

    if (promoScheme === "percent" && value > 100) {
      setFeedback("Promo persen maksimal 100.");
      clearMessageLater();
      return;
    }

    const entry: OpsPromotion = {
      id: createOpsId("PRM"),
      name,
      scheme: promoScheme,
      value,
      startAt: promoStartDate || undefined,
      endAt: promoEndDate || undefined,
      isActive: promoActive,
      createdAt: new Date().toISOString()
    };

    upsertDataset((current) => ({
      ...current,
      promotions: [entry, ...current.promotions]
    }));

    setPromoName("");
    setPromoScheme("percent");
    setPromoValue("0");
    setPromoStartDate("");
    setPromoEndDate("");
    setPromoActive(true);
    setFeedback("Promo berhasil ditambahkan.");
    clearMessageLater();
  };

  const exportCurrentTab = () => {
    if (!managerCanExportData) {
      setFeedback("Export data dinonaktifkan oleh owner untuk role manager.");
      clearMessageLater();
      return;
    }

    const dateTag = new Date().toISOString().slice(0, 10);

    if (activeTab === "materials") {
      downloadCsv(
        `bahan-baku-${dateTag}.csv`,
        ["Nama", "Satuan", "Stok", "Min Stok", "Harga/Unit", "Supplier", "Update"],
        dataset.materials.map((material) => [
          material.name,
          unitMap.get(material.unitId)?.abbreviation ?? material.unitId,
          material.stockQty,
          material.minStockQty,
          material.costPerUnit,
          material.supplierName ?? "-",
          formatDateTime(material.updatedAt)
        ])
      );
      return;
    }

    if (activeTab === "recipes") {
      downloadCsv(
        `resep-${dateTag}.csv`,
        ["Nama", "Kategori", "Porsi", "Durasi(menit)", "Food Cost", "Harga Jual", "Margin %", "Status"],
        recipeMetrics.map(({ recipe, foodCost, marginPercent }) => [
          recipe.name,
          recipe.category,
          recipe.yieldPortions,
          recipe.durationMinutes,
          Math.round(foodCost),
          Math.round(recipe.sellingPrice),
          marginPercent.toFixed(1),
          recipe.status
        ])
      );
      return;
    }

    if (activeTab === "bundles") {
      downloadCsv(
        `bundle-produk-${dateTag}.csv`,
        ["Nama Bundle", "Produk", "Diskon %", "Status"],
        dataset.bundles.map((bundle) => [
          bundle.name,
          bundle.productIds
            .map((id) => productMap.get(id)?.name ?? id)
            .join(" | "),
          bundle.discountPercent,
          bundle.isActive ? "Aktif" : "Nonaktif"
        ])
      );
      return;
    }

    if (activeTab === "opname") {
      const rows = dataset.stockOpnames.flatMap((session) =>
        session.items.map((item) => {
          const material = materialMap.get(item.materialId);
          return [
            session.id,
            formatDateTime(session.startedAt),
            formatDateTime(session.endedAt),
            material?.name ?? item.materialId,
            item.systemQty,
            item.countedQty,
            item.variance,
            session.notes ?? "-"
          ];
        })
      );

      downloadCsv(
        `stok-opname-${dateTag}.csv`,
        ["Session", "Mulai", "Selesai", "Bahan", "System", "Hitung", "Selisih", "Catatan"],
        rows
      );
      return;
    }

    if (activeTab === "journals") {
      downloadCsv(
        `jurnal-${dateTag}.csv`,
        ["Tanggal", "Tipe", "Kategori", "Deskripsi", "Nominal", "Signed Nominal"],
        dataset.journals.map((entry) => [
          formatDateTime(entry.createdAt),
          entry.type,
          entry.category,
          entry.description,
          entry.amount,
          getJournalSignedAmount(entry)
        ])
      );
      return;
    }

    if (activeTab === "failed") {
      downloadCsv(
        `produk-gagal-${dateTag}.csv`,
        ["Tanggal", "Produk", "Produk ID", "Qty", "Qty Potong Stok", "Alasan", "Estimasi Loss"],
        dataset.failedProducts.map((entry) => [
          formatDateTime(entry.createdAt),
          entry.productName,
          entry.productId ?? "-",
          entry.quantity,
          entry.stockDeductedQty ?? 0,
          entry.reason,
          entry.estimatedLoss
        ])
      );
      return;
    }

    downloadCsv(
      `promo-${dateTag}.csv`,
      ["Nama", "Skema", "Nilai", "Mulai", "Akhir", "Status"],
      dataset.promotions.map((promo) => [
        promo.name,
        promo.scheme,
        promo.value,
        promo.startAt || "-",
        promo.endAt || "-",
        promo.isActive ? "Aktif" : "Nonaktif"
      ])
    );
  };

  return (
    <section className="mt-4 grid gap-4">
      <section className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Operasional Management</p>
            <h2 className="mt-1 font-headline text-2xl font-extrabold text-on-surface sm:text-3xl">Fitur Setara POS Sanjaya di Aplikasi POS</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Bahan baku, resep, bundle, stok opname, jurnal, produk gagal, dan promo dalam satu workspace.</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={exportCurrentTab}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export Tab Aktif</span>
            </button>
            <p className="text-xs text-on-surface-variant">
              {managerCanExportData ? "Export aktif" : "Export dibatasi policy owner"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">Bahan Low Stock</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-900">{lowMaterialCount}</p>
          <p className="mt-1 text-xs text-amber-700">dari {dataset.materials.length} bahan aktif</p>
        </article>

        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">Resep Aktif</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-900">{activeRecipeCount}</p>
          <p className="mt-1 text-xs text-emerald-700">total resep {dataset.recipes.length}</p>
        </article>

        <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-sky-700">Bundle Aktif</p>
          <p className="mt-1 text-2xl font-extrabold text-sky-900">{dataset.bundles.filter((item) => item.isActive).length}</p>
          <p className="mt-1 text-xs text-sky-700">total bundle {dataset.bundles.length}</p>
        </article>

        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-rose-700">Loss Produk Gagal</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-900">{formatCurrency(failedLossTotal)}</p>
          <p className="mt-1 text-xs text-rose-700">entry: {dataset.failedProducts.length}</p>
        </article>

        <article className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-violet-700">Saldo Jurnal</p>
          <p className="mt-1 text-2xl font-extrabold text-violet-900">{formatCurrency(journalBalance)}</p>
          <p className="mt-1 text-xs text-violet-700">penjualan tercatat: {formatCurrency(completedSalesTotal)}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-outline-variant/30 bg-surface p-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {TAB_META.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {feedback ? (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          {feedback}
        </section>
      ) : null}

      {activeTab === "materials" && (
        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Master Satuan</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Kelola satuan dasar dan konversi untuk bahan baku.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Nama</span>
                <input className={inputClass} value={unitName} onChange={(event) => setUnitName(event.target.value)} placeholder="Kilogram" />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Singkatan</span>
                <input className={inputClass} value={unitAbbreviation} onChange={(event) => setUnitAbbreviation(event.target.value)} placeholder="kg" />
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddUnit}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tambah Satuan</span>
            </button>

            <div className="mt-4 overflow-x-auto rounded-xl border border-outline-variant/30">
              <table className="min-w-full divide-y divide-outline-variant/30 text-sm">
                <thead className="bg-surface-container-low text-left text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Nama</th>
                    <th className="px-3 py-2 font-semibold">Singkatan</th>
                    <th className="px-3 py-2 font-semibold">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {dataset.units.map((unit) => (
                    <tr key={unit.id}>
                      <td className="px-3 py-2 font-medium text-on-surface">{unit.name}</td>
                      <td className="px-3 py-2 text-on-surface-variant">{unit.abbreviation}</td>
                      <td className="px-3 py-2 text-xs text-on-surface-variant">{unit.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Konversi Satuan</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Contoh: 1 kg = 1000 g, 1 l = 1000 ml.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Dari</span>
                <select className={inputClass} value={conversionFromUnitId} onChange={(event) => setConversionFromUnitId(event.target.value)}>
                  {dataset.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.abbreviation})
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Ke</span>
                <select className={inputClass} value={conversionToUnitId} onChange={(event) => setConversionToUnitId(event.target.value)}>
                  {dataset.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.abbreviation})
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Multiplier</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step="0.0001"
                  value={conversionMultiplier}
                  onChange={(event) => setConversionMultiplier(event.target.value)}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Catatan</span>
                <input className={inputClass} value={conversionNote} onChange={(event) => setConversionNote(event.target.value)} placeholder="Opsional" />
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddConversion}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              <span>Tambah Konversi</span>
            </button>

            <div className="mt-4 grid gap-2">
              {dataset.conversions.map((conversion) => {
                const fromUnit = unitMap.get(conversion.fromUnitId);
                const toUnit = unitMap.get(conversion.toUnitId);
                return (
                  <div key={conversion.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm">
                    <p className="font-semibold text-on-surface">
                      1 {fromUnit?.abbreviation ?? conversion.fromUnitId} = {conversion.multiplier} {toUnit?.abbreviation ?? conversion.toUnitId}
                    </p>
                    <p className="text-xs text-on-surface-variant">{conversion.note || "Tanpa catatan"}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4 xl:col-span-2">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Bahan Baku</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Master bahan baku untuk resep, costing, dan opname.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Nama Bahan</span>
                <input className={inputClass} value={materialName} onChange={(event) => setMaterialName(event.target.value)} placeholder="Tepung Terigu" />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Satuan</span>
                <select className={inputClass} value={materialUnitId} onChange={(event) => setMaterialUnitId(event.target.value)}>
                  {dataset.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.abbreviation})
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Stok</span>
                <input className={inputClass} type="number" min={0} step="0.01" value={materialStockQty} onChange={(event) => setMaterialStockQty(event.target.value)} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Min Stok</span>
                <input className={inputClass} type="number" min={0} step="0.01" value={materialMinStockQty} onChange={(event) => setMaterialMinStockQty(event.target.value)} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Harga per Unit</span>
                <input className={inputClass} type="number" min={0} step="1" value={materialCostPerUnit} onChange={(event) => setMaterialCostPerUnit(event.target.value)} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Supplier</span>
                <input className={inputClass} value={materialSupplierName} onChange={(event) => setMaterialSupplierName(event.target.value)} placeholder="Opsional" />
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddMaterial}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Tambah Bahan</span>
            </button>

            <div className="mt-4 overflow-x-auto rounded-xl border border-outline-variant/30">
              <table className="min-w-full divide-y divide-outline-variant/30 text-sm">
                <thead className="bg-surface-container-low text-left text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Bahan</th>
                    <th className="px-3 py-2 font-semibold">Stok</th>
                    <th className="px-3 py-2 font-semibold">Min</th>
                    <th className="px-3 py-2 font-semibold">Harga/Unit</th>
                    <th className="px-3 py-2 font-semibold">Supplier</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {dataset.materials.map((material) => {
                    const unitLabel = unitMap.get(material.unitId)?.abbreviation ?? material.unitId;
                    const isLow = material.stockQty <= material.minStockQty;

                    return (
                      <tr key={material.id}>
                        <td className="px-3 py-2">
                          <p className="font-semibold text-on-surface">{material.name}</p>
                          <p className="text-xs text-on-surface-variant">Update: {formatDateTime(material.updatedAt)}</p>
                        </td>
                        <td className="px-3 py-2 text-on-surface">{material.stockQty} {unitLabel}</td>
                        <td className="px-3 py-2 text-on-surface-variant">{material.minStockQty} {unitLabel}</td>
                        <td className="px-3 py-2 text-on-surface">{formatCurrency(material.costPerUnit)}</td>
                        <td className="px-3 py-2 text-on-surface-variant">{material.supplierName || "-"}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                              isLow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isLow ? "Low" : "Aman"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeTab === "recipes" && (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Buat Resep</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Sistem resep + food cost + margin seperti workflow produksi.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Nama Resep</span>
                <input className={inputClass} value={recipeName} onChange={(event) => setRecipeName(event.target.value)} placeholder="Croissant Coklat" />
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Mapping Produk POS (Opsional)</span>
                <select className={inputClass} value={recipeProductId} onChange={(event) => setRecipeProductId(event.target.value)}>
                  <option value="">-- Tidak dihubungkan --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Kategori</span>
                <input className={inputClass} value={recipeCategory} onChange={(event) => setRecipeCategory(event.target.value)} placeholder="Roti" />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Status</span>
                <select className={inputClass} value={recipeStatus} onChange={(event) => setRecipeStatus(event.target.value as RecipeStatus)}>
                  <option value="draft">Draft</option>
                  <option value="active">Aktif</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Porsi / Yield</span>
                <input className={inputClass} type="number" min={1} step="1" value={recipeYield} onChange={(event) => setRecipeYield(event.target.value)} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Durasi (menit)</span>
                <input className={inputClass} type="number" min={0} step="1" value={recipeDuration} onChange={(event) => setRecipeDuration(event.target.value)} />
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Target Harga Jual</span>
                <input className={inputClass} type="number" min={0} step="1" value={recipeSellingPrice} onChange={(event) => setRecipeSellingPrice(event.target.value)} />
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-outline-variant/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Bahan & Kuantitas</p>
              <div className="mt-2 grid gap-2">
                {dataset.materials.map((material) => (
                  <div key={material.id} className="grid grid-cols-[1fr_128px] gap-2">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium text-on-surface">{material.name}</span>
                      <span className="text-xs text-on-surface-variant">
                        {formatCurrency(material.costPerUnit)} per {unitMap.get(material.unitId)?.abbreviation ?? material.unitId}
                      </span>
                    </label>
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      step="0.01"
                      value={recipeIngredientDraft[material.id] ?? ""}
                      onChange={(event) => handleRecipeIngredientChange(material.id, event.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <label className="mt-3 grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Catatan</span>
              <textarea className={textareaClass} value={recipeNotes} onChange={(event) => setRecipeNotes(event.target.value)} placeholder="Instruksi ringkas atau catatan produksi" />
            </label>

            <button
              type="button"
              onClick={handleAddRecipe}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">library_add</span>
              <span>Simpan Resep</span>
            </button>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Daftar Resep</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Food cost dan margin dihitung otomatis dari bahan baku.</p>

            <div className="mt-3 grid gap-2">
              {recipeMetrics.length === 0 && (
                <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low px-3 py-4 text-sm text-on-surface-variant">
                  Belum ada resep.
                </div>
              )}

              {recipeMetrics.map(({ recipe, foodCost, marginPercent }) => (
                <article key={recipe.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-on-surface">{recipe.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {recipe.category} • Yield {recipe.yieldPortions} • {recipe.durationMinutes} menit
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Produk: {recipe.productId ? productMap.get(recipe.productId)?.name ?? recipe.productId : "Belum dipetakan"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        recipe.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : recipe.status === "draft"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {recipe.status}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-white px-2 py-1.5">
                      <p className="text-on-surface-variant">Food Cost</p>
                      <p className="font-semibold text-on-surface">{formatCurrency(foodCost)}</p>
                    </div>
                    <div className="rounded-lg bg-white px-2 py-1.5">
                      <p className="text-on-surface-variant">Harga Jual</p>
                      <p className="font-semibold text-on-surface">{formatCurrency(recipe.sellingPrice)}</p>
                    </div>
                    <div className="rounded-lg bg-white px-2 py-1.5">
                      <p className="text-on-surface-variant">Margin</p>
                      <p className={`font-semibold ${marginPercent >= 50 ? "text-emerald-700" : marginPercent >= 25 ? "text-amber-700" : "text-rose-700"}`}>
                        {marginPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-on-surface-variant">
                    Bahan: {recipe.ingredients.map((ingredient) => `${materialMap.get(ingredient.materialId)?.name ?? ingredient.materialId} (${ingredient.quantity})`).join(" • ")}
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "bundles" && (
        <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Buat Bundle Produk</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Bundle product + diskon paket untuk promosi penjualan.</p>

            <label className="mt-3 grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Nama Bundle</span>
              <input className={inputClass} value={bundleName} onChange={(event) => setBundleName(event.target.value)} placeholder="Paket Sarapan" />
            </label>

            <label className="mt-3 grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Diskon Bundle (%)</span>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={100}
                step="1"
                value={bundleDiscountPercent}
                onChange={(event) => setBundleDiscountPercent(event.target.value)}
              />
            </label>

            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <select
                className={inputClass}
                value={bundleSelectedProductId}
                onChange={(event) => setBundleSelectedProductId(event.target.value)}
              >
                <option value="">Pilih produk</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.id})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddBundleProduct}
                className="inline-flex items-center rounded-xl bg-surface-container-high px-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
              >
                Tambah
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {bundleProductIds.length === 0 && (
                <span className="rounded-full bg-surface-container-low px-2 py-1 text-xs text-on-surface-variant">Belum ada produk dipilih</span>
              )}
              {bundleProductIds.map((productId) => (
                <button
                  key={productId}
                  type="button"
                  onClick={() => handleRemoveBundleProduct(productId)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
                >
                  <span>{productMap.get(productId)?.name ?? productId}</span>
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddBundle}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">deployed_code</span>
              <span>Simpan Bundle</span>
            </button>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Daftar Bundle</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Bundle terhubung ke katalog produk POS aktif.</p>

            <div className="mt-3 grid gap-2">
              {dataset.bundles.length === 0 && (
                <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low px-3 py-4 text-sm text-on-surface-variant">
                  Belum ada bundle.
                </div>
              )}

              {dataset.bundles.map((bundle) => (
                <article key={bundle.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-on-surface">{bundle.name}</p>
                      <p className="text-xs text-on-surface-variant">Diskon {bundle.discountPercent}%</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${bundle.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                      {bundle.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-on-surface-variant">
                    {bundle.productIds.map((id) => productMap.get(id)?.name ?? id).join(" • ")}
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === "opname" && (
        <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-headline text-xl font-extrabold text-on-surface">Stock Opname Bahan</h3>
                <p className="mt-1 text-sm text-on-surface-variant">Satu sesi aktif setiap waktu, lalu posting hasil ke stok bahan baku.</p>
              </div>
              {!activeOpname && (
                <button
                  type="button"
                  onClick={handleStartOpname}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
                >
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  <span>Mulai Opname</span>
                </button>
              )}
            </div>

            {activeOpname ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                  Sesi aktif: {formatDateTime(activeOpname.startedAt)}
                </div>

                <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
                  <table className="min-w-full divide-y divide-outline-variant/30 text-sm">
                    <thead className="bg-surface-container-low text-left text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Bahan</th>
                        <th className="px-3 py-2 font-semibold">System</th>
                        <th className="px-3 py-2 font-semibold">Hitung Fisik</th>
                        <th className="px-3 py-2 font-semibold">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {activeOpname.items.map((item) => {
                        const material = materialMap.get(item.materialId);
                        const unitLabel = material ? unitMap.get(material.unitId)?.abbreviation ?? material.unitId : "";

                        return (
                          <tr key={item.id}>
                            <td className="px-3 py-2 font-medium text-on-surface">{material?.name ?? item.materialId}</td>
                            <td className="px-3 py-2 text-on-surface-variant">{item.systemQty} {unitLabel}</td>
                            <td className="px-3 py-2">
                              <input
                                className={inputClass}
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.countedQty}
                                onChange={(event) => handleUpdateOpnameCount(item.materialId, event.target.value)}
                              />
                            </td>
                            <td className={`px-3 py-2 font-semibold ${item.variance === 0 ? "text-on-surface" : item.variance > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {item.variance > 0 ? "+" : ""}{item.variance}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Catatan Penutupan</span>
                  <textarea className={textareaClass} value={opnameClosingNote} onChange={(event) => setOpnameClosingNote(event.target.value)} placeholder="Alasan selisih, ringkasan tindakan, dll." />
                </label>

                <button
                  type="button"
                  onClick={handleFinishOpname}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  <span>Posting Hasil Opname</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low px-3 py-4 text-sm text-on-surface-variant">
                Tidak ada sesi opname aktif.
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Riwayat Opname</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Sesi terbaru ditampilkan paling atas.</p>

            <div className="mt-3 grid gap-2">
              {dataset.stockOpnames.length === 0 && (
                <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low px-3 py-4 text-sm text-on-surface-variant">
                  Belum ada riwayat opname.
                </div>
              )}

              {dataset.stockOpnames.map((session) => {
                const totalVariance = session.items.reduce((acc, item) => acc + item.variance, 0);
                return (
                  <article key={session.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-on-surface">{session.id}</p>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${session.endedAt ? "bg-slate-200 text-slate-700" : "bg-primary/10 text-primary"}`}>
                        {session.endedAt ? "Selesai" : "Aktif"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-on-surface-variant">Mulai: {formatDateTime(session.startedAt)}</p>
                    <p className="text-xs text-on-surface-variant">Selesai: {formatDateTime(session.endedAt)}</p>
                    <p className={`mt-1 text-xs font-semibold ${totalVariance === 0 ? "text-on-surface" : totalVariance > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      Total selisih: {totalVariance > 0 ? "+" : ""}{totalVariance}
                    </p>
                    {session.notes ? <p className="mt-1 text-xs text-on-surface-variant">Catatan: {session.notes}</p> : null}
                  </article>
                );
              })}
            </div>
          </article>
        </section>
      )}

      {activeTab === "journals" && (
        <section className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Input Jurnal</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Pencatatan pemasukan, pengeluaran, dan adjustment manual.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Tipe</span>
                <select className={inputClass} value={journalType} onChange={(event) => setJournalType(event.target.value as JournalType)}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Kategori</span>
                <input className={inputClass} value={journalCategory} onChange={(event) => setJournalCategory(event.target.value)} placeholder="Operasional" />
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Deskripsi</span>
                <input className={inputClass} value={journalDescription} onChange={(event) => setJournalDescription(event.target.value)} placeholder="Contoh: biaya listrik" />
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Nominal</span>
                <input className={inputClass} type="number" min={0} step="1" value={journalAmount} onChange={(event) => setJournalAmount(event.target.value)} />
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddJournal}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">post_add</span>
              <span>Tambah Jurnal</span>
            </button>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl bg-emerald-50 p-2">
                <p className="text-emerald-700">Income</p>
                <p className="font-semibold text-emerald-900">{formatCurrency(journalIncome)}</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-2">
                <p className="text-rose-700">Expense</p>
                <p className="font-semibold text-rose-900">{formatCurrency(journalExpense)}</p>
              </div>
              <div className="rounded-xl bg-violet-50 p-2">
                <p className="text-violet-700">Balance</p>
                <p className="font-semibold text-violet-900">{formatCurrency(journalBalance)}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Riwayat Jurnal</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Penjualan selesai di POS: {formatCurrency(completedSalesTotal)}</p>

            <div className="mt-3 overflow-x-auto rounded-xl border border-outline-variant/30">
              <table className="min-w-full divide-y divide-outline-variant/30 text-sm">
                <thead className="bg-surface-container-low text-left text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Tanggal</th>
                    <th className="px-3 py-2 font-semibold">Tipe</th>
                    <th className="px-3 py-2 font-semibold">Kategori</th>
                    <th className="px-3 py-2 font-semibold">Deskripsi</th>
                    <th className="px-3 py-2 font-semibold">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {dataset.journals.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-3 py-2 text-on-surface-variant">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            entry.type === "income"
                              ? "bg-emerald-100 text-emerald-700"
                              : entry.type === "expense"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-on-surface">{entry.category}</td>
                      <td className="px-3 py-2 text-on-surface-variant">{entry.description}</td>
                      <td className={`px-3 py-2 font-semibold ${getJournalSignedAmount(entry) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {getJournalSignedAmount(entry) >= 0 ? "+" : ""}{formatCurrency(Math.abs(getJournalSignedAmount(entry)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeTab === "failed" && (
        <section className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Input Produk Gagal</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Tracking produk reject dan estimasi kerugian produksi.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Produk Katalog (Opsional)</span>
                <select
                  className={inputClass}
                  value={failedProductCatalogId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setFailedProductCatalogId(nextId);

                    if (!nextId) {
                      return;
                    }

                    const selected = productMap.get(nextId);
                    if (!selected) return;

                    setFailedProductName((current) => (current.trim().length > 0 ? current : selected.name));
                    const qty = Math.max(1, Number(failedProductQty || 1));
                    setFailedProductLoss((current) => {
                      const numeric = Number(current || 0);
                      if (numeric > 0) return current;
                      return String(Math.round(selected.costPrice * qty));
                    });
                  }}
                >
                  <option value="">-- Input Manual --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.stock} stok)
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Nama Produk</span>
                <input className={inputClass} value={failedProductName} onChange={(event) => setFailedProductName(event.target.value)} placeholder="Roti Croissant" />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Jumlah</span>
                <input className={inputClass} type="number" min={1} step="1" value={failedProductQty} onChange={(event) => setFailedProductQty(event.target.value)} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Estimasi Loss</span>
                <input className={inputClass} type="number" min={0} step="1" value={failedProductLoss} onChange={(event) => setFailedProductLoss(event.target.value)} />
              </label>

              {selectedFailedCatalogProduct && failedComputedLossPreview > 0 && (
                <p className="rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant sm:col-span-2">
                  Estimasi otomatis dari HPP produk: {formatCurrency(failedComputedLossPreview)}
                </p>
              )}

              <label className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={failedDeductStock}
                  disabled={!managerCanAdjustStock}
                  onChange={(event) => setFailedDeductStock(event.target.checked)}
                />
                <span className="text-sm text-on-surface">
                  Kurangi stok katalog otomatis
                  {!managerCanAdjustStock ? " (izin adjust stok nonaktif)" : ""}
                </span>
              </label>

              <label className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 sm:col-span-2">
                <input type="checkbox" checked={failedCreateJournal} onChange={(event) => setFailedCreateJournal(event.target.checked)} />
                <span className="text-sm text-on-surface">Buat jurnal expense otomatis dari nilai loss</span>
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Alasan</span>
                <textarea className={textareaClass} value={failedProductReason} onChange={(event) => setFailedProductReason(event.target.value)} placeholder="Contoh: gosong, tidak sesuai standar" />
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddFailedProduct}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>Simpan Produk Gagal</span>
            </button>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Riwayat Produk Gagal</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Total estimasi kerugian: {formatCurrency(failedLossTotal)}</p>

            <div className="mt-3 overflow-x-auto rounded-xl border border-outline-variant/30">
              <table className="min-w-full divide-y divide-outline-variant/30 text-sm">
                <thead className="bg-surface-container-low text-left text-xs uppercase tracking-[0.08em] text-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Tanggal</th>
                    <th className="px-3 py-2 font-semibold">Produk</th>
                    <th className="px-3 py-2 font-semibold">Qty</th>
                    <th className="px-3 py-2 font-semibold">Potong Stok</th>
                    <th className="px-3 py-2 font-semibold">Alasan</th>
                    <th className="px-3 py-2 font-semibold">Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {dataset.failedProducts.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-3 py-2 text-on-surface-variant">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-3 py-2 font-medium text-on-surface">
                        <p>{entry.productName}</p>
                        <p className="text-xs text-on-surface-variant">{entry.productId ?? "manual"}</p>
                      </td>
                      <td className="px-3 py-2 text-on-surface-variant">{entry.quantity}</td>
                      <td className="px-3 py-2 text-on-surface-variant">{entry.stockDeductedQty ?? 0}</td>
                      <td className="px-3 py-2 text-on-surface-variant">{entry.reason}</td>
                      <td className="px-3 py-2 font-semibold text-rose-700">{formatCurrency(entry.estimatedLoss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeTab === "promotions" && (
        <section className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Buat Promo</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Mendukung skema persen, nominal, bundle, dan happy hour.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Nama Promo</span>
                <input className={inputClass} value={promoName} onChange={(event) => setPromoName(event.target.value)} placeholder="Promo Weekend" />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Skema</span>
                <select className={inputClass} value={promoScheme} onChange={(event) => setPromoScheme(event.target.value as PromotionScheme)}>
                  <option value="percent">Persen</option>
                  <option value="nominal">Nominal</option>
                  <option value="bundle">Bundle</option>
                  <option value="happy_hour">Happy Hour</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Nilai</span>
                <input className={inputClass} type="number" min={0} step="1" value={promoValue} onChange={(event) => setPromoValue(event.target.value)} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Mulai</span>
                <input className={inputClass} type="date" value={promoStartDate} onChange={(event) => setPromoStartDate(event.target.value)} />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Selesai</span>
                <input className={inputClass} type="date" value={promoEndDate} onChange={(event) => setPromoEndDate(event.target.value)} />
              </label>

              <label className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 sm:col-span-2">
                <input type="checkbox" checked={promoActive} onChange={(event) => setPromoActive(event.target.checked)} />
                <span className="text-sm font-medium text-on-surface">Promo aktif</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddPromotion}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">campaign</span>
              <span>Simpan Promo</span>
            </button>
          </article>

          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Daftar Promo</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Promo aktif: {dataset.promotions.filter((promo) => promo.isActive).length}</p>

            <div className="mt-3 grid gap-2">
              {dataset.promotions.length === 0 && (
                <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low px-3 py-4 text-sm text-on-surface-variant">
                  Belum ada promo.
                </div>
              )}

              {dataset.promotions.map((promo) => (
                <article key={promo.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-on-surface">{promo.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {promo.scheme} • {promo.scheme === "percent" ? `${promo.value}%` : formatCurrency(promo.value)}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${promo.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                      {promo.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-on-surface-variant">
                    {promo.startAt || "-"} s/d {promo.endAt || "-"}
                  </p>
                </article>
              ))}
            </div>
          </article>
        </section>
      )}
    </section>
  );
}
