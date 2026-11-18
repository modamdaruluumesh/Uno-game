import React from 'react';
import {X} from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({isOpen, onClose}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="uno-rules-title"
    >
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-stone-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2
            id="uno-rules-title"
            className="text-xl font-bold text-white"
            style={{fontFamily: 'var(--font-display)'}}
          >
            Official UNO Rules
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm text-stone-300 leading-relaxed">
          <section>
            <h3 className="text-base font-semibold text-white mb-1.5">
              1. Deck & Setup (108 Cards)
            </h3>
            <p>
              Each player starts with 7 cards. The deck has four colors (Red,
              Yellow, Green, Blue) each containing one 0, two 1–9s, two Skips,
              two Reverses, and two Draw Twos, plus four Wild and four Wild Draw
              Four cards.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-1.5">
              2. Matching & Drawing
            </h3>
            <p>
              On your turn, play a card matching the active color, number, or
              action symbol of the top discard card—or play a Wild card. If you
              cannot or choose not to play, draw 1 card from the Draw Pile. If
              that drawn card is playable, you may play it immediately or keep
              it and pass your turn.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-1.5">
              3. Action & Wild Cards
            </h3>
            <ul className="space-y-1.5 list-disc pl-5 text-stone-300">
              <li>
                <strong className="text-white">Skip:</strong> Next player loses
                their turn.
              </li>
              <li>
                <strong className="text-white">Reverse:</strong> Reverses turn
                direction. In a 2-player game, Reverse acts like Skip so you
                play again immediately.
              </li>
              <li>
                <strong className="text-white">Draw Two (+2):</strong> Next
                player draws 2 cards and loses their turn.
              </li>
              <li>
                <strong className="text-white">Wild:</strong> Choose the active
                color to continue play.
              </li>
              <li>
                <strong className="text-white">Wild Draw Four (+4):</strong>{' '}
                Choose the active color; the next player draws 4 cards and loses
                their turn.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-1.5">
              4. Challenging a Wild Draw Four
            </h3>
            <p>
              Officially, you should only play Wild +4 when you have no cards
              matching the current active color—but you may bluff. The victim
              can accept (+4) or challenge:
            </p>
            <ul className="mt-1.5 space-y-1 list-disc pl-5">
              <li>
                <strong className="text-emerald-400">Bluff Caught:</strong> If
                the player held a card of the previous active color, they draw 4
                cards instead and the challenger keeps their turn.
              </li>
              <li>
                <strong className="text-amber-400">Legal Play:</strong> If the
                +4 was legal, the challenger draws 6 cards (4 + 2 penalty) and
                loses their turn.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-1.5">
              5. Calling "UNO!" & Catching Opponents
            </h3>
            <p>
              When you have 2 cards and are about to play down to 1 (or right
              after playing down to 1), press the{' '}
              <strong className="text-amber-300">UNO!</strong> button. If any
              player drops to 1 card without calling UNO, opponents can catch
              them before the next play—forcing a 2-card penalty.
            </p>
          </section>

          <section>
            <h3 className="text-base font-semibold text-white mb-1.5">
              6. First Card Flipped & Scoring
            </h3>
            <p>
              If the opening discard is Skip, Reverse, Draw Two, or Wild, its
              effect applies to the first player (Wild Draw Four is reshuffled
              back into the deck). The first player to empty their hand wins the
              round and scores all cards left in opponents&apos; hands:
              0–9 = face value, Action cards = 20 pts, Wild cards = 50 pts.
            </p>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
