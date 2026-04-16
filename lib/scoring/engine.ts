/**
 * Scoring Engine — CATALST MVP
 *
 * Adapted from handoff/scoring-reference.ts (v7).
 * Matches user journey data (personality signals from screens)
 * against the 260-idea library using multi-framework scoring
 * across 9 weighted dimensions totaling 100 points.
 *
 * Frameworks: McClelland Need Theory, DISC, Big Five (OCEAN),
 * Holland RIASEC, Rorschach projective, TAT scenarios, Jung timing
 */

import ideasRaw from '@/content/ideas.json';
import type { Idea, ForgeProfile, MatchTier, ScoredIdea, PipelineResult } from './types';

export const IDEAS: Idea[] = ideasRaw as unknown as Idea[];

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
  mcClellandScore: number;
}

interface Signals {
  userNeeds: NeedVector;
  unconsciousNeeds: NeedVector;
  consciousNeeds: NeedVector;
  workStyle: WorkStyleVector;
  bigFive: BigFiveVector;
  boldness: number;
  customerType: string;
  competitiveStyle: string;
  timingConsistency: number;
  isEffectuation: boolean;
  isInnovation: boolean;
}

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════

const INR_PER_USD = 83;

/** 25 user-facing industries in S04 presentation order */
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
  'pet_care',
  'spirituality',
  'space_tech',
  'cybersecurity',
  'dating',
  'travel',
  'senior_care',
  'parenting',
  'cannabis',
  'web3',
] as const;

export const DOMAIN_TO_INDUSTRY: Record<string, string> = {
  health_wellness: 'health_wellness',
  community_social: 'community_social',
  sports_fitness: 'sports_fitness',
  fashion_beauty: 'fashion_beauty',
  creator_tools: 'creator_media',
  media_entertainment: 'creator_media',
  education: 'education_learning',
  ai_automation: 'ai_ml',
  saas_productivity: 'ai_ml',
  hr_recruitment: 'ai_ml',
  cybersecurity: 'cybersecurity',
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
  parenting_family: 'parenting',
  pet_care: 'pet_care',
  biotech: 'health_wellness',
  legaltech: 'legal_compliance',
  professional_services: 'legal_compliance',
  gaming_esports: 'gaming_entertainment',
  logistics_supply_chain: 'logistics_mobility',
  manufacturing: 'hardware_robotics',
  travel_hospitality: 'travel',
  events_weddings: 'travel',
  govtech_civic: 'community_social',
  spiritual_religious: 'spirituality',
  dating_relationships: 'dating',
  senior_care: 'senior_care',
  aerospace: 'space_tech',
  cannabis_wellness: 'cannabis',
  blockchain_web3: 'web3',
  crypto: 'web3',
};

const RESOURCE_USD: Record<string, number> = {
  'Bootstrapping ($0-1K)': 1_000,
  'Small budget ($1-10K)': 10_000,
  'Funded ($10K+)': 100_000,
};

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
  '🌋': { nAch: 1, nAff: 0, nPow: 0 },
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
  { pat: 'achievement', d: { nAch: 3, nAff: 0, nPow: 0 }, need: 'nAch' },
  { pat: 'autonomy', d: { nAch: 1, nAff: 0, nPow: 0 }, need: 'nAch' },
  { pat: 'power', d: { nAch: 0, nAff: 0, nPow: 3 }, need: 'nPow' },
  { pat: 'affiliation', d: { nAch: 0, nAff: 3, nPow: 0 }, need: 'nAff' },
  { pat: '$100M', d: { nAch: 3, nAff: 0, nPow: 0 }, need: 'nAch' },
  { pat: 'Anywhere', d: { nAch: 1, nAff: 0, nPow: 0 }, need: 'nAch' },
  { pat: '10M Users', d: { nAch: 0, nAff: 0, nPow: 3 }, need: 'nPow' },
  { pat: '10 Million', d: { nAch: 0, nAff: 0, nPow: 3 }, need: 'nPow' },
  { pat: '50K Founders', d: { nAch: 0, nAff: 3, nPow: 0 }, need: 'nAff' },
  { pat: '50,000', d: { nAch: 0, nAff: 3, nPow: 0 }, need: 'nAff' },
];

// ── Crystal → Work Style ────────────────────────────────────

