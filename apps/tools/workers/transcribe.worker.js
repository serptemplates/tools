const MODEL_ID = "Xenova/whisper-tiny";
const TRANSFORMERS_URL =
  "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js";
const TRANSFORMERS_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/";

let transcriberPromise = null;
let transformersPromise = null;
let envConfigured = false;

function emitProgress(progress, message, status = "processing") {
  self.postMessage({
    type: "progress",
    status,
    progress,
    message,
  });
}

async function loadTransformers() {
  if (!transformersPromise) {
    transformersPromise = import(TRANSFORMERS_URL);
  }
  const module = await transformersPromise;
  if (!envConfigured) {
    module.env.allowLocalModels = false;
    module.env.backends.onnx.wasm.wasmPaths = TRANSFORMERS_WASM_BASE;
    envConfigured = true;
  }
  return module;
}

async function getTranscriber(progressCallback) {
  if (!transcriberPromise) {
    const { pipeline } = await loadTransformers();
    transcriberPromise = pipeline("automatic-speech-recognition", MODEL_ID, {
      progress_callback: progressCallback,
    });
  }
  return transcriberPromise;
}

self.onmessage = async (event) => {
  const payload = event.data || {};
  const audioBuffer = payload.audioBuffer;

  if (!audioBuffer) {
    self.postMessage({ type: "error", error: "Missing audio buffer or format." });
    return;
  }

  try {
    if (!audioBuffer.byteLength) {
      throw new Error("Audio buffer is empty.");
    }

    emitProgress(55, "Loading model...", "loading");
    const transcriber = await getTranscriber((data) => {
      if (data?.status === "progress" && typeof data.progress === "number") {
        const scaled = 55 + Math.round((data.progress / 100) * 15);
        emitProgress(Math.min(70, scaled), "Loading model...", "loading");
      }
      if (data?.status === "ready") {
        emitProgress(70, "Transcribing...");
      }
    });

    const audio = new Float32Array(audioBuffer);
    emitProgress(75, "Transcribing...");

    const output = await transcriber(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    emitProgress(100, "Transcription complete!", "completed");
    self.postMessage({ type: "result", text: output?.text ?? "" });
  } catch (err) {
    self.postMessage({ type: "error", error: err?.message || String(err) });
  }
};
