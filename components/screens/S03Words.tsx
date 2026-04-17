'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { createTimer } from '@/lib/timing';
import { TIMER_DEFAULTS } from '@/lib/constants';
import { ActivityTimer } from '@/components/ui/ActivityTimer';
import { ProcessingSwirl } from '@/components/ui/ProcessingSwirl';
import { ScreenQuote } from '@/components/ui/ScreenQuote';

/**
 * S03 — Word Association (enriched).
 * 72px/52px Playfair gold word, centered. Two large tappable concept pills below.
 * Fixed: pills now 64px tall, 180px min-width, full click area, tighter spring.
 */

const VISIBLE_INDICES = [0, 2, 3];

export function S03Words() {
  const recordWordResponse = useJourneyStore((s) => s.recordWordResponse);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [step, setStep] = useState(-1);
  const [selected, setSelected] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const timer = useRef(createTimer());
  const dialogueSent = useRef(false);

  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    // Cedric introduces; Pip's intro is held back until after the first word
    // so the timer isn't fighting the user's reading time.
    enqueueMessage({ speaker: 'cedric', text: lines.s03.cedric.intro, type: 'instruction' });
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

    // Pip jumps in after the first word — deferred so the user isn't being
    // talked at AND timed at the same time on word 1.
    if (step === 0) {
      setTimeout(() => {
        enqueueMessage({ speaker: 'pip', text: lines.s03.pip.intro, type: 'dialogue' });
      }, 250);
    }

    setTimeout(() => {
      if (step < 2) {
        setStep((s) => s + 1);
        setSelected(null);
      } else {
        // Final word: swap activity for the processing swirl while Cedric
        // streams the wrap-up — same standard outro as the inkblots screen.
        setProcessing(true);
        const wrap = lines.s03.cedric.afterAll;
        enqueueMessage({ speaker: 'cedric', text: wrap, type: 'dialogue' });
        setTimeout(() => advanceScreen(), wrap.length * 28 + 700);
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
  // Show the swirl whenever there's nothing to render in the activity branch.
  // Belt-and-braces against any out-of-bounds step transient — the activity
  // JSX deref's `word.word` and previously crashed if word was undefined.
  const showSwirl = processing || !word;

  return (
    <div className="flex flex-col items-center h-full relative">
      {/* First word gets a grace period equal to Cedric's intro stream so the
           user isn't penalised for reading time. Killed during processing. */}
      {!showSwirl && (
        <ActivityTimer
          durationMs={TIMER_DEFAULTS.s03_word}
          onExpire={handleExpire}
          resetKey={step}
          startDelayMs={step === 0 ? lines.s03.cedric.intro.length * 28 + 600 : 0}
        />
      )}

      <AnimatePresence mode="wait">
        {showSwirl ? (
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
              milestoneLabel="Mind"
              caption="weighing your words"
            />
          </motion.div>
        ) : (
          <motion.div
            key="activity"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28, transition: { duration: 0.24, ease: 'easeIn' } }}
            className="flex-1 w-full flex flex-col items-center justify-center gap-10"
          >
            {/* Word HERO */}
            <AnimatePresence mode="wait">
              <motion.div
                key={wordIdx}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                data-testid="word-display"
              >
                <h2 className="text-[56px] sm:text-[80px] font-serif font-bold text-gold tracking-[0.15em] text-center">
                  {word.word}
                </h2>
              </motion.div>
            </AnimatePresence>

            {/* LARGE contrasting concept pills */}
            <div className="flex gap-4 w-full max-w-lg px-4">
              {[
                { label: word.left, choice: word.left, testId: 'word-left' },
                { label: word.right, choice: word.right, testId: 'word-right' },
              ].map(({ label, choice, testId }) => {
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
                      scale: isSelected ? 1.03 : isDissolved ? 0.95 : 1,
                    }}
                    whileTap={!selected ? { scale: 0.97 } : undefined}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`flex-1 h-16 min-w-[180px] rounded-2xl text-[17px] font-semibold transition-colors ${
                      isSelected
                        ? 'bg-gold text-dark shadow-[0_0_18px_rgba(212,168,67,0.45)]'
                        : 'bg-dark-surface/80 border-2 border-white/15 text-ivory hover:border-gold/50 hover:bg-dark-surface cursor-pointer backdrop-blur-sm'
                    }`}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>

            {/* Counter */}
            <p className="text-[11px] font-mono text-ivory/35 tracking-widest">{step + 1} of 3</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSwirl && <ScreenQuote screen="s03" />}
    </div>
  );
}
