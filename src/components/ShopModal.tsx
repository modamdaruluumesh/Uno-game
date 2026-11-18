import React, {useState} from 'react';
import {Check, Coins, Gift, Lock, X} from 'lucide-react';
import {CARD_THEME_LIST, TABLE_THEME_LIST} from '../config/themes';
import {CardThemeId, TableThemeId, UserProfile} from '../types/uno';
import {UnoCardBack, UnoCardView} from './UnoCardView';

interface ShopModalProps {
  isOpen: boolean;
  profile: UserProfile;
  onClose: () => void;
  onBuyCosmetic: (
    kind: 'card' | 'table',
    id: CardThemeId | TableThemeId,
    price: number
  ) => void;
  onEquipCosmetic: (
    kind: 'card' | 'table',
    id: CardThemeId | TableThemeId
  ) => void;
  onClaimDaily: () => void;
}

const SAMPLE_CARD = {id: 'shop-preview', color: 'red' as const, value: '7' as const};

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  profile,
  onClose,
  onBuyCosmetic,
  onEquipCosmetic,
  onClaimDaily,
}) => {
  const [tab, setTab] = useState<'cards' | 'tables'>('cards');

  if (!isOpen) return null;

  const now = Date.now();
  const dailyElapsed = now - profile.lastDailyClaimAt;
  const canClaimDaily = dailyElapsed >= 86_400_000;
  const remainingHours = Math.max(
    1,
    Math.ceil((86_400_000 - dailyElapsed) / 3_600_000)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[90dvh] flex flex-col bg-stone-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
          <div>
            <h2
              id="shop-modal-title"
              className="text-lg sm:text-xl font-bold text-white"
              style={{fontFamily: 'var(--font-display)'}}
            >
              Deck & Table Shop
            </h2>
            <p className="text-xs text-stone-400">
              Earn coins by playing matches or claiming your daily reward.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/35 text-amber-300 font-mono font-bold text-sm tabular-nums">
              <Coins className="w-4 h-4" />
              <span>{profile.coins}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close shop"
              className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Daily Bonus + Tabs */}
        <div className="px-5 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setTab('cards')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'cards'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Card Decks ({CARD_THEME_LIST.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('tables')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'tables'
                  ? 'bg-emerald-600 text-white'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Table Felts ({TABLE_THEME_LIST.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onClaimDaily}
            disabled={!canClaimDaily}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              canClaimDaily
                ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer shadow-sm'
                : 'bg-white/5 text-stone-400 border border-white/10 cursor-not-allowed'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>
              {canClaimDaily ? 'Claim +150 Daily' : `Daily in ${remainingHours}h`}
            </span>
          </button>
        </div>

        {/* Shop Items List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {tab === 'cards'
            ? CARD_THEME_LIST.map((theme) => {
                const isUnlocked = profile.unlockedCards.includes(theme.id);
                const isEquipped = profile.equippedCard === theme.id;
                const canAfford = profile.coins >= theme.price;

                return (
                  <div
                    key={theme.id}
                    className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-colors ${
                      isEquipped
                        ? 'bg-emerald-950/50 border-emerald-400/50'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex items-center -space-x-4 shrink-0">
                        <UnoCardBack size="xs" theme={theme.id} />
                        <UnoCardView
                          card={SAMPLE_CARD}
                          size="xs"
                          theme={theme.id}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {theme.name}
                        </p>
                        <p className="text-xs text-stone-400 line-clamp-2">
                          {theme.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isEquipped ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Equipped</span>
                        </span>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => onEquipCosmetic('card', theme.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-white/12 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 cursor-pointer whitespace-nowrap"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() =>
                            onBuyCosmetic('card', theme.id, theme.price)
                          }
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer'
                              : 'bg-white/5 text-stone-500 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {!canAfford && <Lock className="w-3 h-3" />}
                          <Coins className="w-3.5 h-3.5" />
                          <span className="font-mono tabular-nums">
                            {theme.price}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            : TABLE_THEME_LIST.map((table) => {
                const isUnlocked = profile.unlockedTables.includes(table.id);
                const isEquipped = profile.equippedTable === table.id;
                const canAfford = profile.coins >= table.price;

                return (
                  <div
                    key={table.id}
                    className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-colors ${
                      isEquipped
                        ? 'bg-emerald-950/50 border-emerald-400/50'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-12 h-12 rounded-xl border border-white/25 shadow-inner shrink-0"
                        style={{background: table.bgGradient}}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {table.name}
                        </p>
                        <p className="text-xs text-stone-400 line-clamp-2">
                          {table.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isEquipped ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Equipped</span>
                        </span>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => onEquipCosmetic('table', table.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-white/12 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 cursor-pointer whitespace-nowrap"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() =>
                            onBuyCosmetic('table', table.id, table.price)
                          }
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer'
                              : 'bg-white/5 text-stone-500 border border-white/10 cursor-not-allowed'
                          }`}
                        >
                          {!canAfford && <Lock className="w-3 h-3" />}
                          <Coins className="w-3.5 h-3.5" />
                          <span className="font-mono tabular-nums">
                            {table.price}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
