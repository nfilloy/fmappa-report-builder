import { formatTonnes } from "@/lib/formatters";

export function TopCategories({ categories }) {
  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-950 p-5">
      <h2 className="text-lg font-semibold text-white">Top Scope 3 categories</h2>
      {categories.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-neutral-400">
          No recognised Scope 3 category columns were found in this CSV.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {categories.map((category) => (
            <li
              key={category.key}
              className="flex items-center justify-between gap-4 rounded-md bg-neutral-900 px-4 py-3 text-sm"
            >
              <span className="text-neutral-100">{category.label}</span>
              <span className="font-medium text-white">{formatTonnes(category.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
