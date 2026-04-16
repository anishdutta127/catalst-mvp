/**
 * Scoring Engine — CATALST v7
 *
 * Matches user journey data (personality signals from 8 screens)
 * against the 260-idea library using multi-framework scoring
 * across 9 weighted dimensions totaling 100 points.
 *
 * Frameworks: McClelland Need Theory, DISC, Big Five (OCEAN),
 * Holland RIASEC, Rorschach projective, TAT scenarios, Jung timing
 */

import ideasRaw from '@/content/ideas.json';

// ════════════════════════════════════════════════════════════
// STEP 1 — TYPES AND IMPORTS
// ════════════════════════════════════════════════════════════

/** Idea shape from content/ideas.json (260 ideas) */
export interface Idea {
  idea_id: string;
  idea_name: string;
  one_liner: string;
  domain_primary: string;
  sub_domain: string[];
  problem_type_primary: string;
  motive_freedom: number;
  motive_wealth: number;
  motive_status: number;
  motive_mastery: number;
  motive_impact: number;
  motive_belonging: number;
  motive_creativity: number;
  motive_stability: number;
  builder_fit: number;
  researcher_fit: number;
  seller_fit: number;
  creator_fit: number;
  host_fit: number;
  execution_rhythm_fit: number;
  ideal_social_energy: string;
  solo_viable: boolean;
  speed_to_first_test: number;
  time_floor_weeks: number;
  budget_floor_inr: number;
  team_floor: number;
  novelty_score: number;
  wildcard_leverage: string[];
  is_marketplace: boolean;
  is_hardware_heavy: boolean;
  is_enterprise_sales: boolean;
  is_inventory_heavy: boolean;
  is_regulatory_heavy: boolean;
  is_local_offline: boolean;
  is_ad_dependent: boolean;
  is_long_rnd: boolean;
  customer_archetype: string;
  pain_to_promise: string;
  why_now: string;
  starter_model: string;
  first_7day_move: string;
  analytics: {
    revenueModel: string;
    priceRange: string;
    year1RevenueRange: string;
    grossMargin: string;
    proofPoint: string;
  };
  proof: {
    similarCompanies: { name: string; traction: string }[];
    verdict: string;
    gap: string;
  };
  icp: { summary: string };
  aiAdvantage: string;
  quickStart: { week1: string; mvp: string; firstCustomers: string };
  maturity: string;
  _enriched_v5?: boolean; // present on first 170 ideas only
}

export const IDEAS: Idea[] = ideasRaw as unknown as Idea[];

/**
 * All input data from the Zustand journey store needed for scoring.
 * Matches every data field in JourneyState (minus navigation/output fields).
 */
export interface ForgeProfile {
  display_name: string;
  idea_mode: 'open' | 'directed' | 'shortcut';
  user_idea_text: string;
  blot_responses: [string, string, string];
  blot_response_times: [number, number, number];
  word_responses: [string, string, string, string];
  word_response_times: [number, number, number, number];
  industries_kept: string[];
  industries_passed: string[];
  industries_edged: string[];
  industry_dwell_times: number[];
  scroll_depth_per_card: number[];
  scenario_responses?: [string, string, string];
  scenario_response_times?: [number, number, number];
  crystal_orbs: [string, string, string];
  crystal_selection_order: [number, number, number];
  crystal_selection_times: [number, number, number];
  unchosen_orbs: string[];
  headline_choice: string;
  time_budget: string;
  resource_level: string;
  competitive_advantage: string;
}

export type MatchTier = 'nest' | 'spark' | 'wildvine' | 'your_idea';

export interface ScoredIdea {
  idea: Idea;
  rawScore: number;
  displayScore: number;
  matchTier: MatchTier;
}

export interface PipelineResult {
  nest: ScoredIdea;
  spark: ScoredIdea;
  wildvine: ScoredIdea;
  yourIdea?: ScoredIdea;
  confidence: number;
  conflicts: string[];
}

// ── Internal types ──────────────────────────────────────────

interface NeedVector {
  nAch: number;
  nAff: number;
  nPow: number;
}

interface WorkStyleVector {
  builder: number;
  seller: number;
  researcher: number;
  creator: number;
  host: number;
}

interface BigFiveVector {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number;
}

interface RawScoredIdea {
  idea: Idea;
  rawScore: number;
  mcClellandScore: number; // stored for override adjustment
}

