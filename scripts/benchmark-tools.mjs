import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.TOOLS_BASE_URL ?? "http://localhost:3000";
const toolsPath = path.join(process.cwd(), "packages/app-core/src/data/tools.json");
const fixturesDir = path.join(process.cwd(), "apps/tools/benchmarks");
const fixtureMatrixPath = path.join(fixturesDir, "fixture-matrix.json");

const toolsRaw = await fs.readFile(toolsPath, "utf8");
let tools = JSON.parse(toolsRaw).filter((tool) => tool.isActive);
const toolFilter = process.env.TOOLS_ONLY
  ? process.env.TOOLS_ONLY.split(",").map((id) => id.trim()).filter(Boolean)
  : null;
if (toolFilter?.length) {
  const filterSet = new Set(toolFilter);
  tools = tools.filter((tool) => filterSet.has(tool.id));
}
const toolLimit = process.env.TOOLS_LIMIT ? Number(process.env.TOOLS_LIMIT) : null;
if (toolLimit && Number.isFinite(toolLimit)) {
  tools = tools.slice(0, Math.max(0, toolLimit));
}
const fixtureMatrix = JSON.parse(await fs.readFile(fixtureMatrixPath, "utf8"));
const formatFixtures = new Map(
  (fixtureMatrix.formats ?? []).map((entry) => [entry.format, entry])
);
const toolFixtures = fixtureMatrix.toolFixtures ?? {};

const textOnlyTools = new Set(["json-to-csv", "character-counter"]);

const { chromium } = await import("playwright");

const MIME_MAP = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  pdf: "application/pdf",
  svg: "image/svg+xml",
  heic: "image/heic",
  heif: "image/heif",
  ico: "image/x-icon",
  avif: "image/avif",
  tiff: "image/tiff",
  mp4: "video/mp4",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  m4v: "video/x-m4v",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  ts: "video/mp2t",
  mts: "video/mp2t",
  m2ts: "video/mp2t",
  flv: "video/x-flv",
  f4v: "video/x-f4v",
  vob: "video/dvd",
  "3gp": "video/3gpp",
  hevc: "video/mp4",
  divx: "video/avi",
  mjpeg: "video/x-motion-jpeg",
  asf: "video/x-ms-asf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  aac: "audio/aac",
  m4a: "audio/mp4",
  opus: "audio/opus",
  flac: "audio/flac",
  wma: "audio/x-ms-wma",
  aiff: "audio/aiff",
  mp2: "audio/mpeg",
};

function getExpectedMimeType(format) {
  if (!format) return "application/octet-stream";
  return MIME_MAP[format.toLowerCase()] || "application/octet-stream";
}

const fixtureCache = new Map();

function resolveFixturePath(relativePath) {
  if (!relativePath) return null;
  return path.join(fixturesDir, relativePath);
}

function getFormatFixture(format) {
  if (!format) return null;
  const entry = formatFixtures.get(format);
  if (!entry || entry.status !== "ready" || !entry.fixture) return null;
  return { entry, path: resolveFixturePath(entry.fixture) };
}

const browser = await chromium.launch();
const results = [];

async function waitForHydration(page) {
  await page.waitForFunction(() => {
    const input = document.querySelector('[data-testid="tool-file-input"], input[type="file"]');
    if (!input) return true;
    const keys = Object.keys(input);
    return keys.some((key) => key.startsWith("__reactFiber") || key.startsWith("__reactProps"));
  }, null, { timeout: 15000 });
}

async function getFixtureFile(filePath) {
  if (fixtureCache.has(filePath)) return fixtureCache.get(filePath);
  const buffer = await fs.readFile(filePath);
  const file = {
    name: path.basename(filePath),
    type: getExpectedMimeType(path.extname(filePath).slice(1)),
    base64: buffer.toString("base64"),
  };
  fixtureCache.set(filePath, file);
  return file;
}

