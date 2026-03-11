export function normalizeBlobPart(
  slice: ArrayBuffer | SharedArrayBuffer,
): ArrayBuffer {
  if (slice instanceof ArrayBuffer) {
    return slice;
  }

  const copy = new ArrayBuffer(slice.byteLength);
  new Uint8Array(copy).set(new Uint8Array(slice));
  return copy;
}
