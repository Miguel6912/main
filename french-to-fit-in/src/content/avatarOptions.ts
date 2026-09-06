/**
 * Avatar option content: every swatch and named style. Deliberately broad
 * on skin tone and hair texture/style so the builder doesn't quietly imply
 * a "default" identity. All hex values are hand-picked, not a formula.
 */
import type {
  AnimalSpecies,
  EyeShape,
  FacialHair,
  Glasses,
  HairStyle,
  Headwear,
  Mouth,
  StyleOption,
  SwatchOption,
} from '../types/avatar';

export const SKIN_TONES: SwatchOption[] = [
  { id: 'porcelain', label: 'Porcelain', hex: '#fde3d0' },
  { id: 'fair', label: 'Fair', hex: '#f5d0ae' },
  { id: 'light', label: 'Light', hex: '#eec298' },
  { id: 'light-tan', label: 'Light Tan', hex: '#e0ac7d' },
  { id: 'medium', label: 'Medium', hex: '#c68863' },
  { id: 'tan', label: 'Tan', hex: '#b27a52' },
  { id: 'brown', label: 'Brown', hex: '#96603f' },
  { id: 'deep-brown', label: 'Deep Brown', hex: '#7a4a2e' },
  { id: 'espresso', label: 'Espresso', hex: '#5c3520' },
  { id: 'ebony', label: 'Ebony', hex: '#3b2114' },
];

export const HAIR_COLORS: SwatchOption[] = [
  { id: 'black', label: 'Black', hex: '#1c1410' },
  { id: 'dark-brown', label: 'Dark Brown', hex: '#3b2718' },
  { id: 'brown', label: 'Brown', hex: '#5c3d25' },
  { id: 'chestnut', label: 'Chestnut', hex: '#7a4a2e' },
  { id: 'auburn', label: 'Auburn', hex: '#8b3a2b' },
  { id: 'copper', label: 'Copper', hex: '#b5541f' },
  { id: 'blonde', label: 'Blonde', hex: '#d4a857' },
  { id: 'platinum', label: 'Platinum', hex: '#e8d5a8' },
  { id: 'silver', label: 'Silver', hex: '#a8a29a' },
  { id: 'white', label: 'White', hex: '#efe9df' },
  { id: 'rose', label: 'Rose', hex: '#d98ba8' },
  { id: 'teal', label: 'Teal', hex: '#4a8b96' },
];

export const EYE_COLORS: SwatchOption[] = [
  { id: 'deep-brown', label: 'Deep Brown', hex: '#3b2417' },
  { id: 'brown', label: 'Brown', hex: '#6b4226' },
  { id: 'hazel', label: 'Hazel', hex: '#8a7040' },
  { id: 'green', label: 'Green', hex: '#5b7a4f' },
  { id: 'blue', label: 'Blue', hex: '#4a7a96' },
  { id: 'gray', label: 'Gray', hex: '#8b9096' },
];

export const HAIR_STYLES: StyleOption<HairStyle>[] = [
  { id: 'bald', label: 'Bald' },
  { id: 'buzz', label: 'Buzz Cut' },
  { id: 'shortCrop', label: 'Short Crop' },
  { id: 'pixie', label: 'Pixie' },
  { id: 'bob', label: 'Bob' },
  { id: 'waves', label: 'Shoulder Waves' },
  { id: 'longStraight', label: 'Long Straight' },
  { id: 'longCurly', label: 'Long Curly' },
  { id: 'afro', label: 'Afro' },
  { id: 'braids', label: 'Braids' },
  { id: 'bun', label: 'Bun' },
  { id: 'ponytail', label: 'Ponytail' },
];

export const EYE_SHAPES: StyleOption<EyeShape>[] = [
  { id: 'almond', label: 'Almond' },
  { id: 'round', label: 'Round' },
  { id: 'monolid', label: 'Monolid' },
];

export const MOUTHS: StyleOption<Mouth>[] = [
  { id: 'smile', label: 'Smile' },
  { id: 'grin', label: 'Grin' },
  { id: 'neutral', label: 'Neutral' },
];

export const HEADWEAR_OPTIONS: StyleOption<Headwear>[] = [
  { id: 'none', label: 'None' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'headscarf', label: 'Headscarf' },
  { id: 'flowerCrown', label: 'Flower Crown' },
];

