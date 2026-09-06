import type { VoicePersona } from '../providers/audio';

export interface VoicePersonaOption {
  id: VoicePersona;
  name: string;
  description: string;
  /** Spoken by the "Preview voice" button; grammatically agrees with the persona. */
  sampleText: string;
}

export const VOICE_PERSONAS: VoicePersonaOption[] = [
  {
    id: 'feminine',
    name: 'Camille',
    description: 'Warm, chic Parisian delivery.',
    sampleText: 'Bonjour, je suis ravie de vous accompagner.',
  },
  {
    id: 'masculine',
    name: 'Jean-Baptiste',
    description: 'Classic, distinctly masculine delivery.',
    sampleText: 'Bonjour, je suis ravi de vous accompagner.',
  },
];
