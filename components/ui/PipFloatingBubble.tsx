'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface PipFloatingBubbleProps {
  text: string;
  color: string;
  /** Total on-screen time before onComplete fires, in ms. Default 2800. */
  duration?: number;
  onComplete?: () => void;
  /**
   * Where the bubble sits relative to its positioned ancestor:
   *   • "top-right" (default) — bubble anchored top, opens to the LEFT of Pip.
   *     Used on S04 where Pip sits at top-right of the card zone.
   *   • "bottom-right" — bubble anchored bottom, opens UPWARD above Pip.
   *     Used on S07 where Pip sits at bottom-right of the activity zone.
   */
  direction?: 'top-right' | 'bottom-right';
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
  direction = 'top-right',
}: PipFloatingBubbleProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t = setTimeout(() => {
      onCompleteRef.current?.();
    }, duration);
    return () => clearTimeout(t);
  }, [duration]);

  const isBottom = direction === 'bottom-right';

  // Entry direction mirrors the bubble's position: horizontal slide-in for
  // top-right (bubble left of Pip), vertical slide-up for bottom-right
  // (bubble above Pip).
  const motionProps = isBottom
    ? {
        initial: { opacity: 0, y: 10, scale: 0.92 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.95 },
      }
    : {
        initial: { opacity: 0, x: 12, scale: 0.92 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 8, scale: 0.95 },
      };

  // Position style per direction. The caller's positioned ancestor is the
  // screen's outer relative container — `top` for top-right mode matches
  // Pip's top:-10 / right:12 anchor; `bottom` for bottom-right mode matches
  // S07's Pip anchored bottom-right just above the CTA.
  //
  // right: 92 in top-right mode — Pip's sprite is 52px wide at right:12, so
  // its left edge is at right:64. 92 gives a 28px gap that aligns with the
  // horizontal dotted tether length.
  //
  // right: 72 in bottom-right mode — Pip's sprite is 48px wide at right:10
  // (S07 anchor), so sprite left edge is at right:58. Bubble right edge at
  // right:72 clears the sprite by 14px. maxWidth bumped 240 → 280 so longer
  // ambient lines like the vow Pip beat don't wrap awkwardly.
  const positionStyle: React.CSSProperties = isBottom
    ? { bottom: 68, right: 72, maxWidth: 280 }
    : { top: 4, right: 92, maxWidth: 220 };

  return (
    <motion.div
      {...motionProps}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-40 pointer-events-none"
      style={positionStyle}
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

        {/* Dotted connective tether — points from bubble's right edge toward
            Pip. In both top-right and bottom-right modes the bubble now sits
            to the LEFT of Pip (with matching vertical ranges), so a short
            horizontal dotted line reads naturally in either mode. */}
        <svg
          className="absolute"
          aria-hidden
          style={{
            right: isBottom ? -16 : -28,
            top: '50%',
            transform: 'translateY(-50%)',
            overflow: 'visible',
          }}
          width={isBottom ? 16 : 28}
          height="12"
        >
          <line
            x1="0"
            y1="6"
            x2={isBottom ? 14 : 26}
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
