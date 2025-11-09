// Load FFmpeg.wasm for video conversion
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { detectCapabilities } from '../capabilities';

let ffmpeg: FFmpeg | null = null;
let loaded = false;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && loaded) return ffmpeg;

  // Check capabilities before loading FFmpeg
  const capabilities = detectCapabilities();
  if (!capabilities.supportsVideoConversion) {
    throw new Error(`Video conversion not supported: ${capabilities.reason}`);
  }

  if (!ffmpeg) {
    ffmpeg = new FFmpeg();

    // Load FFmpeg with multi-threading support (requires SharedArrayBuffer)
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';

    ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      workerURL: `${baseURL}/ffmpeg-core.worker.js`,
    });

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
  if (options.onProgress) {
    ff.on('progress', ({ progress, time }: { progress: number; time: number }) => {
      console.log('[FFmpeg Progress]', progress, time);
      // Progress is 0-1, convert to percentage
      options.onProgress?.({
        ratio: progress || 0,
        time: time || 0
      });
    });
  }

  const inputName = `input.${fromFormat}`;
  let outputName = `output.${toFormat}`;

  // Write input file
  await ff.writeFile(inputName, new Uint8Array(inputBuffer));

  // Build FFmpeg command based on output format
  let args: string[] = ['-i', inputName];

  // For container-to-container conversions with compatible codecs, use copy (super fast)
  const canUseCopyCodec =
    (fromFormat === 'mkv' && ['mov', 'mp4', 'm4v'].includes(toFormat)) ||
    (fromFormat === 'mp4' && ['mkv', 'mov', 'm4v', 'ts', 'mts', 'm2ts'].includes(toFormat));

  if (canUseCopyCodec) {
    // Just copy streams without re-encoding (FAST)
    args.push('-c', 'copy');
    if (['mp4', 'm4v'].includes(toFormat)) {
      args.push('-movflags', '+faststart');
    }
  }
  // Audio extraction from MP4
  else if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'flac', 'wma', 'aiff', 'mp2'].includes(toFormat)) {
    if (toFormat === 'mp3') {
      args.push('-acodec', 'libmp3lame', '-b:a', '192k');
    } else if (toFormat === 'wav') {
      args.push('-acodec', 'pcm_s16le');
    } else if (toFormat === 'ogg') {
      args.push('-acodec', 'libvorbis', '-q:a', '5');
    } else if (toFormat === 'aac') {
      args.push('-acodec', 'aac', '-b:a', '192k');
    } else if (toFormat === 'm4a') {
      args.push('-acodec', 'aac', '-b:a', '192k');
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
    }
    args.push('-vn'); // No video for audio extraction
  }
  // Video conversions - optimized for speed
  else if (toFormat === 'mp4') {
    // Use ultrafast preset for speed, higher CRF for smaller file
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-movflags', '+faststart');
    // Limit resolution for faster processing
    args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
  } else if (toFormat === 'mkv') {
    // MKV container - can hold almost any codec
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23');
    args.push('-c:a', 'aac', '-b:a', '192k');
  } else if (toFormat === 'webm') {
    // Use faster VP8 instead of VP9
    args.push('-c:v', 'libvpx', '-crf', '30', '-b:v', '1M');
    args.push('-c:a', 'libvorbis', '-b:a', '128k');
    args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
  } else if (toFormat === 'avi') {
    args.push('-c:v', 'mpeg4', '-vtag', 'xvid', '-qscale:v', '8');
    args.push('-c:a', 'libmp3lame', '-b:a', '128k');
    args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
  } else if (toFormat === 'mov') {
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-movflags', '+faststart');
    args.push('-vf', 'scale=\'min(1280,iw)\':\'min(720,ih)\':force_original_aspect_ratio=decrease');
  } else if (toFormat === 'flv') {
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-f', 'flv');
  } else if (toFormat === 'ts' || toFormat === 'mts' || toFormat === 'm2ts') {
    // MPEG Transport Stream
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23');
    args.push('-c:a', 'aac', '-b:a', '192k');
    args.push('-f', 'mpegts');
  } else if (toFormat === 'm4v') {
    // M4V is basically MP4 with iTunes compatibility
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23');
    args.push('-c:a', 'aac', '-b:a', '192k');
    args.push('-movflags', '+faststart');
  } else if (toFormat === 'mpeg' || toFormat === 'mpg') {
    // MPEG-1/2 format
    args.push('-c:v', 'mpeg2video', '-b:v', '4M');
    args.push('-c:a', 'mp2', '-b:a', '192k');
  } else if (toFormat === 'vob') {
    // DVD Video Object
    args.push('-c:v', 'mpeg2video', '-b:v', '6M');
    args.push('-c:a', 'ac3', '-b:a', '448k');
    args.push('-f', 'dvd');
  } else if (toFormat === '3gp') {
    // Mobile phone format
    args.push('-c:v', 'h263', '-s', '352x288', '-b:v', '384k');
    args.push('-c:a', 'aac', '-b:a', '32k', '-ar', '8000', '-ac', '1');
  } else if (toFormat === 'f4v') {
    // Flash Video (F4V)
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-f', 'f4v');
  } else if (toFormat === 'hevc') {
    // HEVC/H.265 codec in MP4 container
    args.push('-c:v', 'libx265', '-preset', 'ultrafast', '-crf', '28');
    args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-tag:v', 'hvc1'); // For better compatibility
    outputName = outputName.replace('.hevc', '.mp4'); // Use MP4 container
  } else if (toFormat === 'divx') {
    // DivX (MPEG-4 Part 2) in AVI container
    args.push('-c:v', 'mpeg4', '-vtag', 'DIVX', '-qscale:v', '4');
    args.push('-c:a', 'mp3', '-b:a', '192k');
    outputName = outputName.replace('.divx', '.avi'); // Use AVI container
  } else if (toFormat === 'mjpeg') {
    // Motion JPEG
    args.push('-c:v', 'mjpeg', '-qscale:v', '3');
    args.push('-c:a', 'pcm_s16le');
    outputName = outputName.replace('.mjpeg', '.avi'); // Use AVI container
  } else if (toFormat === 'mpeg2') {
    // MPEG-2 format
    args.push('-c:v', 'mpeg2video', '-b:v', '8M', '-maxrate', '8M', '-bufsize', '4M');
    args.push('-c:a', 'mp2', '-b:a', '256k');
    outputName = outputName.replace('.mpeg2', '.mpg'); // Use MPG extension
  } else if (toFormat === 'asf') {
    // Windows Media format
    args.push('-c:v', 'wmv2', '-b:v', '2M');
    args.push('-c:a', 'wmav2', '-b:a', '192k');
  } else if (toFormat === 'gif') {
    // Generate palette for better quality
    const paletteName = 'palette.png';
    await ff.exec([
      '-i', inputName,
      '-vf', 'fps=15,scale=480:-1:flags=lanczos,palettegen',
      paletteName
    ]);

    // Use palette to create GIF
    args = [
      '-i', inputName,
      '-i', paletteName,
      '-lavfi', 'fps=15,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse',
      '-loop', '0'
    ];
  }

  // Add progress reporting for better feedback
  args.push('-progress', 'pipe:1', '-nostats');

  args.push(outputName);

  // Log the command for debugging
  console.log('[FFmpeg Command]', args.join(' '));

  // Execute conversion
  await ff.exec(args);

  // Read output file
  const data = await ff.readFile(outputName);

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