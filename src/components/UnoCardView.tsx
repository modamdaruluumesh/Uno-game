import React from 'react';
import {CARD_THEMES} from '../config/themes';
import {
  ActiveColor,
  CardColor,
  CardThemeId,
  CardValue,
  UnoCard,
} from '../types/uno';
import {formatCardName} from '../engine/unoEngine';

export type CardSize = 'xs' | 'sm' | 'md' | 'lg';

interface UnoCardViewProps {
  card: UnoCard;
  size?: CardSize;
  theme?: CardThemeId;
  playable?: boolean;
  dimmed?: boolean;
  selected?: boolean;
  showColorSymbol?: boolean;
  activeWildColor?: ActiveColor;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<
  CardSize,
  {
    outer: string;
    padding: string;
    corner: string;
    centerText: string;
    centerIcon: string;
    symbol: string;
  }
> = {
  xs: {
    outer: 'w-10 h-14 rounded-md',
    padding: 'p-0.5',
    corner: 'text-[9px] leading-none font-extrabold',
    centerText: 'text-sm font-black',
    centerIcon: 'w-4 h-4',
    symbol: 'text-[7px]',
  },
  sm: {
    outer: 'w-14 h-20 rounded-lg',
    padding: 'p-1',
    corner: 'text-[11px] leading-none font-extrabold',
    centerText: 'text-xl font-black',
    centerIcon: 'w-6 h-6',
    symbol: 'text-[8px]',
  },
  md: {
    outer: 'w-[60px] h-[88px] sm:w-22 sm:h-32 rounded-lg sm:rounded-xl',
    padding: 'p-1 sm:p-1.5',
    corner: 'text-[11px] sm:text-sm leading-none font-extrabold',
    centerText: 'text-2xl sm:text-4xl font-black',
    centerIcon: 'w-6 h-6 sm:w-9 sm:h-9',
    symbol: 'text-[8px] sm:text-[10px]',
  },
  lg: {
    outer: 'w-[74px] h-[108px] sm:w-28 sm:h-40 rounded-xl sm:rounded-2xl',
    padding: 'p-1 sm:p-2',
    corner: 'text-xs sm:text-base leading-none font-extrabold',
    centerText: 'text-3xl sm:text-5xl font-black',
    centerIcon: 'w-8 h-8 sm:w-12 sm:h-12',
    symbol: 'text-[9px] sm:text-[11px]',
  },
};

const COLOR_STYLES: Record<
  CardColor,
  {
    bg: string;
    cornerText: string;
    centerInk: string;
    ovalBg: string;
    symbolChar: string;
  }
> = {
  red: {
    bg: 'bg-gradient-to-br from-[#EF4444] via-[#DC2626] to-[#B91C1C]',
    cornerText: 'text-white',
    centerInk: 'text-[#B91C1C]',
    ovalBg: 'bg-white/95',
    symbolChar: '●',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-[#FDE047] via-[#FACC15] to-[#EAB308]',
    cornerText: 'text-stone-900',
    centerInk: 'text-stone-900',
    ovalBg: 'bg-white/90',
    symbolChar: '▲',
  },
  green: {
    bg: 'bg-gradient-to-br from-[#22C55E] via-[#16A34A] to-[#15803D]',
    cornerText: 'text-white',
    centerInk: 'text-[#15803D]',
    ovalBg: 'bg-white/95',
    symbolChar: '■',
  },
  blue: {
    bg: 'bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1D4ED8]',
    cornerText: 'text-white',
    centerInk: 'text-[#1D4ED8]',
    ovalBg: 'bg-white/95',
    symbolChar: '◆',
  },
  wild: {
    bg: 'bg-gradient-to-br from-[#27272A] via-[#18181B] to-[#09090B]',
    cornerText: 'text-white',
    centerInk: 'text-stone-900',
    ovalBg: 'bg-white/95',
    symbolChar: '✦',
  },
};

const SAKURA_COLOR_STYLES: Partial<
  Record<CardColor, {bg: string; centerInk: string}>
> = {
  red: {
    bg: 'bg-gradient-to-br from-[#FB7185] via-[#F43F5E] to-[#E11D48]',
    centerInk: 'text-[#BE123C]',
  },
  green: {
    bg: 'bg-gradient-to-br from-[#34D399] via-[#10B981] to-[#059669]',
    centerInk: 'text-[#047857]',
  },
  blue: {
    bg: 'bg-gradient-to-br from-[#38BDF8] via-[#0EA5E9] to-[#0284C7]',
    centerInk: 'text-[#0369A1]',
  },
};

const ROYAL_COLOR_STYLES: Partial<
  Record<CardColor, {bg: string; centerInk: string}>
> = {
  red: {
    bg: 'bg-gradient-to-br from-[#BE123C] via-[#9F1239] to-[#881337]',
    centerInk: 'text-[#881337]',
  },
  green: {
    bg: 'bg-gradient-to-br from-[#059669] via-[#047857] to-[#065F46]',
    centerInk: 'text-[#065F46]',
  },
  blue: {
    bg: 'bg-gradient-to-br from-[#1D4ED8] via-[#1E40AF] to-[#1E3A8A]',
    centerInk: 'text-[#1E3A8A]',
  },
};

function getCornerLabel(value: CardValue): string {
  switch (value) {
    case 'skip':
      return '⊘';
    case 'reverse':
      return '⇄';
    case 'draw2':
      return '+2';
    case 'wild':
      return 'W';
    case 'wild4':
      return '+4';
    default:
      return value;
  }
}

function CenterEmblem({
  value,
  size,
  inkClass,
}: {
  value: CardValue;
  size: CardSize;
  inkClass: string;
}) {
  const s = SIZE_CLASSES[size];
  const wildClipId = React.useId();

  if (value === 'skip') {
    return (
      <svg
        viewBox="0 0 48 48"
        className={`${s.centerIcon} ${inkClass}`}
        fill="none"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="5.5" />
        <line
          x1="12.5"
          y1="35.5"
          x2="35.5"
          y2="12.5"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (value === 'reverse') {
    return (
      <svg
        viewBox="0 0 48 48"
        className={`${s.centerIcon} ${inkClass}`}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M11 20C14 13 21 10 29 12L25 8M29 12L25 16"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M37 28C34 35 27 38 19 36L23 40M19 36L23 32"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (value === 'draw2') {
    return (
      <div className={`flex items-center justify-center ${inkClass}`}>
        <span
          className={`${s.centerText} tracking-tighter`}
          style={{fontFamily: 'var(--font-display)'}}
        >
          +2
        </span>
      </div>
    );
  }

  if (value === 'wild') {
    return (
      <svg
        viewBox="0 0 48 48"
        className={`${s.centerIcon}`}
        aria-hidden="true"
      >
        <clipPath id={wildClipId}>
          <circle cx="24" cy="24" r="19" />
        </clipPath>
        <g clipPath={`url(#${wildClipId})`}>
          <rect x="4" y="4" width="20" height="20" fill="#DC2626" />
          <rect x="24" y="4" width="20" height="20" fill="#2563EB" />
          <rect x="4" y="24" width="20" height="20" fill="#FACC15" />
          <rect x="24" y="24" width="20" height="20" fill="#16A34A" />
        </g>
        <circle
          cx="24"
          cy="24"
          r="19"
          fill="none"
          stroke="#18181B"
          strokeWidth="2.5"
        />
      </svg>
    );
  }

  if (value === 'wild4') {
    return (
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 56 48"
          className={`${s.centerIcon}`}
          aria-hidden="true"
        >
          <rect
            x="6"
            y="14"
            width="16"
            height="22"
            rx="3"
            fill="#DC2626"
            stroke="#FFFFFF"
            strokeWidth="2"
            transform="rotate(-10 14 25)"
          />
          <rect
            x="15"
            y="8"
            width="16"
            height="22"
            rx="3"
            fill="#2563EB"
            stroke="#FFFFFF"
            strokeWidth="2"
            transform="rotate(-3 23 19)"
          />
          <rect
            x="24"
            y="15"
            width="16"
            height="22"
            rx="3"
            fill="#FACC15"
            stroke="#18181B"
            strokeWidth="2"
            transform="rotate(4 32 26)"
          />
          <rect
            x="33"
            y="10"
            width="16"
            height="22"
            rx="3"
            fill="#16A34A"
            stroke="#FFFFFF"
            strokeWidth="2"
            transform="rotate(10 41 21)"
          />
        </svg>
      </div>
    );
  }

  const needsUnderline = value === '6' || value === '9';

  return (
    <span
      className={`${s.centerText} ${inkClass} select-none leading-none tracking-tight ${
        needsUnderline ? 'underline decoration-[3px] underline-offset-2' : ''
      }`}
      style={{fontFamily: 'var(--font-display)'}}
    >
      {value}
    </span>
  );
}

export const UnoCardView: React.FC<UnoCardViewProps> = ({
  card,
  size = 'md',
  theme = 'classic',
  playable = false,
  dimmed = false,
  selected = false,
  showColorSymbol = false,
  activeWildColor,
  onClick,
  disabled = false,
  className = '',
}) => {
  const s = SIZE_CLASSES[size];
  const basePalette = COLOR_STYLES[card.color];
  const themeOverride =
    theme === 'sakura-pastel'
      ? SAKURA_COLOR_STYLES[card.color]
      : theme === 'royal-ruby'
        ? ROYAL_COLOR_STYLES[card.color]
        : undefined;
  const bgClass = themeOverride?.bg ?? basePalette.bg;
  const centerInkClass = themeOverride?.centerInk ?? basePalette.centerInk;
  const frameClass = CARD_THEMES[theme]?.frameClass ?? 'bg-white';

  const cornerLabel = getCornerLabel(card.value);
  const needsUnderline = card.value === '6' || card.value === '9';

  const activeWildBorder =
    card.color === 'wild' && activeWildColor
      ? activeWildColor === 'red'
        ? 'ring-4 ring-red-500'
        : activeWildColor === 'yellow'
          ? 'ring-4 ring-yellow-400'
          : activeWildColor === 'green'
            ? 'ring-4 ring-green-500'
            : 'ring-4 ring-blue-500'
      : '';

  const interactiveClasses = onClick
    ? playable && !disabled
      ? 'cursor-pointer hover:-translate-y-4 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 uno-card-shadow-active'
      : 'cursor-not-allowed'
    : 'uno-card-shadow';

  const stateTransform = selected
    ? '-translate-y-5 ring-4 ring-amber-300'
    : playable && onClick
      ? '-translate-y-2'
      : '';

  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick && !disabled ? onClick : undefined}
      disabled={onClick ? disabled : undefined}
      aria-label={formatCardName(card)}
      className={`relative shrink-0 ${frameClass} ${s.outer} ${s.padding} select-none transition-transform duration-150 ease-out ${interactiveClasses} ${stateTransform} ${
        dimmed ? 'opacity-50 saturate-75' : 'opacity-100'
      } ${activeWildBorder} ${className}`}
    >
      <div
        className={`relative w-full h-full rounded-[inherit] ${bgClass} flex items-center justify-center overflow-hidden`}
      >
        {/* Top-left corner index */}
        <div
          className={`absolute top-1.5 left-1.5 flex flex-col items-center ${basePalette.cornerText} ${s.corner}`}
          style={{fontFamily: 'var(--font-display)'}}
        >
          <span
            className={
              needsUnderline ? 'underline decoration-2 underline-offset-1' : ''
            }
          >
            {cornerLabel}
          </span>
          {showColorSymbol && (
            <span className={`${s.symbol} opacity-90 mt-0.5`}>
              {basePalette.symbolChar}
            </span>
          )}
        </div>

        {/* Diagonal center oval */}
        <div
          className={`w-[74%] h-[62%] rounded-[999px] ${basePalette.ovalBg} -rotate-12 flex items-center justify-center shadow-inner`}
        >
          <div className="rotate-12 flex items-center justify-center">
            <CenterEmblem
              value={card.value}
              size={size}
              inkClass={centerInkClass}
            />
          </div>
        </div>

        {/* Bottom-right inverted corner index */}
        <div
          className={`absolute bottom-1.5 right-1.5 rotate-180 flex flex-col items-center ${basePalette.cornerText} ${s.corner}`}
          style={{fontFamily: 'var(--font-display)'}}
        >
          <span
            className={
              needsUnderline ? 'underline decoration-2 underline-offset-1' : ''
            }
          >
            {cornerLabel}
          </span>
          {showColorSymbol && (
            <span className={`${s.symbol} opacity-90 mt-0.5`}>
              {basePalette.symbolChar}
            </span>
          )}
        </div>
      </div>
    </Element>
  );
};

export const UnoCardBack: React.FC<{
  size?: CardSize;
  theme?: CardThemeId;
  onClick?: () => void;
  highlighted?: boolean;
  label?: string;
  className?: string;
}> = ({
  size = 'md',
  theme = 'classic',
  onClick,
  highlighted = false,
  label,
  className = '',
}) => {
  const s = SIZE_CLASSES[size];
  const t = CARD_THEMES[theme] ?? CARD_THEMES.classic;
  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={label ?? 'UNO Card Back'}
      className={`relative shrink-0 ${t.frameClass} ${s.outer} ${s.padding} select-none uno-card-shadow transition-transform duration-150 ease-out ${
        onClick
          ? 'cursor-pointer hover:-translate-y-1.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300'
          : ''
      } ${
        highlighted ? 'ring-3 ring-amber-300 -translate-y-1' : ''
      } ${className}`}
    >
      <div
        className={`w-full h-full rounded-[inherit] ${t.backBgClass} flex items-center justify-center overflow-hidden`}
      >
        <div
          className={`w-[78%] h-[58%] rounded-[999px] ${t.backOvalClass} -rotate-18 flex items-center justify-center shadow-md`}
        >
          <span
            className={`rotate-18 font-black tracking-tight ${t.backTextClass} drop-shadow-sm ${
              size === 'xs'
                ? 'text-[8px]'
                : size === 'sm'
                  ? 'text-[11px]'
                  : size === 'md'
                    ? 'text-base'
                    : 'text-xl'
            }`}
            style={{fontFamily: 'var(--font-display)'}}
          >
            UNO
          </span>
        </div>
      </div>
    </Element>
  );
};
