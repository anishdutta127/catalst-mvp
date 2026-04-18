'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
import { ScreenQuote } from '@/components/ui/ScreenQuote';
import { Crystal } from '@/components/ui/Crystal';

/**
 * S08 — The Forge.
 *
 * Pokemon-evolution transition. The user's crystal (their 3-orb bipyramid
 * forged on S06) sits ALONE center-screen — no surrounding dock, no ring
 * of other orbs. Over ~6.5s it glows brighter and brighter, peaks, then
 * bursts into three shooting particles that hand off to S09's idea reveal.
 *
 * The gem itself is the shared <Crystal/> component (same one S06 renders
 * inside its viewport). S08 wraps it with its own halo/flash/particle
 * overlays so the stage ceremony reads as S08's moment, not a reuse of S06.
 *
 * Stages (time-gated):
 *   forming  0.0–1.5s  — gem renders in idle mode
 *   glowing  1.5–4.0s  — outer halo grows, breathing halo intensifies
 *   peak     4.0–5.5s  — halo floods viewport, gem lifts and brightens
 *   burst    5.5–6.5s  — flash + 3 particles shoot out, gem fades
 *   advance  6.8s+     — nav to S09
 *
 * Safety net: scoring pipeline runs once, polls every 400ms for matchedIdeas,
 * with a 15s hard timeout that re-runs the pipeline and forces advance so
 * the user never gets stuck on this screen.
 */

// Capitalized orb-ID → hex map. Matches `lines.s06.orbs[].id` casing so
// crystalOrbs (stored in capitalized form by S06) maps correctly.
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

const TIMEOUT_MS = 15000;
const POLL_MS = 400;

type ForgeStage = 'forming' | 'glowing' | 'peak' | 'burst';

