import type { ReactNode } from 'react';
import type { EyeShape, FacialHair, Glasses, HairStyle, Headwear, Mouth } from '../../../types/avatar';

/**
 * All human-avatar shapes on a shared 200x200 canvas. Drawing order (see
 * AvatarSvg.tsx): hair (back) -> ears -> face -> features -> facial hair ->
 * glasses -> headwear. Hair/headwear shapes are drawn larger than the face
 * ellipse and rely on the face being painted on top to leave the correct
 * silhouette showing -- no clip-paths needed.
 */

export const FACE_ELLIPSE = { cx: 100, cy: 110, rx: 52, ry: 65 };

export function renderFace(skinHex: string): ReactNode {
  return (
    <>
      <ellipse cx={47} cy={114} rx={7} ry={13} fill={skinHex} />
      <ellipse cx={153} cy={114} rx={7} ry={13} fill={skinHex} />
      <ellipse cx={FACE_ELLIPSE.cx} cy={FACE_ELLIPSE.cy} rx={FACE_ELLIPSE.rx} ry={FACE_ELLIPSE.ry} fill={skinHex} />
    </>
  );
}

function braidSegments(x: number, colorHex: string, taper = 1): ReactNode {
  const ys = [112, 132, 152, 172];
  return (
    <>
      {ys.map((y, i) => (
        <ellipse key={y} cx={x} cy={y} rx={9 - i * taper} ry={13} fill={colorHex} />
      ))}
    </>
  );
}

export function renderHair(style: HairStyle, colorHex: string): ReactNode {
  switch (style) {
    case 'bald':
      return <ellipse cx={85} cy={68} rx={14} ry={7} fill="#ffffff" opacity={0.22} />;

    case 'buzz':
      return <ellipse cx={100} cy={92} rx={55} ry={56} fill={colorHex} />;

    case 'shortCrop':
      return <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} />;

    case 'pixie':
      return (
        <>
          <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} />
          <ellipse cx={140} cy={98} rx={16} ry={22} fill={colorHex} />
        </>
      );

    case 'bob':
      return (
        <path
          d="M45,95 C45,58 69,40 100,40 C131,40 155,58 155,95 L155,152 C155,160 147,164 138,164 L62,164 C53,164 45,160 45,152 Z"
          fill={colorHex}
        />
      );

    case 'waves':
      return (
        <path
          d="M45,95 C45,58 69,40 100,40 C131,40 155,58 155,95 L156,150 C160,158 152,164 144,160 C140,172 128,168 126,160 C122,172 108,168 108,158 C104,170 92,168 92,158 C90,168 78,172 74,160 C72,168 60,172 56,160 C48,164 40,158 44,150 Z"
          fill={colorHex}
        />
      );

    case 'longStraight':
      return (
        <path
          d="M45,95 C45,58 69,40 100,40 C131,40 155,58 155,95 L155,190 C155,196 147,198 145,192 L143,150 L107,150 L106,192 C105,198 97,198 96,192 L94,150 L57,150 L55,192 C53,198 45,196 45,190 Z"
          fill={colorHex}
        />
      );

    case 'longCurly':
      return (
        <path
          d="M42,98 C38,60 66,38 100,38 C134,38 162,60 158,98 C168,104 170,118 162,124 C170,132 168,146 158,150 C166,158 162,172 150,172 C154,182 144,192 134,186 C132,196 118,198 112,190 C106,198 94,198 88,190 C82,198 68,196 66,186 C56,192 46,182 50,172 C38,172 34,158 42,150 C32,146 30,132 38,124 C30,118 32,104 42,98 Z"
          fill={colorHex}
        />
      );

    case 'afro':
      return <circle cx={100} cy={92} r={72} fill={colorHex} />;

    case 'braids':
      return (
        <>
          <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} />
          {braidSegments(58, colorHex)}
          {braidSegments(142, colorHex)}
        </>
      );

    case 'bun':
      return (
        <>
          <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} />
          <circle cx={100} cy={36} r={17} fill={colorHex} />
        </>
      );

    case 'ponytail':
      return (
        <>
          <ellipse cx={100} cy={85} rx={58} ry={62} fill={colorHex} />
          <path
            d="M138,82 C160,80 176,100 172,126 C170,148 154,160 144,154 C150,130 148,104 138,82 Z"
            fill={colorHex}
          />
        </>
      );

    default:
      return null;
  }
}

export function renderEars(skinHex: string): ReactNode {
  return (
    <>
      <ellipse cx={47} cy={114} rx={5} ry={9} fill={skinHex} opacity={0.001} />
    </>
  );
}

