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
 * sprite, with a dotted connective line threading toward him so the reaction
 * reads as HIS reaction. Positions absolutely relative to the nearest
 * positioned ancestor (on S04 that's the card zone wrapper, so the bubble
 * sits next to Pip at the card's top-right corner).
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
      initial={{ opacity: 0, x: 12, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 8, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-40 pointer-events-none"
      style={{
        // Pip now sits at top:-10 / right:12, size 52px (card zone coords).
        // His left edge is at right: 64, so the bubble's right edge anchors
        // at right: 72 (8px gap for the dotted tether to breathe).
        top: 4,
        right: 72,
        maxWidth: 220,
      }}
    >
      <div
        className="relative rounded-xl px-3.5 py-2.5 backdrop-blur-md"
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

        {/* Dotted connective tissue — threads from the bubble's right edge
            toward Pip so the reaction reads as HIS reaction. Uses overflow:
            visible so the line can extend past the svg's nominal bounds. */}
        <svg
          className="absolute"
          aria-hidden
          style={{
            right: -28,
            top: '50%',
            transform: 'translateY(-50%)',
            overflow: 'visible',
          }}
          width="28"
          height="12"
        >
          <line
            x1="0"
            y1="6"
            x2="26"
            y2="6"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray="2,3"
            opacity="0.55"
          />
        </svg>
      </div>
    </motion.div>
  );
}
