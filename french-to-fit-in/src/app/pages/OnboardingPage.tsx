import { useState } from 'react';
import { Button } from '../../components/Button';
import { AvatarPicker } from '../../components/avatar/AvatarPicker';
import { AvatarSvg } from '../../components/avatar/AvatarSvg';
import { audioProvider } from '../../providers/audio';
import type { VoicePersona } from '../../providers/audio';
import { VOICE_PERSONAS } from '../../content/voicePersonas';
import { useAppMeta } from '../hooks/useAppMeta';
import './OnboardingPage.css';

const STEPS = ['welcome', 'name', 'avatar', 'voice', 'ready'] as const;
type Step = (typeof STEPS)[number];

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const { meta, patch } = useAppMeta();
  const [stepIndex, setStepIndex] = useState(0);

  if (!meta) return null;

  const step: Step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleVoiceChange(persona: VoicePersona) {
    audioProvider.setPersona(persona);
    patch({ voicePersona: persona });
  }

  function handlePreviewVoice() {
    const option = VOICE_PERSONAS.find((p) => p.id === meta!.voicePersona) ?? VOICE_PERSONAS[0];
    audioProvider.speak(option.sampleText, { difficulty: 'NATURAL' });
  }

  async function finish() {
    await patch({ onboardingCompleted: true });
    onComplete();
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s} className={`onboarding-dot ${i === stepIndex ? 'onboarding-dot-active' : ''} ${i < stepIndex ? 'onboarding-dot-done' : ''}`} />
          ))}
        </div>

        {step === 'welcome' && (
          <div className="onboarding-step">
            <p className="onboarding-wordmark">French to Fit In<span className="onboarding-wordmark-tm">&trade;</span></p>
            <h1>Bienvenue.</h1>
            <p className="onboarding-body">
              This isn't a grammar course or a vocabulary app. Over 30 days, we'll build just
              enough real French that you can stay inside a conversation -- instead of quietly
              switching back to English the moment it gets hard.
            </p>
            <p className="onboarding-body">First, let's set a few things up.</p>
          </div>
        )}

        {step === 'name' && (
          <div className="onboarding-step">
            <h1>What should we call you?</h1>
            <p className="onboarding-body">This is just for your own profile -- entirely optional.</p>
            <input
              type="text"
              className="onboarding-name-input"
              value={meta.displayName}
              maxLength={24}
              placeholder="Your name"
              onChange={(e) => patch({ displayName: e.target.value })}
              autoFocus
            />
          </div>
        )}

        {step === 'avatar' && (
          <div className="onboarding-step">
            <h1>Build your avatar</h1>
            <p className="onboarding-body">Make it yours -- or go for a fox, deer, or owl instead.</p>
            <AvatarPicker config={meta.avatarConfig} onChange={(avatarConfig) => patch({ avatarConfig })} />
          </div>
        )}

        {step === 'voice' && (
          <div className="onboarding-step">
            <h1>Choose your narrator</h1>
            <p className="onboarding-body">Who should read example sentences and prompts aloud?</p>
            <div className="onboarding-voice-options" role="radiogroup" aria-label="Narrator voice">
              {VOICE_PERSONAS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={meta.voicePersona === option.id}
                  className={`onboarding-voice-option ${meta.voicePersona === option.id ? 'onboarding-voice-option-selected' : ''}`}
                  onClick={() => handleVoiceChange(option.id)}
                >
                  <span className="onboarding-voice-name">{option.name}</span>
                  <span className="onboarding-voice-description">{option.description}</span>
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={handlePreviewVoice}>
              Preview voice
            </Button>
          </div>
        )}

        {step === 'ready' && (
          <div className="onboarding-step onboarding-ready">
            <AvatarSvg config={meta.avatarConfig} size={120} title="Your avatar" />
            <h1>{meta.displayName ? `You're all set, ${meta.displayName}!` : "You're all set!"}</h1>
            <p className="onboarding-body">Day 1 is ready whenever you are.</p>
          </div>
        )}

        <div className="onboarding-actions">
          {!isFirst && (
            <Button variant="ghost" onClick={goBack}>
              Back
            </Button>
          )}
          <div className="onboarding-actions-spacer" />
          {isLast ? (
            <Button onClick={finish}>Start Day 1</Button>
          ) : (
            <Button onClick={goNext}>{step === 'welcome' ? "Let's go" : 'Continue'}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
