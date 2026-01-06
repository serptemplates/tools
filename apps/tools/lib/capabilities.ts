/**
 * Runtime capability detection for different build modes
 */

export interface Capabilities {
  supportsVideoConversion: boolean;
  supportsSharedArrayBuffer: boolean;
  buildMode: 'static' | 'server';
  reason?: string;
}

export function detectCapabilities(): Capabilities {
  // Check environment variables first
  const buildMode = process.env.BUILD_MODE as 'static' | 'server' || 'static';
  const envSupportsVideo = process.env.SUPPORTS_VIDEO_CONVERSION === 'true';
  
  // Runtime SharedArrayBuffer detection
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  
  // Determine video conversion support
  let supportsVideoConversion = false;
  let reason: string | undefined;
  
  if (!envSupportsVideo) {
    reason = 'Video conversion disabled in static build mode';
  } else if (!hasSharedArrayBuffer) {
    reason = 'SharedArrayBuffer not available - CORS headers required';
  } else {
    supportsVideoConversion = true;
  }
  
  return {
    supportsVideoConversion,
    supportsSharedArrayBuffer: hasSharedArrayBuffer,
    buildMode,
    reason,
  };
}

export function isVideoConversionSupported(): boolean {
  return detectCapabilities().supportsVideoConversion;
}

export function getVideoConversionError(): string {
  const caps = detectCapabilities();
  return caps.reason || 'Video conversion not supported';
}

/**
 * Define formats that require video conversion (FFmpeg.wasm)
 */
export const VIDEO_FORMATS = [
  // Video containers
  'mp4', 'mkv', 'avi', 'webm', 'mov', 'flv', 'ts', 'mts', 'm2ts', 'm4v', 
  'mpeg', 'mpg', 'vob', '3gp', 'f4v', 'hevc', 'divx', 'mjpeg', 'mpeg2', 
  'asf', 'wmv', 'mxf', 'ogv', 'rm', 'rmvb', 'swf'
];

export const AUDIO_FORMATS = [
  // Audio formats (extracted from video or converted)
  'mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'flac', 'wma', 'aif', 'aiff', 'mp2'
];

/**
 * Formats that work with browser-native image processing (static-safe)
 */
export const STATIC_SAFE_FORMATS = [
  // Images (browser createImageBitmap support)
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'ico', 'tiff', 'avif',
  // Documents (special handling)
  'pdf'
];

/**
 * Check if a conversion requires video processing
 */
export function requiresVideoConversion(from: string, to: string): boolean {
  return VIDEO_FORMATS.includes(from) || 
         AUDIO_FORMATS.includes(to) ||
         VIDEO_FORMATS.includes(to);
}

/**
 * Check if a tool will work on static builds
 */
export function isStaticCompatible(from: string, to: string): boolean {
  // PDF to image conversions work (special PDF.js handling)
  if (from === 'pdf' && STATIC_SAFE_FORMATS.includes(to)) {
    return true;
  }
  
  // Image to image conversions work (browser native)
  if (STATIC_SAFE_FORMATS.includes(from) && STATIC_SAFE_FORMATS.includes(to)) {
    return true;
  }
  
  // Anything requiring video conversion won't work
  return !requiresVideoConversion(from, to);
}

/**
 * Get the reason why a tool won't work on static builds
 */
export function getStaticIncompatibilityReason(from: string, to: string): string | null {
  if (isStaticCompatible(from, to)) return null;
  
  if (VIDEO_FORMATS.includes(from)) {
    return `${from.toUpperCase()} video processing requires FFmpeg.wasm (server mode only)`;
  }
  
  if (AUDIO_FORMATS.includes(to)) {
    return `Audio extraction to ${to.toUpperCase()} requires FFmpeg.wasm (server mode only)`;
  }
  
  if (VIDEO_FORMATS.includes(to)) {
    return `Video conversion to ${to.toUpperCase()} requires FFmpeg.wasm (server mode only)`;
  }
  
  return 'Video/audio processing not supported in static builds';
}
