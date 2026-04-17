/**
 * Journey Store — persistent state for the entire user journey.
 * Syncs to Supabase after each screen completion.
 */

import { create } from 'zustand';
import type { ScreenId, IdeaMode } from '@/lib/constants';
import type { PipelineResult } from '@/lib/scoring/types';
import { getNextScreen, getCompletedScreens } from '@/lib/screenFlow';
import { syncSession } from '@/lib/supabase/sync';
import { analytics } from '@/lib/analytics';

// ── State Shape ───────────────────────────────────────────────

export interface JourneyState {
  // Identity
  sessionId: string;
  displayName: string;

  // Path
  ideaMode: IdeaMode | null;
  userIdeaText: string;

  // S02: Inkblots
  blotResponses: string[];
  blotResponseTimes: number[];

  // S03: Words
  wordResponses: string[];
  wordResponseTimes: number[];

  // S04: Industries
  industriesKept: string[];
  industriesPassed: string[];
  industriesEdged: string[];
  industryDwellTimes: number[];
  scrollDepthPerCard: number[];

  // S05: Scenarios
  scenarioResponses: string[];
  scenarioResponseTimes: number[];

  // S06: Crystal
  crystalOrbs: string[];
  crystalSelectionOrder: number[];
  crystalSelectionTimes: number[];
  unchosenOrbs: string[];

  // S07: Chronicle + Constraints
  headlineChoice: string;
  timeBudget: string;
  resourceLevel: string;
  competitiveAdvantage: string;

  // Results
  matchedIdeas: PipelineResult | null;
  houseId: string | null;
  crownedIdeaId: string | null;
  whyYouTexts: Record<string, string>;
  mirrorPoolText: string;

  // Navigation
  currentScreen: ScreenId;
  completedScreens: ScreenId[];
  screenHistory: ScreenId[];
}

export interface JourneyActions {
  // Identity
  setDisplayName: (name: string) => void;

  // Path
  setIdeaMode: (mode: IdeaMode) => void;
  setUserIdeaText: (text: string) => void;

  // S02: Inkblots
  recordBlotResponse: (index: number, emoji: string, timeMs: number) => void;

  // S03: Words
  recordWordResponse: (index: number, choice: string, timeMs: number) => void;

  // S04: Industries
  keepIndustry: (id: string) => void;
  passIndustry: (id: string) => void;
  edgeIndustry: (id: string) => void;
  recordIndustryDwell: (index: number, timeMs: number) => void;
  recordScrollDepth: (index: number, depth: number) => void;

  // S05: Scenarios
  recordScenarioResponse: (index: number, emoji: string, timeMs: number) => void;

  // S06: Crystal
  selectOrb: (orbName: string, selectionIndex: number, timeMs: number) => void;
  deselectOrb: (orbName: string) => void;

  // S07: Chronicle + Constraints
  setHeadlineChoice: (choice: string) => void;
  setTimeBudget: (budget: string) => void;
  setResourceLevel: (level: string) => void;
  setCompetitiveAdvantage: (text: string) => void;

  // Results
  setMatchedIdeas: (result: PipelineResult) => void;
  setHouseId: (id: string) => void;
  crownIdea: (ideaId: string) => void;
  setWhyYouText: (ideaId: string, text: string) => void;
  setMirrorPoolText: (text: string) => void;

  // Navigation
  advanceScreen: () => void;
  goToScreen: (screen: ScreenId) => void;
  goBack: () => void;

  // Session
  hydrateFromSaved: (data: Partial<JourneyState>) => void;
  resetJourney: () => void;
}

// ── Initial State ─────────────────────────────────────────────

function generateSessionId(): string {
  return crypto.randomUUID();
}

const initialState: JourneyState = {
  sessionId: '',
  displayName: '',
  ideaMode: null,
  userIdeaText: '',
  blotResponses: [],
  blotResponseTimes: [],
  wordResponses: [],
  wordResponseTimes: [],
  industriesKept: [],
  industriesPassed: [],
  industriesEdged: [],
  industryDwellTimes: [],
  scrollDepthPerCard: [],
  scenarioResponses: [],
  scenarioResponseTimes: [],
  crystalOrbs: [],
  crystalSelectionOrder: [],
  crystalSelectionTimes: [],
  unchosenOrbs: [],
  headlineChoice: '',
  timeBudget: '',
  resourceLevel: '',
  competitiveAdvantage: '',
  matchedIdeas: null,
  houseId: null,
  crownedIdeaId: null,
  whyYouTexts: {},
  mirrorPoolText: '',
  currentScreen: 's00',
  completedScreens: [],
  screenHistory: [],
};

// ── Store ─────────────────────────────────────────────────────

