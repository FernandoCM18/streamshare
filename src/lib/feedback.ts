/**
 * Haptic feedback + sound effects for PWA interactions.
 *
 * - Sounds: Web Audio API with iOS unlock pattern
 * - Haptics: Vibration API (Android) — iOS does not support web haptics
 *
 * Call `unlockAudio()` once on first user interaction to enable sounds on iOS.
 */

// ── Audio engine ────────────────────────────────────────────

let audioCtx: AudioContext | null = null;
let unlocked = false;

/**
 * Must be called inside a user gesture (touchstart/click) to unlock
 * audio playback on iOS Safari. Safe to call multiple times.
 */
export function unlockAudio() {
  if (unlocked) return;
  if (typeof window === "undefined") return;

  try {
    const ctx = ensureCtx();
    if (!ctx) return;

    // iOS requires playing a buffer during a user gesture to unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    // Also resume if suspended
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    unlocked = true;
  } catch {
    // Silently fail
  }
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function getAudioCtx(): AudioContext | null {
  const ctx = ensureCtx();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

function playTone(
  frequency: number,
  duration: number,
  opts?: {
    type?: OscillatorType;
    volume?: number;
    delay?: number;
  },
) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = opts?.type ?? "sine";
    osc.frequency.value = frequency;

    const vol = opts?.volume ?? 0.08;
    const start = ctx.currentTime + (opts?.delay ?? 0);
    const end = start + duration;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(end + 0.05);
  } catch {
    // Silently fail
  }
}

// ── Haptic patterns ─────────────────────────────────────────

type HapticPattern = number | number[];

const hapticPatterns = {
  light: 8,
  medium: 20,
  strong: 40,
  success: [15, 50, 25],
  error: [30, 40, 30],
  double: [12, 60, 12],
} satisfies Record<string, HapticPattern>;

export type HapticType = keyof typeof hapticPatterns;

export function haptic(type: HapticType = "light") {
  try {
    navigator?.vibrate?.(hapticPatterns[type]);
  } catch {
    // Not supported (iOS, desktop)
  }
}

// ── Sound effects ───────────────────────────────────────────

const sounds = {
  tap() {
    playTone(800, 0.06, { type: "sine", volume: 0.04 });
  },
  success() {
    playTone(523, 0.1, { type: "sine", volume: 0.07 });
    playTone(659, 0.1, { type: "sine", volume: 0.07, delay: 0.08 });
    playTone(784, 0.15, { type: "sine", volume: 0.06, delay: 0.16 });
  },
  coin() {
    playTone(1200, 0.08, { type: "sine", volume: 0.06 });
    playTone(1600, 0.12, { type: "sine", volume: 0.05, delay: 0.06 });
  },
  error() {
    playTone(280, 0.12, { type: "triangle", volume: 0.07 });
    playTone(220, 0.15, { type: "triangle", volume: 0.06, delay: 0.1 });
  },
  toggleOn() {
    playTone(600, 0.06, { type: "sine", volume: 0.05 });
    playTone(900, 0.08, { type: "sine", volume: 0.04, delay: 0.05 });
  },
  toggleOff() {
    playTone(700, 0.06, { type: "sine", volume: 0.05 });
    playTone(500, 0.08, { type: "sine", volume: 0.04, delay: 0.05 });
  },
  danger() {
    playTone(330, 0.08, { type: "sawtooth", volume: 0.04 });
    playTone(260, 0.12, { type: "sawtooth", volume: 0.03, delay: 0.07 });
  },
  copy() {
    playTone(1000, 0.05, { type: "sine", volume: 0.04 });
    playTone(1200, 0.05, { type: "sine", volume: 0.03, delay: 0.04 });
  },
  open() {
    playTone(500, 0.06, { type: "sine", volume: 0.03 });
    playTone(700, 0.08, { type: "sine", volume: 0.03, delay: 0.04 });
  },
  celebrate() {
    playTone(523, 0.08, { type: "sine", volume: 0.07 });
    playTone(659, 0.08, { type: "sine", volume: 0.06, delay: 0.07 });
    playTone(784, 0.08, { type: "sine", volume: 0.06, delay: 0.14 });
    playTone(1047, 0.2, { type: "sine", volume: 0.05, delay: 0.21 });
  },
} satisfies Record<string, () => void>;

export type SoundType = keyof typeof sounds;

export function playSound(type: SoundType) {
  try {
    sounds[type]();
  } catch {
    // Silently fail
  }
}

// ── Combined feedback presets ───────────────────────────────

interface FeedbackMap {
  haptic: HapticType;
  sound: SoundType;
}

const feedbackPresets = {
  nav: { haptic: "light", sound: "tap" },
  filter: { haptic: "light", sound: "tap" },
  open: { haptic: "light", sound: "open" },
  submit: { haptic: "medium", sound: "coin" },
  success: { haptic: "success", sound: "success" },
  celebrate: { haptic: "success", sound: "celebrate" },
  error: { haptic: "error", sound: "error" },
  toggleOn: { haptic: "double", sound: "toggleOn" },
  toggleOff: { haptic: "double", sound: "toggleOff" },
  danger: { haptic: "strong", sound: "danger" },
  copy: { haptic: "medium", sound: "copy" },
  dismiss: { haptic: "light", sound: "tap" },
} satisfies Record<string, FeedbackMap>;

export type FeedbackType = keyof typeof feedbackPresets;

export function feedback(type: FeedbackType) {
  const preset = feedbackPresets[type];
  haptic(preset.haptic);
  playSound(preset.sound);
}
