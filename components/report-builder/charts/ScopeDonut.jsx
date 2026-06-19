"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, formatTonnes } from "@/lib/formatters";
import { SCOPE_COLORS } from "@/lib/report/chartTheme";

export function ScopeDonut({ scopes, total }) {
  const data = scopes.map((scope, index) => ({
    name: scope.label,
    value: Math.max(scope.value, 0),
    percentage: scope.percentage,
    color: SCOPE_COLORS[index % SCOPE_COLORS.length],
  }));

  const hasValues = data.some((entry) => entry.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scope breakdown</CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col items-center gap-6 sm:flex-row">
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
              {formatTonnes(total)}
            </span>
          </div>
        </div>
        <ul className="min-w-0 w-full space-y-3">
          {data.map((entry) => (
            <li
              key={entry.name}
              className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1 text-sm"
            >
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="min-w-0 break-words font-medium text-foreground">
                {entry.name}
              </span>
              <span className="col-start-2 break-words text-muted-foreground tabular-nums">
                {formatTonnes(entry.value)} · {formatPercent(entry.percentage)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
