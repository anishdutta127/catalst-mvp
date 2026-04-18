'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { createTimer } from '@/lib/timing';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { CrystalViewport } from '@/components/ui/CrystalViewport';
import type { OrbDef } from '@/components/ui/CrystalViewport';
import { useAmbientPipLine } from '@/lib/ambient-pip';

const ORBS = lines.s06.orbs as unknown as OrbDef[];
const SLOT_LABELS = ['Dominant', 'Supporting', 'Balancing'] as const;

/**
 * S06 — Crystal Seed (Constellation + selection ceremony).
 *
 * This is the weightiest moment of the journey so far: the first CHOICE after
 * a stretch of instinct. The layout reflects that — a single interaction
 * surface (the ring) with no competing grid, a 3-slot trail that shows what
 * the crystal is becoming, and a confirm beat that feels like a ritual.
 *
 * Layout (top → bottom):
 *   1. Crystal viewport  (flex-1) — 8 orbs on a ring, tap to select
 *   2. 3-slot selection trail — Dominant / Supporting / Balancing
 *   3. Counter ("X of 3 chosen")
 *   4. Forge Crystal CTA — appears when 3 selected, gold-pulses
 *   5. Screen quote (bottom)
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

  // Celebration state — on confirm, orbs + crystal play a finale beat before
  // advancing to the next screen.
  const [celebrating, setCelebrating] = useState(false);

  useAmbientPipLine('s06');

  // Intro dialogue — Cedric first (gravitas), Pip later (quieter than usual).
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    timer.current.start();
    enqueueMessage({ speaker: 'cedric', text: lines.s06.cedric.intro, type: 'instruction' });
    const t = setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s06.pip.intro, type: 'dialogue' });
    }, 3200);
    return () => clearTimeout(t);
  }, [enqueueMessage]);

  function handleOrbTap(orbId: string, orbIdx: number) {
    if (celebrating) return;
    if (crystalOrbs.includes(orbId)) {
      deselectOrb(orbId);
    } else if (crystalOrbs.length < 3) {
      selectOrb(orbId, orbIdx, timer.current.peek());
    }
  }

  function handleConfirm() {
    if (crystalOrbs.length !== 3 || celebrating) return;
    setCelebrating(true);
    const chosen = new Set(crystalOrbs);
    useJourneyStore.setState({
      unchosenOrbs: ORBS.filter((o) => !chosen.has(o.id)).map((o) => o.id),
    });
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s06.cedric.afterSelection(displayName || 'Traveler'),
      type: 'dialogue',
    });
    // Let the celebration burst play before advancing.
    setTimeout(() => advanceScreen(), 1900);
  }

  const count = crystalOrbs.length;
  const canConfirm = count === 3 && !celebrating;

  const selectedOrbDetails = crystalOrbs
    .map((id) => ORBS.find((o) => o.id === id))
    .filter((o): o is OrbDef => Boolean(o));

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Instruction pill — sits ABOVE the viewport so it never collides
          with the central halo orb. Fades out once the user taps their
          first essence (the forming crystal is its own signal from then). */}
      <div className="shrink-0 flex justify-center pt-3 pb-1 min-h-[24px]">
        <motion.p
          className="text-xs tracking-[0.25em] text-white/60 font-serif italic text-center"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
          animate={{ opacity: count === 0 ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap an essence to begin
        </motion.p>
      </div>

      {/* Crystal viewport — the hero */}
      <div className="flex-1 flex items-center justify-center min-h-[320px]">
        <CrystalViewport
          allOrbs={ORBS}
          selectedOrbIds={crystalOrbs}
          size={340}
          onOrbTap={handleOrbTap}
          disabled={celebrating}
          celebrating={celebrating}
        />
      </div>

      {/* Selection trail — three slots, fill left→right in selection order.
          Solid dark backdrop + blur so the text stays readable against the
          busy cave-art background; colored top-border strip signals which
          orb owns the slot. */}
      <div className="shrink-0 px-3 pb-1">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((slotIdx) => {
            const orb = selectedOrbDetails[slotIdx];
            const accent = orb?.colour ?? 'rgba(255,255,255,0.12)';
            return (
              <motion.div
                key={slotIdx}
                className="rounded-xl border px-2.5 py-2.5 min-h-[74px] flex flex-col relative overflow-hidden"
                animate={{
                  borderColor: orb ? `${orb.colour}66` : 'rgba(255,255,255,0.12)',
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: 'rgba(12, 14, 18, 0.82)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                {/* Colored top strip — accents the orb's color */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  animate={{ background: accent, opacity: orb ? 1 : 0.3 }}
                  transition={{ duration: 0.4 }}
                />

                {/* Slot label — brighter than before (ivory/70) so the
                    Dominant/Supporting/Balancing hierarchy reads clearly */}
                <p className="text-[9px] font-mono uppercase tracking-widest text-ivory/70 leading-tight">
                  {SLOT_LABELS[slotIdx]}
                </p>

                <AnimatePresence mode="wait">
                  {orb ? (
                    <motion.div
                      key={`filled-${orb.id}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[15px] leading-none">{orb.icon}</span>
                        <p
                          className="text-[14px] font-bold leading-none"
                          style={{ color: orb.colour }}
                        >
                          {orb.id}
                        </p>
                      </div>
                      <p className="text-[11px] text-ivory/75 leading-snug mt-1 line-clamp-2">
                        {orb.label}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[11px] text-ivory/35 italic mt-2"
                    >
                      empty slot
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* One-shot glow on slot-fill */}
                <AnimatePresence>
                  {orb && (
                    <motion.div
                      key="pulse"
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      initial={{ boxShadow: `0 0 0 0 ${orb.colour}99` }}
                      animate={{ boxShadow: `0 0 14px 2px ${orb.colour}00` }}
                      transition={{ duration: 0.7 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Counter — key'd on count so it re-mounts on every pick, giving each
          increment a subtle slide-in beat instead of just color-shifting. */}
      <div className="shrink-0 text-center py-1.5 h-5 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={count}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="text-[10px] font-mono uppercase tracking-[0.28em]"
            style={{ color: count === 3 ? '#D4A843' : 'rgba(245,240,232,0.4)' }}
          >
            {count} of 3 chosen
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Confirm CTA — appears with a breathing gold pulse when ready */}
      <div className="shrink-0 px-3 pb-2 h-[58px]">
        <AnimatePresence>
          {canConfirm && (
            <motion.button
              key="confirm"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              data-testid="confirm-crystal"
              className="w-full h-12 rounded-2xl bg-gold text-dark font-bold text-[14px] flex items-center justify-center gap-2 relative overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 14px rgba(212,168,67,0.4), inset 0 0 0 0 rgba(255,255,255,0)',
                    '0 0 30px rgba(212,168,67,0.85), inset 0 0 0 1px rgba(255,255,255,0.25)',
                    '0 0 14px rgba(212,168,67,0.4), inset 0 0 0 0 rgba(255,255,255,0)',
                  ],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative">Forge Your Crystal</span>
              <motion.span
                className="relative"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* During celebration, the button is replaced with a quiet ritual line */}
        <AnimatePresence>
          {celebrating && (
            <motion.p
              key="ritual"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center text-[11px] font-mono uppercase tracking-[0.3em] text-gold/85 pt-4"
            >
              The crystal is forming…
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <ScreenQuote screen="s06" />
    </div>
  );
}
