import { tk } from "./i18n";

/** "Download complete" sounds to choose from (Settings › Sounds). "classic" is complete.wav;
 *  every other id plays sounds/complete-<id>.wav. Names are marked for translation: show
 *  them with `t(name)`. */
export const COMPLETE_SOUNDS: { id: string; name: string }[] = [
  ...(typeof navigator !== "undefined" && /Macintosh|Mac OS X/i.test(navigator.userAgent)
    ? [{ id: "macos", name: "macOS alert (Glass)" }]
    : []),
  { id: "classic", name: tk("Classic") },
  { id: "xr11", name: "xr11" },
  { id: "pop", name: tk("Pop") },
  { id: "kalimba", name: tk("Kalimba") },
  { id: "snap", name: tk("Snap") },
  { id: "cascade", name: tk("Cascade") },
  { id: "glide", name: tk("Glide") },
  { id: "harp", name: tk("Harp") },
  { id: "droplet", name: tk("Droplet") },
  { id: "music-box", name: tk("Music box") },
  { id: "sparkle", name: tk("Sparkle") },
];

/** Linux and macOS play through their system audio players, outside the webview. */
export const NATIVE_SOUNDS = typeof navigator !== "undefined"
  && (/Linux/i.test(navigator.userAgent) || /Macintosh|Mac OS X/i.test(navigator.userAgent))
  && !/Android/i.test(navigator.userAgent);

/** The file (without .wav) under /sounds that plays for `kind`; an unknown complete sound
 *  falls back to the classic one. */
export function soundFile(kind: string, completeSound?: string): string {
  if (kind === "failed") return "failed";
  if (kind === "queue") return "queue";
  if (completeSound === "macos") return "macos";
  // Keep old saved preferences working after the old sound's asset was rebranded.
  if (completeSound === "prism" || completeSound === "xr11") return "complete-xr11";
  return completeSound && completeSound !== "classic" && COMPLETE_SOUNDS.some((s) => s.id === completeSound) ? `complete-${completeSound}` : "complete";
}
