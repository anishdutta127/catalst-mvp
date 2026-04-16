'use client';

import { useMemo } from 'react';
import { JourneyShell } from '@/components/layout/JourneyShell';
import { finalRun, computeHouseScores, type HouseId } from '@/lib/scoring/orchestrator';
import { extractPersonality } from '@/lib/scoring/engine';
import type { ForgeProfile } from '@/lib/scoring/types';

// ── 6 Synthetic Profiles ─────────────────────────────────────
// 1 per house (strong bias) + 2 moderate variance profiles

const BASE: Omit<ForgeProfile, 'display_name' | 'blot_responses' | 'word_responses' | 'word_response_times' | 'crystal_orbs' | 'crystal_selection_order' | 'crystal_selection_times' | 'unchosen_orbs' | 'headline_choice' | 'industries_kept' | 'industries_edged'> = {
  idea_mode: 'open',
  user_idea_text: '',
  blot_response_times: [2000, 2000, 2000],
  industries_passed: [],
  industry_dwell_times: [],
  scroll_depth_per_card: [],
  scenarioSource: 'none',
  time_budget: '15-30h',
  resource_level: 'Small budget ($1-10K)',
  competitive_advantage: '',
};

const PROFILES: ForgeProfile[] = [
  {
    // Architect-biased: high C, high nAch, low N, low boldness
    ...BASE,
    display_name: 'Architect-Strong',
    blot_responses: ['🦋', '👢', '🔬'],      // nAch heavy
    word_responses: ['Control', 'Slower', 'New', 'Safety'],
    word_response_times: [1200, 1100, 1300, 1200], // consistent (low SD → high C)
    crystal_orbs: ['Analysis', 'Stability', 'Grit'],
    crystal_selection_order: [0, 1, 2],
    crystal_selection_times: [3000, 3000, 3000],
    unchosen_orbs: ['Vision', 'Empathy', 'Influence', 'Freedom', 'Craft'],
    headline_choice: '$100M',
    industries_kept: ['ai_ml', 'finance_payments', 'cybersecurity'],
    industries_edged: ['ai_ml'],
  },
  {
    // Vanguard-biased: high E, high nPow, high boldness
    ...BASE,
    display_name: 'Vanguard-Strong',
    blot_responses: ['💥', '👑', '☁️'],       // nPow heavy + bold blot
    word_responses: ['Freedom', 'Stronger', 'New', 'Thrill'], // Thrill → bold
    word_response_times: [800, 700, 900, 600],   // fast, variable
    crystal_orbs: ['Influence', 'Freedom', 'Craft'],
    crystal_selection_order: [0, 1, 2],
    crystal_selection_times: [1500, 1500, 1500],
    unchosen_orbs: ['Analysis', 'Stability', 'Grit', 'Vision', 'Empathy'],
    headline_choice: '10M Users',
    industries_kept: ['creator_media', 'gaming_entertainment', 'community_social'],
    industries_edged: ['creator_media'],
  },
  {
    // Alchemist-biased: high O, high nAch, LOW C (no Analysis!), high boldness
    // Key: very variable timing → C=0.3, abstract blots → O=1.0, Thrill+☁️ → bold=1.0
    ...BASE,
    display_name: 'Alchemist-Strong',
    blot_responses: ['🦋', '🦇', '☁️'],      // all abstract (O↑), ☁️ bold
    word_responses: ['Freedom', 'Slower', 'New', 'Thrill'],
    word_response_times: [1000, 5000, 800, 6000], // very high SD → C=0.3
    crystal_orbs: ['Vision', 'Freedom', 'Craft'], // NO Analysis → low C
    crystal_selection_order: [0, 1, 2],
    crystal_selection_times: [5000, 5000, 5000],
    unchosen_orbs: ['Influence', 'Stability', 'Grit', 'Empathy', 'Analysis'],
    headline_choice: 'achievement',
    industries_kept: ['ai_ml', 'health_wellness', 'climate_energy', 'space_tech', 'hardware_robotics',
      'education_learning', 'cybersecurity', 'food_agriculture', 'logistics_mobility'],
    industries_edged: ['ai_ml'],
  },
  {
    // Pathfinder-biased: high E+O, high boldness, nPow (not nAch) to avoid Alchemist
    // Key: Influence→E=0.8, Empathy→A=0.4 (suppresses Vanguard's 1-A), variable timing
    ...BASE,
    display_name: 'Pathfinder-Strong',
    blot_responses: ['💥', '👑', '☁️'],       // nPow heavy, ☁️ bold
    word_responses: ['Freedom', 'Stronger', 'New', 'Thrill'],
    word_response_times: [800, 3500, 1200, 4000], // variable → C=0.3
    crystal_orbs: ['Freedom', 'Influence', 'Empathy'], // Freedom→PF tiebreak, Influence→E, Empathy→A
    crystal_selection_order: [0, 1, 2],
    crystal_selection_times: [2000, 2000, 2000],
    unchosen_orbs: ['Analysis', 'Stability', 'Grit', 'Vision', 'Craft'],
    headline_choice: '10M Users',
    industries_kept: ['travel', 'climate_energy', 'space_tech', 'food_agriculture',
      'logistics_mobility', 'community_social', 'hardware_robotics', 'sports_fitness', 'gaming_entertainment'],
    industries_edged: ['travel'],
  },
  {
    // Moderate variance 1: leans alchemist (high O, moderate nAch, low C, low E)
    ...BASE,
    display_name: 'Balanced-A',
    blot_responses: ['🦋', '🦇', '🌺'],      // abstract, nAch
    word_responses: ['Control', 'Slower', 'New', 'Safety'],
    word_response_times: [1200, 4500, 900, 5000], // variable → low C
    crystal_orbs: ['Vision', 'Craft', 'Grit'],
    crystal_selection_order: [0, 1, 2],
    crystal_selection_times: [3000, 3000, 3000],
    unchosen_orbs: ['Analysis', 'Stability', 'Influence', 'Freedom', 'Empathy'],
    headline_choice: 'achievement',
    industries_kept: ['health_wellness', 'education_learning', 'community_social',
      'ai_ml', 'climate_energy', 'food_agriculture', 'sports_fitness', 'parenting', 'senior_care'],
    industries_edged: ['health_wellness'],
  },
  {
    // Moderate variance 2: leans pathfinder (high E+O, moderate bold)
    ...BASE,
    display_name: 'Balanced-B',
    blot_responses: ['🩸', '🌳', '☁️'],      // mixed needs, ☁️ bold
    word_responses: ['Freedom', 'Stronger', 'New', 'Thrill'],
    word_response_times: [1000, 3000, 1500, 3500], // variable → low C
    crystal_orbs: ['Freedom', 'Influence', 'Vision'],
    crystal_selection_order: [0, 1, 2],
    crystal_selection_times: [2500, 2500, 2500],
    unchosen_orbs: ['Analysis', 'Stability', 'Grit', 'Empathy', 'Craft'],
    headline_choice: 'Anywhere',
    industries_kept: ['creator_media', 'gaming_entertainment', 'travel', 'sports_fitness',
      'fashion_beauty', 'food_agriculture', 'dating', 'community_social', 'cannabis'],
    industries_edged: ['creator_media'],
  },
];