function eyeShapePair(shape: EyeShape, colorHex: string): ReactNode {
  const leftX = 78;
  const rightX = 122;
  const y = 105;

  if (shape === 'round') {
    return (
      <>
        {[leftX, rightX].map((x) => (
          <g key={x}>
            <circle cx={x} cy={y} r={11} fill="#ffffff" />
            <circle cx={x} cy={y} r={8} fill={colorHex} />
            <circle cx={x} cy={y} r={3.6} fill="#20140c" />
            <circle cx={x - 2.5} cy={y - 2.5} r={1.6} fill="#ffffff" />
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
            <ellipse cx={x} cy={y} rx={11} ry={5.5} fill="#ffffff" />
            <ellipse cx={x} cy={y} rx={7.5} ry={4.2} fill={colorHex} />
            <circle cx={x} cy={y} r={2.6} fill="#20140c" />
            <path d={`M${x - 11},${y - 3} Q${x},${y - 8} ${x + 11},${y - 3}`} stroke="#2a1c12" strokeWidth={1.6} fill="none" strokeLinecap="round" />
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
          <ellipse cx={x} cy={y} rx={11.5} ry={8} fill="#ffffff" />
          <ellipse cx={x} cy={y} rx={7.8} ry={7} fill={colorHex} />
          <circle cx={x} cy={y} r={3.2} fill="#20140c" />
          <circle cx={x - 2} cy={y - 2} r={1.4} fill="#ffffff" />
          <path d={`M${x - 12},${y - 4} Q${x},${y - 10} ${x + 12},${y - 4}`} stroke="#2a1c12" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </>
  );
}

export function renderEyesAndBrows(shape: EyeShape, eyeColorHex: string, browHex: string): ReactNode {
  return (
    <>
      <path d="M68,88 Q78,80 90,86" stroke={browHex} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M110,86 Q122,80 132,88" stroke={browHex} strokeWidth={3} fill="none" strokeLinecap="round" />
      {eyeShapePair(shape, eyeColorHex)}
      <path d="M97,110 Q94,122 100,124" stroke="#00000030" strokeWidth={2} fill="none" strokeLinecap="round" />
    </>
  );
}

export function renderMouth(mouth: Mouth): ReactNode {
  if (mouth === 'grin') {
    return (
      <path d="M82,138 Q100,156 118,138 Q100,148 82,138 Z" fill="#ffffff" stroke="#7a3d2e" strokeWidth={1.5} />
    );
  }
  if (mouth === 'neutral') {
    return <path d="M85,140 Q100,143 115,140" stroke="#7a3d2e" strokeWidth={2.6} fill="none" strokeLinecap="round" />;
  }
  return <path d="M82,136 Q100,154 118,136" stroke="#7a3d2e" strokeWidth={2.6} fill="none" strokeLinecap="round" />;
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
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} fill="#8a5a3c" opacity={0.55} />
      ))}
    </>
  );
}

export function renderFacialHair(style: FacialHair, colorHex: string): ReactNode {
  if (style === 'none') return null;

  if (style === 'mustache') {
    return <path d="M84,130 Q100,126 116,130 Q100,136 84,130 Z" fill={colorHex} />;
  }

  if (style === 'goatee') {
    return (
      <>
        <path d="M84,130 Q100,126 116,130 Q100,136 84,130 Z" fill={colorHex} />
        <path d="M90,142 Q100,168 110,142 Q100,150 90,142 Z" fill={colorHex} />
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
      />
    );
  }

  // fullBeard
  return (
    <path
      d="M48,110 C46,146 68,178 100,178 C132,178 154,146 152,110 L152,130 C152,162 128,182 100,182 C72,182 48,162 48,130 Z"
      fill={colorHex}
    />
  );
}

export function renderGlasses(style: Glasses): ReactNode {
  if (style === 'none') return null;
  const stroke = '#2a2622';

  if (style === 'round') {
    return (
      <g fill="none" stroke={stroke} strokeWidth={2.4}>
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
      <g fill="none" stroke={stroke} strokeWidth={2.4}>
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
    <g fill="none" stroke={stroke} strokeWidth={2.4}>
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
        <path d="M44,88 C44,50 68,32 100,32 C132,32 156,50 156,88 L156,96 C156,100 152,102 148,100 C120,90 80,90 52,100 C48,102 44,100 44,96 Z" fill={colorHex} />
        <rect x={44} y={82} width={112} height={16} rx={8} fill={colorHex} opacity={0.75} />
      </>
    );
  }

  if (style === 'headscarf') {
    return (
      <path
        d="M40,100 C36,55 62,28 100,28 C138,28 164,55 160,100 C160,130 150,158 140,182 C142,150 138,120 128,100 C132,80 122,64 100,64 C78,64 68,80 72,100 C62,120 58,150 60,182 C50,158 40,130 40,100 Z"
        fill={colorHex}
      />
    );
  }

  // flowerCrown
  const positions = [
    [58, 78],
    [76, 58],
    [100, 50],
    [124, 58],
    [142, 78],
  ];
  return (
    <>
      {positions.map(([x, y], i) => (
        <g key={`${x}-${y}`}>
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