const CRYSTAL_WORK: Record<string, (keyof WorkStyleVector)[]> = {
  Grit: ['builder'],
  Influence: ['seller'],
  Analysis: ['researcher'],
  Vision: ['creator'],
  Empathy: ['host'],
  Craft: ['builder'],
  Freedom: ['creator'],
  Stability: ['researcher'],
};

// ── Scenario → Customer Type / Competitive Style ────────────

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

function lerp(v: number, inLo: number, inHi: number, outLo: number, outHi: number): number {
  const t = clamp((v - inLo) / (inHi - inLo || 1), 0, 1);
  return outLo + t * (outHi - outLo);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, mA = 0, mB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  const denom = Math.sqrt(mA) * Math.sqrt(mB);
  return denom === 0 ? 0 : dot / denom;
}

function stdDev(vals: number[]): number {
  if (vals.length === 0) return 0;
  const m = vals.reduce((s, v) => s + v, 0) / vals.length;
  return Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length);
}

const SHORT_KEEP = new Set(['ai', 'ml', 'vr', 'ar', '3d', 'hr', 'ev', 'b2b', 'b2c', 'd2c', 'saas', 'app']);

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
      .filter(w => w.length > 2 || SHORT_KEEP.has(w)),
  );
}

function kwOverlap(a: string, b: string): number {
  const tA = tokenize(a);
  const tB = tokenize(b);
  if (tA.size === 0 || tB.size === 0) return 0;
  let hits = 0;
  tA.forEach(t => { if (tB.has(t)) hits++; });
  return hits / Math.max(tA.size, tB.size);
}

function addNeed(v: NeedVector, d: ND | undefined): void {
  if (!d) return;
  v.nAch += d.nAch;
  v.nAff += d.nAff;
  v.nPow += d.nPow;
}

function dominant(v: NeedVector): 'nAch' | 'nAff' | 'nPow' | null {
  const total = v.nAch + v.nAff + v.nPow;
  if (total === 0) return null;
  if (v.nAch >= v.nAff && v.nAch >= v.nPow) return 'nAch';
  if (v.nAff >= v.nPow) return 'nAff';
  return 'nPow';
}

function dwellFor(id: string, dwells: number[]): number {
  const idx = (INDUSTRY_ORDER as readonly string[]).indexOf(id);
  return idx >= 0 && idx < dwells.length ? dwells[idx] : Infinity;
}

// ════════════════════════════════════════════════════════════
// SIGNAL BUILDERS
// ════════════════════════════════════════════════════════════

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

function buildIdeaNeeds(idea: Idea): NeedVector {
  return {
    nAch: Math.max(idea.motive_mastery, idea.motive_wealth),
    nAff: Math.max(idea.motive_belonging, idea.motive_stability),
    nPow: Math.max(idea.motive_status, idea.motive_impact),
  };
}

function buildWorkStyle(orbs: readonly string[]): WorkStyleVector {
  const ws: WorkStyleVector = { builder: 0, seller: 0, researcher: 0, creator: 0, host: 0 };
  for (const orb of orbs) {
    const keys = CRYSTAL_WORK[orb];
    if (keys) for (const k of keys) ws[k] = 1.0;
  }
  return ws;
}

function buildBigFive(p: ForgeProfile): BigFiveVector {
  const orbs = new Set(p.crystal_orbs);
  const times = p.word_response_times.filter(t => t > 0);
  const avgTime = times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 2000;
  const tSD = stdDev(times);

  const abstractBlots = new Set(['🦋', '🦇', '☁️', '🌺', '🎨']);
  const absCount = p.blot_responses.filter(b => abstractBlots.has(b)).length;

  const affBlots = new Set(['👥', '👤', '👁️']);
  const affCount = p.blot_responses.filter(b => affBlots.has(b)).length;

  return {
    O: clamp(
      (p.industries_kept.length > 8 ? 0.7 : p.industries_kept.length > 5 ? 0.5 : 0.3) + absCount * 0.15,
      0, 1,
    ),
    C: clamp((tSD < 500 ? 0.7 : tSD < 1000 ? 0.5 : 0.3) + (orbs.has('Analysis') ? 0.3 : 0), 0, 1),
    E: clamp((orbs.has('Influence') ? 0.4 : 0) + (p.word_responses[1] === 'Stronger' ? 0.4 : 0.1), 0, 1),
    A: clamp((orbs.has('Empathy') ? 0.4 : 0) + affCount * 0.2, 0, 1),
    N: clamp(avgTime > 3000 ? 0.7 : avgTime > 1500 ? 0.5 : 0.3, 0, 1),
  };
}

