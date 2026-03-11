import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const homepageSource = readFileSync(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);

test("homepage does not render the request-a-tool CTA block", () => {
  assert.doesNotMatch(homepageSource, /Need a specific tool\?/);
  assert.doesNotMatch(
    homepageSource,
    /We&apos;re constantly adding new tools\. Let us know what you need!/,
  );
  assert.doesNotMatch(homepageSource, /Request a Tool/);
});
