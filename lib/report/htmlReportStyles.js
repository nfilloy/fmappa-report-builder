export const HTML_REPORT_STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #e7e5e4;
    color: #18181b;
    font-family: Arial, Helvetica, sans-serif;
  }
  .report-page {
    width: min(100%, 940px);
    margin: 0 auto;
    background: #ffffff;
    padding: 0 48px 48px;
  }
  .report-cover {
    background:
      linear-gradient(135deg, rgba(24, 24, 27, 0.94), rgba(39, 39, 42, 0.88)),
      linear-gradient(90deg, var(--report-accent, #b91c1c), #18181b);
    color: #ffffff;
    margin: 0 -48px 34px;
    min-height: 430px;
    padding: 38px 48px 34px;
    position: relative;
  }
  .report-cover::after {
    background: var(--report-accent, #b91c1c);
    bottom: 0;
    content: "";
    height: 8px;
    left: 0;
    position: absolute;
    right: 0;
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
    break-inside: avoid;
    border-top: 1px solid #e4e4e7;
    counter-increment: report-section;
    margin-top: 30px;
    padding-top: 24px;
  }
  .report-toc {
    background: #fafafa;
    border: 1px solid #d6d3d1;
    border-left: 6px solid var(--report-accent, #b91c1c);
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
  }
  .report-section h2::before {
    background: var(--report-accent, #b91c1c);
    border-radius: 999px;
    color: #ffffff;
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
  .category-group {
    break-inside: avoid;
    margin-top: 18px;
  }
  .category-group h3 {
    color: #292524;
    font-size: 15px;
    margin: 0 0 8px;
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
    border-top: 4px solid var(--report-accent, #b91c1c);
    border-radius: 8px;
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
    background: linear-gradient(90deg, var(--report-accent, #b91c1c), #18181b);
    height: 100%;
  }
  .bar-list {
    margin: 14px 0;
  }
  .bar-row {
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
    background: #059669;
  }
  .category-fill {
    background: #d97706;
  }
  .report-table {
    border-collapse: collapse;
    font-size: 11.5px;
    margin-top: 12px;
    width: 100%;
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
  .report-table tbody tr:nth-child(even) {
    background: #fafafa;
  }
  .report-table .number {
    text-align: right;
    white-space: nowrap;
  }
  .insight-list {
    color: #44403c;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
    padding-left: 18px;
  }
  @media print {
    body { background: #ffffff; }
    .report-page {
      margin: 0;
      padding: 0 24px 24px;
      width: 100%;
    }
    .report-cover {
      margin-left: -24px;
      margin-right: -24px;
      min-height: 360px;
      padding: 30px 24px;
    }
    .cover-main {
      margin-top: 64px;
    }
    .report-title {
      font-size: 34px;
    }
    .cover-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 42px;
    }
    .report-section {
      break-inside: avoid;
    }
    .report-toc ol {
      columns: 2;
    }
  }
`;
