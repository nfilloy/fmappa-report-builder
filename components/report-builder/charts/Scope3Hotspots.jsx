"use client";

import { memo, useMemo } from "react";
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

import { formatEmissions } from "@/lib/formatters";
import { CHART_AXIS, CHART_GRID, SEQUENTIAL_COLORS } from "@/lib/report/chartTheme";

function shortLabel(value) {
  const label = String(value || "");
  return label.length > 22 ? `${label.slice(0, 21)}...` : label;
}

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-[#e0e4eb] bg-white px-3 py-2 text-xs shadow-md">
      <p className="max-w-60 break-words font-medium text-foreground">
        {point.label}
      </p>
      <p className="text-muted-foreground tabular-nums">{formatEmissions(point.value, unit)}</p>
    </div>
  );
}

export const Scope3Hotspots = memo(function Scope3Hotspots({ categories, unit }) {
  const data = useMemo(
    () => [...categories].sort((a, b) => b.value - a.value),
    [categories],
  );

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
          <Tooltip cursor={{ fill: "rgba(4, 18, 130, 0.06)" }} content={<ChartTooltip unit={unit} />} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
            {data.map((entry, index) => (
              <Cell
                key={entry.key}
                fill={entry.color || SEQUENTIAL_COLORS[index % SEQUENTIAL_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
