import type { ReactNode } from 'react';
import type { EyeShape, FacialHair, Glasses, HairStyle, Headwear, Mouth } from '../../../types/avatar';
import { OUTLINE, OUTLINE_THIN, OUTLINE_WIDTH, RIM, darken, inkStroke } from './style';

/**
 * All human-avatar shapes on a shared 200x200 canvas. Drawing order (see
 * AvatarSvg.tsx): shoulders (back) -> hair -> ears -> face -> features ->
 * facial hair -> glasses -> headwear. Hair/headwear/shoulder shapes are
 * drawn larger than the face path and rely on the face being painted on top
 * to leave the correct silhouette showing -- no clip-paths needed.
 *
 * Flat-portrait styling: a thick ink outline on face/features/clothing, but
 * hair uses a bright amber RIM outline instead of ink (see style.tsx) --
 * that two-tone linework plus solid (not ringed) eyes is the signature look.
 */

export const FACE_ELLIPSE = { cx: 100, cy: 110, rx: 52, ry: 65 };

const FACE_PATH =
  'M100,46 C72,46 50,66 49,98 C48,122 55,142 70,158 C80,168 90,174 100,178 C110,174 120,168 130,158 C145,142 152,122 151,98 C150,66 128,46 100,46 Z';

export function renderFace(skinHex: string): ReactNode {
  const jawShadow = darken(skinHex, 22);
  const innerEar = darken(skinHex, 18);
  const blush = '#e2839a';
  return (
    <>
      <ellipse cx={47} cy={114} rx={7.5} ry={13.5} fill={skinHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      <ellipse cx={153} cy={114} rx={7.5} ry={13.5} fill={skinHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      <ellipse cx={47} cy={117} rx={3.2} ry={7} fill={innerEar} />
      <ellipse cx={153} cy={117} rx={3.2} ry={7} fill={innerEar} />
      <path d={FACE_PATH} fill={skinHex} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round" />
      <ellipse cx={100} cy={157} rx={20} ry={7} fill={jawShadow} opacity={0.45} />
      <ellipse cx={69} cy={127} rx={10} ry={6.5} fill={blush} opacity={0.4} />
      <ellipse cx={131} cy={127} rx={10} ry={6.5} fill={blush} opacity={0.4} />
    </>
  );
}

const SHIRT = '#3f5449';
const COLLAR = '#f5f1e6';

/** Neck + shoulders + a simple collar, drawn behind the hair/face so the
 * portrait reads as a bust, not a floating head -- see the reference style. */
export function renderShoulders(): ReactNode {
  const shadow = darken(SHIRT, 22);
  return (
    <>
      <ellipse cx={100} cy={233} rx={90} ry={74} fill={SHIRT} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
      <ellipse cx={137} cy={220} rx={30} ry={56} fill={shadow} opacity={0.4} />
      <path d="M100,163 L81,183 L100,199 L119,183 Z" fill={COLLAR} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
    </>
  );
}

function capShadow(colorHex: string): ReactNode {
  return <ellipse cx={128} cy={101} rx={17} ry={30} fill={darken(colorHex, 32)} />;
}

function braidSegments(x: number, colorHex: string, taper = 1): ReactNode {
  const ys = [112, 132, 152, 172];
  return (
    <>
      {ys.map((y, i) => (
        <ellipse
          key={y}
          cx={x}
          cy={y}
          rx={9 - i * taper}
          ry={13}
          fill={i % 2 === 1 ? darken(colorHex, 16) : colorHex}
          stroke={RIM}
          strokeWidth={OUTLINE_THIN}
        />
      ))}
    </>
  );
}

export function renderHair(style: HairStyle, colorHex: string): ReactNode {
  const outline = { stroke: RIM, strokeWidth: OUTLINE_WIDTH, strokeLinejoin: 'round' as const };

  switch (style) {
    case 'bald':
      return (
        <>
          <ellipse cx={82} cy={64} rx={13} ry={6} fill="#ffffff" opacity={0.28} />
          <ellipse cx={102} cy={53} rx={7} ry={4} fill="#ffffff" opacity={0.18} />
        </>
      );

    case 'buzz':
      return (
        <>
          <ellipse cx={100} cy={92} rx={55} ry={56} fill={colorHex} {...outline} />
          {capShadow(colorHex)}
        </>
      );

    case 'shortCrop':
      return (
        <>
          <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} {...outline} />
          {capShadow(colorHex)}
        </>
      );

    case 'pixie':
      return (
        <>
          <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} {...outline} />
          <ellipse cx={140} cy={98} rx={16} ry={22} fill={colorHex} {...outline} />
          {capShadow(colorHex)}
        </>
      );

    case 'bob':
      return (
        <>
          <path
            d="M45,95 C45,58 69,40 100,40 C131,40 155,58 155,95 L155,152 C155,160 147,164 138,164 L62,164 C53,164 45,160 45,152 Z"
            fill={colorHex}
            {...outline}
          />
          <ellipse cx={132} cy={124} rx={13} ry={28} fill={darken(colorHex, 30)} />
        </>
      );

    case 'waves':
      return (
        <>
          <path
            d="M45,95 C45,58 69,40 100,40 C131,40 155,58 155,95 L156,150 C160,158 152,164 144,160 C140,172 128,168 126,160 C122,172 108,168 108,158 C104,170 92,168 92,158 C90,168 78,172 74,160 C72,168 60,172 56,160 C48,164 40,158 44,150 Z"
            fill={colorHex}
            {...outline}
          />
          <ellipse cx={134} cy={118} rx={12} ry={28} fill={darken(colorHex, 30)} />
        </>
      );

    case 'longStraight':
      return (
        <>
          <path
            d="M45,95 C45,58 69,40 100,40 C131,40 155,58 155,95 L155,190 C155,196 147,198 145,192 L143,150 L107,150 L106,192 C105,198 97,198 96,192 L94,150 L57,150 L55,192 C53,198 45,196 45,190 Z"
            fill={colorHex}
            {...outline}
          />
          <ellipse cx={130} cy={140} rx={11} ry={34} fill={darken(colorHex, 30)} />
        </>
      );

    case 'longCurly':
      return (
        <>
          <path
            d="M42,98 C38,60 66,38 100,38 C134,38 162,60 158,98 C168,104 170,118 162,124 C170,132 168,146 158,150 C166,158 162,172 150,172 C154,182 144,192 134,186 C132,196 118,198 112,190 C106,198 94,198 88,190 C82,198 68,196 66,186 C56,192 46,182 50,172 C38,172 34,158 42,150 C32,146 30,132 38,124 C30,118 32,104 42,98 Z"
            fill={colorHex}
            {...outline}
          />
          <ellipse cx={132} cy={130} rx={14} ry={32} fill={darken(colorHex, 30)} />
        </>
      );

    case 'afro':
      return (
        <>
          <circle cx={100} cy={92} r={72} fill={colorHex} {...outline} />
          <ellipse cx={140} cy={112} rx={22} ry={40} fill={darken(colorHex, 30)} />
        </>
      );

    case 'braids':
      return (
        <>
          <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} {...outline} />
          {braidSegments(58, colorHex)}
          {braidSegments(142, colorHex)}
          {capShadow(colorHex)}
        </>
      );

    case 'bun':
      return (
        <>
          <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} {...outline} />
          <circle cx={100} cy={36} r={17} fill={colorHex} {...outline} />
          <circle cx={94} cy={31} r={5} fill={darken(colorHex, 25)} />
          {capShadow(colorHex)}
        </>
      );

    case 'ponytail':
      return (
        <>
          <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} {...outline} />
          <path
            d="M138,82 C160,80 176,100 172,126 C170,148 154,160 144,154 C150,130 148,104 138,82 Z"
            fill={colorHex}
            {...outline}
          />
          <ellipse cx={160} cy={118} rx={8} ry={22} fill={darken(colorHex, 28)} />
          {capShadow(colorHex)}
        </>
      );

    default:
      return null;
  }
}

