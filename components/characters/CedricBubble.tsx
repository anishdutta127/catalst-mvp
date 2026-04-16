'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DIALOGUE_TIMING } from '@/lib/constants';

interface CedricBubbleProps {
  text: string;
  onComplete?: () => void;
  delay?: number;
}

/**
 * CedricBubble — word-by-word streaming text for Cedric.
 * Rate: DIALOGUE_TIMING.cedricWordDelay ms per word (50ms).
 * Uses useRef for onComplete to prevent Framer Motion closure restarts.
 */
export function CedricBubble({ text, onComplete, delay = 0 }: CedricBubbleProps) {
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(false);

  // Stable ref for onComplete — prevents closure recreation on re-render
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleComplete = useCallback(() => {
    onCompleteRef.current?.();
  }, []);

  // Delay before starting
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Word-by-word reveal
  useEffect(() => {
    if (!started) return;
    if (visibleCount >= words.length) {
      handleComplete();
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, DIALOGUE_TIMING.cedricWordDelay);

    return () => clearTimeout(timer);
  }, [started, visibleCount, words.length, handleComplete]);

  if (!started) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-dark-surface border border-white/10 rounded-lg px-4 py-3 max-w-[85%]"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-gold">🧙 Cedric</span>
      </div>
      <p className="text-sm leading-relaxed text-ivory">
        {words.map((word, i) => (
          <span
            key={i}
            className="transition-opacity duration-100"
            style={{ opacity: i < visibleCount ? 1 : 0 }}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </motion.div>
  );
}
