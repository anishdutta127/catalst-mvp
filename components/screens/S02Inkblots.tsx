'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { createTimer } from '@/lib/timing';
import { TIMER_DEFAULTS } from '@/lib/constants';
import { ActivityTimer } from '@/components/ui/ActivityTimer';
import Image from 'next/image';

/**
 * S02 — Inkblots (enriched)
 *
 * Circular blot mask, 2x2 option grid (all 4 filled),
 * ActivityTimer (SVG circle, top-right), gold selection glow.
 */

const BLOTS = [lines.s02.blots.blot1, lines.s02.blots.blot2, lines.s02.blots.blot3];
const BLOT_IMAGES = ['/blots/blot-1.jpg', '/blots/blot-2.jpg', '/blots/blot-3.jpg'];

export function S02Inkblots() {
  const recordBlotResponse = useJourneyStore((s) => s.recordBlotResponse);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [currentBlot, setCurrentBlot] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const timer = useRef(createTimer());
  const dialogueSent = useRef(false);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s02.cedric.intro, type: 'instruction' });
    setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s02.pip.intro, type: 'dialogue' });
    }, 1500);
  }, [enqueueMessage]);

  useEffect(() => {
    timer.current.start();
  }, [currentBlot]);

  const handleSelect = useCallback((emoji: string) => {
    if (selectedEmoji) return;
    const responseTime = timer.current.stop();
    setSelectedEmoji(emoji);
    recordBlotResponse(currentBlot, emoji, responseTime);

    setTimeout(() => {
      if (currentBlot < 2) {
        setCurrentBlot((c) => c + 1);
        setSelectedEmoji(null);
      } else {
        enqueueMessage({ speaker: 'cedric', text: lines.s02.cedric.afterAllBlots, type: 'dialogue' });
        setTimeout(() => advanceScreen(), 600);
      }
    }, 500);
  }, [selectedEmoji, currentBlot, recordBlotResponse, enqueueMessage, advanceScreen]);

  const handleExpire = useCallback(() => {
    const first = BLOTS[currentBlot].options[0];
    handleSelect(first.emoji);
  }, [currentBlot, handleSelect]);

  const blot = BLOTS[currentBlot];

  return (
    <div className="flex flex-col items-center gap-4 h-full justify-center relative">
      {/* ActivityTimer */}
      <ActivityTimer durationMs={TIMER_DEFAULTS.s02_blot} onExpire={handleExpire} resetKey={currentBlot} />

      <p className="text-[10px] font-mono text-ivory/40 uppercase tracking-widest">
        {currentBlot + 1} of 3
      </p>

      {/* Circular blot */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBlot}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          data-testid="blot-image"
          className="rounded-full overflow-hidden ring-2 ring-white/20 p-2"
          style={{ width: 'min(70vw, 280px)', height: 'min(70vw, 280px)' }}
        >
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <Image src={BLOT_IMAGES[currentBlot]} alt={`Rorschach blot ${currentBlot + 1}`} fill className="object-contain" priority />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 2x2 grid */}
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
              transition={{ duration: 0.25, delay: isDissolved ? i * 0.06 : 0 }}
              className={`min-h-[56px] flex items-center gap-2 p-3 rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-2 border-gold/60 bg-gold/10 shadow-[0_0_12px_rgba(212,168,67,0.4)]'
                  : 'bg-dark-surface border border-white/10 hover:border-gold/30'
              } ${selectedEmoji && !isSelected ? 'pointer-events-none' : 'cursor-pointer'}`}
            >
              <span className="text-xl shrink-0">{opt.emoji}</span>
              <span className="text-sm text-ivory leading-snug">
                {opt.label.replace(/\s*\\\s*\.\s*/g, ' ')}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
