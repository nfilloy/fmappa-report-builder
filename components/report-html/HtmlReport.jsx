import { formatPercent, formatTonnes } from "@/lib/formatters";
import { maxByValue, percentageOfMax } from "@/lib/report/chartData";
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
  const maxEmissions = maxByValue(report.sites, "totalEmissions");

  return (
    <>
      <div className="bar-list">
        {report.sites.map((site) => (
          <div className="bar-row" key={site.entity}>
            <div className="bar-row-header">
              <strong>{site.entity}</strong>
              <span>{formatTonnes(site.totalEmissions)}</span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill site-fill"
                style={{
                  width: `${percentageOfMax(site.totalEmissions, maxEmissions)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
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
    </>
  );
}

function TopScope3Report({ report }) {
  const maxCategoryValue = maxByValue(report.topScope3Categories, "value");

  if (report.topScope3Categories.length === 0) {
    return <p>No recognised Scope 3 category values were available.</p>;
  }

  return (
    <div className="bar-list">
      {report.topScope3Categories.map((category) => (
        <div className="bar-row" key={category.key}>
          <div className="bar-row-header">
            <strong>{category.label}</strong>
            <span>{formatTonnes(category.value)}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill category-fill"
              style={{
                width: `${percentageOfMax(category.value, maxCategoryValue)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryTablesReport({ report }) {
  return (
    <div>
      {report.categoryBreakdown.map((group) => (
        <div className="category-group" key={group.scope}>
          <h3>{group.scope} detailed categories</h3>
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

function SectionIntro({ content }) {
  const items = paragraphs(content);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="section-intro">
      {items.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
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
    return (
      <>
        <SectionIntro content={section.content} />
        <GlobalResults report={report} />
      </>
    );
  }

  if (section.type === "chart") {
    return (
      <>
        <SectionIntro content={section.content} />
        <ScopeBreakdownReport report={report} />
      </>
    );
  }

  if (section.type === "table") {
    return (
      <>
        <SectionIntro content={section.content} />
        <SiteEmissionsReport report={report} />
      </>
    );
  }

  if (section.type === "category-tables") {
    return (
      <>
        <SectionIntro content={section.content} />
        <CategoryTablesReport report={report} />
      </>
    );
  }

  if (section.type === "insights") {
    return (
      <>
        <InsightsReport content={section.content} />
        <TopScope3Report report={report} />
      </>
    );
  }

  return <TextReport content={section.content} />;
}

export function HtmlReport({ report, sections, settings }) {
  const clientName = settings?.clientName || report.clientName;
  const reportLabel =
    settings?.reportLabel || "Organisational Carbon Footprint Report 2024";
  const accentColor = settings?.accentColor || "#b91c1c";
  const reportYear = settings?.reportYear || "2024";
  const preparedBy = settings?.preparedBy || "Footprint Mappa";
  const reportingPeriod = settings?.reportingPeriod || "";
  const notes = settings?.notes || "";
  const logoDataUrl = settings?.logoDataUrl || "";
  const visibleSections = enabledSections(sections);
  const totalSource =
    report.totalSource === "official"
      ? "Official Total empresa row"
      : "Calculated from site rows";

  return (
    <article
      className="report-page"
      style={{ "--report-accent": accentColor }}
    >
      <header className="report-cover">
        <div className="cover-topline">
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL embedded in HTML/PDF report
            <img className="cover-logo" src={logoDataUrl} alt={`${clientName} logo`} />
          ) : (
            <div className="client-wordmark">{clientName}</div>
          )}
          <div className="report-badge">OCF {reportYear}</div>
        </div>
        <div className="cover-main">
          <p className="report-eyebrow">Prepared by {preparedBy}</p>
          <h1 className="report-title">{reportLabel}</h1>
          <p className="report-subtitle">
            Configurable Scope 1, Scope 2 and Scope 3 emissions report generated from the uploaded OCF dataset.
          </p>
        </div>
        <div className="cover-summary">
          <div>
            <span>Client</span>
            <strong>{clientName}</strong>
          </div>
          <div>
            <span>Total emissions</span>
            <strong>{formatTonnes(report.total.totalEmissions)}</strong>
          </div>
          <div>
            <span>{reportingPeriod ? "Reporting period" : "Source file"}</span>
            <strong>{reportingPeriod || report.fileName}</strong>
          </div>
          <div>
            <span>Total source</span>
            <strong>{totalSource}</strong>
          </div>
        </div>
        {notes ? (
          <div className="cover-note">
            <span>Assumptions &amp; notes</span>
            <p>{notes}</p>
          </div>
        ) : null}
      </header>

      <nav className="report-toc" aria-label="Report sections">
        <h2>Included sections</h2>
        <ol>
          {visibleSections.map((section) => (
            <li key={section.id}>{section.title}</li>
          ))}
        </ol>
      </nav>

      {visibleSections.map((section) => (
        <section className="report-section" key={section.id}>
          <h2>{section.title}</h2>
          <SectionBody section={section} report={report} />
        </section>
      ))}
    </article>
  );
}
