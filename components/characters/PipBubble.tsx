'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DIALOGUE_TIMING } from '@/lib/constants';

interface PipBubbleProps {
  text: string;
  onComplete?: () => void;
  delay?: number;
}

export function PipBubble({ text, onComplete, delay = 0 }: PipBubbleProps) {
  const words = text.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (visibleCount >= words.length) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, DIALOGUE_TIMING.pipWordDelay);

    return () => clearTimeout(timer);
  }, [started, visibleCount, words.length, onComplete]);

  if (!started) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 300 }}
      className="bg-dark-surface/80 border border-white/10 rounded-2xl px-3 py-2 max-w-[75%]"
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xs font-semibold text-emerald-400">🌱 Pip</span>
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
