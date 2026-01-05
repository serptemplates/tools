import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.TOOLS_BASE_URL ?? "http://localhost:3000";
const toolsPath = path.join(process.cwd(), "packages/app-core/src/data/tools.json");
const fixturesDir = path.join(process.cwd(), "apps/tools/benchmarks");

const toolsRaw = await fs.readFile(toolsPath, "utf8");
const tools = JSON.parse(toolsRaw).filter((tool) => tool.isActive);

const { chromium } = await import("playwright");

const fixture = {
  png: path.join(fixturesDir, "sample.png"),
  png2: path.join(fixturesDir, "sample-2.png"),
  json: await fs.readFile(path.join(fixturesDir, "sample.json"), "utf8"),
  csv1: path.join(fixturesDir, "sample.csv"),
  csv2: path.join(fixturesDir, "sample-2.csv"),
};

const browser = await chromium.launch();
const results = [];

async function hookBlobCapture(page) {
  await page.evaluate(() => {
    if (!window.__origCreateObjectURL) {
      window.__origCreateObjectURL = URL.createObjectURL;
    }
    URL.createObjectURL = (blob) => {
      if (!window.__blobEvents) window.__blobEvents = [];
      window.__blobEvents.push({
        size: blob?.size ?? null,
        type: blob?.type ?? null,
        time: Date.now(),
      });
      window.__lastBlobSize = blob?.size ?? null;
      window.__lastBlobType = blob?.type ?? null;
      return window.__origCreateObjectURL(blob);
    };
    window.__blobEvents = [];
    window.__lastBlobSize = null;
    window.__lastBlobType = null;
  });
}

async function waitForBlob(page, minEvents = 1, timeout = 15000) {
  await page.waitForFunction(
    (count) => Array.isArray(window.__blobEvents) && window.__blobEvents.length >= count,
    minEvents,
    { timeout }
  );
  return page.evaluate(() => window.__blobEvents[window.__blobEvents.length - 1]);
}

