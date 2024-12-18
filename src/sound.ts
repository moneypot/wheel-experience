const sounds = {
  win: createPreloadedAudio("/win.mp3"),
};

function createPreloadedAudio(src: string) {
  const audio = new Audio(src);
  audio.preload = "auto";

  audio.load();
  audio.onerror = (e) => console.error("Audio loading failed:", e);

  return audio;
}

export function playSound(key: keyof typeof sounds) {
  const audio = sounds[key];
  try {
    audio.currentTime = 0;
    audio.play();
  } catch (e) {
    console.log("Playback failed:", e);
  }
}
