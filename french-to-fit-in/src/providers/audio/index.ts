import { BrowserSpeechProvider } from './browserSpeechProvider';
import type { AudioProvider } from './AudioProvider';

export const audioProvider: AudioProvider = new BrowserSpeechProvider();
export type { AudioProvider, SpeakOptions } from './AudioProvider';
