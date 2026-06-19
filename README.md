# Footprint Mappa Report Builder

Path B-oriented Organisational Carbon Footprint (OCF) report builder built from the Path A foundation.

```txt
User uploads CSV -> browser parser -> normalised OCF model -> configurable section model -> HTML preview -> Playwright PDF
```

Uploaded files are parsed client-side. The app does not store or persist the CSV. The generated report model is sent to a minimal Next.js API route only when the user downloads the PDF.

## Chosen Path

I started with **Path A: Foundation** and evolved it into a **Path B: Customizable** report builder.

The implementation still focuses on one domain, OCF, and uses the provided ISO 14064 sample data. The report is now represented as configurable sections with basic branding controls, rendered as an HTML preview, and exported to PDF through a minimal Playwright API route.

I intentionally did not implement PCF, database persistence, authentication, full template editing, or runtime AI integration in this MVP. Path C remains a documented future evolution over the section model.

## Stack

- Next.js 16
- React 19
- App Router
- JavaScript / JSX
- Tailwind CSS v4
- shadcn/ui style primitives
- Radix UI
- Lucide icons
- Playwright

## How To Run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

For production validation:

```bash
npm run lint
npm run test
npm run build
```

## Input Data

The MVP is built for the provided OCF sample:

```txt
data/sample_ocf_iso_14064.csv
```

The expected CSV contains one row per plant plus a `Total empresa` row. The required base columns are:

```txt
entity
total_emissions
total_scope_1
total_scope_2
total_scope_3
```

The current model also recognises and uses all detailed category columns in the provided OCF sample:

```txt
scope_1_1_stationary_combustion
scope_1_2_mobile_combustion
scope_1_3_process_emissions
scope_1_4_1_refrigerant_gases
scope_1_4_2_fire_extinguishers
scope_2_1_1_purchased_electricity
scope_2_1_2_purchased_heat_or_steam
scope_3_1_1_raw_materials_or_auxiliary_materials
scope_3_1_2_water_consumption
scope_3_1_3_services
scope_3_2_capital_fixed_assets
scope_3_3_fuel_and_energy_related_activities
scope_3_4_upstream_transport_and_distribution
scope_3_5_waste_generated_in_operations
scope_3_6_business_travel
scope_3_7_employee_commuting
scope_3_8_upstream_leased_assets
scope_3_9_downstream_transport_and_distribution
scope_3_10_processing_of_sold_products
scope_3_11_use_of_sold_products
scope_3_12_end_of_life_treatment_of_sold_products
scope_3_13_downstream_leased_assets
scope_3_14_franchises
scope_3_15_investments
```

If `Total empresa` exists, it is treated as the official total. If it is missing, totals are calculated from the site rows.

## What The App Does

- Accepts a `.csv` file from the browser.
- Validates the minimum OCF schema.
- Parses and normalises the CSV client-side.
- Shows total emissions, Scope 1, Scope 2 and Scope 3 KPIs.
- Shows scope breakdown percentages.
- Shows site emissions by plant.
- Shows the largest Scope 3 categories.
- Builds a section-based report model.
- Allows sections to be enabled, disabled and reordered.
- Allows basic report branding configuration.
- Renders an HTML report preview as the source of truth.
- Generates a downloadable PDF from that HTML preview through `/api/pdf`.

## PDF Strategy

The current target strategy is **HTML preview + Playwright PDF**.

The report model is rendered as HTML/CSS first. The browser preview is the source of truth, and the `/api/pdf` route renders the same report model with Playwright to produce the downloadable PDF.

Playwright is used because it is a better fit for configurable sections, branding and future Path C support than maintaining a separate PDF-only rendering surface.

The PDF includes:

- Executive summary
- Methodology
- Organisational boundary
- Global results
- Scope breakdown
- Site emissions
- Key insights
- Detailed Scope 1, Scope 2 and Scope 3 category tables
- Limitations and next steps

The report is intentionally simpler than the provided Word sample. The focus is a correct and traceable Path A output, not a full recreation of the final consulting report.

## Minimal API Surface

- `POST /api/pdf`: receives `{ report, sections, settings }` and returns `application/pdf`.

The PDF endpoint accepts the final report model, including configurable sections and branding settings, and renders it in a controlled server-side Chromium environment.

## Build / Reuse / Buy

- **Build:** CSV parser, OCF normalisation, report section model, section toggles, basic branding controls and preview UI.
- **Reuse:** Next.js, React, Tailwind, shadcn-style UI conventions, Lucide icons and browser File APIs.
- **Adopt:** Playwright for HTML-to-PDF export instead of building a custom PDF engine.

Alternatives considered:

- `pdf-lib`: lower-level and better for editing existing PDFs, but too manual for report layout.
- `jsPDF`: simple for basic PDFs, but weaker for React-style document composition.
- `@react-pdf/renderer`: good for Path A, but less natural for configurable HTML preview + branding controls.
- `pdfme`: strong for client-configurable templates, but heavier than needed for this first Path B iteration.
- PrinceXML / DocRaptor: strong production buy options, but too heavy for this MVP and introduce cost or vendor dependency.

## AI Usage

AI assistance was used for implementation support, code review, scoping, and documentation drafting.

Delegated to AI:

- Initial component and data-layer scaffolding.
- Iteration on PDF structure.
- Requirement checklist against the challenge documentation.
- README drafting.

Handled directly through implementation and verification:

- Scope selection.
- Final architecture decisions.
- CSV field mapping against the provided sample.
- Manual validation with the sample CSV.
- Git branch cleanup and delivery hygiene.

No uploaded CSV data is sent to an external AI model by the application. Path C is intentionally left for a future iteration where an AI provider could modify the same section model server-side.

## Time Spent

Approximate time invested so far: **one focused MVP build session plus review/polish time**.

The main time went into:

- Setting up the Next.js UI skeleton.
- Building the CSV-to-OCF model.
- Integrating PDF generation.
- Evolving the PDF architecture towards configurable HTML preview + Playwright export.
- Checking the provided OCF sample against the generated report.
- Reviewing the challenge documentation and closing obvious compliance gaps.

## What I Would Do With More Time

1. Add Relats-specific branding to the PDF using public materials: logo, palette and typography.
2. Make the HTML/PDF report visually closer to the provided OCF Word sample.
3. Add charts for scope distribution, site contribution and Scope 3 hotspots.
4. Add optional Path C support by integrating an AI provider server-side over the section model.
5. Add a sample CSV loader/download button in the UI.
6. Improve validation for numeric formats, empty cells and inconsistent totals.
7. Add PCF as a separate path only after the OCF flow is solid.
8. Evaluate PrinceXML or DocRaptor if production-grade pagination becomes the priority.

## Limitations

- OCF only; PCF is not implemented.
- No database, authentication or persistence.
- The PDF is a concise MVP report, not a full consulting-grade Word report replica.
- Relats branding is not fully implemented yet.
- Playwright PDF generation requires browser binaries to be available in the execution environment.
- Runtime AI is not implemented.
- Numeric parsing is intentionally simple.
- Emission factors and carbon calculation methodology are out of scope; the app presents already calculated sample data.
- The detailed category mapping is tailored to the provided OCF CSV schema.
