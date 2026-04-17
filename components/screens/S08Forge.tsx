'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
import { ScreenQuote } from '@/components/ui/ScreenQuote';

const ORB_COLORS: Record<string, string> = {
  Grit: '#F59E0B', Vision: '#F0D060', Craft: '#CD7F32', Influence: '#9B59B6',
  Empathy: '#00D8B9', Analysis: '#5DADE2', Freedom: '#BDC3C7', Stability: '#27AE60',
};

/**
 * S08 — The Forge (rebuilt).
 *
 * Fixes vs previous:
 *   - Crystal GROWS and intensifies instead of shrinking to 0.3 scale.
 *   - Horizontal white progress bar removed (was reading as "white line").
 *   - Phase label text removed from bottom (was adding clutter).
 *   - minMs reduced: 4000 for ab path, 2000 for c path.
 *   - Uses user's personalized orb colors for the crystal constellation.
 */

const MIN_MS = { ab: 4000, c: 2000 };
const TIMEOUT_MS = 15000;
const POLL_MS = 400;

type ForgePhase = 'awaken' | 'pulse' | 'bloom' | 'complete';

export function S08Forge() {
  const matchedIdeas = useJourneyStore((s) => s.matchedIdeas);
  const ideaMode = useJourneyStore((s) => s.ideaMode);
  const crystalOrbs = useJourneyStore((s) => s.crystalOrbs);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [phase, setPhase] = useState<ForgePhase>('awaken');
  const mountTime = useRef(Date.now());
  const hasRun = useRef(false);
  const hasAdvanced = useRef(false);

  const minMs = ideaMode === 'shortcut' ? MIN_MS.c : MIN_MS.ab;

  useEffect(() => {
    const phases: { at: number; phase: ForgePhase }[] = [
      { at: 0.0, phase: 'awaken' },
      { at: 0.4, phase: 'pulse' },
      { at: 0.8, phase: 'bloom' },
    ];

    const interval = setInterval(() => {
      const elapsed = Date.now() - mountTime.current;
      const pct = Math.min(elapsed / minMs, 1);
      for (const p of phases) {
        if (pct >= p.at) setPhase(p.phase);
      }
      if (pct >= 1) clearInterval(interval);
    }, 60);

    return () => clearInterval(interval);
  }, [minMs]);

  useEffect(() => {
    if (hasAdvanced.current) return;

    if (matchedIdeas) {
      const wait = () => {
        if (Date.now() - mountTime.current >= minMs) doAdvance();
        else setTimeout(wait, 200);
      };
      wait();
      return;
    }

    if (!hasRun.current) {
      hasRun.current = true;
      const state = useJourneyStore.getState();
      const profile = buildForgeProfile(state);
      setTimeout(() => {
        try {
          const result = finalRun(profile);
          useJourneyStore.setState({ matchedIdeas: result.pipeline, houseId: result.house });
        } catch {
          /* timeout fallback handles it */
        }
      }, 0);
    }

    const poll = setInterval(() => {
      const current = useJourneyStore.getState();
      const elapsed = Date.now() - mountTime.current;

      if (current.matchedIdeas) {
        clearInterval(poll);
        if (elapsed >= minMs) doAdvance();
        else setTimeout(doAdvance, minMs - elapsed);
        return;
      }

      if (elapsed >= TIMEOUT_MS) {
        clearInterval(poll);
        try {
          const s = useJourneyStore.getState();
          const p = buildForgeProfile(s);
          const r = finalRun(p);
          useJourneyStore.setState({ matchedIdeas: r.pipeline, houseId: r.house });
        } catch {
          /* emergency */
        }
        doAdvance();
      }
    }, POLL_MS);

    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedIdeas]);

  function doAdvance() {
    if (hasAdvanced.current) return;
    hasAdvanced.current = true;
    const s = useJourneyStore.getState();
    if (!s.matchedIdeas) return;

    setPhase('complete');
    enqueueMessage({ speaker: 'cedric', text: lines.s08.cedric.line2, type: 'dialogue' });
    setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s08.pip.whisper, type: 'dialogue' });
    }, 800);
    setTimeout(() => advanceScreen(), 1500);
  }

  const orbColors = crystalOrbs.slice(0, 3).map((o) => ORB_COLORS[o] || '#D4A843');
  const primaryColor = orbColors[0] || '#D4A843';

  // Scale GROWS through phases. No more 0.3 shrink.
  const scaleByPhase = {
    awaken: 1.0,
    pulse: 1.25,
    bloom: 1.5,
    complete: 1.6,
  };
  const glowByPhase = {
    awaken: 20,
    pulse: 50,
    bloom: 80,
    complete: 100,
  };

  return (
    <div className="flex flex-col items-center justify-center h-full relative" style={{ perspective: '800px' }}>
      {/* Outer aura — intensifies by phase */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{
          opacity: phase === 'complete' ? 0 : 1,
        }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="rounded-full"
          animate={{
            width: [200, 260, 200],
            height: [200, 260, 200],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(circle, ${primaryColor}40 0%, ${primaryColor}00 70%)`,
          }}
        />
      </motion.div>

      {/* The crystal — grows, doesn't shrink */}
      <motion.div
        data-testid="forge-crystal"
        animate={{
          scale: scaleByPhase[phase],
          opacity: phase === 'complete' ? 0 : 1,
          rotateY: [0, 360],
        }}
        transition={{
          scale: { duration: 0.8, ease: 'easeOut' },
          opacity: { duration: 0.6 },
          rotateY: { duration: 10, repeat: Infinity, ease: 'linear' },
        }}
        style={{ transformStyle: 'preserve-3d', filter: `drop-shadow(0 0 ${glowByPhase[phase]}px ${primaryColor})` }}
      >
        <svg viewBox="0 0 140 130" width="200" height="185">
          {/* Connecting lines between orbs */}
          <motion.line
            x1="70" y1="15" x2="20" y2="100"
            stroke={orbColors[0] || '#D4A843'} strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            opacity="0.7"
          />
          <motion.line
            x1="70" y1="15" x2="120" y2="100"
            stroke={orbColors[1] || '#D4A843'} strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            opacity="0.7"
          />
          <motion.line
            x1="20" y1="100" x2="120" y2="100"
            stroke={orbColors[2] || '#D4A843'} strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            opacity="0.7"
          />

          {/* Inner crystal facets — appear on pulse */}
          {(phase === 'pulse' || phase === 'bloom') && (
            <>
              <motion.path
                d="M 70 15 L 70 60 L 20 100 Z"
                fill={orbColors[0] || '#D4A843'}
                opacity="0.2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ duration: 0.6 }}
              />
              <motion.path
                d="M 70 15 L 70 60 L 120 100 Z"
                fill={orbColors[1] || '#D4A843'}
                opacity="0.2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              <motion.path
                d="M 20 100 L 70 60 L 120 100 Z"
                fill={orbColors[2] || '#D4A843'}
                opacity="0.2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              />
            </>
          )}

          {/* Orb dots */}
          {[
            { cx: 70, cy: 15 },
            { cx: 20, cy: 100 },
            { cx: 120, cy: 100 },
          ].map((pos, i) => {
            const color = orbColors[i] || '#D4A843';
            return (
              <motion.circle
                key={i}
                cx={pos.cx}
                cy={pos.cy}
                r="11"
                fill={color}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 0.95,
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  opacity: { delay: i * 0.4 + 0.2, duration: 0.4 },
                  scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
                }}
              />
            );
          })}

          {/* Center glow — amplifies by phase */}
          <motion.circle
            cx="70"
            cy="60"
            r={phase === 'bloom' ? 12 : 6}
            fill={primaryColor}
            animate={{
              opacity: phase === 'bloom' ? [0.5, 1, 0.5] : [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>

      {/* Particle burst on bloom */}
      {phase === 'bloom' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * 360;
            const rad = (angle * Math.PI) / 180;
            const dist = 100 + Math.random() * 80;
            const delay = Math.random() * 0.8;
            return (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                }}
                transition={{ duration: 1.6, delay, repeat: Infinity, ease: 'easeOut' }}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ background: primaryColor, boxShadow: `0 0 8px ${primaryColor}` }}
              />
            );
          })}
        </div>
      )}

      <ScreenQuote screen="s08" />

      {/* NO progress bar, NO phase label text — just the crystal doing its thing */}
    </div>
  );
}
