import { memo, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteEmissionsChart } from "@/components/report-builder/charts/SiteEmissionsChart";
import { formatEmissions } from "@/lib/formatters";

// Ranked table for any entity type (OCF sites or PCF products) with dynamic
// per-column values driven by the report model's entityColumns.
export const SiteEmissionsTable = memo(function SiteEmissionsTable({
  entities,
  columns,
  entityLabel = "Entity",
  noun = "entities",
  title = "Entity emissions",
  unit,
  showFunctionalUnit = false,
}) {
  const minTableWidth = useMemo(() => 280 + columns.length * 90, [columns.length]);

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <span className="shrink-0 text-sm text-muted-foreground">
          {entities.length} {noun}
        </span>
      </CardHeader>
      <CardContent className="min-w-0 space-y-5">
        <SiteEmissionsChart entities={entities} unit={unit} />
        <div className="-mx-5 overflow-x-auto px-5">
          <table
            className="w-full border-collapse text-sm"
            style={{ minWidth: `${minTableWidth}px` }}
          >
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">
                  {entityLabel}
                  {showFunctionalUnit ? " & FU" : ""}
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-right font-medium"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="py-3 pl-4 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr
                  key={entity.name}
                  className="border-b border-border/70 text-foreground/80"
                >
                  <td className="max-w-48 break-words py-3 pr-4 font-medium text-foreground">
                    {entity.name}
                    {showFunctionalUnit && entity.meta ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {entity.meta}
                      </span>
                    ) : null}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-right tabular-nums"
                    >
                      {formatEmissions(entity.values[column.key], unit)}
                    </td>
                  ))}
                  <td className="py-3 pl-4 text-right tabular-nums">
                    {formatEmissions(entity.totalEmissions, unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});
