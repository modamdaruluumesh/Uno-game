import {
  ActiveColor,
  BotDifficulty,
  CardColor,
  CardValue,
  RuleConfig,
  TurnDirection,
  UnoCard,
} from '../types/uno';

export const COLORS: ActiveColor[] = ['red', 'yellow', 'green', 'blue'];

export const COLOR_LABELS: Record<ActiveColor, string> = {
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
};

const BOT_NAMES = ['Maya', 'Liam', 'Sora', 'Elena', 'Marcus'];

export function getBotName(index: number): string {
  return BOT_NAMES[index % BOT_NAMES.length];
}

export function createOfficialDeck(): UnoCard[] {
  const deck: UnoCard[] = [];
  let seq = 0;

  const pushCard = (color: CardColor, value: CardValue) => {
    seq += 1;
    deck.push({
      id: `card-${seq}-${color}-${value}`,
      color,
      value,
    });
  };

  for (const color of COLORS) {
    // One 0 per color
    pushCard(color, '0');
    // Two of 1-9 per color
    const numbers: CardValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (const num of numbers) {
      pushCard(color, num);
      pushCard(color, num);
    }
    // Two of each action card per color
    const actions: CardValue[] = ['skip', 'reverse', 'draw2'];
    for (const action of actions) {
      pushCard(color, action);
      pushCard(color, action);
    }
  }

  // Four Wild and Four Wild Draw Four
  for (let i = 0; i < 4; i++) {
    pushCard('wild', 'wild');
    pushCard('wild', 'wild4');
  }

  return shuffleCards(deck);
}

export function shuffleCards<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getCardPoints(card: UnoCard): number {
  if (card.value === 'wild' || card.value === 'wild4') return 50;
  if (
    card.value === 'skip' ||
    card.value === 'reverse' ||
    card.value === 'draw2'
  ) {
    return 20;
  }
  return parseInt(card.value, 10) || 0;
}

export function calculateHandPoints(hand: UnoCard[]): number {
  return hand.reduce((sum, c) => sum + getCardPoints(c), 0);
}

export function formatCardName(card: UnoCard): string {
  const valueMap: Record<CardValue, string> = {
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    skip: 'Skip',
    reverse: 'Reverse',
    draw2: 'Draw Two (+2)',
    wild: 'Wild',
    wild4: 'Wild Draw Four (+4)',
  };
  if (card.color === 'wild') return valueMap[card.value];
  return `${COLOR_LABELS[card.color]} ${valueMap[card.value]}`;
}

export function isCardPlayable(
  card: UnoCard,
  topCard: UnoCard,
  activeColor: ActiveColor,
  pendingDrawCount: number,
  pendingDrawType: 'draw2' | 'wild4' | null,
  rules: RuleConfig
): boolean {
  // If a draw penalty stack is active (only possible when stackDrawCards is enabled)
  if (pendingDrawCount > 0 && pendingDrawType) {
    if (!rules.stackDrawCards) return false;
    if (pendingDrawType === 'draw2') {
      return card.value === 'draw2' || card.value === 'wild4';
    }
    if (pendingDrawType === 'wild4') {
      return card.value === 'wild4';
    }
    return false;
  }

  // Wild cards can always be played (official UNO allows playing Wild +4 anytime, subject to challenge!)
  if (card.color === 'wild') return true;

  // Color match or value/symbol match
  return card.color === activeColor || card.value === topCard.value;
}

export function hasMatchingColorInHand(
  hand: UnoCard[],
  color: ActiveColor
): boolean {
  return hand.some((card) => card.color === color);
}

export function drawFromPiles(
  drawPile: UnoCard[],
  discardPile: UnoCard[],
  count: number
): {
  drawn: UnoCard[];
  nextDrawPile: UnoCard[];
  nextDiscardPile: UnoCard[];
  reshuffled: boolean;
} {
  let currentDraw = [...drawPile];
  let currentDiscard = [...discardPile];
  const drawn: UnoCard[] = [];
  let reshuffled = false;

  for (let i = 0; i < count; i++) {
    if (currentDraw.length === 0) {
      if (currentDiscard.length <= 1) {
        break; // No cards available anywhere
      }
      const topCard = currentDiscard[currentDiscard.length - 1];
      const recyclable = currentDiscard.slice(0, -1);
      currentDraw = shuffleCards(recyclable);
      currentDiscard = [topCard];
      reshuffled = true;
    }
    const card = currentDraw.pop();
    if (card) {
      drawn.push(card);
    }
  }

  return {
    drawn,
    nextDrawPile: currentDraw,
    nextDiscardPile: currentDiscard,
    reshuffled,
  };
}

