// Every delivered animation sheet is a 4x4 grid of frames (16 total),
// numbered left-to-right then top-to-bottom (row-major), regardless of how
// many distinct poses/states share the sheet -- a sheet split into 4 states
// of 4 frames uses one row per state; a sheet split into 2 states of 8
// frames uses two rows per state. A "clip" is just a contiguous slice of
// that linear numbering: { key, start, count }.

const SHEET_COLS = 4;
const SHEET_ROWS = 4;

// The source rect (in the sheet image's own pixel space) for one frame.
export function frameRect(img, frameIndex) {
  const iw = img.naturalWidth || 0;
  const ih = img.naturalHeight || 0;
  const cellW = iw / SHEET_COLS;
  const cellH = ih / SHEET_ROWS;
  const col = frameIndex % SHEET_COLS;
  const row = Math.floor(frameIndex / SHEET_COLS) % SHEET_ROWS;
  return { sx: col * cellW, sy: row * cellH, sw: cellW, sh: cellH };
}

// Maps elapsed time (seconds, since this clip started playing) to a local
// frame index within the clip. loop=true wraps past the end; loop=false
// holds on the last frame (for a one-shot like an attack swing or death,
// which should finish and hold rather than restart or vanish).
export function frameForElapsed(clip, elapsed) {
  const local = Math.floor(elapsed * clip.fps);
  if (clip.loop) return local % clip.count;
  return Math.min(clip.count - 1, Math.max(0, local));
}

// Same idea but driven by a spatial phase instead of wall-clock time -- for
// a walk/run cycle, where the "playback rate" should track actual movement
// speed (freezes cleanly the instant you stop, speeds up if you're somehow
// moving faster) rather than an independent clock that drifts out of sync
// with your feet.
export function frameForPhase(clip, phase) {
  const local = Math.floor(phase) % clip.count;
  return local < 0 ? local + clip.count : local;
}
