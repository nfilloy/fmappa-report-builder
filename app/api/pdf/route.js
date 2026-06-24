import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

import {
  renderHtmlReportDocument,
  renderPdfFooter,
  renderPdfHeader,
} from "@/lib/report/renderHtmlReport";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

async function resolveBrowserLaunchOptions() {
  const localExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  if (localExecutablePath) {
    return {
      args: await puppeteer.defaultArgs({ headless: true }),
      executablePath: localExecutablePath,
      headless: true,
    };
  }

  const executablePath = await chromium.executablePath(
    process.env.CHROMIUM_PACK_URL || DEFAULT_CHROMIUM_PACK_URL,
  );
  const headless = "shell";

  return {
    args: await puppeteer.defaultArgs({ args: chromium.args, headless }),
    defaultViewport: {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 1080,
      isLandscape: false,
      isMobile: false,
      width: 1440,
    },
    executablePath,
    headless,
  };
}

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

    const html = await renderHtmlReportDocument({ report, sections, settings });
    browser = await puppeteer.launch(await resolveBrowserLaunchOptions());
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

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
          "Unable to generate PDF. Check that Chromium is available for Puppeteer.",
      },
      { status: 500 },
    );
  } finally {
    await browser?.close();
  }
}
