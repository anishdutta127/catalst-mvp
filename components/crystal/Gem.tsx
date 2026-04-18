'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

const ORB_COLORS: Record<string, string> = {
  Grit:      '#F59E0B',
  Vision:    '#EAB308',
  Craft:     '#CD7F32',
  Influence: '#A855F7',
  Empathy:   '#14B8A6',
  Analysis:  '#38BDF8',
  Freedom:   '#E2E8F0',
  Stability: '#22C55E',
};

export interface GemProps {
  /** 0-3 orb ids selected so far. Filters out empty strings. */
  pickedOrbs: string[];
  /** Pixel size of the gem (width = height). Default 240. */
  size?: number;
  /** When true, gem rotates continuously (use on forge/loading screen). */
  spinning?: boolean;
  /** Optional className for the wrapping div. */
  className?: string;
}

/**
 * Progressive gem that builds as user selects orbs.
 *   0 picked → faint outline
 *   1 picked → primary color fills, first facets appear
 *   2 picked → blended color, full facet grid
 *   3 picked → inner hexagon heart + pulsing ring
 * Colors derive from the user's actual orb picks, so every user's gem is unique.
 */
export function Gem({
  pickedOrbs,
  size = 240,
  spinning = false,
  className = '',
}: GemProps) {
  const filled = pickedOrbs.filter(Boolean);
  const stage = Math.min(filled.length, 3) as 0 | 1 | 2 | 3;

  const colors = useMemo(() => {
    const mapped = filled.map((o) => ORB_COLORS[o]).filter(Boolean);
    if (mapped.length === 0) return ['#64748b', '#64748b', '#64748b'];
    const out = [...mapped];
    while (out.length < 3) out.push(out[out.length - 1]);
    return out;
  }, [filled.join('|')]);

  const [c1, c2, c3] = colors;
  const fillOpacity = [0.15, 0.5, 0.75, 0.95][stage];
  const glowScale = [0.35, 0.6, 0.85, 1.0][stage];

  // Stable per-instance gradient ids so multiple gems on screen don't collide
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Radial glow — the ONLY backdrop. No extra decorative circles. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${c1}66 0%, ${c2}22 38%, transparent 68%)`,
          filter: 'blur(28px)',
          transform: `scale(${glowScale})`,
          transition: 'transform 0.8s ease-out, background 0.8s ease-out',
        }}
      />

      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="relative"
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={
          spinning
            ? { duration: 14, repeat: Infinity, ease: 'linear' }
            : { duration: 0.6 }
        }
      >
        <defs>
          <linearGradient id={`gem-fill-${uid}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor={c1} stopOpacity={fillOpacity} />
            <stop offset="50%" stopColor={c2} stopOpacity={fillOpacity * 0.85} />
            <stop offset="100%" stopColor={c3} stopOpacity={fillOpacity} />
          </linearGradient>
          <linearGradient id={`gem-highlight-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.45" />
            <stop offset="45%" stopColor="white" stopOpacity="0.12" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Chamfered-square base — the gem shape */}
        <motion.path
          d="M 50 20 L 150 20 L 180 50 L 180 150 L 150 180 L 50 180 L 20 150 L 20 50 Z"
          fill={`url(#gem-fill-${uid})`}
          stroke={c1}
          strokeWidth="1.5"
          strokeOpacity={0.55}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />

        {/* Stage 1+ : cross facets */}
        {stage >= 1 && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <line x1="100" y1="20" x2="100" y2="180" stroke={c1} strokeWidth="0.6" />
            <line x1="20" y1="100" x2="180" y2="100" stroke={c2} strokeWidth="0.6" />
          </motion.g>
        )}

        {/* Stage 2+ : diagonal facets */}
        {stage >= 2 && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <line x1="20" y1="50" x2="180" y2="150" stroke={c2} strokeWidth="0.5" />
            <line x1="180" y1="50" x2="20" y2="150" stroke={c3} strokeWidth="0.5" />
            <line x1="50" y1="20" x2="150" y2="180" stroke={c1} strokeWidth="0.4" strokeOpacity="0.6" />
            <line x1="150" y1="20" x2="50" y2="180" stroke={c3} strokeWidth="0.4" strokeOpacity="0.6" />
          </motion.g>
        )}

        {/* Stage 3 : inner hexagon "heart" */}
        {stage >= 3 && (
          <motion.g
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'backOut' }}
          >
            <polygon
              points="100,55 138,77 138,123 100,145 62,123 62,77"
              fill="white"
              fillOpacity="0.1"
              stroke={c3}
              strokeWidth="0.8"
              strokeOpacity="0.55"
            />
            <polygon
              points="100,72 125,86 125,114 100,128 75,114 75,86"
              fill={c3}
              fillOpacity="0.3"
            />
          </motion.g>
        )}

        {/* Highlight reflection — top-left catch-light */}
        {stage >= 1 && (
          <motion.path
            d="M 45 30 L 88 30 L 72 62 L 28 62 Z"
            fill={`url(#gem-highlight-${uid})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          />
        )}

        {/* Stage 3 : pulsing ring */}
        {stage >= 3 && (
          <motion.circle
            cx="100"
            cy="100"
            r="95"
            fill="none"
            stroke={c2}
            strokeWidth="1"
            initial={{ opacity: 0.6, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.12 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.svg>
    </div>
  );
}
