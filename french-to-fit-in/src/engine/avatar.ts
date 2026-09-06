import {
  ANIMAL_FUR_COLORS,
  ANIMAL_SPECIES,
  EYE_COLORS,
  EYE_SHAPES,
  FACIAL_HAIR_OPTIONS,
  HAIR_COLORS,
  HAIR_STYLES,
  HEADWEAR_OPTIONS,
  GLASSES_OPTIONS,
  MOUTHS,
  SKIN_TONES,
} from '../content/avatarOptions';
import type { AvatarConfig } from '../types/avatar';

export function defaultAvatarConfig(): AvatarConfig {
  return {
    kind: 'human',
    skinToneId: 'tan',
    hairColorId: 'brown',
    hairStyle: 'waves',
    eyeShape: 'almond',
    eyeColorId: 'brown',
    mouth: 'smile',
    headwear: 'none',
    glasses: 'none',
    facialHair: 'none',
    freckles: false,
  };
}

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomAvatarConfig(): AvatarConfig {
  if (Math.random() < 0.25) {
    const species = pick(ANIMAL_SPECIES).id;
    return {
      kind: 'animal',
      species,
      furColorId: pick(ANIMAL_FUR_COLORS[species]).id,
      glasses: Math.random() < 0.2 ? pick(GLASSES_OPTIONS.filter((g) => g.id !== 'none')).id : 'none',
    };
  }
  return {
    kind: 'human',
    skinToneId: pick(SKIN_TONES).id,
    hairColorId: pick(HAIR_COLORS).id,
    hairStyle: pick(HAIR_STYLES).id,
    eyeShape: pick(EYE_SHAPES).id,
    eyeColorId: pick(EYE_COLORS).id,
    mouth: pick(MOUTHS).id,
    headwear: Math.random() < 0.25 ? pick(HEADWEAR_OPTIONS.filter((h) => h.id !== 'none')).id : 'none',
    glasses: Math.random() < 0.3 ? pick(GLASSES_OPTIONS.filter((g) => g.id !== 'none')).id : 'none',
    facialHair: Math.random() < 0.3 ? pick(FACIAL_HAIR_OPTIONS.filter((f) => f.id !== 'none')).id : 'none',
    freckles: Math.random() < 0.3,
  };
}