async function dropFilesOnDropzone(page, selector, filePaths) {
  const files = [];
  for (const filePath of filePaths) {
    if (!filePath) continue;
    files.push(await getFixtureFile(filePath));
  }
  if (!files.length) {
    throw new Error("No files available for dropzone upload.");
  }

  await page.evaluate(({ selector, files }) => {
    const dropzone = document.querySelector(selector);
    if (!dropzone) {
      throw new Error(`Missing dropzone ${selector}`);
    }
    const dataTransfer = new DataTransfer();
    for (const file of files) {
      const bytes = Uint8Array.from(atob(file.base64), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: file.type || "application/octet-stream" });
      const fileHandle = new File([blob], file.name, { type: file.type || "application/octet-stream" });
      dataTransfer.items.add(fileHandle);
    }
    const buildEvent = (type) => {
      try {
        return new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
      } catch {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
        return event;
      }
    };
    dropzone.dispatchEvent(buildEvent("dragenter"));
    dropzone.dispatchEvent(buildEvent("dragover"));
    dropzone.dispatchEvent(buildEvent("drop"));
  }, { selector, files });
}

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
    const fixtureEntry = getFormatFixture("png");
    if (!fixtureEntry) {
      return { skipped: true, reason: "missing png fixture" };
    }
    const inputSize = (await fs.stat(fixtureEntry.path)).size;
    await hookBlobCapture(page);
    await dropFilesOnDropzone(page, "[data-testid=\"tool-dropzone\"]", [fixtureEntry.path]);
    await page.waitForSelector("[data-testid=\"video-progress\"]", { timeout: 15000 });
    await page.waitForFunction(() => {
      const el = document.querySelector("[data-testid=\"video-progress\"]");
      const text = el?.textContent?.toLowerCase() ?? "";
      return text.includes("complete");
    }, null, { timeout: 20000 });
    const blob = await waitForBlob(page, 1, 20000);
    if (!blob?.size) {
      throw new Error("Compression did not produce output blob.");
    }
    const compressionDelta = blob?.size - inputSize;
    if (compressionDelta > 0) {
      return {
        detail: `compressed ${inputSize} -> ${blob?.size ?? "?"} (larger by ${compressionDelta} bytes)`,
        metrics: { inputBytes: inputSize, outputBytes: blob?.size ?? null },
        warning: "compressed file larger than input",
      };
    }
    return {
      detail: `compressed ${inputSize} -> ${blob?.size ?? "?"}`,
      metrics: { inputBytes: inputSize, outputBytes: blob?.size ?? null },
    };
  }

  if (tool.id === "batch-compress-png") {
    await hookBlobCapture(page);
    const batchFixtures = toolFixtures["batch-compress-png"]?.fixtures ?? [];
    const batchPaths = batchFixtures.map(resolveFixturePath).filter(Boolean);
    if (batchPaths.length < 2) {
      return { skipped: true, reason: "missing batch fixtures" };
    }
    await dropFilesOnDropzone(page, "[data-testid=\"batch-compress-dropzone\"]", batchPaths);
    await page.waitForFunction(() => {
      return document.body.textContent?.includes("Compressing file");
    }, null, { timeout: 15000 });
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
    const jsonFixture = toolFixtures["json-to-csv"]?.fixture;
    const jsonPath = resolveFixturePath(jsonFixture);
    const jsonText = jsonPath ? await fs.readFile(jsonPath, "utf8") : null;
    if (!jsonText) {
      return { skipped: true, reason: "missing json fixture" };
    }
    await hookBlobCapture(page);
    await page.fill("[data-testid=\"json-input\"]", jsonText);
    await page.click("[data-testid=\"json-convert\"]");
    await page.waitForFunction(() => {
      const el = document.querySelector("[data-testid=\"csv-output\"]");
      return el && el.value && el.value.length > 0;
    }, null, { timeout: 10000 });
    const output = await page.evaluate(() => {
      const el = document.querySelector("[data-testid=\"csv-output\"]");
      return el?.value ?? "";
    });
    const header = output.split("\n")[0]?.split(",").map((value) => value.trim()) ?? [];
    if (!header.includes("name") || !header.includes("count")) {
      throw new Error("JSON to CSV output missing expected headers.");
    }
    const downloadButton = await page.$("button:has-text(\"Download CSV\")");
    if (downloadButton) {
      const beforeCount = await page.evaluate(() => window.__blobEvents?.length ?? 0);
      await downloadButton.click();
      await page.waitForFunction(
        (count) => Array.isArray(window.__blobEvents) && window.__blobEvents.length > count,
        beforeCount,
        { timeout: 10000 }
      );
    }
    const blob = await page.evaluate(() => window.__blobEvents?.[window.__blobEvents.length - 1]);
    return {
      detail: `output ${output.split("\n").length} lines`,
      metrics: { outputBytes: blob?.size ?? null, outputType: blob?.type ?? null },
    };
  }

  if (tool.id === "csv-combiner") {
    const csvFixtures = toolFixtures["csv-combiner"]?.fixtures ?? [];
    const csvPaths = csvFixtures.map(resolveFixturePath).filter(Boolean);
    if (csvPaths.length < 2) {
      return { skipped: true, reason: "missing csv fixtures" };
    }
    await hookBlobCapture(page);
    await dropFilesOnDropzone(page, "[data-testid=\"csv-combiner-dropzone\"]", csvPaths);
    await page.waitForFunction(
      (names) => names.every((name) => document.body.textContent?.includes(name)),
      csvPaths.map((csvPath) => path.basename(csvPath)),
      { timeout: 10000 }
    );
    await page.click("[data-testid=\"csv-combiner-run\"]");
    await page.waitForFunction(() => {
      const el = document.querySelector("[data-testid=\"csv-combiner-output\"]");
      return el && el.value && el.value.length > 0;
    }, null, { timeout: 10000 });
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
    const downloadButton = await page.$("button:has-text(\"Download Combined CSV\")");
    if (downloadButton) {
      const beforeCount = await page.evaluate(() => window.__blobEvents?.length ?? 0);
      await downloadButton.click();
      await page.waitForFunction(
        (count) => Array.isArray(window.__blobEvents) && window.__blobEvents.length > count,
        beforeCount,
        { timeout: 10000 }
      );
    }
    const blob = await page.evaluate(() => window.__blobEvents?.[window.__blobEvents.length - 1]);
    return {
      detail: `output ${output.split("\n").length} lines`,
      metrics: { outputBytes: blob?.size ?? null, outputType: blob?.type ?? null },
    };
  }

  if (tool.id === "character-counter") {
    const sampleText = toolFixtures["character-counter"]?.fixtureText ?? "Hello world.\n\nSecond line!";
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

  if (tool.from) {
    const fixture = getFormatFixture(tool.from);
    if (!fixture) {
      return { skipped: true, reason: `missing fixture for ${tool.from}` };
    }
    await hookBlobCapture(page);
    await dropFilesOnDropzone(page, "[data-testid=\"tool-dropzone\"]", [fixture.path]);
    await page.waitForSelector("[data-testid=\"video-progress\"]", { timeout: 15000 });
    const initialProgress = await page.textContent("[data-testid=\"video-progress\"]");
    if (!initialProgress?.toLowerCase().includes("complete")) {
      await page.waitForFunction(() => {
        const el = document.querySelector("[data-testid=\"video-progress\"]");
        const text = el?.textContent?.toLowerCase() ?? "";
        return text.includes("complete");
      }, null, { timeout: tool.requiresFFmpeg ? 60000 : 20000 });
    }
    const blob = await waitForBlob(page, 1, tool.requiresFFmpeg ? 60000 : 20000);
    if (!blob?.size) {
      throw new Error("Conversion did not produce output blob.");
    }
    const expectedType = getExpectedMimeType(tool.to);
    if (blob?.type && expectedType !== "application/octet-stream" && blob.type !== expectedType) {
      return {
        detail: `output ${blob?.size ?? "?"} (type ${blob?.type ?? "?"})`,
        metrics: { outputBytes: blob?.size ?? null, outputType: blob?.type ?? null },
        warning: `unexpected output type ${blob?.type ?? "?"} (expected ${expectedType})`,
      };
    }
    return {
      detail: `output ${blob?.size ?? "?"}`,
      metrics: { outputBytes: blob?.size ?? null, outputType: blob?.type ?? null },
    };
  }

  return { skipped: true, reason: "no fixture mapping" };
}

