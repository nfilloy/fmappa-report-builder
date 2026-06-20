import { formatEmissions, formatPercent } from "@/lib/formatters";
import { maxByValue, percentageOfMax } from "@/lib/report/chartData";
import { SEQUENTIAL_COLORS } from "@/lib/report/chartTheme";
import { buildBrandTheme } from "@/lib/report/brandTheme";
import { enabledSections } from "@/lib/report/sections";
import {
  breakdownLegendHtml,
  donutSvg,
  stackedBarSvg,
} from "@/lib/report/svgCharts";

function paragraphs(content) {
  return String(content || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function shortEntityName(name) {
  return String(name ?? "").replace("Planta ", "");
}

// Inline-editable text block: in editable mode the content is contentEditable
// and commits to the section model on blur; otherwise it is plain markup.
function Editable({ as: Tag = "div", editable, onCommit, className, title, children }) {
  if (!editable) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={`${className || ""} report-editable`.trim()}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      title={title}
      onBlur={(event) => onCommit(event.currentTarget.innerText)}
    >
      {children}
    </Tag>
  );
}

function GlobalResults({ report }) {
  const unit = report.unit;
  return (
    <div className="metric-grid">
      <div className="metric-card">
        <div className="metric-label">Total emissions</div>
        <div className="metric-value">{formatEmissions(report.total.totalEmissions, unit)}</div>
      </div>
      {report.breakdown.map((item) => (
        <div className="metric-card" key={item.label}>
          <div className="metric-label">{item.label}</div>
          <div className="metric-value">{formatEmissions(item.value, unit)}</div>
          <p>{formatPercent(item.percentage)}</p>
        </div>
      ))}
    </div>
  );
}

function BreakdownReport({ report }) {
  const html =
    donutSvg({
      breakdown: report.breakdown,
      total: report.total.totalEmissions,
      unit: report.unit,
    }) + breakdownLegendHtml({ breakdown: report.breakdown, unit: report.unit });

  return (
    <div className="report-chart" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function EntityEmissionsReport({ report }) {
  const unit = report.unit;
  const colors = report.breakdown.map((item) => item.color);
  const chartHtml = stackedBarSvg({
    entities: report.entities,
    columns: report.entityColumns,
    colors,
    unit,
  });

  return (
    <>
      <div
        className="stacked-bar-wrap"
        dangerouslySetInnerHTML={{
          __html: chartHtml,
        }}
      />
      <table className="report-table">
        <thead>
          <tr>
            <th>
              {report.entityLabel}
              {report.showFunctionalUnit ? " & functional unit" : ""}
            </th>
            {report.entityColumns.map((column) => (
              <th className="number" key={column.key}>
                {column.label}
              </th>
            ))}
            <th className="number">Total</th>
          </tr>
        </thead>
        <tbody>
          {report.entities.map((entity) => (
            <tr key={entity.name}>
              <td>
                {entity.name}
                {report.showFunctionalUnit && entity.meta ? (
                  <span className="entity-fu">{entity.meta}</span>
                ) : null}
              </td>
              {report.entityColumns.map((column) => (
                <td className="number" key={column.key}>
                  {formatEmissions(entity.values[column.key], unit)}
                </td>
              ))}
              <td className="number">{formatEmissions(entity.totalEmissions, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function TopCategoriesReport({ report }) {
  const unit = report.unit;
  const maxCategoryValue = maxByValue(report.topCategories, "value");

  if (report.topCategories.length === 0) {
    return <p>{report.topEmptyText}</p>;
  }

  return (
    <div className="bar-list">
      {report.topCategories.map((category, index) => (
        <div className="bar-row" key={category.key}>
          <div className="bar-row-header">
            <strong>{category.label}</strong>
            <span>{formatEmissions(category.value, unit)}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill category-fill"
              style={{
                width: `${percentageOfMax(category.value, maxCategoryValue)}%`,
                background:
                  category.color || SEQUENTIAL_COLORS[index % SEQUENTIAL_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryTablesReport({ report }) {
  const unit = report.unit;
  const totalLabel = report.categoryTotalLabel || "Total";

  return (
    <div>
      {report.categoryBreakdown.map((group) => (
        <div className="category-group" key={group.group}>
          <h3>{group.group} detailed categories</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="number">{totalLabel}</th>
                {group.categories[0].perEntity.map((entity) => (
                  <th className="number" key={entity.name}>
                    {shortEntityName(entity.name)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.categories.map((category) => (
                <tr key={category.key}>
                  <td>{category.label}</td>
                  <td className="number">{formatEmissions(category.total, unit)}</td>
                  {category.perEntity.map((entity) => (
                    <td className="number" key={entity.name}>
                      {formatEmissions(entity.value, unit)}
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

function MethodologyBadges({ report }) {
  return (
    <div className="method-badges">
      <span className="method-badge method-badge--accent">{report.standardLong}</span>
      <span className="method-badge">{report.ghgProtocol}</span>
      {report.dataSources.map((source) => (
        <span className="method-badge" key={source}>
          {source}
        </span>
      ))}
    </div>
  );
}

function SectionIntro({ section, editable, onUpdateSection }) {
  const items = paragraphs(section.content);

  if (items.length === 0 && !editable) {
    return null;
  }

  return (
    <Editable
      className="section-intro"
      editable={editable}
      title="Click to edit"
      onCommit={(text) => onUpdateSection(section.id, { content: text })}
    >
      {items.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </Editable>
  );
}

function TextReport({ section, editable, onUpdateSection }) {
  const items = paragraphs(section.content);

  return (
    <Editable
      editable={editable}
      title="Click to edit"
      onCommit={(text) => onUpdateSection(section.id, { content: text })}
    >
      {items.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </Editable>
  );
}

function InsightsReport({ section, editable, onUpdateSection }) {
  const items = paragraphs(section.content);

  return (
    <Editable
      as="ul"
      className="insight-list"
      editable={editable}
      title="Click to edit"
      onCommit={(text) => onUpdateSection(section.id, { content: text })}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </Editable>
  );
}

function NarrativeAnalysisReport({ section, editable, onUpdateSection }) {
  const items = paragraphs(section.content);

  return (
    <Editable
      className="analysis-block"
      editable={editable}
      title="Click to edit"
      onCommit={(text) => onUpdateSection(section.id, { content: text })}
    >
      {items.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>{paragraph}</p>
      ))}
    </Editable>
  );
}

function RecommendationsReport({ section, editable, onUpdateSection }) {
  const items = paragraphs(section.content);

  return (
    <Editable
      as="ol"
      className="recommendation-list"
      editable={editable}
      title="Click to edit"
      onCommit={(text) => onUpdateSection(section.id, { content: text })}
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </Editable>
  );
}

function SectionBody({ section, report, editable, onUpdateSection }) {
  const editProps = { editable, onUpdateSection };

  if (section.type === "metrics") {
    return (
      <>
        <SectionIntro section={section} {...editProps} />
        <GlobalResults report={report} />
      </>
    );
  }

  if (section.type === "chart") {
    return (
      <>
        <SectionIntro section={section} {...editProps} />
        <BreakdownReport report={report} />
      </>
    );
  }

  if (section.type === "table") {
    return (
      <>
        <SectionIntro section={section} {...editProps} />
        <EntityEmissionsReport report={report} />
      </>
    );
  }

  if (section.type === "category-tables") {
    return (
      <>
        <SectionIntro section={section} {...editProps} />
        <CategoryTablesReport report={report} />
      </>
    );
  }

  if (section.type === "insights") {
    return (
      <>
        <InsightsReport section={section} {...editProps} />
        <TopCategoriesReport report={report} />
      </>
    );
  }

  if (section.type === "narrative-analysis") {
    return <NarrativeAnalysisReport section={section} {...editProps} />;
  }

  if (section.type === "recommendations") {
    return <RecommendationsReport section={section} {...editProps} />;
  }

  return (
    <>
      <TextReport section={section} {...editProps} />
      {section.id === "methodology" ? <MethodologyBadges report={report} /> : null}
    </>
  );
}

function sectionClassName(section) {
  return [
    "report-section",
    `report-section--${section.id}`,
    `report-section--${section.type}`,
    section.printMode ? `report-section--print-${section.printMode}` : "",
  ].join(" ");
}

export function HtmlReport({
  report,
  sections,
  settings,
  editable = false,
  onUpdateSection,
  onSelectSection,
  selectedSectionId,
}) {
  const clientName = settings?.clientName || report.clientName;
  const reportLabel = settings?.reportLabel || report.reportTitle;
  const brand = buildBrandTheme(settings);
  const reportYear = settings?.reportYear || "2024";
  const preparedBy = settings?.preparedBy || "Footprint Mappa";
  const preparedFor = settings?.preparedFor || "";
  const reportDate = settings?.reportDate || "";
  const reportingPeriod = settings?.reportingPeriod || "";
  const subtitle = settings?.subtitle || report.coverSubtitle;
  const totalSourceLabel = settings?.totalSourceLabel || report.totalSourceLabel;
  const notes = settings?.notes || "";
  const logoDataUrl = settings?.logoDataUrl || "";
  const visibleSections = enabledSections(sections);
  const eyebrow = [`Prepared by ${preparedBy}`];
  if (preparedFor) eyebrow.push(`Prepared for ${preparedFor}`);
  if (reportDate) eyebrow.push(reportDate);

  return (
    <article
      className="report-page"
      style={{ "--report-accent": brand.accent, "--report-on-accent": brand.onAccent }}
    >
      <header className="report-cover">
        <div className="cover-topline">
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL embedded in HTML/PDF report
            <img className="cover-logo" src={logoDataUrl} alt={`${clientName} logo`} />
          ) : (
            <div className="client-wordmark">{clientName}</div>
          )}
          <div className="report-badge">
            {report.coverBadge} {reportYear}
          </div>
        </div>
        <div className="cover-main">
          <p className="report-eyebrow">{eyebrow.join(" · ")}</p>
          <h1 className="report-title">{reportLabel}</h1>
          <p className="report-subtitle">{subtitle}</p>
          <div className="cover-headline">
            <strong>{formatEmissions(report.total.totalEmissions, report.unit)}</strong>
            <span>total footprint · {reportYear}</span>
          </div>
          <div className="cover-standard">
            <span>{report.standardLong}</span>
            <span>
              {report.ghgProtocol.includes("Product")
                ? "GHG Protocol · Product"
                : "GHG Protocol · Corporate"}
            </span>
          </div>
        </div>
        <div className="cover-summary">
          <div>
            <span>Client</span>
            <strong>{clientName}</strong>
          </div>
          <div>
            <span>Total emissions</span>
            <strong>{formatEmissions(report.total.totalEmissions, report.unit)}</strong>
          </div>
          <div>
            <span>{reportingPeriod ? "Reporting period" : "Source file"}</span>
            <strong>{reportingPeriod || report.fileName}</strong>
          </div>
          <div>
            <span>Total source</span>
            <strong>{totalSourceLabel}</strong>
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
        <section
          className={[
            sectionClassName(section),
            editable && section.id === selectedSectionId
              ? "report-section--active-preview"
              : "",
          ].join(" ")}
          key={section.id}
          data-section-id={section.id}
          onClick={editable ? () => onSelectSection?.(section.id) : undefined}
          onFocus={editable ? () => onSelectSection?.(section.id) : undefined}
        >
          <h2>
            <Editable
              as="span"
              editable={editable}
              title="Click to edit title"
              onCommit={(text) => onUpdateSection(section.id, { title: text })}
            >
              {section.title}
            </Editable>
          </h2>
          <SectionBody
            section={section}
            report={report}
            editable={editable}
            onUpdateSection={onUpdateSection}
          />
        </section>
      ))}
    </article>
  );
}
