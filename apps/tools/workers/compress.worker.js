import decodeJpeg from "@jsquash/jpeg/decode";
import encodeJpeg from "@jsquash/jpeg/encode";
import { optimise as optimisePng } from "@jsquash/oxipng";
import decodeWebp from "@jsquash/webp/decode";
import encodeWebp from "@jsquash/webp/encode";
import {
  mapQualityToImageQuality,
  mapQualityToPngLevel,
} from "../lib/compression-utils";

function toArrayBuffer(data) {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (data instanceof Uint8Array) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  throw new Error("Unsupported buffer type");
}

async function compressPng(buf, quality) {
  const level = mapQualityToPngLevel(quality);
  const result = await optimisePng(buf, { level });
  return toArrayBuffer(result);
}

async function compressJpeg(buf, quality) {
  const imageData = await decodeJpeg(buf);
  const result = await encodeJpeg(imageData, { quality: mapQualityToImageQuality(quality) });
  return toArrayBuffer(result);
}

async function compressWebp(buf, quality) {
  const imageData = await decodeWebp(buf);
  const result = await encodeWebp(imageData, { quality: mapQualityToImageQuality(quality) });
  return toArrayBuffer(result);
}

const FORMAT_HANDLERS = {
  png: compressPng,
  jpg: compressJpeg,
  jpeg: compressJpeg,
  webp: compressWebp,
};

self.onmessage = async (e) => {
  try {
    const job = e.data;

    if (job.op !== "compress-png" && job.op !== "compress-image") {
      self.postMessage({ ok: false, error: "Unknown operation" });
      return;
    }

    const original = job.buf;
    const format = (job.format || "png").toLowerCase();
    const handler = FORMAT_HANDLERS[format];
    if (!handler) {
      self.postMessage({ ok: false, error: `Unsupported image format: ${format}` });
      return;
    }

    let output = await handler(original, job.quality);
    if (output.byteLength >= original.byteLength) {
      output = original;
    }

    self.postMessage({ ok: true, blob: output }, [output]);
  } catch (err) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