function eyeShapePair(shape: EyeShape, colorHex: string): ReactNode {
  const leftX = 78;
  const rightX = 122;
  const y = 106;

  if (shape === 'round') {
    return (
      <>
        {[leftX, rightX].map((x) => (
          <g key={x}>
            <circle cx={x} cy={y} r={10} fill={colorHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
            <circle cx={x} cy={y} r={5} fill="#150d08" />
            <circle cx={x - 3} cy={y - 3} r={1.8} fill="#ffffff" />
          </g>
        ))}
      </>
    );
  }

  if (shape === 'monolid') {
    return (
      <>
        {[leftX, rightX].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={y} rx={10} ry={6} fill={colorHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
            <circle cx={x} cy={y} r={3.2} fill="#150d08" />
            <circle cx={x - 2} cy={y - 1.4} r={1.2} fill="#ffffff" />
          </g>
        ))}
      </>
    );
  }

  // almond (default)
  return (
    <>
      {[leftX, rightX].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={9.5} ry={11} fill={colorHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
          <circle cx={x} cy={y} r={4.4} fill="#150d08" />
          <circle cx={x - 2.4} cy={y - 2.6} r={1.7} fill="#ffffff" />
        </g>
      ))}
    </>
  );
}

export function renderEyesAndBrows(shape: EyeShape, eyeColorHex: string, browHex: string): ReactNode {
  return (
    <>
      {inkStroke('M65,84 L94,79', browHex, 5.5)}
      {inkStroke('M106,79 L135,84', browHex, 5.5)}
      {eyeShapePair(shape, eyeColorHex)}
      <path d="M97,110 Q93,123 100,126" stroke="#00000035" strokeWidth={2.4} fill="none" strokeLinecap="round" />
    </>
  );
}

