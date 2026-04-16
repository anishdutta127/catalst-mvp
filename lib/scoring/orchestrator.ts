/**
 * Scoring Orchestrator — CATALST MVP
 *
 * Sits above the scoring engine. Provides:
 *   - filterByIndustryOnly() for S04 pre-filtering
 *   - assignHouse() weighted formula (R2-FIX-1)
 *   - finalRun() full pipeline with triple fallback
 */

import {
  IDEAS,
  DOMAIN_TO_INDUSTRY,
  extractPersonality,
  runMatchingPipeline,
} from './engine';
import type { Idea, ForgeProfile, PipelineResult, ScoredIdea } from './types';

// ── House Assignment (R2-FIX-1) ──────────────────────────────

const CRYSTAL_HOUSE_MAP: Record<string, string> = {
  Grit: 'architects',
  Stability: 'architects',
  Influence: 'vanguards',
  Empathy: 'vanguards',
  Vision: 'alchemists',
  Analysis: 'alchemists',
  Freedom: 'pathfinders',
  Craft: 'pathfinders',
};

export type HouseId = 'architects' | 'vanguards' | 'alchemists' | 'pathfinders';

/**
 * Assign a founder house using the weighted personality formula.
 * All inputs normalized to 0.0-1.0. Highest score wins.
 * Tie-break: crystal orb selection order via CRYSTAL_HOUSE_MAP.
 */
export function assignHouse(profile: ForgeProfile): HouseId {
  const p = extractPersonality(profile);
  const { O, C, E, A, N } = p.bigFive;
  const { nAch, nPow } = p.mcClelland;
  const b = p.boldness;

  const scores: Record<HouseId, number> = {
    architects:  0.30 * C + 0.25 * nAch + 0.20 * (1 - N) + 0.15 * (1 - b) + 0.10 * A,
    vanguards:   0.30 * E + 0.25 * nPow + 0.20 * b + 0.15 * (1 - A) + 0.10 * (1 - N),
    alchemists:  0.30 * O + 0.25 * nAch + 0.20 * (1 - C) + 0.15 * b + 0.10 * (1 - E),
    pathfinders: 0.30 * E + 0.25 * O + 0.20 * b + 0.15 * (1 - N) + 0.10 * nPow,
  };

  const maxScore = Math.max(...Object.values(scores));
  const tied = (Object.entries(scores) as [HouseId, number][])
    .filter(([, s]) => Math.abs(s - maxScore) < 0.001);

  if (tied.length === 1) return tied[0][0];

  // Tie-break: first crystal orb that maps to a tied house
  for (const orb of profile.crystal_orbs) {
    const house = CRYSTAL_HOUSE_MAP[orb] as HouseId | undefined;
    if (house && tied.some(([h]) => h === house)) return house;
  }

  return tied[0][0];
}

/** Expose house scores for debugging. */
export function computeHouseScores(profile: ForgeProfile): Record<HouseId, number> {
  const p = extractPersonality(profile);
  const { O, C, E, A, N } = p.bigFive;
  const { nAch, nPow } = p.mcClelland;
  const b = p.boldness;

  return {
    architects:  0.30 * C + 0.25 * nAch + 0.20 * (1 - N) + 0.15 * (1 - b) + 0.10 * A,
    vanguards:   0.30 * E + 0.25 * nPow + 0.20 * b + 0.15 * (1 - A) + 0.10 * (1 - N),
    alchemists:  0.30 * O + 0.25 * nAch + 0.20 * (1 - C) + 0.15 * b + 0.10 * (1 - E),
    pathfinders: 0.30 * E + 0.25 * O + 0.20 * b + 0.15 * (1 - N) + 0.10 * nPow,
  };
}

// ── Industry Pre-filter (R2-FIX-2) ──────────────────────────

/**
 * Light pre-filter at S04 — only domain matching, no budget/time constraints.
 * Returns ideas whose domain maps to a kept industry.
 */
