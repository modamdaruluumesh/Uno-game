import React from 'react';
import {motion} from 'motion/react';
import {
  BookOpen,
  Coins,
  Eye,
  LogOut,
  Play,
  RotateCcw,
  Trophy,
  Vibrate,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {ActiveColor, CardThemeId, Player, RoundResult} from '../types/uno';
import {COLOR_LABELS, COLORS} from '../engine/unoEngine';
import {UnoCardView} from './UnoCardView';

const PICKER_STYLES: Record<
  ActiveColor,
  {bg: string; border: string; text: string; symbol: string}
> = {
  red: {
    bg: 'bg-red-600 hover:bg-red-500',
    border: 'border-red-400/50',
    text: 'text-white',
    symbol: '●',
  },
  yellow: {
    bg: 'bg-yellow-400 hover:bg-yellow-300',
    border: 'border-yellow-200/70',
    text: 'text-stone-950',
    symbol: '▲',
  },
  green: {
    bg: 'bg-green-600 hover:bg-green-500',
    border: 'border-green-400/50',
    text: 'text-white',
    symbol: '■',
  },
  blue: {
    bg: 'bg-blue-600 hover:bg-blue-500',
    border: 'border-blue-400/50',
    text: 'text-white',
    symbol: '◆',
  },
};

export const WildColorPickerModal: React.FC<{
  title: string;
  subtitle: string;
  onSelect: (color: ActiveColor) => void;
}> = ({title, subtitle, onSelect}) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{opacity: 0, scale: 0.94, y: 8}}
        animate={{opacity: 1, scale: 1, y: 0}}
        transition={{duration: 0.16}}
        className="w-full max-w-sm bg-stone-950 border border-white/15 rounded-2xl p-6 shadow-2xl"
      >
        <h3
          className="text-xl font-bold text-white text-center"
          style={{fontFamily: 'var(--font-display)'}}
        >
          {title}
        </h3>
        <p className="text-xs text-stone-400 text-center mt-1 mb-5">
          {subtitle}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {COLORS.map((color, idx) => {
            const s = PICKER_STYLES[color];
            return (
              <button
                key={color}
                type="button"
                onClick={() => onSelect(color)}
                className={`flex items-center justify-center gap-2.5 py-4 px-4 rounded-xl border ${s.bg} ${s.border} ${s.text} font-bold text-base shadow-lg transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white`}
              >
                <span aria-hidden="true">{s.symbol}</span>
                <span>{COLOR_LABELS[color]}</span>
                <span className="hidden sm:inline text-xs opacity-65 font-mono">
                  [{idx + 1}]
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export const Wild4ChallengeModal: React.FC<{
  actorName: string;
  challengerName?: string;
  previousColor: ActiveColor;
  chosenColor: ActiveColor;
  onAccept: () => void;
  onChallenge: () => void;
}> = ({
  actorName,
  challengerName,
  previousColor,
  chosenColor,
  onAccept,
  onChallenge,
}) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{opacity: 0, scale: 0.94, y: 8}}
        animate={{opacity: 1, scale: 1, y: 0}}
        transition={{duration: 0.16}}
        className="w-full max-w-md bg-stone-950 border border-white/15 rounded-2xl p-6 shadow-2xl"
      >
        <h3
          className="text-xl font-bold text-white"
          style={{fontFamily: 'var(--font-display)'}}
        >
          Wild Draw Four Played!
        </h3>
        <p className="text-sm text-stone-300 mt-2 leading-relaxed">
          <strong className="text-white">{actorName}</strong> played Wild +4 and
          switched the color from{' '}
          <strong className="text-white">{COLOR_LABELS[previousColor]}</strong>{' '}
          to <strong className="text-white">{COLOR_LABELS[chosenColor]}</strong>
          {challengerName ? ` against ${challengerName}` : ''}.
        </p>

        <div className="mt-4 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-300 space-y-1">
          <p>
            <strong className="text-white">Accept:</strong> You draw 4 cards and
            lose your turn.
          </p>
          <p>
            <strong className="text-amber-300">Challenge Bluff:</strong> If{' '}
            {actorName} held a {COLOR_LABELS[previousColor]} card, they draw 4
            and you play! If legal, you draw 6 cards.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onAccept}
            className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-sm font-semibold border border-white/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            Accept (+4)
          </button>
          <button
            type="button"
            onClick={onChallenge}
            className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            Challenge Bluff
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const RoundSummaryModal: React.FC<{
  result: RoundResult;
  players: Player[];
  isMatchOver: boolean;
  isTarget500: boolean;
  cardTheme?: CardThemeId;
  onNextRound: () => void;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}> = ({
  result,
  players,
  isMatchOver,
  isTarget500,
  cardTheme = 'classic',
  onNextRound,
  onPlayAgain,
  onReturnToMenu,
}) => {
  const sortedStandings = [...players].sort((a, b) => b.score - a.score);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{opacity: 0, scale: 0.94, y: 12}}
        animate={{opacity: 1, scale: 1, y: 0}}
        transition={{duration: 0.2}}
        className="w-full max-w-2xl max-h-[88dvh] flex flex-col bg-stone-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-bold text-white"
                style={{fontFamily: 'var(--font-display)'}}
              >
                {isMatchOver
                  ? `${result.winnerName} Wins the Match!`
                  : `${result.winnerName} Wins Round ${result.roundNumber}`}
              </h2>
              <p className="text-xs text-stone-400">
                Earned{' '}
                <span className="font-mono font-semibold text-amber-300 tabular-nums">
                  +{result.pointsEarned} pts
                </span>{' '}
                from remaining opponent hands
              </p>
            </div>
          </div>

          {result.coinsAwarded > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/35 text-amber-300 font-mono font-bold text-xs sm:text-sm tabular-nums shrink-0">
              <Coins className="w-4 h-4" />
              <span>+{result.coinsAwarded}</span>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Hand breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-stone-400 mb-2.5">
              Remaining Cards Breakdown
            </h3>
            <div className="space-y-2.5">
              {result.breakdown.map((entry) => (
                <div
                  key={entry.playerId}
                  className="p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-white">
                      {entry.playerName}
                    </span>
                    <span className="text-xs font-mono text-stone-300 tabular-nums">
                      {entry.remainingCards.length === 0
                        ? 'Winner · 0 left'
                        : `${entry.remainingCards.length} cards · ${entry.pointsContributed} pts`}
                    </span>
                  </div>
                  {entry.remainingCards.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.remainingCards.map((c) => (
                        <UnoCardView
                          key={c.id}
                          card={c}
                          size="xs"
                          theme={cardTheme}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cumulative Leaderboard */}
          {isTarget500 && (
            <div>
              <h3 className="text-xs font-semibold text-stone-400 mb-2">
                Match Standings (Target: 500 pts)
              </h3>
              <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-white/10">
                {sortedStandings.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-stone-400 tabular-nums w-4">
                        {idx + 1}.
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-bold text-amber-300 tabular-nums">
                      {p.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReturnToMenu}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-sm font-medium border border-white/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            Table Setup
          </button>
          {isMatchOver ? (
            <button
              type="button"
              onClick={onPlayAgain}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextRound}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Next Round</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const PauseModal: React.FC<{
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  colorSymbols: boolean;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onToggleColorSymbols: () => void;
  onOpenRules: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  onResume: () => void;
}> = ({
  soundEnabled,
  hapticsEnabled,
  colorSymbols,
  onToggleSound,
  onToggleHaptics,
  onToggleColorSymbols,
  onOpenRules,
  onRestart,
  onQuitToMenu,
  onResume,
}) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{opacity: 0, scale: 0.94, y: 8}}
        animate={{opacity: 1, scale: 1, y: 0}}
        transition={{duration: 0.16}}
        className="w-full max-w-sm bg-stone-950 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <div>
          <h3
            className="text-xl font-bold text-white"
            style={{fontFamily: 'var(--font-display)'}}
          >
            Game Menu
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Adjust sound, haptics, or restart the round.
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onToggleSound}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white cursor-pointer"
          >
            <span className="flex items-center gap-2.5 font-medium">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-400" />
              )}
              <span>Sound Effects</span>
            </span>
            <span className="text-xs font-semibold text-stone-300">
              {soundEnabled ? 'On' : 'Muted'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleHaptics}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white cursor-pointer"
          >
            <span className="flex items-center gap-2.5 font-medium">
              <Vibrate
                className={`w-4 h-4 ${
                  hapticsEnabled ? 'text-emerald-400' : 'text-stone-400'
                }`}
              />
              <span>Haptic Vibration</span>
            </span>
            <span className="text-xs font-semibold text-stone-300">
              {hapticsEnabled ? 'On' : 'Off'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleColorSymbols}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white cursor-pointer"
          >
            <span className="flex items-center gap-2.5 font-medium">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Colorblind Symbols</span>
            </span>
            <span className="text-xs font-semibold text-stone-300">
              {colorSymbols ? 'On' : 'Off'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenRules}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white cursor-pointer"
          >
            <span className="flex items-center gap-2.5 font-medium">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Official Rules</span>
            </span>
          </button>
        </div>

        <div className="pt-2 border-t border-white/10 space-y-2">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            Resume Game
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
            <button
              type="button"
              onClick={onQuitToMenu}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit to Setup</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
