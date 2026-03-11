declare module "ghostscript-node" {
  export function compressPDF(
    pdfBuffer: Buffer | string,
    encoding?: BufferEncoding
  ): Promise<Buffer>;
}
