import { useRef, useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAppMeta } from '../hooks/useAppMeta';
import { exportLearnerState, downloadLearnerStateAsFile, readLearnerStateFromFile, importLearnerState } from '../../storage/exportImport';
import { audioProvider } from '../../providers/audio';
import type { VoicePersona } from '../../providers/audio';
import { VOICE_PERSONAS } from '../../content/voicePersonas';
import './SettingsPage.css';

export function SettingsPage() {
  const { meta, patch } = useAppMeta();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  if (!meta) return null;

  async function handleExport() {
    const data = await exportLearnerState();
    downloadLearnerStateAsFile(data);
  }

  async function handleImportFile(file: File) {
    try {
      const data = await readLearnerStateFromFile(file);
      await importLearnerState(data);
      setImportMessage('Import successful — reload the app to see your restored progress.');
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Import failed.');
    }
  }

  function handleVoiceChange(persona: VoicePersona) {
    audioProvider.setPersona(persona);
    patch({ voicePersona: persona });
  }

  function handlePreviewVoice() {
    const option = VOICE_PERSONAS.find((p) => p.id === meta!.voicePersona) ?? VOICE_PERSONAS[0];
    audioProvider.speak(option.sampleText, { difficulty: 'NATURAL' });
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <Card className="settings-card">
        <h2>Narrator Voice</h2>
        <p>
          Choose who reads example sentences and audio prompts aloud. This uses your device's
          built-in French voices, so quality varies a little by device.
        </p>
        <div className="settings-voice-options" role="radiogroup" aria-label="Narrator voice">
          {VOICE_PERSONAS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={meta.voicePersona === option.id}
              className={`settings-voice-option ${meta.voicePersona === option.id ? 'settings-voice-option-selected' : ''}`}
              onClick={() => handleVoiceChange(option.id)}
            >
              <span className="settings-voice-name">{option.name}</span>
              <span className="settings-voice-description">{option.description}</span>
            </button>
          ))}
        </div>
        <Button variant="secondary" onClick={handlePreviewVoice}>
          Preview voice
        </Button>
      </Card>

      <Card className="settings-card">
        <h2>Pilot / Research Mode</h2>
        <p>Captures anonymized local interaction data (retrieval outcomes, response times, review activity) for the Pilot dashboard. Nothing leaves this device.</p>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={meta.pilotModeEnabled}
            onChange={(e) => patch({ pilotModeEnabled: e.target.checked })}
          />
          Enable Pilot Mode
        </label>
      </Card>

      <Card className="settings-card">
        <h2>Advanced</h2>
        <p>Preview every day in the Course Map ahead of schedule, before it's normally unlocked.</p>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={meta.curriculumPreviewEnabled}
            onChange={(e) => patch({ curriculumPreviewEnabled: e.target.checked })}
          />
          Unlock all days early
        </label>
      </Card>

      <Card className="settings-card">
        <h2>Learner Data</h2>
        <p>Export your full learning state as JSON, or import a previous export.</p>
        <div className="settings-actions">
          <Button onClick={handleExport}>Export JSON</Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="visually-hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
            }}
          />
        </div>
        {importMessage && <p className="settings-import-message">{importMessage}</p>}
      </Card>
    </div>
  );
}
