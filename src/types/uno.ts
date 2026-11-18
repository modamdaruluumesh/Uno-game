export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type ActiveColor = 'red' | 'yellow' | 'green' | 'blue';

export type CardValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild4';

export interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  hand: UnoCard[];
  score: number;
  unoCalled: boolean;
}

export type PlayMode = 'bots' | 'pass_and_play';
export type BotDifficulty = 'casual' | 'sharp';
export type MatchFormat = 'single' | 'target500';
export type TurnDirection = 1 | -1;

export type CardThemeId =
  | 'classic'
  | 'midnight-gold'
  | 'neon-arcade'
  | 'sakura-pastel'
  | 'royal-ruby';

export type TableThemeId = 'emerald' | 'navy' | 'bordeaux' | 'obsidian';

export interface RuleConfig {
  playMode: PlayMode;
  playerCount: 2 | 3 | 4;
  passPlayNames: [string, string, string, string];
  matchFormat: MatchFormat;
  difficulty: BotDifficulty;
  wild4Challenge: boolean;
  stackDrawCards: boolean;
  drawUntilPlayable: boolean;
}

export type GamePhase =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER';

export type PendingPrompt =
  | {
      type: 'CHOOSE_COLOR';
      card: UnoCard;
      previousColor: ActiveColor;
      wasDrawnCard: boolean;
      actorIndex: number;
    }
  | {
      type: 'CHOOSE_FIRST_WILD_COLOR';
    }
  | {
      type: 'PLAY_OR_KEEP_DRAWN';
      card: UnoCard;
      actorIndex: number;
    }
  | {
      type: 'CHALLENGE_WILD4';
      challengerIndex: number;
      actorIndex: number;
      previousColor: ActiveColor;
      chosenColor: ActiveColor;
    };

export interface RoundBreakdownEntry {
  playerId: string;
  playerName: string;
  isHuman: boolean;
  remainingCards: UnoCard[];
  pointsContributed: number;
  totalScoreAfter: number;
}

export interface RoundResult {
  roundNumber: number;
  winnerId: string;
  winnerName: string;
  pointsEarned: number;
  coinsAwarded: number;
  breakdown: RoundBreakdownEntry[];
  matchWon: boolean;
}

export interface MoveAnnouncement {
  id: number;
  text: string;
  tone: 'neutral' | 'action' | 'warning' | 'success';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  coins: number;
  unlockedCards: CardThemeId[];
  unlockedTables: TableThemeId[];
  equippedCard: CardThemeId;
  equippedTable: TableThemeId;
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  highestRoundPoints: number;
  lastDailyClaimAt: number;
}
