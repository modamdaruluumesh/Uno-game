import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut} from 'firebase/auth';
import {AnimatePresence, motion} from 'motion/react';
import {
  AlertTriangle,
  ArrowDownUp,
  BookOpen,
  Coins,
  Eye,
  EyeOff,
  LogIn,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  WifiOff,
} from 'lucide-react';
import {
  ActiveColor,
  CardThemeId,
  GamePhase,
  MoveAnnouncement,
  PendingPrompt,
  Player,
  RoundBreakdownEntry,
  RoundResult,
  RuleConfig,
  TableThemeId,
  TurnDirection,
  UnoCard,
  UserProfile,
} from './types/uno';
import {
  COLOR_LABELS,
  COLORS,
  calculateHandPoints,
  chooseAiCard,
  createOfficialDeck,
  drawFromPiles,
  formatCardName,
  getBotName,
  getNextPlayerIndex,
  hasMatchingColorInHand,
  isCardPlayable,
  pickBestColorForHand,
  shouldAiChallengeWild4,
  shuffleCards,
  sortHandForDisplay,
} from './engine/unoEngine';
import {TABLE_THEMES} from './config/themes';
import {auth, googleProvider} from './firebase';
import {
  claimDailyBonusCloud,
  ensureUserProfile,
  equipCosmeticCloud,
  loadGuestProfile,
  purchaseCosmeticCloud,
  recordMatchRewardsCloud,
  saveGuestProfile,
  subscribeUserProfile,
  updateDisplayNameCloud,
} from './services/userProfileService';
import {soundEngine} from './utils/sound';
import {haptics} from './utils/haptics';
import {useOnlineStatus} from './hooks/useOnlineStatus';
import {UnoCardBack, UnoCardView} from './components/UnoCardView';
import {TitleScreen} from './components/TitleScreen';
import {RulesModal} from './components/RulesModal';
import {
  PauseModal,
  RoundSummaryModal,
  Wild4ChallengeModal,
  WildColorPickerModal,
} from './components/GameModals';
import {OpponentSeat} from './components/OpponentSeat';
import {PWAInstallButton} from './components/PWAInstallButton';
import {ShopModal} from './components/ShopModal';
import {AccountModal} from './components/AccountModal';

const DEFAULT_RULES: RuleConfig = {
  playMode: 'bots',
  playerCount: 4,
  passPlayNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
  matchFormat: 'single',
  difficulty: 'sharp',
  wild4Challenge: true,
  stackDrawCards: false,
  drawUntilPlayable: false,
};

const ACTIVE_COLOR_SWATCH: Record<
  ActiveColor,
  {dot: string; border: string; text: string; glow: string; symbol: string}
> = {
  red: {
    dot: 'bg-red-500',
    border: 'border-red-400/50',
    text: 'text-red-200',
    glow: 'from-red-500/20 via-red-500/5 to-transparent',
    symbol: '●',
  },
  yellow: {
    dot: 'bg-yellow-400',
    border: 'border-yellow-300/60',
    text: 'text-yellow-200',
    glow: 'from-yellow-400/20 via-yellow-400/5 to-transparent',
    symbol: '▲',
  },
  green: {
    dot: 'bg-green-500',
    border: 'border-green-400/50',
    text: 'text-green-200',
    glow: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    symbol: '■',
  },
  blue: {
    dot: 'bg-blue-500',
    border: 'border-blue-400/50',
    text: 'text-blue-200',
    glow: 'from-blue-500/20 via-blue-500/5 to-transparent',
    symbol: '◆',
  },
};

interface ActionBurst {
  id: number;
  label: string;
  tone: 'amber' | 'red' | 'emerald' | 'sky';
}

