import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const workersDir = path.join(root, "apps/tools/workers");
if (!(await pathExists(workersDir))) {
  fail("Missing workers directory at apps/tools/workers.");
} else {
  const workerFiles = await fs.readdir(workersDir);
  const tsWorkers = workerFiles.filter((file) => file.endsWith(".worker.ts") || file.endsWith(".worker.tsx"));
  if (tsWorkers.length) {
    fail(`Worker files must be .js only. Found: ${tsWorkers.join(", ")}`);
  }

  const requiredWorkers = ["convert.worker.js", "compress.worker.js"];
  for (const file of requiredWorkers) {
    if (!(await pathExists(path.join(workersDir, file)))) {
      fail(`Missing worker file: apps/tools/workers/${file}`);
    }
  }

  const jsWorkers = workerFiles.filter((file) => file.endsWith(".js"));
  const typePattern = /:\s*(number|string|boolean|ArrayBuffer|MessageEvent|Transferable|Worker|Promise)\b/;
  for (const file of jsWorkers) {
    const content = await fs.readFile(path.join(workersDir, file), "utf8");
    if (typePattern.test(content)) {
      fail(`Worker ${file} contains TypeScript type annotations.`);
    }
  }
}

const componentsDir = path.join(root, "apps/tools/components");
if (await pathExists(componentsDir)) {
  const componentFiles = (await listFiles(componentsDir)).filter((file) => file.endsWith(".tsx"));
  for (const file of componentFiles) {
    const content = await fs.readFile(file, "utf8");
    if (content.includes(".worker.ts")) {
      fail(`Worker URL must use .js extension in ${path.relative(root, file)}.`);
    }
  }
} else {
  warn("Components directory missing; skipping worker URL checks.");
}

const toolsPackagePath = path.join(root, "apps/tools/package.json");
if (await pathExists(toolsPackagePath)) {
  const toolsPackage = JSON.parse(await fs.readFile(toolsPackagePath, "utf8"));
  const devScript = toolsPackage.scripts?.dev ?? "";
  if (!devScript.includes("next dev")) {
    fail("apps/tools/package.json dev script must run next dev.");
  }
  if (devScript.includes("--turbopack")) {
    fail("apps/tools/package.json dev script must not use --turbopack (module workers break).");
  }
} else {
  fail("Missing apps/tools/package.json.");
}

const nextConfigPath = path.join(root, "apps/tools/next.config.mjs");
if (await pathExists(nextConfigPath)) {
  const nextConfig = await fs.readFile(nextConfigPath, "utf8");
  if (!nextConfig.includes("Cross-Origin-Opener-Policy")) {
    fail("next.config.mjs must set Cross-Origin-Opener-Policy header.");
  }
  if (!nextConfig.includes("Cross-Origin-Embedder-Policy")) {
    fail("next.config.mjs must set Cross-Origin-Embedder-Policy header.");
  }
  if (!nextConfig.includes("SUPPORTS_VIDEO_CONVERSION")) {
    fail("next.config.mjs must set SUPPORTS_VIDEO_CONVERSION env.");
  }
  if (!nextConfig.includes("BUILD_MODE")) {
    fail("next.config.mjs must set BUILD_MODE env.");
  }
} else {
  fail("Missing apps/tools/next.config.mjs.");
}

const vendorAssets = [
  "apps/tools/public/vendor/pdfjs/pdf.worker.min.js",
  "apps/tools/public/vendor/libheif/libheif-bundle.js",
  "apps/tools/public/vendor/libheif/libheif.wasm",
];
for (const asset of vendorAssets) {
  if (!(await pathExists(path.join(root, asset)))) {
    fail(`Missing vendor asset: ${asset}`);
  }
}

const pdfConvertPath = path.join(root, "apps/tools/lib/convert/pdf.ts");
if (await pathExists(pdfConvertPath)) {
  const pdfConvert = await fs.readFile(pdfConvertPath, "utf8");
  if (!pdfConvert.includes("pdfjs-dist/legacy/build/pdf")) {
    fail("pdf.ts must import pdfjs-dist/legacy/build/pdf.");
  }
}

const workerClientPath = path.join(root, "apps/tools/lib/convert/workerClient.ts");
if (await pathExists(workerClientPath)) {
  const workerClient = await fs.readFile(workerClientPath, "utf8");
  if (!workerClient.includes("isWorkerError")) {
    fail("workerClient.ts must detect worker errors for fallback.");
  }
  if (!workerClient.includes("convertVideoOnMainThread")) {
    fail("workerClient.ts must include main-thread video fallback.");
  }
}

const requiredTestIds = [
  {
    file: "apps/tools/components/HeroConverter.tsx",
    ids: ["tool-dropzone", "tool-file-input"],
  },
  {
    file: "apps/tools/components/LanderHeroTwoColumn.tsx",
    ids: ["tool-dropzone", "tool-file-input"],
  },
  {
    file: "apps/tools/components/Converter.tsx",
    ids: ["tool-dropzone", "tool-file-input", "tool-progress"],
  },
  {
    file: "apps/tools/components/BatchHeroConverter.tsx",
    ids: ["batch-compress-dropzone", "batch-compress-input", "batch-compress-download", "batch-progress"],
  },
  {
    file: "apps/tools/components/CsvCombiner.tsx",
    ids: ["csv-combiner-dropzone", "csv-combiner-input", "csv-combiner-download"],
  },
  {
    file: "apps/tools/components/JsonToCsv.tsx",
    ids: ["json-input", "json-convert", "json-to-csv-download"],
  },
  {
    file: "apps/tools/components/VideoProgress.tsx",
    ids: ["video-progress"],
  },
];

for (const entry of requiredTestIds) {
  const fullPath = path.join(root, entry.file);
  if (!(await pathExists(fullPath))) {
    fail(`Missing ${entry.file} for test id checks.`);
    continue;
  }
  const content = await fs.readFile(fullPath, "utf8");
  for (const id of entry.ids) {
    if (!content.includes(`data-testid="${id}"`)) {
      fail(`${entry.file} must include data-testid="${id}".`);
    }
  }
}

if (warnings.length) {
  console.warn("Tools SOP warnings:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length) {
  console.error("Tools SOP checks failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Tools SOP checks passed.");
