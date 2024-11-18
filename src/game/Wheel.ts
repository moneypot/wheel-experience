import { Actor, ActorArgs, Vector } from "excalibur";
import { WheelSegmentsRaster } from "./WheelSegmentsRaster";
import { Game } from "./Game";

export class Wheel extends Actor {
  // Other components want to know this, so we extract it to a property
  radius: number;

  constructor({ pos, radius }: Required<Pick<ActorArgs, "pos" | "radius">>) {
    super({
      pos,
    });
    this.radius = radius;
  }

  onInitialize(engine: Game): void {
    const center = new Vector(engine.halfDrawWidth, engine.halfDrawHeight);
    const radius = engine.halfDrawHeight * 0.8;

    const raster = new WheelSegmentsRaster(radius, center, engine.multipliers);
    this.graphics.use(raster);
  }
}