/** Pre-computed user signals — built once, reused across all 260 ideas */
interface Signals {
  userNeeds: NeedVector;
  unconsciousNeeds: NeedVector;
  consciousNeeds: NeedVector;
  workStyle: WorkStyleVector;
  bigFive: BigFiveVector;
  boldness: number;
  customerType: string;
  competitiveStyle: string;
  timingConsistency: number; // 0 = volatile, 1 = metronomic
  isEffectuation: boolean;
  isInnovation: boolean;
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════

const INR_PER_USD = 83;

/** 15 user-facing industries in S04 presentation order */
export const INDUSTRY_ORDER = [
  'ai_ml',
  'health_wellness',
  'creator_media',
  'finance_payments',
  'education_learning',
  'food_agriculture',
  'climate_energy',
  'gaming_entertainment',
  'fashion_beauty',
  'sports_fitness',
  'community_social',
  'real_estate_home',
  'logistics_mobility',
  'legal_compliance',
  'hardware_robotics',
] as const;

/**
 * Maps all 33 idea domain_primary values to the 15 user-facing
 * industry IDs from S04. Used when domain_primary doesn't directly
 * match an industry ID (most of the time).
 */
export const DOMAIN_TO_INDUSTRY: Record<string, string> = {
  // Direct matches (domain ID = industry ID)
  health_wellness: 'health_wellness',
  community_social: 'community_social',
  sports_fitness: 'sports_fitness',
  fashion_beauty: 'fashion_beauty',
  // Mapped domains
  creator_tools: 'creator_media',
  media_entertainment: 'creator_media',
  education: 'education_learning',
  ai_automation: 'ai_ml',
  saas_productivity: 'ai_ml',
  hr_recruitment: 'ai_ml',
  cybersecurity: 'cybersecurity',           // now maps to dedicated cybersecurity industry
  fintech: 'finance_payments',
  sustainability: 'climate_energy',
  ev_mobility: 'logistics_mobility',
  food_beverage: 'food_agriculture',
  agritech: 'food_agriculture',
  ecommerce_d2c: 'fashion_beauty',
  retail_tech: 'fashion_beauty',
  real_estate: 'real_estate_home',
  construction_infra: 'real_estate_home',
  home_services: 'real_estate_home',
  parenting_family: 'parenting',            // now maps to dedicated parenting industry
  pet_care: 'pet_care',                     // now maps to dedicated pet_care industry
  biotech: 'health_wellness',
  legaltech: 'legal_compliance',
  professional_services: 'legal_compliance',
  gaming_esports: 'gaming_entertainment',
  logistics_supply_chain: 'logistics_mobility',
  manufacturing: 'hardware_robotics',
  travel_hospitality: 'travel',             // now maps to dedicated travel industry
  events_weddings: 'travel',                // events → travel & hospitality
  govtech_civic: 'community_social',
  spiritual_religious: 'spirituality',      // now maps to dedicated spirituality industry
  // New domain mappings for expanded industries
  dating_relationships: 'dating',
  senior_care: 'senior_care',
  aerospace: 'space_tech',
  cannabis_wellness: 'cannabis',
  blockchain_web3: 'web3',
  crypto: 'web3',
};

/** Maps resource_level string → max budget in USD */
const RESOURCE_USD: Record<string, number> = {
  'Bootstrapping ($0-1K)': 1_000,
  'Small budget ($1-10K)': 10_000,
  'Funded ($10K+)': 100_000,
};

/** Maps time_budget → comfortable weeks for full-match scoring */
const TIME_COMFORT: Record<string, number> = {
  '< 5h/week': 4,
  '5-15h': 8,
  '15-30h': 12,
  '30h+': 16,
};

// ── McClelland: Blot → Need Deltas ─────────────────────────

type ND = { nAch: number; nAff: number; nPow: number };

const BLOT1: Record<string, ND> = {
  '👥': { nAch: 0, nAff: 2, nPow: 0 },
  '🦋': { nAch: 2, nAff: 0, nPow: 0 },
  '💥': { nAch: 0, nAff: 0, nPow: 2 },
  '🩸': { nAch: 1, nAff: 0, nPow: 1 },
};

// Includes both scoring-spec emojis and screen-spec fallbacks
const BLOT2: Record<string, ND> = {
  '🗿': { nAch: 0, nAff: 0, nPow: 1 },
  '👑': { nAch: 0, nAff: 0, nPow: 2 },
  '🌳': { nAch: 0, nAff: 0, nPow: 2 },
  '🐻': { nAch: 2, nAff: 0, nPow: 0 },
  '👢': { nAch: 2, nAff: 0, nPow: 0 },
  '🦇': { nAch: 1, nAff: 0, nPow: 0 },
};

const BLOT3: Record<string, ND> = {
  '🔬': { nAch: 1, nAff: 0, nPow: 0 },
  '🔥': { nAch: 1, nAff: 0, nPow: 0 },
  '🎨': { nAch: 1, nAff: 0, nPow: 0 },
  '🌺': { nAch: 1, nAff: 0, nPow: 0 },
  '👤': { nAch: 0, nAff: 2, nPow: 0 },
  '👁️': { nAch: 0, nAff: 2, nPow: 0 },
  '☁️': { nAch: 1, nAff: 0, nPow: 0 },
};

// ── McClelland: Scenario → Need Deltas ─────────────────────

const S1_NEED: Record<string, ND> = {
  '📊': { nAch: 1, nAff: 0, nPow: 0 },
  '📞': { nAch: 0, nAff: 1, nPow: 0 },
  '📢': { nAch: 0, nAff: 0, nPow: 1 },
  '🔧': { nAch: 1, nAff: 0, nPow: 0 },
};

const S2_NEED: Record<string, ND> = {
  '🎯': { nAch: 1, nAff: 0, nPow: 0 },
  '🔍': { nAch: 1, nAff: 0, nPow: 0 },
  '🤝': { nAch: 0, nAff: 2, nPow: 0 },
  '⚡': { nAch: 0, nAff: 0, nPow: 1 },
};

// ── McClelland: Headline → Need Deltas ─────────────────────

const HEADLINE_MAP: { pat: string; d: ND; need: 'nAch' | 'nAff' | 'nPow' }[] = [
  // Match by headline ID (if screen stores 'achievement', 'autonomy', etc.)
  { pat: 'achievement', d: { nAch: 3, nAff: 0, nPow: 0 }, need: 'nAch' },
  { pat: 'autonomy', d: { nAch: 1, nAff: 0, nPow: 0 }, need: 'nAch' },
  { pat: 'power', d: { nAch: 0, nAff: 0, nPow: 3 }, need: 'nPow' },
  { pat: 'affiliation', d: { nAch: 0, nAff: 3, nPow: 0 }, need: 'nAff' },
  // Match by text fragment (if screen stores the full rendered headline)
  { pat: '$100M', d: { nAch: 3, nAff: 0, nPow: 0 }, need: 'nAch' },
  { pat: 'Anywhere', d: { nAch: 1, nAff: 0, nPow: 0 }, need: 'nAch' },
  { pat: '10M Users', d: { nAch: 0, nAff: 0, nPow: 3 }, need: 'nPow' },
  { pat: '10 Million', d: { nAch: 0, nAff: 0, nPow: 3 }, need: 'nPow' },
  { pat: '50K Founders', d: { nAch: 0, nAff: 3, nPow: 0 }, need: 'nAff' },
  { pat: '50,000', d: { nAch: 0, nAff: 3, nPow: 0 }, need: 'nAff' },
];

// ── Crystal → DISC / Work Style ────────────────────────────

const CRYSTAL_WORK: Record<string, (keyof WorkStyleVector)[]> = {
  Grit: ['builder'],
  Influence: ['seller'],
  Analysis: ['researcher'],
  Vision: ['creator'],
  Empathy: ['host'],
  Craft: ['builder'],
  Freedom: ['creator'],    // autonomy-driven → self-directed creation
  Stability: ['researcher'], // consistency-driven → methodical, data-grounded
};

// ── Scenario → Customer Type / Competitive Style ───────────

const S1_CUST: Record<string, string> = {
  '📊': 'analytical',
  '📞': 'relationship',
  '📢': 'growth',
  '🔧': 'craft',
};

const S2_COMP: Record<string, string> = {
  '🎯': 'follower',
  '🔍': 'differentiator',
  '🤝': 'loyalty',
  '⚡': 'product',
};

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Linear interpolation with clamped input */
function lerp(
  v: number,
  inLo: number,
  inHi: number,
  outLo: number,
  outHi: number,
): number {
  const t = clamp((v - inLo) / (inHi - inLo || 1), 0, 1);
  return outLo + t * (outHi - outLo);
}

/** Cosine similarity between two equal-length number arrays */
function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  const denom = Math.sqrt(mA) * Math.sqrt(mB);
  return denom === 0 ? 0 : dot / denom;
}

