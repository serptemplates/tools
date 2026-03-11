import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tools = JSON.parse(
  readFileSync(
    new URL("../../../packages/app-core/src/data/tools.json", import.meta.url),
    "utf8",
  ),
);
const plannerSource = readFileSync(
  new URL("../../../docs/planner/tools_planner.csv", import.meta.url),
  "utf8",
);

const requestedDownloaders = [
  { keyword: "Skool", id: "download-skool-videos" },
  { keyword: "Vimeo", id: "download-vimeo-videos" },
  { keyword: "Onlyfans", id: "download-onlyfans-videos" },
  { keyword: "Whop", id: "download-whop-videos" },
  { keyword: "123movies", id: "download-123movies-videos" },
  { keyword: "Circle", id: "download-circle-videos" },
  { keyword: "Clientclub", id: "download-clientclub-videos" },
  { keyword: "Dailymotion", id: "download-dailymotion-videos" },
  { keyword: "Gohighlevel", id: "download-gohighlevel-videos" },
  { keyword: "Gokollab", id: "download-gokollab-videos" },
  { keyword: "Alpha Porno", id: "download-alpha-porno-videos" },
  { keyword: "Ashemaletube", id: "download-ashemaletube-videos" },
  { keyword: "Beeg", id: "download-beeg-videos" },
  { keyword: "Boyfriendtv", id: "download-boyfriendtv-videos" },
  { keyword: "Coomer", id: "download-coomer-videos" },
  { keyword: "Eporner", id: "download-eporner-videos" },
  { keyword: "Erome", id: "download-erome-videos" },
  { keyword: "Kajab", id: "download-kajab-videos" },
  { keyword: "Erothots", id: "download-erothots-videos" },
  { keyword: "Hdzog", id: "download-hdzog-videos" },
  { keyword: "Hentaihaven", id: "download-hentaihaven-videos" },
  { keyword: "Justforfans", id: "download-justforfans-videos" },
  { keyword: "Luxuretv", id: "download-luxuretv-videos" },
  { keyword: "Manyvids", id: "download-manyvids-videos" },
  { keyword: "Motherless", id: "download-motherless-videos" },
  { keyword: "Nhentai", id: "download-nhentai-videos" },
  { keyword: "Pornhub", id: "download-pornhub-videos" },
  { keyword: "M3u8", id: "download-m3u8-videos" },
  { keyword: "Porntrex", id: "download-porntrex-videos" },
  { keyword: "Redgifs", id: "download-redgifs-videos" },
  { keyword: "Redtube", id: "download-redtube-videos" },
  { keyword: "SpankBang", id: "download-spankbang-videos" },
  { keyword: "Stripcha", id: "download-stripcha-videos" },
  { keyword: "Thisvid", id: "download-thisvid-videos" },
  { keyword: "TNAFlix", id: "download-tnaflix-videos" },
  { keyword: "Tokyomotion", id: "download-tokyomotion-videos" },
  { keyword: "Txxx", id: "download-txxx-videos" },
  { keyword: "Upornia", id: "download-upornia-videos" },
  { keyword: "Xfantazy", id: "download-xfantazy-videos" },
  { keyword: "Xhamster", id: "download-xhamster-videos" },
  { keyword: "Xnxx", id: "download-xnxx-videos" },
  { keyword: "Xvideos", id: "download-xvideos-videos" },
  { keyword: "Yespornplease", id: "download-yespornplease-videos" },
  { keyword: "Youjizz", id: "download-youjizz-videos" },
  { keyword: "Youporn", id: "download-youporn-videos" },
  { keyword: "Sprout", id: "download-sprout-videos" },
  { keyword: "Tiktok", id: "download-tiktok-videos" },
  { keyword: "Wistia", id: "download-wistia-videos" },
  { keyword: "Youtube", id: "download-youtube-videos" },
];

test("requested downloader keyword landers exist in the registry and planner", () => {
  for (const entry of requestedDownloaders) {
    const tool = tools.find((candidate) => candidate.id === entry.id);

    assert.ok(tool, `expected ${entry.id} to exist in tools.json`);
    assert.equal(tool.operation, "download", `expected ${entry.id} to be a download tool`);
    assert.equal(tool.isActive, true, `expected ${entry.id} to be active`);
    assert.equal(tool.route, `/${entry.id}`, `expected ${entry.id} route to match slug`);
    assert.match(tool.name, /Video Downloader$/, `expected ${entry.id} to use downloader naming`);
    assert.match(
      plannerSource,
      new RegExp(`^${entry.keyword.toLowerCase()} video downloader,download,${entry.id},`, "mi"),
      `expected planner row for ${entry.id}`,
    );
  }
});
