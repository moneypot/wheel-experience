import { Actor, Color, Graphic, Raster, Vector } from "excalibur";

class TickerRaster extends Raster {
  clone(): Graphic {
    return new TickerRaster(this.width, this.height);
  }

  constructor(width: number, height: number) {
    super({
      width,
      height,
      quality: 2,
    });
  }

  execute(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = Color.Red.toString();
    ctx.beginPath();
    ctx.moveTo(0, 5); // Left point
    ctx.lineTo(10, 5); // Right point
    ctx.lineTo(5, 20); // Bottom point
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(5, 5, 5, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  }
}

export class Ticker extends Actor {
  private readonly swingAngle = -Math.PI / 5; // Maximum swing angle in radians

  constructor({
    pos,
    height,
    width,
  }: {
    pos: Vector;
    height: number;
    width: number;
  }) {
    const radius = width / 2;
    super({
      pos,
      width,
      height,
      color: Color.Red,
      anchor: new Vector(
        0.5,
        // determine anchor point of center of circle (for pivot) as a ratio of total height
        radius / height
      ),
    });
  }

  onInitialize(): void {
    this.graphics.use(new TickerRaster(this.width, this.height));
  }

  swing() {
    this.rotation = this.swingAngle;
  }

  stop() {
    this.rotation = 0;
  }
}
