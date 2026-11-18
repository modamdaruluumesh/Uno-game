import {User} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {db, handleFirestoreError, OperationType} from '../firebase';
import {CardThemeId, TableThemeId, UserProfile} from '../types/uno';

const GUEST_STORAGE_KEY = 'uno_tabletop_guest_profile_v1';

export const DEFAULT_GUEST_PROFILE: UserProfile = {
  uid: 'guest',
  displayName: 'You',
  coins: 250,
  unlockedCards: ['classic'],
  unlockedTables: ['emerald'],
  equippedCard: 'classic',
  equippedTable: 'emerald',
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  highestRoundPoints: 0,
  lastDailyClaimAt: 0,
};

export function loadGuestProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_GUEST_PROFILE;
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return DEFAULT_GUEST_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...DEFAULT_GUEST_PROFILE,
      ...parsed,
      uid: 'guest',
      displayName:
        typeof parsed.displayName === 'string' && parsed.displayName.trim()
          ? parsed.displayName.trim().slice(0, 24)
          : 'You',
      unlockedCards:
        Array.isArray(parsed.unlockedCards) && parsed.unlockedCards.length > 0
          ? parsed.unlockedCards
          : ['classic'],
      unlockedTables:
        Array.isArray(parsed.unlockedTables) && parsed.unlockedTables.length > 0
          ? parsed.unlockedTables
          : ['emerald'],
    };
  } catch {
    return DEFAULT_GUEST_PROFILE;
  }
}

export function saveGuestProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore quota errors
  }
}

export async function ensureUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const cleanName =
        (user.displayName ?? 'Player').trim().slice(0, 24) || 'Player';
      await setDoc(ref, {
        uid: user.uid,
        displayName: cleanName,
        coins: 250,
        unlockedCards: ['classic'],
        unlockedTables: ['emerald'],
        equippedCard: 'classic',
        equippedTable: 'emerald',
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        bestStreak: 0,
        highestRoundPoints: 0,
        lastDailyClaimAt: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(
  uid: string,
  onProfile: (profile: UserProfile) => void,
  onError: (err: unknown) => void
): () => void {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        onProfile(data);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function updateDisplayNameCloud(
  uid: string,
  displayName: string
): Promise<void> {
  const clean = displayName.trim().slice(0, 24) || 'Player';
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: clean,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function equipCosmeticCloud(
  uid: string,
  kind: 'card' | 'table',
  themeId: CardThemeId | TableThemeId
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...(kind === 'card'
        ? {equippedCard: themeId}
        : {equippedTable: themeId}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function purchaseCosmeticCloud(
  profile: UserProfile,
  kind: 'card' | 'table',
  themeId: CardThemeId | TableThemeId,
  price: number
): Promise<void> {
  if (profile.coins < price) return;
  const path = `users/${profile.uid}`;
  try {
    if (kind === 'card') {
      const cardId = themeId as CardThemeId;
      const nextUnlocked = profile.unlockedCards.includes(cardId)
        ? profile.unlockedCards
        : [...profile.unlockedCards, cardId];
      await updateDoc(doc(db, 'users', profile.uid), {
        coins: profile.coins - price,
        unlockedCards: nextUnlocked,
        equippedCard: cardId,
        updatedAt: serverTimestamp(),
      });
    } else {
      const tableId = themeId as TableThemeId;
      const nextUnlocked = profile.unlockedTables.includes(tableId)
        ? profile.unlockedTables
        : [...profile.unlockedTables, tableId];
      await updateDoc(doc(db, 'users', profile.uid), {
        coins: profile.coins - price,
        unlockedTables: nextUnlocked,
        equippedTable: tableId,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function claimDailyBonusCloud(profile: UserProfile): Promise<void> {
  const now = Date.now();
  if (now - profile.lastDailyClaimAt < 86_400_000) return;
  const path = `users/${profile.uid}`;
  try {
    await updateDoc(doc(db, 'users', profile.uid), {
      coins: profile.coins + 150,
      lastDailyClaimAt: now,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function recordMatchRewardsCloud(
  profile: UserProfile,
  didWin: boolean,
  pointsEarned: number,
  coinsAwarded: number
): Promise<void> {
  const path = `users/${profile.uid}`;
  const nextStreak = didWin ? profile.currentStreak + 1 : 0;
  try {
    await updateDoc(doc(db, 'users', profile.uid), {
      coins: profile.coins + coinsAwarded,
      gamesPlayed: profile.gamesPlayed + 1,
      gamesWon: profile.gamesWon + (didWin ? 1 : 0),
      currentStreak: nextStreak,
      bestStreak: Math.max(profile.bestStreak, nextStreak),
      highestRoundPoints: didWin
        ? Math.max(profile.highestRoundPoints, pointsEarned)
        : profile.highestRoundPoints,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
