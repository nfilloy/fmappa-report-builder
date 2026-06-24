# Report Builder — Deep Review & Prioritized Improvement Plan (Path B focus)

> Scope of this document: a read-only review of the current codebase against the
> challenge brief (Paths A/B/C, evaluation dimensions) with a primary lens on
> **Path B maturity** (branding, selectable sections, form-driven inputs,
> multiple templates) and **client-genericity**. No code was changed. Findings
> cite `file:line`. Severity: **S1** (defend-blocking / correctness), **S2**
> (important polish / coherence), **S3** (nice-to-have).

---

## 1. Executive summary

The project is a genuinely strong **Path A → Path B** submission. The data
layer is cleanly separated (`lib/data/*` → report model → `lib/report/sections.js`
→ `components/report-html/HtmlReport.jsx` → Playwright PDF), the OCF/PCF domains
are well modelled, the section model supports enable/disable/reorder/duplicate/
custom + three templates, branding is logo-driven with palette extraction and
WCAG-aware contrast, units are handled thoughtfully per domain, and the
selectable PCF system boundary (cradle-to-gate / cradle-to-grave) is a
sophisticated touch. Tests cover the data layer and section logic well. This is
well above a "CSV dump to PDF" baseline and is defensible in a live demo.

The biggest weakness, and the one most aligned with what Path B is graded on, is
that **the tool is not yet client-generic**: it is still wired to "Relats / 2024"
in ways that break coherence the moment a different client or year is used. The
single highest-leverage area is making the **client name and reporting year flow
as one source of truth into the narrative copy**, and removing literal "Relats"
assertions from the generated text.

**Top 5 highest-leverage improvements (detail in §2 and §3):**

1. **Make client name generic and reactive.** `report.clientName` is hardcoded
   to `"RELATS S.A.U."` (`lib/data/ocf.js:178`, `lib/data/pcf.js:263`), the
   narrative is built from it, and editing the "Client name" field does **not**
   regenerate the narrative — so the cover says the new client while the body
   text still says "RELATS S.A.U.". This is the #1 Path B credibility bug. **(S1)**
2. **One source of truth for the reporting year.** The year is hardcoded in three
   independent places (the report title string `"…Report 2024"`, the literal
   `"2024"` inside narrative copy, and `settings.reportYear`). Changing the year
   in the form updates the cover but not the title or body. **(S1)**
3. **Remove hardwired "Relats" claims from generated copy.** Methodology /
   executive / scope copy asserts *"As Relats supplies intermediate components…"*
   and *"downstream of Relats' factory gate"* (`lib/report/sections.js:223,227,
   230`) regardless of the actual client. For any non-Relats client this is a
   factually wrong statement printed in a deliverable. **(S1)**
4. **Stop generating copy that references excluded sections / sample data.** The
   executive summary and key insights cite "largest site" and "most material
   Scope 3 category" even when those sections are disabled (e.g. the *Executive
   brief* preset), and the limitations copy literally says *"The entities shown
   here are illustrative sample data"* — meta-commentary that must never appear in
   a real client report. **(S2)**
5. **Harden generic-CSV robustness.** The OCF total row is detected only by the
   Spanish literal `"total empresa"` (`lib/data/ocf.js:106`); any other total
   label is silently treated as a *site*, double-counting it. Numeric parsing
   silently turns unparseable values into `0` with no warning. **(S1/S2)**

Everything above is **iteration on an already-good base**, not a rewrite. The
section model and data pipeline are the right shape to absorb these fixes.

---

## 2. Findings by area

### 2.1 Architecture

- **Clean separation of concerns (strength).** `parseCsv` → `detectReportType` →
  `buildOcfReport`/`buildPcfReport` (pure model) → `buildReportSections` (copy) →
  `HtmlReport` (one renderer for preview *and* PDF) is exactly the architecture
  the spec recommends (`ESPECIFICACION_RETO_TECNICO_ES.md` §17). The same
  component renders both the browser preview and the server PDF
  (`lib/report/renderHtmlReport.js:49`), which is the right call for fidelity.
  *Dimension: code & data architecture — strong.*

- **Two parallel charting systems (S3, build-vs-buy).** The report/PDF uses
  hand-rolled SVG (`lib/report/svgCharts.js`), while the on-screen **Summary**
  tab uses **recharts** via `ScopeDonut`, `Scope3Hotspots`, `SiteEmissionsChart`.
  recharts is a heavy dependency powering only a secondary preview that
  duplicates what the SVG charts already show in the document view. Consider
  dropping recharts and reusing the SVG charts (or dropping the Summary tab) to
  shrink the dependency surface and have one chart implementation to defend.
  *Dimension: research & build-vs-buy.*

