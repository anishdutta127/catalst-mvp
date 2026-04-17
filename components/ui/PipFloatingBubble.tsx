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
 * PipFloatingBubble — transient reaction bubble anchored near Pip's sprite
 * (top-right of the activity zone). Fades in, holds, fades out.
 *
 * Exists for "heat-of-the-moment" beats triggered by user actions (first keep,
 * first edge, threshold-crossed) that should pop over the card instead of
 * stacking in the chat strip and cramping the activity zone.
 *
 * The intro Pip line on each screen still goes through the chat messageQueue —
 * this is only for ephemeral reactions.
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
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="fixed z-40 pointer-events-none"
      style={{
        top: 110,
        // Anchor to the right edge of the 720px-capped activity column, with
        // a 24px inset. On narrow viewports (< 720px) the calc goes negative
        // and max() clamps to 24px — bubble sticks to viewport right.
        right: 'max(24px, calc((100vw - 720px) / 2 + 24px))',
        maxWidth: 280,
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
