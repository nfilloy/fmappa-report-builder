import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteEmissionsChart } from "@/components/report-builder/charts/SiteEmissionsChart";
import { formatTonnes } from "@/lib/formatters";

export function SiteEmissionsTable({ sites }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Site emissions</CardTitle>
        <span className="text-sm text-muted-foreground">{sites.length} sites</span>
      </CardHeader>
      <CardContent className="space-y-5">
        <SiteEmissionsChart sites={sites} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-sm">
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
                  <td className="py-3 pr-4 font-medium text-foreground">{site.entity}</td>
                  <td className="px-4 py-3 text-right">{formatTonnes(site.scope1)}</td>
                  <td className="px-4 py-3 text-right">{formatTonnes(site.scope2)}</td>
                  <td className="px-4 py-3 text-right">{formatTonnes(site.scope3)}</td>
                  <td className="py-3 pl-4 text-right">{formatTonnes(site.totalEmissions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
