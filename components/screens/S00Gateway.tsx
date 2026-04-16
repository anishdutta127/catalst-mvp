'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';

/**
 * S00 — Gateway (enriched)
 *
 * Layout: CATALST large centered (top 30%), subtitle (top 45%),
 * name input (center), value prop below, quote at bottom.
 * CTA always mounted, opacity-controlled (no jitter).
 * Header hidden on this screen (JourneyShell Header returns null for s00).
 */

const quote = lines.s00.quotes[0]; // Aristotle

export function S00Gateway() {
  const displayName = useJourneyStore((s) => s.displayName);
  const setDisplayName = useJourneyStore((s) => s.setDisplayName);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [inputValue, setInputValue] = useState(displayName);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(!!displayName);
  const [showQuote, setShowQuote] = useState(false);
  const dialogueSent = useRef(false);

  const isValid = inputValue.trim().length >= 2;

  // Cedric intro after 1s
  useEffect(() => {
    if (dialogueSent.current) return;
    dialogueSent.current = true;
    setTimeout(() => {
      enqueueMessage({ speaker: 'cedric', text: lines.s01.cedric.intro1, type: 'dialogue' });
    }, 1000);
    // Show quote after 2s
    setTimeout(() => setShowQuote(true), 2000);
  }, [enqueueMessage]);

  function handleSubmit() {
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setError('');
    setDisplayName(trimmed);
    setSubmitted(true);
    setTimeout(() => advanceScreen(), 400);
  }

  return (
    <div className="flex flex-col items-center justify-between h-full py-4 text-center relative">
      {/* Top section: CATALST wordmark (large, centered) */}
      <div className="flex flex-col items-center gap-3 pt-[8vh]">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[48px] tracking-[0.2em] text-gold font-serif font-semibold"
        >
          CATALST
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-base text-ivory-muted font-serif italic"
        >
          {lines.s00.subtitle}
        </motion.p>
      </div>

      {/* Center: Name input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="flex flex-col items-center gap-3 w-full px-12"
      >
        {!submitted ? (
          <>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="Your first name"
              autoFocus
              data-testid="name-input"
              className="w-full h-[52px] px-4 rounded-lg bg-dark-surface border border-white/10 text-ivory placeholder:text-ivory/30 focus:outline-none focus:shadow-[0_0_0_2px_rgba(212,168,67,0.4)] text-center text-base transition-shadow"
            />
            {error && <p className="text-xs text-error">{error}</p>}
            <p className="text-[12px] text-ivory/40 tracking-wider uppercase">
              3 startup ideas matched to your personality · 5 minutes
            </p>
          </>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gold font-serif text-xl"
          >
            {inputValue.trim()}
          </motion.p>
        )}
      </motion.div>

      {/* Bottom: Quote (fades in after 2s) */}
      <div className="px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: showQuote ? 0.4 : 0 }}
          transition={{ duration: 0.6 }}
          className="text-[12px] text-ivory italic text-center"
        >
          "{quote.text}" — {quote.author}
        </motion.p>
      </div>

      {/* CTA — always mounted, opacity controlled (no jitter) */}
      <motion.button
        onClick={handleSubmit}
        data-testid="s00-cta"
        animate={{ opacity: isValid && !submitted ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center pointer-events-auto"
        style={{ pointerEvents: isValid && !submitted ? 'auto' : 'none' }}
      >
        <span className="px-8 py-3 rounded-full font-semibold bg-gold text-dark hover:bg-gold/90 transition-all">
          Enter Verdania →
        </span>
      </motion.button>
    </div>
  );
}
