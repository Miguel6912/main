import type { AudioProvider, SpeakOptions } from './AudioProvider';

const RATE_BY_DIFFICULTY: Record<string, number> = {
  CLEAN: 0.85,
  NATURAL: 1.0,
  CONNECTED_SPEECH: 1.05,
  ALTERNATE_SPEAKER: 1.0,
  NOISY: 1.05,
};

export class BrowserSpeechProvider implements AudioProvider {
  private voice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  private loadVoice(): void {
    if (this.voicesLoaded || !this.isSupported()) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;
    this.voice = voices.find((v) => v.lang?.toLowerCase().startsWith('fr')) ?? null;
    this.voicesLoaded = true;
  }

  speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!this.isSupported()) return Promise.resolve();
    this.loadVoice();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      if (this.voice) utterance.voice = this.voice;
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
