import { decodeToRGBA } from "../lib/convert/decode";
import { encodeFromRGBA } from "../lib/convert/encode";

self.onmessage = async (e: MessageEvent<any>) => {
  try {
    const job = e.data;

    if (job.op === "raster") {
      const rgba = await decodeToRGBA(job.from, job.buf);
      const blob = await encodeFromRGBA(job.to, rgba, job.quality ?? 0.85);
      const arr = await blob.arrayBuffer();
      // transfer the ArrayBuffer to avoid copying
      self.postMessage({ ok: true, blob: arr }, [arr]);
      return;
    }

    if (job.op === "pdf-pages") {
      const { renderPdfPages } = await import("../lib/convert/pdf");
      const bufs = await renderPdfPages(job.buf, job.page, job.to);
      self.postMessage({ ok: true, blobs: bufs }, bufs);
      return;
    }

    if (job.op === "video") {
      try {
        const { convertVideo } = await import("../lib/convert/video");

        // Send loading status
        self.postMessage({ type: 'progress', status: 'loading', progress: 0 });

        // Start a fake progress timer since FFmpeg progress isn't working reliably
        let fakeProgress = 10; // Start at 10%
        self.postMessage({
          type: 'progress',
          status: 'processing',
          progress: fakeProgress
        });

        const progressInterval = setInterval(() => {
          fakeProgress = Math.min(fakeProgress + 10, 90); // Go up to 90%
          console.log('[Worker] Sending progress:', fakeProgress);
          self.postMessage({
            type: 'progress',
            status: 'processing',
            progress: fakeProgress
          });
        }, 1000); // Update every second

        const outputBuffer = await convertVideo(job.buf, job.from, job.to, {
          quality: job.quality,
          onProgress: (event) => {
            // If we get real progress, use it
            const percent = Math.round((event.ratio || 0) * 100);
            if (percent > fakeProgress) {
              clearInterval(progressInterval);
              self.postMessage({
                type: 'progress',
                status: 'processing',
                progress: percent,
                time: event.time
              });
            }
          }
        });

        // Clear the interval and send 100%
        clearInterval(progressInterval);
        self.postMessage({ type: 'progress', status: 'processing', progress: 100 });

        // Don't transfer the buffer, just send it normally
        self.postMessage({ ok: true, blob: outputBuffer });
      } catch (videoErr) {
        console.error('Video conversion error:', videoErr);
        self.postMessage({ ok: false, error: `Video conversion failed: ${videoErr?.message || videoErr}` });
      }
      return;
    }

    self.postMessage({ ok: false, error: "Unknown op" });
  } catch (err) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
