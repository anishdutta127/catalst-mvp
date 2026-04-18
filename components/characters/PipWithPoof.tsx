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
  /**
   * When true, skip the sparkle-poof and render a single long-lived sprite
   * that only animates its breathing/color/emotion. Use for Pip instances
   * that persist across screen changes (the chat-strip Pip) so he doesn't
   * flash-remount on every navigation. Use `visible` to hide/show without
   * remount (e.g. s00 or screens that own their own Pip).
   */
  persistent?: boolean;
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
  persistent = false,
}: PipWithPoofProps) {
  const delaySec = enterDelay / 1000;

  // PERSISTENT MODE — no sparkle burst, no AnimatePresence. Mounts ONCE with
  // a soft scale-up, then stays forever. Hide/show via `visible` animates
  // opacity + scale on the existing node instead of remounting. This is what
  // the chat-strip Pip uses so he doesn't flash-remount on every screen change.
  if (persistent) {
    return (
      <div
        className="relative"
        style={{ width: size, height: size * 1.15 }}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: visible ? 1 : 0,
            scale: visible ? 1 : 0,
          }}
          transition={{
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
            delay: visible ? delaySec : 0,
          }}
        >
          <PipSprite emotion={emotion} color={color} size={size} />
        </motion.div>
      </div>
    );
  }

  // Memoize the entry/exit configs so Framer doesn't think they "changed" on
  // every parent re-render — if the values aren't stable the entry animation
  // can re-fire and read as a flicker. Tuned softer than before so Pip's
  // arrivals feel gentle and inviting rather than energetic/snappy.
  const sparkleInitial = useMemo(() => ({ opacity: 0, scale: 0.4 }), []);
  const sparkleAnim = useMemo(() => ({ opacity: [0, 0.85, 0], scale: [0.4, 1.5, 2] }), []);
  const sparkleExit = useMemo(() => ({ opacity: 0 }), []);
  const sparkleTrans = useMemo(
    () => ({ duration: 0.75, times: [0, 0.35, 1], delay: delaySec, ease: 'easeOut' as const }),
    [delaySec],
  );

  const pipInitial = useMemo(() => ({ opacity: 0, scale: 0.2 }), []);
  // Gentler overshoot — blows past 1 by ~10% instead of 20%, settles soft.
  const pipAnim = useMemo(() => ({ opacity: 1, scale: [0.2, 1.08, 1] }), []);
  const pipExit = useMemo(() => ({ opacity: 0, scale: 0.4 }), []);
  const pipTrans = useMemo(
    () => ({
      duration: 0.7,
      times: [0, 0.7, 1],
      // Softer cubic-bezier — slight overshoot, cushioned landing.
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
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
