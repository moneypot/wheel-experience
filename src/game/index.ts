import { Game } from "./Game";

export function makeGame({
  canvasElement,
  multipliers,
}: {
  canvasElement: HTMLCanvasElement;
  multipliers: number[];
}) {
  const game = new Game({ canvasElement, multipliers });
  game.start();
  return game;
}
