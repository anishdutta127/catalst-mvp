'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { createTimer } from '@/lib/timing';
import { TIMER_DEFAULTS } from '@/lib/constants';
import { ActivityTimer } from '@/components/ui/ActivityTimer';
import { ScreenQuote } from '@/components/ui/ScreenQuote';

/**
 * S03 — Word Association (enriched)
 *
 * The word IS the experience. 72px/52px Playfair gold, centered.
 * Two buttons: Resonates / Pass. ActivityTimer 6s. TOGETHER baseline.
 * 3 words: POWER (idx 0), BUILD (idx 2), RISK (idx 3).
 */

const VISIBLE_INDICES = [0, 2, 3];

export function S03Words() {
  const recordWordResponse = useJourneyStore((s) => s.recordWordResponse);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [step, setStep] = useState(-1);
  const [selected, setSelected] = useState<string | null>(null);
  const timer = useRef(createTimer());
  const dialogueSent = useRef(false);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s03.cedric.intro, type: 'instruction' });
    setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s03.pip.intro, type: 'dialogue' });
    }, 1200);
    recordWordResponse(1, 'Stronger', 0); // TOGETHER baseline
    setTimeout(() => setStep(0), 1000);
  }, [enqueueMessage, recordWordResponse]);

  useEffect(() => {
    if (step >= 0) timer.current.start();
  }, [step]);

  const handleChoice = useCallback((choice: string) => {
    if (selected) return;
    const responseTime = timer.current.stop();
    setSelected(choice);
    const wordIdx = VISIBLE_INDICES[step];
    recordWordResponse(wordIdx, choice, responseTime);

    setTimeout(() => {
      if (step < 2) {
        setStep((s) => s + 1);
        setSelected(null);
      } else {
        enqueueMessage({ speaker: 'cedric', text: lines.s03.cedric.afterAll, type: 'dialogue' });
        setTimeout(() => advanceScreen(), 600);
      }
    }, 400);
  }, [selected, step, recordWordResponse, enqueueMessage, advanceScreen]);

  const handleExpire = useCallback(() => {
    const wordIdx = VISIBLE_INDICES[step];
    handleChoice(lines.s03.words[wordIdx].left);
  }, [step, handleChoice]);

  if (step < 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs font-mono text-ivory/30 uppercase tracking-widest">preparing...</p>
      </div>
    );
  }

  const wordIdx = VISIBLE_INDICES[step];
  const word = lines.s03.words[wordIdx];

  return (
    <div className="flex flex-col items-center justify-center gap-8 h-full relative">
      {/* ActivityTimer */}
      <ActivityTimer durationMs={TIMER_DEFAULTS.s03_word} onExpire={handleExpire} resetKey={step} />

      {/* Word — the HERO element */}
      <AnimatePresence mode="wait">
        <motion.div
          key={wordIdx}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.4 }}
          data-testid="word-display"
        >
          <h2 className="text-[52px] sm:text-[72px] font-serif font-bold text-gold tracking-[0.15em] text-center">
            {word.word}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Two contrasting concept buttons (v7 mechanic) */}
      <div className="flex gap-4">
        {[
          { label: word.left, choice: word.left, testId: 'word-left', border: 'border-l-2 border-l-gold' },
          { label: word.right, choice: word.right, testId: 'word-right', border: 'border-r-2 border-r-gold' },
        ].map(({ label, choice, testId, border }) => {
          const isSelected = selected === choice;
          const isDissolved = selected !== null && !isSelected;
          return (
            <motion.button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={!!selected}
              data-testid={testId}
              animate={{
                opacity: isDissolved ? 0.3 : 1,
                scale: isSelected ? 1.02 : isDissolved ? 0.95 : 1,
              }}
              className={`flex-1 h-12 rounded-lg text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-gold text-dark'
                  : `bg-transparent ${border} text-ivory hover:bg-gold/10 cursor-pointer`
              }`}
            >
              {label}
            </motion.button>
          );
        })}
      </div>

      {/* Counter */}
      <p className="text-[10px] font-mono text-ivory/30">{step + 1} / 3</p>

      <ScreenQuote screen="s03" />
    </div>
  );
}