export const GLASSES_OPTIONS: StyleOption<Glasses>[] = [
  { id: 'none', label: 'None' },
  { id: 'round', label: 'Round' },
  { id: 'square', label: 'Square' },
  { id: 'catEye', label: 'Cat-Eye' },
];

export const FACIAL_HAIR_OPTIONS: StyleOption<FacialHair>[] = [
  { id: 'none', label: 'None' },
  { id: 'stubble', label: 'Stubble' },
  { id: 'mustache', label: 'Mustache' },
  { id: 'goatee', label: 'Goatee' },
  { id: 'shortBeard', label: 'Short Beard' },
  { id: 'fullBeard', label: 'Full Beard' },
];

export const ANIMAL_SPECIES: StyleOption<AnimalSpecies>[] = [
  { id: 'fox', label: 'Fox' },
  { id: 'deer', label: 'Deer' },
  { id: 'owl', label: 'Owl' },
  { id: 'rabbit', label: 'Rabbit' },
  { id: 'bear', label: 'Bear' },
  { id: 'cat', label: 'Cat' },
];

export const ANIMAL_FUR_COLORS: Record<AnimalSpecies, SwatchOption[]> = {
  fox: [
    { id: 'red', label: 'Red', hex: '#c1502f' },
    { id: 'cinnamon', label: 'Cinnamon', hex: '#a8672f' },
    { id: 'golden', label: 'Golden', hex: '#d9a441' },
    { id: 'silver', label: 'Silver', hex: '#9a9691' },
    { id: 'arctic', label: 'Arctic', hex: '#eef0ee' },
    { id: 'charcoal', label: 'Charcoal', hex: '#4a4441' },
  ],
  deer: [
    { id: 'fawn', label: 'Fawn', hex: '#c68f5e' },
    { id: 'chestnut', label: 'Chestnut', hex: '#8b5a34' },
    { id: 'gray', label: 'Gray', hex: '#a39a8c' },
    { id: 'cream', label: 'Cream', hex: '#e8d9bd' },
    { id: 'dark-brown', label: 'Dark Brown', hex: '#5c3f28' },
    { id: 'reddish', label: 'Reddish', hex: '#a8643f' },
  ],
  owl: [
    { id: 'tawny', label: 'Tawny', hex: '#9a6a3c' },
    { id: 'snowy', label: 'Snowy', hex: '#f3efe4' },
    { id: 'gray', label: 'Gray', hex: '#8b857c' },
    { id: 'barred', label: 'Barred Brown', hex: '#6b4c30' },
    { id: 'golden', label: 'Golden', hex: '#c99b4a' },
    { id: 'charcoal', label: 'Charcoal', hex: '#443d36' },
  ],
  rabbit: [
    { id: 'white', label: 'White', hex: '#f5f1e8' },
    { id: 'gray', label: 'Gray', hex: '#a8a29a' },
    { id: 'brown', label: 'Brown', hex: '#8b6039' },
    { id: 'black', label: 'Black', hex: '#3a332e' },
    { id: 'caramel', label: 'Caramel', hex: '#c98f4e' },
    { id: 'spotted', label: 'Spotted', hex: '#c9a877' },
  ],
  bear: [
    { id: 'brown', label: 'Brown', hex: '#7a5233' },
    { id: 'black', label: 'Black', hex: '#332a24' },
    { id: 'cinnamon', label: 'Cinnamon', hex: '#a05f34' },
    { id: 'honey', label: 'Honey Blonde', hex: '#c99a54' },
    { id: 'gray', label: 'Gray', hex: '#8b857c' },
    { id: 'polar', label: 'Polar White', hex: '#f0eee6' },
  ],
  cat: [
    { id: 'orange', label: 'Orange Tabby', hex: '#cc8a3d' },
    { id: 'black', label: 'Black', hex: '#332e2b' },
    { id: 'white', label: 'White', hex: '#f5f2ea' },
    { id: 'gray', label: 'Gray', hex: '#938f89' },
    { id: 'cream', label: 'Cream', hex: '#e8d3ab' },
    { id: 'brown', label: 'Brown Patch', hex: '#8b5a34' },
  ],
};

export function getSwatch(list: SwatchOption[], id: string): SwatchOption {
  return list.find((s) => s.id === id) ?? list[0];
}
