"use client";

import { memo, useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEmissions, formatPercent } from "@/lib/formatters";
import { BRAND } from "@/lib/report/chartTheme";

// Donut for any breakdown (OCF scopes or PCF lifecycle stages). Each item
// carries its own colour in the report model.
export const ScopeDonut = memo(function ScopeDonut({
  breakdown,
  total,
  title = "Breakdown",
  unit,
}) {
  const data = useMemo(
    () =>
      breakdown.map((item) => ({
        name: item.label,
        value: Math.max(item.value, 0),
        percentage: item.percentage,
        color: item.color || BRAND.navy,
      })),
    [breakdown],
  );

  const hasValues = useMemo(
    () => data.some((entry) => entry.value > 0),
    [data],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="@container flex min-w-0 flex-col items-center gap-6 @sm:flex-row">
        <div className="relative h-40 w-40 shrink-0 sm:h-44 sm:w-44">
          {hasValues ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={4}
                  cornerRadius={6}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : null}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Total
            </span>
            <span className="max-w-28 break-words text-center text-sm font-semibold leading-tight text-foreground tabular-nums sm:text-base">
              {formatEmissions(total, unit)}
            </span>
          </div>
        </div>
        <ul className="min-w-0 w-full space-y-3">
          {data.map((entry) => (
            <li
              key={entry.name}
              className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-0.5 text-sm"
            >
              <span
                aria-hidden="true"
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="min-w-0 break-words font-medium leading-snug text-foreground [hyphens:none]">
                {entry.name}
              </span>
              <span className="col-start-2 flex flex-wrap items-baseline gap-x-1.5 leading-snug text-muted-foreground tabular-nums">
                <span className="whitespace-nowrap">{formatEmissions(entry.value, unit)}</span>
                <span aria-hidden="true" className="text-muted-foreground/50">·</span>
                <span className="whitespace-nowrap">{formatPercent(entry.percentage)}</span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
});
