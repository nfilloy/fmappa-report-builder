export const HTML_REPORT_STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f4f4f5;
    color: #111827;
    font-family: Arial, Helvetica, sans-serif;
  }
  .report-page {
    width: min(100%, 920px);
    margin: 0 auto;
    background: #ffffff;
    padding: 48px;
  }
  .report-cover {
    border-bottom: 4px solid var(--report-accent, #0891b2);
    margin-bottom: 32px;
    padding-bottom: 24px;
  }
  .report-eyebrow {
    color: var(--report-accent, #0891b2);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .report-title {
    margin: 12px 0 8px;
    color: #111827;
    font-size: 34px;
    line-height: 1.12;
  }
  .report-meta {
    color: #52525b;
    font-size: 14px;
    line-height: 1.6;
  }
  .report-section {
    break-inside: avoid;
    margin-top: 28px;
  }
  .report-section h2 {
    color: #111827;
    font-size: 20px;
    margin: 0 0 10px;
  }
  .report-section p {
    color: #3f3f46;
    font-size: 14px;
    line-height: 1.65;
    margin: 0;
  }
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .metric-card {
    border: 1px solid #d4d4d8;
    border-radius: 8px;
    padding: 14px;
  }
  .metric-label {
    color: #71717a;
    font-size: 11px;
    text-transform: uppercase;
  }
  .metric-value {
    color: #111827;
    font-size: 18px;
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
    color: #27272a;
    font-size: 13px;
    margin-bottom: 6px;
  }
  .scope-track {
    background: #e4e4e7;
    border-radius: 999px;
    height: 10px;
    overflow: hidden;
  }
  .scope-fill {
    background: var(--report-accent, #0891b2);
    height: 100%;
  }
  .report-table {
    border-collapse: collapse;
    font-size: 11px;
    margin-top: 12px;
    width: 100%;
  }
  .report-table th {
    background: #f4f4f5;
    color: #3f3f46;
    font-weight: 700;
    text-align: left;
  }
  .report-table th,
  .report-table td {
    border: 1px solid #d4d4d8;
    padding: 8px;
    vertical-align: top;
  }
  .report-table .number {
    text-align: right;
    white-space: nowrap;
  }
  .insight-list {
    color: #3f3f46;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
    padding-left: 18px;
  }
  @media print {
    body { background: #ffffff; }
    .report-page {
      margin: 0;
      padding: 32px;
      width: 100%;
    }
    .report-section {
      break-inside: avoid;
    }
  }
`;
