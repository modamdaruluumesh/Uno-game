import {CardThemeId, TableThemeId} from '../types/uno';

export interface CardThemeDefinition {
  id: CardThemeId;
  name: string;
  description: string;
  price: number;
  frameClass: string;
  backBgClass: string;
  backOvalClass: string;
  backTextClass: string;
  accentSwatch: string;
}

export interface TableThemeDefinition {
  id: TableThemeId;
  name: string;
  description: string;
  price: number;
  bgGradient: string;
  feltOpacity: string;
  swatchColor: string;
}

export const CARD_THEMES: Record<CardThemeId, CardThemeDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic Tabletop',
    description: 'Crisp ivory-white borders and traditional tournament faces.',
    price: 0,
    frameClass: 'bg-white',
    backBgClass: 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/10',
    backOvalClass: 'bg-gradient-to-br from-red-600 to-red-700 border border-white/20',
    backTextClass: 'text-amber-300',
    accentSwatch: 'bg-red-600',
  },
  'midnight-gold': {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    description: 'Matte obsidian card frames accented with warm 24k gold trim.',
    price: 200,
    frameClass: 'bg-zinc-900 ring-1 ring-amber-400/70',
    backBgClass: 'bg-gradient-to-br from-stone-950 via-neutral-900 to-black border border-amber-400/40',
    backOvalClass: 'bg-gradient-to-br from-amber-500 to-amber-600 border border-amber-200/40',
    backTextClass: 'text-stone-950',
    accentSwatch: 'bg-amber-400',
  },
  'neon-arcade': {
    id: 'neon-arcade',
    name: 'Cyber Prism',
    description: 'Deep slate frames with electric cyan highlights and crisp backs.',
    price: 350,
    frameClass: 'bg-slate-950 ring-1 ring-cyan-400/75',
    backBgClass: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-cyan-400/40',
    backOvalClass: 'bg-gradient-to-br from-cyan-500 to-blue-600 border border-white/30',
    backTextClass: 'text-white',
    accentSwatch: 'bg-cyan-400',
  },
  'sakura-pastel': {
    id: 'sakura-pastel',
    name: 'Sakura Linen',
    description: 'Warm cream linen frames paired with cherry-blossom backs.',
    price: 450,
    frameClass: 'bg-[#FFF5EB] ring-1 ring-rose-300/80',
    backBgClass: 'bg-gradient-to-br from-rose-950 via-stone-900 to-rose-950 border border-rose-300/35',
    backOvalClass: 'bg-gradient-to-br from-rose-400 to-pink-500 border border-white/40',
    backTextClass: 'text-white',
    accentSwatch: 'bg-rose-400',
  },
  'royal-ruby': {
    id: 'royal-ruby',
    name: 'Royal Velvet',
    description: 'Champagne-parchment borders and gilded crimson card backs.',
    price: 600,
    frameClass: 'bg-[#F8EFE0] ring-1 ring-amber-600/60',
    backBgClass: 'bg-gradient-to-br from-[#4A0E1B] via-[#2C0710] to-[#1A0409] border border-amber-300/45',
    backOvalClass: 'bg-gradient-to-br from-amber-300 to-amber-500 border border-white/30',
    backTextClass: 'text-[#4A0E1B]',
    accentSwatch: 'bg-rose-800',
  },
};

export const TABLE_THEMES: Record<TableThemeId, TableThemeDefinition> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Casino',
    description: 'Classic luxury green wool felt tabletop.',
    price: 0,
    bgGradient:
      'radial-gradient(circle at 50% 45%, #125136 0%, #0B3623 58%, #051B11 100%)',
    feltOpacity: 'opacity-85',
    swatchColor: 'bg-emerald-700',
  },
  navy: {
    id: 'navy',
    name: 'Midnight Navy',
    description: 'Deep sapphire card-club velvet surface.',
    price: 250,
    bgGradient:
      'radial-gradient(circle at 50% 45%, #17345E 0%, #0D213F 58%, #061021 100%)',
    feltOpacity: 'opacity-20 mix-blend-overlay',
    swatchColor: 'bg-blue-900',
  },
  bordeaux: {
    id: 'bordeaux',
    name: 'Velvet Bordeaux',
    description: 'Rich tournament burgundy wool table.',
    price: 400,
    bgGradient:
      'radial-gradient(circle at 50% 45%, #5C1829 0%, #3C0F1A 58%, #1E060C 100%)',
    feltOpacity: 'opacity-20 mix-blend-overlay',
    swatchColor: 'bg-rose-900',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Lounge',
    description: 'Minimalist charcoal-black high-contrast felt.',
    price: 500,
    bgGradient:
      'radial-gradient(circle at 50% 45%, #27272A 0%, #18181B 58%, #09090B 100%)',
    feltOpacity: 'opacity-15 mix-blend-overlay',
    swatchColor: 'bg-zinc-800',
  },
};

export const CARD_THEME_LIST = Object.values(CARD_THEMES);
export const TABLE_THEME_LIST = Object.values(TABLE_THEMES);
