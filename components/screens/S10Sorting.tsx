'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import housesRaw from '@/content/houses.json';

interface LineageFigure {
  name: string;
  achievement: string;
  quote: string;
  sharedTraitLine: string;
  connectionLine: string;
}

interface House {
  id: string;
  name: string;
  hex: string;
  tagline: string;
  description: string;
  strengths: string[];
  lineage: LineageFigure[];
}

const HOUSES = housesRaw as unknown as House[];

type Phase = 'crests' | 'eliminating' | 'winner' | 'lineage' | 'complete';

/**
 * S10 — Sorting Ceremony
 *
 * Animation: 4 crests → 3 fade out → winner reveals → lineage slides in.
 * Pure Framer Motion, no WebGL.
 */
export function S10Sorting() {
  const houseId = useJourneyStore((s) => s.houseId);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [phase, setPhase] = useState<Phase>('crests');
  const [lineageIdx, setLineageIdx] = useState(-1);
  const dialogueSent = useRef(false);

  const winningHouse = HOUSES.find((h) => h.id === houseId) || HOUSES[0];
  const losingHouses = HOUSES.filter((h) => h.id !== winningHouse.id);

  // Animation sequence
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;

    // Phase 1: show all crests (1.5s)
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s10.cedric.intro2,
      type: 'dialogue',
    });

    // Phase 2: eliminate losers (1.5s + 300ms stagger)
    setTimeout(() => setPhase('eliminating'), 1500);

    // Phase 3: winner reveal (after elimination)
    setTimeout(() => {
      setPhase('winner');
      enqueueMessage({
        speaker: 'cedric',
        text: lines.s10.cedric.claim,
        type: 'dialogue',
      });
    }, 3000);

    // Phase 4: lineage slides in
    setTimeout(() => {
      setPhase('lineage');
      enqueueMessage({
        speaker: 'cedric',
        text: lines.s10.cedric.lineageIntro,
        type: 'dialogue',
      });
      // Stagger lineage reveals
      for (let i = 0; i < winningHouse.lineage.length; i++) {
        setTimeout(() => setLineageIdx(i), i * 800);
      }
    }, 5000);

    // Phase 5: complete — show CTA
    setTimeout(() => {
      setPhase('complete');
      enqueueMessage({
        speaker: 'pip',
        text: lines.s10.pip.claim,
        type: 'dialogue',
      });
    }, 5000 + winningHouse.lineage.length * 800 + 500);
  }, [enqueueMessage, winningHouse]);

  const showCrestFor = (house: House) => {
    const isWinner = house.id === winningHouse.id;
    const isEliminated = !isWinner && (phase === 'eliminating' || phase === 'winner' || phase === 'lineage' || phase === 'complete');
    const isRevealed = isWinner && (phase === 'winner' || phase === 'lineage' || phase === 'complete');

    return (
      <motion.div
        key={house.id}
        animate={{
          opacity: isEliminated ? 0 : 1,
          scale: isRevealed ? 1.2 : isEliminated ? 0.8 : 1,
        }}
        transition={{
          duration: 0.5,
          delay: isEliminated ? losingHouses.indexOf(house) * 0.3 : 0,
        }}
        className="flex flex-col items-center gap-2"
      >
        {/* Crest circle */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl font-serif font-bold border-2 transition-all ${
            isRevealed ? 'shadow-[0_0_20px_var(--glow)]' : ''
          }`}
          style={{
            borderColor: house.hex,
            background: `radial-gradient(circle at 40% 35%, ${house.hex}30, ${house.hex}08)`,
            color: house.hex,
            // @ts-expect-error CSS custom property
            '--glow': `${house.hex}60`,
          }}
        >
          {house.name.charAt(house.name.lastIndexOf(' ') + 1)}
        </div>
        <p className="text-[10px] font-mono text-ivory/40 uppercase tracking-wider">
          {house.name.replace('House of ', '')}
        </p>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 h-full overflow-y-auto pb-4">
      {/* 2x2 crest grid */}
      <div className="grid grid-cols-2 gap-6 sm:gap-8">
        {HOUSES.map(showCrestFor)}
      </div>

      {/* Winner details */}
      <AnimatePresence>
        {(phase === 'winner' || phase === 'lineage' || phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center max-w-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-serif font-bold" style={{ color: winningHouse.hex }}>
              {winningHouse.name}
            </h2>
            <p className="text-sm text-ivory/60 mt-1 italic">{winningHouse.tagline}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lineage gallery */}
      <AnimatePresence>
        {(phase === 'lineage' || phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm space-y-2"
          >
            {winningHouse.lineage.map((figure, i) => (
              <AnimatePresence key={figure.name}>
                {i <= lineageIdx && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-dark-surface border border-white/10 rounded-lg p-3"
                  >
                    <p className="text-sm font-semibold text-ivory">{figure.name}</p>
                    <p className="text-[10px] text-ivory/40 mt-0.5">{figure.sharedTraitLine}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advance CTA */}
      {phase === 'complete' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => advanceScreen()}
          className="px-8 py-3 rounded-full bg-gold text-dark font-semibold hover:bg-gold/90 hover:shadow-[0_0_8px_rgba(212,168,67,0.3)] transition-all"
        >
          {lines.s10.continueButton}
        </motion.button>
      )}
    </div>
  );
}