export function filterByIndustryOnly(ideas: Idea[], industriesKept: string[]): Idea[] {
  if (industriesKept.length === 0) return ideas;
  const kept = new Set(industriesKept);
  return ideas.filter(idea => {
    if (kept.has(idea.domain_primary)) return true;
    const mapped = DOMAIN_TO_INDUSTRY[idea.domain_primary];
    return mapped ? kept.has(mapped) : false;
  });
}

// ── Safe Fallback Ideas ──────────────────────────────────────

function getSafeIdeas(): ScoredIdea[] {
  // Pick 3 broadly appealing ideas: solo-viable, low budget, proven
  const candidates = [...IDEAS]
    .map(idea => {
      const safety =
        (idea.solo_viable ? 3 : 0) +
        (idea.maturity === 'proven' ? 2 : 0) +
        (idea.budget_floor_inr < 500_000 ? 2 : 0) +
        (idea.time_floor_weeks <= 4 ? 1 : 0) +
        (idea.novelty_score >= 5 ? 1 : 0);
      return { idea, safety };
    })
    .sort((a, b) => b.safety - a.safety)
    .slice(0, 3);

  return candidates.map((c, i) => ({
    idea: c.idea,
    rawScore: c.safety * 10,
    displayScore: 75,
    matchTier: i === 0 ? 'nest' as const : i === 1 ? 'spark' as const : 'wildvine' as const,
  }));
}

// ── Orchestrator Result ──────────────────────────────────────

export interface OrchestratorResult {
  pipeline: PipelineResult;
  house: HouseId;
  houseScores: Record<HouseId, number>;
  fallbackLevel: 1 | 2 | 3;
}

// ── Final Run (triple fallback) ──────────────────────────────

/**
 * Full scoring pipeline with triple fallback.
 *
 * Level 1: engine returns ≥3 results → use them
 * Level 2: <3 results → relax constraints, fill with wildcards
 * Level 3: engine throws or 0 results → 3 safe hand-curated ideas
 */
export function finalRun(profile: ForgeProfile): OrchestratorResult {
  try {
    const house = assignHouse(profile);
    const houseScores = computeHouseScores(profile);

    // Level 1: standard pipeline
    const result = runMatchingPipeline(profile);
    if (result.nest && result.spark && result.wildvine) {
      return { pipeline: result, house, houseScores, fallbackLevel: 1 };
    }

    // Level 2: relax constraints — run with empty constraints
    console.warn('[orchestrator] Level 2 fallback: relaxing constraints');
    const relaxed: ForgeProfile = {
      ...profile,
      time_budget: '30h+',
      resource_level: 'Funded ($10K+)',
      industries_passed: [],
    };
    const relaxedResult = runMatchingPipeline(relaxed);

    const patched = patchWithWildcards(result, relaxedResult);
    return { pipeline: patched, house, houseScores, fallbackLevel: 2 };
  } catch (err) {
    // Level 3: engine failure → safe fallback (covers assignHouse + pipeline)
    console.error('[orchestrator] Level 3 fallback: engine threw', err);
    console.error('[orchestrator] ForgeProfile dump:', JSON.stringify(profile));
    const safeIdeas = getSafeIdeas();
    return {
      pipeline: {
        nest: safeIdeas[0],
        spark: safeIdeas[1],
        wildvine: safeIdeas[2],
        confidence: 40,
        conflicts: ['Engine fallback: safe curated ideas returned'],
      },
      house: 'architects',
      houseScores: { architects: 0, vanguards: 0, alchemists: 0, pathfinders: 0 },
      fallbackLevel: 3,
    };
  }
}

function patchWithWildcards(
  original: PipelineResult,
  relaxed: PipelineResult,
): PipelineResult {
  const safe = getSafeIdeas();
  return {
    nest: original.nest ?? relaxed.nest ?? safe[0],
    spark: original.spark ?? relaxed.spark ?? safe[1],
    wildvine: original.wildvine ?? relaxed.wildvine ?? safe[2],
    yourIdea: original.yourIdea,
    confidence: Math.max(original.confidence - 10, 30),
    conflicts: [...original.conflicts, 'Fallback: some ideas from relaxed constraints'],
  };
}