function computeBoldness(p: ForgeProfile): number {
  let b = 0;
  if (p.word_responses[3] === 'Thrill') b += 3;
  const b3 = p.blot_responses[2];
  if (b3 === '☁️') b += 3;
  else if (b3 === '🌋' || b3 === '🔬') b += 2;
  if (stdDev(p.word_response_times.filter(t => t > 0)) > 1000) b += 1;
  return b;
}

function buildSignals(p: ForgeProfile): Signals {
  const unc = buildUnconsciousNeeds(p);
  const con = buildConsciousNeeds(p);
  const times = p.word_response_times.filter(t => t > 0);
  return {
    userNeeds: { nAch: unc.nAch + con.nAch, nAff: unc.nAff + con.nAff, nPow: unc.nPow + con.nPow },
    unconsciousNeeds: unc,
    consciousNeeds: con,
    workStyle: buildWorkStyle(p.crystal_orbs),
    bigFive: buildBigFive(p),
    boldness: computeBoldness(p),
    customerType: p.scenario_responses?.some(r => r !== '') ? (S1_CUST[p.scenario_responses![0]] ?? 'analytical') : 'analytical',
    competitiveStyle: p.scenario_responses?.some(r => r !== '') ? (S2_COMP[p.scenario_responses![1]] ?? 'differentiator') : 'differentiator',
    timingConsistency: times.length > 0 ? clamp(1 - stdDev(times) / 2000, 0, 1) : 0.5,
    isEffectuation: p.idea_mode !== 'directed',
    isInnovation: p.word_responses[2] === 'New',
  };
}

// ════════════════════════════════════════════════════════════
// HARD FILTER
// ════════════════════════════════════════════════════════════

export function eliminateIdeas(ideas: Idea[], p: ForgeProfile): Idea[] {
  const budgetUSD = RESOURCE_USD[p.resource_level] ?? 10_000;
  const passedSet = new Set(p.industries_passed);

  return ideas.filter(idea => {
    const mapped = DOMAIN_TO_INDUSTRY[idea.domain_primary];
    const candidates = [idea.domain_primary, mapped].filter((x): x is string => !!x);
    for (const ind of candidates) {
      if (passedSet.has(ind) && dwellFor(ind, p.industry_dwell_times) < 1000) return false;
    }
    if (idea.budget_floor_inr / INR_PER_USD > budgetUSD) return false;
    if (idea.time_floor_weeks > 8 && p.time_budget === '< 5h/week') return false;
    return true;
  });
}

// ════════════════════════════════════════════════════════════
// CORE SCORING (9 dimensions → 100 pts)
// ════════════════════════════════════════════════════════════

function scoreDomain(idea: Idea, p: ForgeProfile): number {
  const domain = idea.domain_primary;
  if (p.industries_edged.includes(domain)) return 20;
  if (p.industries_kept.includes(domain)) return 14;
  const mapped = DOMAIN_TO_INDUSTRY[domain];
  if (mapped) {
    if (p.industries_edged.includes(mapped)) return 20;
    if (p.industries_kept.includes(mapped)) return 8;
  }
  return 2;
}

function scoreMcClelland(userNeeds: NeedVector, idea: Idea): number {
  const ideaNeeds = buildIdeaNeeds(idea);
  return cosine([userNeeds.nAch, userNeeds.nAff, userNeeds.nPow], [ideaNeeds.nAch, ideaNeeds.nAff, ideaNeeds.nPow]) * 15;
}

function scoreTemperament(ws: WorkStyleVector, idea: Idea): number {
  const dot = ws.builder * idea.builder_fit + ws.seller * idea.seller_fit +
    ws.researcher * idea.researcher_fit + ws.creator * idea.creator_fit + ws.host * idea.host_fit;
  const wsSum = ws.builder + ws.seller + ws.researcher + ws.creator + ws.host;
  return wsSum === 0 ? 7.5 : (dot / wsSum) * 15;
}

