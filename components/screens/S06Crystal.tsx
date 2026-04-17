'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { createTimer } from '@/lib/timing';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { CrystalViewport } from '@/components/ui/CrystalViewport';

const ORBS = lines.s06.orbs;

/**
 * S06 — Crystal Seed (Constellation rebuild).
 *
 * Layout (top to bottom, no overlap):
 *   1. Crystal Viewport (60% height) — orbital ring + crystal forming in center
 *   2. Counter ("2 of 3 chosen")
 *   3. Orb dock (horizontal-ish grid, all 8 selectable)
 *   4. Selected orb pills
 *   5. Forge Crystal CTA (appears when 3 selected)
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

  const count = crystalOrbs.length;
  const canConfirm = count === 3;

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* ── Crystal Viewport (upper stage) ── */}
      <div className="flex-1 flex items-center justify-center min-h-[280px]">
        <CrystalViewport allOrbs={ORBS} selectedOrbIds={crystalOrbs} size={340} />
      </div>

      {/* Counter */}
      <div className="shrink-0 text-center py-2">
        <p className="text-[11px] font-mono uppercase tracking-[0.3em]" style={{ color: count === 3 ? '#D4A843' : 'rgba(245,240,232,0.4)' }}>
          {count} of 3 chosen
        </p>
      </div>

      {/* ── Orb dock (below viewport) ── */}
      <div className="shrink-0 pb-3">
        <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
          {ORBS.map((orb, i) => {
            const isSelected = crystalOrbs.includes(orb.id);
            const isFull = crystalOrbs.length >= 3 && !isSelected;
            return (
              <motion.button
                key={orb.id}
                onClick={() => handleOrbTap(orb.id, i)}
                data-testid={`orb-${orb.id}`}
                disabled={isFull}
                animate={{
                  opacity: isFull ? 0.3 : 1,
                }}
                whileTap={!isFull ? { scale: 0.92 } : undefined}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className={`relative rounded-xl p-2 flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-white/8 border-2 shadow-[0_0_14px_rgba(212,168,67,0.35)]'
                    : 'bg-white/3 border border-white/10 hover:border-white/20 hover:bg-white/5 cursor-pointer'
                }`}
                style={isSelected ? { borderColor: `${orb.colour}` } : undefined}
              >
                {/* Orb glyph */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{
                    background: `radial-gradient(circle at 38% 30%, ${orb.colour}90, ${orb.colour}30)`,
                    boxShadow: isSelected ? `0 0 12px ${orb.colour}80` : undefined,
                  }}
                >
                  {orb.icon}
                </div>
                <span className={`text-[10px] font-medium ${isSelected ? 'text-gold' : 'text-ivory/55'}`}>
                  {orb.id}
                </span>
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: orb.colour, color: '#0C0E12' }}
                  >
                    {crystalOrbs.indexOf(orb.id) + 1}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Confirm CTA */}
      <AnimatePresence>
        {canConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="shrink-0 pt-2 pb-2"
          >
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(212,168,67,0.55)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              data-testid="confirm-crystal"
              className="w-full h-13 py-3 rounded-2xl bg-gold text-dark font-bold text-[15px] shadow-[0_0_18px_rgba(212,168,67,0.4)] transition-all flex items-center justify-center gap-2"
            >
              Forge Your Crystal →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <ScreenQuote screen="s06" />
    </div>
  );
}
