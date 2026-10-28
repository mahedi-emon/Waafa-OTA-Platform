/*
 * The alert chime (issue 243): two soft notes made with the Web Audio API, so there is no sound file to download.
 * Browsers allow sound only after the person has clicked or typed on the page, so the first click or key press
 * unlocks it; until then a new alert is silent (the bell and the badge still update).
 */

type AudioContextClass = typeof AudioContext;

let context: AudioContext | null = null;
let armed = false;

function audioClass(): AudioContextClass | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    AudioContext?: AudioContextClass;
    webkitAudioContext?: AudioContextClass;
  };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

function unlock() {
  const Audio = audioClass();
  if (!Audio) return;
  try {
    context ??= new Audio();
    void context.resume();
  } catch {
    context = null;
  }
}

/** Waits for the first click or key press, which lets the page play sound later. */
export function armChime(): void {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const once = () => {
    unlock();
    window.removeEventListener("pointerdown", once);
    window.removeEventListener("keydown", once);
  };
  window.addEventListener("pointerdown", once);
  window.addEventListener("keydown", once);
}

/** True once a click or key press has unlocked sound. */
export function chimeReady(): boolean {
  return context?.state === "running";
}

/** Plays the chime when sound is unlocked; otherwise does nothing. */
export function playChime(): void {
  if (!context || context.state !== "running") return;
  const start = context.currentTime + 0.01;
  for (const [index, frequency] of [659.25, 880].entries()) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const at = start + index * 0.14;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.32);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.34);
  }
}
