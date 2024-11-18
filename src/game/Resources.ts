import { Loader, Sound } from "excalibur";

export const Resources = {
  BetSound: new Sound("/bet.mp3"),
  WinSound: new Sound("/win.mp3"),
} as const;

export const loader = new Loader();

for (const res of Object.values(Resources)) {
  loader.addResource(res);

  // Load in background
  res.load();
}