function scoreProblem(sig: Signals, idea: Idea): number {
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

function scoreExecution(sig: Signals, idea: Idea): number {
  const userRhythm = sig.isEffectuation ? 0.3 : 0.7;
  const rhythmScore = (1 - Math.abs(userRhythm - idea.execution_rhythm_fit)) * 4;
  const normNovelty = idea.novelty_score / 10;
  const innovScore = (sig.isInnovation ? normNovelty : 1 - normNovelty) * 3;
  const consistencyScore = (sig.timingConsistency > 0.5 ? idea.execution_rhythm_fit : 1 - idea.execution_rhythm_fit) * 3;
  return rhythmScore + innovScore + consistencyScore;
}

function scoreBigFive(bf: BigFiveVector, idea: Idea): number {
  const nn = idea.novelty_score / 10;
  return (
    2 * (1 - Math.abs(bf.O - nn)) +
    2 * (1 - Math.abs(bf.C - idea.execution_rhythm_fit)) +
    2 * (1 - Math.abs(bf.E - idea.seller_fit)) +
    2 * (1 - Math.abs(bf.A - idea.host_fit)) +
    2 * (1 - Math.abs(bf.N - (1 - nn)))
  );
}

function scoreFeasibility(p: ForgeProfile, idea: Idea): number {
  const comfort = TIME_COMFORT[p.time_budget] ?? 8;
  const timeFit = idea.time_floor_weeks <= comfort ? 3.5 : idea.time_floor_weeks <= comfort * 2 ? 1.75 : 0.5;
  const budgetUSD = RESOURCE_USD[p.resource_level] ?? 10_000;
  const ideaUSD = idea.budget_floor_inr / INR_PER_USD;
  const budgetFit = ideaUSD <= budgetUSD * 0.5 ? 3.5 : ideaUSD <= budgetUSD ? 1.75 : 0.5;
  const soloBonus = idea.solo_viable && (p.time_budget === '< 5h/week' || p.resource_level === 'Bootstrapping ($0-1K)') ? 1 : 0;
  return clamp(timeFit + budgetFit + soloBonus, 1, 8);
}

function scoreBoldness(boldness: number, idea: Idea): number {
  const normBold = boldness / 7;
  const normNovelty = idea.novelty_score / 10;
  return (1 - Math.abs(normBold - normNovelty)) * 5;
}

function scoreWildcard(p: ForgeProfile, idea: Idea): number {
  let score = 0;
  if (p.idea_mode === 'directed' && p.user_idea_text.length > 0) {
    const corpus = `${idea.idea_name} ${idea.one_liner} ${idea.customer_archetype} ${idea.pain_to_promise}`;
    score = kwOverlap(p.user_idea_text, corpus) * 3;
  } else {
    const mapped = DOMAIN_TO_INDUSTRY[idea.domain_primary];
    if (p.industries_edged.includes(idea.domain_primary) || (mapped && p.industries_edged.includes(mapped))) {
      score = 2;
    } else {
      score = 0.5;
    }
  }
  if (p.competitive_advantage && p.competitive_advantage.length > 0) {
    const corpus = `${idea.idea_name} ${idea.one_liner} ${idea.domain_primary} ${idea.customer_archetype}`;
    score += kwOverlap(p.competitive_advantage, corpus) * 2;
  }
  return Math.min(5, score + 0.5);
}

function scoreOneIdea(idea: Idea, p: ForgeProfile, sig: Signals): { total: number; mc: number } {
  const hasScenarios = p.scenario_responses?.some(r => r !== '') ?? false;
  const mcRaw = scoreMcClelland(sig.userNeeds, idea);
  const bfRaw = scoreBigFive(sig.bigFive, idea);

  if (hasScenarios) {
    return {
      total: scoreDomain(idea, p) + mcRaw + scoreTemperament(sig.workStyle, idea) +
        scoreProblem(sig, idea) + scoreExecution(sig, idea) + bfRaw +
        scoreFeasibility(p, idea) + scoreBoldness(sig.boldness, idea) + scoreWildcard(p, idea),
      mc: mcRaw,
    };
  }

  const mc = mcRaw * (21 / 15);
  const bf = bfRaw * (16 / 10);
  return {
    total: scoreDomain(idea, p) + mc + scoreTemperament(sig.workStyle, idea) +
      scoreExecution(sig, idea) + bf + scoreFeasibility(p, idea) +
      scoreBoldness(sig.boldness, idea) + scoreWildcard(p, idea),
    mc,
  };
}

// ════════════════════════════════════════════════════════════
// IDEAL SOCIAL SELF OVERRIDE
// ════════════════════════════════════════════════════════════

function applyOverride(
  p: ForgeProfile, scored: RawScoredIdea[], sig: Signals,
): { scored: RawScoredIdea[]; conflicts: string[]; confidenceBonus: number } {
  const hlMatch = HEADLINE_MAP.find(h => p.headline_choice.includes(h.pat));
  if (!hlMatch) return { scored, conflicts: [], confidenceBonus: 0 };

  const uncDom = dominant(sig.unconsciousNeeds);
  if (!uncDom) return { scored, conflicts: [], confidenceBonus: 0 };

  const headlineNeed = hlMatch.need;
  if (uncDom === headlineNeed) return { scored, conflicts: [], confidenceBonus: 3 };

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
    return { idea: s.idea, rawScore: s.rawScore + (newMc - s.mcClellandScore), mcClellandScore: newMc };
  });

  return { scored: reScored, conflicts, confidenceBonus: 0 };
}

