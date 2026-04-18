/**
 * Founder archetype lookup. Maps (house, dominant motive) to a shareable
 * founder identity with celebrity twins + signature move + kryptonite.
 *
 * Dominant motive is derived from the nAch/nAff/nPow vector in
 * extractPersonality() — pick the highest. Fallback uses -any suffix.
 *
 * The 16 canonical entries live in content/archetypes.json (4 houses ×
 * {achievement, affiliation, power, any}). If a lookup misses its
 * specific motive, it walks: `${house}-any` → `architects-any` so the
 * founder card always has something to render.
 */

import archetypesRaw from '@/content/archetypes.json';

export interface FounderTwin {
  name: string;
  company: string;
  initials: string;
  whyQuote: string;
}

export interface Archetype {
  name: string;
  pullQuote: string;
  twinGlobal: FounderTwin;
  twinIndian: FounderTwin;
  signatureMove: string;
  kryptonite: string;
  rarity: string;
}

type ArchetypeMap = Record<string, Archetype>;
const MAP = archetypesRaw as unknown as ArchetypeMap;

export type HouseSlug = 'architects' | 'vanguards' | 'alchemists' | 'pathfinders';
export type MotiveSlug = 'achievement' | 'affiliation' | 'power' | 'any';

export function getArchetype(house: HouseSlug, motive: MotiveSlug): Archetype {
  return MAP[`${house}-${motive}`] ?? MAP[`${house}-any`] ?? MAP['architects-any'];
}

/** Pick dominant motive from McClelland vector (from extractPersonality). */
export function pickDominantMotive(mc: { nAch: number; nAff: number; nPow: number }): MotiveSlug {
  const { nAch, nAff, nPow } = mc;
  const max = Math.max(nAch, nAff, nPow);
  if (max === 0) return 'any';
  if (nAch === max) return 'achievement';
  if (nAff === max) return 'affiliation';
  return 'power';
}