// ── House Colors ─────────────────────────────────────────────

const HOUSE_COLORS: Record<HouseId, string> = {
  architects: '#D4A843',
  vanguards: '#C41E3A',
  alchemists: '#2563EB',
  pathfinders: '#059669',
};

// ── Page Component ───────────────────────────────────────────

export default function TestScoringPage() {
  const results = useMemo(() => {
    return PROFILES.map(profile => {
      const result = finalRun(profile);
      const personality = extractPersonality(profile);
      return { profile, result, personality };
    });
  }, []);

  // Spread verification
  const houseCounts: Record<HouseId, number> = { architects: 0, vanguards: 0, alchemists: 0, pathfinders: 0 };
  for (const r of results) houseCounts[r.result.house]++;
  const maxPct = Math.max(...Object.values(houseCounts)) / results.length * 100;
  const spreadPass = Object.values(houseCounts).filter(c => c > 0).length === 4 && maxPct <= 60;

  return (
    <JourneyShell currentScreen="s00" completedScreens={[]} ctaVisible={false}>
      <div className="flex flex-col gap-6 py-4 max-w-full">
        <div className="text-center">
          <p className="text-xs font-mono text-ivory/40 uppercase tracking-widest">
            scoring orchestrator test
          </p>

          {/* Spread verification banner */}
          <div className={`mt-3 px-3 py-2 rounded text-xs font-mono ${spreadPass ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
            SPREAD: {spreadPass ? 'PASS' : 'FAIL'} — {Object.entries(houseCounts).map(([h, c]) => `${h}: ${c}`).join(', ')} — max {maxPct.toFixed(0)}%
          </div>
        </div>

        {/* Results grid */}
        <div className="flex flex-col gap-4">
          {results.map(({ profile, result, personality }) => (
            <div key={profile.display_name} className="bg-dark-surface/80 border border-white/10 rounded-lg p-3 text-xs">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-ivory">{profile.display_name}</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                  style={{ backgroundColor: HOUSE_COLORS[result.house] + '30', color: HOUSE_COLORS[result.house] }}
                >
                  {result.house}
                </span>
              </div>

              {/* House scores */}
              <div className="flex gap-2 mb-2">
                {(Object.entries(result.houseScores) as [HouseId, number][]).map(([house, score]) => (
                  <div key={house} className="flex-1 text-center">
                    <div className="text-[10px] text-ivory/40">{house.slice(0, 4)}</div>
                    <div
                      className="text-[11px] font-mono"
                      style={{ color: house === result.house ? HOUSE_COLORS[house] : 'rgba(245,240,232,0.4)' }}
                    >
                      {score.toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Personality */}
              <div className="text-[10px] text-ivory/30 mb-1">
                B5: O={personality.bigFive.O.toFixed(2)} C={personality.bigFive.C.toFixed(2)} E={personality.bigFive.E.toFixed(2)} A={personality.bigFive.A.toFixed(2)} N={personality.bigFive.N.toFixed(2)} | bold={personality.boldness.toFixed(2)} | nAch={personality.mcClelland.nAch.toFixed(2)} nPow={personality.mcClelland.nPow.toFixed(2)}
              </div>

              {/* Ideas */}
              <div className="flex flex-col gap-1 mt-2">
                {[result.pipeline.nest, result.pipeline.spark, result.pipeline.wildvine].map((si) => (
                  <div key={si.idea.idea_id} className="flex items-center justify-between text-[10px]">
                    <span className="text-ivory/60 truncate flex-1 mr-2">
                      <span className="text-gold/60 uppercase">{si.matchTier}</span> {si.idea.idea_name}
                    </span>
                    <span className="text-ivory/30 font-mono whitespace-nowrap">
                      {si.displayScore}% ({si.rawScore.toFixed(1)})
                    </span>
                  </div>
                ))}
              </div>

              {/* Fallback + confidence */}
              <div className="flex justify-between mt-1 text-[10px] text-ivory/20">
                <span>fallback: L{result.fallbackLevel}</span>
                <span>confidence: {result.pipeline.confidence}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dev-only overlay */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="fixed top-2 right-2 z-50 bg-black/80 text-green-400 text-xs font-mono px-2 py-1 rounded">
            profiles: {results.length} | spread: {spreadPass ? 'OK' : 'FAIL'}
          </div>
        )}
      </div>
    </JourneyShell>
  );
}