/** Population standard deviation */
function stdDev(vals: number[]): number {
  if (vals.length === 0) return 0;
  const m = vals.reduce((s, v) => s + v, 0) / vals.length;
  return Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length);
}

/** Tokenize text into a Set of lowercase words, keeping meaningful short tokens */
const SHORT_KEEP = new Set(['ai', 'ml', 'vr', 'ar', '3d', 'hr', 'ev', 'b2b', 'b2c', 'd2c', 'saas', 'app']);
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 || SHORT_KEEP.has(w)),
  );
}

/** Jaccard-style keyword overlap between two strings (0-1) */
function kwOverlap(a: string, b: string): number {
  const tA = tokenize(a);
  const tB = tokenize(b);
  if (tA.size === 0 || tB.size === 0) return 0;
  let hits = 0;
  tA.forEach(t => { if (tB.has(t)) hits++; });
  return hits / Math.max(tA.size, tB.size);
}

/** Add a need delta to a vector (no-op if delta undefined) */
function addNeed(v: NeedVector, d: ND | undefined): void {
  if (!d) return;
  v.nAch += d.nAch;
  v.nAff += d.nAff;
  v.nPow += d.nPow;
}

/** Which McClelland need dominates this vector? Returns null for zero vectors. */
function dominant(v: NeedVector): 'nAch' | 'nAff' | 'nPow' | null {
  const total = v.nAch + v.nAff + v.nPow;
  if (total === 0) return null; // no signal — can't determine dominance
  if (v.nAch >= v.nAff && v.nAch >= v.nPow) return 'nAch';
  if (v.nAff >= v.nPow) return 'nAff';
  return 'nPow';
}

/** Look up dwell time for an industry by its ID using S04 presentation order */
function dwellFor(id: string, dwells: number[]): number {
  const idx = (INDUSTRY_ORDER as readonly string[]).indexOf(id);
  return idx >= 0 && idx < dwells.length ? dwells[idx] : Infinity;
}

// ════════════════════════════════════════════════════════════
// SIGNAL BUILDERS
// ════════════════════════════════════════════════════════════

/** McClelland from unconscious channels: blots + scenarios */
function buildUnconsciousNeeds(p: ForgeProfile): NeedVector {
  const v: NeedVector = { nAch: 0, nAff: 0, nPow: 0 };
  addNeed(v, BLOT1[p.blot_responses[0]]);
  addNeed(v, BLOT2[p.blot_responses[1]]);
  addNeed(v, BLOT3[p.blot_responses[2]]);
  if (p.scenario_responses?.some(r => r !== '')) {
    addNeed(v, S1_NEED[p.scenario_responses![0]]);
    addNeed(v, S2_NEED[p.scenario_responses![1]]);
  }
  return v;
}

/** McClelland from conscious channel: headline choice */
function buildConsciousNeeds(p: ForgeProfile): NeedVector {
  const v: NeedVector = { nAch: 0, nAff: 0, nPow: 0 };
  for (const h of HEADLINE_MAP) {
    if (p.headline_choice.includes(h.pat)) {
      addNeed(v, h.d);
      break;
    }
  }
  return v;
}

/** Idea's McClelland vector from its motive_* fields */
function buildIdeaNeeds(idea: Idea): NeedVector {
  return {
    nAch: Math.max(idea.motive_mastery, idea.motive_wealth),
    nAff: Math.max(idea.motive_belonging, idea.motive_stability),
    nPow: Math.max(idea.motive_status, idea.motive_impact),
  };
}

/** Work style from crystal orb selection */
function buildWorkStyle(orbs: readonly string[]): WorkStyleVector {
  const ws: WorkStyleVector = {
    builder: 0,
    seller: 0,
    researcher: 0,
    creator: 0,
    host: 0,
  };
  for (const orb of orbs) {
    const keys = CRYSTAL_WORK[orb];
    if (keys) for (const k of keys) ws[k] = 1.0;
  }
  return ws;
}

