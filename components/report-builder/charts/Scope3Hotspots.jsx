"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatTonnes } from "@/lib/formatters";
import { CHART_AXIS, CHART_GRID, SEQUENTIAL_COLORS } from "@/lib/report/chartTheme";

function shortLabel(value) {
  const label = String(value || "");
  return label.length > 22 ? `${label.slice(0, 21)}...` : label;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-[#e0e4eb] bg-white px-3 py-2 text-xs shadow-md">
      <p className="max-w-60 break-words font-medium text-foreground">
        {point.label}
      </p>
      <p className="text-muted-foreground tabular-nums">{formatTonnes(point.value)}</p>
    </div>
  );
}

export function Scope3Hotspots({ categories }) {
  const data = [...categories].sort((a, b) => b.value - a.value);

  return (
    <div className="h-72 min-w-0 w-full overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke={CHART_GRID}
            strokeDasharray="3 3"
          />
          <XAxis
            type="number"
            tick={{ fill: CHART_AXIS, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(value).toLocaleString("en")}`}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={132}
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickFormatter={shortLabel}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "rgba(4, 18, 130, 0.06)" }} content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
            {data.map((entry, index) => (
              <Cell
                key={entry.key}
                fill={SEQUENTIAL_COLORS[index % SEQUENTIAL_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
