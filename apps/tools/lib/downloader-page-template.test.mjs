import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const templateSource = readFileSync(
  new URL("../components/DownloaderPageTemplate.tsx", import.meta.url),
  "utf8",
);
const downloaderCtaSource = readFileSync(
  new URL("../components/DownloaderExtensionCTA.tsx", import.meta.url),
  "utf8",
);
const downloaderCtaModalSource = readFileSync(
  new URL("../components/DownloaderExtensionCTAModal.tsx", import.meta.url),
  "utf8",
);
const downloaderCtaConfigSource = readFileSync(
  new URL("../lib/downloader-extension-cta.ts", import.meta.url),
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
const videoDownloaderPageSource = readFileSync(
  new URL("../app/video-downloader/page.tsx", import.meta.url),
  "utf8",
);
const loomDownloaderPageSource = readFileSync(
  new URL("../app/download-loom-videos/page.tsx", import.meta.url),
  "utf8",
);

test("downloader page template includes the ad banner section", () => {
  assert.match(templateSource, /DownloaderPageHero/);
  assert.match(downloaderHeroSource, /ToolAdInline/);
  assert.match(downloaderHeroSource, /Advertisement/);
  assert.match(downloaderHeroSource, /banner-inline/);
});

test("downloader page template includes the shared browser extension CTA", () => {
  assert.match(templateSource, /DownloaderExtensionCTA/);
  assert.match(downloaderCtaSource, /DOWNLOADER_EXTENSION_TEXT/);
  assert.match(downloaderCtaSource, /DOWNLOADER_EXTENSION_LABEL/);
  assert.match(downloaderCtaSource, /DOWNLOADER_EXTENSION_URL/);
  assert.match(downloaderCtaModalSource, /DOWNLOADER_EXTENSION_TEXT/);
  assert.match(downloaderCtaModalSource, /DOWNLOADER_EXTENSION_LABEL/);
  assert.match(downloaderCtaModalSource, /DOWNLOADER_EXTENSION_URL/);
  assert.match(
    downloaderCtaConfigSource,
    /Get the browser extension for unlimited downloads\./,
  );
  assert.match(
    downloaderCtaConfigSource,
    /Get It Now/,
  );
  assert.match(downloaderCtaSource, /lg:justify-between/);
  assert.match(downloaderCtaSource, /lg:text-left/);
  assert.match(downloaderCtaSource, /w-full sm:w-auto/);
  assert.match(downloaderCtaSource, /bg-\[#0f62fe\]/);
  assert.match(downloaderCtaConfigSource, /https:\/\/serp\.ly\/serp-video-tools/);
  assert.doesNotMatch(
    downloaderCtaSource,
    /Save time with the browser extension and launch the downloader workflow from anywhere\./,
  );
  assert.doesNotMatch(
    downloaderCtaSource,
    /Get the Downloader Browser Extension/,
  );
});

test("dedicated downloader routes use the shared downloader page template", () => {
  assert.match(videoDownloaderPageSource, /DownloaderPageTemplate/);
  assert.match(loomDownloaderPageSource, /DownloaderPageTemplate/);
});

test("shared downloader hero does not render the old public-links helper copy", () => {
  assert.doesNotMatch(
    videoDownloaderToolSource,
    /Public links only\. Private or logged-in content is not supported yet\./,
  );
});
