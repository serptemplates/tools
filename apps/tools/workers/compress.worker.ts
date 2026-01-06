import UPNG from "upng-js";

function qualityToColorCount(quality) {
  const clamped = Math.max(0, Math.min(1, quality));
  if (clamped >= 0.99) {
    return 0;
  }
  return Math.max(16, Math.round(clamped * 256));
}

self.onmessage = async (e: MessageEvent<any>) => {
  try {
    const job = e.data;

    if (job.op !== "compress-png") {
      self.postMessage({ ok: false, error: "Unknown operation" });
      return;
    }

    const original = job.buf;
    const colorCount = qualityToColorCount(job.quality ?? 0.85);
    let output = original;

    try {
      const img = UPNG.decode(original);
      const frames = UPNG.toRGBA8(img);
      const frame = frames[0];
      if (!frame) {
        throw new Error("Failed to decode PNG frame.");
      }
      output = UPNG.encode([frame], img.width, img.height, colorCount);
    } catch (err) {
      console.error("PNG optimisation failed, returning original.", err);
      output = original;
    }

    if (output.byteLength >= original.byteLength) {
      output = original;
    }

    self.postMessage({ ok: true, blob: output }, [output]);
  } catch (err) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