for (const tool of tools) {
  const result = {
    id: tool.id,
    route: tool.route,
    status: "pass",
    loadMs: null,
    detail: null,
    metrics: null,
    fixture: null,
    errors: [],
  };

  const page = await browser.newPage();

  const fixtureEntry = tool.from ? formatFixtures.get(tool.from) : null;
  result.fixture = fixtureEntry
    ? { format: tool.from, status: fixtureEntry.status, fixture: fixtureEntry.fixture ?? null }
    : null;

  try {
    const response = await page.goto(`${baseUrl}${tool.route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response?.status() ?? "no-response"}`);
    }

    await page.waitForSelector("h1", { timeout: 10000 });
    await waitForHydration(page);
    await page.waitForTimeout(250);

    const navTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return nav?.domContentLoadedEventEnd || null;
    });
    result.loadMs = navTiming ? Math.round(navTiming) : null;

    const functional = await runFunctionalTest(page, tool);
    if (functional?.skipped) {
      result.status = "warn";
      result.errors.push(functional.reason);
    } else {
      result.detail = functional?.detail ?? null;
      result.metrics = functional?.metrics ?? null;
      if (functional?.warning) {
        if (result.status === "pass") {
          result.status = "warn";
        }
        result.errors.push(functional.warning);
      }
    }

    if (["convert", "compress", "bulk", "combine"].includes(tool.operation) && !textOnlyTools.has(tool.id)) {
      const dropzone = await page.$(
        "[data-testid=\"tool-dropzone\"], [data-testid=\"batch-compress-dropzone\"], [data-testid=\"csv-combiner-dropzone\"]"
      );
      if (!dropzone) {
        result.status = "warn";
        result.errors.push("missing dropzone");
      }
    }
  } catch (err) {
    const message = err?.message || String(err);
    if (tool.requiresFFmpeg && /video conversion not supported|sharedarraybuffer/i.test(message)) {
      result.status = "warn";
      result.errors.push(message);
    } else {
      result.status = "fail";
      result.errors.push(message);
    }
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
    if (item.fixture?.status === "missing") {
      acc.missingFixtures = (acc.missingFixtures || 0) + 1;
    }
    return acc;
  },
  { pass: 0, warn: 0, fail: 0, missingFixtures: 0 }
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
