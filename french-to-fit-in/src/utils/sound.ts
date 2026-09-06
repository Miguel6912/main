/**
 * Tiny synthesized sound effects (Web Audio oscillators) -- no audio
 * assets needed. Used only for gamification delight (correct-answer tick,
 * celebration chime); always triggered from a user gesture (button click),
 * so autoplay policies never block it. Fails silently if unsupported.
 */

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedContext) {
    sharedContext = new AudioCtx();
  }
  if (sharedContext.state === 'suspended') {
    sharedContext.resume().catch(() => {});
  }
  return sharedContext;
}

function playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, gainPeak = 0.12): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/** Short, quiet tick for a correct/functional answer. */
export function playCorrectChime(): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    playTone(ctx, 880, now, 0.14, 0.08);
    playTone(ctx, 1318.5, now + 0.06, 0.16, 0.07);
  } catch {
    // Ignore -- sound is pure delight, never critical path.
  }
}

/** Fuller ascending arpeggio for level-up / badge unlock / field-test pass. */
export function playCelebrationChime(): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => playTone(ctx, freq, now + i * 0.09, 0.35, 0.09));
  } catch {
    // Ignore.
  }
}
