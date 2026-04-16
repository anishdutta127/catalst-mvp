'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { createTimer } from '@/lib/timing';

const ORBS = lines.s06.orbs;

/**
 * S06 — Crystal Seed (enriched)
 *
 * 2 rows of 4 orbs. Central crystal formation grows with each selection.
 * Each orb has distinct radial gradient per trait.
 * Crystal shape: CSS polygon that gains facets per selection.
 */

const ORB_GRADIENTS: Record<string, string> = {
  Grit: 'radial-gradient(circle at 40% 35%, #F59E0B60, #F59E0B15)',
  Vision: 'radial-gradient(circle at 40% 35%, #F0D06060, #F0D06015)',
  Craft: 'radial-gradient(circle at 40% 35%, #CD7F3260, #CD7F3215)',
  Influence: 'radial-gradient(circle at 40% 35%, #9B59B660, #9B59B615)',
  Empathy: 'radial-gradient(circle at 40% 35%, #00D8B960, #00D8B915)',
  Analysis: 'radial-gradient(circle at 40% 35%, #5DADE260, #5DADE215)',
  Freedom: 'radial-gradient(circle at 40% 35%, #BDC3C760, #BDC3C715)',
  Stability: 'radial-gradient(circle at 40% 35%, #27AE6060, #27AE6015)',
};

// Crystal polygon grows with selections
const CRYSTAL_SHAPES = [
  '', // 0 selected
  'polygon(50% 20%, 75% 70%, 25% 70%)', // 1: triangle
  'polygon(50% 10%, 80% 45%, 65% 85%, 35% 85%, 20% 45%)', // 2: pentagon
  'polygon(50% 5%, 85% 30%, 80% 75%, 50% 95%, 20% 75%, 15% 30%)', // 3: hexagonal crystal
];

export function S06Crystal() {
  const crystalOrbs = useJourneyStore((s) => s.crystalOrbs);
  const selectOrb = useJourneyStore((s) => s.selectOrb);
  const deselectOrb = useJourneyStore((s) => s.deselectOrb);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const displayName = useJourneyStore((s) => s.displayName);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);
  const dialogueSent = useRef(false);
  const timer = useRef(createTimer());

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    timer.current.start();
    enqueueMessage({ speaker: 'cedric', text: lines.s06.cedric.intro, type: 'instruction' });
  }, [enqueueMessage]);

  function handleOrbTap(orbId: string, orbIdx: number) {
    if (crystalOrbs.includes(orbId)) {
      deselectOrb(orbId);
    } else if (crystalOrbs.length < 3) {
      selectOrb(orbId, orbIdx, timer.current.peek());
    }
  }

  function handleConfirm() {
    if (crystalOrbs.length !== 3) return;
    const chosen = new Set(crystalOrbs);
    useJourneyStore.setState({
      unchosenOrbs: ORBS.filter((o) => !chosen.has(o.id)).map((o) => o.id),
    });
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s06.cedric.afterSelection(displayName || 'Traveler'),
      type: 'dialogue',
    });
    setTimeout(() => advanceScreen(), 600);
  }

  const crystalShape = CRYSTAL_SHAPES[Math.min(crystalOrbs.length, 3)];

  return (
    <div className="flex flex-col items-center justify-center gap-6 h-full relative">
      {/* Crystal formation — background visual */}
      <AnimatePresence>
        {crystalOrbs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className="w-32 h-32 transition-all duration-700"
              style={{
                clipPath: crystalShape,
                background: `linear-gradient(135deg, ${
                  crystalOrbs.map((id) => {
                    const orb = ORBS.find((o) => o.id === id);
                    return orb?.colour || '#D4A843';
                  }).join(', ')
                })`,
                boxShadow: `0 0 40px ${ORBS.find((o) => o.id === crystalOrbs[0])?.colour || '#D4A843'}40`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[10px] font-mono text-ivory/40 uppercase tracking-widest z-10">
        {crystalOrbs.length} of 3 chosen
      </p>

      {/* Orb grid: 2 rows of 4 */}
      <div className="grid grid-cols-4 gap-4 z-10">
        {ORBS.map((orb, i) => {
          const isSelected = crystalOrbs.includes(orb.id);
          const isFaded = crystalOrbs.length >= 3 && !isSelected;
          return (
            <motion.button
              key={orb.id}
              onClick={() => handleOrbTap(orb.id, i)}
              data-testid={`orb-${orb.id}`}
              animate={{
                scale: isSelected ? 1.1 : isFaded ? 0.9 : 1,
                opacity: isFaded ? 0.4 : 1,
              }}
              whileTap={!isFaded ? { scale: 0.95 } : undefined}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div
                className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl transition-all ${
                  isSelected ? 'ring-2 shadow-[0_0_16px_var(--glow)]' : 'ring-1 ring-white/20'
                }`}
                style={{
                  background: ORB_GRADIENTS[orb.id],
                  ['--glow' as string]: `${orb.colour}60`,
                } as React.CSSProperties}
              >
                {orb.icon}
              </div>
              <span className={`text-[10px] font-medium ${isSelected ? 'text-gold' : 'text-ivory/50'}`}>
                {orb.id}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected pills */}
      {crystalOrbs.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center z-10">
          {crystalOrbs.map((id) => {
            const orb = ORBS.find((o) => o.id === id);
            return (
              <span key={id} className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold/80 border border-gold/20">
                {orb?.icon} {id}
              </span>
            );
          })}
        </div>
      )}

      {/* Confirm */}
      {crystalOrbs.length === 3 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleConfirm}
          data-testid="confirm-crystal"
          className="px-6 py-2.5 rounded-full bg-gold text-dark font-semibold text-sm hover:bg-gold/90 transition-all z-10"
        >
          Confirm Crystal
        </motion.button>
      )}
    </div>
  );
}
