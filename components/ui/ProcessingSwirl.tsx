'use client';

import { motion } from 'framer-motion';

interface ProcessingSwirlProps {
  /** Particle + glow color. Defaults to garden gold. */
  color?: string;
  /** Optional shimmer caption below the swirl. Replaced by the milestone-
   *  complete tagline when `milestoneLabel` is set. */
  caption?: string;
  /** Emoji shown as the badge in the centre of the swirl. When omitted, a
   *  default glowing orb takes its place. */
  milestoneIcon?: string;
  /** When set, the badge gets a "{label} complete" celebration tagline +
   *  more dramatic entry — used only on screens that finish a milestone. */
  milestoneLabel?: string;
}

/**
 * ProcessingSwirl — the standard "your selections are being processed" outro.
 *
 * Visual = central badge (milestone emoji or glowing orb) wrapped in a
 * pulsing ring + outer aura + orbiting particles. Used at the end of every
 * activity screen so the user sees motion, not a frozen activity.
 *
 * The badge is the focal point. The swirl is supporting motion around it.
 */

const ORBIT_PARTICLES = [
  { radius: 70, duration: 1.5,  size: 3.0, delay: 0,    startAngle: 0 },
  { radius: 58, duration: 1.2,  size: 2.5, delay: 0.06, startAngle: 60 },
  { radius: 48, duration: 0.95, size: 2.2, delay: 0.12, startAngle: 120 },
  { radius: 78, duration: 1.8,  size: 2.0, delay: 0.18, startAngle: 180 },
  { radius: 64, duration: 1.35, size: 2.8, delay: 0.24, startAngle: 240 },
  { radius: 52, duration: 1.05, size: 2.4, delay: 0.30, startAngle: 300 },
  { radius: 84, duration: 2.0,  size: 1.8, delay: 0.36, startAngle: 30 },
  { radius: 42, duration: 0.85, size: 2.0, delay: 0.42, startAngle: 210 },
];

export function ProcessingSwirl({
  color = '#D4A843',
  caption,
  milestoneIcon,
  milestoneLabel,
}: ProcessingSwirlProps) {
  const taglineText = milestoneLabel ? `${milestoneLabel} complete` : caption;
  const isCelebration = !!milestoneLabel;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative" style={{ width: 180, height: 180 }}>
        {/* Outer aura — quick breathing halo */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${color}33 0%, ${color}00 65%)` }}
          animate={{ scale: [1, 1.22, 1], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Inner ring pulse */}
        <motion.div
          className="absolute top-1/2 left-1/2 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 96,
            height: 96,
            border: `1px solid ${color}66`,
            boxShadow: `inset 0 0 22px ${color}44`,
          }}
          animate={{ scale: [0.85, 1.12, 0.85], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Orbiting particles */}
        {ORBIT_PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2"
            style={{ width: 0, height: 0 }}
            initial={{ rotate: p.startAngle }}
            animate={{ rotate: p.startAngle + 360 }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: p.delay,
            }}
          >
            <motion.div
              className="absolute rounded-full"
              style={{
                width: p.size * 2,
                height: p.size * 2,
                top: -p.radius - p.size,
                left: -p.size,
                background: color,
                boxShadow: `0 0 ${p.size * 4}px ${color}`,
              }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] }}
              transition={{
                duration: p.duration / 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: p.delay,
              }}
            />
          </motion.div>
        ))}

        {/* CENTRAL BADGE — milestone emoji takes the focal point. Falls back
            to a plain glowing orb when no icon is supplied. */}
        {milestoneIcon ? (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none flex items-center justify-center"
            initial={
              isCelebration
                ? { scale: 0.15, opacity: 0, rotate: -30 }
                : { scale: 0.6, opacity: 0 }
            }
            animate={
              isCelebration
                ? {
                    scale: [0.15, 1.45, 0.95, 1.15, 1.05],
                    opacity: 1,
                    rotate: [-30, 12, -4, 4, 0],
                  }
                : { scale: 1, opacity: 1 }
            }
            transition={
              isCelebration
                ? { duration: 0.75, ease: 'easeOut', times: [0, 0.4, 0.6, 0.85, 1] }
                : { type: 'spring', stiffness: 280, damping: 22 }
            }
            style={{
              width: 80,
              height: 80,
              fontSize: 52,
              filter: `drop-shadow(0 0 16px ${color}cc) drop-shadow(0 0 32px ${color}55)`,
            }}
          >
            <span>{milestoneIcon}</span>
          </motion.div>
        ) : (
          <motion.div
            className="absolute top-1/2 left-1/2 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 44,
              height: 44,
              background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 55%, ${color}99 100%)`,
              boxShadow: `0 0 40px ${color}, 0 0 80px ${color}66`,
            }}
            animate={{ scale: [1, 1.22, 1] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {taglineText && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{
            opacity: isCelebration ? 1 : [0.45, 1, 0.45],
            y: 0,
          }}
          transition={
            isCelebration
              ? { delay: 0.5, duration: 0.3 }
              : { duration: 1.0, repeat: Infinity, ease: 'easeInOut' }
          }
          className={`text-[11px] tracking-[0.28em] uppercase ${isCelebration ? 'font-bold' : 'italic'}`}
          style={{
            color: isCelebration ? color : `${color}cc`,
            textShadow: isCelebration ? `0 0 12px ${color}88` : undefined,
          }}
        >
          {taglineText}
        </motion.p>
      )}
    </div>
  );
}
