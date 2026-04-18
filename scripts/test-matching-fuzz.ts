/**
 * Catalst v8 — Matching pipeline fuzz test.
 *
 * Generates 50 synthetic ForgeProfiles with varied inputs and asserts that
 * the output PipelineResult never returns the same idea_id across
 * nest / spark / wildvine / yourIdea.
 *
 * This catches the entire class of bug that bit us in v6-v7:
 *   - handlePathB returning yourIdea === nest
 *   - portfolio selector picking spark === wildvine on sparse decks
 *   - dedup falling through when surviving < 3
 *
 * USAGE:
 *   npx tsx scripts/test-matching-fuzz.ts
 *
 * EXIT CODES:
 *   0 — all 50 profiles produced 3 or 4 distinct idea_ids
 *   1 — at least one collision found (details printed)
 */

import { runMatchingPipeline } from '../lib/scoring/engine';
import type { ForgeProfile, PipelineResult } from '../lib/scoring/types';
import { INDUSTRY_ORDER } from '../lib/scoring/engine';

// ═══════════════════════════════════════════════════════════════
// Input vocabularies — keep in sync with engine.ts constants.
// These are reproduced here (not imported) so the test fails loudly
// if someone renames a vocab token in the engine.
// ═══════════════════════════════════════════════════════════════

const CRYSTAL_ORB_IDS = [
  'Grit', 'Vision', 'Craft', 'Influence',
  'Empathy', 'Analysis', 'Freedom', 'Stability',
] as const;

const HEADLINES = [
  'achievement', 'autonomy', 'power', 'affiliation',
  '$100M', 'Anywhere', '10M Users', '50K Founders',
] as const;

const RESOURCE_LEVELS = [
  'Bootstrap', '< ₹8L', '₹8L - ₹80L', '₹80L+',
] as const;

const TIME_BUDGETS = [
  '5-10 hrs', '10-20 hrs', '20-40 hrs', 'Full-time',
] as const;

const BLOT1_EMOJIS = ['👥', '🦋', '💥', '🩸'] as const;
const BLOT2_EMOJIS = ['🗿', '👑', '🌳', '🐻'] as const;
const BLOT3_EMOJIS = ['🌊', '🔥', '⚡', '🌙'] as const;

const WORD_POOL = [
  'build', 'create', 'ship', 'scale', 'help', 'lead',
  'teach', 'design', 'code', 'sell', 'craft', 'hack',
  'serve', 'make', 'launch', 'explore', 'connect', 'heal',
  'solve', 'play', 'plan', 'grow',
];

const IDEA_MODES: ForgeProfile['idea_mode'][] = ['open', 'directed', 'shortcut'];

const USER_IDEA_BANK = [
  'an AI coach for small business owners',
  'a marketplace for Indian artisans',
  'a mental-health app for engineers',
  'a logistics platform for farmers',
  'a creator tool for podcasters',
  'a vertical SaaS for dental clinics',
  'a carbon-tracking app for SMEs',
  'an EV charging network for tier-2 cities',
];

// ═══════════════════════════════════════════════════════════════
// Deterministic PRNG — so a failing run is reproducible
// ═══════════════════════════════════════════════════════════════

