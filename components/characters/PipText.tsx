'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PipTextProps {
  text: string;
  color?: string;
  onComplete?: () => void;
  /** ms per character. Default 22. */
  charDelay?: number;
  /** Wait this many ms before starting */
  delay?: number;
}

/**
 * PipText — raw italic typewriter, no bubble, right-aligned.
 * Character-by-character reveal (not word-by-word). Matches Claude's streaming feel.
 */
export function PipText({
  text,
  color = '#4ade80',
  onComplete,
  charDelay = 22,
  delay = 0,
}: PipTextProps) {
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
    <p
      className="text-[13px] italic leading-snug text-right whitespace-pre-wrap"
      style={{ color }}
    >
      {text.slice(0, visibleCount)}
      {visibleCount < text.length && (
        <span className="inline-block w-[2px] h-[13px] align-middle ml-[1px] animate-pulse" style={{ background: color }} />
      )}
    </p>
  );
}
