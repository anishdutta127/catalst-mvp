'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
import type { ScenarioSource } from '@/lib/scoring/types';
import { ScreenQuote } from '@/components/ui/ScreenQuote';

/**
 * S07 — Verdania Chronicle + Constraints (enriched)
 *
 * Inshorts-style headline cards with swipe dots, metadata pills,
 * founder quote. Constraints: time/budget/competitive advantage.
 */
export function S07Chronicle() {
  const state = useJourneyStore();
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [phase, setPhase] = useState<'headlines' | 'constraints'>(
    state.ideaMode === 'shortcut' ? 'constraints' : 'headlines'
  );
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedAdvantage, setSelectedAdvantage] = useState('');
  const dialogueSent = useRef(false);
  const displayName = state.displayName || 'Traveler';

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({
      speaker: phase === 'headlines' ? 'cedric' : 'cedric',
      text: phase === 'headlines' ? lines.s07.cedric.headlineIntro : lines.s07.cedric.constraintsIntro,
      type: 'instruction',
    });
    if (phase === 'headlines') {
      setTimeout(() => {
        enqueueMessage({ speaker: 'pip', text: lines.s07.pip.headlineIntro, type: 'dialogue' });
      }, 2000);
    }
  }, [enqueueMessage, phase]);

  function handleHeadlineSelect() {
    const hl = lines.s07.headlines[headlineIdx];
    state.setHeadlineChoice(hl.id);
    setTimeout(() => {
      setPhase('constraints');
      // Clear stale "Fast-forward ten years..." message before showing constraints intro.
      useUIStore.getState().clearAllMessages();
      enqueueMessage({ speaker: 'cedric', text: lines.s07.cedric.constraintsIntro, type: 'instruction' });
    }, 400);
  }

  function handleComplete() {
    if (!selectedTime || !selectedResource) return;
    state.setTimeBudget(selectedTime);
    state.setResourceLevel(selectedResource);
    if (selectedAdvantage) state.setCompetitiveAdvantage(selectedAdvantage);

    enqueueMessage({ speaker: 'cedric', text: lines.s07.cedric.afterAll, type: 'dialogue' });

    // Fire finalRun async
    setTimeout(() => {
      try {
        const profile = buildForgeProfile({ ...state, timeBudget: selectedTime, resourceLevel: selectedResource, competitiveAdvantage: selectedAdvantage } as unknown as import('@/lib/store/journeyStore').JourneyState);
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
  const currentHl = lines.s07.headlines[headlineIdx];
  const ADVANTAGES = ['Technical skill', 'Industry network', 'Distribution', 'Brand/Content', 'Capital'];

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pb-2">
      <AnimatePresence mode="wait">
        {phase === 'headlines' && (
          <motion.div
            key="headlines"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {/* Inshorts-style card */}
            <div className="bg-dark-surface border border-white/10 rounded-xl overflow-hidden">
              {/* Gold gradient header */}
              <div className="h-24 bg-gradient-to-b from-gold/20 to-transparent" />

              <div className="p-4 space-y-3">
                <h3 className="text-lg font-serif font-bold text-ivory leading-snug">
                  {currentHl.headline(displayName)}
                </h3>

                {/* Stats pills */}
                <p className="text-[11px] text-gold/70">
                  {currentHl.stats}
                </p>

                <p className="text-sm text-ivory/60 leading-relaxed">
                  {currentHl.story}
                </p>

                {/* Quote */}
                <div className="border-l-2 border-gold/40 pl-3">
                  <p className="text-[13px] text-ivory/50 italic">
                    {currentHl.quote(displayName)}
                  </p>
                </div>
              </div>
            </div>

            {/* Dot navigation */}
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setHeadlineIdx(Math.max(0, headlineIdx - 1))} className="text-ivory/30 text-lg">‹</button>
              <div className="flex gap-1.5">
                {lines.s07.headlines.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeadlineIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === headlineIdx ? 'bg-gold' : 'bg-white/20'}`}
                  />
                ))}
              </div>
              <button onClick={() => setHeadlineIdx(Math.min(3, headlineIdx + 1))} className="text-ivory/30 text-lg">›</button>
            </div>

            {/* CTA */}
            <button
              onClick={handleHeadlineSelect}
              data-testid={`headline-card-${headlineIdx}`}
              className="w-full py-3 rounded-full bg-gold text-dark font-semibold text-sm hover:bg-gold/90 transition-all"
            >
              This Is My Future ⭐
            </button>
          </motion.div>
        )}

        {phase === 'constraints' && (
          <motion.div
            key="constraints"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5"
          >
            {/* Time */}
            <div>
              <p className="text-xs text-ivory/40 uppercase tracking-wider mb-2">⏱ Time to launch</p>
              <div className="flex flex-wrap gap-2">
                {lines.s07.timeBudgets.map((b) => (
                  <button key={b} onClick={() => setSelectedTime(b)} data-testid={`time-${b}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedTime === b ? 'bg-gold text-dark' : 'bg-white/5 text-ivory/50 hover:text-ivory/70'
                    }`}>{b}</button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <p className="text-xs text-ivory/40 uppercase tracking-wider mb-2">💰 Budget range</p>
              <div className="flex flex-wrap gap-2">
                {lines.s07.resourceLevels.map((l) => (
                  <button key={l} onClick={() => setSelectedResource(l)} data-testid={`resource-${l}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedResource === l ? 'bg-gold text-dark' : 'bg-white/5 text-ivory/50 hover:text-ivory/70'
                    }`}>{l}</button>
                ))}
              </div>
            </div>

            {/* Competitive advantage */}
            <div>
              <p className="text-xs text-ivory/40 uppercase tracking-wider mb-2">⚔️ Your edge</p>
              <div className="flex flex-wrap gap-2">
                {ADVANTAGES.map((a) => (
                  <button key={a} onClick={() => setSelectedAdvantage(a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedAdvantage === a ? 'bg-gold text-dark' : 'bg-white/5 text-ivory/50 hover:text-ivory/70'
                    }`}>{a}</button>
                ))}
              </div>
            </div>

            <ScreenQuote screen="s07" />

            {/* CTA */}
            <AnimatePresence>
              {canComplete && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleComplete}
                  data-testid="reveal-btn"
                  className="w-full py-3 rounded-full bg-gold text-dark font-semibold text-sm hover:bg-gold/90 transition-all"
                >
                  Generate my 3 ideas →
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
