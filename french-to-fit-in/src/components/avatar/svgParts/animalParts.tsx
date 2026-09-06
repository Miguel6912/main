import type { ReactNode } from 'react';
import type { AnimalSpecies } from '../../../types/avatar';
import { OUTLINE, OUTLINE_THIN, OUTLINE_WIDTH, darken } from './style';

const CREAM = '#fbf3e6';
const PINK = '#e7a8c4';

function simpleEyes(y = 108): ReactNode {
  return (
    <>
      {[78, 122].map((x) => (
        <g key={x}>
          <circle cx={x} cy={y} r={10.5} fill="#ffffff" stroke={OUTLINE} strokeWidth={2.2} />
          <circle cx={x} cy={y} r={6.2} fill={OUTLINE} />
          <circle cx={x - 2.6} cy={y - 2.6} r={2.2} fill="#ffffff" />
        </g>
      ))}
    </>
  );
}

function whiskers(y = 128): ReactNode {
  return (
    <g stroke={OUTLINE} strokeWidth={1.6} opacity={0.55} strokeLinecap="round">
      <path d={`M62,${y} L30,${y - 4}`} />
      <path d={`M62,${y + 6} L30,${y + 6}`} />
      <path d={`M138,${y} L170,${y - 4}`} />
      <path d={`M138,${y + 6} L170,${y + 6}`} />
    </g>
  );
}

function renderFox(furHex: string): ReactNode {
  const dark = darken(furHex, 45);
  return (
    <>
      <path d="M46,70 L70,100 L38,108 Z" fill={dark} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
      <path d="M154,70 L130,100 L162,108 Z" fill={dark} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
      <path d="M52,78 L68,98 L44,102 Z" fill={PINK} opacity={0.7} />
      <path d="M148,78 L132,98 L156,102 Z" fill={PINK} opacity={0.7} />
      <ellipse cx={100} cy={112} rx={54} ry={58} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
      <ellipse cx={132} cy={126} rx={16} ry={30} fill={dark} opacity={0.55} />
      <path d="M70,128 Q100,168 130,128 Q116,150 100,150 Q84,150 70,128 Z" fill={CREAM} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
      {simpleEyes(106)}
      <path d="M91,120 Q100,132 109,120 Q100,127 91,120 Z" fill={OUTLINE} />
      <path d="M96,130 Q100,139 104,130" stroke={OUTLINE} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <ellipse cx={69} cy={124} rx={8} ry={5} fill={PINK} opacity={0.55} />
      <ellipse cx={131} cy={124} rx={8} ry={5} fill={PINK} opacity={0.55} />
    </>
  );
}

function renderDeer(furHex: string): ReactNode {
  const dark = darken(furHex, 45);
  return (
    <>
      <g stroke={OUTLINE} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M78,55 L70,32 M70,32 L60,26 M70,32 L78,38" />
        <path d="M122,55 L130,32 M130,32 L140,26 M130,32 L122,38" />
      </g>
      <ellipse cx={45} cy={100} rx={13} ry={22} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} transform="rotate(-18 45 100)" />
      <ellipse cx={155} cy={100} rx={13} ry={22} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} transform="rotate(18 155 100)" />
      <ellipse cx={45} cy={100} rx={7} ry={14} fill={PINK} opacity={0.6} transform="rotate(-18 45 100)" />
      <ellipse cx={155} cy={100} rx={7} ry={14} fill={PINK} opacity={0.6} transform="rotate(18 155 100)" />
      <ellipse cx={100} cy={112} rx={52} ry={58} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
      <ellipse cx={130} cy={128} rx={15} ry={28} fill={dark} opacity={0.5} />
      <ellipse cx={100} cy={140} rx={26} ry={20} fill={CREAM} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      {simpleEyes(104)}
      <ellipse cx={100} cy={132} rx={5.5} ry={4.5} fill={OUTLINE} />
      <ellipse cx={72} cy={122} rx={7} ry={4.5} fill={PINK} opacity={0.5} />
      <ellipse cx={128} cy={122} rx={7} ry={4.5} fill={PINK} opacity={0.5} />
    </>
  );
}

function renderOwl(furHex: string): ReactNode {
  const dark = darken(furHex, 45);
  return (
    <>
      <path d="M52,70 L62,44 L74,68 Z" fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
      <path d="M148,70 L138,44 L126,68 Z" fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
      <circle cx={100} cy={112} r={58} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
      <ellipse cx={134} cy={128} rx={20} ry={36} fill={dark} opacity={0.45} />
      <circle cx={100} cy={116} r={44} fill={CREAM} opacity={0.55} />
      <circle cx={78} cy={106} r={21} fill="#ffffff" stroke={OUTLINE} strokeWidth={2.2} />
      <circle cx={122} cy={106} r={21} fill="#ffffff" stroke={OUTLINE} strokeWidth={2.2} />
      <circle cx={78} cy={106} r={13} fill={OUTLINE} />
      <circle cx={122} cy={106} r={13} fill={OUTLINE} />
      <circle cx={74} cy={101} r={3.4} fill="#ffffff" />
      <circle cx={118} cy={101} r={3.4} fill="#ffffff" />
      <path d="M94,124 L106,124 L100,137 Z" fill="#d9a441" stroke={OUTLINE} strokeWidth={1.6} strokeLinejoin="round" />
    </>
  );
}

