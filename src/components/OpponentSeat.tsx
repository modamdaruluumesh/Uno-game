import React from 'react';
import {AlertTriangle} from 'lucide-react';
import {CardThemeId, Player} from '../types/uno';
import {UnoCardBack} from './UnoCardView';

interface OpponentSeatProps {
  player: Player;
  seatIndex: number;
  isActive: boolean;
  isVulnerableUno: boolean;
  showScore: boolean;
  cardTheme?: CardThemeId;
  onCatchUno: (playerId: string) => void;
}

const AVATAR_TONES = [
  'bg-rose-600 text-white',
  'bg-sky-600 text-white',
  'bg-amber-500 text-stone-950',
];

export const OpponentSeat: React.FC<OpponentSeatProps> = ({
  player,
  seatIndex,
  isActive,
  isVulnerableUno,
  showScore,
  cardTheme = 'classic',
  onCatchUno,
}) => {
  const visibleBacks = Math.min(player.hand.length, 7);
  const extraCount = player.hand.length - visibleBacks;
  const avatarTone = AVATAR_TONES[seatIndex % AVATAR_TONES.length];
  const initial = player.name.slice(0, 1).toUpperCase();

  return (
    <div
      className={`flex-1 sm:flex-initial flex flex-col items-center justify-between gap-1 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-150 border ${
        isActive
          ? 'bg-black/70 border-amber-300 shadow-[0_0_24px_-4px_rgba(251,191,36,0.45)]'
          : 'bg-black/35 border-white/12'
      } backdrop-blur-sm min-w-0 sm:min-w-[164px] max-w-[230px]`}
    >
      {/* Avatar, Name & Stats */}
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div
            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0 ${avatarTone}`}
            style={{fontFamily: 'var(--font-display)'}}
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-white truncate">
              {player.name}
            </p>
            <p className="text-[11px] sm:text-xs text-emerald-100/80 font-mono tabular-nums truncate">
              {player.hand.length} {player.hand.length === 1 ? 'card' : 'cards'}
              {showScore ? ` · ${player.score}` : ''}
            </p>
          </div>
        </div>

        {player.hand.length === 1 && player.unoCalled && (
          <span
            className="px-1.5 py-0.5 rounded bg-amber-400 text-stone-950 text-[10px] font-black tracking-wide shrink-0"
            style={{fontFamily: 'var(--font-display)'}}
          >
            UNO!
          </span>
        )}
      </div>

      {/* Card backs mini-fan (shown on sm+ to save mobile vertical space) */}
      <div className="hidden sm:flex items-center justify-center py-0.5 min-h-[56px]">
        <div className="flex items-center -space-x-6">
          {Array.from({length: visibleBacks}).map((_, idx) => (
            <UnoCardBack key={idx} size="xs" theme={cardTheme} />
          ))}
        </div>
        {extraCount > 0 && (
          <span className="ml-2 text-xs font-mono font-bold text-stone-200 tabular-nums">
            +{extraCount}
          </span>
        )}
      </div>

      {/* Explicit turn / catch state (non-hue-only) */}
      <div className="min-h-[20px] sm:min-h-[24px] flex items-center justify-center w-full">
        {isVulnerableUno ? (
          <button
            type="button"
            onClick={() => onCatchUno(player.id)}
            className="inline-flex items-center justify-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold shadow-md transition-colors cursor-pointer whitespace-nowrap"
          >
            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Catch! (+2)</span>
          </button>
        ) : isActive ? (
          <span className="text-[10px] sm:text-xs font-semibold text-amber-300 truncate">
            Active Turn
          </span>
        ) : (
          <span className="text-[10px] sm:text-xs text-stone-400 truncate">
            Waiting
          </span>
        )}
      </div>
    </div>
  );
};
