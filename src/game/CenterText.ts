import { Actor, Vector, Font, Color, Engine, Text } from "excalibur";

export class CenterText extends Actor {
  textActor!: Text;

  private animationTime = 0;
  private isAnimating = false;
  private readonly popAnimationDuration = 500;

  constructor({ center }: { center: Vector }) {
    super({
      pos: center,
      width: 100,
      height: 40,
      anchor: new Vector(0.5, 0.5),
    });

    this.textActor = new Text({
      text: "",
      font: new Font({
        quality: 2,
        size: 24,
        family: "Verdana",
        color: Color.Black,
        bold: true,
        // Only using shadow because of white background. Don't need on dark background.
        shadow: {
          blur: 0,
          offset: new Vector(-2, -2),
          color: Color.Black,
        },
      }),
    });
    this.graphics.use(this.textActor);

    this.scale = Vector.Zero;
  }

  setText(text: string, color: Color) {
    this.textActor.text = text;
    this.textActor.color = color;
    (this.textActor.font as Font).shadow.color = color.darken(0.5);
    this.scale = Vector.Zero;
    this.isAnimating = true;
    this.animationTime = 0;
  }

  update(engine: Engine, delta: number): void {
    super.update(engine, delta);

    if (this.isAnimating) {
      this.animationTime += delta;

      if (this.animationTime >= this.popAnimationDuration) {
        this.scale = Vector.One;
        this.isAnimating = false;
      } else {
        const progress = this.animationTime / this.popAnimationDuration;
        // Overshoot and bounce back effect
        const scale = this.elasticOut(progress);
        this.scale = new Vector(scale, scale);
      }
    }
  }

  private elasticOut(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;

    // Parameters for elasticity
    const amplitude = 1.05; // Max overshoot (1.2 means 120% of final size at peak)
    const period = 0.5; // Controls bounce frequency
    const s = (period / (Math.PI * 2)) * Math.asin(1 / amplitude);

    return (
      amplitude *
        Math.pow(2, -10 * t) *
        Math.sin(((t - s) * (Math.PI * 2)) / period) +
      1
    );
  }
}
