'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DIALOGUE_TIMING } from '@/lib/constants';

interface PipBubbleProps {
  text: string;
  onComplete?: () => void;
  delay?: number;
}

/**
 * PipBubble — word-by-word streaming text for Pip.
 * Rate: DIALOGUE_TIMING.pipWordDelay ms per word (35ms).
 * Uses useRef for onComplete to prevent Framer Motion closure restarts.
 *
 * SINGLETON: PipBubble renders ONLY inside DialogueStrip (which lives in
 * JourneyShell). Screen components must NEVER import or render this directly.
 */
export function PipBubble({ text, onComplete, delay = 0 }: PipBubbleProps) {
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(false);

  // Stable ref for onComplete — prevents closure recreation on re-render
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleComplete = useCallback(() => {
    onCompleteRef.current?.();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (visibleCount >= words.length) {
      handleComplete();
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, DIALOGUE_TIMING.pipWordDelay);

    return () => clearTimeout(timer);
  }, [started, visibleCount, words.length, handleComplete]);

  if (!started) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 300 }}
      className="bg-dark-surface/80 border border-white/10 rounded-2xl px-3 py-2 max-w-[75%]"
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xs font-semibold text-teal">🌱 Pip</span>
      </div>
      <p className="text-xs leading-relaxed text-ivory/90">
        {words.map((word, i) => (
          <span
            key={i}
            className="transition-opacity duration-75"
            style={{ opacity: i < visibleCount ? 1 : 0 }}
          >
            {word}{i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </motion.div>
  );
}
