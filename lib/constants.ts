/**
 * Global constants — screen IDs, house data, theme tokens, timing defaults.
 */

// ── Screen IDs ────────────────────────────────────────────────

export type ScreenId =
  | 's00' | 's01' | 's01_llm'
  | 's02' | 's03' | 's04' | 's05'
  | 's06' | 's07' | 's08'
  | 's09' | 's09b' | 's10' | 's11';

export type IdeaMode = 'open' | 'directed' | 'shortcut';

// ── Milestones ────────────────────────────────────────────────

export interface Milestone {
  id: string;
  icon: string;
  label: string;
  screens: ScreenId[];
}

export const MILESTONES: Milestone[] = [
  { id: 'gate',    icon: '🌱', label: 'Gate',    screens: ['s00', 's01', 's01_llm'] },
  { id: 'mind',    icon: '🧠', label: 'Mind',    screens: ['s02', 's03'] },
  { id: 'world',   icon: '🌍', label: 'World',   screens: ['s04'] },
  { id: 'test',    icon: '⚡', label: 'Test',    screens: ['s05'] },
  { id: 'crystal', icon: '💎', label: 'Crystal',  screens: ['s06', 's07'] },
  { id: 'forge',   icon: '⚒️', label: 'Forge',   screens: ['s08'] },
  { id: 'ideas',   icon: '💡', label: 'Ideas',   screens: ['s09', 's09b'] },
  { id: 'home',    icon: '🏠', label: 'Home',    screens: ['s10', 's11'] },
];

export function getMilestoneForScreen(screen: ScreenId): Milestone | undefined {
  return MILESTONES.find(m => m.screens.includes(screen));
}

// ── House Data ────────────────────────────────────────────────

export interface House {
  id: string;
  name: string;
  colour: string;
  hex: string;
  tagline: string;
}

export const HOUSES: House[] = [
  { id: 'architects',  name: 'House of Architects',  colour: 'gold',     hex: '#D4A843', tagline: 'You see the blueprint before anyone else.' },
  { id: 'vanguards',   name: 'House of Vanguards',   colour: 'crimson',  hex: '#C41E3A', tagline: "You don't wait for permission." },
  { id: 'alchemists',  name: 'House of Alchemists',  colour: 'sapphire', hex: '#2563EB', tagline: 'You see connections no one else can.' },
  { id: 'pathfinders', name: 'House of Pathfinders',  colour: 'emerald',  hex: '#059669', tagline: "You find roads that don't exist yet." },
];

export function getHouseById(id: string): House | undefined {
  return HOUSES.find(h => h.id === id);
}

// ── Crystal Orbs ──────────────────────────────────────────────

export interface CrystalOrbDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const CRYSTAL_ORBS: CrystalOrbDef[] = [
  { id: 'grit',      name: 'Grit',      icon: '💪', color: '#F59E0B', description: 'Resilience, persistence, hustle' },
  { id: 'vision',    name: 'Vision',    icon: '💡', color: '#EAB308', description: 'Big-picture thinking, future sight' },
  { id: 'craft',     name: 'Craft',     icon: '🔧', color: '#CD7F32', description: 'Building, making, technical excellence' },
  { id: 'influence', name: 'Influence', icon: '🗣️', color: '#A855F7', description: 'Persuasion, leadership, moving people' },
  { id: 'empathy',   name: 'Empathy',   icon: '💛', color: '#14B8A6', description: 'Understanding people, emotional intelligence' },
  { id: 'analysis',  name: 'Analysis',  icon: '📊', color: '#38BDF8', description: 'Data, logic, pattern recognition' },
  { id: 'freedom',   name: 'Freedom',   icon: '🕊️', color: '#E2E8F0', description: 'Independence, autonomy, self-direction' },
  { id: 'stability', name: 'Stability', icon: '🛡️', color: '#22C55E', description: 'Security, consistency, sustainable growth' },
];

// ── Timer Defaults (ms) ───────────────────────────────────────

export const TIMER_DEFAULTS = {
  s02_blot: 8000,
  s03_word: 4000,
  s04_expanded: 5000,
  s05_scenario: 5000,
  s06_crystal: 20000,
  s07_chronicle: 12000,
} as const;

// ── Dialogue Timing ───────────────────────────────────────────

export const DIALOGUE_TIMING = {
  /** ms per word for Cedric's streaming text */
  cedricWordDelay: 45,
  /** ms per word for Pip's streaming text */
  pipWordDelay: 30,
  /** Base hold time for dialogue messages (ms) */
  baseHoldTime: 2000,
  /** Additional hold time per word (ms) */
  perWordHoldTime: 60,
  /** Fade out duration (ms) */
  fadeOutDuration: 300,
} as const;

// ── Background Images ─────────────────────────────────────────

export const SCREEN_BACKGROUNDS: Partial<Record<ScreenId, string>> = {
  s00: '/backgrounds/bg-s00.png',
  s01: '/backgrounds/bg-s01.png',
  s01_llm: '/backgrounds/bg-s01.png',
  s02: '/backgrounds/bg-s02.png',
  s03: '/backgrounds/bg-s03.png',
  s04: '/backgrounds/bg-s04.png',
  s05: '/backgrounds/bg-s05.png',
  s06: '/backgrounds/bg-s06.png',
  s07: '/backgrounds/bg-s07.png',
  s08: '/backgrounds/bg-s08.png',
  s09: '/backgrounds/bg-s09.png',
  s09b: '/backgrounds/bg-s09.png',
  s10: '/backgrounds/bg-s10.png',
  s11: '/backgrounds/bg-s11.png',
};

// ── Theme Colors ──────────────────────────────────────────────

export const THEME = {
  gold: '#D4A843',
  goldLight: 'rgba(212, 168, 67, 0.4)',
  goldBorder: 'rgba(212, 168, 67, 0.6)',
  dark: '#0C0E12',
  darkCard: 'rgba(12, 14, 18, 0.7)',
  darkOverlay: 'rgba(0, 0, 0, 0.6)',
  ivory: '#F5F0E8',
  muted: 'rgba(245, 240, 232, 0.6)',
} as const;
