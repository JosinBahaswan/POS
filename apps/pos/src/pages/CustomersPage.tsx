import { useEffect, useMemo, useState } from "react";
import type { LocalSale } from "../database";
import type { Customer } from "../types";

type CustomerSortMode = "recent" | "spend" | "points" | "debt";
type CustomerSegment = "vip" | "loyal" | "dormant" | "debt-risk" | "new" | "regular";
type SegmentFilter = "all" | CustomerSegment;

type CustomerInsight = {
  transactionCount: number;
  totalSpend: number;
  earnedPoints: number;
  redeemedPoints: number;
  netPoints: number;
  averageTicket: number;
  lastTransactionAt?: string;
};

type FollowUpPriority = "high" | "medium" | "low";
type FollowUpProgressStatus = "pending" | "snoozed" | "completed";
type FollowUpQueueFilter = "active" | "snoozed" | "completed" | "all";
type FollowUpTemplateSegment = Exclude<CustomerSegment, "regular">;

type FollowUpProgressEntry = {
  status: FollowUpProgressStatus;
  updatedAt: string;
  snoozedUntil?: string;
};

type FollowUpCandidate = {
  customer: Customer;
  segment: CustomerSegment;
  priority: FollowUpPriority;
  score: number;
  reason: string;
  actionLabel: string;
  message: string;
  daysSinceLastTransaction: number | null;
  followUpStatus: FollowUpProgressStatus;
  statusUpdatedAt?: string;
  snoozedUntil?: string;
};

type CustomersPageProps = {
  storageScopeKey: string;
  customers: Customer[];
  sales: LocalSale[];
  onCreateCustomer: (input: {
    name: string;
    phone?: string;
    email?: string;
    memberTier?: Customer["member_tier"];
  }) => void;
  onUpdateCustomerTier: (customerId: string, tier: Customer["member_tier"]) => void;
  onSettleCustomerDebt: (customerId: string) => void;
};

const FOLLOW_UP_PROGRESS_STORAGE_KEY = "pos_customer_follow_up_progress";
const FOLLOW_UP_TEMPLATE_STORAGE_KEY = "pos_customer_follow_up_templates";

const MEMBER_TIERS: Customer["member_tier"][] = ["Silver", "Gold", "Platinum"];

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  vip: "VIP",
  loyal: "Loyal",
  dormant: "Dormant",
  "debt-risk": "Risk Debt",
  new: "Baru",
  regular: "Regular"
};

const FOLLOW_UP_PRIORITY_LABEL: Record<FollowUpPriority, string> = {
  high: "Urgent",
  medium: "Prioritas",
  low: "Normal"
};

const FOLLOW_UP_STATUS_LABEL: Record<FollowUpProgressStatus, string> = {
  pending: "Aktif",
  snoozed: "Snoozed",
  completed: "Selesai"
};

const FOLLOW_UP_FILTERS: Array<{ id: FollowUpQueueFilter; label: string }> = [
  { id: "active", label: "Aktif" },
  { id: "snoozed", label: "Snoozed" },
  { id: "completed", label: "Selesai" },
  { id: "all", label: "Semua" }
];

const FOLLOW_UP_TEMPLATE_SEGMENTS: FollowUpTemplateSegment[] = [
  "debt-risk",
  "dormant",
  "vip",
  "loyal",
  "new"
];

const DEFAULT_FOLLOW_UP_TEMPLATES: Record<FollowUpTemplateSegment, string> = {
  "debt-risk":
    "Halo {name}, kami mengingatkan kasbon aktif Anda sebesar Rp {debt}. Tim kami siap bantu proses pelunasan dengan cepat hari ini.",
  dormant:
    "Halo {name}, sudah {daysInactive} hari sejak transaksi terakhir Anda. Kami siapkan promo khusus reaktivasi pelanggan, silakan balas pesan ini untuk klaim.",
  vip:
    "Halo {name}, terima kasih atas kepercayaan Anda. Kami menyiapkan layanan prioritas dan penawaran personal khusus pelanggan VIP minggu ini.",
  loyal:
    "Halo {name}, poin loyalty Anda saat ini {points} poin. Kami siapkan rekomendasi redeem terbaik agar manfaat poin Anda maksimal.",
  new:
    "Halo {name}, terima kasih sudah bergabung sebagai pelanggan baru. Kami siapkan promo welcome untuk transaksi berikutnya."
};

const SEGMENT_FILTERS: Array<{ id: SegmentFilter; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "vip", label: "VIP" },
  { id: "loyal", label: "Loyal" },
  { id: "dormant", label: "Dormant" },
  { id: "debt-risk", label: "Risk Debt" },
  { id: "new", label: "Baru" },
  { id: "regular", label: "Regular" }
];

const SALE_STATUS_LABEL: Record<LocalSale["status"], string> = {
  completed: "Selesai",
  refunded: "Refund",
  voided: "Void"
};

const normalizeTier = (value: FormDataEntryValue | string | null | undefined): Customer["member_tier"] => {
  if (value === "Gold" || value === "Platinum") {
    return value;
  }

  return "Silver";
};

const tierBadgeClass = (tier: Customer["member_tier"]) => {
  if (tier === "Platinum") {
    return "rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary";
  }

  if (tier === "Gold") {
    return "rounded-full bg-tertiary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-tertiary-container";
  }

  return "rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant";
};

const segmentBadgeClass = (segment: CustomerSegment) => {
  if (segment === "vip") {
    return "rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-primary";
  }

  if (segment === "debt-risk") {
    return "rounded-full bg-error-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-error-container";
  }

  if (segment === "loyal") {
    return "rounded-full bg-secondary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container";
  }

  if (segment === "dormant") {
    return "rounded-full bg-tertiary-fixed/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-tertiary-fixed-variant";
  }

  if (segment === "new") {
    return "rounded-full bg-tertiary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-tertiary-container";
  }

  return "rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant";
};

const saleStatusClass = (status: LocalSale["status"]) => {
  if (status === "refunded") {
    return "rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-error-container";
  }

  if (status === "voided") {
    return "rounded-full bg-tertiary-fixed/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-tertiary-fixed-variant";
  }

  return "rounded-full bg-secondary-container/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-secondary-container";
};

const followUpPriorityClass = (priority: FollowUpPriority) => {
  if (priority === "high") {
    return "rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-error-container";
  }

  if (priority === "medium") {
    return "rounded-full bg-tertiary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-tertiary-container";
  }

  return "rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant";
};