function renderRabbit(furHex: string): ReactNode {
  const dark = darken(furHex, 45);
  return (
    <>
      <ellipse cx={78} cy={50} rx={15} ry={38} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      <ellipse cx={122} cy={50} rx={15} ry={38} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      <ellipse cx={78} cy={52} rx={8} ry={28} fill={PINK} opacity={0.65} />
      <ellipse cx={122} cy={52} rx={8} ry={28} fill={PINK} opacity={0.65} />
      <circle cx={100} cy={118} r={56} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
      <ellipse cx={132} cy={132} rx={17} ry={30} fill={dark} opacity={0.5} />
      <ellipse cx={100} cy={142} rx={24} ry={18} fill={CREAM} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      {simpleEyes(112)}
      <ellipse cx={100} cy={132} rx={4.5} ry={3.5} fill={OUTLINE} />
      <rect x={94} y={140} width={6} height={8} rx={1.5} fill="#ffffff" stroke={OUTLINE} strokeWidth={0.8} />
      <rect x={100} y={140} width={6} height={8} rx={1.5} fill="#ffffff" stroke={OUTLINE} strokeWidth={0.8} />
      <ellipse cx={70} cy={128} rx={7} ry={4.5} fill={PINK} opacity={0.55} />
      <ellipse cx={130} cy={128} rx={7} ry={4.5} fill={PINK} opacity={0.55} />
      {whiskers(130)}
    </>
  );
}

function renderBear(furHex: string): ReactNode {
  const dark = darken(furHex, 45);
  return (
    <>
      <circle cx={54} cy={62} r={20} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      <circle cx={146} cy={62} r={20} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      <circle cx={54} cy={62} r={10} fill={PINK} opacity={0.55} />
      <circle cx={146} cy={62} r={10} fill={PINK} opacity={0.55} />
      <circle cx={100} cy={114} r={60} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
      <ellipse cx={136} cy={130} rx={22} ry={38} fill={dark} opacity={0.45} />
      <ellipse cx={100} cy={138} rx={30} ry={24} fill={CREAM} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      {simpleEyes(108)}
      <ellipse cx={100} cy={132} rx={7.5} ry={5.5} fill={OUTLINE} />
      <ellipse cx={68} cy={126} rx={8} ry={5} fill={PINK} opacity={0.5} />
      <ellipse cx={132} cy={126} rx={8} ry={5} fill={PINK} opacity={0.5} />
    </>
  );
}

function renderCat(furHex: string): ReactNode {
  const dark = darken(furHex, 45);
  return (
    <>
      <path d="M48,72 L58,32 L82,64 Z" fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
      <path d="M152,72 L142,32 L118,64 Z" fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} strokeLinejoin="round" />
      <path d="M54,66 L60,44 L74,62 Z" fill={PINK} opacity={0.65} />
      <path d="M146,66 L140,44 L126,62 Z" fill={PINK} opacity={0.65} />
      <ellipse cx={100} cy={114} rx={54} ry={56} fill={furHex} stroke={OUTLINE} strokeWidth={OUTLINE_WIDTH} />
      <ellipse cx={132} cy={128} rx={16} ry={28} fill={dark} opacity={0.5} />
      <ellipse cx={100} cy={140} rx={22} ry={16} fill={CREAM} stroke={OUTLINE} strokeWidth={OUTLINE_THIN} />
      {simpleEyes(108)}
      <path d="M96,124 L104,124 L100,130 Z" fill={PINK} stroke={OUTLINE} strokeWidth={0.8} strokeLinejoin="round" />
      <ellipse cx={69} cy={124} rx={7} ry={4.5} fill={PINK} opacity={0.5} />
      <ellipse cx={131} cy={124} rx={7} ry={4.5} fill={PINK} opacity={0.5} />
      {whiskers(128)}
    </>
  );
}

export function renderAnimal(species: AnimalSpecies, furHex: string): ReactNode {
  switch (species) {
    case 'fox':
      return renderFox(furHex);
    case 'deer':
      return renderDeer(furHex);
    case 'owl':
      return renderOwl(furHex);
    case 'rabbit':
      return renderRabbit(furHex);
    case 'bear':
      return renderBear(furHex);
    case 'cat':
      return renderCat(furHex);
    default:
      return null;
  }
}
