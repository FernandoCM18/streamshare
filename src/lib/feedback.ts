/**
 * Haptic feedback + sound effects for PWA interactions.
 *
 * Uses the Vibration API and Web Audio API — no external deps.
 * Both are no-ops on unsupported devices (desktop, older browsers).
 */

// ── Haptic patterns ─────────────────────────────────────────

type HapticPattern = number | number[];

const hapticPatterns = {
  /** Light tap — navigation, filter select, open modal */
  light: 8,
  /** Medium tap — form submit, toggle, register action */
  medium: 20,
  /** Strong — destructive confirm, delete, danger */
  strong: 40,
  /** Success — payment confirmed, celebration */
  success: [15, 50, 25],
  /** Error — failed action */
  error: [30, 40, 30],
  /** Double tap — toggle on/off */
  double: [12, 60, 12],
} satisfies Record<string, HapticPattern>;

export type HapticType = keyof typeof hapticPatterns;

export function haptic(type: HapticType = "light") {
  try {
    navigator?.vibrate?.(hapticPatterns[type]);
  } catch {
    // Silently fail — vibration not supported
  }
}

// ── Sound effects (Web Audio API) ───────────────────────────

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Resume if suspended (autoplay policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  opts?: {
    type?: OscillatorType;
    volume?: number;
    delay?: number;
    detune?: number;
  },
) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = opts?.type ?? "sine";
  osc.frequency.value = frequency;
  if (opts?.detune) osc.detune.value = opts.detune;

  const vol = opts?.volume ?? 0.08;
  const start = ctx.currentTime + (opts?.delay ?? 0);
  const end = start + duration;

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, end);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(end + 0.05);
}

const sounds = {
  /** Soft tap — navigation, filter, small action */
  tap() {
    playTone(800, 0.06, { type: "sine", volume: 0.04 });
  },

  /** Success chime — payment confirmed, service created */
  success() {
    playTone(523, 0.1, { type: "sine", volume: 0.07 });
    playTone(659, 0.1, { type: "sine", volume: 0.07, delay: 0.08 });
    playTone(784, 0.15, { type: "sine", volume: 0.06, delay: 0.16 });
  },

  /** Payment registered — coin drop feel */
  coin() {
    playTone(1200, 0.08, { type: "sine", volume: 0.06 });
    playTone(1600, 0.12, { type: "sine", volume: 0.05, delay: 0.06 });
  },

  /** Error / warning — lower dissonant tone */
  error() {
    playTone(280, 0.12, { type: "triangle", volume: 0.07 });
    playTone(220, 0.15, { type: "triangle", volume: 0.06, delay: 0.1 });
  },

  /** Toggle on */
  toggleOn() {
    playTone(600, 0.06, { type: "sine", volume: 0.05 });
    playTone(900, 0.08, { type: "sine", volume: 0.04, delay: 0.05 });
  },

  /** Toggle off */
  toggleOff() {
    playTone(700, 0.06, { type: "sine", volume: 0.05 });
    playTone(500, 0.08, { type: "sine", volume: 0.04, delay: 0.05 });
  },

  /** Danger / delete warning */
  danger() {
    playTone(330, 0.08, { type: "sawtooth", volume: 0.04 });
    playTone(260, 0.12, { type: "sawtooth", volume: 0.03, delay: 0.07 });
  },

  /** Copy to clipboard */
  copy() {
    playTone(1000, 0.05, { type: "sine", volume: 0.04 });
    playTone(1200, 0.05, { type: "sine", volume: 0.03, delay: 0.04 });
  },

  /** Modal / drawer open */
  open() {
    playTone(500, 0.06, { type: "sine", volume: 0.03 });
    playTone(700, 0.08, { type: "sine", volume: 0.03, delay: 0.04 });
  },

  /** Celebration — payment confirmed with confetti */
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
    // Silently fail — audio not supported
  }
}

// ── Combined feedback ───────────────────────────────────────

interface FeedbackMap {
  haptic: HapticType;
  sound: SoundType;
}

const feedbackPresets = {
  /** Navigation tab tap */
  nav: { haptic: "light", sound: "tap" },
  /** Filter chip selection */
  filter: { haptic: "light", sound: "tap" },
  /** Open modal/drawer/sheet */
  open: { haptic: "light", sound: "open" },
  /** Form submit / register payment */
  submit: { haptic: "medium", sound: "coin" },
  /** Success (service created, persona saved) */
  success: { haptic: "success", sound: "success" },
  /** Payment confirmed with celebration */
  celebrate: { haptic: "success", sound: "celebrate" },
  /** Error toast */
  error: { haptic: "error", sound: "error" },
  /** Toggle on (activate service) */
  toggleOn: { haptic: "double", sound: "toggleOn" },
  /** Toggle off (pause service) */
  toggleOff: { haptic: "double", sound: "toggleOff" },
  /** Destructive action (delete dialog) */
  danger: { haptic: "strong", sound: "danger" },
  /** Copy to clipboard */
  copy: { haptic: "medium", sound: "copy" },
  /** Reject / dismiss */
  dismiss: { haptic: "light", sound: "tap" },
} satisfies Record<string, FeedbackMap>;

export type FeedbackType = keyof typeof feedbackPresets;

/**
 * Trigger both haptic + sound feedback in one call.
 *
 * @example
 * feedback("success")   // haptic pulse + chime
 * feedback("nav")       // light tap + soft click
 * feedback("danger")    // strong vibration + warning tone
 */
export function feedback(type: FeedbackType) {
  const preset = feedbackPresets[type];
  haptic(preset.haptic);
  playSound(preset.sound);
}
