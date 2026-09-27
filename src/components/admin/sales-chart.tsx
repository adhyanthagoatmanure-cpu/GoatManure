"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR } from "@/lib/utils";

export function SalesChart({ data }: { data: { date: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2B4C1F" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#2B4C1F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4DCC8" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6B6B5E" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#6B6B5E" }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => formatINR(v)} />
        <Tooltip
          formatter={(value) => [formatINR(Number(value)), "Revenue"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #E4DCC8", fontSize: 13 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#2B4C1F" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
