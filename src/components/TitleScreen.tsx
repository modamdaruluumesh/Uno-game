import React from 'react';
import {
  BookOpen,
  Bot,
  Layers,
  Palette,
  Play,
  RefreshCw,
  ShieldAlert,
  User,
  Users,
} from 'lucide-react';
import {
  BotDifficulty,
  MatchFormat,
  PlayMode,
  RuleConfig,
  UserProfile,
} from '../types/uno';
import {UnoCardView} from './UnoCardView';

interface TitleScreenProps {
  rules: RuleConfig;
  profile: UserProfile;
  onChangeRules: (next: RuleConfig) => void;
  onChangePlayerName: (name: string) => void;
  onStartGame: () => void;
  onOpenRules: () => void;
  onOpenShop: () => void;
}

const SHOWCASE_CARDS = [
  {id: 'show-1', color: 'red' as const, value: '7' as const},
  {id: 'show-2', color: 'blue' as const, value: 'reverse' as const},
  {id: 'show-3', color: 'yellow' as const, value: 'draw2' as const},
  {id: 'show-4', color: 'wild' as const, value: 'wild4' as const},
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  rules,
  profile,
  onChangeRules,
  onChangePlayerName,
  onStartGame,
  onOpenRules,
  onOpenShop,
}) => {
  const update = <K extends keyof RuleConfig>(key: K, val: RuleConfig[K]) => {
    onChangeRules({...rules, [key]: val});
  };

  const updatePassPlayName = (idx: number, val: string) => {
    const next: [string, string, string, string] = [...rules.passPlayNames];
    next[idx] = val.slice(0, 14);
    update('passPlayNames', next);
  };

  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100)
      : 0;

  const isPassAndPlay = rules.playMode === 'pass_and_play';

  return (
    <div className="w-full flex flex-col justify-center items-center px-3 py-2 sm:px-6 sm:py-5">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">
        {/* Left column: Brand & Card Showcase (desktop & larger tablets) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-8 shadow-2xl">
          <div>
            <p className="text-xs font-medium text-emerald-200/80 tracking-wide">
              108-Card Official Deck · Solo & Pass-and-Play
            </p>
            <h1
              className="mt-3 text-5xl font-black tracking-tight text-white text-balance"
              style={{fontFamily: 'var(--font-display)'}}
            >
              UNO Tabletop
            </h1>
            <p className="mt-3 text-base text-emerald-50/80 leading-relaxed">
              Match colors or numbers, unleash action cards, bluff or challenge
              Wild Draw Fours, and unlock custom card decks and table felts.
            </p>
          </div>

          {/* Card fan reflecting equipped card deck theme */}
          <div className="my-7 flex items-center justify-center py-4">
            <div className="flex items-center -space-x-5">
              {SHOWCASE_CARDS.map((card, i) => {
                const rotations = [
                  '-rotate-12 translate-y-2',
                  '-rotate-4 -translate-y-1',
                  'rotate-4 -translate-y-1',
                  'rotate-12 translate-y-2',
                ];
                return (
                  <div key={card.id} className={rotations[i]}>
                    <UnoCardView
                      card={card}
                      size="md"
                      theme={profile.equippedCard}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {profile.gamesPlayed > 0 && (
              <div className="flex items-center justify-between text-xs text-stone-300 font-mono tabular-nums pt-3 border-t border-white/10">
                <span>
                  {profile.gamesWon}/{profile.gamesPlayed} Won ({winRate}%)
                </span>
                <span>Streak: {profile.currentStreak}</span>
                <span>Best: {profile.highestRoundPoints}p</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenShop}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 text-sm font-semibold border border-amber-400/30 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Palette className="w-4 h-4" />
                <span>Deck Shop</span>
              </button>
              <button
                type="button"
                onClick={onOpenRules}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/18 text-white text-sm font-medium border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                <span>Rules</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Match Configuration (fits cleanly on mobile without scroll) */}
        <div className="lg:col-span-7 bg-stone-950/85 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 sm:p-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-2.5 sm:space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2
                  className="text-base sm:text-xl font-bold text-white truncate"
                  style={{fontFamily: 'var(--font-display)'}}
                >
                  Table Setup
                </h2>
                {profile.gamesPlayed > 0 ? (
                  <p className="text-[11px] sm:text-xs text-emerald-200/80 font-mono tabular-nums truncate">
                    {profile.gamesWon}W · {winRate}% · Streak{' '}
                    {profile.currentStreak}
                  </p>
                ) : (
                  <p className="text-[11px] sm:text-xs text-stone-400 truncate">
                    Solo bots or Pass &amp; Play with friends.
                  </p>
                )}
              </div>

              <div className="flex lg:hidden items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 text-xs font-semibold border border-amber-400/30 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Shop</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRules}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/18 text-white text-xs font-medium border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Rules</span>
                </button>
              </div>
            </div>

            {/* Game Mode + Table Size */}
            <div className="grid grid-cols-12 gap-2 sm:gap-3">
              <div className="col-span-7">
                <label className="block text-[11px] sm:text-xs font-medium text-stone-300 mb-1">
                  Mode
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                  {(
                    [
                      {id: 'bots', label: 'vs Bots', icon: Bot},
                      {id: 'pass_and_play', label: 'Pass & Play', icon: Users},
                    ] as {
                      id: PlayMode;
                      label: string;
                      icon: typeof Bot;
                    }[]
                  ).map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => update('playMode', mode.id)}
                        className={`inline-flex items-center justify-center gap-1 py-1.5 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          rules.playMode === mode.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-stone-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-5">
                <label className="block text-[11px] sm:text-xs font-medium text-stone-300 mb-1">
                  Players
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                  {([2, 3, 4] as const).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => update('playerCount', count)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        rules.playerCount === count
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-stone-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {count}P
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Player Name(s), Match Format & AI Strategy */}
            {isPassAndPlay ? (
              <div className="space-y-2 sm:space-y-2.5">
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-stone-300 mb-1">
                    Match Format
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                    {(
                      [
                        {id: 'single', label: 'Single Round'},
                        {id: 'target500', label: 'First to 500'},
                      ] as {id: MatchFormat; label: string}[]
                    ).map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => update('matchFormat', fmt.id)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          rules.matchFormat === fmt.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-stone-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-stone-300 mb-1">
                    Player Names (Pass-Device Privacy Enabled)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {Array.from({length: rules.playerCount}).map((_, idx) => (
                      <div key={idx} className="relative flex items-center">
                        <span className="text-[10px] font-mono text-stone-400 absolute left-2.5 pointer-events-none">
                          P{idx + 1}
                        </span>
                        <input
                          type="text"
                          maxLength={14}
                          value={rules.passPlayNames[idx] ?? ''}
                          onChange={(e) =>
                            updatePassPlayName(idx, e.target.value)
                          }
                          placeholder={`Player ${idx + 1}`}
                          aria-label={`Player ${idx + 1} name`}
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-white/5 border border-white/12 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-2.5">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label
                      htmlFor="player-name-input"
                      className="block text-[11px] sm:text-xs font-medium text-stone-300 mb-1"
                    >
                      Your Name
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
                      <input
                        id="player-name-input"
                        type="text"
                        maxLength={14}
                        value={profile.displayName}
                        onChange={(e) => onChangePlayerName(e.target.value)}
                        placeholder="You"
                        className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 rounded-xl bg-white/5 border border-white/12 text-xs sm:text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] sm:text-xs font-medium text-stone-300 mb-1">
                      AI Strategy
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                      {(
                        [
                          {id: 'casual', label: 'Casual'},
                          {id: 'sharp', label: 'Sharp'},
                        ] as {id: BotDifficulty; label: string}[]
                      ).map((diff) => (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => update('difficulty', diff.id)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap truncate ${
                            rules.difficulty === diff.id
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-stone-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {diff.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-stone-300 mb-1">
                    Match Format
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                    {(
                      [
                        {id: 'single', label: 'Single Round'},
                        {id: 'target500', label: 'First to 500'},
                      ] as {id: MatchFormat; label: string}[]
                    ).map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => update('matchFormat', fmt.id)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          rules.matchFormat === fmt.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-stone-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ruleset Toggles */}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <p className="text-[11px] sm:text-xs font-medium text-stone-300">
                Ruleset Options
              </p>

              <button
                type="button"
                onClick={() => update('wild4Challenge', !rules.wild4Challenge)}
                className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      Wild +4 Bluff &amp; Challenge
                    </p>
                    <p className="hidden sm:block text-xs text-stone-400">
                      Caught bluffer draws 4; failed challenger draws 6.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold shrink-0 ${
                    rules.wild4Challenge
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {rules.wild4Challenge ? 'On' : 'Off'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => update('stackDrawCards', !rules.stackDrawCards)}
                className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      Stack Draw Cards (+2 / +4)
                    </p>
                    <p className="hidden sm:block text-xs text-stone-400">
                      House rule: pass +2 or +4 penalties by stacking.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold shrink-0 ${
                    rules.stackDrawCards
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {rules.stackDrawCards ? 'On' : 'Off'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  update('drawUntilPlayable', !rules.drawUntilPlayable)
                }
                className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      Draw Until Playable
                    </p>
                    <p className="hidden sm:block text-xs text-stone-400">
                      House rule: keep drawing until a playable card appears.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold shrink-0 ${
                    rules.drawUntilPlayable
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {rules.drawUntilPlayable ? 'On' : 'Off'}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3.5 border-t border-white/10 flex items-center justify-between gap-3">
            <p className="text-[11px] sm:text-xs text-stone-400 truncate">
              {rules.playerCount === 2
                ? '2P rule: Reverse acts as Skip.'
                : isPassAndPlay
                  ? 'Hands hidden between turns.'
                  : 'Standard turn order.'}
            </p>
            <button
              type="button"
              onClick={onStartGame}
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Game</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
