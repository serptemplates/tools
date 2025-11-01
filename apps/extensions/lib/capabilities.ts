export type Capabilities = {
  webWorkers: boolean;
  webAssembly: boolean;
  sharedArrayBuffer: boolean;
  supportsVideoConversion?: boolean;
  reason?: string;
};

export function detectCapabilities(): Capabilities {
  return {
    webWorkers: typeof Worker !== 'undefined',
    webAssembly: typeof WebAssembly !== 'undefined',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    supportsVideoConversion: true,
  };
}
