import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

export const runtime = "nodejs";

const IMAGE_OUTPUTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif"]);
const RAW_INPUTS = new Set(["cr2", "cr3", "dng", "arw"]);

function resolveOutputExtension(to: string) {
  if (to === "jpeg") return "jpg";
  if (to === "tif") return "tiff";
  return to;
}

function buildFfmpegArgs(to: string, inputPath: string, outputPath: string) {
  const args = ["-y", "-i", inputPath, "-frames:v", "1"];

  switch (to) {
    case "jpg":
    case "jpeg":
      args.push("-q:v", "3");
      break;
    case "webp":
      args.push("-q:v", "80");
      break;
    case "png":
      args.push("-compression_level", "6");
      break;
    case "gif":
      args.push("-loop", "0");
      break;
    case "tif":
    case "tiff":
      args.push("-compression_level", "6");
      break;
    default:
      break;
  }

  args.push(outputPath);
  return args;
}

function buildMagickArgs(to: string, inputPath: string, outputPath: string) {
  const output = resolveOutputExtension(to);
  const args = [inputPath];

  switch (output) {
    case "jpg":
      args.push("-quality", "85");
      break;
    case "webp":
      args.push("-quality", "80");
      break;
    case "png":
      args.push("-define", "png:compression-level=6");
      break;
    case "tiff":
      args.push("-define", "tiff:compression=zip");
      break;
    default:
      break;
  }

  args.push(outputPath);
  return args;
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

function runMagick(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("magick", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `magick exited with code ${code}`));
    });
  });
}

async function runExiftoolBinary(args: string[]) {
  return new Promise<Buffer>((resolve, reject) => {
    const proc = spawn("exiftool", args, { stdio: ["ignore", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    let stderr = "";
    proc.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
        return;
      }
      reject(new Error(stderr || `exiftool exited with code ${code}`));
    });
  });
}

async function extractRawPreview(inputPath: string) {
  try {
    const preview = await runExiftoolBinary(["-b", "-PreviewImage", inputPath]);
    if (preview.length) return preview;
  } catch {
    // ignore and try alternate tag
  }
  const fallback = await runExiftoolBinary(["-b", "-JpgFromRaw", inputPath]);
  if (!fallback.length) {
    throw new Error("No preview image available in raw file.");
  }
  return fallback;
}

async function convertRawImage(args: {
  from: string;
  to: string;
  inputPath: string;
  outputPath: string;
  workDir: string;
}) {
  try {
    await runMagick(buildMagickArgs(args.to, args.inputPath, args.outputPath));
    return;
  } catch {
    const preview = await extractRawPreview(args.inputPath);
    const previewPath = path.join(args.workDir, "preview.jpg");
    await fs.writeFile(previewPath, preview);

    const outputFormat = resolveOutputExtension(args.to);
    if (outputFormat === "jpg") {
      await fs.copyFile(previewPath, args.outputPath);
      return;
    }

    await runMagick(buildMagickArgs(args.to, previewPath, args.outputPath));
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from")?.toLowerCase();
  const to = url.searchParams.get("to")?.toLowerCase();

  if (!from || !to) {
    return new Response(JSON.stringify({ error: "Missing from/to parameters" }), { status: 400 });
  }

  if (!IMAGE_OUTPUTS.has(to)) {
    return new Response(JSON.stringify({ error: `Unsupported output format: ${to}` }), { status: 400 });
  }

  const inputBuffer = Buffer.from(await request.arrayBuffer());
  if (!inputBuffer.length) {
    return new Response(JSON.stringify({ error: "Empty input buffer" }), { status: 400 });
  }

  const runId = randomUUID();
  const workDir = await fs.mkdtemp(path.join(tmpdir(), `serp-image-${runId}-`));

  try {
    const inputPath = path.join(workDir, `input.${from}`);
    const outputExt = resolveOutputExtension(to);
    const outputPath = path.join(workDir, `output.${outputExt}`);
    await fs.writeFile(inputPath, inputBuffer);

    if (RAW_INPUTS.has(from)) {
      await convertRawImage({ from, to, inputPath, outputPath, workDir });
    } else {
      const args = buildFfmpegArgs(to, inputPath, outputPath);
      await runFfmpeg(args);
    }

    const outputBuffer = await fs.readFile(outputPath);
    return new Response(outputBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": outputBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "FFmpeg failed" }), {
      status: 500,
    });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
