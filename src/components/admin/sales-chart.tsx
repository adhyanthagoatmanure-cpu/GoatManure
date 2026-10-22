"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR } from "@/lib/utils";
import { CHART_COLORS } from "@/components/admin/chart-colors";

export function SalesChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.bar} stopOpacity={0.25} />
            <stop offset="95%" stopColor={CHART_COLORS.bar} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: CHART_COLORS.axisText }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: CHART_COLORS.axisText }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => formatINR(v)} />
        <Tooltip
          formatter={(value) => [formatINR(Number(value)), "Revenue"]}
          contentStyle={{ borderRadius: 12, border: `1px solid ${CHART_COLORS.grid}`, fontSize: 13, color: CHART_COLORS.ink }}
        />
        <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.bar} strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
