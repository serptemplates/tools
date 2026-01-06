// Load FFmpeg.wasm for video conversion
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { detectCapabilities } from '../capabilities';

let ffmpeg: FFmpeg | null = null;
let loaded = false;
const FAST_VIDEO_FILTER = "fps=12,scale=320:-2:flags=fast_bilinear";
const FAST_GIF_FILTER = "fps=10,scale=320:-1:flags=fast_bilinear";

function canRemux(fromFormat: string, toFormat: string) {
  const from = fromFormat.toLowerCase();
  const to = toFormat.toLowerCase();
  return (
    (from === "mkv" && ["mov", "mp4", "m4v"].includes(to)) ||
    (from === "mp4" && ["mkv", "mov", "m4v", "ts", "mts", "m2ts"].includes(to))
  );
}

export function shouldUseServerConversion(fromFormat: string, toFormat: string) {
  const preferServer = process.env.NEXT_PUBLIC_VIDEO_CONVERSION_PREFER_SERVER === "true";
  if (preferServer) {
    return true;
  }
  const serverOnly = new Set(["mxf", "rm", "rmvb"]);
  if (serverOnly.has(toFormat.toLowerCase())) {
    return true;
  }
  return !detectCapabilities().supportsVideoConversion;
}

export async function convertVideoViaApi(
  inputBuffer: ArrayBuffer,
  fromFormat: string,
  toFormat: string
): Promise<ArrayBuffer> {
  const response = await fetch(`/api/video-convert?from=${fromFormat}&to=${toFormat}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: inputBuffer,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.error ? `: ${data.error}` : "";
    } catch {
      detail = "";
    }
    throw new Error(`Server conversion failed (${response.status})${detail}`);
  }

  return await response.arrayBuffer();
}

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && loaded) return ffmpeg;

  // Check capabilities before loading FFmpeg
  const capabilities = detectCapabilities();
  if (!capabilities.supportsVideoConversion) {
    throw new Error(`Video conversion not supported: ${capabilities.reason}`);
  }

  if (!ffmpeg) {
    ffmpeg = new FFmpeg();

    const useSingleThread = process.env.NEXT_PUBLIC_FFMPEG_SINGLE_THREAD === "true";
    const baseURL = useSingleThread ? "/vendor/ffmpeg-st" : "/vendor/ffmpeg";

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    const loadConfig: {
      coreURL: string;
      wasmURL: string;
      workerURL?: string;
    } = {
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
    };

    if (!useSingleThread) {
      loadConfig.workerURL = `${baseURL}/ffmpeg-core.worker.js`;
    }

    await ffmpeg.load(loadConfig);

    loaded = true;
  }

  return ffmpeg;
}

export async function convertVideo(
  inputBuffer: ArrayBuffer,
  fromFormat: string,
  toFormat: string,
  options: {
    quality?: number;
    audioOnly?: boolean;
    onProgress?: (progress: { ratio: number; time: number }) => void;
  } = {}
): Promise<ArrayBuffer> {
  const ff = await loadFFmpeg();

  // Remove any existing listeners - ff.off requires a handler function
  // We'll just use removeAllListeners or skip this for now
  // ff.off('progress', handler);

  // Set up progress callback
  const progressHandler = options.onProgress
    ? ({ progress, time }: { progress: number; time: number }) => {
        console.log('[FFmpeg Progress]', progress, time);
        // Progress is 0-1, convert to percentage
        options.onProgress?.({
          ratio: progress || 0,
          time: time || 0,
        });
      }
    : null;

  if (progressHandler) {
    ff.on('progress', progressHandler);
  }

  const inputName = `input.${fromFormat}`;
  let outputName = `output.${toFormat}`;

  // Write input file
  await ff.writeFile(inputName, new Uint8Array(inputBuffer));

  // Build FFmpeg command based on output format
  const baseArgs = ['-y', '-nostdin'];
  let args: string[] = [...baseArgs, '-i', inputName];

  // For container-to-container conversions with compatible codecs, use copy (super fast)
  const canUseCopyCodec = canRemux(fromFormat, toFormat);

  if (canUseCopyCodec) {
    // Just copy streams without re-encoding (FAST)
    args.push('-c', 'copy');
    if (['mp4', 'm4v'].includes(toFormat)) {
      args.push('-movflags', '+faststart');
    }
  }
  // Audio extraction from MP4
  else if ([
    'mp3', 'wav', 'ogg', 'oga', 'aac', 'm4a', 'm4r', 'opus', 'flac', 'wma', 'aiff', 'mp2',
    'alac', 'amr', 'au', 'caf', 'cdda'
  ].includes(toFormat)) {
    if (toFormat === 'mp3') {
      args.push('-acodec', 'libmp3lame', '-b:a', '192k');
    } else if (toFormat === 'wav') {
      args.push('-acodec', 'pcm_s16le');
    } else if (toFormat === 'ogg') {
      args.push('-acodec', 'libvorbis', '-q:a', '5');
    } else if (toFormat === 'oga') {
      args.push('-acodec', 'libvorbis', '-q:a', '5', '-f', 'ogg');
    } else if (toFormat === 'aac') {
      args.push('-acodec', 'aac', '-b:a', '192k');
    } else if (toFormat === 'm4a') {
      args.push('-acodec', 'aac', '-b:a', '192k');
    } else if (toFormat === 'm4r') {
      args.push('-acodec', 'aac', '-b:a', '192k', '-f', 'ipod');
    } else if (toFormat === 'opus') {
      args.push('-acodec', 'libopus', '-b:a', '128k');
    } else if (toFormat === 'flac') {
      args.push('-acodec', 'flac');
    } else if (toFormat === 'wma') {
      args.push('-acodec', 'wmav2', '-b:a', '192k');
    } else if (toFormat === 'aiff') {
      args.push('-acodec', 'pcm_s16be');
    } else if (toFormat === 'mp2') {
      args.push('-acodec', 'mp2', '-b:a', '192k');
    } else if (toFormat === 'alac') {
      args.push('-acodec', 'alac', '-f', 'ipod');
    } else if (toFormat === 'amr') {
      args.push('-acodec', 'libopencore_amrnb', '-ar', '8000', '-ac', '1', '-b:a', '12.2k', '-f', 'amr');
    } else if (toFormat === 'au') {
      args.push('-acodec', 'pcm_s16be', '-ar', '44100', '-ac', '2', '-f', 'au');
    } else if (toFormat === 'caf') {
      args.push('-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', '-f', 'caf');
    } else if (toFormat === 'cdda') {
      args.push('-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', '-f', 's16le');
    }
    args.push('-vn'); // No video for audio extraction
  }
  // Video conversions - optimized for speed
  else if (toFormat === 'mp4') {
    // Use ultrafast preset for speed, higher CRF for smaller file
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '32', '-tune', 'zerolatency');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-movflags', '+faststart');
    args.push('-vf', FAST_VIDEO_FILTER);
  } else if (toFormat === 'mkv') {
    // MKV container - can hold almost any codec
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '32', '-tune', 'zerolatency');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
  } else if (toFormat === 'webm') {
    // Use faster VP8 instead of VP9
    args.push(
      '-c:v',
      'libvpx',
      '-crf',
      '40',
      '-b:v',
      '0',
      '-deadline',
      'realtime',
      '-cpu-used',
      '8',
      '-auto-alt-ref',
      '0',
      '-pix_fmt',
      'yuv420p'
    );
    if (fromFormat === 'gif') {
      args.push('-an');
    } else {
      args.push('-c:a', 'libvorbis', '-b:a', '64k');
    }
    args.push('-vf', FAST_VIDEO_FILTER);
  } else if (toFormat === 'avi') {
    args.push('-c:v', 'mpeg4', '-vtag', 'xvid', '-q:v', '10', '-bf', '0');
    args.push('-c:a', 'libmp3lame', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
  } else if (toFormat === 'mov') {
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '32', '-tune', 'zerolatency');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-movflags', '+faststart');
    args.push('-vf', FAST_VIDEO_FILTER);
  } else if (toFormat === 'flv') {
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '32', '-tune', 'zerolatency');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
    args.push('-f', 'flv');
  } else if (toFormat === 'ts' || toFormat === 'mts' || toFormat === 'm2ts') {
    // MPEG Transport Stream
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30', '-tune', 'zerolatency');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
    args.push('-f', 'mpegts');
  } else if (toFormat === 'm4v') {
    // M4V is basically MP4 with iTunes compatibility
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30', '-tune', 'zerolatency');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-movflags', '+faststart');
    args.push('-vf', FAST_VIDEO_FILTER);
  } else if (toFormat === 'mpeg' || toFormat === 'mpg') {
    // MPEG-1/2 format
    args.push('-c:v', 'mpeg2video', '-q:v', '6');
    args.push('-c:a', 'mp2', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
  } else if (toFormat === 'vob') {
    // DVD Video Object
    args.push('-c:v', 'mpeg2video', '-q:v', '6');
    args.push('-c:a', 'mp2', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
    args.push('-f', 'dvd');
  } else if (toFormat === '3gp') {
    // Mobile phone format
    args.push('-c:v', 'h263', '-s', '320x240', '-b:v', '200k', '-r', '12');
    args.push('-c:a', 'aac', '-b:a', '24k', '-ar', '8000', '-ac', '1');
  } else if (toFormat === 'f4v') {
    // Flash Video (F4V)
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '32', '-tune', 'zerolatency');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
    args.push('-f', 'f4v');
  } else if (toFormat === 'hevc') {
    // HEVC/H.265 codec in MP4 container
    args.push('-c:v', 'libx265', '-preset', 'ultrafast', '-crf', '35');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-tag:v', 'hvc1'); // For better compatibility
    args.push('-vf', FAST_VIDEO_FILTER);
    outputName = outputName.replace('.hevc', '.mp4'); // Use MP4 container
  } else if (toFormat === 'divx') {
    // DivX (MPEG-4 Part 2) in AVI container
    args.push('-c:v', 'mpeg4', '-vtag', 'DIVX', '-q:v', '10');
    args.push('-c:a', 'mp3', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
    outputName = outputName.replace('.divx', '.avi'); // Use AVI container
  } else if (toFormat === 'av1') {
    // AV1 codec in MP4 container
    args.push('-c:v', 'libaom-av1', '-crf', '35', '-b:v', '0', '-cpu-used', '8');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-tag:v', 'av01');
    args.push('-movflags', '+faststart');
    args.push('-vf', FAST_VIDEO_FILTER);
    outputName = outputName.replace('.av1', '.mp4'); // Use MP4 container
  } else if (toFormat === 'avchd') {
    // AVCHD-style transport stream
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '30', '-tune', 'zerolatency');
    args.push('-c:a', 'aac', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
    args.push('-f', 'mpegts');
    outputName = outputName.replace('.avchd', '.m2ts'); // Use M2TS container
  } else if (toFormat === 'mjpeg') {
    // Motion JPEG
    args.push('-c:v', 'mjpeg', '-q:v', '8', '-r', '12');
    args.push('-c:a', 'pcm_s16le');
    args.push('-vf', FAST_VIDEO_FILTER);
    outputName = outputName.replace('.mjpeg', '.avi'); // Use AVI container
  } else if (toFormat === 'mpeg2') {
    // MPEG-2 format
    args.push('-c:v', 'mpeg2video', '-q:v', '6');
    args.push('-c:a', 'mp2', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
    outputName = outputName.replace('.mpeg2', '.mpg'); // Use MPG extension
  } else if (toFormat === 'asf') {
    // Windows Media format
    args.push('-c:v', 'wmv2', '-b:v', '500k');
    args.push('-c:a', 'wmav2', '-b:a', '96k');
    args.push('-vf', FAST_VIDEO_FILTER);
  } else if (toFormat === 'gif') {
    // Generate palette for better quality
    const paletteName = 'palette.png';
    await ff.exec([
      '-i', inputName,
      '-vf', `${FAST_GIF_FILTER},palettegen`,
      paletteName
    ]);

    // Use palette to create GIF
    args = [
      ...baseArgs,
      '-i', inputName,
      '-i', paletteName,
      '-lavfi', `${FAST_GIF_FILTER}[x];[x][1:v]paletteuse`,
      '-loop', '0',
    ];
  }

  args.push(outputName);

  // Log the command for debugging
  console.log('[FFmpeg Command]', args.join(' '));

  let data: Uint8Array | string;

  try {
    try {
      await ff.deleteFile(outputName);
    } catch {
      // Ignore missing output file
    }

    // Execute conversion
    const exitCode = await ff.exec(args);
    if (exitCode !== 0) {
      throw new Error(`FFmpeg failed with exit code ${exitCode}`);
    }

    // Read output file
    data = await ff.readFile(outputName);
  } finally {
    if (progressHandler) {
      ff.off('progress', progressHandler);
    }
  }

  // Ensure we have a Uint8Array
  if (!(data instanceof Uint8Array)) {
    throw new Error('Unexpected output format from FFmpeg');
  }

  console.log(`Output file size: ${data.length} bytes`);

  // Cleanup
  try {
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
    if (toFormat === 'gif') {
      await ff.deleteFile('palette.png');
    }
  } catch (cleanupErr) {
    console.warn('Cleanup error:', cleanupErr);
  }

  // Return the ArrayBuffer (handle both ArrayBuffer and SharedArrayBuffer)
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

  // Ensure we return an ArrayBuffer, not SharedArrayBuffer
  if (buffer instanceof SharedArrayBuffer) {
    const ab = new ArrayBuffer(buffer.byteLength);
    const view = new Uint8Array(ab);
    view.set(new Uint8Array(buffer));
    return ab;
  }

  return buffer;
}

export async function cleanupFFmpeg() {
  if (ffmpeg) {
    ffmpeg.terminate();
    ffmpeg = null;
    loaded = false;
  }
}
