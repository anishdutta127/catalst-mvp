'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface ProcessingSwirlProps {
  /** Sparkle + ring + glow color. Defaults to garden gold. */
  color?: string;
  /** Caption shown as a brief pop during phase 3→4 (700–1100ms).
   *  When `milestoneLabel` is set, "{label} unlocked" is shown instead. */
  caption?: string;
  /** Emoji shown as the badge at center. Falls back to a glowing orb. */
  milestoneIcon?: string;
  /** When set, triggers the "{label} unlocked" celebration caption. */
  milestoneLabel?: string;
}

const SPARKLE_COUNT = 12;

/**
 * ProcessingSwirl — one-shot achievement-unlock beat.
 *
 * Total duration 1100ms, zero loops. Four phases:
 *   1. 0–300ms   — icon spring-in from scale 0 (natural overshoot to ~1.13,
 *                  stiffness 280, damping 18).
 *   2. 300–700ms — gold shockwave ring expands 40→240px, opacity 0→0.8→0.
 *   3. 500–900ms — 12 sparkles burst outward with angular jitter, 3px gold
 *                  dots with white core; fade at ~70% of travel.
 *   4. 700–1100ms — held gold halo behind icon + optional caption pop; both
 *                   fade to nothing by end.
 *
 * Replaces the old infinite orbital-particle loop that felt like a loading
 * spinner. Vibe: Zelda item-unlock, Duolingo streak pop, iOS AirDrop received.
 */
export function ProcessingSwirl({
  color = '#D4A843',
  caption,
  milestoneIcon,
  milestoneLabel,
}: ProcessingSwirlProps) {
  const captionText = milestoneLabel ? `${milestoneLabel} unlocked` : caption;

  // Stable per-mount sparkle spread — angular jitter keeps it from feeling
  // like a perfect geometric circle.
  const sparkles = useMemo(() => {
    return Array.from({ length: SPARKLE_COUNT }, (_, i) => {
      const baseAngleDeg = (i / SPARKLE_COUNT) * 360;
      const jitterDeg = (Math.random() - 0.5) * 25; // ±12.5°
      const angle = ((baseAngleDeg + jitterDeg) * Math.PI) / 180;
      const travel = 80 + Math.random() * 60; // 80–140px from center
      return {
        x: Math.cos(angle) * travel,
        y: Math.sin(angle) * travel,
        delay: 0.5 + Math.random() * 0.05,
      };
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: 260, height: 260 }}>
        {/* Phase 4 — held gold halo behind icon. Invisible until ~700ms, then
            fades up + expands slightly, then fades out by 1100ms. */}
        <motion.div
          className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
          style={{
            width: 120,
            height: 120,
            marginLeft: -60,
            marginTop: -60,
            background: `radial-gradient(circle, ${color}55 0%, ${color}00 70%)`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0, 0.6, 0], scale: [0.8, 0.8, 1.0, 1.15] }}
          transition={{ duration: 1.1, times: [0, 0.64, 0.78, 1], ease: 'easeOut' }}
        />

        {/* Phase 2 — shockwave ring. Starts at 40/240 scale (40px), grows to
            full 240px, opacity 0→0.8→0. */}
        <motion.div
          className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
          style={{
            width: 240,
            height: 240,
            marginLeft: -120,
            marginTop: -120,
            border: `2px solid ${color}`,
            boxSizing: 'border-box',
          }}
          initial={{ scale: 40 / 240, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 0.8, 0] }}
          transition={{
            duration: 0.4,
            delay: 0.3,
            ease: 'easeOut',
            opacity: { duration: 0.4, delay: 0.3, times: [0, 0.1, 1] },
          }}
        />

        {/* Phase 3 — 12 sparkles burst outward from center with angular jitter
            + random travel distance. Fade at ~70% of travel. */}
        {sparkles.map((s, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
            style={{
              width: 6,
              height: 6,
              marginLeft: -3,
              marginTop: -3,
              background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 55%, ${color} 100%)`,
              boxShadow: `0 0 6px ${color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 1 }}
            animate={{
              x: s.x,
              y: s.y,
              opacity: [0, 1, 1, 0],
              scale: [1, 1.2, 0.8, 0.4],
            }}
            transition={{
              duration: 0.4,
              delay: s.delay,
              ease: 'easeOut',
              opacity: { duration: 0.4, delay: s.delay, times: [0, 0.15, 0.7, 1] },
            }}
          />
        ))}

        {/* Phase 1 (spring-in) — central icon or fallback glowing orb.
            Spring {stiffness: 280, damping: 18} overshoots naturally to
            ~1.13 and settles at 1.0 by ~450ms. */}
        {milestoneIcon ? (
          <motion.div
            className="absolute top-1/2 left-1/2 leading-none flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              marginLeft: -40,
              marginTop: -40,
              fontSize: 52,
              filter: `drop-shadow(0 0 18px ${color}bb)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              scale: { type: 'spring', stiffness: 280, damping: 18 },
              opacity: { duration: 0.2 },
            }}
          >
            <span>{milestoneIcon}</span>
          </motion.div>
        ) : (
          <motion.div
            className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
            style={{
              width: 44,
              height: 44,
              marginLeft: -22,
              marginTop: -22,
              background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 55%, ${color}99 100%)`,
              boxShadow: `0 0 24px ${color}`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              scale: { type: 'spring', stiffness: 280, damping: 18 },
              opacity: { duration: 0.2 },
            }}
          />
        )}
      </div>

      {/* Caption pop — 400ms between phase 3 and phase 4 (700–1100ms).
          12px mono caps in gold, auto-fade. */}
      {captionText && (
        <motion.p
          className="font-mono uppercase tracking-[0.28em] text-center font-bold"
          style={{
            fontSize: 12,
            color,
            textShadow: `0 0 12px ${color}88`,
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.7,
            times: [0, 0.25, 0.75, 1],
          }}
        >
          {captionText}
        </motion.p>
      )}
    </div>
  );
}