export function getNextPlayerIndex(
  currentIndex: number,
  direction: TurnDirection,
  playerCount: number,
  steps = 1
): number {
  return (
    (((currentIndex + direction * steps) % playerCount) + playerCount) %
    playerCount
  );
}

export function pickBestColorForHand(hand: UnoCard[]): ActiveColor {
  const counts: Record<ActiveColor, number> = {
    red: 0,
    yellow: 0,
    green: 0,
    blue: 0,
  };
  for (const card of hand) {
    if (card.color !== 'wild') {
      counts[card.color] += card.value === 'draw2' || card.value === 'skip' ? 1.5 : 1;
    }
  }
  let bestColor: ActiveColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  let bestScore = -1;
  for (const color of COLORS) {
    if (counts[color] > bestScore) {
      bestScore = counts[color];
      bestColor = color;
    }
  }
  return bestColor;
}

export function chooseAiCard(
  hand: UnoCard[],
  topCard: UnoCard,
  activeColor: ActiveColor,
  nextPlayerCardCount: number,
  pendingDrawCount: number,
  pendingDrawType: 'draw2' | 'wild4' | null,
  rules: RuleConfig,
  difficulty: BotDifficulty
): {card: UnoCard | null; chosenColor?: ActiveColor} {
  const playable = hand.filter((c) =>
    isCardPlayable(
      c,
      topCard,
      activeColor,
      pendingDrawCount,
      pendingDrawType,
      rules
    )
  );

  if (playable.length === 0) {
    return {card: null};
  }

  const hasColorMatch = hasMatchingColorInHand(hand, activeColor);

  // Separate legal vs bluff +4 if challenge rule is active
  const nonWild4 = playable.filter((c) => c.value !== 'wild4');
  let candidates = playable;

  if (rules.wild4Challenge && hasColorMatch && nonWild4.length > 0) {
    // Occasionally bluff (~12% in sharp if opponent has <= 2 cards, ~6% otherwise)
    const bluffChance =
      nextPlayerCardCount <= 2
        ? difficulty === 'sharp'
          ? 0.16
          : 0.08
        : 0.05;
    if (Math.random() > bluffChance) {
      candidates = nonWild4;
    }
  }

  const scoreCandidate = (card: UnoCard): number => {
    let score = getCardPoints(card);
    const isNextLow = nextPlayerCardCount <= 2;

    if (difficulty === 'sharp') {
      // Attack if next player is close to winning
      if (isNextLow) {
        if (card.value === 'wild4') score += 60;
        if (card.value === 'draw2') score += 50;
        if (card.value === 'skip' || card.value === 'reverse') score += 40;
      } else {
        // Save Wilds and +4 for later if other plays exist
        if (card.value === 'wild4') score -= 45;
        if (card.value === 'wild') score -= 35;
      }
      // Prefer switching to our strongest color when changing color
      if (card.color !== 'wild' && card.color !== activeColor) {
        const sameColorCount = hand.filter((h) => h.color === card.color).length;
        score += sameColorCount * 6;
      }
    } else {
      // Casual: slightly prefers saving wilds, otherwise sheds higher-point cards
      if (card.color === 'wild') score -= 25;
      if (isNextLow && (card.value === 'draw2' || card.value === 'skip')) {
        score += 15;
      }
    }
    return score;
  };

  const sorted = [...candidates].sort(
    (a, b) => scoreCandidate(b) - scoreCandidate(a)
  );
  const picked = sorted[0];

  if (picked.color === 'wild') {
    const remaining = hand.filter((c) => c.id !== picked.id);
    return {
      card: picked,
      chosenColor: pickBestColorForHand(remaining),
    };
  }

  return {card: picked};
}

export function shouldAiChallengeWild4(
  difficulty: BotDifficulty,
  actorCardCountAfterPlay: number
): boolean {
  // If actor is down to 0 or 1 card, higher incentive to challenge
  if (actorCardCountAfterPlay <= 1) {
    return Math.random() < (difficulty === 'sharp' ? 0.52 : 0.35);
  }
  return Math.random() < (difficulty === 'sharp' ? 0.28 : 0.22);
}

export function sortHandForDisplay(hand: UnoCard[]): UnoCard[] {
  const colorOrder: Record<CardColor, number> = {
    red: 0,
    yellow: 1,
    green: 2,
    blue: 3,
    wild: 4,
  };
  const valueOrder: Record<CardValue, number> = {
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    skip: 10,
    reverse: 11,
    draw2: 12,
    wild: 13,
    wild4: 14,
  };
  return [...hand].sort((a, b) => {
    if (colorOrder[a.color] !== colorOrder[b.color]) {
      return colorOrder[a.color] - colorOrder[b.color];
    }
    return valueOrder[a.value] - valueOrder[b.value];
  });
}
