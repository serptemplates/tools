export async function createZipBlob(files: Map<string, Blob>): Promise<Blob> {
  // Dynamic import to reduce bundle size
  const { BlobWriter, ZipWriter } = await import('@zip.js/zip.js');
  
  const blobWriter = new BlobWriter('application/zip');
  const zipWriter = new ZipWriter(blobWriter);
  
  for (const [filename, blob] of files) {
    await zipWriter.add(filename, blob.stream());
  }
  
  await zipWriter.close();
  return await blobWriter.getData();
}