- **Section copy is generated once and not reactive to settings (S1).**
  In `ReportBuilder.jsx`, sections are (re)built only in `ingestCsv` (line 150),
  `handleBoundaryChange` (line 184) and `handleRestoreSections` (line 394).
  Editing branding fields (`settings.clientName`, `reportYear`, …) never
  regenerates the narrative. Because the narrative is built from
  `report.clientName`/hardcoded year rather than from `settings`, the cover and
  body desync. See §2.3.

- **Single API route, client-side parsing (strength).** `app/api/pdf/route.js`
  is the only server surface; CSVs are parsed in the browser and not persisted
  (README is accurate). Good scoping per the brief's "don't over-build" guidance.

### 2.2 Data layer & correctness

- **OCF total detection is locale-locked (S1).** `lib/data/ocf.js:106,109`
  selects the official total by `row.entity.toLowerCase() === "total empresa"`.
  For a generic CSV whose total row is "Total", "Company total", "Grand total",
  etc.:
  - it is **not** recognised as the official total, *and*
  - it falls into `siteRows`, so it is rendered as a plant **and** summed into
    the calculated total → **double counting** in the per-site table, stacked bar
    and the headline figure.
  Recommend: detect the total row structurally (e.g. the row whose scope columns
  ≈ the sum of the others, or an explicit `is_total`/sentinel), or expose a
  "total row label" setting, and exclude it from site rows regardless of label.

- **Silent zeroing of unparseable numbers (S2).** `lib/data/numeric.js:8-15`
  does `replace(",", ".")` then `Number(...)`, returning `0` on failure. European
  thousands formatting like `"1.234,56"` becomes `"1.234.56"` → `NaN` → `0`, with
  no warning surfaced. A malformed cell silently understates the footprint. The
  brief explicitly asks "what happens with a malformed CSV?" — today: a quietly
  wrong number. Recommend collecting and surfacing parse warnings (count of
  coerced cells) in the UI.

- **Required columns are too minimal for PCF (S2).** `validatePcfRows` only
  requires `product, functional_unit, total_emissions` (`lib/data/pcf.js:6`), but
  the entire model is built from the *stage* columns (`total_materials`, …). A
  valid CSV with only the three required columns yields `inBoundaryTotal = 0` for
  every product, a 0-value breakdown, and a headline "combined footprint" of 0
  while `cradleToGraveTotal` (from `total_emissions`) is non-zero — an internally
  contradictory report. Recommend validating that at least the in-boundary stage
  columns exist, or deriving stages from `total_emissions` when stage columns are
  absent.

- **Absent optional categories render as `0.00` rows (S3).** Missing detailed
  category columns become `0` (`normalizeRecord`), so a different OCF/PCF dataset
  produces detailed-category tables full of `0.00` rather than hiding empty rows.
  Consider filtering all-zero category rows out of the detailed tables.

- **Strengths:** header-based `detectReportType` with a clear thrown error for
  unknown CSVs (`lib/data/detectReportType.js:36`), graceful fallback when no
  total row exists (`ocf.js:112`), and a correct hand-rolled CSV parser that
  handles quotes/escaped quotes/CRLF (`lib/data/parseCsv.js`).

### 2.3 Report copy / coherence (the Path B heart)

- **Client name is hardcoded and non-reactive (S1).** `clientName: "RELATS
  S.A.U."` at `lib/data/ocf.js:178` and `lib/data/pcf.js:263`. The narrative uses
  `report.clientName` (e.g. `sections.js:146` *"${report.clientName}'s 2024…"*),
  so all body text is "RELATS S.A.U." regardless of CSV. Worse, the cover uses
  `settings.clientName` (`HtmlReport.jsx:443`) which the user *can* edit — but the
  body uses the frozen `report.clientName` and is not rebuilt on edit. **Net
  effect: change "Client name" to "ACME Corp" → cover reads ACME, executive
  summary still reads RELATS S.A.U.** Fix: thread `settings` (client name + year)
  into `buildReportSections`, and regenerate copy when those settings change (or
  read them live in `HtmlReport`).

- **Reporting year is fragmented across 3 sources (S1).** (a) baked into the
  title string `"Organisational Carbon Footprint Report 2024"`
  (`ocf.js:179`, `pcf.js:264`); (b) hardcoded inside narrative copy as the literal
  `2024` (`sections.js:146,172,223,224`); (c) `settings.reportYear` (default
  `"2024"`, `ReportBuilder.jsx:108`) plus `"2024"` fallbacks at
  `ReportBuilder.jsx:288,833`, `renderHtmlReport.js:78`, `HtmlReport.jsx:446`,
  `route.js:46`. Changing the year in the form updates only the cover badge/
  footer, not the title or the prose. Fix: derive the year once and interpolate it
  into the title and all copy.

