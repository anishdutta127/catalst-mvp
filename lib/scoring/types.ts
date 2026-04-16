/**
 * Scoring engine types — ForgeProfile, ScoredIdea, PipelineResult.
 * Shared between the scoring engine and the Zustand store.
 */

// ── Idea shape (from content/ideas.json) ──────────────────────

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
}

// ── ForgeProfile (all user inputs for scoring) ────────────────

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

// ── Scoring Output ────────────────────────────────────────────

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

// ── Personality Framework Types ───────────────────────────────

export interface RIASECProfile {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export interface DISCProfile {
  D: number;
  I: number;
  S: number;
  C: number;
}

export interface BigFiveProfile {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface McClellandProfile {
  achievement: number;
  affiliation: number;
  power: number;
}
