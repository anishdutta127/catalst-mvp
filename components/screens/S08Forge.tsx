'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';

/**
 * S08 — The Forge
 *
 * SEQUENCING CONTRACT (non-negotiable):
 *
 *   On mount: start animation timeline independently. Check matchedIdeas.
 *   1. If matchedIdeas already populated (preload from S07): hold until
 *      animation minimum (8s Path A/B, 3s Path C), then advance to S09.
 *   2. If matchedIdeas empty: call finalRun() async. Poll store every 500ms.
 *      - Results arrive before animation ends: hold until minimum, then advance.
 *      - Animation ends, not ready: loop last phase, show "Almost there..."
 *      - 30s total elapsed, still no results: trigger Level 3 fallback, advance.
 *
 *   KEY INVARIANT: S09 NEVER mounts without matchedIdeas in store.
 *   S08 is the gatekeeper. Enforce with guard.
 */

const MIN_ANIMATION_MS = { ab: 8000, c: 3000 };
const TIMEOUT_MS = 30000;
const POLL_MS = 500;

type ForgePhase = 'gathering' | 'forming' | 'crystallizing' | 'waiting' | 'complete';

export function S08Forge() {
  const matchedIdeas = useJourneyStore((s) => s.matchedIdeas);
  const houseId = useJourneyStore((s) => s.houseId);
  const ideaMode = useJourneyStore((s) => s.ideaMode);
  const setMatchedIdeas = useJourneyStore((s) => s.setMatchedIdeas);
  const setHouseId = useJourneyStore((s) => s.setHouseId);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [phase, setPhase] = useState<ForgePhase>('gathering');
  const [progress, setProgress] = useState(0);
  const mountTime = useRef(Date.now());
  const hasRun = useRef(false);
  const hasAdvanced = useRef(false);

  const minMs = ideaMode === 'shortcut' ? MIN_ANIMATION_MS.c : MIN_ANIMATION_MS.ab;

  // ── Cedric line on mount ──
  useEffect(() => {
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s08.cedric.line1,
      type: 'dialogue',
    });
  }, [enqueueMessage]);

  // ── Animation timeline (independent of engine) ──
  useEffect(() => {
    const phases: { phase: ForgePhase; at: number }[] = [
      { phase: 'gathering', at: 0 },
      { phase: 'forming', at: 0.3 },
      { phase: 'crystallizing', at: 0.6 },
    ];

    const interval = setInterval(() => {
      const elapsed = Date.now() - mountTime.current;
      const pct = Math.min(elapsed / minMs, 1);
      setProgress(pct);

      // Advance through phases
      for (const p of phases) {
        if (pct >= p.at) setPhase(p.phase);
      }

      if (pct >= 1) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [minMs]);

  // ── Engine check + poll loop ──
  useEffect(() => {
    if (hasAdvanced.current) return;

    // If ideas already in store (preload from S07), just wait for animation
    if (matchedIdeas) {
      const waitForAnimation = () => {
        const elapsed = Date.now() - mountTime.current;
        if (elapsed >= minMs) {
          doAdvance();
        } else {
          setTimeout(waitForAnimation, 200);
        }
      };
      waitForAnimation();
      return;
    }

    // Ideas not in store — fire finalRun if not already fired
    if (!hasRun.current) {
      hasRun.current = true;
      const state = useJourneyStore.getState();
      const profile = buildForgeProfile(state);

      // Fire async
      setTimeout(() => {
        try {
          const result = finalRun(profile);
          useJourneyStore.setState({
            matchedIdeas: result.pipeline,
            houseId: result.house,
          });
        } catch (err) {
          console.error('[S08] finalRun failed, Level 3 will be triggered by timeout');
        }
      }, 0);
    }

    // Poll for results
    const poll = setInterval(() => {
      const current = useJourneyStore.getState();
      const elapsed = Date.now() - mountTime.current;

      if (current.matchedIdeas) {
        // Results arrived — wait for animation minimum
        clearInterval(poll);
        if (elapsed >= minMs) {
          doAdvance();
        } else {
          setPhase('crystallizing');
          setTimeout(() => doAdvance(), minMs - elapsed);
        }
        return;
      }

      // Animation ended but no results yet
      if (elapsed >= minMs && phase !== 'waiting') {
        setPhase('waiting');
        enqueueMessage({
          speaker: 'cedric',
          text: 'Almost there...',
          type: 'dialogue',
        });
      }

      // 30s timeout — Level 3 fallback
      if (elapsed >= TIMEOUT_MS) {
        clearInterval(poll);
        console.error('[S08] 30s timeout — triggering Level 3 fallback');
        try {
          const state2 = useJourneyStore.getState();
          const profile2 = buildForgeProfile(state2);
          const result = finalRun(profile2);
          useJourneyStore.setState({
            matchedIdeas: result.pipeline,
            houseId: result.house,
          });
        } catch {
          // finalRun has its own Level 3 inside — this should never fail
          // but if it does, create minimal safe state
          console.error('[S08] Even Level 3 fallback failed — emergency state');
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

    // Final guard: ensure matchedIdeas exists before advancing
    const state = useJourneyStore.getState();
    if (!state.matchedIdeas) {
      console.error('[S08] GUARD: advancing without matchedIdeas — should not happen');
      return;
    }

    setPhase('complete');
    enqueueMessage({
      speaker: 'cedric',
      text: lines.s08.cedric.line2,
      type: 'dialogue',
    });
    enqueueMessage({
      speaker: 'pip',
      text: lines.s08.pip.whisper,
      type: 'dialogue',
    });

    setTimeout(() => advanceScreen(), 1000);
  }

  // ── Animation visuals ──
  const phaseColors: Record<ForgePhase, string> = {
    gathering: '#2563EB',
    forming: '#D4A843',
    crystallizing: '#F59E0B',
    waiting: '#F59E0B',
    complete: '#D4A843',
  };

  const pulseScale = phase === 'waiting' ? [1, 1.08, 1] : phase === 'complete' ? 1.1 : 1;

  return (
    <div className="flex flex-col items-center justify-center gap-8 h-full text-center">
      {/* Crystal orb animation */}
      <motion.div
        animate={{
          scale: pulseScale,
          boxShadow: `0 0 ${progress * 40 + 10}px ${phaseColors[phase]}60`,
        }}
        transition={{
          scale: { duration: 1.5, repeat: phase === 'waiting' ? Infinity : 0, ease: 'easeInOut' },
          boxShadow: { duration: 0.5 },
        }}
        data-testid="forge-crystal"
        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-2 flex items-center justify-center"
        style={{
          borderColor: phaseColors[phase],
          background: `radial-gradient(circle at 40% 35%, ${phaseColors[phase]}30, ${phaseColors[phase]}08)`,
        }}
      >
        <motion.span
          className="text-4xl"
          animate={{ rotate: phase === 'crystallizing' || phase === 'waiting' ? 360 : 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          {phase === 'complete' ? '✨' : '💎'}
        </motion.span>
      </motion.div>

      {/* Phase label */}
      <div className="flex flex-col gap-1" data-testid="forge-phase">
        <p className="text-xs font-mono text-ivory/30 uppercase tracking-widest">
          {phase === 'gathering' && 'Gathering instincts...'}
          {phase === 'forming' && 'Forming connections...'}
          {phase === 'crystallizing' && 'Crystallizing ideas...'}
          {phase === 'waiting' && 'Almost there...'}
          {phase === 'complete' && 'Ready.'}
        </p>

        {/* Progress bar */}
        <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: phaseColors[phase] }}
            animate={{ width: `${Math.min(progress * 100, 100)}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </div>
  );
}
