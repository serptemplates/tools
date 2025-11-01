#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, "../packages/app-core/src/data/extensions.json");

const CHROME_HOSTS = new Set(["chromewebstore.google.com", "chrome.google.com"]);

function decodeEscapedUrl(value) {
  return value
    .replace(/\\u002F/g, "/")
    .replace(/\\u003d/gi, "=")
    .replace(/\\\//g, "/")
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&");
}

function extractIcon(html) {
  const srcsetMatch = html.match(/srcset=["'](https:\/\/lh3\.googleusercontent\.com\/[^"'\s]*=s120[^"'\s]*)/i);
  if (srcsetMatch) {
    return decodeEscapedUrl(srcsetMatch[1]);
  }

  const directMatch = html.match(/https:\/\/lh3\.googleusercontent\.com\/[^"']*s120[^"']*/i);
  if (directMatch) {
    return decodeEscapedUrl(directMatch[0]);
  }

  return undefined;
}

function extractScreenshots(html) {
  const results = new Set();
  const scriptRegex = /_setImgSrc\('[^']+','([^']+)'\)/g;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const decoded = decodeEscapedUrl(scriptMatch[1]);
    if (decoded.includes("lh3.googleusercontent.com")) {
      results.add(decoded);
    }
  }

  if (results.size === 0) {
    const dataAttrRegex = /data-media-url=["'](https:\/\/lh3\.googleusercontent\.com[^"']+)["']/g;
    let attrMatch;
    while ((attrMatch = dataAttrRegex.exec(html)) !== null) {
      const decoded = decodeEscapedUrl(attrMatch[1]);
      if (decoded.includes("lh3.googleusercontent.com")) {
        results.add(decoded);
      }
    }
  }

  return Array.from(results)
    .filter((url) => Boolean(url) && /(?:s|w)1280/.test(url))
    .slice(0, 5);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SerpTemplates/1.0 (+https://serptemplates.com)"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function shouldUpdateExtension(extension) {
  if (!extension.chromeStoreUrl) return false;
  try {
    const host = new URL(extension.chromeStoreUrl).hostname;
    return CHROME_HOSTS.has(host);
  } catch {
    return false;
  }
}

async function updateExtensions() {
  const original = await readFile(DATA_PATH, "utf8");
  const extensions = JSON.parse(original);

  let updated = false;
  for (const extension of extensions) {
    if (!shouldUpdateExtension(extension)) continue;

    try {
      const html = await fetchHtml(extension.chromeStoreUrl);
      const icon = extractIcon(html);
      const screenshots = extractScreenshots(html);

      if (icon && extension.icon !== icon) {
        extension.icon = icon;
        updated = true;
      }

      if (screenshots.length > 0) {
        if (JSON.stringify(extension.screenshots ?? []) !== JSON.stringify(screenshots)) {
          extension.screenshots = screenshots;
          updated = true;
        }
      }
    } catch (error) {
      console.error(`Failed to update ${extension.slug}:`, error.message);
    }
  }

  if (updated) {
    await writeFile(DATA_PATH, `${JSON.stringify(extensions, null, 2)}\n`, "utf8");
    console.log("✅ Updated extensions.json with Chrome Web Store assets.");
  } else {
    console.log("ℹ️ No changes needed.");
  }
}

updateExtensions().catch((error) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});