const followUpStatusClass = (status: FollowUpProgressStatus) => {
  if (status === "completed") {
    return "rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-secondary-container";
  }

  if (status === "snoozed") {
    return "rounded-full bg-tertiary-fixed/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-tertiary-fixed-variant";
  }

  return "rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-on-primary";
};

const followUpProgressStorageKey = (scopeKey: string) => `${FOLLOW_UP_PROGRESS_STORAGE_KEY}:${scopeKey}`;
const followUpTemplateStorageKey = (scopeKey: string) => `${FOLLOW_UP_TEMPLATE_STORAGE_KEY}:${scopeKey}`;

const normalizeFollowUpProgress = (raw: unknown): Record<string, FollowUpProgressEntry> => {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const next: Record<string, FollowUpProgressEntry> = {};
  for (const [customerId, value] of Object.entries(raw)) {
    if (!customerId || typeof value !== "object" || value === null) {
      continue;
    }

    const candidate = value as Partial<FollowUpProgressEntry>;
    const status: FollowUpProgressStatus =
      candidate.status === "completed" || candidate.status === "snoozed" ? candidate.status : "pending";
    const updatedAt = typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString();

    const entry: FollowUpProgressEntry = {
      status,
      updatedAt
    };

    if (status === "snoozed" && typeof candidate.snoozedUntil === "string") {
      const snoozedTs = new Date(candidate.snoozedUntil).getTime();
      if (Number.isFinite(snoozedTs)) {
        entry.snoozedUntil = new Date(snoozedTs).toISOString();
      }
    }

    next[customerId] = entry;
  }

  return next;
};

const normalizeFollowUpTemplates = (raw: unknown): Record<FollowUpTemplateSegment, string> => {
  const next: Record<FollowUpTemplateSegment, string> = {
    ...DEFAULT_FOLLOW_UP_TEMPLATES
  };

  if (!raw || typeof raw !== "object") {
    return next;
  }

  const candidate = raw as Record<string, unknown>;
  for (const segment of FOLLOW_UP_TEMPLATE_SEGMENTS) {
    const value = candidate[segment];
    if (typeof value === "string" && value.trim()) {
      next[segment] = value;
    }
  }

  return next;
};

const renderFollowUpTemplate = (
  template: string,
  values: {
    name: string;
    debt: string;
    points: string;
    daysInactive: string;
  }
) => {
  let output = template;
  output = output.split("{name}").join(values.name);
  output = output.split("{debt}").join(values.debt);
  output = output.split("{points}").join(values.points);
  output = output.split("{daysInactive}").join(values.daysInactive);
  return output;
};

const normalizeWhatsappNumber = (phone?: string) => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  if (digits.startsWith("0") && digits.length > 1) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  return digits;
};

