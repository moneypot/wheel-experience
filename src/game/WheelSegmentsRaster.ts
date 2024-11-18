import { Raster, Graphic, Vector, Color } from "excalibur";

export function getColorForMultiplier(multiplier: number): Color {
  // TODO: Prob should just take colors as params along with multiplier list...
  // Client should just calculate them on the fly and guarantee they are unique per multiplier bucket.
  switch (multiplier) {
    case 0:
      return Color.Gray;
    case 1.5:
      return Color.Green;
    case 1.7:
    case 1.9:
    case 1.2:
      return Color.Cyan;
    case 2.0:
      return Color.Yellow;
    case 3.0:
      return Color.Violet;
    case 4.0:
      return Color.Orange;
    case 5.0:
      return Color.Blue;
    case 9.9:
    case 49.5:
      return Color.Red;
    default:
      throw new Error(`Unknown multiplier: ${multiplier}`);
  }
}

export class WheelSegmentsRaster extends Raster {
  override clone(): Graphic {
    return new WheelSegmentsRaster(this.radius, this.center, this.multipliers);
  }

  constructor(
    private radius: number,
    private center: Vector,
    public multipliers: number[]
  ) {
    super({
      // smoothing: true,
      width: radius * 2,
      height: radius * 2,
      quality: 2, // 2x the internal bitmap representation
      // filtering: ImageFiltering.Blended,
    });
  }

  execute(ctx: CanvasRenderingContext2D): void {
    const sections = this.multipliers.length;
    const sectionAngle = (Math.PI * 2) / sections;
    const innerRadius = this.radius * 0.9; // Inner radius for hollow effect

    // Translate to center of the wheel
    ctx.translate(this.radius, this.radius);

    // Draw sections
    for (let i = 0; i < sections; i++) {
      const startAngle = i * sectionAngle - Math.PI / 2;
      const endAngle = (i + 1) * sectionAngle - Math.PI / 2;
      const color = getColorForMultiplier(this.multipliers[i]);

      ctx.beginPath();
      ctx.fillStyle = color.toString();

      // Draw outer arc
      ctx.arc(0, 0, this.radius, startAngle, endAngle);

      // Draw inner arc (in reverse direction)
      ctx.arc(0, 0, innerRadius, endAngle, startAngle, true);

      ctx.closePath();
      ctx.fill();
    }

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
