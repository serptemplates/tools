import { decodeToRGBA } from "../lib/convert/decode";
import { encodeFromRGBA } from "../lib/convert/encode";

self.onmessage = async (e) => {
  try {
    const job = e.data;

    if (job.op === "raster") {
      const rgba = await decodeToRGBA(job.from, job.buf);
      const blob = await encodeFromRGBA(job.to, rgba, job.quality ?? 0.85);
      const arr = await blob.arrayBuffer();
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

        self.postMessage({ type: "progress", status: "loading", progress: 0 });

        let fakeProgress = 10;
        self.postMessage({
          type: "progress",
          status: "processing",
          progress: fakeProgress,
        });

        const progressInterval = setInterval(() => {
          fakeProgress = Math.min(fakeProgress + 10, 90);
          self.postMessage({
            type: "progress",
            status: "processing",
            progress: fakeProgress,
          });
        }, 1000);

        const outputBuffer = await convertVideo(job.buf, job.from, job.to, {
          quality: job.quality,
          onProgress: (event) => {
            const percent = Math.round((event.ratio || 0) * 100);
            if (percent > fakeProgress) {
              clearInterval(progressInterval);
              self.postMessage({
                type: "progress",
                status: "processing",
                progress: percent,
                time: event.time,
              });
            }
          },
        });

        clearInterval(progressInterval);
        self.postMessage({ type: "progress", status: "processing", progress: 100 });

        self.postMessage({ ok: true, blob: outputBuffer });
      } catch (videoErr) {
        console.error("Video conversion error:", videoErr);
        self.postMessage({
          ok: false,
          error: `Video conversion failed: ${videoErr?.message || videoErr}`,
        });
      }
      return;
    }

    self.postMessage({ ok: false, error: "Unknown op" });
  } catch (err) {
    self.postMessage({ ok: false, error: err?.message || String(err) });
  }
};
