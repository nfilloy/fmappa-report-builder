import { NextResponse } from "next/server";
import { chromium } from "playwright";

import {
  renderHtmlReportDocument,
  renderPdfFooter,
  renderPdfHeader,
} from "@/lib/report/renderHtmlReport";

export const runtime = "nodejs";

export async function POST(request) {
  let browser;

  try {
    const { report, sections, settings } = await request.json();

    if (!report || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: "Request body must include report and sections." },
        { status: 400 },
      );
    }

    const html = renderHtmlReportDocument({ report, sections, settings });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle" });

    const pdf = await page.pdf({
      format: "A4",
      displayHeaderFooter: true,
      footerTemplate: renderPdfFooter({ settings }),
      headerTemplate: renderPdfHeader({ report, settings }),
      printBackground: true,
      margin: {
        top: "24mm",
        right: "12mm",
        bottom: "22mm",
        left: "12mm",
      },
    });

    const kind = report.kind === "pcf" ? "pcf" : "ocf";
    const reportYear = settings?.reportYear || "2024";
    const fileName = `${kind}-report-${reportYear}.pdf`;

    return new Response(pdf, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to generate PDF. Check that Playwright browsers are installed.",
      },
      { status: 500 },
    );
  } finally {
    await browser?.close();
  }
}
