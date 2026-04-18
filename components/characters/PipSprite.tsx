'use client';

import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';

export type PipEmotion = 'idle' | 'happy' | 'wideeye' | 'tilt' | 'shy' | 'glow';

interface PipSpriteProps {
  emotion?: PipEmotion;
  color?: string;
  size?: number;
}

/**
 * PipSprite — cute glowing seed-spirit. A luminous green sphere with big chibi
 * eyes. No body parts, no leaves. Eyes (and tiny blush) carry all expression.
 *
 * Exported as `React.memo` so re-renders of parents (chat queue, screen state)
 * don't restart Pip's breathing loop. Combined with the per-emotion useMemos
 * below, Framer Motion only sees NEW animate configs when `emotion` actually
 * changes — fixes the "flicker on every message" bug.
 */
function PipSpriteImpl({ emotion = 'idle', color = '#4ade80', size = 48 }: PipSpriteProps) {
  const uid = useMemo(() => Math.random().toString(36).slice(2, 9), []);

  const colorLight = useMemo(() => lightenColor(color, 0.6), [color]);
  const colorDark = useMemo(() => darkenColor(color, 0.5), [color]);

  // viewBox 50x50, body radius 16, eyes centered y=24, x=20 + x=30
  const eyes = useMemo(() => ({
    idle:    { rx: 4.5, ry: 4.7, pupilR: 2.2, pupilDx: 0,    pupilDy: 0 },
    happy:   { rx: 4.5, ry: 3.6, pupilR: 2.4, pupilDx: 0,    pupilDy: -0.5 },  // squint of joy + bigger pupils
    wideeye: { rx: 5.5, ry: 5.7, pupilR: 1.4, pupilDx: 0,    pupilDy: 0 },     // huge whites, tiny pupils
    tilt:    { rx: 4.5, ry: 4.7, pupilR: 2.2, pupilDx: 1.5,  pupilDy: 0.3 },   // looking sideways
    shy:     { rx: 4.5, ry: 2.0, pupilR: 1.4, pupilDx: -0.6, pupilDy: 0.6 },   // bashful squint, glance away
    glow:    { rx: 5.0, ry: 5.2, pupilR: 2.6, pupilDx: 0,    pupilDy: -0.4 },  // wide and excited
  }[emotion]), [emotion]);

  // Softer, more "Duolingo-like" body motion — gentle, never frantic.
  const bodyAnim = useMemo(() => ({
    idle:    { scale: [1, 1.04, 1], y: [0, -1.5, 0] },
    happy:   { scale: [1, 1.09, 1], y: [0, -3, 0] },
    wideeye: { scale: [1, 1.015, 1], y: [0, -0.5, 0] },
    tilt:    { scale: 1,             y: 0, rotate: [-5, 5, -5] },
    shy:     { scale: 0.94,          y: 1.5 },
    glow:    { scale: [1, 1.10, 1], y: [0, -2.5, 0] },
  }[emotion]), [emotion]);

  const bodyTransition = useMemo(() => ({
    idle:    { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const },
    happy:   { duration: 0.95, repeat: Infinity, ease: 'easeInOut' as const },
    wideeye: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const },
    tilt:    { duration: 2.0, repeat: Infinity, ease: 'easeInOut' as const },
    shy:     { duration: 0.6, ease: 'easeOut' as const },
    glow:    { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const },
  }[emotion]), [emotion]);

  const auraIntensity = emotion === 'glow' ? 1 : emotion === 'happy' ? 0.85 : emotion === 'shy' ? 0.45 : 0.7;
  const showSparkles = emotion === 'glow' || emotion === 'happy';
  const showBlush = emotion === 'shy' || emotion === 'happy';

  return (
    <motion.div
      animate={bodyAnim}
      transition={bodyTransition}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        position: 'relative',
        // Hint the compositor so transform/opacity animations don't thrash.
        willChange: 'transform, opacity',
      }}
    >
      <svg viewBox="0 0 50 50" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id={`pipBody-${uid}`} cx="38%" cy="32%">
            <stop offset="0%" stopColor={colorLight} stopOpacity="1" />
            <stop offset="55%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={colorDark} stopOpacity="1" />
          </radialGradient>
          <radialGradient id={`pipAura-${uid}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={color} stopOpacity={auraIntensity} />
            <stop offset="55%" stopColor={color} stopOpacity={auraIntensity * 0.3} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`pipShine-${uid}`} cx="32%" cy="26%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Outer aura — soft pulsing glow */}
        <motion.circle
          cx="25" cy="25" r="24"
          fill={`url(#pipAura-${uid})`}
          animate={{
            scale: emotion === 'glow' ? [1, 1.18, 1] : [1, 1.08, 1],
            opacity: emotion === 'glow' ? [0.85, 1, 0.85] : [0.7, 0.92, 0.7],
          }}
          transition={{ duration: emotion === 'glow' ? 1.4 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '25px 25px' }}
        />

        {/* Body — glowing sphere */}
        <circle cx="25" cy="25" r="16" fill={`url(#pipBody-${uid})`} />

        {/* Top-left shine highlight (gives the orb dimensionality) */}
        <ellipse cx="25" cy="25" rx="16" ry="16" fill={`url(#pipShine-${uid})`} />

        {/* Blush cheeks (shy + happy) */}
        {showBlush && (
          <>
            <ellipse cx="14.5" cy="29" rx="2.4" ry="1.6" fill="#ff8aaf" opacity="0.55" />
            <ellipse cx="35.5" cy="29" rx="2.4" ry="1.6" fill="#ff8aaf" opacity="0.55" />
          </>
        )}

        {/* Eyes — eye whites */}
        <ellipse cx="20" cy="24" rx={eyes.rx} ry={eyes.ry} fill="#ffffff" />
        <ellipse cx="30" cy="24" rx={eyes.rx} ry={eyes.ry} fill="#ffffff" />

        {/* Pupils */}
        <circle cx={20 + eyes.pupilDx} cy={24 + eyes.pupilDy} r={eyes.pupilR} fill="#0a1f0a" />
        <circle cx={30 + eyes.pupilDx} cy={24 + eyes.pupilDy} r={eyes.pupilR} fill="#0a1f0a" />

        {/* Pupil sparkles — big top-left + tiny bottom-right (the "shiny" cuteness) */}
        <circle cx={19.2 + eyes.pupilDx} cy={23.1 + eyes.pupilDy} r={Math.max(0.6, eyes.pupilR * 0.55)} fill="white" />
        <circle cx={29.2 + eyes.pupilDx} cy={23.1 + eyes.pupilDy} r={Math.max(0.6, eyes.pupilR * 0.55)} fill="white" />
        <circle cx={20.8 + eyes.pupilDx} cy={25.0 + eyes.pupilDy} r={Math.max(0.3, eyes.pupilR * 0.28)} fill="white" />
        <circle cx={30.8 + eyes.pupilDx} cy={25.0 + eyes.pupilDy} r={Math.max(0.3, eyes.pupilR * 0.28)} fill="white" />

        {/* Sparkles around body (glow/happy) */}
        {showSparkles && (
          <>
            <motion.circle
              cx="6" cy="14" r="1.2" fill="#FFF6C8"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="42" cy="18" r="1" fill="#FFF6C8"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
            <motion.circle
              cx="38" cy="40" r="0.9" fill="#FFF6C8"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
            />
            <motion.circle
              cx="10" cy="38" r="0.8" fill="#FFF6C8"
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1.5 }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
}

// Memoized export — only re-renders when emotion/color/size actually change.
export const PipSprite = memo(PipSpriteImpl);

function lightenColor(hex: string, amt: number): string {
  const { r, g, b } = parseHex(hex);
  return rgbToHex(
    Math.min(255, Math.round(r + (255 - r) * amt)),
    Math.min(255, Math.round(g + (255 - g) * amt)),
    Math.min(255, Math.round(b + (255 - b) * amt)),
  );
}
function darkenColor(hex: string, amt: number): string {
  const { r, g, b } = parseHex(hex);
  return rgbToHex(
    Math.round(r * (1 - amt)),
    Math.round(g * (1 - amt)),
    Math.round(b * (1 - amt)),
  );
}
function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}