export default function App() {
  const [rules, setRules] = useState<RuleConfig>(DEFAULT_RULES);
  const [phase, setPhase] = useState<GamePhase>('TITLE_MENU');
  const [roundNumber, setRoundNumber] = useState(1);

  const [players, setPlayers] = useState<Player[]>([]);
  const [drawPile, setDrawPile] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [activeColor, setActiveColor] = useState<ActiveColor>('red');
  const [direction, setDirection] = useState<TurnDirection>(1);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  const [pendingDrawCount, setPendingDrawCount] = useState(0);
  const [pendingDrawType, setPendingDrawType] = useState<
    'draw2' | 'wild4' | null
  >(null);
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(
    null
  );
  const [vulnerableUnoPlayerId, setVulnerableUnoPlayerId] = useState<
    string | null
  >(null);
  const [passCurtainForIndex, setPassCurtainForIndex] = useState<number | null>(
    null
  );

  const [announcement, setAnnouncement] = useState<MoveAnnouncement>({
    id: 0,
    text: 'Welcome to UNO Tabletop.',
    tone: 'neutral',
  });
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [colorSymbols, setColorSymbols] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  // Auth & Profile (Firebase Spark free tier + Guest localStorage fallback)
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() =>
    loadGuestProfile()
  );

  const [actionBurst, setActionBurst] = useState<ActionBurst | null>(null);
  const isOnline = useOnlineStatus();

  const announcementSeq = useRef(1);
  const burstTimerRef = useRef<number | null>(null);
  const nameSyncTimerRef = useRef<number | null>(null);

  // Subscribe to Firebase Auth & User Profile
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setAuthUser(user);
      if (user) {
        try {
          await ensureUserProfile(user);
          unsubscribeProfile = subscribeUserProfile(
            user.uid,
            (cloudProfile) => {
              setProfile(cloudProfile);
            },
            (err) => {
              console.error('Firestore profile listener error:', err);
            }
          );
        } catch (err) {
          console.error('Failed to ensure user profile:', err);
        }
      } else {
        setProfile(loadGuestProfile());
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleSignInGoogle = useCallback(async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setAccountModalOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google Sign-In failed.';
      setAuthError(
        message.includes('popup-closed')
          ? 'Sign-in popup was closed before completing.'
          : message
      );
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      setAccountModalOpen(false);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }, []);

  const triggerBurst = useCallback(
    (label: string, tone: ActionBurst['tone'] = 'amber') => {
      if (burstTimerRef.current) {
        window.clearTimeout(burstTimerRef.current);
      }
      announcementSeq.current += 1;
      setActionBurst({id: announcementSeq.current, label, tone});
      burstTimerRef.current = window.setTimeout(() => {
        setActionBurst(null);
      }, 850);
    },
    []
  );

  const announce = useCallback(
    (text: string, tone: MoveAnnouncement['tone'] = 'neutral') => {
      announcementSeq.current += 1;
      setAnnouncement({id: announcementSeq.current, text, tone});
    },
    []
  );

  // Sync audio & haptics state
  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    haptics.setEnabled(hapticsEnabled);
  }, [hapticsEnabled]);

  const handleUpdatePlayerName = useCallback(
    (name: string) => {
      const sliced = name.slice(0, 14);
      setProfile((prev) => {
        const next = {...prev, displayName: sliced};
        if (!authUser) saveGuestProfile(next);
        return next;
      });

      if (authUser) {
        if (nameSyncTimerRef.current) {
          window.clearTimeout(nameSyncTimerRef.current);
        }
        const trimmed = sliced.trim();
        if (trimmed.length > 0) {
          const uid = authUser.uid;
          nameSyncTimerRef.current = window.setTimeout(() => {
            void updateDisplayNameCloud(uid, trimmed);
          }, 700);
        }
      }
    },
    [authUser]
  );

  // Shop handlers
  const handleBuyCosmetic = useCallback(
    async (
      kind: 'card' | 'table',
      id: CardThemeId | TableThemeId,
      price: number
    ) => {
      if (profile.coins < price) return;
      soundEngine.unoShout();
      haptics.action();

      if (authUser) {
        await purchaseCosmeticCloud(profile, kind, id, price);
      } else {
        setProfile((prev) => {
          if (prev.coins < price) return prev;
          const next: UserProfile =
            kind === 'card'
              ? {
                  ...prev,
                  coins: prev.coins - price,
                  unlockedCards: prev.unlockedCards.includes(id as CardThemeId)
                    ? prev.unlockedCards
                    : [...prev.unlockedCards, id as CardThemeId],
                  equippedCard: id as CardThemeId,
                }
              : {
                  ...prev,
                  coins: prev.coins - price,
                  unlockedTables: prev.unlockedTables.includes(
                    id as TableThemeId
                  )
                    ? prev.unlockedTables
                    : [...prev.unlockedTables, id as TableThemeId],
                  equippedTable: id as TableThemeId,
                };
          saveGuestProfile(next);
          return next;
        });
      }
    },
    [authUser, profile]
  );

  const handleEquipCosmetic = useCallback(
    async (kind: 'card' | 'table', id: CardThemeId | TableThemeId) => {
      soundEngine.playCard();
      haptics.tap();
      if (authUser) {
        await equipCosmeticCloud(authUser.uid, kind, id);
      } else {
        setProfile((prev) => {
          const next: UserProfile =
            kind === 'card'
              ? {...prev, equippedCard: id as CardThemeId}
              : {...prev, equippedTable: id as TableThemeId};
          saveGuestProfile(next);
          return next;
        });
      }
    },
    [authUser]
  );

  const handleClaimDaily = useCallback(async () => {
    const now = Date.now();
    if (now - profile.lastDailyClaimAt < 86_400_000) return;
    soundEngine.victory();
    haptics.victory();
    if (authUser) {
      await claimDailyBonusCloud(profile);
    } else {
      setProfile((prev) => {
        if (Date.now() - prev.lastDailyClaimAt < 86_400_000) return prev;
        const next: UserProfile = {
          ...prev,
          coins: prev.coins + 150,
          lastDailyClaimAt: Date.now(),
        };
        saveGuestProfile(next);
        return next;
      });
    }
  }, [authUser, profile]);

  const maybeTriggerPassCurtain = useCallback(
    (nextActorIdx: number, previousActorIdx: number) => {
      if (
        rules.playMode === 'pass_and_play' &&
        nextActorIdx !== previousActorIdx
      ) {
        setPassCurtainForIndex(nextActorIdx);
      }
    },
    [rules.playMode]
  );

  // Initialize a round (preserving scores when advancing rounds)
  const startRound = useCallback(
    (existingScores?: Record<string, number>, nextRoundNum = 1) => {
      const deck = createOfficialDeck();
      const newPlayers: Player[] = [];
      const isPassPlay = rules.playMode === 'pass_and_play';
      const humanDisplayName = profile.displayName.trim() || 'You';

      for (let i = 0; i < rules.playerCount; i++) {
        const id = isPassPlay ? `p-${i}` : i === 0 ? 'human' : `bot-${i}`;
        const isHuman = isPassPlay ? true : i === 0;
        const name = isPassPlay
          ? rules.passPlayNames[i]?.trim() || `Player ${i + 1}`
          : i === 0
            ? humanDisplayName
            : getBotName(i - 1);
        const hand = deck.splice(0, 7);
        newPlayers.push({
          id,
          name,
          isHuman,
          hand: isHuman ? sortHandForDisplay(hand) : hand,
          score: existingScores?.[id] ?? 0,
          unoCalled: false,
        });
      }

      // Flip opening discard card following official UNO setup rules:
      // Wild Draw Four must be returned & reshuffled until another card appears.
      let workingDeck = [...deck];
      let firstCard = workingDeck.pop()!;
      while (firstCard.value === 'wild4') {
        workingDeck.unshift(firstCard);
        workingDeck = shuffleCards(workingDeck);
        firstCard = workingDeck.pop()!;
      }

      let startTurn = 0;
      let startDir: TurnDirection = 1;
      const startColor: ActiveColor =
        firstCard.color === 'wild'
          ? COLORS[Math.floor(Math.random() * COLORS.length)]
          : firstCard.color;
      let initialPrompt: PendingPrompt | null = null;
      let initialMsg = `Round ${nextRoundNum} dealt. Opening card: ${formatCardName(firstCard)}.`;

      if (firstCard.value === 'wild') {
        initialPrompt = {type: 'CHOOSE_FIRST_WILD_COLOR'};
        initialMsg = 'Wild flipped first! Choose the starting color.';
      } else if (firstCard.value === 'skip') {
        startTurn = getNextPlayerIndex(0, 1, newPlayers.length);
        initialMsg = `Opening Skip! ${newPlayers[0].name} skipped — ${newPlayers[startTurn].name} starts.`;
      } else if (firstCard.value === 'reverse') {
        startDir = -1;
        startTurn = getNextPlayerIndex(0, -1, newPlayers.length);
        initialMsg = `Opening Reverse! Direction reversed — ${newPlayers[startTurn].name} starts.`;
      } else if (firstCard.value === 'draw2') {
        const extra = workingDeck.splice(-2, 2);
        newPlayers[0].hand = sortHandForDisplay([...newPlayers[0].hand, ...extra]);
        startTurn = getNextPlayerIndex(0, 1, newPlayers.length);
        initialMsg = `Opening Draw Two! ${newPlayers[0].name} draws 2 cards — ${newPlayers[startTurn].name} starts.`;
      }

      setPlayers(newPlayers);
      setDrawPile(workingDeck);
      setDiscardPile([firstCard]);
      setActiveColor(startColor);
      setDirection(startDir);
      setCurrentTurnIndex(startTurn);
      setPendingDrawCount(0);
      setPendingDrawType(null);
      setPendingPrompt(initialPrompt);
      setVulnerableUnoPlayerId(null);
      setPassCurtainForIndex(isPassPlay ? startTurn : null);
      setRoundResult(null);
      setRoundNumber(nextRoundNum);
      setPhase('PLAYING');
      announce(initialMsg, 'action');
      soundEngine.playCard();
      haptics.tap();
    },
    [rules, profile.displayName, announce]
  );

  const handleStartNewMatch = useCallback(() => {
    startRound(undefined, 1);
  }, [startRound]);

  // Finish round & calculate official UNO points + award Coins
  const finishRound = useCallback(
    (winnerIndex: number, updatedPlayers: Player[]) => {
      const winner = updatedPlayers[winnerIndex];
      let pointsEarned = 0;

      const breakdown: RoundBreakdownEntry[] = updatedPlayers.map((p) => {
        const pts = p.id === winner.id ? 0 : calculateHandPoints(p.hand);
        pointsEarned += pts;
        return {
          playerId: p.id,
          playerName: p.name,
          isHuman: p.isHuman,
          remainingCards: p.hand,
          pointsContributed: pts,
          totalScoreAfter: p.score,
        };
      });

      const finalPlayers = updatedPlayers.map((p) =>
        p.id === winner.id ? {...p, score: p.score + pointsEarned} : p
      );

      const finalBreakdown = breakdown.map((entry) => ({
        ...entry,
        totalScoreAfter:
          entry.playerId === winner.id
            ? winner.score + pointsEarned
            : entry.totalScoreAfter,
      }));

      const winnerNewScore = winner.score + pointsEarned;
      const matchWon =
        rules.matchFormat === 'single' || winnerNewScore >= 500;

      let coinsAwarded = 0;
      if (matchWon) {
        if (rules.playMode === 'pass_and_play') {
          coinsAwarded = 40;
        } else {
          coinsAwarded = winner.isHuman
            ? 100 + Math.min(100, Math.floor(winnerNewScore / 5))
            : 25;
        }
      }

      setPlayers(finalPlayers);
      setPendingPrompt(null);
      setPendingDrawCount(0);
      setPendingDrawType(null);
      setVulnerableUnoPlayerId(null);
      setPassCurtainForIndex(null);
      setRoundResult({
        roundNumber,
        winnerId: winner.id,
        winnerName: winner.name,
        pointsEarned,
        coinsAwarded,
        breakdown: finalBreakdown,
        matchWon,
      });
      setPhase(matchWon ? 'GAME_OVER' : 'ROUND_SUMMARY');
      soundEngine.victory();
      haptics.victory();

      if (matchWon) {
        const didWin =
          rules.playMode === 'pass_and_play' ? true : winner.isHuman;
        if (authUser) {
          void recordMatchRewardsCloud(
            profile,
            didWin,
            pointsEarned,
            coinsAwarded
          );
        } else {
          setProfile((prev) => {
            const nextStreak = didWin ? prev.currentStreak + 1 : 0;
            const next: UserProfile = {
              ...prev,
              coins: prev.coins + coinsAwarded,
              gamesPlayed: prev.gamesPlayed + 1,
              gamesWon: prev.gamesWon + (didWin ? 1 : 0),
              currentStreak: nextStreak,
              bestStreak: Math.max(prev.bestStreak, nextStreak),
              highestRoundPoints: didWin
                ? Math.max(prev.highestRoundPoints, pointsEarned)
                : prev.highestRoundPoints,
            };
            saveGuestProfile(next);
            return next;
          });
        }
      }

      announce(
        `${winner.name} wins the round for +${pointsEarned} points!`,
        'success'
      );
    },
    [
      rules.matchFormat,
      rules.playMode,
      roundNumber,
      authUser,
      profile,
      announce,
    ]
  );

  // Core card resolution after color (if Wild) is known
  const resolveCardPlay = useCallback(
    (
      actorIndex: number,
      card: UnoCard,
      chosenWildColor?: ActiveColor,
      customPlayers?: Player[],
      customDrawPile?: UnoCard[],
      customDiscardPile?: UnoCard[]
    ) => {
      const currentPlayers = customPlayers ?? players;
      const currentDraw = customDrawPile ?? drawPile;
      const currentDiscard = customDiscardPile ?? discardPile;
      const previousActiveColor = activeColor;

      const actor = currentPlayers[actorIndex];
      const remainingHand = actor.hand.filter((c) => c.id !== card.id);

      // Check UNO call status when dropping to 1 card
      let nextUnoCalled = actor.unoCalled;
      let nextVulnerableId: string | null = null;

      if (remainingHand.length === 1) {
        if (actor.isHuman) {
          if (!actor.unoCalled) {
            nextVulnerableId = actor.id;
          }
        } else {
          const forgetChance = rules.difficulty === 'sharp' ? 0.12 : 0.28;
          if (Math.random() < forgetChance) {
            nextUnoCalled = false;
            nextVulnerableId = actor.id;
          } else {
            nextUnoCalled = true;
            soundEngine.unoShout();
          }
        }
      } else {
        nextUnoCalled = false;
      }

      const updatedPlayers = currentPlayers.map((p, idx) =>
        idx === actorIndex
          ? {...p, hand: remainingHand, unoCalled: nextUnoCalled}
          : p
      );

      const nextDiscard = [...currentDiscard, card];
      const nextColor: ActiveColor =
        card.color === 'wild'
          ? (chosenWildColor ?? 'red')
          : card.color;

      setDiscardPile(nextDiscard);
      setActiveColor(nextColor);
      setPendingPrompt(null);

      // Check immediate win!
      if (remainingHand.length === 0) {
        if (card.value === 'draw2' || card.value === 'wild4') {
          const penalty = card.value === 'draw2' ? 2 : 4;
          const victimIdx = getNextPlayerIndex(
            actorIndex,
            direction,
            updatedPlayers.length
          );
          const drawRes = drawFromPiles(currentDraw, nextDiscard, penalty);
          const scoredPlayers = updatedPlayers.map((p, idx) =>
            idx === victimIdx
              ? {...p, hand: [...p.hand, ...drawRes.drawn]}
              : p
          );
          setDrawPile(drawRes.nextDrawPile);
          setDiscardPile(drawRes.nextDiscardPile);
          finishRound(actorIndex, scoredPlayers);
          return;
        }
        setDrawPile(currentDraw);
        finishRound(actorIndex, updatedPlayers);
        return;
      }

      setVulnerableUnoPlayerId(nextVulnerableId);

      const count = updatedPlayers.length;

      if (card.value === 'skip') {
        soundEngine.actionCard();
        haptics.action();
        triggerBurst('SKIP!', 'amber');
        const skippedIdx = getNextPlayerIndex(actorIndex, direction, count, 1);
        const nextIdx = getNextPlayerIndex(actorIndex, direction, count, 2);
        setPlayers(updatedPlayers);
        setDrawPile(currentDraw);
        setCurrentTurnIndex(nextIdx);
        maybeTriggerPassCurtain(nextIdx, actorIndex);
        announce(
          `${actor.name} played ${formatCardName(card)} · ${updatedPlayers[skippedIdx].name} skipped!`,
          'action'
        );
        return;
      }

      if (card.value === 'reverse') {
        soundEngine.actionCard();
        haptics.action();
        triggerBurst('REVERSE!', 'sky');
        const nextDir: TurnDirection = direction === 1 ? -1 : 1;
        setDirection(nextDir);
        setPlayers(updatedPlayers);
        setDrawPile(currentDraw);

        if (count === 2) {
          // Official 2-player Reverse rule: acts like Skip, actor goes again!
          setCurrentTurnIndex(actorIndex);
          announce(
            `${actor.name} played ${formatCardName(card)} · 2P rule: ${actor.name} goes again!`,
            'action'
          );
        } else {
          const nextIdx = getNextPlayerIndex(actorIndex, nextDir, count, 1);
          setCurrentTurnIndex(nextIdx);
          maybeTriggerPassCurtain(nextIdx, actorIndex);
          announce(
            `${actor.name} played ${formatCardName(card)} · Direction reversed!`,
            'action'
          );
        }
        return;
      }

      if (card.value === 'draw2') {
        soundEngine.actionCard();
        haptics.action();
        triggerBurst('+2!', 'red');
        if (rules.stackDrawCards) {
          const newStack = pendingDrawCount + 2;
          const nextIdx = getNextPlayerIndex(actorIndex, direction, count, 1);
          setPlayers(updatedPlayers);
          setDrawPile(currentDraw);
          setPendingDrawCount(newStack);
          setPendingDrawType('draw2');
          setCurrentTurnIndex(nextIdx);
          maybeTriggerPassCurtain(nextIdx, actorIndex);
          announce(
            `${actor.name} stacked ${formatCardName(card)} · Stack at +${newStack} for ${updatedPlayers[nextIdx].name}!`,
            'warning'
          );
        } else {
          const victimIdx = getNextPlayerIndex(actorIndex, direction, count, 1);
          const nextIdx = getNextPlayerIndex(actorIndex, direction, count, 2);
          const drawRes = drawFromPiles(currentDraw, nextDiscard, 2);
          const finalPlayers = updatedPlayers.map((p, idx) =>
            idx === victimIdx
              ? {
                  ...p,
                  hand: p.isHuman
                    ? sortHandForDisplay([...p.hand, ...drawRes.drawn])
                    : [...p.hand, ...drawRes.drawn],
                  unoCalled: false,
                }
              : p
          );
          setPlayers(finalPlayers);
          setDrawPile(drawRes.nextDrawPile);
          setDiscardPile(drawRes.nextDiscardPile);
          setCurrentTurnIndex(nextIdx);
          maybeTriggerPassCurtain(nextIdx, actorIndex);
          announce(
            `${actor.name} played ${formatCardName(card)} · ${updatedPlayers[victimIdx].name} draws 2 and loses turn.`,
            'warning'
          );
        }
        return;
      }

      if (card.value === 'wild4') {
        soundEngine.wildCard();
        haptics.action();
        triggerBurst('WILD +4!', 'red');
        const victimIdx = getNextPlayerIndex(actorIndex, direction, count, 1);

        if (rules.stackDrawCards && pendingDrawCount > 0) {
          const newStack = pendingDrawCount + 4;
          setPlayers(updatedPlayers);
          setDrawPile(currentDraw);
          setPendingDrawCount(newStack);
          setPendingDrawType('wild4');
          setCurrentTurnIndex(victimIdx);
          maybeTriggerPassCurtain(victimIdx, actorIndex);
          announce(
            `${actor.name} stacked Wild +4 (${COLOR_LABELS[nextColor]}) · Stack at +${newStack}!`,
            'warning'
          );
          return;
        }

        if (rules.wild4Challenge && !rules.stackDrawCards) {
          setPlayers(updatedPlayers);
          setDrawPile(currentDraw);
          setPendingPrompt({
            type: 'CHALLENGE_WILD4',
            challengerIndex: victimIdx,
            actorIndex,
            previousColor: previousActiveColor,
            chosenColor: nextColor,
          });
          maybeTriggerPassCurtain(victimIdx, actorIndex);
          announce(
            `${actor.name} played Wild +4 (${COLOR_LABELS[nextColor]})! ${updatedPlayers[victimIdx].name} may accept or challenge.`,
            'warning'
          );
          return;
        }

        if (rules.stackDrawCards && pendingDrawCount === 0) {
          setPlayers(updatedPlayers);
          setDrawPile(currentDraw);
          setPendingDrawCount(4);
          setPendingDrawType('wild4');
          setCurrentTurnIndex(victimIdx);
          maybeTriggerPassCurtain(victimIdx, actorIndex);
          announce(
            `${actor.name} played Wild +4 (${COLOR_LABELS[nextColor]}) · ${updatedPlayers[victimIdx].name} faces +4!`,
            'warning'
          );
          return;
        }

        // Standard non-challenge +4 resolution
        const nextIdx = getNextPlayerIndex(actorIndex, direction, count, 2);
        const drawRes = drawFromPiles(currentDraw, nextDiscard, 4);
        const finalPlayers = updatedPlayers.map((p, idx) =>
          idx === victimIdx
            ? {
                ...p,
                hand: p.isHuman
                  ? sortHandForDisplay([...p.hand, ...drawRes.drawn])
                  : [...p.hand, ...drawRes.drawn],
                unoCalled: false,
              }
            : p
        );
        setPlayers(finalPlayers);
        setDrawPile(drawRes.nextDrawPile);
        setDiscardPile(drawRes.nextDiscardPile);
        setCurrentTurnIndex(nextIdx);
        maybeTriggerPassCurtain(nextIdx, actorIndex);
        announce(
          `${actor.name} played Wild +4 (${COLOR_LABELS[nextColor]}) · ${updatedPlayers[victimIdx].name} draws 4 and is skipped.`,
          'warning'
        );
        return;
      }

      if (card.value === 'wild') {
        soundEngine.wildCard();
        haptics.tap();
        triggerBurst(COLOR_LABELS[nextColor].toUpperCase(), 'emerald');
        const nextIdx = getNextPlayerIndex(actorIndex, direction, count, 1);
        setPlayers(updatedPlayers);
        setDrawPile(currentDraw);
        setCurrentTurnIndex(nextIdx);
        maybeTriggerPassCurtain(nextIdx, actorIndex);
        announce(
          `${actor.name} played Wild · Color set to ${COLOR_LABELS[nextColor]}.`,
          'action'
        );
        return;
      }

      // Standard number card
      soundEngine.playCard();
      if (actor.isHuman) haptics.tap();
      if (nextUnoCalled) triggerBurst('UNO!', 'amber');
      const nextIdx = getNextPlayerIndex(actorIndex, direction, count, 1);
      setPlayers(updatedPlayers);
      setDrawPile(currentDraw);
      setCurrentTurnIndex(nextIdx);
      maybeTriggerPassCurtain(nextIdx, actorIndex);
      announce(
        `${actor.name} played ${formatCardName(card)}.${
          nextUnoCalled ? ' UNO!' : ''
        }`,
        nextUnoCalled ? 'success' : 'neutral'
      );
    },
    [
      players,
      drawPile,
      discardPile,
      activeColor,
      direction,
      rules.difficulty,
      rules.stackDrawCards,
      rules.wild4Challenge,
      pendingDrawCount,
      finishRound,
      announce,
      triggerBurst,
      maybeTriggerPassCurtain,
    ]
  );

  // Resolve Wild +4 challenge decision
  const resolveWild4Challenge = useCallback(
    (didChallenge: boolean) => {
      if (!pendingPrompt || pendingPrompt.type !== 'CHALLENGE_WILD4') return;
      const {challengerIndex, actorIndex, previousColor, chosenColor} =
        pendingPrompt;
      const actor = players[actorIndex];
      const challenger = players[challengerIndex];
      const count = players.length;

      setPendingPrompt(null);

      if (!didChallenge) {
        const drawRes = drawFromPiles(drawPile, discardPile, 4);
        const updated = players.map((p, idx) =>
          idx === challengerIndex
            ? {
                ...p,
                hand: p.isHuman
                  ? sortHandForDisplay([...p.hand, ...drawRes.drawn])
                  : [...p.hand, ...drawRes.drawn],
                unoCalled: false,
              }
            : p
        );
        const nextIdx = getNextPlayerIndex(challengerIndex, direction, count, 1);
        setPlayers(updated);
        setDrawPile(drawRes.nextDrawPile);
        setDiscardPile(drawRes.nextDiscardPile);
        setCurrentTurnIndex(nextIdx);
        maybeTriggerPassCurtain(nextIdx, challengerIndex);
        soundEngine.penalty();
        announce(
          `${challenger.name} accepted +4 (${COLOR_LABELS[chosenColor]}) and drew 4 cards.`,
          'warning'
        );
        return;
      }

      // Check if actor bluffed (held a card of previousColor)
      const isGuilty = hasMatchingColorInHand(actor.hand, previousColor);

      if (isGuilty) {
        const drawRes = drawFromPiles(drawPile, discardPile, 4);
        const updated = players.map((p, idx) =>
          idx === actorIndex
            ? {
                ...p,
                hand: p.isHuman
                  ? sortHandForDisplay([...p.hand, ...drawRes.drawn])
                  : [...p.hand, ...drawRes.drawn],
                unoCalled: false,
              }
            : p
        );
        setPlayers(updated);
        setDrawPile(drawRes.nextDrawPile);
        setDiscardPile(drawRes.nextDiscardPile);
        setCurrentTurnIndex(challengerIndex);
        setVulnerableUnoPlayerId(null);
        soundEngine.unoShout();
        announce(
          `Bluff caught! ${actor.name} held ${COLOR_LABELS[previousColor]} and draws 4 cards. ${challenger.name} plays!`,
          'success'
        );
      } else {
        const drawRes = drawFromPiles(drawPile, discardPile, 6);
        const updated = players.map((p, idx) =>
          idx === challengerIndex
            ? {
                ...p,
                hand: p.isHuman
                  ? sortHandForDisplay([...p.hand, ...drawRes.drawn])
                  : [...p.hand, ...drawRes.drawn],
                unoCalled: false,
              }
            : p
        );
        const nextIdx = getNextPlayerIndex(challengerIndex, direction, count, 1);
        setPlayers(updated);
        setDrawPile(drawRes.nextDrawPile);
        setDiscardPile(drawRes.nextDiscardPile);
        setCurrentTurnIndex(nextIdx);
        maybeTriggerPassCurtain(nextIdx, challengerIndex);
        soundEngine.penalty();
        announce(
          `Challenge failed! ${actor.name}'s +4 was legal — ${challenger.name} draws 6 cards and loses turn.`,
          'warning'
        );
      }
    },
    [
      pendingPrompt,
      players,
      drawPile,
      discardPile,
      direction,
      announce,
      maybeTriggerPassCurtain,
    ]
  );

  // Active human player clicks a card in hand
  const handleActivePlayerCardClick = useCallback(
    (card: UnoCard) => {
      if (phase !== 'PLAYING' || passCurtainForIndex !== null) return;
      const actor = players[currentTurnIndex];
      if (!actor || !actor.isHuman) return;

      // If in PLAY_OR_KEEP_DRAWN prompt, only allow playing that drawn card
      if (pendingPrompt) {
        if (
          pendingPrompt.type === 'PLAY_OR_KEEP_DRAWN' &&
          pendingPrompt.actorIndex === currentTurnIndex &&
          pendingPrompt.card.id === card.id
        ) {
          if (card.color === 'wild') {
            setPendingPrompt({
              type: 'CHOOSE_COLOR',
              card,
              previousColor: activeColor,
              wasDrawnCard: true,
              actorIndex: currentTurnIndex,
            });
            return;
          }
          resolveCardPlay(currentTurnIndex, card);
        }
        return;
      }

      const topCard = discardPile[discardPile.length - 1];
      if (
        !isCardPlayable(
          card,
          topCard,
          activeColor,
          pendingDrawCount,
          pendingDrawType,
          rules
        )
      ) {
        return;
      }

      if (card.color === 'wild') {
        setPendingPrompt({
          type: 'CHOOSE_COLOR',
          card,
          previousColor: activeColor,
          wasDrawnCard: false,
          actorIndex: currentTurnIndex,
        });
        return;
      }

      resolveCardPlay(currentTurnIndex, card);
    },
    [
      phase,
      passCurtainForIndex,
      players,
      currentTurnIndex,
      pendingPrompt,
      discardPile,
      activeColor,
      pendingDrawCount,
      pendingDrawType,
      rules,
      resolveCardPlay,
    ]
  );

  // Active human player draws card(s)
  const handleActivePlayerDraw = useCallback(() => {
    if (
      phase !== 'PLAYING' ||
      passCurtainForIndex !== null ||
      pendingPrompt
    ) {
      return;
    }
    const actor = players[currentTurnIndex];
    if (!actor || !actor.isHuman) return;

    const topCard = discardPile[discardPile.length - 1];

    // Taking a stacked +2 / +4 penalty
    if (pendingDrawCount > 0) {
      const drawRes = drawFromPiles(drawPile, discardPile, pendingDrawCount);
      const updated = players.map((p, idx) =>
        idx === currentTurnIndex
          ? {
              ...p,
              hand: sortHandForDisplay([...p.hand, ...drawRes.drawn]),
              unoCalled: false,
            }
          : p
      );
      const nextIdx = getNextPlayerIndex(
        currentTurnIndex,
        direction,
        players.length,
        1
      );
      setPlayers(updated);
      setDrawPile(drawRes.nextDrawPile);
      setDiscardPile(drawRes.nextDiscardPile);
      setPendingDrawCount(0);
      setPendingDrawType(null);
      setVulnerableUnoPlayerId(null);
      setCurrentTurnIndex(nextIdx);
      maybeTriggerPassCurtain(nextIdx, currentTurnIndex);
      soundEngine.penalty();
      announce(
        `${actor.name} drew ${drawRes.drawn.length} penalty cards.`,
        'warning'
      );
      return;
    }

    // House rule: Draw until playable
    if (rules.drawUntilPlayable) {
      let currentDraw = [...drawPile];
      let currentDiscard = [...discardPile];
      const accumulated: UnoCard[] = [];
      let playableCard: UnoCard | null = null;

      for (let safety = 0; safety < 40; safety++) {
        const res = drawFromPiles(currentDraw, currentDiscard, 1);
        currentDraw = res.nextDrawPile;
        currentDiscard = res.nextDiscardPile;
        if (res.drawn.length === 0) break;
        const c = res.drawn[0];
        accumulated.push(c);
        if (isCardPlayable(c, topCard, activeColor, 0, null, rules)) {
          playableCard = c;
          break;
        }
      }

      soundEngine.drawCard();
      const updated = players.map((p, idx) =>
        idx === currentTurnIndex
          ? {
              ...p,
              hand: sortHandForDisplay([...p.hand, ...accumulated]),
              unoCalled: false,
            }
          : p
      );
      setPlayers(updated);
      setDrawPile(currentDraw);
      setDiscardPile(currentDiscard);
      setVulnerableUnoPlayerId(null);

      if (playableCard) {
        setPendingPrompt({
          type: 'PLAY_OR_KEEP_DRAWN',
          card: playableCard,
          actorIndex: currentTurnIndex,
        });
        announce(
          `${actor.name} drew ${accumulated.length} card${accumulated.length > 1 ? 's' : ''} · Found ${formatCardName(playableCard)}!`,
          'action'
        );
      } else {
        const nextIdx = getNextPlayerIndex(
          currentTurnIndex,
          direction,
          players.length,
          1
        );
        setCurrentTurnIndex(nextIdx);
        maybeTriggerPassCurtain(nextIdx, currentTurnIndex);
        announce('No cards left to draw — turn passed.', 'neutral');
      }
      return;
    }

    // Official rule: Draw 1 card; if playable, player can play it immediately or keep & pass
    const drawRes = drawFromPiles(drawPile, discardPile, 1);
    if (drawRes.drawn.length === 0) {
      const nextIdx = getNextPlayerIndex(
        currentTurnIndex,
        direction,
        players.length,
        1
      );
      setCurrentTurnIndex(nextIdx);
      maybeTriggerPassCurtain(nextIdx, currentTurnIndex);
      announce('Deck empty — turn passed.', 'neutral');
      return;
    }

    soundEngine.drawCard();
    const drawnCard = drawRes.drawn[0];
    const updated = players.map((p, idx) =>
      idx === currentTurnIndex
        ? {
            ...p,
            hand: [...p.hand, drawnCard],
            unoCalled: false,
          }
        : p
    );
    setPlayers(updated);
    setDrawPile(drawRes.nextDrawPile);
    setDiscardPile(drawRes.nextDiscardPile);
    setVulnerableUnoPlayerId(null);

    if (isCardPlayable(drawnCard, topCard, activeColor, 0, null, rules)) {
      setPendingPrompt({
        type: 'PLAY_OR_KEEP_DRAWN',
        card: drawnCard,
        actorIndex: currentTurnIndex,
      });
      announce(
        `${actor.name} drew ${formatCardName(drawnCard)} — play it now or keep it.`,
        'action'
      );
    } else {
      const nextIdx = getNextPlayerIndex(
        currentTurnIndex,
        direction,
        players.length,
        1
      );
      setCurrentTurnIndex(nextIdx);
      maybeTriggerPassCurtain(nextIdx, currentTurnIndex);
      announce(`${actor.name} drew 1 card and passed.`, 'neutral');
    }
  }, [
    phase,
    passCurtainForIndex,
    pendingPrompt,
    players,
    currentTurnIndex,
    discardPile,
    drawPile,
    pendingDrawCount,
    direction,
    rules,
    activeColor,
    announce,
    maybeTriggerPassCurtain,
  ]);

  const handleKeepDrawnCard = useCallback(() => {
    if (!pendingPrompt || pendingPrompt.type !== 'PLAY_OR_KEEP_DRAWN') return;
    const actorIdx = pendingPrompt.actorIndex;
    const actorName = players[actorIdx]?.name ?? 'Player';
    setPendingPrompt(null);
    const nextIdx = getNextPlayerIndex(actorIdx, direction, players.length, 1);
    setCurrentTurnIndex(nextIdx);
    maybeTriggerPassCurtain(nextIdx, actorIdx);
    announce(`${actorName} kept the drawn card.`, 'neutral');
  }, [
    pendingPrompt,
    players,
    direction,
    announce,
    maybeTriggerPassCurtain,
  ]);

  const bottomPlayerIndex =
    rules.playMode === 'pass_and_play'
      ? pendingPrompt?.type === 'CHALLENGE_WILD4'
        ? pendingPrompt.challengerIndex
        : currentTurnIndex
      : 0;

  // Active human calls UNO!
  const handleCallUno = useCallback(() => {
    if (passCurtainForIndex !== null) return;
    const actor = players[bottomPlayerIndex];
    if (!actor || !actor.isHuman) return;
    if (actor.hand.length > 2 || actor.unoCalled) return;
    soundEngine.unoShout();
    haptics.action();
    triggerBurst('UNO!', 'amber');
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === bottomPlayerIndex ? {...p, unoCalled: true} : p
      )
    );
    if (vulnerableUnoPlayerId === actor.id) {
      setVulnerableUnoPlayerId(null);
    }
    announce(`${actor.name} shouted UNO!`, 'success');
  }, [
    passCurtainForIndex,
    players,
    bottomPlayerIndex,
    vulnerableUnoPlayerId,
    announce,
    triggerBurst,
  ]);

  // Catch any player who forgot to call UNO!
  const handleCatchUno = useCallback(
    (targetPlayerId: string) => {
      if (vulnerableUnoPlayerId !== targetPlayerId) return;
      const targetIdx = players.findIndex((p) => p.id === targetPlayerId);
      if (targetIdx === -1) return;

      const drawRes = drawFromPiles(drawPile, discardPile, 2);
      setPlayers((prev) =>
        prev.map((p, idx) =>
          idx === targetIdx
            ? {
                ...p,
                hand: p.isHuman
                  ? sortHandForDisplay([...p.hand, ...drawRes.drawn])
                  : [...p.hand, ...drawRes.drawn],
                unoCalled: false,
              }
            : p
        )
      );
      setDrawPile(drawRes.nextDrawPile);
      setDiscardPile(drawRes.nextDiscardPile);
      setVulnerableUnoPlayerId(null);
      soundEngine.penalty();
      haptics.penalty();
      triggerBurst('CAUGHT +2!', 'red');
      announce(
        `${players[targetIdx].name} was caught without calling UNO! +2 penalty cards.`,
        'warning'
      );
    },
    [vulnerableUnoPlayerId, players, drawPile, discardPile, announce, triggerBurst]
  );

  // In Solo vs Bots mode, if Human forgot UNO, AI has a reaction window to catch them
  useEffect(() => {
    if (
      phase !== 'PLAYING' ||
      rules.playMode !== 'bots' ||
      vulnerableUnoPlayerId !== 'human'
    ) {
      return;
    }
    const catchDelay = rules.difficulty === 'sharp' ? 1800 : 2600;
    const timer = window.setTimeout(() => {
      handleCatchUno('human');
    }, catchDelay);
    return () => window.clearTimeout(timer);
  }, [
    phase,
    rules.playMode,
    vulnerableUnoPlayerId,
    rules.difficulty,
    handleCatchUno,
  ]);

  // AI Turn & AI Challenge Decision Loop (only active in bots mode)
  useEffect(() => {
    if (phase !== 'PLAYING' || rules.playMode !== 'bots') return;

    // 1. If an AI needs to respond to a Wild +4 Challenge prompt
    if (pendingPrompt?.type === 'CHALLENGE_WILD4') {
      const challenger = players[pendingPrompt.challengerIndex];
      if (!challenger || challenger.isHuman) return;
      const actor = players[pendingPrompt.actorIndex];
      const timer = window.setTimeout(() => {
        const willChallenge = shouldAiChallengeWild4(
          rules.difficulty,
          actor.hand.length
        );
        resolveWild4Challenge(willChallenge);
      }, 900);
      return () => window.clearTimeout(timer);
    }

    // Wait while human modals are open
    if (pendingPrompt) return;

    const currentPlayer = players[currentTurnIndex];
    if (!currentPlayer || currentPlayer.isHuman) return;

    const delay = 750 + Math.floor(Math.random() * 250);
    const timer = window.setTimeout(() => {
      const topCard = discardPile[discardPile.length - 1];
      const nextIdx = getNextPlayerIndex(
        currentTurnIndex,
        direction,
        players.length,
        1
      );
      const nextCardCount = players[nextIdx]?.hand.length ?? 7;

      const decision = chooseAiCard(
        currentPlayer.hand,
        topCard,
        activeColor,
        nextCardCount,
        pendingDrawCount,
        pendingDrawType,
        rules,
        rules.difficulty
      );

      if (decision.card) {
        resolveCardPlay(currentTurnIndex, decision.card, decision.chosenColor);
        return;
      }

      // AI must draw penalty stack if active
      if (pendingDrawCount > 0) {
        const drawRes = drawFromPiles(drawPile, discardPile, pendingDrawCount);
        const updated = players.map((p, idx) =>
          idx === currentTurnIndex
            ? {...p, hand: [...p.hand, ...drawRes.drawn], unoCalled: false}
            : p
        );
        setPlayers(updated);
        setDrawPile(drawRes.nextDrawPile);
        setDiscardPile(drawRes.nextDiscardPile);
        setPendingDrawCount(0);
        setPendingDrawType(null);
        setVulnerableUnoPlayerId(null);
        setCurrentTurnIndex(nextIdx);
        soundEngine.penalty();
        announce(
          `${currentPlayer.name} drew ${drawRes.drawn.length} penalty cards.`,
          'warning'
        );
        return;
      }

      // AI draws 1 (or until playable if house rule)
      if (rules.drawUntilPlayable) {
        let currentDraw = [...drawPile];
        let currentDiscard = [...discardPile];
        const drawnAll: UnoCard[] = [];
        let foundPlayable: UnoCard | null = null;

        for (let safety = 0; safety < 40; safety++) {
          const res = drawFromPiles(currentDraw, currentDiscard, 1);
          currentDraw = res.nextDrawPile;
          currentDiscard = res.nextDiscardPile;
          if (res.drawn.length === 0) break;
          const c = res.drawn[0];
          drawnAll.push(c);
          if (isCardPlayable(c, topCard, activeColor, 0, null, rules)) {
            foundPlayable = c;
            break;
          }
        }

        const updatedWithDraw = players.map((p, idx) =>
          idx === currentTurnIndex
            ? {...p, hand: [...p.hand, ...drawnAll], unoCalled: false}
            : p
        );

        if (foundPlayable) {
          const chosenCol =
            foundPlayable.color === 'wild'
              ? pickBestColorForHand(
                  updatedWithDraw[currentTurnIndex].hand.filter(
                    (c) => c.id !== foundPlayable!.id
                  )
                )
              : undefined;
          resolveCardPlay(
            currentTurnIndex,
            foundPlayable,
            chosenCol,
            updatedWithDraw,
            currentDraw,
            currentDiscard
          );
        } else {
          setPlayers(updatedWithDraw);
          setDrawPile(currentDraw);
          setDiscardPile(currentDiscard);
          setCurrentTurnIndex(nextIdx);
          announce(
            `${currentPlayer.name} drew ${drawnAll.length} and passed.`,
            'neutral'
          );
        }
        return;
      }

      // Official AI draw 1
      const drawRes = drawFromPiles(drawPile, discardPile, 1);
      if (drawRes.drawn.length === 0) {
        setCurrentTurnIndex(nextIdx);
        announce(`${currentPlayer.name} passed (deck empty).`, 'neutral');
        return;
      }

      soundEngine.drawCard();
      const drawnCard = drawRes.drawn[0];
      const updatedWithDraw = players.map((p, idx) =>
        idx === currentTurnIndex
          ? {...p, hand: [...p.hand, drawnCard], unoCalled: false}
          : p
      );

      if (isCardPlayable(drawnCard, topCard, activeColor, 0, null, rules)) {
        const chosenCol =
          drawnCard.color === 'wild'
            ? pickBestColorForHand(
                updatedWithDraw[currentTurnIndex].hand.filter(
                  (c) => c.id !== drawnCard.id
                )
              )
            : undefined;
        resolveCardPlay(
          currentTurnIndex,
          drawnCard,
          chosenCol,
          updatedWithDraw,
          drawRes.nextDrawPile,
          drawRes.nextDiscardPile
        );
      } else {
        setPlayers(updatedWithDraw);
        setDrawPile(drawRes.nextDrawPile);
        setDiscardPile(drawRes.nextDiscardPile);
        setVulnerableUnoPlayerId(null);
        setCurrentTurnIndex(nextIdx);
        announce(`${currentPlayer.name} drew 1 card.`, 'neutral');
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    phase,
    pendingPrompt,
    players,
    currentTurnIndex,
    discardPile,
    drawPile,
    activeColor,
    direction,
    pendingDrawCount,
    pendingDrawType,
    rules,
    resolveCardPlay,
    resolveWild4Challenge,
    announce,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'Escape') {
        if (shopModalOpen) {
          setShopModalOpen(false);
        } else if (accountModalOpen) {
          setAccountModalOpen(false);
        } else if (rulesModalOpen) {
          setRulesModalOpen(false);
        } else if (phase === 'PLAYING') {
          setPhase('PAUSED');
        } else if (phase === 'PAUSED') {
          setPhase('PLAYING');
        }
        return;
      }

      if (
        phase !== 'PLAYING' ||
        passCurtainForIndex !== null ||
        shopModalOpen ||
        accountModalOpen ||
        rulesModalOpen
      ) {
        return;
      }

      if (
        pendingPrompt?.type === 'CHOOSE_COLOR' ||
        pendingPrompt?.type === 'CHOOSE_FIRST_WILD_COLOR'
      ) {
        const idx = ['1', '2', '3', '4'].indexOf(e.key);
        if (idx !== -1) {
          const picked = COLORS[idx];
          if (pendingPrompt.type === 'CHOOSE_FIRST_WILD_COLOR') {
            setActiveColor(picked);
            setPendingPrompt(null);
            announce(
              `Starting color set to ${COLOR_LABELS[picked]}. ${players[currentTurnIndex]?.name ?? 'Your'} turn!`,
              'action'
            );
          } else {
            resolveCardPlay(
              pendingPrompt.actorIndex,
              pendingPrompt.card,
              picked
            );
          }
        }
        return;
      }

      if (e.key.toLowerCase() === 'd') {
        handleActivePlayerDraw();
      } else if (e.key.toLowerCase() === 'u') {
        handleCallUno();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    phase,
    passCurtainForIndex,
    shopModalOpen,
    accountModalOpen,
    rulesModalOpen,
    pendingPrompt,
    players,
    currentTurnIndex,
    announce,
    resolveCardPlay,
    handleActivePlayerDraw,
    handleCallUno,
  ]);

  const bottomPlayer = players[bottomPlayerIndex];
  const topDiscard = discardPile[discardPile.length - 1];
  const recentDiscardStack = discardPile.slice(-3);

  // Ordered opponent seats clockwise starting after bottomPlayerIndex
  const orderedOpponents = useMemo(() => {
    if (players.length <= 1) return [];
    const result: {player: Player; originalIndex: number}[] = [];
    for (let offset = 1; offset < players.length; offset++) {
      const idx = (bottomPlayerIndex + offset) % players.length;
      result.push({player: players[idx], originalIndex: idx});
    }
    return result;
  }, [players, bottomPlayerIndex]);

  const isBottomActorTurn =
    phase === 'PLAYING' &&
    passCurtainForIndex === null &&
    currentTurnIndex === bottomPlayerIndex &&
    Boolean(bottomPlayer?.isHuman) &&
    pendingPrompt?.type !== 'CHALLENGE_WILD4';

  const playableActiveCardIds = useMemo(() => {
    if (!bottomPlayer || !topDiscard || !isBottomActorTurn) {
      return new Set<string>();
    }
    if (pendingPrompt?.type === 'PLAY_OR_KEEP_DRAWN') {
      return new Set([pendingPrompt.card.id]);
    }
    if (pendingPrompt) {
      return new Set<string>();
    }
    return new Set(
      bottomPlayer.hand
        .filter((c) =>
          isCardPlayable(
            c,
            topDiscard,
            activeColor,
            pendingDrawCount,
            pendingDrawType,
            rules
          )
        )
        .map((c) => c.id)
    );
  }, [
    bottomPlayer,
    topDiscard,
    isBottomActorTurn,
    pendingPrompt,
    activeColor,
    pendingDrawCount,
    pendingDrawType,
    rules,
  ]);

  const canCallUno =
    phase === 'PLAYING' &&
    passCurtainForIndex === null &&
    Boolean(bottomPlayer) &&
    !bottomPlayer.unoCalled &&
    ((bottomPlayer.hand.length === 2 &&
      isBottomActorTurn &&
      playableActiveCardIds.size > 0) ||
      bottomPlayer.hand.length === 1);

  const handleSortActiveHand = () => {
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === bottomPlayerIndex
          ? {...p, hand: sortHandForDisplay(p.hand)}
          : p
      )
    );
  };

  // Determine hand card overlap spacing dynamically so hands fit cleanly on mobile without scroll
  const handCount = bottomPlayer?.hand.length ?? 0;
  const handOverlapClass =
    handCount > 12
      ? '-space-x-10 sm:-space-x-8'
      : handCount > 9
        ? '-space-x-9 sm:-space-x-6'
        : handCount > 7
          ? '-space-x-7 sm:-space-x-4'
          : handCount > 5
            ? '-space-x-5 sm:-space-x-3'
            : '-space-x-2 sm:-space-x-2';

  const colorInfo = ACTIVE_COLOR_SWATCH[activeColor];
  const isPlayingView = phase !== 'TITLE_MENU';
  const activeTableTheme =
    TABLE_THEMES[profile.equippedTable] ?? TABLE_THEMES.emerald;

  const vulnerablePlayer = vulnerableUnoPlayerId
    ? players.find((p) => p.id === vulnerableUnoPlayerId) ?? null
    : null;

  return (
    <div
      className={`relative w-full overflow-x-hidden flex flex-col bg-[#082518] text-slate-50 ${
        isPlayingView ? 'h-dvh overflow-hidden' : 'min-h-dvh'
      }`}
    >
      {/* Dynamic Table Felt Surface + Generated Felt Texture */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none transition-all duration-500"
        style={{background: activeTableTheme.bgGradient}}
      >
        <img
          src="/src/assets/images/uno_table_felt_1795000853894.jpg"
          alt={`${activeTableTheme.name} felt card table surface`}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover ${activeTableTheme.feltOpacity}`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50" />
      </div>

      {/* Top HUD Bar */}
      <header className="safe-top relative z-20 shrink-0 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-7 py-2 sm:py-3 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span
            className="text-base sm:text-xl font-black tracking-tight text-white whitespace-nowrap shrink-0"
            style={{fontFamily: 'var(--font-display)'}}
          >
            UNO Tabletop
          </span>
          {phase !== 'TITLE_MENU' && (
            <span className="hidden md:inline text-xs text-emerald-100/75 font-mono tabular-nums truncate">
              Round {roundNumber}
              {rules.matchFormat === 'target500' ? ' · First to 500 pts' : ''}
              {rules.playMode === 'pass_and_play'
                ? ' · Pass & Play'
                : ` · ${players.length} Players`}
            </span>
          )}
          {!isOnline && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 whitespace-nowrap">
              <WifiOff className="w-3 h-3" />
              <span className="hidden sm:inline">Offline</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PWAInstallButton />

          {/* Coins / Shop Button */}
          <button
            type="button"
            onClick={() => setShopModalOpen(true)}
            title="Open Deck & Table Shop"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-xs font-mono font-bold text-amber-300 transition-colors cursor-pointer whitespace-nowrap tabular-nums"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{profile.coins}</span>
          </button>

          {/* Account / Google Sign-In Button */}
          <button
            type="button"
            onClick={() => setAccountModalOpen(true)}
            title={authUser ? 'View Account' : 'Sign in with Google'}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            {authUser?.photoURL ? (
              <img
                src={authUser.photoURL}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <LogIn className="w-3.5 h-3.5 text-emerald-300" />
            )}
            <span className="hidden sm:inline max-w-[90px] truncate">
              {authUser ? profile.displayName : 'Sign In'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setColorSymbols((v) => !v)}
            title="Toggle colorblind shape symbols"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              colorSymbols
                ? 'bg-emerald-600/80 border-emerald-400/50 text-white'
                : 'bg-white/5 hover:bg-white/12 border-white/12 text-stone-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Symbols</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/12 border border-white/12 text-stone-200 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setRulesModalOpen(true)}
            aria-label="Official rules"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/12 border border-white/12 text-xs font-medium text-stone-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>

          {phase !== 'TITLE_MENU' && (
            <button
              type="button"
              onClick={() =>
                setPhase((p) => (p === 'PAUSED' ? 'PLAYING' : 'PAUSED'))
              }
              aria-label="Pause game"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/18 border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Pause className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      {phase === 'TITLE_MENU' ? (
        <main className="flex-1 flex items-center justify-center">
          <TitleScreen
            rules={rules}
            profile={profile}
            onChangeRules={setRules}
            onChangePlayerName={handleUpdatePlayerName}
            onStartGame={handleStartNewMatch}
            onOpenRules={() => setRulesModalOpen(true)}
            onOpenShop={() => setShopModalOpen(true)}
          />
        </main>
      ) : (
        <main className="safe-bottom relative flex-1 min-h-0 flex flex-col justify-between max-w-[1440px] w-full mx-auto px-2.5 sm:px-6 py-2 sm:py-4 gap-2 sm:gap-3">
          {/* Top Opponents Row — clockwise from current bottom player */}
          <section
            aria-label="Opponents"
            className="w-full shrink-0 flex items-stretch sm:items-start justify-center gap-2 sm:gap-6"
          >
            {orderedOpponents.map(({player, originalIndex}, seatIdx) => (
              <OpponentSeat
                key={player.id}
                player={player}
                seatIndex={seatIdx}
                isActive={
                  phase === 'PLAYING' && currentTurnIndex === originalIndex
                }
                isVulnerableUno={vulnerableUnoPlayerId === player.id}
                showScore={rules.matchFormat === 'target500'}
                cardTheme={profile.equippedCard}
                onCatchUno={handleCatchUno}
              />
            ))}
          </section>

          {/* Center Tabletop Arena */}
          <section
            aria-label="Center play area"
            className="relative flex-1 min-h-0 flex flex-col items-center justify-center gap-2 sm:gap-4"
          >
            {/* Active-color subtle ambient glow */}
            <div
              className={`pointer-events-none absolute w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-radial ${colorInfo.glow} blur-2xl opacity-75 transition-colors duration-300`}
              aria-hidden="true"
            />
            {/* Active Color + Direction Meta Line */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-black/40 border border-white/12 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm border border-white/40 ${colorInfo.dot}`}
                  aria-hidden="true"
                />
                <span
                  className={`text-xs sm:text-sm font-semibold ${colorInfo.text}`}
                >
                  {colorSymbols ? `${colorInfo.symbol} ` : ''}
                  {COLOR_LABELS[activeColor]}
                </span>
              </div>

              <span className="text-white/25" aria-hidden="true">
                ·
              </span>

              <div className="flex items-center gap-1 text-xs sm:text-sm text-stone-200 font-medium">
                {direction === 1 ? (
                  <RotateCw className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{direction === 1 ? 'Clockwise' : 'Counter-CW'}</span>
              </div>

              {pendingDrawCount > 0 && (
                <>
                  <span className="text-white/25" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono tabular-nums">
                    Stack: +{pendingDrawCount}
                  </span>
                </>
              )}
            </div>

            {/* Draw Pile & Discard Pile */}
            <div className="flex items-center justify-center gap-7 sm:gap-14 py-1">
              {/* Draw Pile */}
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <div className="relative">
                  {drawPile.length > 2 && (
                    <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 w-full h-full rounded-xl sm:rounded-2xl bg-stone-800 border border-white/20 pointer-events-none" />
                  )}
                  <UnoCardBack
                    size="lg"
                    theme={profile.equippedCard}
                    highlighted={
                      isBottomActorTurn &&
                      !pendingPrompt &&
                      (playableActiveCardIds.size === 0 || pendingDrawCount > 0)
                    }
                    onClick={
                      isBottomActorTurn && !pendingPrompt
                        ? handleActivePlayerDraw
                        : undefined
                    }
                    label={
                      pendingDrawCount > 0
                        ? `Draw ${pendingDrawCount} penalty cards`
                        : 'Draw card from deck'
                    }
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-mono text-emerald-100/80 tabular-nums">
                  {pendingDrawCount > 0 && isBottomActorTurn
                    ? `Take +${pendingDrawCount}`
                    : `Deck · ${drawPile.length}`}
                </span>
              </div>

              {/* Discard Pile */}
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <div className="relative w-[74px] h-[108px] sm:w-28 sm:h-40 flex items-center justify-center">
                  <AnimatePresence initial={false}>
                    {recentDiscardStack.map((card, idx) => {
                      const isTop = idx === recentDiscardStack.length - 1;
                      const rotDeg =
                        idx === 0 && !isTop ? -6 : idx === 1 && !isTop ? 4 : 0;
                      const xOffset =
                        idx === 0 && !isTop ? -4 : idx === 1 && !isTop ? 4 : 0;
                      return (
                        <motion.div
                          key={card.id}
                          initial={
                            isTop
                              ? {scale: 1.18, y: -18, opacity: 0, rotate: -8}
                              : false
                          }
                          animate={{
                            scale: 1,
                            y: 0,
                            x: xOffset,
                            opacity: 1,
                            rotate: rotDeg,
                          }}
                          transition={{duration: 0.18, ease: 'easeOut'}}
                          className="absolute inset-0"
                        >
                          <UnoCardView
                            card={card}
                            size="lg"
                            theme={profile.equippedCard}
                            showColorSymbol={colorSymbols}
                            activeWildColor={isTop ? activeColor : undefined}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Non-blocking Floating Action Burst */}
                  <AnimatePresence>
                    {actionBurst && (
                      <motion.div
                        key={actionBurst.id}
                        initial={{opacity: 0, scale: 0.7, y: 8}}
                        animate={{opacity: 1, scale: 1, y: -14}}
                        exit={{opacity: 0, scale: 1.1, y: -28}}
                        transition={{duration: 0.2}}
                        className={`pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-xl font-black text-sm sm:text-base tracking-wide shadow-xl whitespace-nowrap border ${
                          actionBurst.tone === 'red'
                            ? 'bg-red-600 text-white border-red-300/60'
                            : actionBurst.tone === 'sky'
                              ? 'bg-sky-600 text-white border-sky-300/60'
                              : actionBurst.tone === 'emerald'
                                ? 'bg-emerald-600 text-white border-emerald-300/60'
                                : 'bg-amber-400 text-stone-950 border-amber-200'
                        }`}
                        style={{fontFamily: 'var(--font-display)'}}
                      >
                        {actionBurst.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[11px] sm:text-xs font-mono text-emerald-100/80 tabular-nums">
                  Discard · {discardPile.length}
                </span>
              </div>
            </div>

            {/* Single-line Move Announcement */}
            <div
              role="status"
              aria-live="polite"
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-sm font-medium border text-center max-w-full sm:max-w-xl truncate ${
                announcement.tone === 'warning'
                  ? 'bg-amber-950/75 border-amber-400/40 text-amber-100'
                  : announcement.tone === 'success'
                    ? 'bg-emerald-950/80 border-emerald-400/40 text-emerald-100'
                    : announcement.tone === 'action'
                      ? 'bg-black/55 border-white/20 text-white'
                      : 'bg-black/40 border-white/12 text-stone-200'
              }`}
            >
              {announcement.text}
            </div>
          </section>

          {/* Bottom Human Player Zone */}
          {bottomPlayer && (
            <section
              aria-label={`${bottomPlayer.name}'s hand`}
              className={`w-full shrink-0 rounded-2xl border p-2.5 sm:p-4 backdrop-blur-sm transition-colors duration-150 ${
                isBottomActorTurn
                  ? 'bg-black/55 border-amber-300/60 shadow-2xl'
                  : 'bg-black/35 border-white/12'
              }`}
            >
              {/* Player Control Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 sm:mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs sm:text-base font-bold text-white truncate max-w-[110px] sm:max-w-none">
                    {bottomPlayer.name}
                  </span>
                  <span className="text-[11px] sm:text-xs font-mono text-emerald-100/75 tabular-nums">
                    {bottomPlayer.hand.length}
                    {rules.matchFormat === 'target500'
                      ? ` · ${bottomPlayer.score}p`
                      : ''}
                  </span>
                  <span className="text-white/25" aria-hidden="true">
                    ·
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      isBottomActorTurn ? 'text-amber-300' : 'text-stone-400'
                    }`}
                  >
                    {isBottomActorTurn
                      ? pendingPrompt?.type === 'PLAY_OR_KEEP_DRAWN'
                        ? 'Play or keep'
                        : pendingDrawCount > 0
                          ? `Stack or +${pendingDrawCount}`
                          : 'Your Turn'
                      : `${players[currentTurnIndex]?.name ?? 'Bot'}'s Turn`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {pendingPrompt?.type === 'PLAY_OR_KEEP_DRAWN' &&
                    passCurtainForIndex === null && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleActivePlayerCardClick(pendingPrompt.card)
                          }
                          className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Play
                        </button>
                        <button
                          type="button"
                          onClick={handleKeepDrawnCard}
                          className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-semibold border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Keep
                        </button>
                      </>
                    )}

                  {isBottomActorTurn &&
                    !pendingPrompt &&
                    pendingDrawCount === 0 && (
                      <button
                        type="button"
                        onClick={handleActivePlayerDraw}
                        className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-semibold border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Draw
                      </button>
                    )}

                  {isBottomActorTurn &&
                    !pendingPrompt &&
                    pendingDrawCount > 0 && (
                      <button
                        type="button"
                        onClick={handleActivePlayerDraw}
                        className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Take +{pendingDrawCount}
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={handleSortActiveHand}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/12 border border-white/12 text-[11px] sm:text-xs font-medium text-stone-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ArrowDownUp className="w-3.5 h-3.5" />
                    <span>Sort</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCallUno}
                    disabled={!canCallUno && !bottomPlayer.unoCalled}
                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-black tracking-wide transition-colors whitespace-nowrap ${
                      bottomPlayer.unoCalled
                        ? 'bg-emerald-600 text-white cursor-default'
                        : canCallUno
                          ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-lg cursor-pointer'
                          : 'bg-white/5 text-stone-500 border border-white/10 cursor-not-allowed'
                    }`}
                    style={{fontFamily: 'var(--font-display)'}}
                  >
                    UNO!
                  </button>
                </div>
              </div>

              {/* Player Cards Fan (hidden while pass-and-play privacy curtain is active) */}
              <div className="hand-scroll w-full overflow-x-auto pt-3 sm:pt-5 pb-1 px-1">
                {passCurtainForIndex !== null ? (
                  <div className="h-[88px] sm:h-32 flex items-center justify-center text-xs text-stone-400">
                    Hand hidden until device is passed…
                  </div>
                ) : (
                  <div
                    className={`flex items-end w-fit mx-auto ${handOverlapClass}`}
                  >
                    {bottomPlayer.hand.map((card) => {
                      const isPlayable = playableActiveCardIds.has(card.id);
                      const isDrawnHighlight =
                        pendingPrompt?.type === 'PLAY_OR_KEEP_DRAWN' &&
                        pendingPrompt.card.id === card.id;

                      return (
                        <UnoCardView
                          key={card.id}
                          card={card}
                          size="md"
                          theme={profile.equippedCard}
                          playable={isPlayable}
                          dimmed={isBottomActorTurn && !isPlayable}
                          selected={isDrawnHighlight}
                          showColorSymbol={colorSymbols}
                          disabled={!isPlayable}
                          onClick={() => handleActivePlayerCardClick(card)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Pass & Play Privacy Hand-Off Curtain */}
          {phase === 'PLAYING' &&
            rules.playMode === 'pass_and_play' &&
            passCurtainForIndex !== null &&
            players[passCurtainForIndex] && (
              <div
                className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/92 backdrop-blur-md p-4"
                role="dialog"
                aria-modal="true"
                aria-label="Pass device privacy screen"
              >
                <motion.div
                  initial={{opacity: 0, scale: 0.95, y: 10}}
                  animate={{opacity: 1, scale: 1, y: 0}}
                  transition={{duration: 0.16}}
                  className="w-full max-w-sm bg-stone-900 border border-white/15 rounded-2xl p-6 shadow-2xl text-center space-y-4"
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center text-amber-300">
                    <EyeOff className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-emerald-300 uppercase tracking-wider">
                      Pass Device To
                    </p>
                    <h3
                      className="mt-1 text-2xl font-black text-white truncate"
                      style={{fontFamily: 'var(--font-display)'}}
                    >
                      {players[passCurtainForIndex].name}
                    </h3>
                    <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">
                      {announcement.text}
                    </p>
                  </div>

                  {vulnerablePlayer &&
                    vulnerablePlayer.id !==
                      players[passCurtainForIndex].id && (
                      <button
                        type="button"
                        onClick={() => handleCatchUno(vulnerablePlayer.id)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          Catch {vulnerablePlayer.name} Without UNO! (+2)
                        </span>
                      </button>
                    )}

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCard();
                      haptics.tap();
                      setPassCurtainForIndex(null);
                    }}
                    className="w-full py-3.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm shadow-lg transition-colors cursor-pointer"
                  >
                    Tap to Reveal {players[passCurtainForIndex].name}&apos;s
                    Hand
                  </button>
                </motion.div>
              </div>
            )}
        </main>
      )}

      {/* Wild Color Choice Modal */}
      {phase === 'PLAYING' &&
        passCurtainForIndex === null &&
        (pendingPrompt?.type === 'CHOOSE_COLOR' ||
          pendingPrompt?.type === 'CHOOSE_FIRST_WILD_COLOR') && (
          <WildColorPickerModal
            title={
              pendingPrompt.type === 'CHOOSE_FIRST_WILD_COLOR'
                ? 'Choose Starting Color'
                : 'Choose Active Color'
            }
            subtitle={
              pendingPrompt.type === 'CHOOSE_FIRST_WILD_COLOR'
                ? `Opening card was Wild — ${players[currentTurnIndex]?.name ?? 'Player'}, select the starting color`
                : `${players[pendingPrompt.actorIndex]?.name ?? 'Player'}, select the color opponents must match next`
            }
            onSelect={(color) => {
              if (pendingPrompt.type === 'CHOOSE_FIRST_WILD_COLOR') {
                setActiveColor(color);
                setPendingPrompt(null);
                soundEngine.wildCard();
                announce(
                  `Starting color set to ${COLOR_LABELS[color]}. ${players[currentTurnIndex]?.name ?? 'Your'} turn!`,
                  'action'
                );
              } else {
                resolveCardPlay(
                  pendingPrompt.actorIndex,
                  pendingPrompt.card,
                  color
                );
              }
            }}
          />
        )}

      {/* Human Wild +4 Challenge Prompt */}
      {phase === 'PLAYING' &&
        passCurtainForIndex === null &&
        pendingPrompt?.type === 'CHALLENGE_WILD4' &&
        players[pendingPrompt.challengerIndex]?.isHuman && (
          <Wild4ChallengeModal
            actorName={players[pendingPrompt.actorIndex]?.name ?? 'Opponent'}
            challengerName={
              rules.playMode === 'pass_and_play'
                ? players[pendingPrompt.challengerIndex]?.name
                : undefined
            }
            previousColor={pendingPrompt.previousColor}
            chosenColor={pendingPrompt.chosenColor}
            onAccept={() => resolveWild4Challenge(false)}
            onChallenge={() => resolveWild4Challenge(true)}
          />
        )}

      {/* Round Summary / Game Over Modal */}
      {(phase === 'ROUND_SUMMARY' || phase === 'GAME_OVER') && roundResult && (
        <RoundSummaryModal
          result={roundResult}
          players={players}
          isMatchOver={phase === 'GAME_OVER'}
          isTarget500={rules.matchFormat === 'target500'}
          cardTheme={profile.equippedCard}
          onNextRound={() => {
            const scores: Record<string, number> = {};
            players.forEach((p) => {
              scores[p.id] = p.score;
            });
            startRound(scores, roundNumber + 1);
          }}
          onPlayAgain={handleStartNewMatch}
          onReturnToMenu={() => setPhase('TITLE_MENU')}
        />
      )}

      {/* Pause Modal */}
      {phase === 'PAUSED' && (
        <PauseModal
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
          colorSymbols={colorSymbols}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          onToggleHaptics={() => setHapticsEnabled((v) => !v)}
          onToggleColorSymbols={() => setColorSymbols((v) => !v)}
          onOpenRules={() => setRulesModalOpen(true)}
          onRestart={handleStartNewMatch}
          onQuitToMenu={() => setPhase('TITLE_MENU')}
          onResume={() => setPhase('PLAYING')}
        />
      )}

      {/* Official Rules Modal */}
      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />

      {/* Deck & Table Shop Modal */}
      <ShopModal
        isOpen={shopModalOpen}
        profile={profile}
        onClose={() => setShopModalOpen(false)}
        onBuyCosmetic={handleBuyCosmetic}
        onEquipCosmetic={handleEquipCosmetic}
        onClaimDaily={handleClaimDaily}
      />

      {/* Player Account & Google Sign-In Modal */}
      <AccountModal
        isOpen={accountModalOpen}
        authUser={authUser}
        profile={profile}
        authError={authError}
        isSigningIn={isSigningIn}
        onClose={() => setAccountModalOpen(false)}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