const formatRemainingTime = (targetIso: string) => {
  const targetTs = new Date(targetIso).getTime();
  if (!Number.isFinite(targetTs)) {
    return "-";
  }

  const diffMs = targetTs - Date.now();
  if (diffMs <= 0) {
    return "jatuh tempo";
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (totalHours < 1) {
    return "<1 jam";
  }

  if (totalHours < 24) {
    return `${totalHours} jam`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (hours === 0) {
    return `${days} hari`;
  }

  return `${days}h ${hours}j`;
};

const csvEscape = (value: string | number | undefined) => {
  const raw = value === undefined ? "" : String(value);
  if (!/[",\n]/.test(raw)) {
    return raw;
  }

  return `"${raw.replace(/"/g, '""')}"`;
};

export default function CustomersPage({
  storageScopeKey,
  customers,
  sales,
  onCreateCustomer,
  onUpdateCustomerTier,
  onSettleCustomerDebt
}: CustomersPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<CustomerSortMode>("recent");
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>("all");
  const [showDebtOnly, setShowDebtOnly] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpQueueFilter>("active");
  const [followUpProgress, setFollowUpProgress] = useState<Record<string, FollowUpProgressEntry>>({});
  const [followUpProgressHydrated, setFollowUpProgressHydrated] = useState(false);
  const [followUpTemplates, setFollowUpTemplates] = useState<Record<FollowUpTemplateSegment, string>>(
    DEFAULT_FOLLOW_UP_TEMPLATES
  );
  const [followUpTemplatesHydrated, setFollowUpTemplatesHydrated] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setFollowUpProgressHydrated(false);

    if (typeof window === "undefined") {
      setFollowUpProgress({});
      setFollowUpProgressHydrated(true);
      return;
    }

    try {
      const raw = localStorage.getItem(followUpProgressStorageKey(storageScopeKey));
      if (!raw) {
        setFollowUpProgress({});
      } else {
        const parsed = JSON.parse(raw) as unknown;
        setFollowUpProgress(normalizeFollowUpProgress(parsed));
      }
    } catch {
      setFollowUpProgress({});
    }

    setFollowUpProgressHydrated(true);
  }, [storageScopeKey]);

  useEffect(() => {
    if (!followUpProgressHydrated) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      followUpProgressStorageKey(storageScopeKey),
      JSON.stringify(followUpProgress)
    );
  }, [storageScopeKey, followUpProgress, followUpProgressHydrated]);

  useEffect(() => {
    setFollowUpTemplatesHydrated(false);

    if (typeof window === "undefined") {
      setFollowUpTemplates(DEFAULT_FOLLOW_UP_TEMPLATES);
      setFollowUpTemplatesHydrated(true);
      return;
    }

    try {
      const raw = localStorage.getItem(followUpTemplateStorageKey(storageScopeKey));
      if (!raw) {
        setFollowUpTemplates(DEFAULT_FOLLOW_UP_TEMPLATES);
      } else {
        const parsed = JSON.parse(raw) as unknown;
        setFollowUpTemplates(normalizeFollowUpTemplates(parsed));
      }
    } catch {
      setFollowUpTemplates(DEFAULT_FOLLOW_UP_TEMPLATES);
    }

    setFollowUpTemplatesHydrated(true);
  }, [storageScopeKey]);

  useEffect(() => {
    if (!followUpTemplatesHydrated) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      followUpTemplateStorageKey(storageScopeKey),
      JSON.stringify(followUpTemplates)
    );
  }, [storageScopeKey, followUpTemplates, followUpTemplatesHydrated]);

  const customerInsights = useMemo(() => {
    const next = new Map<string, CustomerInsight>();

    for (const customer of customers) {
      next.set(customer.id, {
        transactionCount: 0,
        totalSpend: 0,
        earnedPoints: 0,
        redeemedPoints: 0,
        netPoints: 0,
        averageTicket: 0,
        lastTransactionAt: undefined
      });
    }

    for (const sale of sales) {
      if (sale.status !== "completed" || !sale.customerId) continue;

      const insight = next.get(sale.customerId);
      if (!insight) continue;

      insight.transactionCount += 1;
      insight.totalSpend += Math.max(0, Number(sale.total || 0));
      insight.earnedPoints += Math.max(0, Math.round(Number(sale.earnedPoints || 0)));
      insight.redeemedPoints += Math.max(0, Math.round(Number(sale.redeemedPoints || 0)));

      const currentLast = insight.lastTransactionAt ? new Date(insight.lastTransactionAt).getTime() : 0;
      const candidate = new Date(sale.createdAt).getTime();
      if (Number.isFinite(candidate) && candidate > currentLast) {
        insight.lastTransactionAt = sale.createdAt;
      }
    }

    for (const insight of next.values()) {
      insight.netPoints = insight.earnedPoints - insight.redeemedPoints;
      insight.averageTicket =
        insight.transactionCount > 0 ? insight.totalSpend / insight.transactionCount : 0;
    }

    return next;
  }, [customers, sales]);

  const customerSalesTimeline = useMemo(() => {
    const grouped = new Map<string, LocalSale[]>();

    for (const sale of sales) {
      if (!sale.customerId) continue;

      const current = grouped.get(sale.customerId);
      if (current) {
        current.push(sale);
        continue;
      }

      grouped.set(sale.customerId, [sale]);
    }

    for (const timeline of grouped.values()) {
      timeline.sort((a, b) => {
        const aTs = new Date(a.createdAt).getTime();
        const bTs = new Date(b.createdAt).getTime();
        return bTs - aTs;
      });
    }

    return grouped;
  }, [sales]);

  const customerSegmentById = useMemo(() => {
    const now = Date.now();
    const next = new Map<string, CustomerSegment>();

    for (const customer of customers) {
      const insight = customerInsights.get(customer.id) || {
        transactionCount: 0,
        totalSpend: 0,
        earnedPoints: 0,
        redeemedPoints: 0,
        netPoints: 0,
        averageTicket: 0,
        lastTransactionAt: undefined
      };

      const outstandingDebt = Math.max(0, Number(customer.outstanding_debt || 0));
      const loyaltyPoints = Math.max(0, Math.round(Number(customer.loyalty_points || 0)));
      const lastTransactionTs = insight.lastTransactionAt ? new Date(insight.lastTransactionAt).getTime() : 0;
      const daysSinceLastTransaction =
        lastTransactionTs > 0 ? (now - lastTransactionTs) / (1000 * 60 * 60 * 24) : Number.POSITIVE_INFINITY;

      let segment: CustomerSegment = "regular";

      if (outstandingDebt > 0) {
        segment = "debt-risk";
      } else if (insight.transactionCount > 0 && daysSinceLastTransaction >= 45) {
        segment = "dormant";
      } else if (
        customer.member_tier === "Platinum" ||
        insight.totalSpend >= 5_000_000 ||
        insight.transactionCount >= 20
      ) {
        segment = "vip";
      } else if (loyaltyPoints >= 300 || insight.netPoints >= 150) {
        segment = "loyal";
      } else if (insight.transactionCount <= 1) {
        segment = "new";
      }

      next.set(customer.id, segment);
    }

    return next;
  }, [customers, customerInsights]);

  const segmentCounts = useMemo(() => {
    const next: Record<CustomerSegment, number> = {
      vip: 0,
      loyal: 0,
      dormant: 0,
      "debt-risk": 0,
      new: 0,
      regular: 0
    };

    for (const customer of customers) {
      const segment = customerSegmentById.get(customer.id) || "regular";
      next[segment] += 1;
    }

    return next;
  }, [customers, customerSegmentById]);

  const followUpCandidates = useMemo(() => {
    const now = Date.now();
    const next: FollowUpCandidate[] = [];

    for (const customer of customers) {
      const insight = customerInsights.get(customer.id) || {
        transactionCount: 0,
        totalSpend: 0,
        earnedPoints: 0,
        redeemedPoints: 0,
        netPoints: 0,
        averageTicket: 0,
        lastTransactionAt: undefined
      };

      const segment = customerSegmentById.get(customer.id) || "regular";
      if (segment === "regular") {
        continue;
      }

      const outstandingDebt = Math.max(0, Number(customer.outstanding_debt || 0));
      const loyaltyPoints = Math.max(0, Math.round(Number(customer.loyalty_points || 0)));
      const lastTransactionTs = insight.lastTransactionAt ? new Date(insight.lastTransactionAt).getTime() : 0;
      const daysSinceLastTransaction =
        lastTransactionTs > 0
          ? Math.max(0, Math.floor((now - lastTransactionTs) / (1000 * 60 * 60 * 24)))
          : null;

      let score = 40;
      let reason = "";
      let actionLabel = "";

      if (segment === "debt-risk") {
        score = 98;
        reason = `Kasbon aktif Rp ${Math.round(outstandingDebt).toLocaleString("id-ID")}.`;
        actionLabel = "Follow-up pelunasan kasbon";
      } else if (segment === "dormant") {
        score = 82;
        reason =
          daysSinceLastTransaction !== null
            ? `Tidak transaksi ${daysSinceLastTransaction.toLocaleString("id-ID")} hari.`
            : "Belum ada transaksi terbaru.";
        actionLabel = "Kirim promo reaktivasi";
      } else if (segment === "vip") {
        score = 72;
        reason = `Kontribusi belanja Rp ${Math.round(insight.totalSpend).toLocaleString("id-ID")}.`;
        actionLabel = "Retention prioritas & layanan personal";
      } else if (segment === "loyal") {
        score = 66;
        reason = `Poin aktif ${loyaltyPoints.toLocaleString("id-ID")} poin.`;
        actionLabel = "Dorong redeem + upsell";
      } else {
        score = 55;
        reason = "Pelanggan baru, butuh onboarding pembelian berikutnya.";
        actionLabel = "Kirim welcome promo transaksi ke-2";
      }

      if (outstandingDebt > 0) {
        score += Math.min(30, Math.round(outstandingDebt / 250000));
      }

      if (daysSinceLastTransaction !== null) {
        if (daysSinceLastTransaction >= 90) {
          score += 20;
        } else if (daysSinceLastTransaction >= 45) {
          score += 10;
        }
      }

      if (insight.totalSpend >= 3_000_000) {
        score += 8;
      }

      if (insight.transactionCount === 0) {
        score += 8;
      }

      const priority: FollowUpPriority = score >= 95 ? "high" : score >= 70 ? "medium" : "low";
      const progress = followUpProgress[customer.id];
      let followUpStatus: FollowUpProgressStatus = "pending";
      let snoozedUntil: string | undefined;

      if (progress?.status === "completed") {
        followUpStatus = "completed";
      } else if (progress?.status === "snoozed" && progress.snoozedUntil) {
        const snoozedUntilTs = new Date(progress.snoozedUntil).getTime();
        if (Number.isFinite(snoozedUntilTs) && snoozedUntilTs > now) {
          followUpStatus = "snoozed";
          snoozedUntil = new Date(snoozedUntilTs).toISOString();
        }
      }

      const message = renderFollowUpTemplate(followUpTemplates[segment], {
        name: customer.name,
        debt: Math.round(outstandingDebt).toLocaleString("id-ID"),
        points: loyaltyPoints.toLocaleString("id-ID"),
        daysInactive: daysSinceLastTransaction !== null ? daysSinceLastTransaction.toLocaleString("id-ID") : "0"
      });

      next.push({
        customer,
        segment,
        priority,
        score,
        reason,
        actionLabel,
        message,
        daysSinceLastTransaction,
        followUpStatus,
        statusUpdatedAt: progress?.updatedAt,
        snoozedUntil
      });
    }

    next.sort((a, b) => {
      const statusPriority: Record<FollowUpProgressStatus, number> = {
        pending: 0,
        snoozed: 1,
        completed: 2
      };

      if (statusPriority[a.followUpStatus] !== statusPriority[b.followUpStatus]) {
        return statusPriority[a.followUpStatus] - statusPriority[b.followUpStatus];
      }

      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const spendA = customerInsights.get(a.customer.id)?.totalSpend || 0;
      const spendB = customerInsights.get(b.customer.id)?.totalSpend || 0;
      if (spendB !== spendA) {
        return spendB - spendA;
      }

      return a.customer.name.localeCompare(b.customer.name, "id");
    });

    return next;
  }, [customers, customerInsights, customerSegmentById, followUpProgress, followUpTemplates]);

  const followUpStatusCounts = useMemo(() => {
    const next: Record<FollowUpProgressStatus, number> = {
      pending: 0,
      snoozed: 0,
      completed: 0
    };

    for (const candidate of followUpCandidates) {
      next[candidate.followUpStatus] += 1;
    }

    return next;
  }, [followUpCandidates]);

  const filteredFollowUpCandidates = useMemo(() => {
    if (followUpFilter === "all") {
      return followUpCandidates;
    }

    if (followUpFilter === "active") {
      return followUpCandidates.filter((candidate) => candidate.followUpStatus === "pending");
    }

    if (followUpFilter === "snoozed") {
      return followUpCandidates.filter((candidate) => candidate.followUpStatus === "snoozed");
    }

    return followUpCandidates.filter((candidate) => candidate.followUpStatus === "completed");
  }, [followUpCandidates, followUpFilter]);

  const followUpQueue = useMemo(() => filteredFollowUpCandidates.slice(0, 6), [filteredFollowUpCandidates]);

  const followUpKpis = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    let urgentPendingCount = 0;
    let snoozedDueSoonCount = 0;
    let completedLast7Days = 0;
    let pendingDebtRiskCount = 0;

    for (const candidate of followUpCandidates) {
      if (candidate.followUpStatus === "pending" && candidate.priority === "high") {
        urgentPendingCount += 1;
      }

      if (candidate.followUpStatus === "pending" && candidate.segment === "debt-risk") {
        pendingDebtRiskCount += 1;
      }

      if (candidate.followUpStatus === "snoozed" && candidate.snoozedUntil) {
        const snoozedUntilTs = new Date(candidate.snoozedUntil).getTime();
        if (Number.isFinite(snoozedUntilTs) && snoozedUntilTs - now <= oneDayMs) {
          snoozedDueSoonCount += 1;
        }
      }

      if (candidate.followUpStatus === "completed" && candidate.statusUpdatedAt) {
        const statusUpdatedTs = new Date(candidate.statusUpdatedAt).getTime();
        if (Number.isFinite(statusUpdatedTs) && now - statusUpdatedTs <= sevenDaysMs) {
          completedLast7Days += 1;
        }
      }
    }

    return {
      urgentPendingCount,
      snoozedDueSoonCount,
      completedLast7Days,
      pendingDebtRiskCount
    };
  }, [followUpCandidates]);

  const summary = useMemo(() => {
    return customers.reduce(
      (acc, customer) => {
        const debt = Math.max(0, Number(customer.outstanding_debt || 0));
        const points = Math.max(0, Math.round(Number(customer.loyalty_points || 0)));
        const insight = customerInsights.get(customer.id);

        acc.totalOutstandingDebt += debt;
        acc.portfolioPoints += points;
        if (debt > 0) acc.activeDebtors += 1;

        if (insight) {
          acc.completedTransactions += insight.transactionCount;
          acc.totalCustomerRevenue += insight.totalSpend;
        }

        return acc;
      },
      {
        activeDebtors: 0,
        totalOutstandingDebt: 0,
        portfolioPoints: 0,
        completedTransactions: 0,
        totalCustomerRevenue: 0
      }
    );
  }, [customers, customerInsights]);

  const filteredCustomers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    const next = customers.filter((customer) => {
      const segment = customerSegmentById.get(customer.id) || "regular";
      if (segmentFilter !== "all" && segment !== segmentFilter) {
        return false;
      }

      const hasDebt = Math.max(0, Number(customer.outstanding_debt || 0)) > 0;
      if (showDebtOnly && !hasDebt) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = [
        customer.name,
        customer.phone || "",
        customer.email || "",
        customer.id
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });

    next.sort((a, b) => {
      const aInsight = customerInsights.get(a.id);
      const bInsight = customerInsights.get(b.id);

      if (sortMode === "spend") {
        return (bInsight?.totalSpend || 0) - (aInsight?.totalSpend || 0);
      }

      if (sortMode === "points") {
        const byPoints = Math.max(0, Number(b.loyalty_points || 0)) - Math.max(0, Number(a.loyalty_points || 0));
        if (byPoints !== 0) return byPoints;
        return (bInsight?.netPoints || 0) - (aInsight?.netPoints || 0);
      }

      if (sortMode === "debt") {
        const byDebt = Math.max(0, Number(b.outstanding_debt || 0)) - Math.max(0, Number(a.outstanding_debt || 0));
        if (byDebt !== 0) return byDebt;
        return a.name.localeCompare(b.name, "id");
      }

      const aTime = aInsight?.lastTransactionAt ? new Date(aInsight.lastTransactionAt).getTime() : 0;
      const bTime = bInsight?.lastTransactionAt ? new Date(bInsight.lastTransactionAt).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.name.localeCompare(b.name, "id");
    });

    return next;
  }, [
    customers,
    customerInsights,
    customerSegmentById,
    searchQuery,
    segmentFilter,
    showDebtOnly,
    sortMode
  ]);

  const handleAddCustomer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const memberTier = normalizeTier(formData.get("memberTier"));

    try {
      onCreateCustomer({
        name,
        phone: phone || undefined,
        email: email || undefined,
        memberTier
      });

      setFeedback({
        tone: "success",
        message: `Pelanggan ${name} berhasil ditambahkan.`
      });
      event.currentTarget.reset();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Gagal menambah pelanggan."
      });
    }
  };

  const handleTierChange = (customer: Customer, tierValue: string) => {
    const nextTier = normalizeTier(tierValue);

    try {
      onUpdateCustomerTier(customer.id, nextTier);
      setFeedback({
        tone: "success",
        message: `Tier ${customer.name} diperbarui ke ${nextTier}.`
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Gagal memperbarui tier pelanggan."
      });
    }
  };

  const handleSettleDebt = (customer: Customer) => {
    try {
      onSettleCustomerDebt(customer.id);
      setFeedback({
        tone: "success",
        message: `Kasbon ${customer.name} berhasil dilunasi.`
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Gagal melunasi kasbon pelanggan."
      });
    }
  };

  const handleToggleCustomerTimeline = (customerId: string) => {
    setExpandedCustomerId((current) => (current === customerId ? null : customerId));
  };

  const updateFollowUpProgress = (customerId: string, entry: FollowUpProgressEntry | null) => {
    setFollowUpProgress((current) => {
      const next = { ...current };

      if (!entry) {
        delete next[customerId];
        return next;
      }

      next[customerId] = entry;
      return next;
    });
  };

  const handleSnoozeFollowUp = (candidate: FollowUpCandidate, days: number) => {
    const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    updateFollowUpProgress(candidate.customer.id, {
      status: "snoozed",
      updatedAt: new Date().toISOString(),
      snoozedUntil
    });

    setFeedback({
      tone: "success",
      message: `Follow-up ${candidate.customer.name} ditunda ${days} hari.`
    });
  };

  const handleCompleteFollowUp = (candidate: FollowUpCandidate) => {
    updateFollowUpProgress(candidate.customer.id, {
      status: "completed",
      updatedAt: new Date().toISOString()
    });

    setFeedback({
      tone: "success",
      message: `Follow-up ${candidate.customer.name} ditandai selesai.`
    });
  };

  const handleReactivateFollowUp = (candidate: FollowUpCandidate) => {
    updateFollowUpProgress(candidate.customer.id, null);

    setFeedback({
      tone: "success",
      message: `Follow-up ${candidate.customer.name} diaktifkan kembali.`
    });
  };

  const handleBulkSnoozeQueue = (days: number) => {
    const targets = followUpQueue.filter((candidate) => candidate.followUpStatus === "pending");

    if (targets.length === 0) {
      setFeedback({
        tone: "success",
        message: "Tidak ada target aktif di queue saat ini untuk ditunda."
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    setFollowUpProgress((current) => {
      const next = { ...current };

      for (const candidate of targets) {
        next[candidate.customer.id] = {
          status: "snoozed",
          updatedAt: nowIso,
          snoozedUntil
        };
      }

      return next;
    });

    setFeedback({
      tone: "success",
      message: `${targets.length} target queue ditunda ${days} hari.`
    });
  };

  const handleBulkCompleteQueue = () => {
    const targets = followUpQueue.filter((candidate) => candidate.followUpStatus !== "completed");

    if (targets.length === 0) {
      setFeedback({
        tone: "success",
        message: "Semua target di queue sudah berstatus selesai."
      });
      return;
    }

    const nowIso = new Date().toISOString();

    setFollowUpProgress((current) => {
      const next = { ...current };

      for (const candidate of targets) {
        next[candidate.customer.id] = {
          status: "completed",
          updatedAt: nowIso
        };
      }

      return next;
    });

    setFeedback({
      tone: "success",
      message: `${targets.length} target queue ditandai selesai.`
    });
  };

  const handleBulkReactivateQueue = () => {
    const targets = followUpQueue.filter((candidate) => candidate.followUpStatus !== "pending");

    if (targets.length === 0) {
      setFeedback({
        tone: "success",
        message: "Tidak ada target queue yang perlu diaktifkan kembali."
      });
      return;
    }

    setFollowUpProgress((current) => {
      const next = { ...current };

      for (const candidate of targets) {
        delete next[candidate.customer.id];
      }

      return next;
    });

    setFeedback({
      tone: "success",
      message: `${targets.length} target queue diaktifkan kembali.`
    });
  };

  const handleCopyReminder = async (candidate: FollowUpCandidate) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(candidate.message);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = candidate.message;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (!copied) {
          throw new Error("Clipboard API tidak tersedia.");
        }
      }

      setFeedback({
        tone: "success",
        message: `Pesan follow-up untuk ${candidate.customer.name} berhasil disalin.`
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Gagal menyalin pesan follow-up."
      });
    }
  };

  const handleExportFollowUpCsv = () => {
    const header = [
      "customer_id",
      "name",
      "segment",
      "follow_up_status",
      "priority",
      "score",
      "reason",
      "action",
      "recommended_message",
      "phone",
      "whatsapp_link",
      "outstanding_debt",
      "loyalty_points",
      "last_transaction_at",
      "days_since_last_transaction",
      "snoozed_until",
      "status_updated_at"
    ];

    const lines = filteredFollowUpCandidates.map((candidate) => {
      const insight = customerInsights.get(candidate.customer.id) || {
        transactionCount: 0,
        totalSpend: 0,
        earnedPoints: 0,
        redeemedPoints: 0,
        netPoints: 0,
        averageTicket: 0,
        lastTransactionAt: undefined
      };

      const waNumber = normalizeWhatsappNumber(candidate.customer.phone);
      const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(candidate.message)}` : "";

      return [
        csvEscape(candidate.customer.id),
        csvEscape(candidate.customer.name),
        csvEscape(SEGMENT_LABEL[candidate.segment]),
        csvEscape(FOLLOW_UP_STATUS_LABEL[candidate.followUpStatus]),
        csvEscape(FOLLOW_UP_PRIORITY_LABEL[candidate.priority]),
        csvEscape(candidate.score),
        csvEscape(candidate.reason),
        csvEscape(candidate.actionLabel),
        csvEscape(candidate.message),
        csvEscape(candidate.customer.phone || ""),
        csvEscape(waLink),
        csvEscape(Math.max(0, Math.round(Number(candidate.customer.outstanding_debt || 0)))),
        csvEscape(Math.max(0, Math.round(Number(candidate.customer.loyalty_points || 0)))),
        csvEscape(insight.lastTransactionAt || ""),
        csvEscape(candidate.daysSinceLastTransaction ?? ""),
        csvEscape(candidate.snoozedUntil || ""),
        csvEscape(candidate.statusUpdatedAt || "")
      ].join(",");
    });

    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `follow-up-queue-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback({
      tone: "success",
      message: `Ekspor follow-up CSV berhasil (${filteredFollowUpCandidates.length} target).`
    });
  };

  const handleExportCsv = () => {
    const header = [
      "customer_id",
      "name",
      "phone",
      "email",
      "tier",
      "segment",
      "loyalty_points",
      "outstanding_debt",
      "transaction_count",
      "total_spend",
      "average_ticket",
      "earned_points",
      "redeemed_points",
      "net_points",
      "last_transaction_at"
    ];

    const lines = filteredCustomers.map((customer) => {
      const insight = customerInsights.get(customer.id) || {
        transactionCount: 0,
        totalSpend: 0,
        earnedPoints: 0,
        redeemedPoints: 0,
        netPoints: 0,
        averageTicket: 0,
        lastTransactionAt: undefined
      };

      const segment = customerSegmentById.get(customer.id) || "regular";

      return [
        csvEscape(customer.id),
        csvEscape(customer.name),
        csvEscape(customer.phone || ""),
        csvEscape(customer.email || ""),
        csvEscape(customer.member_tier),
        csvEscape(SEGMENT_LABEL[segment]),
        csvEscape(Math.max(0, Math.round(Number(customer.loyalty_points || 0)))),
        csvEscape(Math.max(0, Math.round(Number(customer.outstanding_debt || 0)))),
        csvEscape(insight.transactionCount),
        csvEscape(Math.round(insight.totalSpend)),
        csvEscape(Math.round(insight.averageTicket)),
        csvEscape(insight.earnedPoints),
        csvEscape(insight.redeemedPoints),
        csvEscape(insight.netPoints),
        csvEscape(insight.lastTransactionAt || "")
      ].join(",");
    });

    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customer-intelligence-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback({
      tone: "success",
      message: `Ekspor CSV berhasil untuk ${filteredCustomers.length} pelanggan.`
    });
  };

  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <h2 className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">Customer Intelligence Hub</h2>
        <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
          Kelola pelanggan, loyalitas, dan kasbon dari satu dashboard operasional.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-surface-container-lowest px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Total Pelanggan</p>
            <p className="font-headline text-xl font-extrabold text-on-surface">{customers.length}</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Pelanggan Kasbon</p>
            <p className="font-headline text-xl font-extrabold text-error">{summary.activeDebtors}</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Portofolio Poin</p>
            <p className="font-headline text-xl font-extrabold text-primary">{summary.portfolioPoints.toLocaleString("id-ID")}</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Total Kasbon</p>
            <p className="font-headline text-xl font-extrabold text-on-surface">Rp {Math.round(summary.totalOutstandingDebt).toLocaleString("id-ID")}</p>
          </div>
        </div>

        <form onSubmit={handleAddCustomer} className="mt-4 grid gap-2.5">
          <input
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            name="name"
            type="text"
            placeholder="Nama lengkap pelanggan"
            required
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
              name="phone"
              type="tel"
              placeholder="Nomor Telepon / WhatsApp"
            />
            <input
              className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
              name="email"
              type="email"
              placeholder="Email (opsional)"
            />
          </div>
          <select
            name="memberTier"
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
            defaultValue="Silver"
          >
            <option value="Silver">Member Silver (Standar)</option>
            <option value="Gold">Member Gold (VIP)</option>
            <option value="Platinum">Member Platinum (Priority)</option>
          </select>
          <button
            type="submit"
            className="h-11 rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-on-primary transition hover:brightness-105"
          >
            Simpan Pelanggan Baru
          </button>
        </form>

        {feedback && (
          <p
            className={
              feedback.tone === "success"
                ? "mt-3 rounded-xl bg-secondary-container/45 px-3 py-2 text-xs font-semibold text-on-secondary-container"
                : "mt-3 rounded-xl bg-error-container px-3 py-2 text-xs font-semibold text-on-error-container"
            }
          >
            {feedback.message}
          </p>
        )}

        <p className="mt-3 text-[11px] text-on-surface-variant">
          Kontribusi pelanggan terdaftar: Rp {Math.round(summary.totalCustomerRevenue).toLocaleString("id-ID")}
          {" "}dari {summary.completedTransactions.toLocaleString("id-ID")} transaksi selesai.
        </p>

        <div className="mt-4 rounded-2xl bg-surface-container-lowest p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">Follow-up Queue Otomatis</h3>
            <span className="rounded-full bg-surface-container-high px-2 py-1 text-[10px] font-semibold text-on-surface-variant">
              {filteredFollowUpCandidates.length} / {followUpCandidates.length} target
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {FOLLOW_UP_FILTERS.map((filter) => {
              const count =
                filter.id === "active"
                  ? followUpStatusCounts.pending
                  : filter.id === "snoozed"
                    ? followUpStatusCounts.snoozed
                    : filter.id === "completed"
                      ? followUpStatusCounts.completed
                      : followUpCandidates.length;

              const active = followUpFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setFollowUpFilter(filter.id)}
                  className={
                    active
                      ? "h-7 rounded-lg bg-primary px-2 text-[10px] font-semibold text-on-primary"
                      : "h-7 rounded-lg bg-surface-container-low px-2 text-[10px] font-semibold text-on-surface-variant"
                  }
                >
                  {filter.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-surface-container-low px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Urgent Aktif</p>
              <p className="text-sm font-bold text-error">{followUpKpis.urgentPendingCount}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Snooze Due &lt;24j</p>
              <p className="text-sm font-bold text-tertiary">{followUpKpis.snoozedDueSoonCount}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Debt Risk Aktif</p>
              <p className="text-sm font-bold text-on-surface">{followUpKpis.pendingDebtRiskCount}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Selesai 7 Hari</p>
              <p className="text-sm font-bold text-secondary">{followUpKpis.completedLast7Days}</p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleBulkSnoozeQueue(1)}
              className="h-7 rounded-lg bg-tertiary-container px-2 text-[10px] font-semibold text-on-tertiary-container transition hover:brightness-95"
            >
              Snooze Queue 1 Hari
            </button>
            <button
              type="button"
              onClick={handleBulkCompleteQueue}
              className="h-7 rounded-lg bg-secondary-container px-2 text-[10px] font-semibold text-on-secondary-container transition hover:brightness-95"
            >
              Selesaikan Queue
            </button>
            <button
              type="button"
              onClick={handleBulkReactivateQueue}
              className="h-7 rounded-lg bg-surface-container-high px-2 text-[10px] font-semibold text-on-surface transition hover:bg-surface-container-highest"
            >
              Aktifkan Queue
            </button>
          </div>

          {followUpQueue.length === 0 ? (
            <p className="mt-2 text-xs text-on-surface-variant">Belum ada pelanggan prioritas untuk follow-up.</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {followUpQueue.map((candidate) => {
                const waNumber = normalizeWhatsappNumber(candidate.customer.phone);
                const waHref = waNumber
                  ? `https://wa.me/${waNumber}?text=${encodeURIComponent(candidate.message)}`
                  : null;

                return (
                  <li key={candidate.customer.id} className="rounded-xl bg-surface-container-low px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <p className="text-xs font-semibold text-on-surface">{candidate.customer.name}</p>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className={followUpStatusClass(candidate.followUpStatus)}>
                          {FOLLOW_UP_STATUS_LABEL[candidate.followUpStatus]}
                        </span>
                        <span className={followUpPriorityClass(candidate.priority)}>
                          {FOLLOW_UP_PRIORITY_LABEL[candidate.priority]}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-on-surface-variant">{candidate.reason}</p>
                    <p className="text-[11px] font-semibold text-on-surface">Aksi: {candidate.actionLabel}</p>
                    {candidate.followUpStatus === "snoozed" && candidate.snoozedUntil && (
                      <p className="mt-1 text-[11px] text-on-surface-variant">
                        Ditunda sampai {new Date(candidate.snoozedUntil).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })} ({formatRemainingTime(candidate.snoozedUntil)})
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          void handleCopyReminder(candidate);
                        }}
                        className="h-7 rounded-lg bg-primary px-2.5 text-[11px] font-semibold text-on-primary transition hover:brightness-95"
                      >
                        Copy Pesan
                      </button>
                      {waHref && (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 rounded-lg bg-secondary-container px-2.5 text-[11px] font-semibold leading-7 text-on-secondary-container transition hover:brightness-95"
                        >
                          Buka WhatsApp
                        </a>
                      )}
                      {candidate.followUpStatus === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSnoozeFollowUp(candidate, 1)}
                            className="h-7 rounded-lg bg-tertiary-fixed/65 px-2.5 text-[11px] font-semibold text-on-tertiary-fixed-variant transition hover:brightness-95"
                          >
                            Snooze 1 Hari
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnoozeFollowUp(candidate, 3)}
                            className="h-7 rounded-lg bg-tertiary-container px-2.5 text-[11px] font-semibold text-on-tertiary-container transition hover:brightness-95"
                          >
                            Snooze 3 Hari
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCompleteFollowUp(candidate)}
                            className="h-7 rounded-lg bg-secondary-container px-2.5 text-[11px] font-semibold text-on-secondary-container transition hover:brightness-95"
                          >
                            Tandai Selesai
                          </button>
                        </>
                      )}
                      {candidate.followUpStatus !== "pending" && (
                        <button
                          type="button"
                          onClick={() => handleReactivateFollowUp(candidate)}
                          className="h-7 rounded-lg bg-surface-container-high px-2.5 text-[11px] font-semibold text-on-surface transition hover:bg-surface-container-highest"
                        >
                          Aktifkan Lagi
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <aside className="rounded-3xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface sm:text-3xl">Daftar Pelanggan</h2>
            <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">
              Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportFollowUpCsv}
              className="h-9 rounded-lg bg-secondary-container px-3 text-xs font-semibold text-on-secondary-container transition hover:brightness-95"
            >
              Export Follow-up
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary transition hover:brightness-95"
            >
              Export CSV
            </button>
            <label className="inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface-variant">
              <input
                type="checkbox"
                checked={showDebtOnly}
                onChange={(event) => setShowDebtOnly(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Hanya kasbon
            </label>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SEGMENT_FILTERS.map((filter) => {
            const isActive = segmentFilter === filter.id;
            const count = filter.id === "all" ? customers.length : segmentCounts[filter.id];

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSegmentFilter(filter.id)}
                className={
                  isActive
                    ? "h-8 rounded-lg bg-primary px-2.5 text-[11px] font-semibold text-on-primary"
                    : "h-8 rounded-lg bg-surface-container-lowest px-2.5 text-[11px] font-semibold text-on-surface-variant"
                }
              >
                {filter.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama, telepon, email, atau ID pelanggan"
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as CustomerSortMode)}
            className="h-11 rounded-xl border-none bg-surface-container-lowest px-3 text-sm text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
          >
            <option value="recent">Urut: Aktivitas Terbaru</option>
            <option value="spend">Urut: Belanja Tertinggi</option>
            <option value="points">Urut: Poin Loyalty</option>
            <option value="debt">Urut: Kasbon Terbesar</option>
          </select>
        </div>

        <ul className="mt-4 grid gap-2">
          {filteredCustomers.length === 0 && (
            <li className="rounded-xl bg-surface-container-lowest p-5 text-center text-sm text-on-surface-variant">
              Tidak ada pelanggan yang cocok dengan filter saat ini.
            </li>
          )}

          {filteredCustomers.map((customer) => {
            const insight = customerInsights.get(customer.id) || {
              transactionCount: 0,
              totalSpend: 0,
              earnedPoints: 0,
              redeemedPoints: 0,
              netPoints: 0,
              averageTicket: 0,
              lastTransactionAt: undefined
            };

            const segment = customerSegmentById.get(customer.id) || "regular";
            const customerSales = customerSalesTimeline.get(customer.id) || [];
            const recentSales = customerSales.slice(0, 3);
            const outstandingDebt = Math.max(0, Number(customer.outstanding_debt || 0));
            const lastTransactionLabel = insight.lastTransactionAt
              ? new Date(insight.lastTransactionAt).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })
              : "Belum ada transaksi";

            return (
              <li key={customer.id} className="rounded-xl bg-surface-container-lowest p-3.5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-bold text-on-surface">{customer.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-on-surface-variant">
                      {customer.phone || customer.email || "Kontak belum diisi"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={tierBadgeClass(customer.member_tier)}>{customer.member_tier}</span>
                    <span className={segmentBadgeClass(segment)}>{SEGMENT_LABEL[segment]}</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-outline-variant/20 pt-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-on-surface-variant">Saldo Poin</p>
                    <p className="text-sm font-bold text-primary">
                      {Math.max(0, Math.round(Number(customer.loyalty_points || 0))).toLocaleString("id-ID")} poin
                    </p>
                  </div>
                  <div>
                    <p className="text-right text-[10px] font-semibold uppercase text-on-surface-variant">Kasbon Aktif</p>
                    <p className={`text-right text-sm font-bold ${outstandingDebt > 0 ? "text-error" : "text-on-surface"}`}>
                      Rp {Math.round(outstandingDebt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-on-surface-variant">Transaksi Selesai</p>
                    <p className="text-sm font-bold text-on-surface">{insight.transactionCount.toLocaleString("id-ID")}</p>
                  </div>
                  <div>
                    <p className="text-right text-[10px] font-semibold uppercase text-on-surface-variant">Total Belanja</p>
                    <p className="text-right text-sm font-bold text-on-surface">Rp {Math.round(insight.totalSpend).toLocaleString("id-ID")}</p>
                  </div>
                </div>

                <div className="mt-2 rounded-xl bg-surface-container-low px-3 py-2 text-[11px] text-on-surface-variant">
                  Earned {insight.earnedPoints.toLocaleString("id-ID")} • Redeemed {insight.redeemedPoints.toLocaleString("id-ID")}
                  {" "}• Net {insight.netPoints >= 0 ? "+" : ""}{insight.netPoints.toLocaleString("id-ID")}
                  {" "}• Rata-rata tiket Rp {Math.round(insight.averageTicket).toLocaleString("id-ID")}
                </div>

                <p className="mt-2 text-[11px] text-on-surface-variant">Transaksi terakhir: {lastTransactionLabel}</p>

                <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <label className="grid gap-1 text-[10px] font-semibold uppercase text-on-surface-variant">
                    Tier Member
                    <select
                      value={customer.member_tier}
                      onChange={(event) => handleTierChange(customer, event.target.value)}
                      className="h-9 rounded-lg border-none bg-surface-container-high px-2 text-xs font-semibold text-on-surface outline-none ring-1 ring-outline-variant/20 focus:ring-2 focus:ring-primary/30"
                    >
                      {MEMBER_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleCustomerTimeline(customer.id)}
                    className="h-9 rounded-lg bg-surface-container-high px-3 text-xs font-semibold text-on-surface transition hover:bg-surface-container-highest"
                  >
                    {expandedCustomerId === customer.id ? "Sembunyikan Riwayat" : "Lihat Riwayat"}
                  </button>
                  <button
                    type="button"
                    disabled={outstandingDebt <= 0}
                    onClick={() => handleSettleDebt(customer)}
                    className={
                      outstandingDebt > 0
                        ? "h-9 rounded-lg bg-error-container px-3 text-xs font-semibold text-on-error-container transition hover:brightness-95"
                        : "h-9 rounded-lg bg-surface-container-high px-3 text-xs font-semibold text-on-surface-variant"
                    }
                  >
                    Lunasi Kasbon
                  </button>
                </div>

                {expandedCustomerId === customer.id && (
                  <div className="mt-2 rounded-xl bg-surface-container-low px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                      Riwayat Transaksi Terbaru
                    </p>
                    {recentSales.length === 0 ? (
                      <p className="mt-2 text-xs text-on-surface-variant">Belum ada transaksi untuk pelanggan ini.</p>
                    ) : (
                      <ul className="mt-2 grid gap-2">
                        {recentSales.map((sale) => {
                          const saleTimestamp = new Date(sale.createdAt).getTime();
                          const saleDateLabel = Number.isFinite(saleTimestamp)
                            ? new Date(saleTimestamp).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "-";
                          const redeemed = Math.max(0, Math.round(Number(sale.redeemedPoints || 0)));
                          const earned = Math.max(0, Math.round(Number(sale.earnedPoints || 0)));

                          return (
                            <li key={sale.id} className="rounded-lg bg-surface-container-lowest px-2.5 py-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold text-on-surface">{sale.id}</p>
                                  <p className="text-[11px] text-on-surface-variant">{saleDateLabel}</p>
                                </div>
                                <span className={saleStatusClass(sale.status)}>{SALE_STATUS_LABEL[sale.status]}</span>
                              </div>
                              <p className="mt-1 text-xs font-semibold text-on-surface">
                                Total Rp {Math.round(Number(sale.total || 0)).toLocaleString("id-ID")}
                              </p>
                              {(redeemed > 0 || earned > 0) && (
                                <p className="text-[11px] text-on-surface-variant">
                                  Loyalty +{earned.toLocaleString("id-ID")} • -{redeemed.toLocaleString("id-ID")}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    </section>
  );
}
