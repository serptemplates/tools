import test from "node:test";
import assert from "node:assert/strict";

import {
  mapQualityToAudioBitrate,
  mapQualityToPngLevel,
  mapQualityToVideoCrf,
  resolveCompressionTarget,
} from "./compression-utils.ts";

test("resolveCompressionTarget maps common formats", () => {
  assert.equal(resolveCompressionTarget("png"), "image-worker");
  assert.equal(resolveCompressionTarget("jpg"), "image-worker");
  assert.equal(resolveCompressionTarget("gif"), "image-server");
  assert.equal(resolveCompressionTarget("svg"), "image-server");
  assert.equal(resolveCompressionTarget("heic"), "image-server");
  assert.equal(resolveCompressionTarget("avif"), "image-server");
  assert.equal(resolveCompressionTarget("mp3"), "audio");
  assert.equal(resolveCompressionTarget("mp4"), "video");
  assert.equal(resolveCompressionTarget("pdf"), "pdf");
  assert.equal(resolveCompressionTarget("unknown"), "unsupported");
});

test("mapQualityToPngLevel stays within oxipng range and scales with quality", () => {
  const highQuality = mapQualityToPngLevel(0.9);
  const lowQuality = mapQualityToPngLevel(0.2);
  assert.ok(highQuality >= 0 && highQuality <= 6);
  assert.ok(lowQuality >= 0 && lowQuality <= 6);
  assert.ok(highQuality < lowQuality);
});

test("mapQualityToAudioBitrate uses expected tiers", () => {
  assert.equal(mapQualityToAudioBitrate(0.92), "192k");
  assert.equal(mapQualityToAudioBitrate(0.72), "160k");
  assert.equal(mapQualityToAudioBitrate(0.56), "128k");
  assert.equal(mapQualityToAudioBitrate(0.41), "96k");
  assert.equal(mapQualityToAudioBitrate(0.2), "64k");
});

test("mapQualityToVideoCrf lowers CRF for higher quality", () => {
  const highQuality = mapQualityToVideoCrf(0.9);
  const lowQuality = mapQualityToVideoCrf(0.2);
  assert.ok(highQuality < lowQuality);
  assert.ok(highQuality >= 18 && highQuality <= 34);
  assert.ok(lowQuality >= 18 && lowQuality <= 34);
});
