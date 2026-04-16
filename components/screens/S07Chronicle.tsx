'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import type { ForgeProfile, ScenarioSource } from '@/lib/scoring/types';

/**
 * S07 — Verdania Chronicle + Constraints
 *
 * Path A/B: 3 headline cards (tap to select one), then constraint pills.
 * Path C: skip headlines, show constraints only.
 * After constraints: trigger orchestrator.finalRun() async.
 */
export function S07Chronicle() {
  const state = useJourneyStore();
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [phase, setPhase] = useState<'headlines' | 'constraints'>(
    state.ideaMode === 'shortcut' ? 'constraints' : 'headlines'
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const dialogueSent = useRef(false);

  const displayName = state.displayName || 'Traveler';

  // Cedric intro
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    if (phase === 'headlines') {
      enqueueMessage({
        speaker: 'cedric',
        text: lines.s07.cedric.headlineIntro,
        type: 'dialogue',
      });
    } else {
      enqueueMessage({
        speaker: 'cedric',
        text: lines.s07.cedric.constraintsIntro,
        type: 'dialogue',
      });
    }
  }, [enqueueMessage, phase]);

  function handleHeadlineSelect(id: string) {
    state.setHeadlineChoice(id);
    setTimeout(() => {
      setPhase('constraints');
      enqueueMessage({
        speaker: 'cedric',
        text: lines.s07.cedric.constraintsIntro,
        type: 'dialogue',
      });
    }, 400);
  }

  function handleTimeBudget(budget: string) {
    setSelectedTime(budget);
    state.setTimeBudget(budget);
  }

  function handleResourceLevel(level: string) {
    setSelectedResource(level);
    state.setResourceLevel(level);
  }

  function handleComplete() {
    if (!selectedTime || !selectedResource) return;

    enqueueMessage({
      speaker: 'cedric',
      text: lines.s07.cedric.afterAll,
      type: 'dialogue',
    });

    // Trigger finalRun async — don't await, S08 Forge handles the wait
    const profile: ForgeProfile = {
      display_name: state.displayName,
      idea_mode: state.ideaMode === 'shortcut' ? 'shortcut' : state.ideaMode === 'directed' ? 'directed' : 'open',
      user_idea_text: state.userIdeaText,
      blot_responses: (state.blotResponses.length >= 3
        ? state.blotResponses.slice(0, 3)
        : [...state.blotResponses, '', '', ''].slice(0, 3)) as [string, string, string],
      blot_response_times: (state.blotResponseTimes.length >= 3
        ? state.blotResponseTimes.slice(0, 3)
        : [...state.blotResponseTimes, 0, 0, 0].slice(0, 3)) as [number, number, number],
      word_responses: (state.wordResponses.length >= 4
        ? state.wordResponses.slice(0, 4)
        : [...state.wordResponses, '', '', '', ''].slice(0, 4)) as [string, string, string, string],
      word_response_times: (state.wordResponseTimes.length >= 4
        ? state.wordResponseTimes.slice(0, 4)
        : [...state.wordResponseTimes, 0, 0, 0, 0].slice(0, 4)) as [number, number, number, number],
      industries_kept: state.industriesKept,
      industries_passed: state.industriesPassed,
      industries_edged: state.industriesEdged,
      industry_dwell_times: state.industryDwellTimes,
      scroll_depth_per_card: state.scrollDepthPerCard,
      scenarioSource: (state.ideaMode === 'shortcut' ? 'parsed' : 'none') as ScenarioSource,
      crystal_orbs: (state.crystalOrbs.length >= 3
        ? state.crystalOrbs.slice(0, 3)
        : [...state.crystalOrbs, '', '', ''].slice(0, 3)) as [string, string, string],
      crystal_selection_order: (state.crystalSelectionOrder.length >= 3
        ? state.crystalSelectionOrder.slice(0, 3)
        : [...state.crystalSelectionOrder, 0, 0, 0].slice(0, 3)) as [number, number, number],
      crystal_selection_times: (state.crystalSelectionTimes.length >= 3
        ? state.crystalSelectionTimes.slice(0, 3)
        : [...state.crystalSelectionTimes, 0, 0, 0].slice(0, 3)) as [number, number, number],
      unchosen_orbs: state.unchosenOrbs,
      headline_choice: state.headlineChoice,
      time_budget: selectedTime,
      resource_level: selectedResource,
      competitive_advantage: state.competitiveAdvantage,
    };

    // Fire async — store results when done
    setTimeout(() => {
      try {
        const result = finalRun(profile);
        state.setMatchedIdeas(result.pipeline);
        state.setHouseId(result.house);
      } catch (err) {
        console.error('[S07] finalRun failed:', err);
      }
    }, 0);

    setTimeout(() => state.advanceScreen(), 600);
  }

  const canComplete = !!selectedTime && !!selectedResource;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto">
      {/* Headlines phase */}
      <AnimatePresence mode="wait">
        {phase === 'headlines' && (
          <motion.div
            key="headlines"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            {lines.s07.headlines.map((hl) => (
              <motion.button
                key={hl.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleHeadlineSelect(hl.id)}
                className={`w-full bg-dark-surface border border-white/10 rounded-lg p-4 text-left hover:border-gold/30 transition-colors ${
                  state.headlineChoice === hl.id ? 'border-gold/50' : ''
                }`}
              >
                <p className="text-sm font-semibold text-ivory leading-snug">
                  {hl.headline(displayName)}
                </p>
                <p className="text-xs text-ivory/40 mt-1">
                  {hl.story.replace(/\s*\\\s*\.\s*/g, ' ')}
                </p>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Constraints phase */}
        {phase === 'constraints' && (
          <motion.div
            key="constraints"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Time budget */}
            <div>
              <p className="text-xs text-ivory/40 uppercase tracking-wider mb-2">
                Weekly time commitment
              </p>
              <div className="flex flex-wrap gap-2">
                {lines.s07.timeBudgets.map((budget) => (
                  <button
                    key={budget}
                    onClick={() => handleTimeBudget(budget)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedTime === budget
                        ? 'bg-gold/20 text-gold border border-gold/40'
                        : 'bg-dark-surface border border-white/10 text-ivory/50 hover:border-white/20'
                    }`}
                  >
                    {budget}
                  </button>
                ))}
              </div>
            </div>

            {/* Resource level */}
            <div>
              <p className="text-xs text-ivory/40 uppercase tracking-wider mb-2">
                Budget range
              </p>
              <div className="flex flex-wrap gap-2">
                {lines.s07.resourceLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => handleResourceLevel(level)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedResource === level
                        ? 'bg-gold/20 text-gold border border-gold/40'
                        : 'bg-dark-surface border border-white/10 text-ivory/50 hover:border-white/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete CTA */}
            <AnimatePresence>
              {canComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center pt-2"
                >
                  <button
                    onClick={handleComplete}
                    className="px-6 py-2.5 rounded-full bg-gold text-dark font-semibold text-sm hover:bg-gold/90 transition-all"
                  >
                    Reveal My Ideas
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
