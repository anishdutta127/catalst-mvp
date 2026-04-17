/**
 * founder-stats.ts
 * ────────────────
 * Derived stats for the S11 Founder Trading Card. Everything here is
 * computed from existing journey state — no API calls, no server work.
 *
 * Four stats:
 *   1. rarity          — "1 of N [House] founders this month"
 *   2. responseSpeedRank — "Faster than X% of founders on instinct tests"
 *   3. noveltyDecile   — "Your idea sits in the top N% for novelty"
 *   4. industryFitRank — "Top N% match for [industry]"
 *
 * These are all simulated-but-believable — based on realistic distributions
 * that vary per-user in a deterministic way (seeded on house + match%).
 */

// House distribution — what % of users typically land in each house.
// Simulated from typical personality-test bell curves.
const HOUSE_DISTRIBUTION: Record<string, number> = {
  architects:  0.21, // Systems-thinkers — less common
  vanguards:   0.28, // Action-takers — most common
  alchemists:  0.31, // Connectors — common in creative pops
  pathfinders: 0.20, // Explorers — rarest
};

// Monthly user count — simulated. Grows over time for a "live" feel.
const SIMULATED_MONTHLY_USERS = 1450;

export interface FounderStats {
  rarity: {
    ordinal: number;       // The "1" in "1 of 287"
    pool: number;           // The "287" in "1 of 287"
    label: string;          // Human-readable: "1 of 287 Architects this month"
    tier: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  };
  responseSpeedRank: {
    percentile: number;     // 1-99
    label: string;          // "Faster than 73% of founders"
    descriptor: string;     // "instant" | "measured" | "deliberate"
  };
  noveltyDecile: {
    decile: number;         // 1-10 (1 = most novel)
    percentile: number;     // 1-99 (for display — higher = better)
    label: string;          // "Top 15% for novelty"
  };
  industryFitRank: {
    percentile: number;     // 1-99 (higher = better fit)
    label: string;          // "Top 12% match for AI Automation"
  };
  traitSignature: string;   // e.g. "VC-AN-ST" for Vision-Analysis-Stability
}

// Deterministic hash: same input → same output. Used to pick the user's
// stable spot within distributions (not genuine randomness).
function seededPick(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000; // 0-1
  return min + normalized * (max - min);
}

function rarityTier(pool: number): FounderStats['rarity']['tier'] {
  if (pool < 100) return 'LEGENDARY';
  if (pool < 200) return 'EPIC';
  if (pool < 350) return 'RARE';
  if (pool < 500) return 'UNCOMMON';
  return 'COMMON';
}

interface ComputeInput {
  houseId: string | null;
  displayName: string;
  matchPercent: number;
  noveltyScore: number | undefined; // 1-10 from the idea
  crystalOrbs: string[];
  blotResponseTimes: number[];
  wordResponseTimes: number[];
  crystalSelectionTimes: number[];
  industryName: string;
}

export function computeFounderStats(input: ComputeInput): FounderStats {
  const house = input.houseId || 'founder';
  const seed = `${house}-${input.displayName}-${input.matchPercent}`;

  // ── Rarity ────────────────────────────────────────────────
  // Simulated pool size for the user's house + this month's user base.
  const housePct = HOUSE_DISTRIBUTION[house] ?? 0.25;
  // Add some per-user jitter so rarity numbers aren't all identical for same house.
  const jitter = seededPick(seed + '-rarity', 0.85, 1.15);
  const pool = Math.round(SIMULATED_MONTHLY_USERS * housePct * jitter);
  // Ordinal position — where this user sits in the queue this month.
  const ordinal = Math.max(1, Math.round(seededPick(seed + '-ord', 1, Math.max(2, pool * 0.4))));
  const houseName = house.charAt(0).toUpperCase() + house.slice(1);
  const rarity = {
    ordinal,
    pool,
    label: `1 of ${pool} ${houseName} this month`,
    tier: rarityTier(pool),
  };

  // ── Response speed rank ───────────────────────────────────
  // Average all captured response times (ms). Faster = higher percentile.
  const allTimes = [
    ...input.blotResponseTimes,
    ...input.wordResponseTimes,
    ...input.crystalSelectionTimes,
  ].filter((t) => t > 0);
  const avgMs = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 4500;

  // Typical founder median ~4500ms on instinct tests. Faster than avg → higher percentile.
  // Clamp between 10-95 percentile for realism (edge cases exist but are rare).
  let percentile: number;
  if (avgMs < 1500) percentile = 92;
  else if (avgMs < 2500) percentile = 83;
  else if (avgMs < 3500) percentile = 70;
  else if (avgMs < 4500) percentile = 55;
  else if (avgMs < 6000) percentile = 38;
  else if (avgMs < 8000) percentile = 22;
  else percentile = 12;

  let descriptor: string;
  if (percentile >= 80) descriptor = 'instant';
  else if (percentile >= 50) descriptor = 'measured';
  else descriptor = 'deliberate';

  const responseSpeedRank = {
    percentile,
    label: `Faster than ${percentile}% of founders`,
    descriptor,
  };

  // ── Novelty decile ────────────────────────────────────────
  // idea.novelty_score is 1-10 where higher = more novel.
  const nv = input.noveltyScore ?? 5;
  // novelty 10 = top 10%, novelty 1 = bottom 90%
  const noveltyPct = Math.round(Math.min(99, Math.max(1, nv * 10)));
  const decile = Math.max(1, 11 - Math.round(nv));
  const noveltyDecile = {
    decile,
    percentile: noveltyPct,
    label: `Top ${100 - noveltyPct}% for novelty`,
  };

  // ── Industry fit rank ─────────────────────────────────────
  // displayScore 95 → top 5% in industry, 85 → top 15%, etc.
  const fitTop = Math.max(1, Math.min(50, 100 - input.matchPercent));
  const industryFitRank = {
    percentile: input.matchPercent,
    label: `Top ${fitTop}% match for ${input.industryName}`,
  };

  // ── Trait signature ───────────────────────────────────────
  // 3-letter code from the 3 crystal orbs (first 2 chars each, uppercased).
  // Example: ["Vision", "Craft", "Stability"] → "VI-CR-ST"
  const code = input.crystalOrbs
    .slice(0, 3)
    .map((o) => o.slice(0, 2).toUpperCase())
    .join('-');
  const traitSignature = code || 'XX-XX-XX';

  return {
    rarity,
    responseSpeedRank,
    noveltyDecile,
    industryFitRank,
    traitSignature,
  };
}
