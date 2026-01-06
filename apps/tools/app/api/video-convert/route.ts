import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

export const runtime = "nodejs";

const AUDIO_OUTPUTS = new Set([
  "mp3",
  "wav",
  "ogg",
  "aac",
  "m4a",
  "opus",
  "flac",
  "wma",
  "aiff",
  "mp2",
]);

const FAST_FILTER = "fps=12,scale=320:-2:flags=fast_bilinear";

function resolveOutputExtension(to: string) {
  if (to === "hevc") return "mp4";
  if (to === "divx" || to === "mjpeg") return "avi";
  if (to === "mpeg2") return "mpg";
  return to;
}

function buildFfmpegArgs(from: string, to: string, inputPath: string, outputPath: string) {
  const args = ["-y", "-i", inputPath];

  if (AUDIO_OUTPUTS.has(to)) {
    if (to === "mp3") {
      args.push("-vn", "-c:a", "libmp3lame", "-b:a", "192k");
    } else if (to === "wav") {
      args.push("-vn", "-c:a", "pcm_s16le");
    } else if (to === "ogg") {
      args.push("-vn", "-c:a", "libvorbis", "-b:a", "96k");
    } else if (to === "aac") {
      args.push("-vn", "-c:a", "aac", "-b:a", "192k");
    } else if (to === "m4a") {
      args.push("-vn", "-c:a", "aac", "-b:a", "192k");
    } else if (to === "opus") {
      args.push("-vn", "-c:a", "libopus", "-b:a", "96k");
    } else if (to === "flac") {
      args.push("-vn", "-c:a", "flac");
    } else if (to === "wma") {
      args.push("-vn", "-c:a", "wmav2", "-b:a", "96k");
    } else if (to === "aiff") {
      args.push("-vn", "-c:a", "pcm_s16be");
    } else if (to === "mp2") {
      args.push("-vn", "-c:a", "mp2", "-b:a", "192k");
    }

    args.push(outputPath);
    return args;
  }

  switch (to) {
    case "webm":
      args.push(
        "-c:v",
        "libvpx",
        "-crf",
        "34",
        "-b:v",
        "0",
        "-deadline",
        "realtime",
        "-cpu-used",
        "8",
        "-c:a",
        "libvorbis",
        "-b:a",
        "64k",
        "-vf",
        FAST_FILTER
      );
      break;
    case "avi":
      args.push("-c:v", "mpeg4", "-vtag", "xvid", "-q:v", "6", "-c:a", "libmp3lame", "-b:a", "96k");
      args.push("-vf", FAST_FILTER);
      break;
    case "flv":
      args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-tune", "zerolatency");
      args.push("-c:a", "aac", "-b:a", "96k", "-vf", FAST_FILTER, "-f", "flv");
      break;
    case "f4v":
      args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "28", "-tune", "zerolatency");
      args.push("-c:a", "aac", "-b:a", "96k", "-vf", FAST_FILTER, "-f", "f4v");
      break;
    case "mpeg":
    case "mpg":
      args.push("-c:v", "mpeg2video", "-q:v", "6", "-c:a", "mp2", "-b:a", "96k", "-vf", FAST_FILTER);
      break;
    case "mpeg2":
      args.push("-c:v", "mpeg2video", "-q:v", "6", "-c:a", "mp2", "-b:a", "96k", "-vf", FAST_FILTER);
      break;
    case "vob":
      args.push("-c:v", "mpeg2video", "-q:v", "6", "-c:a", "mp2", "-b:a", "96k", "-vf", FAST_FILTER, "-f", "dvd");
      break;
    case "3gp":
      args.push("-c:v", "h263", "-s", "352x288", "-r", "12", "-b:v", "200k");
      args.push("-c:a", "aac", "-b:a", "24k", "-ar", "8000", "-ac", "1");
      break;
    case "hevc":
      args.push("-c:v", "libx265", "-preset", "ultrafast", "-crf", "32");
      args.push("-c:a", "aac", "-b:a", "96k", "-tag:v", "hvc1", "-vf", FAST_FILTER);
      break;
    case "divx":
      args.push("-c:v", "mpeg4", "-vtag", "DIVX", "-q:v", "6", "-c:a", "libmp3lame", "-b:a", "96k");
      args.push("-vf", FAST_FILTER);
      break;
    case "mjpeg":
      args.push("-c:v", "mjpeg", "-q:v", "8", "-r", "12", "-c:a", "pcm_s16le", "-vf", FAST_FILTER);
      break;
    case "asf":
      args.push("-c:v", "wmv2", "-b:v", "500k", "-c:a", "wmav2", "-b:a", "96k", "-vf", FAST_FILTER);
      break;
    case "gif":
      args.push(
        "-filter_complex",
        "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
        "-loop",
        "0"
      );
      break;
    case "ts":
    case "mts":
    case "m2ts":
      args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "30", "-tune", "zerolatency");
      args.push("-c:a", "aac", "-b:a", "96k", "-vf", FAST_FILTER, "-f", "mpegts");
      break;
    case "m4v":
      args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "30", "-tune", "zerolatency");
      args.push("-c:a", "aac", "-b:a", "96k", "-vf", FAST_FILTER, "-movflags", "+faststart");
      break;
    case "mov":
      args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "30", "-tune", "zerolatency");
      args.push("-c:a", "aac", "-b:a", "96k", "-vf", FAST_FILTER, "-movflags", "+faststart");
      break;
    case "mp4":
    case "mkv":
    default:
      args.push("-c:v", "libx264", "-preset", "ultrafast", "-crf", "30", "-tune", "zerolatency");
      args.push("-c:a", "aac", "-b:a", "96k", "-vf", FAST_FILTER);
      if (to === "mp4") {
        args.push("-movflags", "+faststart");
      }
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

export async function POST(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from")?.toLowerCase();
  const to = url.searchParams.get("to")?.toLowerCase();

  if (!from || !to) {
    return new Response(JSON.stringify({ error: "Missing from/to parameters" }), { status: 400 });
  }

  const inputBuffer = Buffer.from(await request.arrayBuffer());
  if (!inputBuffer.length) {
    return new Response(JSON.stringify({ error: "Empty input buffer" }), { status: 400 });
  }

  const runId = randomUUID();
  const workDir = await fs.mkdtemp(path.join(tmpdir(), `serp-video-${runId}-`));

  try {
    const inputPath = path.join(workDir, `input.${from}`);
    const outputExt = resolveOutputExtension(to);
    const outputPath = path.join(workDir, `output.${outputExt}`);
    await fs.writeFile(inputPath, inputBuffer);

    const args = buildFfmpegArgs(from, to, inputPath, outputPath);
    await runFfmpeg(args);

    const outputBuffer = await fs.readFile(outputPath);
    return new Response(outputBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": outputBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "FFmpeg failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
