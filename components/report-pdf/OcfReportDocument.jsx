import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatPercent, formatTonnes } from "@/lib/formatters";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    color: "#111827",
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  eyebrow: {
    color: "#0e7490",
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 4,
    color: "#4b5563",
    fontSize: 11,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    marginBottom: 6,
    color: "#111827",
    fontSize: 13,
    fontWeight: 700,
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  metric: {
    flex: 1,
    border: "1px solid #d1d5db",
    borderRadius: 4,
    padding: 10,
  },
  metricLabel: {
    color: "#6b7280",
    fontSize: 8,
  },
  metricValue: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: 700,
  },
  table: {
    marginTop: 8,
    border: "1px solid #d1d5db",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    borderBottom: "1px solid #e5e7eb",
  },
  headerCell: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 6,
    color: "#374151",
    fontSize: 8,
    fontWeight: 700,
  },
  cell: {
    flex: 1,
    padding: 6,
    fontSize: 8,
  },
  listItem: {
    marginTop: 3,
  },
});

export function OcfReportDocument({ report }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Footprint Mappa · Path A MVP</Text>
        <Text style={styles.title}>{report.reportTitle}</Text>
        <Text style={styles.subtitle}>Client: {report.clientName}</Text>
        <Text style={styles.subtitle}>Source file: {report.fileName}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive summary</Text>
          <Text>
            {report.clientName} reports {formatTonnes(report.total.totalEmissions)} across its organisational carbon footprint. Scope 3 is the largest contributor where value-chain category data is available.
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Total emissions</Text>
            <Text style={styles.metricValue}>{formatTonnes(report.total.totalEmissions)}</Text>
          </View>
          {report.scopeBreakdown.map((scope) => (
            <View key={scope.label} style={styles.metric}>
              <Text style={styles.metricLabel}>{scope.label}</Text>
              <Text style={styles.metricValue}>{formatTonnes(scope.value)}</Text>
              <Text>{formatPercent(scope.percentage)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Methodology</Text>
          <Text>
            The report uses a client-side CSV parser and a normalised OCF model. Required inputs are entity, total emissions, Scope 1, Scope 2 and Scope 3 totals. The same model drives this PDF and the browser preview.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organisational boundary</Text>
          <Text>
            The boundary is based on the uploaded entity rows. {report.totalSource === "official" ? "The Total empresa row is used as the official company total." : "No Total empresa row was provided, so totals are calculated from the listed sites."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global results</Text>
          <Text>Total emissions: {formatTonnes(report.total.totalEmissions)}</Text>
          <Text>Scope 1: {formatTonnes(report.total.scope1)}</Text>
          <Text>Scope 2: {formatTonnes(report.total.scope2)}</Text>
          <Text>Scope 3: {formatTonnes(report.total.scope3)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scope breakdown</Text>
          {report.scopeBreakdown.map((scope) => (
            <Text key={scope.label} style={styles.listItem}>
              {scope.label}: {formatTonnes(scope.value)} ({formatPercent(scope.percentage)})
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site emissions</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.headerCell}>Entity</Text>
              <Text style={styles.headerCell}>Scope 1</Text>
              <Text style={styles.headerCell}>Scope 2</Text>
              <Text style={styles.headerCell}>Scope 3</Text>
              <Text style={styles.headerCell}>Total</Text>
            </View>
            {report.sites.map((site) => (
              <View key={site.entity} style={styles.row}>
                <Text style={styles.cell}>{site.entity}</Text>
                <Text style={styles.cell}>{formatTonnes(site.scope1)}</Text>
                <Text style={styles.cell}>{formatTonnes(site.scope2)}</Text>
                <Text style={styles.cell}>{formatTonnes(site.scope3)}</Text>
                <Text style={styles.cell}>{formatTonnes(site.totalEmissions)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key insights</Text>
          {report.topScope3Categories.length > 0 ? (
            report.topScope3Categories.map((category) => (
              <Text key={category.key} style={styles.listItem}>
                {category.label}: {formatTonnes(category.value)}
              </Text>
            ))
          ) : (
            <Text>No recognised Scope 3 category columns were available in the uploaded CSV.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limitations and next steps</Text>
          <Text>
            This MVP does not store files, enrich activity data, calculate emission factors or replicate a full ISO 14064 Word report. Next steps include stronger schema validation, audited factor sources, branding templates and backend persistence.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
