/// <reference lib="webworker" />

type CompressJob = { op: "compress-png"; buf: ArrayBuffer; quality?: number };

self.onmessage = async (e: MessageEvent<CompressJob>) => {
  try {
    const job = e.data;

    if (job.op === "compress-png") {
      // Use Canvas API to apply lossy compression by converting to JPEG and back
      // This is a workaround since true PNG compression requires native libraries
      const compressed = await compressPNGViaCanvas(job.buf, job.quality ?? 0.85);

      // Transfer the ArrayBuffer to avoid copying
      self.postMessage({ ok: true, blob: compressed }, [compressed]);
      return;
    }

    self.postMessage({ ok: false, error: "Unknown operation" });
  } catch (err: any) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};

async function compressPNGViaCanvas(buf: ArrayBuffer, quality: number): Promise<ArrayBuffer> {
  // Create a blob from the buffer
  const blob = new Blob([buf], { type: 'image/png' });
  const originalSize = blob.size;

  // Create an image bitmap from the blob
  const imageBitmap = await createImageBitmap(blob);

  // Resize if image is very large
  let targetWidth = imageBitmap.width;
  let targetHeight = imageBitmap.height;
  const maxDimension = 2048; // Max dimension for aggressive compression

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    const scale = Math.min(maxDimension / targetWidth, maxDimension / targetHeight);
    targetWidth = Math.floor(targetWidth * scale);
    targetHeight = Math.floor(targetHeight * scale);
  }

  // Create an offscreen canvas with potentially reduced dimensions
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw the image (will resize if dimensions changed)
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  // Check if image has transparency
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const hasTransparency = checkHasTransparency(imageData);

  // Strategy 1: If no transparency, convert to JPEG for better compression
  if (!hasTransparency) {
    // Much lower JPEG quality for aggressive compression
    const jpegQuality = quality * 0.5; // Half the quality for more compression
    const jpegBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: jpegQuality
    });

    // Convert back to PNG to maintain format consistency
    const jpegBitmap = await createImageBitmap(jpegBlob);
    const newCanvas = new OffscreenCanvas(jpegBitmap.width, jpegBitmap.height);
    const newCtx = newCanvas.getContext('2d');
    if (newCtx) {
      newCtx.drawImage(jpegBitmap, 0, 0);
      const finalBlob = await newCanvas.convertToBlob({ type: 'image/png' });

      // Always use JPEG method for non-transparent images
      return await finalBlob.arrayBuffer();
    }
  }

  // Strategy 2: Try WebP if available (better compression than PNG)
  try {
    // Much lower WebP quality
    const webpQuality = quality * 0.4; // Very aggressive WebP compression
    const webpBlob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: webpQuality
    });

    // Convert back to PNG
    const webpBitmap = await createImageBitmap(webpBlob);
    const webpCanvas = new OffscreenCanvas(webpBitmap.width, webpBitmap.height);
    const webpCtx = webpCanvas.getContext('2d');
    if (webpCtx) {
      webpCtx.drawImage(webpBitmap, 0, 0);
      const finalBlob = await webpCanvas.convertToBlob({ type: 'image/png' });

      // Use if smaller than 95% of original (less strict)
      if (finalBlob.size < originalSize * 0.95) {
        return await finalBlob.arrayBuffer();
      }
    }
  } catch (e) {
    // WebP not supported, continue with other methods
  }

  // Strategy 3: Aggressive color reduction (quantization) for PNG
  const data = imageData.data;
  // Much more aggressive quantization - only 2-4 bits per channel
  const colorBits = Math.max(2, Math.floor(quality * 4)); // 2-4 bits per channel
  const colorLevels = Math.pow(2, colorBits);
  const colorStep = 256 / colorLevels;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i]! / colorStep) * colorStep;     // R
    data[i + 1] = Math.round(data[i + 1]! / colorStep) * colorStep; // G
    data[i + 2] = Math.round(data[i + 2]! / colorStep) * colorStep; // B
    // Keep alpha channel unchanged for transparency
  }

  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);

  // Convert to PNG
  const compressedBlob = await canvas.convertToBlob({
    type: 'image/png'
  });

  return await compressedBlob.arrayBuffer();
}

function checkHasTransparency(imageData: ImageData): boolean {
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    const transparencyByte = data[i];
    if (transparencyByte && transparencyByte < 255) {
      return true;
    }
  }
  return false;
}