'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface CedricBubbleProps {
  text: string;
  onComplete?: () => void;
  /** ms per character. Default 28 (Cedric is deliberate). */
  charDelay?: number;
  delay?: number;
}

/**
 * CedricBubble — character-by-character streaming, top-left aligned.
 * Dark bg + gold name label. Bubble itself vertically centers in its column.
 */
export function CedricBubble({
  text,
  onComplete,
  charDelay = 28,
  delay = 0,
}: CedricBubbleProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(false);
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
    if (visibleCount >= text.length) {
      handleComplete();
      return;
    }
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, charDelay);
    return () => clearTimeout(timer);
  }, [started, visibleCount, text.length, charDelay, handleComplete]);

  if (!started) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-dark-surface/95 border border-white/10 rounded-xl px-4 py-3 w-full text-left"
      style={{ backdropFilter: 'blur(6px)' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[11px] font-semibold tracking-wide text-gold">🧙 Cedric</span>
      </div>
      <p className="text-[14px] leading-relaxed text-ivory whitespace-pre-wrap">
        {text.slice(0, visibleCount)}
        {visibleCount < text.length && (
          <span className="inline-block w-[2px] h-[14px] align-middle ml-[1px] animate-pulse bg-gold" />
        )}
      </p>
    </motion.div>
  );
}
