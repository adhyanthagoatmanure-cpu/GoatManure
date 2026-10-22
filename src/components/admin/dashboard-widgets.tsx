"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Clock3 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { PANEL_GLASS } from "@/components/admin/admin-ui";
import { CHART_COLORS } from "@/components/admin/chart-colors";

export type SalesPoint = { date: string; revenue: number };
export type StatusPoint = { name: string; value: number; color: string };

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: `1px solid ${CHART_COLORS.grid}`,
  fontSize: 12,
  color: CHART_COLORS.ink,
  boxShadow: "0 12px 28px -16px rgba(28, 51, 20, 0.45)",
} as const;

export function DashboardDateCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={`${PANEL_GLASS} flex items-center gap-3 px-4 py-3`}>
      <CalendarDays className="h-5 w-5 text-leaf" aria-hidden />
      <div className="text-xs text-stone">
        <p suppressHydrationWarning>{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(now)}</p>
        <p suppressHydrationWarning className="mt-1 flex items-center gap-1 font-semibold text-canopy">
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(now)}
        </p>
      </div>
    </div>
  );
}

export function SalesOverview({ data }: { data: SalesPoint[] }) {
  const [range, setRange] = useState("30");
  const visible = useMemo(() => data.slice(-Number(range)), [data, range]);

  return (
    <div className={`${PANEL_GLASS} p-4 sm:p-5`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Sales Overview</h2>
          <p className="mt-0.5 text-xs text-stone">Revenue from completed and active orders</p>
        </div>
        <select
          value={range}
          onChange={(event) => setRange(event.target.value)}
          className="h-11 rounded-[var(--radius-sm)] border border-field-border bg-white/90 px-3 text-xs font-medium text-ink transition-[border-color,box-shadow] focus:border-canopy focus:outline-none focus:ring-4 focus:ring-canopy/15 sm:h-9"
          aria-label="Sales date range"
        >
          <option value="7">Today / 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 3 months</option>
          <option value={String(data.length)}>This year</option>
        </select>
      </div>
      {visible.length > 0 ? (
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={visible} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_COLORS.axisText }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.axisText }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} width={55} />
            <Tooltip
              cursor={{ fill: CHART_COLORS.barCursor }}
              formatter={(value) => [formatINR(Number(value)), "Revenue"]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Bar dataKey="revenue" fill={CHART_COLORS.bar} radius={[5, 5, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[170px] items-center justify-center rounded-[var(--radius-sm)] bg-sage/60 text-sm text-stone">
          No sales data for this period.
        </div>
      )}
    </div>
  );
}

export function OrderStatusChart({ data, total }: { data: StatusPoint[]; total: number }) {
  return (
    <div className={`${PANEL_GLASS} @container p-4 sm:p-5`}>
      <h2 className="font-display text-lg font-semibold text-ink">Order Status</h2>
      <p className="mt-0.5 text-xs text-stone">Current order distribution</p>
      {total > 0 ? (
        <>
          <div className="relative mx-auto mt-3 h-28 w-full max-w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={38} outerRadius={54} paddingAngle={3} stroke="none">
                  {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-semibold text-ink">{total}</span>
              <span className="text-[11px] text-stone">Total Orders</span>
            </div>
          </div>
          {/* The legend carries every label and number, so status is never colour-only. */}
          <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 @[18rem]:grid-cols-2">
            {data.map((entry) => (
              <li key={entry.name} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 text-stone">
                  <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
                  {entry.name}
                </span>
                <span className="whitespace-nowrap font-semibold text-ink">
                  {entry.value} <span className="font-normal text-stone">{Math.round((entry.value / total) * 100)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex h-48 items-center justify-center text-sm text-stone">No orders yet.</div>
      )}
    </div>
  );
}