export const useJourneyStore = create<JourneyState & JourneyActions>()((set, get) => ({
  ...initialState,
  sessionId: typeof window !== 'undefined'
    ? localStorage.getItem('catalst_session_id') ?? ''
    : '',

  // ── Identity ──
  setDisplayName: (name) => {
    // Capitalize: first letter uppercase, rest lowercase. Handles "anish" -> "Anish".
    const trimmed = name.trim();
    const cap = trimmed.length > 0
      ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
      : trimmed;
    set({ displayName: cap });
  },

  // ── Path ──
  setIdeaMode: (mode) => set({ ideaMode: mode }),
  setUserIdeaText: (text) => set({ userIdeaText: text }),

  // ── S02 ──
  recordBlotResponse: (index, emoji, timeMs) => set((s) => {
    const responses = [...s.blotResponses];
    const times = [...s.blotResponseTimes];
    responses[index] = emoji;
    times[index] = timeMs;
    return { blotResponses: responses, blotResponseTimes: times };
  }),

  // ── S03 ──
  recordWordResponse: (index, choice, timeMs) => set((s) => {
    const responses = [...s.wordResponses];
    const times = [...s.wordResponseTimes];
    responses[index] = choice;
    times[index] = timeMs;
    return { wordResponses: responses, wordResponseTimes: times };
  }),

  // ── S04 ──
  keepIndustry: (id) => set((s) => ({
    industriesKept: [...s.industriesKept, id],
    industriesPassed: s.industriesPassed.filter((i) => i !== id),
  })),
  passIndustry: (id) => set((s) => ({
    industriesPassed: [...s.industriesPassed, id],
    industriesKept: s.industriesKept.filter((i) => i !== id),
    industriesEdged: s.industriesEdged.filter((i) => i !== id),
  })),
  edgeIndustry: (id) => set((s) => {
    if (s.industriesEdged.length >= 2) return s;
    return {
      industriesEdged: [...s.industriesEdged, id],
      industriesKept: s.industriesKept.filter((i) => i !== id),
      industriesPassed: s.industriesPassed.filter((i) => i !== id),
    };
  }),
  recordIndustryDwell: (index, timeMs) => set((s) => {
    const times = [...s.industryDwellTimes];
    times[index] = timeMs;
    return { industryDwellTimes: times };
  }),
  recordScrollDepth: (index, depth) => set((s) => {
    const depths = [...s.scrollDepthPerCard];
    depths[index] = depth;
    return { scrollDepthPerCard: depths };
  }),

  // ── S05 ──
  recordScenarioResponse: (index, emoji, timeMs) => set((s) => {
    const responses = [...s.scenarioResponses];
    const times = [...s.scenarioResponseTimes];
    responses[index] = emoji;
    times[index] = timeMs;
    return { scenarioResponses: responses, scenarioResponseTimes: times };
  }),

  // ── S06 ──
  selectOrb: (orbName, selectionIndex, timeMs) => set((s) => {
    const orbs = [...s.crystalOrbs, orbName];
    const order = [...s.crystalSelectionOrder, selectionIndex];
    const times = [...s.crystalSelectionTimes, timeMs];
    const unchosen = s.unchosenOrbs.filter((o) => o !== orbName);
    return {
      crystalOrbs: orbs,
      crystalSelectionOrder: order,
      crystalSelectionTimes: times,
      unchosenOrbs: unchosen,
    };
  }),
  deselectOrb: (orbName) => set((s) => {
    const idx = s.crystalOrbs.indexOf(orbName);
    if (idx === -1) return s;
    return {
      crystalOrbs: s.crystalOrbs.filter((_, i) => i !== idx),
      crystalSelectionOrder: s.crystalSelectionOrder.filter((_, i) => i !== idx),
      crystalSelectionTimes: s.crystalSelectionTimes.filter((_, i) => i !== idx),
      unchosenOrbs: [...s.unchosenOrbs, orbName],
    };
  }),

  // ── S07 ──
  setHeadlineChoice: (choice) => set({ headlineChoice: choice }),
  setTimeBudget: (budget) => set({ timeBudget: budget }),
  setResourceLevel: (level) => set({ resourceLevel: level }),
  setCompetitiveAdvantage: (text) => set({ competitiveAdvantage: text }),

  // ── Results ──
  setMatchedIdeas: (result) => set({ matchedIdeas: result }),
  setHouseId: (id) => set({ houseId: id }),
  crownIdea: (ideaId) => set({ crownedIdeaId: ideaId }),
  setWhyYouText: (ideaId, text) => set((s) => ({
    whyYouTexts: { ...s.whyYouTexts, [ideaId]: text },
  })),
  setMirrorPoolText: (text) => set({ mirrorPoolText: text }),

  // ── Navigation ──
  advanceScreen: () => {
    const s = get();
    const next = getNextScreen(s.currentScreen, s.ideaMode);
    if (!next) return;
    const completed = getCompletedScreens(next, s.ideaMode);
    set({
      currentScreen: next,
      completedScreens: completed,
      screenHistory: [...s.screenHistory, s.currentScreen],
    });

    // Non-blocking: sync to Supabase + fire analytics
    analytics.advance(s.currentScreen, next);
    analytics.screen(next);
    syncSession({ ...get() }).catch(() => {});
  },
  goToScreen: (screen) => set((s) => {
    const completed = getCompletedScreens(screen, s.ideaMode);
    return { currentScreen: screen, completedScreens: completed };
  }),
  goBack: () => {
    const s = get();
    const history = [...s.screenHistory];
    const prev = history.pop();
    if (!prev) return;
    set({ currentScreen: prev, screenHistory: history });
  },

  // ── Session ──
  hydrateFromSaved: (data) => set(data),
  resetJourney: () => {
    const newId = generateSessionId();
    if (typeof window !== 'undefined') {
      localStorage.setItem('catalst_session_id', newId);
    }
    set({ ...initialState, sessionId: newId });
  },
}));

// ── Dev mode store exposure ──────────────────────────────────

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).__catalstStore = useJourneyStore;
}

// ── Session ID Initialization ─────────────────────────────────

if (typeof window !== 'undefined') {
  const store = useJourneyStore.getState();
  if (!store.sessionId) {
    const existing = localStorage.getItem('catalst_session_id');
    if (existing) {
      useJourneyStore.setState({ sessionId: existing });
    } else {
      const newId = generateSessionId();
      localStorage.setItem('catalst_session_id', newId);
      useJourneyStore.setState({ sessionId: newId });
    }
  }
}
