'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface PipFloatingBubbleProps {
  text: string;
  color: string;
  /** Total on-screen time before onComplete fires, in ms. Default 2800. */
  duration?: number;
  onComplete?: () => void;
}

/**
 * PipFloatingBubble — transient reaction bubble that sits to the LEFT of Pip's
 * sprite. Positions absolutely relative to the nearest positioned ancestor, so
 * the caller must render it inside a relatively-positioned container (e.g.
 * S04's outer `<div className="relative ...">` which is itself scoped to the
 * 720px activity column).
 *
 * Exists for "heat-of-the-moment" beats triggered by user actions (first keep,
 * first edge, threshold-crossed) that should pop next to Pip instead of
 * stacking in the chat strip and cramping the activity zone.
 */
export function PipFloatingBubble({
  text,
  color,
  duration = 2800,
  onComplete,
}: PipFloatingBubbleProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t = setTimeout(() => {
      onCompleteRef.current?.();
    }, duration);
    return () => clearTimeout(t);
  }, [duration]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 8, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 8, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="absolute z-40 pointer-events-none"
      style={{
        // Sprite sits at top:4 / right:4, size 48px, so the bubble starts
        // 16px to the left of the sprite's left edge.
        top: 16,
        right: 68,
        maxWidth: 240,
      }}
    >
      <div
        className="rounded-xl px-3.5 py-2.5 backdrop-blur-md"
        style={{
          background: 'rgba(12, 14, 18, 0.85)',
          border: `1px solid ${color}60`,
          boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 12px ${color}25`,
        }}
      >
        <p
          className="text-[12px] leading-snug italic text-right"
          style={{ color }}
        >
          {text}
        </p>
      </div>
    </motion.div>
  );
}
