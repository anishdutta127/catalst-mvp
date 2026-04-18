'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { pathLine } from '@/lib/speakPath';
import { createTimer } from '@/lib/timing';
import { TIMER_DEFAULTS } from '@/lib/constants';
import { ActivityTimer } from '@/components/ui/ActivityTimer';
import { ProcessingSwirl } from '@/components/ui/ProcessingSwirl';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { useAmbientPipLine } from '@/lib/ambient-pip';
import Image from 'next/image';

/**
 * S02 — Inkblots (enriched, crash-free)
 *
 * Circular blot mask, 2x2 option grid.
 *
 * Fixes:
 *   - Guard against `blot` undefined when index advances past array length.
 *   - Blot images swapped to transparent PNGs (no more cream paper bg).
 *   - Regex hack on label removed — em-dashes now real in content/lines.ts.
 */

const BLOTS = [lines.s02.blots.blot1, lines.s02.blots.blot2, lines.s02.blots.blot3];
const BLOT_IMAGES = ['/blots/blot-1.png', '/blots/blot-2.png', '/blots/blot-3.png'];

export function S02Inkblots() {
  const recordBlotResponse = useJourneyStore((s) => s.recordBlotResponse);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const ideaMode = useJourneyStore((s) => s.ideaMode);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [currentBlot, setCurrentBlot] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const timer = useRef(createTimer());
  const dialogueSent = useRef(false);

  useAmbientPipLine('s02');

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    // Cedric introduces; Pip's intro is held back until after the first blot
    // so the user isn't reading two characters AND fighting a timer at once.
    enqueueMessage({ speaker: 'cedric', text: lines.s02.cedric.intro, type: 'instruction' });
  }, [enqueueMessage]);

  useEffect(() => {
    timer.current.start();
  }, [currentBlot]);

  const handleSelect = useCallback((emoji: string) => {
    if (selectedEmoji) return;
    if (currentBlot >= BLOTS.length) return; // guard: don't advance past last blot
    const responseTime = timer.current.stop();
    setSelectedEmoji(emoji);
    recordBlotResponse(currentBlot, emoji, responseTime);

    // Pip pipes up after the user proves they can play — deferred from mount
    // so the first question isn't drowning in dialogue.
    if (currentBlot === 0) {
      setTimeout(() => {
        enqueueMessage({
          speaker: 'pip',
          text: pathLine('s02.pip.intro', lines.s02.pip.intro, ideaMode),
          type: 'dialogue',
        });
      }, 250);
    }

    setTimeout(() => {
      if (currentBlot < BLOTS.length - 1) {
        setCurrentBlot((c) => Math.min(c + 1, BLOTS.length - 1));
        setSelectedEmoji(null);
      } else {
        // Final selection: dissolve activity into the processing swirl while
        // Cedric streams his wrap-up. Stops the "did it freeze?" feeling.
        setProcessing(true);
        const wrap = lines.s02.cedric.afterAllBlots;
        enqueueMessage({ speaker: 'cedric', text: wrap, type: 'dialogue' });
        // Stream + 800ms read pause. Less and the wrap-up gets visually cut
        // when S03 mounts and enqueues its own Cedric intro.
        setTimeout(() => advanceScreen(), wrap.length * 28 + 800);
      }
    }, 500);
  }, [selectedEmoji, currentBlot, recordBlotResponse, enqueueMessage, advanceScreen]);

  const handleExpire = useCallback(() => {
    if (currentBlot >= BLOTS.length) return;
    const blot = BLOTS[currentBlot];
    if (!blot) return;
    handleSelect(blot.options[0].emoji);
  }, [currentBlot, handleSelect]);

  const blot = BLOTS[currentBlot];

  // Guard: if somehow advanced past array bounds, render nothing — advanceScreen handles transition.
  if (!blot) return null;

  return (
    <div className="flex flex-col items-center h-full relative">
      {/* ActivityTimer — first blot gets a grace period equal to the intro stream
           so the user isn't penalised for reading time. Killed during processing. */}
      {!processing && (
        <ActivityTimer
          durationMs={TIMER_DEFAULTS.s02_blot}
          onExpire={handleExpire}
          resetKey={currentBlot}
          startDelayMs={currentBlot === 0 ? lines.s02.cedric.intro.length * 28 + 600 : 0}
        />
      )}

      <AnimatePresence mode="wait">
        {processing ? (
          <motion.div
            key="swirl"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="flex-1 w-full flex items-center justify-center"
          >
            <ProcessingSwirl
              color="#D4A843"
              milestoneIcon="🔮"
              caption="reading your instincts"
            />
          </motion.div>
        ) : (
          <motion.div
            key="activity"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28, transition: { duration: 0.24, ease: 'easeIn' } }}
            className="flex-1 w-full flex flex-col items-center justify-center gap-4"
          >
            <p className="text-[10px] font-mono text-ivory/40 uppercase tracking-widest">
              {currentBlot + 1} of {BLOTS.length}
            </p>

            {/* Circular blot — transparent PNG, no paper bg */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBlot}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                data-testid="blot-image"
                className="rounded-full overflow-hidden ring-2 ring-white/15 p-2 backdrop-blur-sm"
                style={{
                  width: 'min(70vw, 280px)',
                  height: 'min(70vw, 280px)',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.25) 80%)',
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <Image
                    src={BLOT_IMAGES[currentBlot]}
                    alt={`Rorschach blot ${currentBlot + 1}`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* 2x2 grid — em-dashes now real, no more regex hack */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {blot.options.map((opt, i) => {
          const isSelected = selectedEmoji === opt.emoji;
          const isDissolved = selectedEmoji !== null && !isSelected;
          return (
            <motion.button
              key={`${currentBlot}-${i}`}
              onClick={() => handleSelect(opt.emoji)}
              disabled={!!selectedEmoji}
              data-testid={`blot-option-${i}`}
              animate={{
                opacity: isDissolved ? 0.3 : 1,
                y: isDissolved ? 4 : 0,
                scale: isSelected ? 1.02 : isDissolved ? 0.95 : 1,
              }}
              whileTap={!selectedEmoji ? { scale: 0.96 } : undefined}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 26,
                delay: isDissolved ? i * 0.05 : 0,
              }}
              className={`min-h-[56px] flex items-center gap-2 p-3 rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-2 border-gold/60 bg-gold/10 shadow-[0_0_12px_rgba(212,168,67,0.4)]'
                  : 'bg-dark-surface border border-white/10 hover:border-gold/30'
              } ${selectedEmoji && !isSelected ? 'pointer-events-none' : 'cursor-pointer'}`}
            >
              <span className="text-xl shrink-0">{opt.emoji}</span>
              <span className="text-sm text-ivory leading-snug">{opt.label}</span>
            </motion.button>
          );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!processing && <ScreenQuote screen="s02" />}
    </div>
  );
}
