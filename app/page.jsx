import { FileText } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-wide text-orange-300">
          <FileText aria-hidden="true" className="h-5 w-5" />
          Footprint Mappa
        </div>

        <div className="mt-8 max-w-2xl">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Carbon Footprint Report Builder
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-300">
            Basic Next.js skeleton ready for the technical challenge implementation.
          </p>
        </div>
      </section>
    </main>
  );
}
