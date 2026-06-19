import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteEmissionsChart } from "@/components/report-builder/charts/SiteEmissionsChart";
import { formatTonnes } from "@/lib/formatters";

export function SiteEmissionsTable({ sites }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>Site emissions</CardTitle>
        <span className="shrink-0 text-sm text-muted-foreground">
          {sites.length} sites
        </span>
      </CardHeader>
      <CardContent className="min-w-0 space-y-5">
        <SiteEmissionsChart sites={sites} />
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Entity</th>
                <th className="px-4 py-3 text-right font-medium">Scope 1</th>
                <th className="px-4 py-3 text-right font-medium">Scope 2</th>
                <th className="px-4 py-3 text-right font-medium">Scope 3</th>
                <th className="py-3 pl-4 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.entity} className="border-b border-border/70 text-foreground/80">
                  <td className="max-w-48 break-words py-3 pr-4 font-medium text-foreground">
                    {site.entity}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTonnes(site.scope1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTonnes(site.scope2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatTonnes(site.scope3)}</td>
                  <td className="py-3 pl-4 text-right tabular-nums">{formatTonnes(site.totalEmissions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
