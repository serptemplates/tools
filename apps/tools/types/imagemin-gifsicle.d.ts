declare module "imagemin-gifsicle" {
  type GifsicleOptions = {
    optimizationLevel?: number;
  };

  export default function imageminGifsicle(options?: GifsicleOptions): (input: Buffer) => Promise<Buffer>;
}