- **Literal "Relats" claims survive a client change (S1).** Independent of
  `clientName`, the copy asserts Relats-specific facts: *"As Relats supplies
  intermediate components that are integrated into its customers' final products…"*
  (`sections.js:227`), *"downstream of Relats' factory gate"* (`sections.js:223`),
  *"the boundary stops at the factory gate: downstream … are excluded because they
  depend on the customer's final product"* (`sections.js:230`). For a different
  client these are unverified assertions. The cradle-to-gate rationale should be
  phrased generically (e.g. "the reporting boundary stops at the factory gate per
  the client's reporting requirements") or tied to `clientName`.

- **Copy over-promises sections that may be excluded (S2).** The executive
  summary references the largest site and the most material Scope 3 category
  (`sections.js:146`), and key insights do the same (`sections.js:173-181`) — but
  the **Executive brief** preset (`sections.js:65`) excludes `site-emissions` and
  `detailed-categories`. The summary then promises analysis the report does not
  contain. Recommend making cross-references conditional on the relevant section
  being enabled, or softening the language.

- **"Illustrative sample data" leaks into the deliverable (S2).** `limitations`
  says *"The entities shown here are illustrative sample data; the template adapts
  to the real Relats plants/product families supplied in the source CSV"*
  (`sections.js:183,262-263`). This is internal meta-commentary about the demo —
  it must not appear in a client-facing report and again hardcodes "Relats".

- **Hardcoded `dataSources` (S2).** `["DEFRA","IEA","OCCC","ecoinvent",
  "EXIOBASE"]` (`ocf.js:183`) / `["EXIOBASE","DEFRA","IEA","OCCC"]` (`pcf.js:268`)
  are printed in the methodology badges and prose for every dataset. They should
  be configurable metadata (the sample Relats reports even differ: the OCF report
  lists ecoinvent, the PCF one does not).

- **`shortEntityName` strips a Spanish, sample-specific prefix (S3).**
  `HtmlReport.jsx:19-20` removes `"Planta "` from category-table column headers,
  so the site table shows "Planta Barcelona" while the category tables show
  "Barcelona" — inconsistent, and meaningless for non-Spanish entities. Drop the
  special-case or make it data-driven.

- **Honest, well-handled gaps (strength).** The comparative-analysis section
  correctly states no prior-year baseline exists rather than inventing one, and
  the PCF "comparative portfolio sum, not additive" caveat is consistently
  applied — these are exactly the kind of defensible, honest choices the brief
  rewards.

### 2.4 UI / UX

- **Strong, focused workflow (strength).** The Data / Sections / Branding rail
  (`workflow/WorkflowPanel.jsx`), drag-to-reorder with `@dnd-kit`, live editable
  A4 preview with scroll-spy, zoom, and an honest page-chrome approximation
  (`ReportBuilder.jsx:806-855`) is a polished Path B experience. Inline
  contentEditable that commits on blur (`HtmlReport.jsx:25-42`) is a nice touch.

- **Manual section edits are silently destroyed on boundary/restore (S2).**
  Changing the PCF boundary or hitting "restore" calls `buildReportSections`,
  discarding user edits (documented in README:119, but still a UX trap). Consider
  preserving user-edited content (track a `dirty` flag per section and only
  regenerate untouched copy).

- **Accessibility is above average but incomplete (S3).** SVG charts carry
  `role="img"`/`aria-label` (`svgCharts.js`), icon buttons have `aria-label`,
  contrast is enforced via `lib/color/contrast.js`. Gaps: contentEditable regions
  are not exposed as labelled form controls; the donut/bar SVGs convey data only
  via an adjacent legend (acceptable, but no `<desc>`/table fallback in PDF text).

- **No empty/very-large dataset guards in the preview (S3).** Pagination math
  (`A4_PAGE_HEIGHT_PX`, `ReportBuilder.jsx:498`) and the stacked bar assume a
  modest number of entities; a 50-site CSV would overflow the fixed-height
  stacked bar (`svgCharts.js:62`) and inflate page-count estimation.

### 2.5 Branding (Path B feature)

- **Good generic branding story (strength).** Default accent = Relats corporate
  red (`brandTheme.js:18`), overridable by uploading a client logo which
  re-derives the accent via canvas palette extraction (`extractPalette.js`) and
  guarantees legibility (`ensureReadable`, `contrast.js:73`). The Mappa brand book
  is correctly applied to the **app UI** while the **PDF** is client-branded —
  exactly the FAQ's intent. The accent flows to cover, section numbers, badges and
  PDF header/footer through one CSS variable (`htmlReportStyles.js`).

- **Charts ignore the client accent (S3, by design — flag it).** Data charts
  always use the fixed Mappa palette (`chartTheme.js`), documented as a
  legibility choice. Defensible, but means a "Relats-red" report still has
  navy/peach/coral charts. Worth a one-line rationale in the demo.

- **The client PDF uses Mappa's typeface (S3).** BDO Grotesk (Mappa's brand
  font) is embedded into the client deliverable (`renderHtmlReport.js:19-47`).
  Defensible as consultancy house style, but it is Mappa branding inside a Relats
  report; consider a configurable/neutral fallback or note it explicitly.

