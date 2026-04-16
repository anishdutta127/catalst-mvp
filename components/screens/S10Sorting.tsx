'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import housesRaw from '@/content/houses.json';
import { ScreenQuote } from '@/components/ui/ScreenQuote';

interface LineageFigure { name: string; sharedTraitLine: string; quantified_impact?: string }
interface House {
  id: string; name: string; hex: string; tagline: string;
  description: string; strengths: string[]; lineage: LineageFigure[];
}

const HOUSES = housesRaw as unknown as House[];
type Phase = 'crests' | 'eliminating' | 'winner' | 'lineage' | 'complete';

/**
 * S10 — Sorting Ceremony (enriched)
 *
 * Full screen takeover. 4 crests → crack + fade → winner floods screen.
 * Lineage slides in. Cedric: "Welcome home." (no joke — let it land)
 */
export function S10Sorting() {
  const houseId = useJourneyStore((s) => s.houseId);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [phase, setPhase] = useState<Phase>('crests');
  const [lineageIdx, setLineageIdx] = useState(-1);
  const dialogueSent = useRef(false);

  const winningHouse = HOUSES.find((h) => h.id === houseId) || HOUSES[0];

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;

    enqueueMessage({ speaker: 'cedric', text: lines.s10.cedric.intro2, type: 'instruction' });
    // Slower dissolution: 800ms per crest, 600ms stagger
    setTimeout(() => setPhase('eliminating'), 2000);
    setTimeout(() => {
      setPhase('winner');
      enqueueMessage({ speaker: 'cedric', text: lines.s10.cedric.claim, type: 'dialogue' });
    }, 4500); // after ~2.5s of elimination
    setTimeout(() => {
      setPhase('lineage');
      enqueueMessage({ speaker: 'cedric', text: lines.s10.cedric.lineageIntro, type: 'dialogue' });
      for (let i = 0; i < winningHouse.lineage.length; i++) {
        setTimeout(() => setLineageIdx(i), i * 600);
      }
    }, 7000);
    // After all lineage + 2s pause: auto-advance (no CTA button)
    const lineageDuration = winningHouse.lineage.length * 600;
    setTimeout(() => {
      setPhase('complete');
      enqueueMessage({ speaker: 'pip', text: lines.s10.pip.claim, type: 'dialogue' });
    }, 7000 + lineageDuration + 1000);
    setTimeout(() => {
      advanceScreen(); // Auto-advance after "Welcome home" lands
    }, 7000 + lineageDuration + 3000);
  }, [enqueueMessage, winningHouse, advanceScreen]);

  return (
    <div className="flex flex-col items-center gap-4 h-full overflow-y-auto pb-4 relative">
      {/* House color flood (background) */}
      <AnimatePresence>
        {(phase === 'winner' || phase === 'lineage' || phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 40%, ${winningHouse.hex}40, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* 2x2 crest grid */}
      <div className="grid grid-cols-2 gap-6 pt-4 z-10">
        {HOUSES.map((house) => {
          const isWinner = house.id === winningHouse.id;
          const isEliminated = !isWinner && phase !== 'crests';
          const isRevealed = isWinner && (phase === 'winner' || phase === 'lineage' || phase === 'complete');

          return (
            <motion.div
              key={house.id}
              data-testid={isRevealed ? 'house-winner' : `house-crest-${house.id}`}
              animate={{
                opacity: isEliminated ? 0 : 1,
                scale: isRevealed ? 1.8 : isEliminated ? 0.7 : 1,
              }}
              transition={{
                duration: 0.8,
                delay: isEliminated ? HOUSES.filter((h) => h.id !== winningHouse.id).indexOf(house) * 0.6 : 0,
                type: isRevealed ? 'spring' : 'tween',
                stiffness: 180,
              }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-serif font-bold border-2 transition-all ${
                  isRevealed ? 'shadow-[0_0_30px_var(--glow)]' : ''
                }`}
                style={{
                  borderColor: house.hex,
                  background: `radial-gradient(circle at 40% 35%, ${house.hex}40, ${house.hex}10)`,
                  color: house.hex,
                  ['--glow' as string]: `${house.hex}60`,
                } as React.CSSProperties}
              >
                {house.name.charAt(house.name.lastIndexOf(' ') + 1)}
              </div>
              <p className="text-[10px] font-mono text-ivory/40 uppercase tracking-wider">
                {house.name.replace('House of ', '')}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Winner details */}
      <AnimatePresence>
        {(phase === 'winner' || phase === 'lineage' || phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-center z-10"
          >
            <h2 className="text-4xl sm:text-5xl font-serif font-bold" style={{ color: winningHouse.hex }}>
              {winningHouse.name}
            </h2>
            <p className="text-sm text-ivory/50 mt-1 italic">{winningHouse.tagline}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lineage */}
      <AnimatePresence>
        {(phase === 'lineage' || phase === 'complete') && (
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm space-y-2 z-10">
            {winningHouse.lineage.map((fig, i) => (
              <AnimatePresence key={fig.name}>
                {i <= lineageIdx && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    data-testid={`lineage-${fig.name}`}
                    className="bg-dark-surface border border-white/10 rounded-lg p-3"
                  >
                    <p className="text-sm font-semibold text-ivory">{fig.name}</p>
                    {fig.quantified_impact && <p className="text-gold/70 text-[11px] mt-0.5">{fig.quantified_impact}</p>}
                    <p className="text-[10px] text-ivory/30 mt-0.5 uppercase tracking-wider">{fig.sharedTraitLine}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ScreenQuote screen="s10" />

      {/* No CTA button — S10 auto-advances after ceremony completes */}
    </div>
  );
}
