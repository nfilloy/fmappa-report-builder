import { formatPercent, formatTonnes } from "@/lib/formatters";

const BAR_COLORS = ["bg-cyan-300", "bg-emerald-300", "bg-amber-300"];

export function ScopeBreakdown({ scopes }) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
      <h2 className="text-lg font-semibold text-white">Scope breakdown</h2>
      <div className="mt-5 space-y-4">
        {scopes.map((scope, index) => (
          <div key={scope.label}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-neutral-100">{scope.label}</span>
              <span className="text-neutral-400">
                {formatTonnes(scope.value)} · {formatPercent(scope.percentage)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-neutral-800">
              <div
                className={`h-full rounded-full ${BAR_COLORS[index]}`}
                style={{ width: `${Math.min(scope.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