/** Big Five approximation from aggregated implicit signals */
function buildBigFive(p: ForgeProfile): BigFiveVector {
  const orbs = new Set(p.crystal_orbs);
  const times = p.word_response_times.filter(t => t > 0);
  const avgTime =
    times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 2000;
  const tSD = stdDev(times);

  const abstractBlots = new Set(['🦋', '🦇', '☁️', '🌺', '🎨']);
  const absCount = p.blot_responses.filter(b => abstractBlots.has(b)).length;

  const affBlots = new Set(['👥', '👤', '👁️']);
  const affCount = p.blot_responses.filter(b => affBlots.has(b)).length;

  return {
    O: clamp(
      (p.industries_kept.length > 8
        ? 0.7
        : p.industries_kept.length > 5
          ? 0.5
          : 0.3) +
        absCount * 0.15,
      0,
      1,
    ),
    C: clamp(
      (tSD < 500 ? 0.7 : tSD < 1000 ? 0.5 : 0.3) +
        (orbs.has('Analysis') ? 0.3 : 0),
      0,
      1,
    ),
    E: clamp(
      (orbs.has('Influence') ? 0.4 : 0) +
        (p.word_responses[1] === 'Stronger' ? 0.4 : 0.1),
      0,
      1,
    ),
    A: clamp((orbs.has('Empathy') ? 0.4 : 0) + affCount * 0.2, 0, 1),
    N: clamp(avgTime > 3000 ? 0.7 : avgTime > 1500 ? 0.5 : 0.3, 0, 1),
  };
}

/** Boldness score 0-7 from risk word + blot3 + timing volatility */
function computeBoldness(p: ForgeProfile): number {
  let b = 0;
  if (p.word_responses[3] === 'Thrill') b += 3;
  const b3 = p.blot_responses[2];
  if (b3 === '☁️') b += 3;
  else if (b3 === '🔥' || b3 === '🔬') b += 2;
  if (stdDev(p.word_response_times.filter(t => t > 0)) > 1000) b += 1;
  return b;
}

/** Build all pre-computed user signals at once */
function buildSignals(p: ForgeProfile): Signals {
  const unc = buildUnconsciousNeeds(p);
  const con = buildConsciousNeeds(p);
  const times = p.word_response_times.filter(t => t > 0);
  return {
    userNeeds: {
      nAch: unc.nAch + con.nAch,
      nAff: unc.nAff + con.nAff,
      nPow: unc.nPow + con.nPow,
    },
    unconsciousNeeds: unc,
    consciousNeeds: con,
    workStyle: buildWorkStyle(p.crystal_orbs),
    bigFive: buildBigFive(p),
    boldness: computeBoldness(p),
    customerType: p.scenario_responses?.some(r => r !== '') ? (S1_CUST[p.scenario_responses![0]] ?? 'analytical') : 'analytical',
    competitiveStyle: p.scenario_responses?.some(r => r !== '') ? (S2_COMP[p.scenario_responses![1]] ?? 'differentiator') : 'differentiator',
    timingConsistency: times.length > 0 ? clamp(1 - stdDev(times) / 2000, 0, 1) : 0.5,
    isEffectuation: p.idea_mode !== 'directed', // shortcut treated as open/effectuation
    isInnovation: p.word_responses[2] === 'New',
  };
}

// ════════════════════════════════════════════════════════════
// STEP 2 — HARD FILTER (eliminateIdeas)
// ════════════════════════════════════════════════════════════

/**
 * Remove ideas that are structurally incompatible with the user:
 * 1. Domain in instantly-rejected industries (passed, dwell < 1 s)
 * 2. Budget exceeds resource level
 * 3. Time floor > 8 weeks AND user has < 5 h/week
 */
export function eliminateIdeas(ideas: Idea[], p: ForgeProfile): Idea[] {
  const budgetUSD = RESOURCE_USD[p.resource_level] ?? 10_000;
  const passedSet = new Set(p.industries_passed);

  return ideas.filter(idea => {
    // 1. Instant rejection: domain maps to a passed industry with sub-1s dwell
    const mapped = DOMAIN_TO_INDUSTRY[idea.domain_primary];
    const candidates = [idea.domain_primary, mapped].filter(
      (x): x is string => !!x,
    );
    for (const ind of candidates) {
      if (passedSet.has(ind) && dwellFor(ind, p.industry_dwell_times) < 1000) {
        return false;
      }
    }

    // 2. Budget exceeds resource level (INR → USD conversion)
    if (idea.budget_floor_inr / INR_PER_USD > budgetUSD) return false;

    // 3. Time exceeds 8 weeks for extremely time-constrained users
    if (idea.time_floor_weeks > 8 && p.time_budget === '< 5h/week') return false;

    return true;
  });
}

// ════════════════════════════════════════════════════════════
// STEP 3 — CORE SCORING (9 dimensions → 100 pts)
// ════════════════════════════════════════════════════════════

// ── 3a. Domain Fit — 20 pts ────────────────────────────────

function scoreDomain(idea: Idea, p: ForgeProfile): number {
  const domain = idea.domain_primary;

  // Tier 1: direct domain_primary in edged → 20
  if (p.industries_edged.includes(domain)) return 20;
  // Tier 2: direct domain_primary in kept → 14
  if (p.industries_kept.includes(domain)) return 14;

  // Tier 3: mapped industry check
  const mapped = DOMAIN_TO_INDUSTRY[domain];
  if (mapped) {
    if (p.industries_edged.includes(mapped)) return 20;
    if (p.industries_kept.includes(mapped)) return 8;
  }

  // Tier 4: no connection — baseline so new domains aren't invisible
  return 2;
}

