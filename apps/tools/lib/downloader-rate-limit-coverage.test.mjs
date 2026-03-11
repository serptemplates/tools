import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tools = JSON.parse(
  readFileSync(
    new URL("../../../packages/app-core/src/data/tools.json", import.meta.url),
    "utf8",
  ),
);
const downloaderTemplateSource = readFileSync(
  new URL("../components/DownloaderPageTemplate.tsx", import.meta.url),
  "utf8",
);
const downloaderHeroSource = readFileSync(
  new URL("../components/DownloaderPageHero.tsx", import.meta.url),
  "utf8",
);
const videoDownloaderToolSource = readFileSync(
  new URL("../components/VideoDownloaderTool.tsx", import.meta.url),
  "utf8",
);
const sharedToolRouteSource = readFileSync(
  new URL("../app/(convert)/[tool]/page.tsx", import.meta.url),
  "utf8",
);
const mediaFetchRouteSource = readFileSync(
  new URL("../app/api/media-fetch/route.ts", import.meta.url),
  "utf8",
);

test("all active download tools use the shared rate-limited downloader path", () => {
  const activeDownloadTools = tools.filter(
    (tool) => tool.isActive && tool.operation === "download",
  );
  assert.ok(activeDownloadTools.length > 0, "expected at least one active download tool");

  assert.match(downloaderTemplateSource, /DownloaderPageHero/);
  assert.match(downloaderTemplateSource, /DownloaderExtensionCTA/);
  assert.match(downloaderHeroSource, /VideoDownloaderTool/);
  assert.match(sharedToolRouteSource, /tool\.operation === "download"/);
  assert.match(sharedToolRouteSource, /DownloaderPageRenderer/);
  assert.match(videoDownloaderToolSource, /consumer:\s*DOWNLOADER_CONSUMER|consumer:\s*"downloader"/);
  assert.match(
    videoDownloaderToolSource,
    /createDownloaderRequestHeaders|DOWNLOADER_CLIENT_ID_HEADER|x-serp-downloader-client-id/,
  );
  assert.match(
    mediaFetchRouteSource,
    /payload\.consumer === DOWNLOADER_CONSUMER|consumer === DOWNLOADER_CONSUMER/,
  );
  assert.match(
    mediaFetchRouteSource,
    /createDownloaderCooldownCookieCodec|DOWNLOADER_RATE_LIMIT_COOKIE/,
  );

  for (const tool of activeDownloadTools) {
    assert.match(
      tool.route,
      /^\/(video-downloader|download-[a-z0-9-]+-videos)$/,
      `expected downloader route naming convention for ${tool.id}`,
    );
  }
});
