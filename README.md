# Footprint Mappa Report Builder

Path B-oriented Organisational Carbon Footprint (OCF) and Product Carbon Footprint (PCF) report builder built from the Path A foundation.

```txt
User uploads CSV -> browser parser -> normalised OCF/PCF model -> configurable section model -> HTML preview -> Chromium PDF
```

Uploaded files are parsed client-side. The app does not store or persist the CSV. The generated report model is sent to a minimal Next.js API route only when the user downloads the PDF.

## Chosen Path

I started with **Path A: Foundation** and evolved it into a **Path B: Customizable** report builder.

The implementation supports OCF and PCF sample data. The report is represented as configurable sections with basic branding controls, rendered as an HTML preview, and exported to PDF through a minimal Chromium-backed API route.

I intentionally did not implement database persistence, authentication, full template editing, DOCX export, or runtime AI integration in this MVP. Path C remains a documented future evolution over the section model.

## Stack

- Next.js 16
- React 19
- App Router
- JavaScript / JSX
- Tailwind CSS v4
- shadcn/ui style primitives
- Radix UI
- Lucide icons
- Puppeteer + serverless Chromium for PDF export
- Playwright for responsive E2E tests

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

`npm test` runs the **unit suite only** (`tests/*.test.mjs`) — fast, deterministic and
browser-free. The Playwright responsive E2E lives in `tests/*.e2e.mjs` and runs separately:

```bash
npx playwright install chromium   # one-time: install the browser binary
npm run test:e2e
```

The E2E starts its own Next dev server on a **runtime-resolved free port** (set
`RESPONSIVE_TEST_URL` to point it at an already-running server instead), so it no longer collides
with a dev server occupying a fixed port. It still requires the Chromium binary above.

PDF export in Vercel uses `puppeteer-core` with `@sparticuz/chromium-min`. For local PDF export,
set `PUPPETEER_EXECUTABLE_PATH` to a local Chrome/Chromium executable. In Vercel, the endpoint
uses a default remote Sparticuz Chromium pack, and `CHROMIUM_PACK_URL` can override that URL.

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

A PCF sample is also provided (`data/sample_pcf_iso_14067.csv`), with one row per product, a `functional_unit` and lifecycle-stage columns (`total_materials`, `total_manufacturing`, `total_transport`, `total_distribution`, `total_use`, `total_end_of_life`).

## Units & Assumptions

The provided CSVs carry no unit column, so the unit of the activity data is **assumed per report type** and stated in the report's methodology section. A single unit is then applied consistently to every figure, table and chart so the document stays internally comparable:

- **OCF** — activity data assumed in **kgCO₂e**; organisational results reported in **tonnes (tCO₂e)**, scaling to **ktCO₂e** only for very large multi-site totals. (Example: the sample's `5,046,437` becomes `5,046.44 tCO₂e`, not "5,046 kt".)
- **PCF** — activity data assumed in **gCO₂e per functional unit**; product results reported in **gCO₂e**, scaling to **kgCO₂e** for larger products. Product footprints are never expressed in tonnes. (Example: a 500 ml PET bottle reads `~65 gCO₂e` cradle-to-gate, not "107 t".)

The unit convention lives in `lib/formatters.js` (`pickEmissionUnit`).

## PCF Boundary (selectable: cradle-to-gate / cradle-to-grave)

The PCF system boundary is **user-selectable** from the branding panel (PCF reports only; OCF uses an organisational "operational control" boundary and is unaffected). Two presets are available, defined as data in `PCF_BOUNDARIES` (`lib/data/pcf.js`):

- **`cradle-to-gate`** (default) — only **Materials, Manufacturing and Transport** count towards the reported footprint, percentages and hotspots. **Distribution, Use and End of life** sit downstream of the factory gate and depend on the **final application of the product**, so they are reported **out of boundary for reference only** and excluded from the totals. The copy is client-neutral and does not assert a specific business model.
- **`cradle-to-grave`** — the **full life cycle** is assessed (all six stages, materials → end of life). No stage is excluded, so there is no out-of-boundary table.

In both modes, because products use different functional units, the combined headline is a **comparative portfolio sum, not an additive footprint**; per-product results are shown in the product table.

Changing the boundary triggers a **full recompute** of the report model (total, percentages, breakdown, hotspots, exclusions) and **regenerates the section copy**.

> **Known limitation:** a **boundary change** and the **Restore default sections** action fully regenerate the auto-generated section text, so manual edits to section copy are **not preserved** across those two actions — set the boundary first, then edit copy. (Editing client name, reporting year or data sources does preserve manual edits — see *Genericity* below.)

## Genericity (client / year / data sources as one source of truth)

The report is correct for **any** client, reporting year and dataset, not just the bundled sample:

- **Client name and reporting year** flow from the branding form (`settings.clientName`, `settings.reportYear`) into **both** the cover and the generated narrative copy as a single source of truth. The report **title** is derived from the report kind + year (e.g. `Organisational Carbon Footprint Report 2027`) and is shared by the cover, page chrome and PDF header; editing the year updates all of them. Editing the *Report label* directly pins a custom title that survives later year changes.
- **Reactivity:** editing the client name, year or data sources **regenerates the auto-generated copy in place**, while **preserving any sections you have manually edited** (tracked per-section). Manually edited sections keep their text; untouched sections pick up the new metadata.
- **Conditional cross-references:** the executive summary and key insights only mention the largest site / most material Scope 3 category (OCF) or the highest-impact product (PCF) when the corresponding section is actually included. Switching to the **Executive brief** template (which omits those sections) updates the copy so it never references analysis the document does not contain.
- **Data sources** are **form-driven metadata**, edited as a comma-separated list in the branding panel and threaded into the methodology badges and prose. They default to the per-kind sources of the loaded dataset so the sample is unchanged.
- The generated copy contains **no client-specific assertions** (no hardwired "Relats" claims, no "intermediate components" business-model statement) and **no internal sample-data meta-commentary** ("illustrative sample data" sentences were removed). Defaults keep the bundled sample visually identical (RELATS S.A.U. / 2024 / same data sources / same numbers); changing the form propagates everywhere.

## Robustness & assumptions (uploading any valid OCF/PCF CSV)

The goal is that uploading any valid OCF/PCF CSV either produces a correct report, recovers via user-driven column mapping, or fails loudly — never a silently-wrong number.

- **Total-row detection (OCF) is label-independent.** The company-wide total row is found by (1) a flexible, case-insensitive label match (`total empresa`, `total`, `company total`, `grand total`, `total company`, `totales`), then (2) a structural fallback — the single row whose total emissions ≈ the sum of all other rows (within ~1% for rounding) — and only otherwise (3) the total is computed from the site rows (`totalSource: "calculated"`). The detected total row is excluded from the site table by identity, never by label, so an unrecognised total label can no longer be rendered as a phantom plant or double-counted into the headline figure.
- **The field delimiter is auto-detected.** The CSV parser detects the separator from the header line among `,`, `;` and tab (defaulting to `,`), so semicolon-delimited European Excel exports — where `;` separates fields and `,` is the decimal separator (`27,781`) — parse correctly without manual conversion. Quoted delimiters inside a field stay literal.
- **Malformed values warn instead of silently zeroing.** A blank/empty cell is a legitimate `0` (no warning). A **non-empty** cell that cannot be parsed is still treated as `0` but is collected as a warning (`report.warnings`, as `{ row, column, rawValue }`) and surfaced as a non-blocking toast (e.g. *"3 value(s) couldn't be read and were treated as 0 (e.g. 'Planta X' → total_scope_2)"*). Ambiguous thousands separators (`1.234,56`) are **not** guessed at — warning is the intended behaviour; the single-comma-decimal case is still handled.
- **PCF stage columns are validated.** Because the PCF model is built from the lifecycle stage columns, the in-boundary stages (`total_materials`, `total_manufacturing`, `total_transport`) are required alongside `product`, `functional_unit`, `total_emissions`. A CSV missing them fails clearly (*"Missing required columns: …"*) rather than producing a 0 footprint next to a non-zero `total_emissions`. Downstream columns (`total_distribution`, `total_use`, `total_end_of_life`) stay optional and default to `0`.
- **Hybrid schema detection: exact auto-detect, then ask.** A well-formed CSV is auto-detected by an exact header check (`entity` + `total_scope_1` → OCF; `product` + `functional_unit` → PCF) and builds with **no mapping panel**. On any column-shaped failure the app does **not** guess the schema — the mapping panel opens and asks the user *"OCF or PCF?"* explicitly, then they map the columns.
- **On-failure column mapping (bounded, by design).** When an upload fails validation on column issues (unknown type or missing required columns), an inline mapping panel appears: the user picks the target schema (OCF/PCF), then each **required** field gets a native `<select>` of the CSV's actual headers (with exact / case-insensitive matches pre-selected). The **detail columns are also mappable** — they live in a collapsed *"Optional columns (N) — auto-matched, expand to adjust"* section, each pre-filled by exact header name, so canonical detail columns auto-select and you only touch the ones you renamed (a renamed detail column flows its value into the detailed table/hotspots instead of being silently treated as `0`). Only the required fields block "Build report"; an optional column left "— not present —" is the user's explicit `0`. On confirm, the columns are renamed to the canonical keys and the report is rebuilt; if a required field is still unmapped the panel stays open. This is **not** a generic arbitrary-CSV engine: it only remaps onto the **two known schemas (OCF/PCF)** and only when normal validation fails — the happy path (a CSV that already validates, including the bundled samples) never shows the mapping UI.

## Branding

The deliverable is **client-branded for Relats**. The report accent defaults to **Relats' corporate red** (`#b91c1c`, from public Relats materials at `relats.com`), applied to the cover, section numbers, badges and PDF header/footer. No official Relats brand kit was provided, so:

- A **client logo can be uploaded** in the branding panel; it is embedded on the cover and the accent colour is automatically re-derived from it.
- The **data charts keep the fixed, accessible Mappa palette** for legibility across reports.
- The **Mappa brand book is for the app UI**, not for the exported report.

To apply real Relats identity, upload the Relats logo in the branding panel (or replace the default accent with an approved colour).

> **Note on sample data:** the bundled CSVs use simplified, generic sample entities (e.g. "Planta Barcelona", "Botella PET 500ml") as placeholders to exercise the pipeline. The report adapts to whatever plants / product families are supplied in the source CSV; this placeholder note is internal context only and never appears in the generated deliverable.

## What The App Does

- Accepts a `.csv` file from the browser.
- Validates the minimum OCF schema.
- Parses and normalises the CSV client-side.
- Shows total emissions, Scope 1, Scope 2 and Scope 3 KPIs.
- Shows scope breakdown percentages.
- Shows site emissions by plant.
- Shows the largest Scope 3 categories.
- Builds a consulting-style section-based report model.
- Allows sections to be enabled, disabled and reordered.
- Adds editable narrative sections for introduction, methodology, comparative analysis, conclusions and strategic recommendations.
- Allows basic report branding configuration.
- Renders an editable A4-style HTML report preview as the source of truth.
- Generates a downloadable PDF from that HTML preview through `/api/pdf`.

## PDF Strategy

The current target strategy is **HTML preview + Chromium PDF**.

The report model is rendered as HTML/CSS first. The browser preview is the source of truth, and the `/api/pdf` route renders the same report model with Puppeteer-controlled Chromium to produce the downloadable PDF.

The original local implementation used Playwright for both E2E and PDF export, but Vercel serverless bundling failed on Playwright's browser metadata (`playwright-core/browsers.json`). Production PDF export therefore uses `puppeteer-core` plus `@sparticuz/chromium-min`, while Playwright remains the E2E test tool.

The in-browser A4 canvas shows page boundaries, headers and footers to make editing feel close to the exported report. Pagination in the preview is an honest approximation; the exact final page breaks are still decided by Chromium during PDF export.

The PDF includes:

- Executive summary
- Introduction
- Methodological approach
- Organisational or product boundary
- Global results
- Scope or lifecycle breakdown
- Site or product emissions
- Key insights
- Detailed Scope 1, Scope 2 and Scope 3 category tables
- Narrative analysis sections
- Strategic recommendations
- Limitations and next steps

The report is still generated from the uploaded CSV and editable section text. It is designed to be much closer to the provided consulting examples, while avoiding claims or detailed tables that are not present in the source data.

## Minimal API Surface

- `POST /api/pdf`: receives `{ report, sections, settings }` and returns `application/pdf`.

The PDF endpoint accepts the final report model, including configurable sections and branding settings, and renders it in a controlled server-side Chromium environment.

## Build / Reuse / Buy

- **Build:** CSV parser, OCF normalisation, report section model, section toggles, basic branding controls and preview UI.
- **Reuse:** Next.js, React, Tailwind, shadcn-style UI conventions, Lucide icons and browser File APIs.
- **Adopt:** Chromium-based HTML-to-PDF export instead of building a custom PDF engine.

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
- Evolving the PDF architecture towards configurable HTML preview + Chromium export.
- Checking the provided OCF sample against the generated report.
- Reviewing the challenge documentation and closing obvious compliance gaps.

## What I Would Do With More Time

1. Add richer Relats-specific brand templates using approved assets.
2. Add optional structured fields for baseline year, product family, site, material composition and scenario metadata.
3. Add optional Path C support by integrating an AI provider server-side over the section model.
4. Improve validation for numeric formats, empty cells and inconsistent totals.
5. Evaluate PrinceXML or DocRaptor if production-grade pagination becomes the priority.

## Limitations

- No database, authentication or persistence.
- The PDF is not a pixel-perfect replica of the provided Word reports.
- The A4 preview page guides are approximate; exported pagination is generated by Chromium.
- Relats branding is applied via the default corporate-red accent and an optional uploaded logo; a full approved Relats brand kit was not provided.
- PDF generation requires a Chromium executable in the execution environment; Vercel uses `@sparticuz/chromium-min`.
- Runtime AI is not implemented.
- Numeric parsing is intentionally simple.
- Emission factors and carbon calculation methodology are out of scope; the app presents already calculated sample data.
- Consulting details that are not present in the CSV, such as baseline comparisons and recommendations, are handled through editable report sections.
