export const HTML_REPORT_STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #e7e5e4;
    color: #18181b;
    font-family: "BDO Grotesk", var(--font-grotesk, Arial), Arial, Helvetica, sans-serif;
  }
  .report-page {
    width: min(100%, 940px);
    margin: 0 auto;
    background: #ffffff;
    padding: 0 48px 48px;
    counter-reset: report-section;
  }
  .report-cover {
    background:
      linear-gradient(135deg, rgba(24, 24, 27, 0.96), rgba(41, 37, 36, 0.9)),
      linear-gradient(90deg, var(--report-accent, #041282), #18181b);
    color: #ffffff;
    margin: 0 -48px 34px;
    min-height: 430px;
    overflow: hidden;
    padding: 38px 48px 34px;
    position: relative;
  }
  .report-cover::after {
    background: var(--report-accent, #041282);
    bottom: 0;
    content: "";
    height: 8px;
    left: 0;
    position: absolute;
    right: 0;
  }
  .cover-headline {
    align-items: flex-end;
    display: flex;
    gap: 10px;
    margin-top: 26px;
  }
  .cover-headline strong {
    color: #ffffff;
    font-size: 34px;
    font-weight: 800;
    line-height: 1;
  }
  /* Text headline (e.g. "6 products compared") reads better a touch smaller than
     a numeric figure, while staying the dominant element of the cover. */
  .cover-headline strong.cover-headline--text {
    font-size: 28px;
    line-height: 1.05;
  }
  .cover-headline span {
    color: #e4e4e7;
    font-size: 12px;
    letter-spacing: 0.04em;
    padding-bottom: 4px;
    text-transform: uppercase;
  }
  /* The figure carries a unit (e.g. "gCO₂e"); uppercasing it would corrupt the
     unit casing (g -> G, e -> E), so keep this part in its original case. */
  .cover-headline span .cover-headline-figure {
    text-transform: none;
  }
  .cover-standard {
    align-items: center;
    display: inline-flex;
    gap: 8px;
    margin-top: 18px;
  }
  .cover-standard span {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 999px;
    color: #f4f4f5;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 5px 10px;
    text-transform: uppercase;
  }
  .cover-topline {
    align-items: flex-start;
    display: flex;
    gap: 24px;
    justify-content: space-between;
  }
  .client-wordmark {
    color: #ffffff;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 0.02em;
    line-height: 1;
    text-transform: uppercase;
  }
  .cover-logo {
    background: #ffffff;
    border-radius: 8px;
    height: 48px;
    max-width: 200px;
    object-fit: contain;
    padding: 6px 10px;
    width: auto;
  }
  .report-badge {
    border: 1px solid rgba(255, 255, 255, 0.36);
    border-radius: 999px;
    color: #f4f4f5;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 8px 12px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .cover-main {
    margin-top: 92px;
    max-width: 680px;
  }
  .report-eyebrow {
    color: #fecaca;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    margin: 0;
    text-transform: uppercase;
  }
  .report-title {
    color: #ffffff;
    font-size: 42px;
    line-height: 1.08;
    margin: 16px 0 0;
    max-width: 720px;
  }
  .report-subtitle {
    color: #e4e4e7;
    font-size: 15px;
    line-height: 1.7;
    margin: 18px 0 0;
    max-width: 620px;
  }
  .cover-summary {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: 56px;
    padding-top: 22px;
  }
  .cover-summary div {
    min-width: 0;
  }
  .cover-summary span {
    color: #a1a1aa;
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .cover-summary strong {
    color: #ffffff;
    display: block;
    font-size: 13px;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .cover-note {
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    margin-top: 20px;
    padding-top: 16px;
  }
  .cover-note span {
    color: #a1a1aa;
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
    text-transform: uppercase;
  }
  .cover-note p {
    color: #e4e4e7;
    font-size: 12px;
    line-height: 1.5;
    margin: 0;
  }
  .report-section {
    border-top: 1px solid #e4e4e7;
    counter-increment: report-section;
    margin-top: 30px;
    padding-top: 24px;
  }
  .report-section--text,
  .report-section--metrics,
  .report-section--chart,
  .report-section--insights {
    break-inside: avoid;
  }
  .report-section--narrative-analysis,
  .report-section--recommendations {
    break-inside: auto;
  }
  .report-section--print-avoid {
    break-inside: avoid;
  }
  .report-section--print-page {
    break-before: page;
  }
  /* Long, flowing sections (narrative, recommendations) may split across pages. */
  .report-section--print-flow {
    break-inside: auto;
  }
  /* Keep "Limitations and next steps" attached to the recommendations it follows
     instead of being orphaned at the top of the next page. */
  .report-section--limitations {
    break-before: avoid;
  }
  .report-section--category-tables {
    break-before: auto;
  }
  .report-section--site-emissions {
    break-inside: auto;
  }
  .report-toc {
    background: #fafafa;
    border: 1px solid #d6d3d1;
    border-left: 6px solid var(--report-accent, #041282);
    border-radius: 8px;
    margin: 0 0 32px;
    padding: 20px 22px;
  }
  .report-toc h2 {
    color: #18181b;
    font-size: 16px;
    margin: 0 0 12px;
  }
  .report-toc ol {
    color: #3f3f46;
    columns: 2;
    font-size: 13px;
    line-height: 1.6;
    margin: 0;
    padding-left: 20px;
  }
  .report-toc li {
    break-inside: avoid;
    padding-right: 12px;
  }
  .report-section h2 {
    align-items: center;
    color: #18181b;
    display: flex;
    font-size: 21px;
    gap: 10px;
    margin: 0 0 12px;
    /* Never strand a section heading at the foot of a page, away from its
       body (e.g. "Strategic recommendations" alone before its list). */
    break-after: avoid;
  }
  .report-section h2::before {
    background: var(--report-accent, #041282);
    border-radius: 999px;
    color: var(--report-on-accent, #ffffff);
    content: counter(report-section, decimal-leading-zero);
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 10px;
    font-weight: 700;
    height: 24px;
    align-items: center;
    justify-content: center;
    width: 24px;
  }
  .report-section p {
    color: #44403c;
    font-size: 14px;
    line-height: 1.65;
    margin: 0;
  }
  .report-section p + p {
    margin-top: 10px;
  }
  .analysis-block {
    border-left: 4px solid color-mix(in srgb, var(--report-accent, #041282) 65%, #ffffff);
    margin-top: 10px;
    padding-left: 16px;
  }
  .analysis-block p {
    color: #3f3f46;
  }
  .category-group {
    break-inside: auto;
    margin-top: 18px;
  }
  .category-group h3 {
    break-after: avoid;
    color: #292524;
    font-size: 15px;
    margin: 0 0 8px;
  }
  .category-group .report-table {
    font-size: 9.5px;
    table-layout: fixed;
  }
  .category-group .report-table th,
  .category-group .report-table td {
    padding: 6px;
  }
  .category-group .report-table th:first-child,
  .category-group .report-table td:first-child {
    width: 32%;
  }
  .category-group .report-table .number {
    white-space: normal;
  }
  .section-intro {
    margin-bottom: 14px;
  }
  .section-intro p + p {
    margin-top: 8px;
  }
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
  .metric-card {
    background: #fafafa;
    border: 1px solid #d6d3d1;
    border-top: 4px solid var(--report-accent, #041282);
    border-radius: 8px;
    break-inside: avoid;
    padding: 16px;
  }
  .metric-label {
    color: #78716c;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .metric-value {
    color: #18181b;
    font-size: 20px;
    font-weight: 700;
    margin-top: 8px;
  }
  .scope-row {
    margin: 14px 0;
  }
  .scope-row-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: #292524;
    font-size: 13px;
    margin-bottom: 6px;
  }
  .scope-track {
    background: #e7e5e4;
    border-radius: 999px;
    height: 12px;
    overflow: hidden;
  }
  .scope-fill {
    background: var(--report-accent, #041282);
    height: 100%;
  }
  .bar-list {
    margin: 14px 0;
  }
  .bar-row {
    break-inside: avoid;
    margin: 12px 0;
  }
  .bar-row-header {
    align-items: baseline;
    color: #292524;
    display: flex;
    font-size: 13px;
    gap: 12px;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .bar-row-header span {
    color: #57534e;
    white-space: nowrap;
  }
  .bar-track {
    background: #e7e5e4;
    border-radius: 999px;
    height: 10px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
  }
  .site-fill {
    background: var(--report-accent, #041282);
  }
  .category-fill {
    background: var(--report-accent, #041282);
  }
  /* Chart section: donut + legend side by side */
  .report-chart {
    align-items: center;
    break-inside: avoid;
    display: flex;
    flex-wrap: wrap;
    gap: 26px;
    margin: 14px 0 4px;
  }
  .donut-chart {
    flex: 0 0 auto;
  }
  .chart-legend {
    flex: 1 1 240px;
    list-style: none;
    margin: 0;
    min-width: 220px;
    padding: 0;
  }
  .chart-legend li {
    align-items: baseline;
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 8px;
    padding: 5px 0;
  }
  .chart-legend li + li {
    border-top: 1px solid #f0efed;
  }
  .chart-legend__dot {
    align-self: center;
    border-radius: 3px;
    height: 10px;
    width: 10px;
  }
  .chart-legend__label {
    color: #292524;
    font-size: 12.5px;
    font-weight: 600;
  }
  .chart-legend__value {
    color: #57534e;
    font-size: 12px;
    text-align: right;
    white-space: nowrap;
  }
  .stacked-bar-wrap {
    break-inside: avoid;
    margin: 12px 0 4px;
  }
  /* Methodology standard + data-source badges */
  .method-badges {
    break-inside: avoid;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
  .method-badge {
    background: #fafafa;
    border: 1px solid #d6d3d1;
    border-radius: 999px;
    color: #292524;
    font-size: 10.5px;
    font-weight: 600;
    padding: 5px 11px;
  }
  .method-badge--accent {
    background: color-mix(in srgb, var(--report-accent, #041282) 12%, #ffffff);
    border-color: color-mix(in srgb, var(--report-accent, #041282) 35%, #ffffff);
    color: color-mix(in srgb, var(--report-accent, #041282) 75%, #18181b);
  }
  /* Functional unit sub-label inside the product cell */
  .entity-fu {
    color: #78716c;
    display: block;
    font-size: 9.5px;
    font-weight: 400;
    margin-top: 2px;
  }
  .report-section--product-results .report-table {
    font-size: 9.5px;
    table-layout: fixed;
  }
  .report-section--product-results .report-table th,
  .report-section--product-results .report-table td {
    padding: 6px;
  }
  .report-section--product-results .report-table th:first-child,
  .report-section--product-results .report-table td:first-child {
    width: 19%;
  }
  .report-section--product-results .report-table .number {
    white-space: normal;
  }
  .report-table {
    break-inside: auto;
    border-collapse: collapse;
    font-size: 11.5px;
    margin-top: 12px;
    width: 100%;
  }
  .report-table thead {
    display: table-header-group;
  }
  .report-table tfoot {
    display: table-footer-group;
  }
  .report-table th {
    background: #292524;
    color: #ffffff;
    font-weight: 700;
    text-align: left;
  }
  .report-table th,
  .report-table td {
    border: 1px solid #d6d3d1;
    padding: 9px;
    vertical-align: top;
  }
  .report-table tr {
    break-inside: avoid;
  }
  .report-table tbody tr:nth-child(even) {
    background: #fafafa;
  }
  .report-table .number {
    text-align: right;
    white-space: nowrap;
  }
  /* Out-of-boundary (excluded) lifecycle stages: visually subdued so they read
     as reference data, clearly not part of the reported footprint. */
  .excluded-stages {
    break-inside: avoid;
    border: 1px dashed #d6d3d1;
    border-radius: 8px;
    background: #fafaf9;
    margin-top: 18px;
    padding: 14px 16px;
  }
  .excluded-stages h3 {
    color: #57534e;
    font-size: 13px;
    letter-spacing: 0.02em;
    margin: 0 0 6px;
    text-transform: uppercase;
  }
  .excluded-stages__note {
    color: #78716c;
    font-size: 12px;
    line-height: 1.55;
    margin: 0 0 8px;
  }
  .report-table--muted th {
    background: #78716c;
  }
  .report-table--muted td {
    color: #57534e;
  }
  .report-section--site-emissions .report-table {
    font-size: 10.5px;
  }
  .report-section--site-emissions .report-table th,
  .report-section--site-emissions .report-table td {
    padding: 7px;
  }
  .insight-list {
    color: #44403c;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
    padding-left: 18px;
  }
  .recommendation-list {
    counter-reset: recommendation;
    display: grid;
    gap: 10px;
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    /* Short list (typically 4 items): keep it whole so the heading never sits
       alone before a page break with the cards stranded on the next page. */
    break-inside: avoid;
  }
  .recommendation-list li {
    background: #fafafa;
    border: 1px solid #d6d3d1;
    border-left: 4px solid var(--report-accent, #041282);
    border-radius: 8px;
    break-inside: avoid;
    color: #3f3f46;
    counter-increment: recommendation;
    font-size: 13.5px;
    line-height: 1.55;
    padding: 11px 13px 11px 42px;
    position: relative;
  }
  /* The numbered badge. In the editable preview it is an absolutely-positioned
     CSS counter (so editing the text never picks up the number). */
  .recommendation-list li::before {
    align-items: center;
    background: var(--report-accent, #041282);
    border-radius: 999px;
    color: #ffffff;
    content: counter(recommendation);
    display: inline-flex;
    font-size: 10px;
    font-weight: 800;
    height: 20px;
    justify-content: center;
    left: 12px;
    position: absolute;
    top: 12px;
    width: 20px;
  }
  /* In the static PDF markup the number is a real, in-flow .rec-num element so it
     is selectable text in document order — an absolute/::before counter is
     emitted out of order in the PDF text layer, which made the recommendations
     look detached from their heading. The card switches to flex layout. */
  .recommendation-list--static li {
    align-items: flex-start;
    counter-increment: none;
    display: flex;
    gap: 10px;
    padding: 11px 13px;
  }
  .recommendation-list--static li::before {
    content: none;
  }
  .recommendation-list--static .rec-num {
    align-items: center;
    background: var(--report-accent, #041282);
    border-radius: 999px;
    color: #ffffff;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 10px;
    font-weight: 800;
    height: 20px;
    justify-content: center;
    margin-top: 1px;
    width: 20px;
  }
  .recommendation-list--static .rec-text {
    flex: 1 1 auto;
    min-width: 0;
  }
  /* Inline-edit affordance (preview only; never emitted in the PDF markup) */
  .report-editable {
    border-radius: 4px;
    min-height: 1em;
    outline: none;
    position: relative;
    transition: box-shadow 0.15s ease, background 0.15s ease;
  }
  .report-editable:hover {
    background: color-mix(in srgb, var(--report-accent, #041282) 5%, #ffffff);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--report-accent, #041282) 45%, transparent);
    cursor: text;
  }
  .report-editable:hover::after,
  .report-editable:focus::after {
    background: #18181b;
    border-radius: 999px;
    color: #ffffff;
    content: "Click to edit";
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1;
    padding: 4px 7px;
    position: absolute;
    right: 4px;
    top: -18px;
    white-space: nowrap;
    z-index: 10;
  }
  .report-editable:focus {
    background: #ffffff;
    box-shadow: 0 0 0 2px var(--report-accent, #041282);
  }
  .report-editable:focus::after {
    content: "Editing";
  }
  @media print {
    @page {
      size: A4;
    }
    body { background: #ffffff; }
    .report-page {
      margin: 0;
      padding: 0 22px 22px;
      width: 100%;
    }
    .report-cover {
      margin-left: -22px;
      margin-right: -22px;
      min-height: 360px;
      padding: 30px 24px;
    }
    .cover-main {
      margin-top: 72px;
    }
    .report-title {
      font-size: 34px;
    }
    .cover-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 42px;
    }
    .report-toc {
      margin-top: 0;
    }
    .report-section {
      margin-top: 0;
      padding-top: 22px;
    }
    .report-section + .report-section {
      margin-top: 24px;
    }
    .report-toc ol {
      columns: 2;
    }
    .analysis-block {
      padding-left: 12px;
    }
    .recommendation-list {
      gap: 8px;
    }
  }
`;

export const HTML_REPORT_PREVIEW_STYLES = `
  @media screen {
    .report-preview-viewport {
      --preview-page-width: 794px;
      --preview-page-height: 1123px;
      --preview-page-top-margin: 91px;
      --preview-page-bottom-margin: 83px;
      background: #eef1f5;
    }
    .report-preview-zoom {
      margin: 0 auto;
      min-width: max-content;
      width: max-content;
    }
    .report-preview-a4 {
      margin: 0 auto;
      position: relative;
      width: var(--preview-page-width);
    }
    .report-preview-a4 .report-page {
      background:
        repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent calc(var(--preview-page-height) - 1px),
          rgba(20, 22, 31, 0.18) calc(var(--preview-page-height) - 1px),
          rgba(20, 22, 31, 0.18) var(--preview-page-height)
        ),
        #ffffff;
      box-shadow:
        0 1px 2px rgba(20, 22, 31, 0.08),
        0 18px 42px -24px rgba(20, 22, 31, 0.45),
        0 0 0 1px rgba(20, 22, 31, 0.08);
      margin: 0 auto;
      min-height: var(--preview-page-height);
      padding: var(--preview-page-top-margin) 45px var(--preview-page-bottom-margin);
      position: relative;
      width: var(--preview-page-width);
    }
    .report-preview-a4 .report-cover {
      margin: 0 -45px 34px;
    }
    .report-preview-a4 .report-section {
      border-radius: 6px;
      margin-left: -12px;
      margin-right: -12px;
      padding-left: 12px;
      padding-right: 12px;
      transition: background 0.16s ease, box-shadow 0.16s ease;
    }
    .report-preview-a4 .report-section:hover {
      background: color-mix(in srgb, var(--report-accent, #041282) 4%, #ffffff);
      box-shadow: inset 3px 0 0 color-mix(in srgb, var(--report-accent, #041282) 35%, transparent);
      cursor: pointer;
    }
    .report-preview-a4 .report-section--active-preview {
      background: color-mix(in srgb, var(--report-accent, #041282) 7%, #ffffff);
      box-shadow:
        inset 4px 0 0 var(--report-accent, #041282),
        0 0 0 1px color-mix(in srgb, var(--report-accent, #041282) 24%, transparent);
    }
    .report-preview-a4 .report-section--active-preview h2 {
      color: color-mix(in srgb, var(--report-accent, #041282) 82%, #18181b);
    }
    .report-preview-page-chrome {
      height: var(--preview-page-height);
      left: 0;
      pointer-events: none;
      position: absolute;
      right: 0;
      top: calc(var(--page-index) * var(--preview-page-height));
      z-index: 8;
    }
    .report-preview-page-header,
    .report-preview-page-footer {
      align-items: center;
      color: #52525b;
      display: flex;
      font-size: 9px;
      gap: 12px;
      justify-content: space-between;
      left: 45px;
      letter-spacing: 0;
      line-height: 1.3;
      overflow: hidden;
      position: absolute;
      right: 45px;
      white-space: nowrap;
    }
    .report-preview-page-header {
      border-bottom: 1px solid #d4d4d8;
      padding: 0 0 7px;
      top: 22px;
    }
    .report-preview-page-footer {
      border-top: 1px solid #d4d4d8;
      bottom: 22px;
      padding: 7px 0 0;
    }
    .report-preview-page-brand {
      align-items: center;
      display: inline-flex;
      gap: 7px;
      min-width: 0;
    }
    .report-preview-page-brand::before {
      background: var(--report-accent, #041282);
      border-radius: 999px;
      content: "";
      display: inline-block;
      height: 7px;
      width: 7px;
    }
    .report-preview-page-header strong,
    .report-preview-page-footer strong {
      color: #18181b;
    }
    .report-preview-page-title {
      min-width: 0;
      overflow: hidden;
      text-align: right;
      text-overflow: ellipsis;
    }
    .report-preview-page-break {
      border-top: 1px dashed rgba(4, 18, 130, 0.26);
      bottom: -1px;
      left: 0;
      position: absolute;
      right: 0;
    }
    .report-preview-page-label {
      background: color-mix(in srgb, var(--report-accent, #041282) 12%, #ffffff);
      border: 1px solid color-mix(in srgb, var(--report-accent, #041282) 24%, #ffffff);
      border-radius: 999px;
      color: #292524;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0;
      padding: 4px 8px;
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
`;