async function runFunctionalTest(page, tool) {
  if (tool.id === "png-to-png" || tool.route === "/compress-png") {
    const inputSize = (await fs.stat(fixture.png)).size;
    await hookBlobCapture(page);
    await page.setInputFiles("input[type=file]", fixture.png);
    const blob = await waitForBlob(page, 1, 20000);
    if (!blob?.size) {
      throw new Error("Compression did not produce output blob.");
    }
    return {
      detail: `compressed ${inputSize} -> ${blob?.size ?? "?"}`,
      metrics: { inputBytes: inputSize, outputBytes: blob?.size ?? null },
    };
  }

  if (tool.id === "batch-compress-png") {
    await hookBlobCapture(page);
    await page.setInputFiles("[data-testid=\"batch-compress-input\"]", [fixture.png, fixture.png2]);
    await page.waitForSelector("[data-testid=\"batch-compress-download\"]", { timeout: 20000 });
    const beforeCount = await page.evaluate(() => window.__blobEvents?.length ?? 0);
    await page.click("[data-testid=\"batch-compress-download\"]");
    await page.waitForFunction(
      (count) => Array.isArray(window.__blobEvents) && window.__blobEvents.length > count,
      beforeCount,
      { timeout: 20000 }
    );
    const blob = await page.evaluate(() => window.__blobEvents[window.__blobEvents.length - 1]);
    if (!blob?.size) {
      throw new Error("Batch compression did not produce output blob.");
    }
    return {
      detail: `zip size ${blob?.size ?? "?"}`,
      metrics: { outputBytes: blob?.size ?? null, outputType: blob?.type ?? null },
    };
  }

  if (tool.id === "json-to-csv") {
    await page.fill("[data-testid=\"json-input\"]", fixture.json);
    await page.click("[data-testid=\"json-convert\"]");
    await page.waitForFunction(() => {
      const el = document.querySelector("[data-testid=\"csv-output\"]");
      return el && el.value && el.value.length > 0;
    }, { timeout: 10000 });
    const output = await page.evaluate(() => {
      const el = document.querySelector("[data-testid=\"csv-output\"]");
      return el?.value ?? "";
    });
    const header = output.split("\n")[0]?.split(",").map((value) => value.trim()) ?? [];
    if (!header.includes("name") || !header.includes("count")) {
      throw new Error("JSON to CSV output missing expected headers.");
    }
    return { detail: `output ${output.split("\n").length} lines` };
  }

  if (tool.id === "csv-combiner") {
    await page.setInputFiles("[data-testid=\"csv-combiner-input\"]", [fixture.csv1, fixture.csv2]);
    await page.click("[data-testid=\"csv-combiner-run\"]");
    await page.waitForFunction(() => {
      const el = document.querySelector("[data-testid=\"csv-combiner-output\"]");
      return el && el.value && el.value.length > 0;
    }, { timeout: 10000 });
    const output = await page.evaluate(() => {
      const el = document.querySelector("[data-testid=\"csv-combiner-output\"]");
      return el?.value ?? "";
    });
    const header = output.split("\n")[0]?.split(",").map((value) => value.trim()) ?? [];
    const required = ["name", "count", "score", "extra"];
    const missing = required.filter((item) => !header.includes(item));
    if (missing.length) {
      throw new Error(`CSV combiner output missing headers: ${missing.join(", ")}`);
    }
    return { detail: `output ${output.split("\n").length} lines` };
  }

  if (tool.id === "character-counter") {
    const sampleText = "Hello world.\n\nSecond line!";
    await page.fill("[data-testid=\"character-counter-input\"]", sampleText);
    const grab = async (testId) => {
      const text = await page.textContent(`[data-testid=\"${testId}\"]`);
      return Number(text?.replace(/[^0-9]/g, "") || 0);
    };
    const stats = {
      characters: await grab("stat-characters"),
      charactersNoSpaces: await grab("stat-characters-no-spaces"),
      words: await grab("stat-words"),
      sentences: await grab("stat-sentences"),
      paragraphs: await grab("stat-paragraphs"),
      lines: await grab("stat-lines"),
      readingTime: await grab("stat-reading-time"),
      speakingTime: await grab("stat-speaking-time"),
    };
    const expected = {
      characters: sampleText.length,
      charactersNoSpaces: sampleText.replace(/\s/g, "").length,
      words: sampleText.trim().split(/\s+/).length,
      sentences: sampleText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length,
      paragraphs: sampleText.split(/\n\n+/).filter((p) => p.trim().length > 0).length,
      lines: sampleText.split(/\n/).length,
      readingTime: Math.ceil(sampleText.trim().split(/\s+/).length / 200),
      speakingTime: Math.ceil(sampleText.trim().split(/\s+/).length / 150),
    };
    const mismatches = Object.entries(expected)
      .filter(([key, value]) => stats[key] !== value)
      .map(([key, value]) => `${key}=${stats[key]} (expected ${value})`);
    if (mismatches.length) {
      throw new Error(`Character counter mismatch: ${mismatches.join("; ")}`);
    }
    return { detail: `chars ${stats.characters}, words ${stats.words}`, metrics: stats };
  }

  return null;
}

for (const tool of tools) {
  const result = {
    id: tool.id,
    route: tool.route,
    status: "pass",
    loadMs: null,
    detail: null,
    metrics: null,
    errors: [],
  };

  const page = await browser.newPage();

  try {
    const response = await page.goto(`${baseUrl}${tool.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response?.status() ?? "no-response"}`);
    }

    await page.waitForSelector("h1", { timeout: 10000 });

    const navTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return nav?.domContentLoadedEventEnd || null;
    });
    result.loadMs = navTiming ? Math.round(navTiming) : null;

    const functional = await runFunctionalTest(page, tool);
    if (functional) {
      result.detail = functional.detail ?? null;
      result.metrics = functional.metrics ?? null;
    } else if (["convert", "compress", "bulk", "combine"].includes(tool.operation)) {
      const fileInput = await page.$("input[type=file]");
      if (!fileInput) {
        result.status = "warn";
        result.errors.push("missing file input");
      }
    }
  } catch (err) {
    result.status = "fail";
    result.errors.push(err?.message || String(err));
  } finally {
    await page.close();
  }

  results.push(result);
  const statusLabel = result.status.toUpperCase();
  console.log(`${statusLabel} ${tool.id} (${tool.route})`);
}

await browser.close();

const summary = results.reduce(
  (acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  },
  { pass: 0, warn: 0, fail: 0 }
);

console.log("\nBenchmark summary:");
console.log(summary);

const outputPath = path.join(process.cwd(), "scripts/benchmark-results.json");
await fs.writeFile(outputPath, JSON.stringify({
  baseUrl,
  ranAt: new Date().toISOString(),
  summary,
  results,
}, null, 2));

console.log(`\nSaved results to ${outputPath}`);
