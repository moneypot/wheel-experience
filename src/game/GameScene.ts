import { Color, EasingFunctions, Scene, Vector } from "excalibur";
import {
  getColorForMultiplier,
  WheelSegmentsRaster,
} from "./WheelSegmentsRaster";
import { Resources } from "./Resources";
import { Game } from "./Game";
import { Ticker } from "./Ticker";
import { CenterText } from "./CenterText";
import { Wheel } from "./Wheel";

export class GameScene extends Scene {
  wheel!: Wheel;
  spinning = false;

  ticker!: Ticker;

  private centerText!: CenterText;
  private targetMultiplierIdx = 0;

  // Animation properties
  private startRotation = 0;
  private targetRotation = 0;
  private animationTime = 0;
  private animationDuration = 1000;

  changeMultipliers(multipliers: number[]) {
    const raster = new WheelSegmentsRaster(
      this.wheel.radius,
      this.wheel.pos,
      multipliers
    );
    this.wheel.graphics.use(raster);
  }

  onInitialize(engine: Game) {
    const center = new Vector(engine.halfDrawWidth, engine.halfDrawHeight);
    const radius = engine.halfDrawHeight * 0.8;

    this.wheel = new Wheel({
      pos: center,
      radius,
    });
    this.add(this.wheel);
    this.changeMultipliers(engine.multipliers);

    this.centerText = new CenterText({ center });
    this.add(this.centerText);

    this.ticker = new Ticker({
      pos: new Vector(center.x, center.y - radius - 15),
      height: 20,
      width: 10,
    });
    this.add(this.ticker);
  }

  stopAt(engine: Game, multiplierIndex: number): void {
    if (this.spinning) return;

    Resources.BetSound.play(0.5);

    this.targetMultiplierIdx = multiplierIndex;

    // Hide center text
    this.centerText.setText("", Color.Transparent);

    this.spinning = true;
    this.animationTime = 0;
    this.startRotation = this.wheel.rotation;

    // Calculate target rotation
    const sectionAngle = (Math.PI * 2) / engine.multipliers.length;

    const fullRotations = 2;

    // Final rotation should put the selected multiplier at the top
    // We reverse the index direction because the wheel spins clockwise
    const reversedIndex = engine.multipliers.length - multiplierIndex;

    this.targetRotation =
      fullRotations * Math.PI * 2 + // Full rotations
      reversedIndex * sectionAngle - // Position for target multiplier
      sectionAngle / 2; // Offset to center of segment
  }

  update(engine: Game, delta: number): void {
    super.update(engine, delta);

    if (this.spinning) {
      this.animationTime += delta;

      this.ticker.swing();

      if (this.animationTime >= this.animationDuration) {
        this.spinning = false;
        this.wheel.rotation = this.targetRotation;
        this.ticker.stop();

        // Play sound if player won
        if (engine.multipliers[this.targetMultiplierIdx] > 0) {
          Resources.WinSound.play();
        }

        // Show the final multiplier in the center of wheel
        this.centerText.setText(
          `${engine.multipliers[this.targetMultiplierIdx].toFixed(2)}x`,
          getColorForMultiplier(engine.multipliers[this.targetMultiplierIdx])
        );
      } else {
        this.wheel.rotation = EasingFunctions.EaseOutCubic(
          this.animationTime,
          this.startRotation,
          this.targetRotation,
          this.animationDuration
        );
      }
    }
  }
}
