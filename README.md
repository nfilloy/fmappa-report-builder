# Footprint Mappa Report Builder

Path A MVP for generating a simple Organisational Carbon Footprint (OCF) report from a CSV uploaded in the browser.

The current flow is:

```txt
User uploads CSV -> browser parser -> normalised OCF model -> preview -> PDF download
```

Uploaded files are not copied into the repository, sent to an API route, stored in a database, or persisted by the app.

## Stack

- Next.js 16
- React 19
- App Router
- JavaScript / JSX
- Tailwind CSS v4
- shadcn/ui (`new-york` style)
- Radix UI
- Lucide icons
- @react-pdf/renderer

## How To Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## CSV Format

The MVP accepts OCF-compatible `.csv` files with at least these columns:

```txt
entity
total_emissions
total_scope_1
total_scope_2
total_scope_3
```

If a row named `Total empresa` exists, it is treated as the official company total. If it is missing, totals are calculated by summing the site rows.

Extra columns are ignored by default, except recognised Scope 3 category columns used for the top category list:

```txt
purchased_goods_services
capital_goods
fuel_energy_related
upstream_transport_distribution
waste_generated_operations
business_travel
employee_commuting
upstream_leased_assets
downstream_transport_distribution
processing_sold_products
use_sold_products
end_of_life_sold_products
downstream_leased_assets
franchises
investments
```

## PDF Strategy

PDF generation is client-side with `@react-pdf/renderer`. The PDF uses the same normalised OCF model as the browser preview, keeping totals and site values consistent.

The generated report is intentionally reduced: executive summary, methodology, organisational boundary, global results, scope breakdown, site emissions, key insights, and limitations. It does not attempt to replicate a full Word report.

## Build / Reuse / Buy

- Build: CSV parsing, OCF normalisation, preview UI, validation messages and report layout.
- Reuse: Next.js, Tailwind CSS, shadcn-style primitives, Lucide icons and browser file APIs.
- Buy/adopt: `@react-pdf/renderer` for PDF rendering instead of implementing a PDF engine.

## AI Usage

AI support was used to scaffold and implement this MVP quickly from the technical challenge requirements. The implementation remains deterministic application code: uploaded CSV data is parsed locally and is not sent to an AI model.

## Limitations

- OCF only; PCF is not implemented.
- No backend, database, persistence or authentication.
- Validation is intentionally basic and schema-focused.
- Numeric parsing supports common plain decimal values, but not every locale/accounting notation.
- Emission factors and ISO audit logic are outside this MVP.
