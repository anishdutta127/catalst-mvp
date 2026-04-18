'use client';

import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PipSprite, type PipEmotion } from './PipSprite';

interface PipWithPoofProps {
  emotion?: PipEmotion;
  color?: string;
  size?: number;
  /** Delay before Pip poofs in (ms). Lets the screen / Cedric settle first. */
  enterDelay?: number;
  /** When true, Pip poofs IN. When false, he poofs OUT and unmounts cleanly. */
  visible?: boolean;
}

/**
 * PipWithPoof — wraps PipSprite with a sparkle burst + scale-in on mount and
 * a scale-out on unmount. Every screen should use this wrapper instead of
 * rendering PipSprite directly, so transitions between screens feel intentional
 * instead of "just poof gone."
 *
 * Memoized so parent re-renders don't re-trigger the entry animation.
 * Two separate AnimatePresence wrappers (sparkle / pip) so AnimatePresence
 * sees a single direct child each — avoids the Fragment-child ambiguity.
 */
function PipWithPoofImpl({
  emotion = 'idle',
  color = '#4ade80',
  size = 44,
  enterDelay = 0,
  visible = true,
}: PipWithPoofProps) {
  const delaySec = enterDelay / 1000;

  // Memoize the entry/exit configs so Framer doesn't think they "changed" on
  // every parent re-render — if the values aren't stable the entry animation
  // can re-fire and read as a flicker.
  const sparkleInitial = useMemo(() => ({ opacity: 0, scale: 0.3 }), []);
  const sparkleAnim = useMemo(() => ({ opacity: [0, 1, 0], scale: [0.3, 1.6, 2] }), []);
  const sparkleExit = useMemo(() => ({ opacity: 0 }), []);
  const sparkleTrans = useMemo(
    () => ({ duration: 0.55, times: [0, 0.3, 1], delay: delaySec }),
    [delaySec],
  );

  const pipInitial = useMemo(() => ({ opacity: 0, scale: 0 }), []);
  const pipAnim = useMemo(() => ({ opacity: 1, scale: [0, 1.2, 1] }), []);
  const pipExit = useMemo(() => ({ opacity: 0, scale: 0 }), []);
  const pipTrans = useMemo(
    () => ({
      duration: 0.5,
      times: [0, 0.65, 1],
      // Gentle elastic overshoot — scale blows past 1, settles back to 1.
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
      delay: delaySec,
    }),
    [delaySec],
  );

  return (
    <div
      className="relative"
      style={{ width: size, height: size * 1.15 }}
    >
      {/* Sparkle burst — visual flourish that reads as "Pip materialized." */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="sparkle"
            className="absolute pointer-events-none z-10"
            style={{
              top: -14,
              left: -14,
              width: size + 28,
              height: size + 28,
            }}
            initial={sparkleInitial}
            animate={sparkleAnim}
            exit={sparkleExit}
            transition={sparkleTrans}
          >
            <svg width="100%" height="100%" viewBox="0 0 72 72" fill="none" aria-hidden>
              <g stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.85">
                <line x1="36" y1="10" x2="36" y2="18" />
                <line x1="36" y1="54" x2="36" y2="62" />
                <line x1="10" y1="36" x2="18" y2="36" />
                <line x1="54" y1="36" x2="62" y2="36" />
                <line x1="18" y1="18" x2="23" y2="23" />
                <line x1="49" y1="49" x2="54" y2="54" />
                <line x1="18" y1="54" x2="23" y2="49" />
                <line x1="49" y1="23" x2="54" y2="18" />
              </g>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The sprite itself — scales up through a slight overshoot and lands. */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="pip"
            className="absolute inset-0"
            initial={pipInitial}
            animate={pipAnim}
            exit={pipExit}
            transition={pipTrans}
            // The SVG sprite is inside — keep it centered inside our
            // slightly-taller container.
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <PipSprite emotion={emotion} color={color} size={size} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const PipWithPoof = memo(PipWithPoofImpl);
