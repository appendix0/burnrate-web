"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { UsageRecord } from "@/lib/models/usageRecord";

interface SpendChartProps {
  data: UsageRecord[];
  color?: string;
  height?: number;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDay(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground mb-1">{formatDay(label)}</p>
      <p className="font-mono font-semibold">{formatUsd(payload[0].value ?? 0)}</p>
    </div>
  );
}

export function SpendChart({
  data,
  color = "#ef4444",
  height = 220,
}: SpendChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-muted-foreground"
      >
        No daily data available
      </div>
    );
  }

  const gradientId = `grad-${color.replace("#", "")}`;

  // Show every Nth label so the axis doesn't crowd
  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(0 0% 16%)"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tickFormatter={formatDay}
          interval={tickInterval}
          tick={{ fill: "hsl(0 0% 55%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tickFormatter={(v) => `$${v.toFixed(0)}`}
          tick={{ fill: "hsl(0 0% 55%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "4 4" }} />

        <Area
          type="monotone"
          dataKey="costUsd"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