// ── 3b. McClelland Need Alignment — 15 pts ─────────────────

function scoreMcClelland(userNeeds: NeedVector, idea: Idea): number {
  const ideaNeeds = buildIdeaNeeds(idea);
  const sim = cosine(
    [userNeeds.nAch, userNeeds.nAff, userNeeds.nPow],
    [ideaNeeds.nAch, ideaNeeds.nAff, ideaNeeds.nPow],
  );
  return sim * 15;
}

// ── 3c. Temperament / DISC Fit — 15 pts ────────────────────

function scoreTemperament(ws: WorkStyleVector, idea: Idea): number {
  const dot =
    ws.builder * idea.builder_fit +
    ws.seller * idea.seller_fit +
    ws.researcher * idea.researcher_fit +
    ws.creator * idea.creator_fit +
    ws.host * idea.host_fit;

  // Normalize by the number of active work-style dimensions
  const wsSum =
    ws.builder + ws.seller + ws.researcher + ws.creator + ws.host;

  // If no crystal maps to work style (e.g. Freedom+Stability+Vision but
  // Vision maps to creator), fall back to midpoint
  return wsSum === 0 ? 7.5 : (dot / wsSum) * 15;
}

// ── 3d. Problem Orientation — 12 pts ───────────────────────

function scoreProblem(sig: Signals, idea: Idea): number {
  // Customer type match (0-6)
  let custScore = 0;
  switch (sig.customerType) {
    case 'analytical':
      if (idea.is_enterprise_sales) custScore += 3;
      if (idea.problem_type_primary === 'efficiency') custScore += 2;
      if (idea.researcher_fit > 0.6) custScore += 1;
      break;
    case 'relationship':
      if (idea.host_fit > 0.5) custScore += 3;
      if (idea.is_local_offline) custScore += 2;
      if (idea.motive_belonging > 0.5) custScore += 1;
      break;
    case 'growth':
      if (idea.seller_fit > 0.5) custScore += 3;
      if (idea.is_marketplace) custScore += 2;
      if (idea.is_ad_dependent) custScore += 1;
      break;
    case 'craft':
      if (idea.builder_fit > 0.6) custScore += 3;
      if (idea.problem_type_primary === 'experience') custScore += 2;
      if (idea.is_hardware_heavy) custScore += 1;
      break;
  }

  // Competitive style match (0-6)
  let compScore = 0;
  switch (sig.competitiveStyle) {
    case 'follower':
      if (idea.novelty_score <= 5) compScore += 4;
      if (idea.maturity === 'proven') compScore += 2;
      break;
    case 'differentiator':
      if (idea.novelty_score >= 5 && idea.novelty_score <= 7) compScore += 3;
      if (idea.sub_domain.length > 1) compScore += 3;
      break;
    case 'loyalty':
      if (idea.motive_belonging > 0.5) compScore += 3;
      if (idea.host_fit > 0.4) compScore += 3;
      break;
    case 'product':
      if (idea.builder_fit > 0.5) compScore += 3;
      if (idea.execution_rhythm_fit > 0.5) compScore += 3;
      break;
  }

  return Math.min(custScore, 6) + Math.min(compScore, 6);
}

// ── 3e. Execution Style — 10 pts ───────────────────────────

function scoreExecution(sig: Signals, idea: Idea): number {
  // Effectuation/Causation fit (0-4)
  // Effectuation (open) → prefers lower execution_rhythm_fit (flexible)
  // Causation (directed) → prefers higher execution_rhythm_fit (structured)
  const userRhythm = sig.isEffectuation ? 0.3 : 0.7;
  const rhythmScore = (1 - Math.abs(userRhythm - idea.execution_rhythm_fit)) * 4;

  // Innovation / Optimization match (0-3)
  const normNovelty = idea.novelty_score / 10;
  const innovScore = (sig.isInnovation ? normNovelty : 1 - normNovelty) * 3;

  // Timing consistency ↔ structure preference (0-3)
  const consistencyScore =
    (sig.timingConsistency > 0.5
      ? idea.execution_rhythm_fit // consistent → structured ideas
      : 1 - idea.execution_rhythm_fit) * 3; // volatile → flexible ideas

  return rhythmScore + innovScore + consistencyScore;
}

// ── 3f. Big Five Compatibility — 10 pts ────────────────────

function scoreBigFive(bf: BigFiveVector, idea: Idea): number {
  const nn = idea.novelty_score / 10; // normalized novelty
  return (
    2 * (1 - Math.abs(bf.O - nn)) + // Openness ↔ novelty
    2 * (1 - Math.abs(bf.C - idea.execution_rhythm_fit)) + // Conscientiousness ↔ structure
    2 * (1 - Math.abs(bf.E - idea.seller_fit)) + // Extraversion ↔ selling
    2 * (1 - Math.abs(bf.A - idea.host_fit)) + // Agreeableness ↔ hosting
    2 * (1 - Math.abs(bf.N - (1 - nn))) // low N (stable) ↔ high novelty
  );
}

// ── 3g. Practical Feasibility — 8 pts ──────────────────────

function scoreFeasibility(p: ForgeProfile, idea: Idea): number {
  // Time fit: full (3.5), partial (1.75), no match (0.5)
  const comfort = TIME_COMFORT[p.time_budget] ?? 8;
  const timeFit =
    idea.time_floor_weeks <= comfort
      ? 3.5
      : idea.time_floor_weeks <= comfort * 2
        ? 1.75
        : 0.5;

  // Budget fit: full (3.5), partial (1.75), no match (0.5)
  const budgetUSD = RESOURCE_USD[p.resource_level] ?? 10_000;
  const ideaUSD = idea.budget_floor_inr / INR_PER_USD;
  const budgetFit =
    ideaUSD <= budgetUSD * 0.5
      ? 3.5
      : ideaUSD <= budgetUSD
        ? 1.75
        : 0.5;

  // Solo-viable bonus for resource-constrained users
  const soloBonus =
    idea.solo_viable &&
    (p.time_budget === '< 5h/week' ||
      p.resource_level === 'Bootstrapping ($0-1K)')
      ? 1
      : 0;

  return clamp(timeFit + budgetFit + soloBonus, 1, 8);
}