- **No multi-template branding presets (S2 for Path B depth).** Branding is a
  single accent + logo. The brief lists "multiple templates" — today templates
  are *section* presets only (§2.6), not *visual* themes. A small set of cover
  layouts/colour themes would directly hit the "multiple templates" expectation.

### 2.6 Selectable sections & templates

- **Robust section model (strength).** `lib/report/sections.js` cleanly separates
  definitions, per-kind presets, and pure operations (`applyPreset`,
  `reorderSection`, `removeSection`, `updateSection`, `createCustomSection`),
  all unit-tested. Base sections are non-removable but can be disabled; custom
  sections are additive. Three presets per kind (consulting / executive /
  compliance) is a real "multiple templates" answer for content.

- **Cross-section coherence is the gap, not the mechanics (S2).** As noted in
  §2.3, the *content* over-promises when sections are excluded. The *structure*
  is sound.

### 2.7 PDF export

- **Right strategy, well justified (strength).** HTML+Playwright matches the
  spec's "prioritise visual fidelity" path, the build/reuse/buy section in the
  README is thoughtful, and header/footer templates set explicit font sizes
  (a common Playwright footgun) and reuse the brand accent
  (`renderHtmlReport.js:75-151`). Print CSS handles page breaks deliberately
  (`htmlReportStyles.js:190-226`, `694-739`).

- **No timeouts / browser reuse (S3).** `chromium.launch()` runs per request with
  `waitUntil:"networkidle"` and no timeout (`route.js:26-43`). A hung render
  blocks the request indefinitely, and cold-launching Chromium per PDF is slow.
  For a demo this is fine; note it as a known limitation (the README already flags
  the binary dependency).

- **Input is trusted but low-risk (S3).** `{report, sections, settings}` is
  posted and rendered server-side; React escapes text and `escapeHtml` guards the
  title (`renderHtmlReport.js:10`). `logoDataUrl` is injected as an `<img src>`
  data URL. Since the client renders its own data on its own server there's no
  meaningful injection/SSRF surface, but it is worth one sentence in the demo.

### 2.8 Tests

