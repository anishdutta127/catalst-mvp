import type { Transition, Variants } from 'framer-motion';

/**
 * lib/motion.ts — the single source of truth for motion tokens + shared
 * variants. Every component that animates should import from here so the
 * journey's rhythm stays consistent instead of drifting per-screen.
 *
 * Naming conventions:
 *   - ease*  →  cubic-bezier curves (const tuples)
 *   - spring*→  Transition objects (type: 'spring' + stiffness/damping)
 *   - duration.*→ second-units for standard UI timings
 *   - fade / scale / screen variants — reusable for motion.div
 */

// ─── Easing curves ────────────────────────────────────────────────────────

/** Silky smooth decelerating — for most arrivals / state changes. */
export const easeSmooth = [0.22, 1, 0.36, 1] as const;

/** Snappy with a gentle overshoot — for emphasis (key buttons, reveals). */
export const easeOvershoot = [0.34, 1.56, 0.64, 1] as const;

/** Quick ease-out — for exits, so things leave without lingering. */
export const easeExit = [0.4, 0, 1, 1] as const;

/** Elastic settle — for rare, playful moments. */
export const easeElastic = [0.68, -0.55, 0.265, 1.55] as const;

// ─── Spring configs ───────────────────────────────────────────────────────

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 180,
  damping: 24,
  mass: 0.8,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 22,
  mass: 0.6,
};

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 16,
  mass: 0.8,
};

// ─── Duration tokens ──────────────────────────────────────────────────────

export const duration = {
  fast: 0.18, // button presses, micro feedback
  normal: 0.32, // most UI transitions
  smooth: 0.5, // screen transitions, major reveals
  slow: 0.8, // ceremonial moments
} as const;

// ─── Common variants ──────────────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.normal, ease: easeSmooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast, ease: easeExit },
  },
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easeSmooth },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: duration.fast, ease: easeExit },
  },
};

export const scaleInSoft: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: duration.normal, ease: easeSmooth },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: duration.fast, ease: easeExit },
  },
};

export const scaleInPop: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: [0, 1.08, 1],
    transition: {
      duration: duration.smooth,
      times: [0, 0.6, 1],
      ease: easeOvershoot,
    },
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: { duration: duration.fast },
  },
};

// ─── Staggered children ───────────────────────────────────────────────────

/** Container variant for list staggering. Default delays + stagger are tuned
 *  for a 5-ish-item bento that shouldn't feel slow but should have rhythm. */
export const staggerContainer = (delayChildren = 0, stagger = 0.06): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren,
      staggerChildren: stagger,
    },
  },
});

// ─── Screen-level transitions ─────────────────────────────────────────────

/** The outermost per-screen transition used by JourneyShell. Combines opacity
 *  + slight y-offset + a soft focus-in/out blur so the shift reads as "focus
 *  changed" rather than "screen swapped." */
export const screenTransition: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: easeSmooth,
      filter: { duration: 0.35, ease: easeSmooth },
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(3px)',
    transition: {
      duration: 0.3,
      ease: easeExit,
    },
  },
};

// ─── Button interaction preset ────────────────────────────────────────────

/** Spread onto any major CTA for consistent press/hover feedback. */
export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 20,
  } as Transition,
};
