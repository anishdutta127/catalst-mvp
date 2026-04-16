'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { createTimer } from '@/lib/timing';
import { TIMER_DEFAULTS } from '@/lib/constants';
import Image from 'next/image';

/**
 * S02 — Inkblots
 *
 * 3 Rorschach plates sequentially. Per plate: 4 options in 2x2 grid (bottom-right empty),
 * 8s depleting vine timer, auto-selects first option on expire.
 * Selection: chosen glows gold, others dissolve, advance after 400ms.
 */

const BLOTS = [lines.s02.blots.blot1, lines.s02.blots.blot2, lines.s02.blots.blot3];
const BLOT_IMAGES = ['/blots/blot-1.jpg', '/blots/blot-2.jpg', '/blots/blot-3.jpg'];

export function S02Inkblots() {
  const recordBlotResponse = useJourneyStore((s) => s.recordBlotResponse);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [currentBlot, setCurrentBlot] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DEFAULTS.s02_blot);
  const timer = useRef(createTimer());
  const dialogueSent = useRef(false);

  // Cedric intro
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s02.cedric.intro,
      type: 'dialogue',
    });
  }, [enqueueMessage]);

  // Timer countdown
  useEffect(() => {
    if (selectedEmoji) return;
    timer.current.start();
    setTimeLeft(TIMER_DEFAULTS.s02_blot);

    const interval = setInterval(() => {
      const elapsed = timer.current.peek();
      const remaining = TIMER_DEFAULTS.s02_blot - elapsed;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(interval);
        // Auto-select first option
        const firstOption = BLOTS[currentBlot].options[0];
        handleSelect(firstOption.emoji);
      }
    }, 100);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBlot, selectedEmoji]);

  const handleSelect = useCallback((emoji: string) => {
    if (selectedEmoji) return;
    const responseTime = timer.current.stop();
    setSelectedEmoji(emoji);
    recordBlotResponse(currentBlot, emoji, responseTime);

    // Advance after dissolve animation
    setTimeout(() => {
      if (currentBlot < 2) {
        setCurrentBlot((c) => c + 1);
        setSelectedEmoji(null);
      } else {
        enqueueMessage({
          speaker: 'cedric',
          text: lines.s02.cedric.afterAllBlots,
          type: 'dialogue',
        });
        setTimeout(() => advanceScreen(), 600);
      }
    }, 400);
  }, [selectedEmoji, currentBlot, recordBlotResponse, enqueueMessage, advanceScreen]);

  const timerPct = timeLeft / TIMER_DEFAULTS.s02_blot;
  const blot = BLOTS[currentBlot];

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full justify-center">
      {/* Blot image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBlot}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden"
        >
          <Image
            src={BLOT_IMAGES[currentBlot]}
            alt={`Rorschach blot ${currentBlot + 1}`}
            fill
            className="object-cover"
            priority
          />
          {/* Timer vine (top-right corner) */}
          <div className="absolute top-2 right-2 w-6 h-6">
            <svg viewBox="0 0 24 24" className="w-full h-full -rotate-90">
              <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
              <circle
                cx="12" cy="12" r="10" fill="none"
                stroke={timerPct > 0.3 ? '#4ade80' : timerPct > 0.1 ? '#fbbf24' : '#ef4444'}
                strokeWidth="2"
                strokeDasharray={`${timerPct * 62.83} 62.83`}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Blot counter */}
      <p className="text-[10px] font-mono text-ivory/30 uppercase tracking-widest">
        {currentBlot + 1} / 3
      </p>

      {/* 2x2 option grid */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {blot.options.map((opt, i) => {
          const isSelected = selectedEmoji === opt.emoji;
          const isDissolved = selectedEmoji !== null && !isSelected;
          return (
            <motion.button
              key={`${currentBlot}-${i}`}
              onClick={() => handleSelect(opt.emoji)}
              disabled={!!selectedEmoji}
              animate={{
                opacity: isDissolved ? 0 : 1,
                y: isDissolved ? 4 : 0,
              }}
              transition={{ duration: 0.25, delay: isDissolved ? i * 0.06 : 0 }}
              className={`bg-dark-surface border rounded-lg p-3 text-left transition-all ${
                isSelected
                  ? 'border-gold/60 shadow-[0_0_8px_rgba(212,168,67,0.4)]'
                  : 'border-white/10 hover:border-white/20'
              } ${selectedEmoji && !isSelected ? 'pointer-events-none' : 'cursor-pointer'}`}
            >
              <span className="text-lg block mb-1">{opt.emoji}</span>
              <span className="text-xs text-ivory/70 leading-snug block">
                {opt.label.replace(/\s*\\\s*\.\s*/g, ' ')}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
