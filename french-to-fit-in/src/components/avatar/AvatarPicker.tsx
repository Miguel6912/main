import { AvatarSvg } from './AvatarSvg';
import { Button } from '../Button';
import {
  ANIMAL_FUR_COLORS,
  ANIMAL_SPECIES,
  EYE_COLORS,
  EYE_SHAPES,
  FACIAL_HAIR_OPTIONS,
  GLASSES_OPTIONS,
  HAIR_COLORS,
  HAIR_STYLES,
  HEADWEAR_OPTIONS,
  MOUTHS,
  SKIN_TONES,
} from '../../content/avatarOptions';
import { defaultAvatarConfig, randomAvatarConfig } from '../../engine/avatar';
import type {
  AnimalAvatarConfig,
  AvatarConfig,
  HumanAvatarConfig,
  StyleOption,
  SwatchOption,
} from '../../types/avatar';
import './AvatarPicker.css';

interface AvatarPickerProps {
  config: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

function SwatchGrid({
  options,
  selectedId,
  onSelect,
  label,
}: {
  options: SwatchOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <fieldset className="avatar-picker-field">
      <legend>{label}</legend>
      <div className="avatar-swatch-grid" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={opt.id === selectedId}
            className={`avatar-swatch ${opt.id === selectedId ? 'avatar-swatch-selected' : ''}`}
            style={{ background: opt.hex }}
            title={opt.label}
            onClick={() => onSelect(opt.id)}
          >
            <span className="visually-hidden">{opt.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function OptionGrid<T extends string>({
  options,
  selectedId,
  onSelect,
  label,
}: {
  options: StyleOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  label: string;
}) {
  return (
    <fieldset className="avatar-picker-field">
      <legend>{label}</legend>
      <div className="avatar-option-grid" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={opt.id === selectedId}
            className={`avatar-option-chip ${opt.id === selectedId ? 'avatar-option-chip-selected' : ''}`}
            onClick={() => onSelect(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function AvatarPicker({ config, onChange }: AvatarPickerProps) {
  const isHuman = config.kind === 'human';

  function patchHuman(patch: Partial<HumanAvatarConfig>) {
    if (config.kind !== 'human') return;
    onChange({ ...config, ...patch });
  }

  function patchAnimal(patch: Partial<AnimalAvatarConfig>) {
    if (config.kind !== 'animal') return;
    onChange({ ...config, ...patch });
  }

  return (
    <div className="avatar-picker">
      <div className="avatar-picker-preview">
        <AvatarSvg config={config} size={168} title="Your avatar" />
        <div className="avatar-picker-preview-actions">
          <Button variant="secondary" onClick={() => onChange(randomAvatarConfig())}>
            🎲 Surprise me
          </Button>
          <Button variant="ghost" onClick={() => onChange(defaultAvatarConfig())}>
            Reset
          </Button>
        </div>
      </div>

      <div className="avatar-picker-kind-toggle" role="tablist" aria-label="Avatar type">
        <button
          type="button"
          role="tab"
          aria-selected={isHuman}
          className={`avatar-kind-tab ${isHuman ? 'avatar-kind-tab-active' : ''}`}
          onClick={() => onChange(defaultAvatarConfig())}
        >
          🙂 Person
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isHuman}
          className={`avatar-kind-tab ${!isHuman ? 'avatar-kind-tab-active' : ''}`}
          onClick={() => onChange({ kind: 'animal', species: 'fox', furColorId: 'red', glasses: 'none' })}
        >
          🦊 Animal
        </button>
      </div>

      {config.kind === 'human' ? (
        <>
          <SwatchGrid options={SKIN_TONES} selectedId={config.skinToneId} label="Skin tone" onSelect={(id) => patchHuman({ skinToneId: id })} />
          <OptionGrid options={HAIR_STYLES} selectedId={config.hairStyle} label="Hair style" onSelect={(id) => patchHuman({ hairStyle: id })} />
          <SwatchGrid options={HAIR_COLORS} selectedId={config.hairColorId} label="Hair color" onSelect={(id) => patchHuman({ hairColorId: id })} />
          <OptionGrid options={EYE_SHAPES} selectedId={config.eyeShape} label="Eye shape" onSelect={(id) => patchHuman({ eyeShape: id })} />
          <SwatchGrid options={EYE_COLORS} selectedId={config.eyeColorId} label="Eye color" onSelect={(id) => patchHuman({ eyeColorId: id })} />
          <OptionGrid options={MOUTHS} selectedId={config.mouth} label="Expression" onSelect={(id) => patchHuman({ mouth: id })} />
          <OptionGrid options={HEADWEAR_OPTIONS} selectedId={config.headwear} label="Headwear" onSelect={(id) => patchHuman({ headwear: id })} />
          <OptionGrid options={GLASSES_OPTIONS} selectedId={config.glasses} label="Glasses" onSelect={(id) => patchHuman({ glasses: id })} />
          <OptionGrid options={FACIAL_HAIR_OPTIONS} selectedId={config.facialHair} label="Facial hair" onSelect={(id) => patchHuman({ facialHair: id })} />
          <label className="avatar-freckles-toggle">
            <input type="checkbox" checked={config.freckles} onChange={(e) => patchHuman({ freckles: e.target.checked })} />
            Freckles
          </label>
        </>
      ) : (
        <>
          <OptionGrid
            options={ANIMAL_SPECIES}
            selectedId={config.species}
            label="Species"
            onSelect={(id) => patchAnimal({ species: id, furColorId: ANIMAL_FUR_COLORS[id][0].id })}
          />
          <SwatchGrid
            options={ANIMAL_FUR_COLORS[config.species]}
            selectedId={config.furColorId}
            label="Fur / feather color"
            onSelect={(id) => patchAnimal({ furColorId: id })}
          />
          <OptionGrid options={GLASSES_OPTIONS} selectedId={config.glasses} label="Glasses" onSelect={(id) => patchAnimal({ glasses: id })} />
        </>
      )}
    </div>
  );
}
