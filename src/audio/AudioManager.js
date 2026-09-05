// Fully procedural audio via the Web Audio API -- no external audio files,
// so there's nothing to fetch and no licensing to worry about. An ambient
// pad shifts gently with time-of-day/season, plus small generative
// bird/cricket blips and a handful of short sfx stingers.
//
// Browsers require a user gesture before audio can start, so `resume()` is
// called from the first keydown/click in main.js.
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this._ambientNodes = [];
    this._critterAccum = 0;
    this._started = false;
  }

  resume() {
    if (this._started) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    this._started = true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return; // silently no-op if unsupported
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    this._startAmbientPad();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.2);
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  _startAmbientPad() {
    const ctx = this.ctx;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.06;
    padGain.connect(this.master);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.connect(padGain);

    const freqs = [130.81, 164.81, 196.0]; // C3 E3 G3 -- soft major triad
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(filter);
      osc.start();
      this._ambientNodes.push(osc);
    }

    // slow LFO on the filter for a breathing quality
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this._ambientNodes.push(lfo);

    this._padFilter = filter;
  }

  // Called every frame with the current time phase/season so the ambience
  // can lean brighter by day, darker by night, without discrete "tracks".
  updateAmbience(dt, phase, season) {
    if (!this.ctx) return;
    if (this._padFilter) {
      const target = phase === 'night' ? 500 : phase === 'dusk' || phase === 'dawn' ? 650 : 900;
      this._padFilter.frequency.setTargetAtTime(target, this.ctx.currentTime, 1.5);
    }
    this._critterAccum += dt;
    const rate = phase === 'night' ? 0.9 : phase === 'day' ? 1.4 : 1.8;
    if (this._critterAccum > rate) {
      this._critterAccum = 0;
      if (Math.random() < 0.7) {
        if (phase === 'night') this._playCricket();
        else this._playBirdChirp();
      }
    }
  }

  _playTone({ freq, duration, type = 'sine', gain = 0.08, glideTo = null }) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + duration);
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  _playBirdChirp() {
    const base = 1800 + Math.random() * 800;
    this._playTone({ freq: base, glideTo: base * 1.4, duration: 0.12, gain: 0.05, type: 'sine' });
  }

  _playCricket() {
    this._playTone({ freq: 4200, duration: 0.05, gain: 0.03, type: 'square' });
  }

  playUiBlip() {
    this._playTone({ freq: 520, duration: 0.06, gain: 0.06 });
  }

  playCoin() {
    this._playTone({ freq: 880, glideTo: 1320, duration: 0.15, gain: 0.08 });
  }

  playMagicalChime() {
    if (!this.ctx || this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      setTimeout(() => this._playTone({ freq: f, duration: 0.9, gain: 0.09, type: 'triangle' }), i * 140);
    });
  }

  serialize() {
    return { muted: this.muted };
  }

  deserialize(data) {
    if (!data) return;
    this.setMuted(!!data.muted);
  }
}
