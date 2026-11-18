import React from 'react';
import {User as FirebaseUser} from 'firebase/auth';
import {Coins, LogIn, LogOut, Trophy, X} from 'lucide-react';
import {UserProfile} from '../types/uno';

interface AccountModalProps {
  isOpen: boolean;
  authUser: FirebaseUser | null;
  profile: UserProfile;
  authError: string | null;
  isSigningIn: boolean;
  onClose: () => void;
  onSignInGoogle: () => void;
  onSignOut: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  authUser,
  profile,
  authError,
  isSigningIn,
  onClose,
  onSignInGoogle,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div className="w-full max-w-md bg-stone-950 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2
            id="account-modal-title"
            className="text-xl font-bold text-white"
            style={{fontFamily: 'var(--font-display)'}}
          >
            {authUser ? 'Player Account' : 'Sign In & Sync'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {authUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10">
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={profile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {profile.displayName}
                </p>
                <p className="text-xs text-stone-400 truncate">
                  {authUser.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-stone-400">Coin Balance</p>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-mono font-bold text-amber-300 tabular-nums">
                  <Coins className="w-4 h-4" />
                  <span>{profile.coins}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-stone-400">Matches Won</p>
                <p className="mt-1 flex items-center gap-1.5 text-lg font-mono font-bold text-emerald-300 tabular-nums">
                  <Trophy className="w-4 h-4" />
                  <span>
                    {profile.gamesWon}/{profile.gamesPlayed} ({winRate}%)
                  </span>
                </p>
              </div>
            </div>

            <div className="text-xs text-stone-300 flex items-center justify-between px-1 font-mono tabular-nums">
              <span>Current Streak: {profile.currentStreak}</span>
              <span>Best Streak: {profile.bestStreak}</span>
              <span>Best Round: {profile.highestRoundPoints}p</span>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/8 hover:bg-white/15 border border-white/12 text-stone-200 text-sm font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-stone-300 leading-relaxed">
              Sign in with Google to save your{' '}
              <strong className="text-amber-300">Coins</strong>, unlocked{' '}
              <strong className="text-white">Card Decks & Table Felts</strong>,
              and career win streaks across sessions and devices.
            </p>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-stone-400 space-y-1">
              <p>
                Guest wallet active locally:{' '}
                <strong className="text-amber-300 font-mono tabular-nums">
                  {profile.coins} Coins
                </strong>
              </p>
              <p>
                Signed-in accounts start with 250 Coins and cloud-synced
                unlocks.
              </p>
            </div>

            {authError && (
              <p className="text-xs text-red-300 bg-red-950/60 border border-red-400/30 rounded-lg px-3 py-2">
                {authError}
              </p>
            )}

            <button
              type="button"
              disabled={isSigningIn}
              onClick={onSignInGoogle}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-stone-950 text-sm font-bold transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
