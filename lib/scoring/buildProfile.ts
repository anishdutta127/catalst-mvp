/**
 * Assemble a ForgeProfile from the journey store state.
 * Shared between S07 (initial fire) and S08 (fallback re-fire).
 */

import type { JourneyState } from '@/lib/store/journeyStore';
import type { ForgeProfile, ScenarioSource } from './types';

export function buildForgeProfile(state: JourneyState): ForgeProfile {
  return {
    display_name: state.displayName,
    idea_mode: state.ideaMode === 'shortcut' ? 'shortcut' : state.ideaMode === 'directed' ? 'directed' : 'open',
    user_idea_text: state.userIdeaText,
    blot_responses: pad3(state.blotResponses, '') as [string, string, string],
    blot_response_times: pad3(state.blotResponseTimes, 0) as [number, number, number],
    word_responses: pad4(state.wordResponses, '') as [string, string, string, string],
    word_response_times: pad4(state.wordResponseTimes, 0) as [number, number, number, number],
    industries_kept: state.industriesKept,
    industries_passed: state.industriesPassed,
    industries_edged: state.industriesEdged,
    industry_dwell_times: state.industryDwellTimes,
    scroll_depth_per_card: state.scrollDepthPerCard,
    scenarioSource: (state.ideaMode === 'shortcut' ? 'parsed' : 'none') as ScenarioSource,
    crystal_orbs: pad3(state.crystalOrbs, '') as [string, string, string],
    crystal_selection_order: pad3(state.crystalSelectionOrder, 0) as [number, number, number],
    crystal_selection_times: pad3(state.crystalSelectionTimes, 0) as [number, number, number],
    unchosen_orbs: state.unchosenOrbs,
    headline_choice: state.headlineChoice,
    time_budget: state.timeBudget,
    resource_level: state.resourceLevel,
    competitive_advantage: state.competitiveAdvantage,
  };
}

function pad3<T>(arr: T[], fill: T): T[] {
  return arr.length >= 3 ? arr.slice(0, 3) : [...arr, fill, fill, fill].slice(0, 3);
}

function pad4<T>(arr: T[], fill: T): T[] {
  return arr.length >= 4 ? arr.slice(0, 4) : [...arr, fill, fill, fill, fill].slice(0, 4);
}