export function renderMouth(mouth: Mouth): ReactNode {
  if (mouth === 'grin') {
    return (
      <>
        <path d="M79,137 Q100,162 121,137 Q100,151 79,137 Z" fill="#ffffff" stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" />
        <path d="M84,140 Q100,148 116,140" stroke={OUTLINE} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.5} />
      </>
    );
  }
  if (mouth === 'neutral') {
    return <>{inkStroke('M83,141 Q100,145 117,141', '#7a3d2e', 3.6)}</>;
  }
  return <>{inkStroke('M79,136 Q100,159 121,136', '#7a3d2e', 3.6)}</>;
}

export function renderFreckles(): ReactNode {
  const dots = [
    [72, 118],
    [78, 123],
    [85, 120],
    [115, 120],
    [122, 123],
    [128, 118],
  ];
  return (
    <>
      {dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill="#8a5a3c" opacity={0.6} />
      ))}
    </>
  );
}

export function renderFacialHair(style: FacialHair, colorHex: string): ReactNode {
  if (style === 'none') return null;

  if (style === 'mustache') {
    return <path d="M83,130 Q100,125 117,130 Q100,137 83,130 Z" fill={colorHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />;
  }

  if (style === 'goatee') {
    return (
      <>
        <path d="M83,130 Q100,125 117,130 Q100,137 83,130 Z" fill={colorHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
        <path d="M89,142 Q100,170 111,142 Q100,151 89,142 Z" fill={colorHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
      </>
    );
  }

  if (style === 'stubble') {
    return (
      <path
        d="M52,120 C52,148 72,168 100,168 C128,168 148,148 148,120 L148,132 C148,155 128,172 100,172 C72,172 52,155 52,132 Z"
        fill={colorHex}
        opacity={0.3}
      />
    );
  }

  if (style === 'shortBeard') {
    return (
      <path
        d="M52,118 C52,148 72,170 100,170 C128,170 148,148 148,118 L148,134 C148,158 128,175 100,175 C72,175 52,158 52,134 Z"
        fill={colorHex}
        stroke={OUTLINE}
        strokeWidth={OUTLINE_THIN}
        strokeLinejoin="round"
      />
    );
  }

  // fullBeard
  return (
    <path
      d="M48,110 C46,146 68,178 100,178 C132,178 154,146 152,110 L152,130 C152,162 128,182 100,182 C72,182 48,162 48,130 Z"
      fill={colorHex}
      stroke={OUTLINE}
      strokeWidth={OUTLINE_THIN}
      strokeLinejoin="round"
    />
  );
}

export function renderGlasses(style: Glasses): ReactNode {
  if (style === 'none') return null;

  if (style === 'round') {
    return (
      <g fill="none" stroke={OUTLINE} strokeWidth={2.8} strokeLinecap="round">
        <circle cx={78} cy={105} r={16} />
        <circle cx={122} cy={105} r={16} />
        <path d="M94,103 L106,103" />
        <path d="M62,100 L50,96" />
        <path d="M138,100 L150,96" />
      </g>
    );
  }

  if (style === 'square') {
    return (
      <g fill="none" stroke={OUTLINE} strokeWidth={2.8} strokeLinecap="round">
        <rect x={64} y={91} width={28} height={24} rx={5} />
        <rect x={108} y={91} width={28} height={24} rx={5} />
        <path d="M92,103 L108,103" />
        <path d="M64,98 L50,96" />
        <path d="M136,98 L150,96" />
      </g>
    );
  }

  // catEye
  return (
    <g fill="none" stroke={OUTLINE} strokeWidth={2.8} strokeLinecap="round">
      <path d="M62,110 Q64,90 90,94 Q98,96 92,110 Q78,118 62,110 Z" />
      <path d="M138,110 Q136,90 110,94 Q102,96 108,110 Q122,118 138,110 Z" />
      <path d="M92,100 L108,100" />
      <path d="M62,102 L50,94" />
      <path d="M138,102 L150,94" />
    </g>
  );
}

export function renderHeadwear(style: Headwear, colorHex: string): ReactNode {
  if (style === 'none') return null;

  if (style === 'beanie') {
    return (
      <>
        <path
          d="M44,88 C44,50 68,32 100,32 C132,32 156,50 156,88 L156,96 C156,100 152,102 148,100 C120,90 80,90 52,100 C48,102 44,100 44,96 Z"
          fill={colorHex}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          strokeLinejoin="round"
        />
        <rect x={44} y={82} width={112} height={16} rx={8} fill={darken(colorHex, 20)} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      </>
    );
  }

  if (style === 'headscarf') {
    return (
      <>
        <path
          d="M40,100 C36,55 62,28 100,28 C138,28 164,55 160,100 C160,130 150,158 140,182 C142,150 138,120 128,100 C132,80 122,64 100,64 C78,64 68,80 72,100 C62,120 58,150 60,182 C50,158 40,130 40,100 Z"
          fill={colorHex}
          stroke={OUTLINE}
          strokeWidth={OUTLINE_WIDTH}
          strokeLinejoin="round"
        />
        <path d="M132,102 C142,124 144,152 138,178" stroke={darken(colorHex, 25)} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6} />
      </>
    );
  }

  // flowerCrown
  const positions: [number, number][] = [
    [58, 78],
    [76, 58],
    [100, 50],
    [124, 58],
    [142, 78],
  ];
  return (
    <>
      {positions.map(([x, y], i) => (
        <g key={`${x}-${y}`} stroke={OUTLINE} strokeWidth={1.4} strokeLinejoin="round">
          <circle cx={x - 5} cy={y} r={5} fill="#e7a8c4" />
          <circle cx={x + 5} cy={y} r={5} fill="#e7a8c4" />
          <circle cx={x} cy={y - 5} r={5} fill="#e7a8c4" />
          <circle cx={x} cy={y + 5} r={5} fill="#e7a8c4" />
          <circle cx={x} cy={y} r={4} fill={i % 2 === 0 ? '#d9a441' : '#c1502f'} />
        </g>
      ))}
    </>
  );
}