export function S08Forge() {
  const matchedIdeas = useJourneyStore((s) => s.matchedIdeas);
  const crystalOrbs = useJourneyStore((s) => s.crystalOrbs);
  const advanceScreen = useJourneyStore((s) => s.advanceScreen);
  const enqueueMessage = useUIStore((s) => s.enqueueMessage);

  const [stage, setStage] = useState<ForgeStage>('forming');
  const mountTime = useRef(Date.now());
  const hasRun = useRef(false);
  const hasAdvanced = useRef(false);
  const introSent = useRef(false);

  // Cedric's opening line on mount so the ceremony has a voice.
  useEffect(() => {
    if (introSent.current) return;
    introSent.current = true;
    enqueueMessage({ speaker: 'cedric', text: lines.s08.cedric.line1, type: 'instruction' });
  }, [enqueueMessage]);

  // Stage choreography — fixed time windows. Independent of scoring readiness
  // so the visual rhythm is consistent; scoring safety net handles advance.
  useEffect(() => {
    const t1 = setTimeout(() => setStage('glowing'), 1500);
    const t2 = setTimeout(() => setStage('peak'), 4000);
    const t3 = setTimeout(() => setStage('burst'), 5500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Run the scoring pipeline once, then poll until results land. 15s timeout
  // re-runs pipeline as a safety net + force-advances regardless.
  useEffect(() => {
    if (hasAdvanced.current) return;

    if (matchedIdeas) {
      // If already computed, just wait for burst → advance timing.
      const t = setTimeout(() => doAdvance(), 6800 - (Date.now() - mountTime.current));
      return () => clearTimeout(t);
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
        // Hold for the burst stage to finish if we're still early.
        if (elapsed >= 6800) doAdvance();
        else setTimeout(doAdvance, 6800 - elapsed);
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
          /* emergency — user still gets advanced */
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

    enqueueMessage({ speaker: 'cedric', text: lines.s08.cedric.line2, type: 'dialogue' });
    setTimeout(() => {
      enqueueMessage({ speaker: 'pip', text: lines.s08.pip.whisper, type: 'dialogue' });
    }, 850);
    setTimeout(() => advanceScreen(), 600);
  }

  // Resolve the selected orb colors from capitalized orb IDs in the store.
  const selectedColors = useMemo(
    () =>
      crystalOrbs
        .map((id) => ORB_COLORS[id])
        .filter((c): c is string => Boolean(c)),
    [crystalOrbs],
  );
  const primaryColor = selectedColors[0] || '#D4A843';

  // Stage-driven crystal scale/opacity. Lifts into peak, collapses on burst.
  const crystalScale =
    stage === 'forming' ? 0.9 : stage === 'glowing' ? 1.0 : stage === 'peak' ? 1.15 : 0.6;
  const crystalOpacity = stage === 'burst' ? 0 : 1;

  // Outer halo scale grows dramatically through stages. Rendered as a DOM
  // radial-gradient so it can stretch beyond the viewport without clipping.
  const haloScale =
    stage === 'forming' ? 0.7 : stage === 'glowing' ? 1.1 : stage === 'peak' ? 2.0 : 1.6;
  const haloOpacity =
    stage === 'forming' ? 0.25 : stage === 'glowing' ? 0.45 : stage === 'peak' ? 0.75 : 0.2;

  return (
    <div className="flex items-center justify-center h-full relative overflow-hidden">
      {/* Backdrop radial — subtle ambient light in the primary color. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: stage === 'burst' ? 0 : 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${primaryColor}2A 0%, transparent 60%)`,
        }}
      />

      {/* Outer halo — grows through stages, floods at peak. Sits BEHIND the
          crystal (z-order via source position). */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 360,
          height: 360,
          background: `radial-gradient(circle, ${primaryColor}88 0%, ${primaryColor}33 40%, ${primaryColor}00 72%)`,
          filter: 'blur(16px)',
        }}
        animate={{
          scale: haloScale,
          opacity: haloOpacity,
        }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />

      {/* The crystal itself — shared component, centered. S08 drives its
          entrance + exit via the scale/opacity wrappers above; Crystal's
          own idle rotation + float keep it alive between stages. */}
      <motion.div
        className="relative"
        animate={{
          scale: crystalScale,
          opacity: crystalOpacity,
        }}
        transition={{
          scale: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.8, ease: 'easeOut' },
        }}
      >
        <Crystal
          orbs={selectedColors.length > 0 ? selectedColors : [primaryColor]}
          count={3}
          mode="idle"
          size={300}
          floatIntensity={0.6}
        />
      </motion.div>

      {/* Burst particles — 3 shooting in 3 directions on burst stage.
          These visually become the three matched ideas on S09. */}
      <AnimatePresence>
        {stage === 'burst' && (
          <motion.div
            key="burst-particles"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {(selectedColors.length > 0 ? selectedColors : [primaryColor, primaryColor, primaryColor]).slice(0, 3).map((c, i) => {
              const angle = (i / 3) * 360 - 90; // start at top, evenly spaced
              const rad = (angle * Math.PI) / 180;
              const dist = 260;
              return (
                <motion.div
                  key={`burst-${i}`}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(rad) * dist,
                    y: Math.sin(rad) * dist,
                    opacity: [1, 1, 0],
                    scale: [1, 1.5, 0.5],
                  }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="absolute w-4 h-4 rounded-full"
                  style={{
                    background: c,
                    boxShadow: `0 0 14px ${c}, 0 0 28px ${c}80`,
                  }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final flash — bright full-screen radial that covers the hand-off */}
      <AnimatePresence>
        {stage === 'burst' && (
          <motion.div
            key="flash"
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.95, 0] }}
            transition={{ duration: 1.2, times: [0, 0.3, 1], ease: 'easeOut' }}
            style={{
              background: `radial-gradient(circle at 50% 50%, ${primaryColor}ee 0%, ${primaryColor}66 30%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Ambient status caption — fades per stage */}
      <motion.p
        className="absolute bottom-24 left-0 right-0 text-center text-[11px] font-mono uppercase tracking-[0.3em] text-ivory/50 pointer-events-none"
        animate={{
          opacity:
            stage === 'forming'
              ? 0.7
              : stage === 'glowing'
              ? 0.85
              : stage === 'peak'
              ? 0.9
              : 0,
        }}
        transition={{ duration: 0.6 }}
      >
        {stage === 'forming' && 'Cedric is weighing the vows…'}
        {stage === 'glowing' && 'The crystal remembers your instincts…'}
        {stage === 'peak' && 'Three paths are crystallising.'}
      </motion.p>

      <ScreenQuote screen="s08" />
    </div>
  );
}