// ════════════════════════════════════════════════════════════
// PORTFOLIO SELECTION
// ════════════════════════════════════════════════════════════

function inKeptOrEdged(idea: Idea, p: ForgeProfile): boolean {
  const pool = new Set([...p.industries_kept, ...p.industries_edged]);
  if (pool.has(idea.domain_primary)) return true;
  const mapped = DOMAIN_TO_INDUSTRY[idea.domain_primary];
  return mapped ? pool.has(mapped) : false;
}

function selectPortfolio(scored: RawScoredIdea[], p: ForgeProfile) {
  const sorted = [...scored].sort((a, b) => b.rawScore - a.rawScore);
  const fallback = sorted[0];

  // NEST
  const top10 = sorted.slice(0, Math.min(10, sorted.length));
  const nestPool = top10
    .filter(s => inKeptOrEdged(s.idea, p))
    .sort((a, b) => {
      const fA = a.idea.budget_floor_inr / 5_000_000 + a.idea.time_floor_weeks / 24;
      const fB = b.idea.budget_floor_inr / 5_000_000 + b.idea.time_floor_weeks / 24;
      return fA - fB;
    });
  const nest = nestPool[0] ?? sorted.find(s => inKeptOrEdged(s.idea, p)) ?? fallback;

  // SPARK
  let spark = sorted.find(s => s !== nest && s.idea.domain_primary !== nest.idea.domain_primary);
  if (!spark) {
    spark = sorted.find(s => s !== nest && !s.idea.sub_domain.some(sd => nest.idea.sub_domain.includes(sd)));
  }
  spark = spark ?? sorted.find(s => s !== nest) ?? fallback;

  // WILDVINE
  const top20 = sorted.slice(0, Math.min(20, sorted.length));
  const usedDomains = new Set([nest.idea.domain_primary, spark.idea.domain_primary]);
  let wildCandidates = top20
    .filter(s => s !== nest && s !== spark && !usedDomains.has(s.idea.domain_primary))
    .sort((a, b) => b.idea.novelty_score - a.idea.novelty_score);

  if (wildCandidates.length === 0) {
    const usedSubs = new Set([...nest.idea.sub_domain, ...spark.idea.sub_domain]);
    wildCandidates = top20
      .filter(s => s !== nest && s !== spark && !s.idea.sub_domain.some(sd => usedSubs.has(sd)))
      .sort((a, b) => b.idea.novelty_score - a.idea.novelty_score);
  }

  const wildvine = wildCandidates[0] ?? sorted.find(s => s !== nest && s !== spark) ?? fallback;
  return { nest, spark, wildvine };
}

// ════════════════════════════════════════════════════════════
// CALIBRATION
// ════════════════════════════════════════════════════════════

function calibrateScore(raw: number, tier: MatchTier): number {
  switch (tier) {
    case 'nest': return Math.round(lerp(raw, 40, 70, 82, 95));
    case 'spark': return Math.round(lerp(raw, 35, 65, 75, 90));
    case 'wildvine': return Math.round(lerp(raw, 25, 55, 68, 82));
    case 'your_idea': return Math.round(lerp(raw, 30, 70, 70, 95));
  }
}

// ════════════════════════════════════════════════════════════
// PATH B HANDLING
// ════════════════════════════════════════════════════════════

