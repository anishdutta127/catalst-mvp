'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { createTimer } from '@/lib/timing';

const ORBS = lines.s06.orbs;

/**
 * S06 — Crystal Seed
 *
 * 8 orbs in circular CSS layout. Select 3, deselect by re-tapping.
 * No timer — deliberate choice. Advance when exactly 3 selected.
 */
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
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s06.cedric.intro,
      type: 'dialogue',
    });
  }, [enqueueMessage]);

  function handleOrbTap(orbId: string, orbIdx: number) {
    if (crystalOrbs.includes(orbId)) {
      deselectOrb(orbId);
    } else if (crystalOrbs.length < 3) {
      const elapsed = timer.current.peek();
      selectOrb(orbId, orbIdx, elapsed);
    }
  }

  function handleConfirm() {
    if (crystalOrbs.length !== 3) return;
    // Store unchosen orbs
    const chosen = new Set(crystalOrbs);
    const unchosen = ORBS.filter((o) => !chosen.has(o.id)).map((o) => o.id);
    // Manually set unchosen since store doesn't track automatically on confirm
    useJourneyStore.setState({ unchosenOrbs: unchosen });

    enqueueMessage({
      speaker: 'cedric',
      text: lines.s06.cedric.afterSelection(displayName || 'Traveler'),
      type: 'dialogue',
    });
    setTimeout(() => advanceScreen(), 600);
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 h-full">
      {/* Counter */}
      <p className="text-xs font-mono text-ivory/30 uppercase tracking-widest">
        {crystalOrbs.length} / 3 selected
      </p>

      {/* Circular orb layout */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
        {ORBS.map((orb, i) => {
          const isSelected = crystalOrbs.includes(orb.id);
          const angle = (i / ORBS.length) * 360 - 90; // start from top
          const rad = (angle * Math.PI) / 180;
          const radius = 42; // % from center
          const x = 50 + radius * Math.cos(rad);
          const y = 50 + radius * Math.sin(rad);

          return (
            <motion.button
              key={orb.id}
              onClick={() => handleOrbTap(orb.id, i)}
              animate={{
                scale: isSelected ? 1.1 : crystalOrbs.length >= 3 && !isSelected ? 0.95 : 1,
                opacity: crystalOrbs.length >= 3 && !isSelected ? 0.4 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {/* Orb */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl transition-all ${
                  isSelected
                    ? 'shadow-[0_0_12px_rgba(212,168,67,0.5)] border-2 border-gold/60'
                    : 'border border-white/20'
                }`}
                style={{
                  background: isSelected
                    ? `radial-gradient(circle at 30% 30%, ${orb.colour}40, ${orb.colour}15)`
                    : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
                }}
              >
                {orb.icon}
              </div>
              {/* Label */}
              <span className={`text-[10px] font-medium transition-colors ${
                isSelected ? 'text-gold' : 'text-ivory/50'
              }`}>
                {orb.id}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected orb details */}
      {crystalOrbs.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center max-w-xs">
          {crystalOrbs.map((id) => {
            const orb = ORBS.find((o) => o.id === id);
            if (!orb) return null;
            return (
              <span key={id} className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold/80 border border-gold/20">
                {orb.icon} {orb.id}
              </span>
            );
          })}
        </div>
      )}

      {/* Confirm CTA */}
      {crystalOrbs.length === 3 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleConfirm}
          className="px-6 py-2.5 rounded-full bg-gold text-dark font-semibold text-sm hover:bg-gold/90 transition-all"
        >
          Confirm Crystal
        </motion.button>
      )}
    </div>
  );
}
