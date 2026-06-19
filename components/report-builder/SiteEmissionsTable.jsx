import { formatTonnes } from "@/lib/formatters";

export function SiteEmissionsTable({ sites }) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Site emissions</h2>
        <span className="text-sm text-neutral-400">{sites.length} sites</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-neutral-400">
              <th className="py-3 pr-4 font-medium">Entity</th>
              <th className="px-4 py-3 text-right font-medium">Scope 1</th>
              <th className="px-4 py-3 text-right font-medium">Scope 2</th>
              <th className="px-4 py-3 text-right font-medium">Scope 3</th>
              <th className="py-3 pl-4 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.entity} className="border-b border-neutral-900 text-neutral-200">
                <td className="py-3 pr-4 font-medium text-white">{site.entity}</td>
                <td className="px-4 py-3 text-right">{formatTonnes(site.scope1)}</td>
                <td className="px-4 py-3 text-right">{formatTonnes(site.scope2)}</td>
                <td className="px-4 py-3 text-right">{formatTonnes(site.scope3)}</td>
                <td className="py-3 pl-4 text-right">{formatTonnes(site.totalEmissions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