// ── 3h. Boldness Match — 5 pts ─────────────────────────────

function scoreBoldness(boldness: number, idea: Idea): number {
  // Normalize both to 0-1 and reward proximity
  const normBold = boldness / 7;
  const normNovelty = idea.novelty_score / 10;
  return (1 - Math.abs(normBold - normNovelty)) * 5;
}

// ── 3i. Wildcard — 5 pts ───────────────────────────────────

function scoreWildcard(p: ForgeProfile, idea: Idea): number {
  let score = 0;

  if (p.idea_mode === 'directed' && p.user_idea_text.length > 0) {
    // Path B: keyword overlap with user's own idea description
    const corpus = `${idea.idea_name} ${idea.one_liner} ${idea.customer_archetype} ${idea.pain_to_promise}`;
    score = kwOverlap(p.user_idea_text, corpus) * 3;
  } else {
    // Path A: bonus for edged industries
    const mapped = DOMAIN_TO_INDUSTRY[idea.domain_primary];
    if (
      p.industries_edged.includes(idea.domain_primary) ||
      (mapped && p.industries_edged.includes(mapped))
    ) {
      score = 2;
    } else {
      score = 0.5;
    }
  }

  // Competitive advantage keyword boost (up to +2)
  if (p.competitive_advantage && p.competitive_advantage.length > 0) {
    const corpus = `${idea.idea_name} ${idea.one_liner} ${idea.domain_primary} ${idea.customer_archetype}`;
    const overlap = kwOverlap(p.competitive_advantage, corpus);
    score += overlap * 2;
  }

  return Math.min(5, score + 0.5); // baseline 0.5, max 5
}

// ── Full score for one idea ─────────────────────────────────

function scoreOneIdea(
  idea: Idea,
  p: ForgeProfile,
  sig: Signals,
): { total: number; mc: number } {
  const hasScenarios = p.scenario_responses?.some(r => r !== '') ?? false;
  const mcRaw = scoreMcClelland(sig.userNeeds, idea);
  const bfRaw = scoreBigFive(sig.bigFive, idea);

  if (hasScenarios) {
    // Full 9-dimension scoring (100 pts)
    const total =
      scoreDomain(idea, p) +
      mcRaw +
      scoreTemperament(sig.workStyle, idea) +
      scoreProblem(sig, idea) +
      scoreExecution(sig, idea) +
      bfRaw +
      scoreFeasibility(p, idea) +
      scoreBoldness(sig.boldness, idea) +
      scoreWildcard(p, idea);
    return { total, mc: mcRaw };
  }

  // No scenarios: redistribute Problem Orientation 12 pts
  // +6 to McClelland (15→21), +6 to Big Five (10→16)
  const mc = mcRaw * (21 / 15);
  const bf = bfRaw * (16 / 10);
  const total =
    scoreDomain(idea, p) +
    mc +
    scoreTemperament(sig.workStyle, idea) +
    // scoreProblem skipped — 0 pts
    scoreExecution(sig, idea) +
    bf +
    scoreFeasibility(p, idea) +
    scoreBoldness(sig.boldness, idea) +
    scoreWildcard(p, idea);
  return { total, mc };
}

// ════════════════════════════════════════════════════════════
// STEP 4 — IDEAL SOCIAL SELF OVERRIDE (applyOverride)
// ════════════════════════════════════════════════════════════

/**
 * Detects conflict between conscious (headline) and unconscious
 * (blots + scenarios) McClelland signals.
 *
 * Conflict → reweight McClelland to 60% unconscious / 40% conscious
 * Aligned  → keep 50/50 and add +3 confidence bonus
 */
function applyOverride(
  p: ForgeProfile,
  scored: RawScoredIdea[],
  sig: Signals,
): { scored: RawScoredIdea[]; conflicts: string[]; confidenceBonus: number } {
  // Determine headline's primary need category
  const hlMatch = HEADLINE_MAP.find(h => p.headline_choice.includes(h.pat));
  if (!hlMatch) {
    // Can't determine headline need — skip override
    return { scored, conflicts: [], confidenceBonus: 0 };
  }

  const uncDom = dominant(sig.unconsciousNeeds);
  if (!uncDom) {
    // No unconscious signal to compare — skip override
    return { scored, conflicts: [], confidenceBonus: 0 };
  }
  const headlineNeed = hlMatch.need;
  const isConflict = uncDom !== headlineNeed;

  if (!isConflict) {
    // Aligned: 50/50 stays, confidence bonus
    return { scored, conflicts: [], confidenceBonus: 3 };
  }

  // Conflict detected — reweight to 60% unconscious / 40% conscious
  const conflicts = [
    `Conscious signal (${headlineNeed} via headline) conflicts with unconscious pattern (${uncDom} via blots+scenarios)`,
  ];

  const unc = sig.unconsciousNeeds;
  const con = sig.consciousNeeds;
  const adjusted: NeedVector = {
    nAch: unc.nAch * 0.6 + con.nAch * 0.4,
    nAff: unc.nAff * 0.6 + con.nAff * 0.4,
    nPow: unc.nPow * 0.6 + con.nPow * 0.4,
  };

  const hasScenarios = p.scenario_responses?.some(r => r !== '') ?? false;
  const mcScale = hasScenarios ? 1 : (21 / 15);
  const reScored = scored.map(s => {
    const newMc = scoreMcClelland(adjusted, s.idea) * mcScale;
    return {
      idea: s.idea,
      rawScore: s.rawScore + (newMc - s.mcClellandScore),
      mcClellandScore: newMc,
    };
  });

  return { scored: reScored, conflicts, confidenceBonus: 0 };
}

