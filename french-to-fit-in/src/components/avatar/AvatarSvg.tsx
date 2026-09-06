import {
  renderEyesAndBrows,
  renderFace,
  renderFacialHair,
  renderFreckles,
  renderGlasses,
  renderHair,
  renderHeadwear,
  renderMouth,
} from './svgParts/humanParts';
import { renderAnimal } from './svgParts/animalParts';
import { getSwatch } from '../../content/avatarOptions';
import { EYE_COLORS, HAIR_COLORS, SKIN_TONES, ANIMAL_FUR_COLORS } from '../../content/avatarOptions';
import type { AvatarConfig } from '../../types/avatar';

interface AvatarSvgProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  title?: string;
}

/** Renders any AvatarConfig (human or animal) as a self-contained SVG. */
export function AvatarSvg({ config, size = 96, className, title }: AvatarSvgProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? 'Avatar'}
    >
      <circle cx={100} cy={100} r={98} fill="var(--accent-soft)" />
      {config.kind === 'human' ? <HumanAvatarBody config={config} /> : <AnimalAvatarBody config={config} />}
    </svg>
  );
}

function HumanAvatarBody({ config }: { config: Extract<AvatarConfig, { kind: 'human' }> }) {
  const skin = getSwatch(SKIN_TONES, config.skinToneId).hex;
  const hair = getSwatch(HAIR_COLORS, config.hairColorId).hex;
  const eyeColor = getSwatch(EYE_COLORS, config.eyeColorId).hex;

  return (
    <>
      {renderHair(config.hairStyle, hair)}
      {renderFace(skin)}
      {renderEyesAndBrows(config.eyeShape, eyeColor, hair)}
      {renderMouth(config.mouth)}
      {config.freckles && renderFreckles()}
      {renderFacialHair(config.facialHair, hair)}
      {renderGlasses(config.glasses)}
      {renderHeadwear(config.headwear, hair)}
    </>
  );
}

function AnimalAvatarBody({ config }: { config: Extract<AvatarConfig, { kind: 'animal' }> }) {
  const fur = getSwatch(ANIMAL_FUR_COLORS[config.species], config.furColorId).hex;
  return (
    <>
      {renderAnimal(config.species, fur)}
      {renderGlasses(config.glasses)}
    </>
  );
}
