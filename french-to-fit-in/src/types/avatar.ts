/**
 * Customizable avatar system. Two "kinds" -- a human face builder (skin
 * tone, hair texture/style/color, eye shape/color, headwear, glasses,
 * facial hair, freckles) and an animal builder (species + fur/feather
 * color) -- so nobody is forced into a human likeness if they'd rather
 * not be. Every enum here is deliberately broad; see content/avatarOptions.ts
 * for the actual swatches/labels.
 */

export type AvatarKind = 'human' | 'animal';

export type HairStyle =
  | 'bald'
  | 'buzz'
  | 'shortCrop'
  | 'pixie'
  | 'bob'
  | 'waves'
  | 'longStraight'
  | 'longCurly'
  | 'afro'
  | 'braids'
  | 'bun'
  | 'ponytail';

export type EyeShape = 'almond' | 'round' | 'monolid';

export type Mouth = 'smile' | 'grin' | 'neutral';

export type Headwear = 'none' | 'beanie' | 'headscarf' | 'flowerCrown';

export type Glasses = 'none' | 'round' | 'square' | 'catEye';

export type FacialHair = 'none' | 'stubble' | 'mustache' | 'goatee' | 'shortBeard' | 'fullBeard';

export type AnimalSpecies = 'fox' | 'deer' | 'owl' | 'rabbit' | 'bear' | 'cat';

export interface HumanAvatarConfig {
  kind: 'human';
  skinToneId: string;
  hairColorId: string;
  hairStyle: HairStyle;
  eyeShape: EyeShape;
  eyeColorId: string;
  mouth: Mouth;
  headwear: Headwear;
  glasses: Glasses;
  facialHair: FacialHair;
  freckles: boolean;
}

export interface AnimalAvatarConfig {
  kind: 'animal';
  species: AnimalSpecies;
  furColorId: string;
  glasses: Glasses;
}

export type AvatarConfig = HumanAvatarConfig | AnimalAvatarConfig;

export interface SwatchOption {
  id: string;
  label: string;
  hex: string;
}

export interface StyleOption<T extends string> {
  id: T;
  label: string;
}
