import type { AudioDifficulty } from '../../types/curriculum';

export interface SpeakOptions {
  difficulty?: AudioDifficulty;
  /** Playback rate multiplier; NATURAL/CONNECTED_SPEECH read faster, CLEAN slower. */
  rate?: number;
}

/**
 * Pluggable audio abstraction. The MVP implementation uses the browser's
 * SpeechSynthesis API; a premium/native-recording or external-TTS provider
 * can replace it later by implementing this same interface -- no caller
 * elsewhere in the app needs to change.
 */
export interface AudioProvider {
  isSupported(): boolean;
  speak(text: string, options?: SpeakOptions): Promise<void>;
  stop(): void;
}