function findClosestIdea(text: string, ideas: Idea[]): Idea | null {
  let best: Idea | null = null;
  let bestScore = 0;
  for (const idea of ideas) {
    const corpus = `${idea.idea_name} ${idea.one_liner} ${idea.customer_archetype} ${idea.pain_to_promise}`;
    const s = kwOverlap(text, corpus);
    if (s > bestScore) { bestScore = s; best = idea; }
  }
  return best;
}

function handlePathB(
  p: ForgeProfile, scored: RawScoredIdea[], sig: Signals,
  surviving: Idea[], conflicts: string[], confBonus: number,
): PipelineResult {
  const sorted = [...scored].sort((a, b) => b.rawScore - a.rawScore);
  const closest = findClosestIdea(p.user_idea_text, surviving) ?? sorted[0].idea;
  const { total: yourRaw } = scoreOneIdea(closest, p, sig);

  const yourIdea: ScoredIdea = {
    idea: closest, rawScore: yourRaw,
    displayScore: calibrateScore(yourRaw, 'your_idea'), matchTier: 'your_idea',
  };

  const remaining = scored.filter(s => s.idea.idea_id !== closest.idea_id).sort((a, b) => b.rawScore - a.rawScore);
  if (remaining.length === 0) {
    return { nest: yourIdea, spark: yourIdea, wildvine: yourIdea, yourIdea, confidence: 50, conflicts };
  }

  const sparkItem = remaining.find(s => s.rawScore > yourRaw && s.idea.domain_primary !== closest.domain_primary)
    ?? remaining.find(s => s.idea.domain_primary !== closest.domain_primary) ?? remaining[0];

  const usedDomains = new Set([closest.domain_primary, sparkItem.idea.domain_primary]);
  const wildItem = remaining
    .filter(s => s !== sparkItem && !usedDomains.has(s.idea.domain_primary))
    .sort((a, b) => b.idea.novelty_score - a.idea.novelty_score)[0]
    ?? remaining.find(s => s !== sparkItem) ?? remaining[0];

  return {
    nest: yourIdea,
    spark: { idea: sparkItem.idea, rawScore: sparkItem.rawScore, displayScore: calibrateScore(sparkItem.rawScore, 'spark'), matchTier: 'spark' },
    wildvine: { idea: wildItem.idea, rawScore: wildItem.rawScore, displayScore: calibrateScore(wildItem.rawScore, 'wildvine'), matchTier: 'wildvine' },
    yourIdea,
    confidence: computeConfidence(scored) + confBonus,
    conflicts,
  };
}

function computeConfidence(scored: RawScoredIdea[]): number {
  if (scored.length < 3) return 50;
  const scores = scored.map(s => s.rawScore).sort((a, b) => b - a);
  const top3Avg = (scores[0] + scores[1] + scores[2]) / 3;
  return clamp(Math.round(top3Avg + 20), 40, 95);
}

// ════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ════════════════════════════════════════════════════════════

/**
 * The single entry point. Takes the full ForgeProfile and returns
 * three matched ideas + metadata.
 *
 * Pipeline: filter → score → override → select → calibrate
 */
export function runMatchingPipeline(profile: ForgeProfile): PipelineResult {
  const sig = buildSignals(profile);

  let surviving = eliminateIdeas(IDEAS, profile);
  if (surviving.length < 3) surviving = [...IDEAS];

  let scored: RawScoredIdea[] = surviving.map(idea => {
    const { total, mc } = scoreOneIdea(idea, profile, sig);
    return { idea, rawScore: total, mcClellandScore: mc };
  });

  const { scored: adjusted, conflicts, confidenceBonus } = applyOverride(profile, scored, sig);
  scored = adjusted;

  if (profile.idea_mode === 'directed' && profile.user_idea_text.length > 0) {
    return handlePathB(profile, scored, sig, surviving, conflicts, confidenceBonus);
  }

  const { nest: nR, spark: sR, wildvine: wR } = selectPortfolio(scored, profile);

  return {
    nest: { idea: nR.idea, rawScore: nR.rawScore, displayScore: calibrateScore(nR.rawScore, 'nest'), matchTier: 'nest' },
    spark: { idea: sR.idea, rawScore: sR.rawScore, displayScore: calibrateScore(sR.rawScore, 'spark'), matchTier: 'spark' },
    wildvine: { idea: wR.idea, rawScore: wR.rawScore, displayScore: calibrateScore(wR.rawScore, 'wildvine'), matchTier: 'wildvine' },
    confidence: computeConfidence(scored) + confidenceBonus,
    conflicts,
  };
}
