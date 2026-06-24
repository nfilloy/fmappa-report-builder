import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";
import test from "node:test";

import { chromium } from "playwright";

const EXTERNAL_TEST_URL = process.env.RESPONSIVE_TEST_URL || "";
const VIEWPORTS = [
  { width: 320, height: 900 },
  { width: 375, height: 900 },
  { width: 768, height: 1000 },
  { width: 1024, height: 1000 },
  { width: 1280, height: 1000 },
  { width: 1440, height: 1000 },
];
const SAMPLE_CSV = join(process.cwd(), "data", "sample_ocf_iso_14064.csv");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Grab an ephemeral free port from the OS so the E2E never collides with a dev
// server (or another test run) already holding a fixed port.
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, getLogs, timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Next is still starting.
    }

    await wait(500);
  }

  throw new Error(`Server did not start at ${url}\n${getLogs()}`);
}

function startNext(port) {
  const nextBin = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const mode = "dev";
  const child = spawn(process.execPath, [nextBin, mode, "-p", String(port), "-H", "127.0.0.1"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      // Isolated build dir → isolated dev lock, so this server coexists with a
      // dev server already running against the default `.next`.
      NEXT_DIST_DIR: ".next-e2e",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logs = [];
  const capture = (chunk) => {
    logs.push(String(chunk));
    if (logs.length > 40) {
      logs.shift();
    }
  };
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);

  return {
    child,
    logs: () => logs.join(""),
  };
}

// Boots a Next dev server on a runtime-resolved free port (or honours
// RESPONSIVE_TEST_URL) and hands back the base URL plus a teardown.
async function bootApp() {
  if (EXTERNAL_TEST_URL) {
    return { baseUrl: EXTERNAL_TEST_URL, stop: () => {} };
  }

  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startNext(port);
  await waitForServer(baseUrl, server.logs);

  return { baseUrl, stop: () => server.child.kill() };
}

async function findHorizontalOverflow(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const allowedOverflow = new Set(["auto", "hidden", "scroll"]);

    return Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        if (rect.width <= 0 || rect.height <= 0) {
          return false;
        }

        if (style.position === "absolute" && style.clipPath === "inset(50%)") {
          return false;
        }

        if (allowedOverflow.has(style.overflowX)) {
          return false;
        }

        if (element.closest('[class*="overflow-x-auto"], [class*="overflow-auto"]')) {
          return false;
        }

        if (element.closest(".recharts-wrapper")) {
          return false;
        }

        // Toast notifications are a fixed-position overlay portal, not part of
        // the responsive document flow.
        if (element.closest("[data-sonner-toaster]")) {
          return false;
        }

        const leaksViewport =
          rect.left < -1 || rect.right > viewportWidth + 1;
        const leaksOwnBox =
          !["INPUT", "TEXTAREA"].includes(element.tagName) &&
          style.textOverflow !== "ellipsis" &&
          element.scrollWidth > element.clientWidth + 1;

        return leaksViewport || leaksOwnBox;
      })
      .slice(0, 10)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          className: element.className,
          tagName: element.tagName.toLowerCase(),
          text: element.textContent?.trim().slice(0, 100),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          viewportWidth,
        };
      });
  });
}

test("report builder stays within the viewport across responsive widths", async () => {
  const app = await bootApp();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });

    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport });
      await page.goto(app.baseUrl, { waitUntil: "networkidle" });
      await page
        .getByLabel(/upload ocf or pcf csv file/i)
        .setInputFiles(SAMPLE_CSV);
      await page.getByText("HTML report preview").waitFor({ timeout: 15000 });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      const overflow = await findHorizontalOverflow(page);
      assert.deepEqual(
        overflow,
        [],
        `Unexpected horizontal overflow at ${viewport.width}px: ${JSON.stringify(overflow, null, 2)}`,
      );

      await page.close();
    }
  } finally {
    await browser?.close();
    app.stop();
  }
});

test("section outline edits the live document preview", async () => {
  const app = await bootApp();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await page.goto(app.baseUrl, { waitUntil: "networkidle" });
    await page
      .getByLabel(/upload ocf or pcf csv file/i)
      .setInputFiles(SAMPLE_CSV);
    await page.getByText("HTML report preview").waitFor({ timeout: 15000 });

    await page
      .locator("aside button")
      .filter({ hasText: "Methodological approach" })
      .first()
      .click();
    await page.getByLabel("Section copy").fill("Live editor proof text.");

    await page
      .locator("[data-section-id='methodology']")
      .filter({ hasText: "Live editor proof text." })
      .waitFor({ timeout: 5000 });

    const activeSectionId = await page.evaluate(() => {
      const active = document.querySelector(".report-section--active-preview");
      return active?.getAttribute("data-section-id");
    });

    assert.equal(activeSectionId, "methodology");

    await page
      .locator("[data-section-id='methodology']")
      .getByText("Live editor proof text.")
      .waitFor({ timeout: 5000 });
  } finally {
    await browser?.close();
    app.stop();
  }
});
