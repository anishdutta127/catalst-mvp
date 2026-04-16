'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';

/**
 * S00 — Gateway
 *
 * First screen. Name input + Cedric intro streaming.
 * Background: bg-s00.png (via JourneyShell)
 * Grid: header (wordmark only), activity (name input), cta (hidden until name >= 2)
 */
export function S00Gateway() {
  const displayName = useJourneyStore((s) => s.displayName);
  const setDisplayName = useJourneyStore((s) => s.setDisplayName);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [inputValue, setInputValue] = useState(displayName);
  const [error, setError] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(!!displayName);
  const dialogueSent = useRef(false);

  // Stream Cedric intro after 1s delay
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    const timer = setTimeout(() => {
      enqueueMessage({
        speaker: 'cedric',
        text: lines.s01.cedric.intro1,
        type: 'dialogue',
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [enqueueMessage]);

  function handleSubmit() {
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setError('');
    setDisplayName(trimmed);
    setNameSubmitted(true);
    // Brief pause then advance
    setTimeout(() => advanceScreen(), 400);
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center h-full">
      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col gap-2"
      >
        <p className="text-sm text-ivory-muted font-serif italic">
          {lines.s00.subtitle}
        </p>
        <p className="text-xs text-ivory/40 font-mono uppercase tracking-wider">
          {lines.s00.valueProp}
        </p>
      </motion.div>

      {/* Name input */}
      {!nameSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col items-center gap-3 w-full max-w-xs"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="Your first name"
            autoFocus
            className="w-full px-4 py-3 rounded-lg bg-dark-surface border border-white/10 text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold/50 text-center text-base"
          />
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-error"
            >
              {error}
            </motion.p>
          )}
          {/* CTA — visible when name >= 2 chars */}
          {inputValue.trim().length >= 2 && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleSubmit}
              className="px-8 py-3 rounded-full font-semibold bg-gold text-dark hover:bg-gold/90 hover:shadow-[0_0_8px_rgba(212,168,67,0.3)] transition-all"
            >
              {lines.s00.cta}
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Submitted state */}
      {nameSubmitted && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gold font-serif text-lg"
        >
          {inputValue.trim()}
        </motion.p>
      )}
    </div>
  );
}