- **Good data/section coverage (strength).** `tests/ocf.test.mjs`,
  `tests/pcf.test.mjs` cover model building, validation errors, presets,
  reorder/update, and boundary-specific copy (incl. asserting "intermediate
  components" is absent under cradle-to-grave). `brandTheme`, `contrast`,
  `responsive` tests exist too.

- **Gaps (S3).** No tests for: `parseCsv` edge cases (quotes/CRLF/European
  numbers), `pickEmissionUnit` scaling, the OCF total-row double-count scenario,
  or — crucially — that **client name / year flow into the narrative** (which
  currently they don't; a test would have caught it). Adding a "non-Relats CSV
  produces a non-Relats report" test would lock in the §3 genericity fixes.

### 2.9 Dead code / hygiene

- **Unused CSS (S3).** `.scope-row`, `.scope-row-header`, `.scope-fill`,
  `.site-fill` in `htmlReportStyles.js:351-403` have no consumers (the chart
  section uses the donut + stacked bar). Safe to delete.
- **`.gitignore` ignores the spec & docs.** `ESPECIFICACION_RETO_TECNICO*.md` and
  `documentacion/` are git-ignored — fine if intentional (keeps internal notes
  out of the public repo), but confirm the build/reuse/buy research the brief asks
  for lives in the committed README, not only in the ignored docs.

---

## 3. Path B roadmap (ordered, with effort / risk / why)

Ordered to maximise Path B grade per unit of effort. Each item strengthens
**client-genericity**, the explicit Path B lens.

1. **Thread client name + year into the section copy as one source of truth.**
   Pass `settings` (or just `{clientName, reportYear}`) into `buildReportSections`
   / `defaultContentById`, and interpolate the year into report titles instead of
   the literal "2024". *Effort: M · Risk: low (copy + plumbing) · Why: kills the
   single most visible Path B bug — cover/body desync — and makes the demo
   "upload any client" story true.*

2. **Regenerate (or live-read) copy when client/year settings change.** Either
   rebuild untouched sections on settings change, or have `HtmlReport` read
   client/year from `settings` at render time. *Effort: S–M · Risk: low · Why:
   without this, fix #1 still won't update an already-loaded report.*

3. **Genericise the "Relats" assertions and remove sample-data meta-copy.**
   Rephrase the cradle-to-gate rationale and limitations text to be client-neutral
   (or `clientName`-driven); delete "illustrative sample data" sentences.
   *Effort: S · Risk: none · Why: removes factually-wrong statements from
   arbitrary-client deliverables.*

4. **Make cross-references conditional on enabled sections.** In the executive
   summary / key insights, only mention "largest site" / "top Scope 3 category"
   when those sections are included. *Effort: S–M · Risk: low · Why: stops
   templates (esp. Executive brief) from promising content they omit.*

5. **Promote report metadata to form-driven inputs.** Expose `dataSources`
   (editable list), and optionally `boundaryBasis`/standard, in the Branding
   panel. *Effort: M · Risk: low · Why: hits the "form-driven inputs / metadata"
   Path B feature directly and removes hardcoded sources.*

6. **Harden generic-CSV handling.** Structural total-row detection (no
   `"total empresa"` literal), surface numeric-parse warnings, and validate PCF
   stage columns. *Effort: M · Risk: medium (touches model + tests) · Why: makes
   "upload any valid OCF/PCF CSV" actually hold up — a Path B robustness claim.*

7. **Add 1–2 visual templates (cover/theme presets).** A second cover layout or a
   light/dark theme on top of the accent. *Effort: M–L · Risk: low · Why: makes
   "multiple templates" mean visual templates, not just section sets.*

8. **Preserve manual edits across boundary/restore; add genericity tests.**
   Track per-section "dirty" and only regenerate untouched copy; add a non-Relats
   CSV test. *Effort: M · Risk: medium · Why: removes a UX trap and locks the
   genericity fixes in.*

---

## 4. Quick wins vs. future work

**Do before submitting (high value, low effort / low risk):**

- Fix #1–#4 above (client name + year single source of truth; remove "Relats"
  literals and "sample data" meta-copy; conditional cross-references). These are
  the difference between "demo only works for Relats/2024" and "works for any
  client" — directly graded under Path B.
- Delete the dead CSS (§2.9) and the locale-specific `shortEntityName` strip.
- Add a one-paragraph "Genericity & assumptions" note to the README explaining
  the total-row convention and the chart-palette / font choices, so the remaining
  tradeoffs are *defended*, not just present.

**List under "what I'd do with more time":**

- Structural total-row detection and numeric-parse warnings (#6).
- Visual templates / theme presets (#7).
- Preserve manual edits across regeneration (#8).
- Drop recharts in favour of the SVG charts (or remove the Summary tab).
- Path C: AI-assisted section copy over the existing section model (the model is
  already the right seam for this).

---

## 5. Scope guardrails (do **not** over-build)

The brief rewards a focused, polished, defensible solution over breadth. Avoid:

- **A full template/theme editor or design system.** One or two presets is the
  Path B signal; a WYSIWYG theme builder is over-scope (the spec explicitly warns
  against a "full template editor", §25).
- **Auth, multi-tenancy, persistence, a database, or a separate backend.**
  Explicitly out of scope per the brief; keep the single `/api/pdf` route.
- **A full CSV schema engine / arbitrary-CSV mapper UI.** Harden the two known
  schemas (OCF/PCF) and fail clearly on others — do not build a generic
  column-mapping wizard.
- **Runtime AI now (Path C).** Keep it as documented future work; a weak AI
  feature would hurt more than help. A strong, generic Path B beats a shaky
  Path C.
- **Pixel-perfect replication of the Word samples.** The samples are the quality
  *bar*, not a spec; matching structure and polish is enough. Don't sink time into
  reproducing the part-number tables / year-over-year analysis that aren't in the
  provided CSVs.
- **Chasing chart-library parity.** The hand-rolled SVG charts are sufficient and
  more defensible than maintaining two charting stacks — simplify rather than
  expand here.
