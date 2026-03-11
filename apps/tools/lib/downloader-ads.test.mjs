import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const downloaderPageHeroPath = new URL(
  "../components/DownloaderPageHero.tsx",
  import.meta.url,
);
const downloaderPageHeroExists = existsSync(downloaderPageHeroPath);
const downloaderPageHeroSource = downloaderPageHeroExists
  ? readFileSync(downloaderPageHeroPath, "utf8")
  : "";
const toolAdsSource = readFileSync(
  new URL("../components/ToolAds.tsx", import.meta.url),
  "utf8",
);

test("downloader pages keep ads hidden until the user initiates the action", () => {
  assert.equal(
    downloaderPageHeroExists,
    true,
    "expected a shared downloader page hero component to own ad visibility",
  );
  assert.match(downloaderPageHeroSource, /const \[adsVisible, setAdsVisible\] = useState\(false\)/);
  assert.match(downloaderPageHeroSource, /const \[ctaModalOpen, setCtaModalOpen\] = useState\(false\)/);
  assert.match(
    downloaderPageHeroSource,
    /const \[cooldownEndsAtMs, setCooldownEndsAtMs\] = useState<number \| null>\(null\)/,
  );
  assert.match(downloaderPageHeroSource, /<VideoDownloaderTool[\s\S]*adsVisible={adsVisible}/);
  assert.match(
    downloaderPageHeroSource,
    /<VideoDownloaderTool[\s\S]*onAdsVisibleChange={handleAdsVisibleChange}/,
  );
  assert.match(
    downloaderPageHeroSource,
    /if \(visible\) \{\s*setCooldownEndsAtMs\(Date\.now\(\) \+ 60_000\);\s*setCtaModalOpen\(true\);/,
  );
  assert.match(
    downloaderPageHeroSource,
    /<DownloaderExtensionCTAModal[\s\S]*open={ctaModalOpen}[\s\S]*onOpenChange={setCtaModalOpen}[\s\S]*cooldownEndsAtMs={cooldownEndsAtMs}/,
  );
  assert.match(downloaderPageHeroSource, /\{adsVisible && \(/);
});

test("shared tool ad rails still use the documented xl breakpoint", () => {
  assert.match(toolAdsSource, /hidden h-\[600px\] w-full xl:block/);
  assert.match(toolAdsSource, /xl:grid-cols-\[160px_minmax\(0,1fr\)_160px\]/);
  assert.match(toolAdsSource, /className="hidden h-\[600px\] w-full xl:flex"/);
});