// ════════════════════════════════════════════════════════════
// STEP 5 — PORTFOLIO SELECTION (selectPortfolio)
// ════════════════════════════════════════════════════════════

/** Check if idea's domain is among user's kept or edged industries */
function inKeptOrEdged(idea: Idea, p: ForgeProfile): boolean {
  const pool = new Set([...p.industries_kept, ...p.industries_edged]);
  if (pool.has(idea.domain_primary)) return true;
  const mapped = DOMAIN_TO_INDUSTRY[idea.domain_primary];
  return mapped ? pool.has(mapped) : false;
}

/**
 * NEST:     Top 10 by score → highest feasibility, must be from kept/edged
 * SPARK:    Highest overall score, different domain_primary from Nest
 * WILDVINE: Top 20 → highest novelty, different domain from Nest + Spark
 * ENFORCE:  All 3 different domain_primary; relax to sub_domain if needed
 */
function selectPortfolio(
  scored: RawScoredIdea[],
  p: ForgeProfile,
): { nest: RawScoredIdea; spark: RawScoredIdea; wildvine: RawScoredIdea } {
  const sorted = [...scored].sort((a, b) => b.rawScore - a.rawScore);
  const fallback = sorted[0]; // always exists (we ensured ≥3 ideas)

  // ── NEST ──
  const top10 = sorted.slice(0, Math.min(10, sorted.length));
  const nestPool = top10
    .filter(s => inKeptOrEdged(s.idea, p))
    .sort((a, b) => {
      // Normalize both to 0-1 so neither dominates
      // Budget: 10K-5M INR range. Time: 1-24 weeks range.
      const fA = a.idea.budget_floor_inr / 5_000_000 + a.idea.time_floor_weeks / 24;
      const fB = b.idea.budget_floor_inr / 5_000_000 + b.idea.time_floor_weeks / 24;
      return fA - fB;
    });
  // If no kept/edged ideas in top 10, search the full list before giving up
  const nest = nestPool[0]
    ?? sorted.find(s => inKeptOrEdged(s.idea, p))
    ?? fallback;

  // ── SPARK ──
  let spark = sorted.find(
    s => s !== nest && s.idea.domain_primary !== nest.idea.domain_primary,
  );
  if (!spark) {
    // Relax: different sub_domain
    spark = sorted.find(
      s =>
        s !== nest &&
        !s.idea.sub_domain.some(sd => nest.idea.sub_domain.includes(sd)),
    );
  }
  spark = spark ?? sorted.find(s => s !== nest) ?? fallback;

  // ── WILDVINE ──
  const top20 = sorted.slice(0, Math.min(20, sorted.length));
  const usedDomains = new Set([
    nest.idea.domain_primary,
    spark.idea.domain_primary,
  ]);

  let wildCandidates = top20
    .filter(s => s !== nest && s !== spark && !usedDomains.has(s.idea.domain_primary))
    .sort((a, b) => b.idea.novelty_score - a.idea.novelty_score);

  if (wildCandidates.length === 0) {
    // Relax: different sub_domain from both Nest and Spark
    const usedSubs = new Set([
      ...nest.idea.sub_domain,
      ...spark.idea.sub_domain,
    ]);
    wildCandidates = top20
      .filter(
        s =>
          s !== nest &&
          s !== spark &&
          !s.idea.sub_domain.some(sd => usedSubs.has(sd)),
      )
      .sort((a, b) => b.idea.novelty_score - a.idea.novelty_score);
  }

  const wildvine =
    wildCandidates[0] ??
    sorted.find(s => s !== nest && s !== spark) ??
    fallback;

  return { nest, spark, wildvine };
}

// ════════════════════════════════════════════════════════════
// STEP 6 — CALIBRATION (calibrateScore)
// ════════════════════════════════════════════════════════════

/**
 * Maps raw scores to display ranges via linear interpolation,
 * clamped to each tier's range so users always see meaningful %s.
 *
 *   Nest:     raw 40-70 → display 82-95%
 *   Spark:    raw 35-65 → display 75-90%
 *   Wildvine: raw 25-55 → display 68-82%
 *   Your Idea: raw 30-70 → display 70-95%
 */
function calibrateScore(raw: number, tier: MatchTier): number {
  switch (tier) {
    case 'nest':
      return Math.round(lerp(raw, 40, 70, 82, 95));
    case 'spark':
      return Math.round(lerp(raw, 35, 65, 75, 90));
    case 'wildvine':
      return Math.round(lerp(raw, 25, 55, 68, 82));
    case 'your_idea':
      return Math.round(lerp(raw, 30, 70, 70, 95));
  }
}

// ════════════════════════════════════════════════════════════
// STEP 7 — PATH B HANDLING
// ════════════════════════════════════════════════════════════

/**
 * Find the library idea with highest keyword overlap to user's text.
 * Returns null if no meaningful overlap found (caller should fall back
 * to highest-scored idea from the pipeline).
 */
function findClosestIdea(text: string, ideas: Idea[]): Idea | null {
  let best: Idea | null = null;
  let bestScore = 0; // threshold: must have SOME overlap
  for (const idea of ideas) {
    const corpus = `${idea.idea_name} ${idea.one_liner} ${idea.customer_archetype} ${idea.pain_to_promise}`;
    const s = kwOverlap(text, corpus);
    if (s > bestScore) {
      bestScore = s;
      best = idea;
    }
  }
  return best;
}

