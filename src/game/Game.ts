import { Color, DisplayMode, Engine } from "excalibur";
import { GameScene } from "./GameScene";

export class Game extends Engine {
  multipliers: number[];

  private currentSpin: Promise<void> | null = null;

  get spinning(): boolean {
    return (this.currentScene as GameScene).spinning;
  }

  constructor({
    canvasElement,
    multipliers,
  }: {
    canvasElement: HTMLCanvasElement;
    multipliers: number[];
  }) {
    super({
      canvasElement,
      suppressPlayButton: true,
      suppressConsoleBootMessage: true,
      grabWindowFocus: false,
      width: 400,
      height: 400,
      pixelRatio: window.devicePixelRatio,
      // Note: Might seem nice to use Color.Transparent, but it causes antialiasing into a white color.
      backgroundColor: Color.White,
      displayMode: DisplayMode.FitContainer,
      physics: {
        enabled: false,
      },
      scenes: {
        game: GameScene,
      },
    });
    this.multipliers = multipliers;
    // this.showDebug(true);
  }

  override async start(): Promise<void> {
    return super.start().then(() => {
      this.goToScene("game");
    });
  }

  setMultipliers(multipliers: number[]): void {
    console.log("Game.setMultipliers", multipliers);
    if (this.spinning) {
      throw new Error(
        "client violation: cannot change multipliers while spinning"
      );
    }
    this.multipliers = multipliers;
    (this.currentScene as GameScene).changeMultipliers(multipliers);
  }

  stopAt(idx: number): Promise<void> {
    if (this.currentSpin) {
      return this.currentSpin;
    }

    this.currentSpin = new Promise((resolve) => {
      (this.currentScene as GameScene).stopAt(this, idx);
      const totalAnimTime =
        // wheel spin
        1000 +
        // Just long enough to see final text

        100;
      const done = () => {
        this.currentSpin = null;
        resolve();
      };
      setTimeout(done, totalAnimTime);
    });

    return this.currentSpin;
  }
}
