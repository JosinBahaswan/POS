import {
  ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
  PieChart, Pie, Cell,
  TooltipProps
} from "recharts";
import type { OwnerAnalyticsData } from "./types";

type OwnerAnalyticsInsightsSectionProps = {
  analytics: OwnerAnalyticsData;
};

const CHART_COLORS = {
  primary: "#004d64",
  secondary: "#006684",
  tertiary: "#fee3cc", // Or any suitable secondary color
  grid: "#e5e8ee",
  text: "#70787e",
  cash: "#004d64",
  card: "#6b3a00",
  qris: "#a0f399",
};

export function OwnerAnalyticsInsightsSection({ analytics }: OwnerAnalyticsInsightsSectionProps) {
  // Format data for PieChart
  const pieData = analytics.paymentSummary.filter(p => p.total > 0).map(p => ({
    name: p.label,
    value: p.total,
    color: p.key === 'cash' ? CHART_COLORS.cash : p.key === 'card' ? CHART_COLORS.card : CHART_COLORS.qris
  }));

  // Custom Tooltip for Area and Bar chart to match the UI style
  const CustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-surface-container-lowest p-3 shadow-lg border border-outline-variant/30">
          <p className="text-xs font-bold text-on-surface-variant mb-1">{label}</p>
          <p className="text-sm font-extrabold text-primary">
            Rp {(payload[0].value ?? 0).toLocaleString("id-ID")}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-surface-container-lowest p-3 shadow-lg border border-outline-variant/30">
          <p className="text-xs font-bold text-on-surface-variant mb-1">Jam {label}</p>
          <p className="text-sm font-extrabold text-primary">
            {payload[0].value ?? 0} Transaksi
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5 flex flex-col">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant mb-4">Distribusi Metode Bayar</h3>
          
          {pieData.length > 0 ? (
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl bg-surface-container-lowest p-3 shadow-lg border border-outline-variant/30">
                              <p className="text-xs font-bold text-on-surface-variant mb-1">{data.name}</p>
                              <p className="text-sm font-extrabold text-primary">Rp {data.value.toLocaleString("id-ID")}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="grid gap-3 w-full sm:w-auto flex-1">
                {analytics.paymentSummary.map((payment) => (
                  <li key={payment.key} className="flex flex-col rounded-xl bg-surface-container-lowest p-3 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs z-10">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: payment.key === 'cash' ? CHART_COLORS.cash : payment.key === 'card' ? CHART_COLORS.card : CHART_COLORS.qris }} 
                        />
                        <span className="font-semibold text-on-surface">{payment.label}</span>
                      </div>
                      <span className="font-medium text-on-surface-variant">{payment.count} trx</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-on-surface z-10 pl-5">Rp {payment.total.toLocaleString("id-ID")}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-on-surface-variant">Belum ada transaksi hari ini.</p>
            </div>
          )}
        </article>

        <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5 flex flex-col">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant mb-4">Jam Paling Ramai</h3>
          <div className="h-[230px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.timeSlotSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.grid} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: CHART_COLORS.text }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: CHART_COLORS.text }} 
                  allowDecimals={false}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Bar 
                  dataKey="count" 
                  fill={CHART_COLORS.primary} 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Tren Omzet 7 Hari</h3>
          <p className="text-sm font-extrabold text-primary">
            Total: Rp {analytics.trend.reduce((sum, item) => sum + item.revenue, 0).toLocaleString("id-ID")}
          </p>
        </div>
        
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.trend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.grid} />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: CHART_COLORS.text }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: CHART_COLORS.text }} 
                tickFormatter={(value) => `Rp ${(value / 1000).toLocaleString('id-ID')}k`}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke={CHART_COLORS.primary} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Produk Terlaris Hari Ini</h3>
          <span className="text-xs font-medium text-on-surface-variant">Top 5</span>
        </div>

        {analytics.topProducts.length === 0 ? (
          <p className="mt-3 rounded-xl bg-surface-container-lowest p-3 text-sm text-on-surface-variant">
            Belum ada transaksi hari ini.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {analytics.topProducts.map((product, index) => (
              <li key={product.name} className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-on-surface">{product.name}</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{product.qty} terjual</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </>
  );
}
