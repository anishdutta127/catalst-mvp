'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { CrystalViewport } from '@/components/ui/CrystalViewport';
import type { OrbDef } from '@/components/ui/CrystalViewport';

/**
 * S08 — The Forge.
 *
 * Transitional ceremony: the user's crystal (their three chosen essences from
 * S06) pulses, intensifies, and blooms while the scoring engine runs in the
 * background. This is the ONE screen where the user just watches — no input.
 *
 * Visual continuity with S06: uses the same CrystalViewport + user's orbs,
 * with celebrating=true locked on so the final gem animates from first frame.
 * On top of that, the screen layers:
 *   - a massive breathing outer halo in the dominant orb's color
 *   - 8 slow-rotating dashed light beams radiating outward
 *   - a 24-particle radial burst during the bloom phase
 *   - scale + upward drift across four phases (awaken → pulse → bloom → complete)
 *
 * Phases are driven by elapsed time vs minMs; matchedIdeas arriving early
 * doesn't skip the ceremony, and a 15s timeout re-runs the pipeline as a
 * safety net so the user never gets stuck.
 */

const ORBS = lines.s06.orbs as unknown as OrbDef[];

/** Fallback colors — only used when the user somehow reached S08 without
 *  filling crystalOrbs on S06 (can happen via deep-link testing). */
const ORB_COLORS: Record<string, string> = {
  Grit: '#D4A843',
  Vision: '#F0D060',
  Craft: '#CD7F32',
  Influence: '#9B59B6',
  Empathy: '#00D8B9',
  Analysis: '#5DADE2',
  Freedom: '#BDC3C7',
  Stability: '#27AE60',
};

const MIN_MS = { ab: 4800, c: 2400 };
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
  const introSent = useRef(false);

  const minMs = ideaMode === 'shortcut' ? MIN_MS.c : MIN_MS.ab;

  // Cedric's opening line — fires ONCE on mount so the ceremony has a voice.
  useEffect(() => {
    if (introSent.current) return;
    introSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s08.cedric.line1, type: 'instruction' });
  }, [enqueueMessage]);

  // Phase driver — awaken → pulse → bloom over minMs. 60ms tick is plenty for
  // three phase thresholds.
  useEffect(() => {
    const phases: { at: number; phase: ForgePhase }[] = [
      { at: 0.0, phase: 'awaken' },
      { at: 0.38, phase: 'pulse' },
      { at: 0.78, phase: 'bloom' },
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

  // Run the scoring pipeline once, then poll until results land or timeout.
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
    }, 850);
    setTimeout(() => advanceScreen(), 1800);
  }

  // Primary color drives the halo and beams — pulled from the user's first
  // (Dominant) orb so the forge visually reflects THEIR crystal, not generic.
  const primaryColor =
    (crystalOrbs[0] && ORB_COLORS[crystalOrbs[0]]) || '#D4A843';

  // Scale + upward drift per phase. Crystal rises as it forges.
  const scaleByPhase: Record<ForgePhase, number> = {
    awaken: 0.92,
    pulse: 1.08,
    bloom: 1.22,
    complete: 1.34,
  };
  const yByPhase: Record<ForgePhase, number> = {
    awaken: 4,
    pulse: 0,
    bloom: -8,
    complete: -28,
  };
  const celebrating = phase === 'bloom' || phase === 'complete';

  return (
    <div className="flex items-center justify-center h-full relative overflow-hidden">
      {/* MASSIVE outer halo — breathes in the primary color. Fills the whole
          activity zone so the crystal feels centered in a field of light. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: phase === 'complete' ? 0 : 1,
        }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${primaryColor}3A 0%, ${primaryColor}10 38%, transparent 72%)`,
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${primaryColor}30 0%, transparent 55%)`,
          }}
        />
      </motion.div>

      {/* Slow rotating light beams — dashed lines radiating outward from
          center. Gives a sense of cosmic machinery without stealing focus. */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        style={{ opacity: phase === 'complete' ? 0 : 1, transition: 'opacity 0.8s' }}
      >
        <svg width="640" height="640" viewBox="0 0 640 640" className="overflow-visible">
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * 360;
            const rad = (angle * Math.PI) / 180;
            const cx = 320;
            const cy = 320;
            const inner = 170;
            const outer = 320;
            return (
              <line
                key={i}
                x1={cx + Math.cos(rad) * inner}
                y1={cy + Math.sin(rad) * inner}
                x2={cx + Math.cos(rad) * outer}
                y2={cy + Math.sin(rad) * outer}
                stroke={primaryColor}
                strokeWidth="1.5"
                strokeDasharray="6 12"
                opacity="0.22"
              />
            );
          })}
        </svg>
      </motion.div>

      {/* THE CRYSTAL — reuses the S06 viewport so the user recognises their
          own creation. celebrating=true locks in the burst-spoke + fast-core
          animations so the gem reads as "awakened" from first frame. */}
      <motion.div
        data-testid="forge-crystal"
        animate={{
          scale: scaleByPhase[phase],
          y: yByPhase[phase],
          opacity: phase === 'complete' ? 0 : 1,
        }}
        transition={{
          scale: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
          y: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.8, ease: 'easeOut' },
        }}
        style={{
          filter: `drop-shadow(0 0 ${40 + (phase === 'bloom' ? 40 : phase === 'pulse' ? 20 : 0)}px ${primaryColor}cc)`,
        }}
      >
        <CrystalViewport
          allOrbs={ORBS}
          selectedOrbIds={crystalOrbs}
          size={300}
          disabled={true}
          celebrating={celebrating}
        />
      </motion.div>

      {/* Bloom particle burst — 24 sparkles radiating out on reach. Each
          has randomized delay so the burst feels organic, not synchronized. */}
      <AnimatePresence>
        {celebrating && phase !== 'complete' && (
          <motion.div
            key="particles"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i / 24) * 360;
              const rad = (angle * Math.PI) / 180;
              const dist = 130 + Math.random() * 80;
              const delay = Math.random() * 1.0;
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: Math.cos(rad) * dist,
                    y: Math.sin(rad) * dist,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.8,
                    delay,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                    ease: 'easeOut',
                  }}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: primaryColor,
                    boxShadow: `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}50`,
                  }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final flash — on complete, a bright full-screen flash sells the
          moment of forging. Quick, then fades into the S09 reveal. */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            key="flash"
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0] }}
            transition={{ duration: 1.4, times: [0, 0.3, 1], ease: 'easeOut' }}
            style={{
              background: `radial-gradient(circle at 50% 50%, ${primaryColor}ee 0%, ${primaryColor}66 30%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      <ScreenQuote screen="s08" />
    </div>
  );
}
