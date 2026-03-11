declare module "imagemin" {
  type ImageminPlugin = (input: Buffer) => Promise<Buffer>;

  const imagemin: {
    buffer: (input: Buffer, options: { plugins: ImageminPlugin[] }) => Promise<Buffer>;
  };

  export default imagemin;
}
