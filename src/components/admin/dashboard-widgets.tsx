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

export type SalesPoint = { date: string; revenue: number };
export type StatusPoint = { name: string; value: number; color: string };

export function DashboardDateCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e3ebe2] bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(20,67,43,0.05)]">
      <CalendarDays className="h-5 w-5 text-[#4f9c42]" />
      <div className="text-xs text-[#6b7a70]">
        <p>{new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(now)}</p>
        <p className="mt-1 flex items-center gap-1 font-semibold text-[#173d2b]">
          <Clock3 className="h-3.5 w-3.5" />
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
    <div className="rounded-xl border border-[#e3ebe2] bg-white p-3 shadow-[0_8px_24px_rgba(20,67,43,0.05)] sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-[#173d2b]">Sales Overview</h2>
          <p className="mt-1 text-xs text-[#6b7a70]">Revenue from completed and active orders</p>
        </div>
        <select
          value={range}
          onChange={(event) => setRange(event.target.value)}
          className="rounded-xl border border-[#dfe9df] bg-[#f8fbf7] px-3 py-2 text-xs font-medium text-[#315b45] outline-none focus:ring-2 focus:ring-[#69be28]/30"
          aria-label="Sales date range"
        >
          <option value="7">Today / 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 3 months</option>
          <option value={String(data.length)}>This year</option>
        </select>
      </div>
      {visible.length > 0 ? (
        <ResponsiveContainer width="100%" height={125}>
          <BarChart data={visible} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#edf2eb" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#718177" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#718177" }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} width={55} />
            <Tooltip formatter={(value) => [formatINR(Number(value)), "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid #e3ebe2", fontSize: 12 }} />
            <Bar dataKey="revenue" fill="#69be28" radius={[5, 5, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[125px] items-center justify-center rounded-xl bg-[#f8fbf7] text-xs text-[#6b7a70]">No sales data for this period.</div>
      )}
    </div>
  );
}

export function OrderStatusChart({ data, total }: { data: StatusPoint[]; total: number }) {
  return (
    <div className="rounded-xl border border-[#e3ebe2] bg-white p-3 shadow-[0_8px_24px_rgba(20,67,43,0.05)] sm:p-4">
      <h2 className="font-display text-base font-semibold text-[#173d2b]">Order Status</h2>
      <p className="mt-1 text-xs text-[#6b7a70]">Current order distribution</p>
      {total > 0 ? (
        <>
          <div className="relative mx-auto mt-1 h-20 w-full max-w-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={30} outerRadius={45} paddingAngle={3} stroke="none">
                  {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-semibold text-[#173d2b]">{total}</span>
              <span className="text-[11px] text-[#6b7a70]">Total Orders</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#52695b]"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />{entry.name}</span>
                <span className="font-semibold text-[#173d2b]">{entry.value} <span className="font-normal text-[#8a998e]">{Math.round((entry.value / total) * 100)}%</span></span>
              </div>
            ))}
          </div>
        </>
      ) : <div className="flex h-48 items-center justify-center text-sm text-[#6b7a70]">No orders yet.</div>}
    </div>
  );
}
