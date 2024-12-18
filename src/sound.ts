const sounds = {
  bet: createPreloadedAudio("/bet.mp3"),
  win: createPreloadedAudio("/win.mp3"),
};

function createPreloadedAudio(src: string) {
  const audio = new Audio(src);
  audio.preload = "none"; // Makes playback instant on Safari
  audio.autoplay = false;

  audio.load();
  audio.onerror = (e) => console.error("Audio loading failed:", e);

  return audio;
}

export function playSound(key: keyof typeof sounds) {
  const audio = sounds[key].cloneNode() as HTMLAudioElement;
  audio.play().catch((e) => console.error("Playback failed:", e));
}
