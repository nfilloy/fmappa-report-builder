import { formatPercent, formatTonnes } from "@/lib/formatters";
import { enabledSections } from "@/lib/report/sections";

function paragraphs(content) {
  return String(content || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function GlobalResults({ report }) {
  return (
    <div className="metric-grid">
      <div className="metric-card">
        <div className="metric-label">Total emissions</div>
        <div className="metric-value">{formatTonnes(report.total.totalEmissions)}</div>
      </div>
      {report.scopeBreakdown.map((scope) => (
        <div className="metric-card" key={scope.label}>
          <div className="metric-label">{scope.label}</div>
          <div className="metric-value">{formatTonnes(scope.value)}</div>
          <p>{formatPercent(scope.percentage)}</p>
        </div>
      ))}
    </div>
  );
}

function ScopeBreakdownReport({ report }) {
  return (
    <div>
      {report.scopeBreakdown.map((scope) => (
        <div className="scope-row" key={scope.label}>
          <div className="scope-row-header">
            <strong>{scope.label}</strong>
            <span>
              {formatTonnes(scope.value)} · {formatPercent(scope.percentage)}
            </span>
          </div>
          <div className="scope-track">
            <div
              className="scope-fill"
              style={{ width: `${Math.min(scope.percentage, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SiteEmissionsReport({ report }) {
  return (
    <table className="report-table">
      <thead>
        <tr>
          <th>Entity</th>
          <th className="number">Scope 1</th>
          <th className="number">Scope 2</th>
          <th className="number">Scope 3</th>
          <th className="number">Total</th>
        </tr>
      </thead>
      <tbody>
        {report.sites.map((site) => (
          <tr key={site.entity}>
            <td>{site.entity}</td>
            <td className="number">{formatTonnes(site.scope1)}</td>
            <td className="number">{formatTonnes(site.scope2)}</td>
            <td className="number">{formatTonnes(site.scope3)}</td>
            <td className="number">{formatTonnes(site.totalEmissions)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CategoryTablesReport({ report }) {
  return (
    <div>
      {report.categoryBreakdown.map((group) => (
        <div className="report-section" key={group.scope}>
          <h2>{group.scope} detailed categories</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="number">Total empresa</th>
                {report.sites.map((site) => (
                  <th className="number" key={site.entity}>
                    {site.entity.replace("Planta ", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.categories.map((category) => (
                <tr key={category.key}>
                  <td>{category.label}</td>
                  <td className="number">{formatTonnes(category.total)}</td>
                  {category.sites.map((site) => (
                    <td className="number" key={site.entity}>
                      {formatTonnes(site.value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function InsightsReport({ content }) {
  return (
    <ul className="insight-list">
      {paragraphs(content).map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TextReport({ content }) {
  return (
    <>
      {paragraphs(content).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </>
  );
}

function SectionBody({ section, report }) {
  if (section.type === "metrics") {
    return <GlobalResults report={report} />;
  }

  if (section.type === "chart") {
    return <ScopeBreakdownReport report={report} />;
  }

  if (section.type === "table") {
    return <SiteEmissionsReport report={report} />;
  }

  if (section.type === "category-tables") {
    return <CategoryTablesReport report={report} />;
  }

  if (section.type === "insights") {
    return <InsightsReport content={section.content} />;
  }

  return <TextReport content={section.content} />;
}

export function HtmlReport({ report, sections, settings }) {
  const clientName = settings?.clientName || report.clientName;
  const reportLabel = settings?.reportLabel || "Configurable OCF report";
  const accentColor = settings?.accentColor || "#0891b2";

  return (
    <article
      className="report-page"
      style={{ "--report-accent": accentColor }}
    >
      <header className="report-cover">
        <div className="report-eyebrow">Footprint Mappa · {reportLabel}</div>
        <h1 className="report-title">{report.reportTitle}</h1>
        <div className="report-meta">
          <div>Client: {clientName}</div>
          <div>Source file: {report.fileName}</div>
          <div>
            Total source:{" "}
            {report.totalSource === "official"
              ? "Official Total empresa row"
              : "Calculated from site rows"}
          </div>
        </div>
      </header>

      {enabledSections(sections).map((section) => (
        <section className="report-section" key={section.id}>
          <h2>{section.title}</h2>
          <SectionBody section={section} report={report} />
        </section>
      ))}
    </article>
  );
}
