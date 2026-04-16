'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { createTimer } from '@/lib/timing';
import { TIMER_DEFAULTS } from '@/lib/constants';

/**
 * S03 — Word Association
 *
 * 3 words displayed: POWER / BUILD / RISK (not TOGETHER).
 * Each appears one at a time with 600ms gap.
 * Per word: user chooses left or right, 6s timer.
 * TOGETHER scored as fixed baseline (Stronger always true).
 */

// Only show 3 words: POWER (idx 0), BUILD (idx 2), RISK (idx 3)
// TOGETHER (idx 1) is stored as baseline
const VISIBLE_INDICES = [0, 2, 3];

export function S03Words() {
  const recordWordResponse = useJourneyStore((s) => s.recordWordResponse);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [step, setStep] = useState(-1); // -1 = pre-reveal, 0-2 = word index in VISIBLE_INDICES
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DEFAULTS.s03_word);
  const timer = useRef(createTimer());
  const dialogueSent = useRef(false);

  // Cedric intro + start first word after 600ms
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s03.cedric.intro,
      type: 'dialogue',
    });
    // Record TOGETHER as baseline (index 1 = 'Stronger')
    recordWordResponse(1, 'Stronger', 0);
    // Start first word after delay
    setTimeout(() => setStep(0), 800);
  }, [enqueueMessage, recordWordResponse]);

  // Timer per word
  useEffect(() => {
    if (step < 0 || step > 2 || selected) return;
    timer.current.start();
    setTimeLeft(TIMER_DEFAULTS.s03_word);

    const interval = setInterval(() => {
      const elapsed = timer.current.peek();
      const remaining = TIMER_DEFAULTS.s03_word - elapsed;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(interval);
        // Auto-select left on timer expire
        const wordIdx = VISIBLE_INDICES[step];
        handleChoice(lines.s03.words[wordIdx].left);
      }
    }, 100);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selected]);

  function handleChoice(choice: string) {
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
        enqueueMessage({
          speaker: 'cedric',
          text: lines.s03.cedric.afterAll,
          type: 'dialogue',
        });
        setTimeout(() => advanceScreen(), 600);
      }
    }, 400);
  }

  if (step < 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-mono text-ivory/30 uppercase tracking-widest"
        >
          preparing...
        </motion.p>
      </div>
    );
  }

  const wordIdx = VISIBLE_INDICES[step];
  const word = lines.s03.words[wordIdx];
  const timerPct = timeLeft / TIMER_DEFAULTS.s03_word;

  return (
    <div className="flex flex-col items-center justify-center gap-8 h-full">
      {/* Word counter */}
      <p className="text-[10px] font-mono text-ivory/30 uppercase tracking-widest">
        {step + 1} / 3
      </p>

      {/* Word display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={wordIdx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="text-center"
          data-testid="word-display"
        >
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gold tracking-wider">
            {word.word}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Timer bar */}
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: timerPct > 0.3 ? '#4ade80' : timerPct > 0.1 ? '#fbbf24' : '#ef4444',
            width: `${timerPct * 100}%`,
          }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Choice buttons */}
      <div className="flex gap-4 w-full max-w-xs">
        {[word.left, word.right].map((choice, idx) => {
          const isSelected = selected === choice;
          const isDissolved = selected !== null && !isSelected;
          return (
            <motion.button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={!!selected}
              data-testid={idx === 0 ? 'word-left' : 'word-right'}
              animate={{
                opacity: isDissolved ? 0.3 : 1,
                scale: isSelected ? 1.05 : isDissolved ? 0.95 : 1,
              }}
              className={`flex-1 py-3 rounded-lg text-center font-semibold text-sm transition-all ${
                isSelected
                  ? 'bg-gold/20 border-2 border-gold/60 text-gold'
                  : 'bg-dark-surface border border-white/10 text-ivory hover:border-white/20 cursor-pointer'
              }`}
            >
              {choice}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
