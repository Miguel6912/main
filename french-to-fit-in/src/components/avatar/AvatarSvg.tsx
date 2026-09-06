import { useId } from 'react';
import {
  renderEyesAndBrows,
  renderFace,
  renderFacialHair,
  renderFreckles,
  renderGlasses,
  renderHair,
  renderHeadwear,
  renderMouth,
  renderShoulders,
} from './svgParts/humanParts';
import { renderAnimal } from './svgParts/animalParts';
import { RIM } from './svgParts/style';
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
  const clipId = useId();
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? 'Avatar'}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={100} cy={100} r={98} />
        </clipPath>
      </defs>
      <circle cx={100} cy={100} r={98} fill="var(--accent-soft)" stroke={RIM} strokeWidth={4} />
      <circle cx={26} cy={26} r={5} fill={RIM} opacity={0.8} />
      <circle cx={174} cy={26} r={6} fill={RIM} opacity={0.8} />
      <circle cx={174} cy={174} r={4} fill={RIM} opacity={0.7} />
      <circle cx={26} cy={174} r={4} fill={RIM} opacity={0.7} />
      <g clipPath={`url(#${clipId})`}>
        {config.kind === 'human' ? <HumanAvatarBody config={config} /> : <AnimalAvatarBody config={config} />}
      </g>
    </svg>
  );
}

function HumanAvatarBody({ config }: { config: Extract<AvatarConfig, { kind: 'human' }> }) {
  const skin = getSwatch(SKIN_TONES, config.skinToneId).hex;
  const hair = getSwatch(HAIR_COLORS, config.hairColorId).hex;
  const eyeColor = getSwatch(EYE_COLORS, config.eyeColorId).hex;

  return (
    <>
      {renderShoulders()}
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
