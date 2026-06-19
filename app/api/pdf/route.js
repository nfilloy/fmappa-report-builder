import { NextResponse } from "next/server";
import { chromium } from "playwright";

import { renderHtmlReportDocument } from "@/lib/report/renderHtmlReport";

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
      printBackground: true,
      margin: {
        top: "16mm",
        right: "12mm",
        bottom: "16mm",
        left: "12mm",
      },
    });

    return new Response(pdf, {
      headers: {
        "Content-Disposition": 'attachment; filename="ocf-report-2024.pdf"',
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