let seed = 42;
function rand(): number {
  // mulberry32
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function randInt(lo: number, hi: number): number {
  return lo + Math.floor(rand() * (hi - lo + 1));
}

// ═══════════════════════════════════════════════════════════════
// Profile generator
// ═══════════════════════════════════════════════════════════════

function synthesiseProfile(i: number): ForgeProfile {
  const mode = IDEA_MODES[i % 3]; // cycle through all 3 paths

  // Industries: 1-8 kept, 0-5 passed, 0-3 edged — never overlapping
  const keepCount = randInt(1, 8);
  const passCount = randInt(0, 5);
  const edgeCount = randInt(0, 3);
  const shuffled = pickN(INDUSTRY_ORDER as readonly string[], keepCount + passCount + edgeCount);
  const kept = shuffled.slice(0, keepCount);
  const passed = shuffled.slice(keepCount, keepCount + passCount);
  const edged = shuffled.slice(keepCount + passCount);

  // Crystal orbs — pick 3 distinct from 8
  const orbs = pickN(CRYSTAL_ORB_IDS, 3) as [string, string, string];
  const unchosen = CRYSTAL_ORB_IDS.filter((o) => !orbs.includes(o));

  return {
    display_name: `fuzz_${i}`,
    idea_mode: mode,
    user_idea_text: mode === 'open' ? '' : pick(USER_IDEA_BANK),
    blot_responses: [pick(BLOT1_EMOJIS), pick(BLOT2_EMOJIS), pick(BLOT3_EMOJIS)],
    blot_response_times: [randInt(1200, 8000), randInt(1200, 8000), randInt(1200, 8000)],
    word_responses: [pick(WORD_POOL), pick(WORD_POOL), pick(WORD_POOL), pick(WORD_POOL)],
    word_response_times: [randInt(500, 4000), randInt(500, 4000), randInt(500, 4000), randInt(500, 4000)],
    industries_kept: kept,
    industries_passed: passed,
    industries_edged: edged,
    industry_dwell_times: kept.concat(passed, edged).map(() => randInt(500, 15000)),
    scroll_depth_per_card: kept.concat(passed, edged).map(() => rand()),
    scenarioSource: 'none',
    crystal_orbs: orbs,
    crystal_selection_order: [0, 1, 2],
    crystal_selection_times: [randInt(500, 20000), randInt(500, 20000), randInt(500, 20000)],
    unchosen_orbs: unchosen,
    headline_choice: pick(HEADLINES),
    time_budget: pick(TIME_BUDGETS),
    resource_level: pick(RESOURCE_LEVELS),
    competitive_advantage: '',
  };
}

// ═══════════════════════════════════════════════════════════════
// Assertion
// ═══════════════════════════════════════════════════════════════

interface Failure {
  profileIndex: number;
  mode: string;
  collisions: string[];
  ids: { nest: string; spark: string; wildvine: string; yourIdea?: string };
}

function checkResult(result: PipelineResult, profileIndex: number, mode: string): Failure | null {
  const nest = result.nest.idea.idea_id;
  const spark = result.spark.idea.idea_id;
  const wildvine = result.wildvine.idea.idea_id;
  const yourIdea = result.yourIdea?.idea.idea_id;

  const ids = { nest, spark, wildvine, yourIdea };
  const collisions: string[] = [];

  if (nest === spark) collisions.push(`nest == spark (${nest})`);
  if (nest === wildvine) collisions.push(`nest == wildvine (${nest})`);
  if (spark === wildvine) collisions.push(`spark == wildvine (${spark})`);
  if (yourIdea !== undefined) {
    if (yourIdea === nest) collisions.push(`yourIdea == nest (${yourIdea})`);
    if (yourIdea === spark) collisions.push(`yourIdea == spark (${yourIdea})`);
    if (yourIdea === wildvine) collisions.push(`yourIdea == wildvine (${yourIdea})`);
  }

  return collisions.length > 0 ? { profileIndex, mode, collisions, ids } : null;
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

function main(): void {
  const N = 50;
  const failures: Failure[] = [];
  const runtimeErrors: { profileIndex: number; mode: string; error: string }[] = [];

  console.log(`Running ${N} fuzz profiles against runMatchingPipeline...\n`);

  for (let i = 0; i < N; i++) {
    const profile = synthesiseProfile(i);
    try {
      const result = runMatchingPipeline(profile);
      const fail = checkResult(result, i, profile.idea_mode);
      if (fail) {
        failures.push(fail);
        process.stdout.write('✗');
      } else {
        process.stdout.write('·');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      runtimeErrors.push({ profileIndex: i, mode: profile.idea_mode, error: msg });
      process.stdout.write('!');
    }
  }

  console.log('\n');

  if (runtimeErrors.length > 0) {
    console.error(`❌ ${runtimeErrors.length} profiles threw runtime errors:\n`);
    for (const e of runtimeErrors.slice(0, 10)) {
      console.error(`   #${e.profileIndex} [${e.mode}]: ${e.error}`);
    }
    if (runtimeErrors.length > 10) {
      console.error(`   … and ${runtimeErrors.length - 10} more`);
    }
  }

  if (failures.length > 0) {
    console.error(`❌ ${failures.length} / ${N} profiles returned duplicate idea_ids:\n`);
    for (const f of failures.slice(0, 10)) {
      console.error(`   #${f.profileIndex} [${f.mode}]`);
      console.error(`     nest=${f.ids.nest} spark=${f.ids.spark} wildvine=${f.ids.wildvine}${f.ids.yourIdea ? ` yourIdea=${f.ids.yourIdea}` : ''}`);
      for (const c of f.collisions) console.error(`     • ${c}`);
    }
    if (failures.length > 10) {
      console.error(`   … and ${failures.length - 10} more`);
    }
  }

  if (failures.length === 0 && runtimeErrors.length === 0) {
    console.log(`✅ All ${N} profiles returned distinct idea_ids across nest / spark / wildvine${''}${''} / yourIdea`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