/**
 * Path B: user brought their own idea.
 * 1. Find closest library match → "Your Idea" card
 * 2. Compute personality alignment %
 * 3. Pick Spark (better fit than user's idea) and Wildvine from library
 */
function handlePathB(
  p: ForgeProfile,
  scored: RawScoredIdea[],
  sig: Signals,
  surviving: Idea[],
  conflicts: string[],
  confBonus: number,
): PipelineResult {
  // Find closest idea by keyword overlap; fall back to highest-scored idea
  const sorted = [...scored].sort((a, b) => b.rawScore - a.rawScore);
  const closest = findClosestIdea(p.user_idea_text, surviving) ?? sorted[0].idea;
  const { total: yourRaw } = scoreOneIdea(closest, p, sig);

  const yourIdea: ScoredIdea = {
    idea: closest,
    rawScore: yourRaw,
    displayScore: calibrateScore(yourRaw, 'your_idea'),
    matchTier: 'your_idea',
  };

  // Remaining ideas (excluding the closest match)
  const remaining = scored
    .filter(s => s.idea.idea_id !== closest.idea_id)
    .sort((a, b) => b.rawScore - a.rawScore);

  // Guard: if remaining is empty, use the closest as all three cards
  if (remaining.length === 0) {
    return {
      nest: yourIdea, spark: yourIdea, wildvine: yourIdea,
      yourIdea, confidence: 50, conflicts,
    };
  }

  // Spark: library match that suits personality BETTER than user's own idea
  const sparkItem =
    remaining.find(
      s =>
        s.rawScore > yourRaw &&
        s.idea.domain_primary !== closest.domain_primary,
    ) ??
    remaining.find(s => s.idea.domain_primary !== closest.domain_primary) ??
    remaining[0];

  // Wildvine: different domain from both, highest novelty
  const usedDomains = new Set([
    closest.domain_primary,
    sparkItem.idea.domain_primary,
  ]);
  const wildItem =
    remaining
      .filter(
        s => s !== sparkItem && !usedDomains.has(s.idea.domain_primary),
      )
      .sort((a, b) => b.idea.novelty_score - a.idea.novelty_score)[0] ??
    remaining.find(s => s !== sparkItem) ??
    remaining[0];

  const spark: ScoredIdea = {
    idea: sparkItem.idea,
    rawScore: sparkItem.rawScore,
    displayScore: calibrateScore(sparkItem.rawScore, 'spark'),
    matchTier: 'spark',
  };

  const wildvine: ScoredIdea = {
    idea: wildItem.idea,
    rawScore: wildItem.rawScore,
    displayScore: calibrateScore(wildItem.rawScore, 'wildvine'),
    matchTier: 'wildvine',
  };

  return {
    nest: yourIdea, // "Your Idea" takes the first-card position
    spark,
    wildvine,
    yourIdea,
    confidence: computeConfidence(scored) + confBonus,
    conflicts,
  };
}

// ── Confidence metric ───────────────────────────────────────

function computeConfidence(scored: RawScoredIdea[]): number {
  if (scored.length < 3) return 50;
  const scores = scored.map(s => s.rawScore).sort((a, b) => b - a);
  const top3Avg = (scores[0] + scores[1] + scores[2]) / 3;
  return clamp(Math.round(top3Avg + 20), 40, 95);
}

// ════════════════════════════════════════════════════════════
// STEP 8 — MAIN PIPELINE (runMatchingPipeline)
// ════════════════════════════════════════════════════════════

/**
 * The single entry point. Takes the full ForgeProfile from the Zustand
 * store and returns three matched ideas + metadata.
 *
 * Pipeline: filter → score → override → select → calibrate
 */
export function runMatchingPipeline(profile: ForgeProfile): PipelineResult {
  // 1. Pre-compute user personality signals once
  const sig = buildSignals(profile);

  // 2. Hard filter
  let surviving = eliminateIdeas(IDEAS, profile);
  if (surviving.length < 3) surviving = [...IDEAS]; // safety net

  // 3. Score every surviving idea
  let scored: RawScoredIdea[] = surviving.map(idea => {
    const { total, mc } = scoreOneIdea(idea, profile, sig);
    return { idea, rawScore: total, mcClellandScore: mc };
  });

  // 4. Apply Ideal Social Self override
  const { scored: adjusted, conflicts, confidenceBonus } = applyOverride(
    profile,
    scored,
    sig,
  );
  scored = adjusted;

  // 5. Path B divergence
  if (profile.idea_mode === 'directed' && profile.user_idea_text.length > 0) {
    return handlePathB(
      profile,
      scored,
      sig,
      surviving,
      conflicts,
      confidenceBonus,
    );
  }

  // 6. Path A: portfolio selection
  const { nest: nR, spark: sR, wildvine: wR } = selectPortfolio(
    scored,
    profile,
  );

  // 7. Calibrate raw → display scores
  const nest: ScoredIdea = {
    idea: nR.idea,
    rawScore: nR.rawScore,
    displayScore: calibrateScore(nR.rawScore, 'nest'),
    matchTier: 'nest',
  };
  const spark: ScoredIdea = {
    idea: sR.idea,
    rawScore: sR.rawScore,
    displayScore: calibrateScore(sR.rawScore, 'spark'),
    matchTier: 'spark',
  };
  const wildvine: ScoredIdea = {
    idea: wR.idea,
    rawScore: wR.rawScore,
    displayScore: calibrateScore(wR.rawScore, 'wildvine'),
    matchTier: 'wildvine',
  };

  return {
    nest,
    spark,
    wildvine,
    confidence: computeConfidence(scored) + confidenceBonus,
    conflicts,
  };
}
