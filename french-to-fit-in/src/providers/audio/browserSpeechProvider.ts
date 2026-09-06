import type { AudioProvider, SpeakOptions, VoicePersona } from './AudioProvider';

const RATE_BY_DIFFICULTY: Record<string, number> = {
  CLEAN: 0.85,
  NATURAL: 1.0,
  CONNECTED_SPEECH: 1.05,
  ALTERNATE_SPEAKER: 1.0,
  NOISY: 1.05,
};

/**
 * Known French system-voice names, by the gender they present as, across the
 * platforms this PWA actually runs on (macOS/iOS Safari, Windows Edge/Chrome,
 * Android Chrome). SpeechSynthesisVoice never exposes gender directly, so
 * this is the only reliable way to tell "Thomas" from "Aurélie" -- an
 * unrecognized voice (most Android/Linux setups only ship one flat "Google
 * français") falls back to a pitch shift instead.
 */
const FEMININE_VOICE_HINTS = /amelie|amélie|aurelie|aurélie|audrey|marie|julie|hortense|virginie|celine|céline|chantal|manon|justine|charline|emma|elise|élise|alice|marion|sandra|denise|lea|léa|camille|female/i;
const MASCULINE_VOICE_HINTS = /thomas|nicolas|daniel|paul|henri|bruno|xavier|guillaume|mathieu|matthieu|yannick|antoine|jean|baptiste|male/i;

/** Fallback pitch when no persona-matching named voice exists on this device. */
const PITCH_BY_PERSONA: Record<VoicePersona, number> = {
  feminine: 1.05,
  masculine: 0.82,
};

function classifyVoice(voice: SpeechSynthesisVoice): VoicePersona | null {
  if (FEMININE_VOICE_HINTS.test(voice.name)) return 'feminine';
  if (MASCULINE_VOICE_HINTS.test(voice.name)) return 'masculine';
  return null;
}

function pickVoice(voices: SpeechSynthesisVoice[], persona: VoicePersona): SpeechSynthesisVoice | null {
  const french = voices.filter((v) => v.lang?.toLowerCase().startsWith('fr'));
  const matching = french.filter((v) => classifyVoice(v) === persona);
  // Prefer an on-device voice (lower latency, works offline) over a remote one.
  const best = matching.find((v) => v.localService) ?? matching[0];
  if (best) return best;
  // No voice classified for this persona -- any French voice at all, then
  // differentiate the two personas with pitch alone.
  return french.find((v) => v.localService) ?? french[0] ?? null;
}

export class BrowserSpeechProvider implements AudioProvider {
  private persona: VoicePersona = 'feminine';
  private voice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  setPersona(persona: VoicePersona): void {
    this.persona = persona;
    if (this.voicesLoaded) this.voice = pickVoice(window.speechSynthesis.getVoices(), persona);
  }

  private loadVoice(): void {
    if (!this.isSupported()) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;
    this.voice = pickVoice(voices, this.persona);
    this.voicesLoaded = true;
  }

  speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!this.isSupported()) return Promise.resolve();
    if (!this.voicesLoaded) this.loadVoice();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      if (this.voice) utterance.voice = this.voice;
      // A named voice already sounds like itself; only nudge pitch when we
      // fell back to an unclassified voice, so the two personas still differ.
      if (!this.voice || classifyVoice(this.voice) === null) {
        utterance.pitch = PITCH_BY_PERSONA[this.persona];
      }
      utterance.rate = options.rate ?? RATE_BY_DIFFICULTY[options.difficulty ?? 'NATURAL'] ?? 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.isSupported()) window.speechSynthesis.cancel();
  }
}
