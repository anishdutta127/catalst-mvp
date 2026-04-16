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
 * S08 — The Forge (enriched)
 *
 * CSS 3D crystal animation with perspective transform.
 * Phase 1 (0-2s): Crystal floats, slow rotate
 * Phase 2 (2-5s): Crystal descends toward forge glow
 * Phase 3 (5-7s): Crystal hits forge, gold particle burst
 * Phase 4 (7-8s): Particles settle, transition glow
 *
 * Sequencing contract unchanged from Gate 5.
 */

const MIN_MS = { ab: 8000, c: 3000 };
const TIMEOUT_MS = 30000;
const POLL_MS = 500;

type ForgePhase = 'float' | 'descend' | 'burst' | 'settle' | 'waiting' | 'complete';

export function S08Forge() {
  const matchedIdeas = useJourneyStore((s) => s.matchedIdeas);
  const ideaMode = useJourneyStore((s) => s.ideaMode);
  const crystalOrbs = useJourneyStore((s) => s.crystalOrbs);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [phase, setPhase] = useState<ForgePhase>('float');
  const [progress, setProgress] = useState(0);
  const mountTime = useRef(Date.now());
  const hasRun = useRef(false);
  const hasAdvanced = useRef(false);

  const minMs = ideaMode === 'shortcut' ? MIN_MS.c : MIN_MS.ab;

  // Cedric is SILENT during phases 1-3. Only speaks at settle.
  useEffect(() => {
    // Phase timeline
    const phases = [
      { at: 0.0, phase: 'float' as const },
      { at: 0.25, phase: 'descend' as const },
      { at: 0.65, phase: 'burst' as const },
      { at: 0.85, phase: 'settle' as const },
    ];

    const interval = setInterval(() => {
      const elapsed = Date.now() - mountTime.current;
      const pct = Math.min(elapsed / minMs, 1);
      setProgress(pct);
      for (const p of phases) {
        if (pct >= p.at) setPhase(p.phase);
      }
      if (pct >= 1) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [minMs]);

  // Engine check + poll (same sequencing contract as before)
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
        } catch { /* timeout fallback handles it */ }
      }, 0);
    }

    const poll = setInterval(() => {
      const current = useJourneyStore.getState();
      const elapsed = Date.now() - mountTime.current;

      if (current.matchedIdeas) {
        clearInterval(poll);
        if (elapsed >= minMs) doAdvance();
        else setTimeout(() => doAdvance(), minMs - elapsed);
        return;
      }

      if (elapsed >= minMs && phase !== 'waiting') {
        setPhase('waiting');
        enqueueMessage({ speaker: 'cedric', text: 'Almost there...', type: 'dialogue' });
      }

      if (elapsed >= TIMEOUT_MS) {
        clearInterval(poll);
        try {
          const s = useJourneyStore.getState();
          const p = buildForgeProfile(s);
          const r = finalRun(p);
          useJourneyStore.setState({ matchedIdeas: r.pipeline, houseId: r.house });
        } catch { /* emergency */ }
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
  const constellationScale = phase === 'burst' || phase === 'settle' || phase === 'complete' ? 0.3 : 1;
  const constellationOpacity = phase === 'complete' ? 0 : 1;

  return (
    <div className="flex flex-col items-center justify-center h-full relative" style={{ perspective: '600px' }}>
      {/* Constellation — user's 3 crystal orbs as glowing dots in triangle */}
      <motion.div
        data-testid="forge-crystal"
        animate={{
          scale: constellationScale,
          opacity: constellationOpacity,
          rotateY: phase === 'float' || phase === 'descend' ? 360 : 0,
        }}
        transition={{
          scale: { duration: 0.8 },
          opacity: { duration: 0.5 },
          rotateY: { duration: 8, repeat: phase === 'float' || phase === 'descend' ? Infinity : 0, ease: 'linear' },
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <svg viewBox="0 0 120 110" width="160" height="145">
          {/* Connecting lines */}
          <motion.line x1="60" y1="15" x2="20" y2="90" stroke={orbColors[0] || '#D4A843'} strokeWidth="1.5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} opacity="0.5" />
          <motion.line x1="60" y1="15" x2="100" y2="90" stroke={orbColors[1] || '#D4A843'} strokeWidth="1.5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 1 }} opacity="0.5" />
          <motion.line x1="20" y1="90" x2="100" y2="90" stroke={orbColors[2] || '#D4A843'} strokeWidth="1.5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 1.5 }} opacity="0.5" />
          {/* Orb dots — appear one by one */}
          {orbColors.map((color, i) => {
            const positions = [{ cx: 60, cy: 15 }, { cx: 20, cy: 90 }, { cx: 100, cy: 90 }];
            const pos = positions[i] || positions[0];
            return (
              <motion.circle key={i} cx={pos.cx} cy={pos.cy} r="10" fill={color}
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.8, scale: 1 }}
                transition={{ delay: i * 0.8, duration: 0.5 }}>
                <animate attributeName="r" values="9;11;9" dur="2s" repeatCount="indefinite" />
              </motion.circle>
            );
          })}
          {/* Center glow */}
          <circle cx="60" cy="65" r="5" fill="#D4A843" opacity="0.4">
            <animate attributeName="r" values="4;7;4" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>
      </motion.div>

      {/* Particle stars around constellation */}
      {(phase === 'descend' || phase === 'burst') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * 360;
            const rad = (angle * Math.PI) / 180;
            const dist = 60 + Math.random() * 60;
            return (
              <motion.div key={i}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: [0, 0.8, 0] }}
                transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
                className="absolute w-1 h-1 rounded-full bg-gold"
              />
            );
          })}
        </div>
      )}

      {/* Forge glow (bottom) */}
      <motion.div
        animate={{ opacity: phase === 'descend' || phase === 'burst' ? 0.5 : 0.15 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, #D4A84340 0%, transparent 70%)' }}
      />

      <ScreenQuote screen="s08" />

      {/* Phase label */}
      <div data-testid="forge-phase" className="absolute bottom-8 text-center">
        <p className="text-[10px] font-mono text-ivory/30 uppercase tracking-widest">
          {phase === 'float' && 'Gathering instincts...'}
          {phase === 'descend' && 'Forming connections...'}
          {phase === 'burst' && 'Crystallizing...'}
          {phase === 'settle' && 'Almost ready...'}
          {phase === 'waiting' && 'Almost there...'}
          {phase === 'complete' && ''}
        </p>

        {/* Progress bar */}
        <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden mx-auto mt-2">
          <motion.div
            className="h-full rounded-full bg-gold"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
