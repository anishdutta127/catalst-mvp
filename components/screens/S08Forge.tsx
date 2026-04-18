'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJourneyStore } from '@/lib/store/journeyStore';
import { useUIStore } from '@/lib/store/uiStore';
import { lines } from '@/content/lines';
import { finalRun } from '@/lib/scoring/orchestrator';
import { buildForgeProfile } from '@/lib/scoring/buildProfile';
import { ScreenQuote } from '@/components/ui/ScreenQuote';

/**
 * S08 — The Forge.
 *
 * Pokemon-evolution transition. The user's crystal (their 3-orb diamond from
 * S06) sits ALONE center-screen — no surrounding dock, no ring of other
 * orbs. Over ~6.5s it glows brighter and brighter, peaks, then bursts into
 * three shooting particles that hand off to S09's idea reveal.
 *
 * Stages (time-gated):
 *   forming  0.0–1.5s  — diamond renders in its S06 state
 *   glowing  1.5–4.0s  — halo grows from 1× to 2×, core pulses faster
 *   peak     4.0–5.5s  — halo floods the viewport, inner core near-white
 *   burst    5.5–6.5s  — flash + 3 particles shoot out in 3 directions
 *   advance  6.8s+     — nav to S09
 *
 * Safety net: scoring pipeline runs once, polls every 400ms for matchedIdeas,
 * with a 15s hard timeout that re-runs the pipeline and forces advance so
 * the user never gets stuck on this screen.
 */

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

// ─── Color helpers (local to S08, same logic as CrystalViewport) ─────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function blendForgeColors(orbIds: string[]): { base: string; light: string; dark: string } {
  const list = orbIds.length > 0 ? orbIds : ['Grit'];
  const weights =
    list.length === 1 ? [1] : list.length === 2 ? [0.65, 0.35] : [0.6, 0.22, 0.18];
  const rgbs = list.map((id) => hexToRgb(ORB_COLORS[id] || '#D4A843'));
  const blended = rgbs.reduce(
    (acc, c, i) => ({
      r: acc.r + c.r * weights[i],
      g: acc.g + c.g * weights[i],
      b: acc.b + c.b * weights[i],
    }),
    { r: 0, g: 0, b: 0 },
  );
  // Warmth bias — same as CrystalViewport.
  const warmR = Math.min(255, blended.r + (255 - blended.r) * 0.15 * 0.3);
  const warmG = Math.min(255, blended.g + (180 - blended.g) * 0.15 * 0.2);
  return {
    base: rgbToHex(warmR, warmG, blended.b),
    light: rgbToHex(warmR + 50, warmG + 50, blended.b + 40),
    dark: rgbToHex(warmR * 0.45, warmG * 0.45, blended.b * 0.5),
  };
}

// ─── Component ────────────────────────────────────────────────────────────

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

  const gemColors = useMemo(() => blendForgeColors(crystalOrbs), [crystalOrbs]);
  const primaryColor = (crystalOrbs[0] && ORB_COLORS[crystalOrbs[0]]) || '#D4A843';
  const orbColors = crystalOrbs.slice(0, 3).map((o) => ORB_COLORS[o] || '#D4A843');

  // Diamond geometry (matches S06 crystal proportions). viewBox 320×320,
  // center at 160,160. Width ~60, height ~90 → brilliant-cut proportions.
  const CX = 160;
  const CY = 160;
  const W = 60;
  const H = 90;

  // Halo radius per stage — grows dramatically into peak, floods at burst.
  const haloRadius =
    stage === 'forming' ? 110 : stage === 'glowing' ? 180 : stage === 'peak' ? 320 : 240;
  const haloOpacity =
    stage === 'forming' ? 0.20 : stage === 'glowing' ? 0.40 : stage === 'peak' ? 0.70 : 0.15;

  // Crystal scale per stage — lifts slightly into peak, shrinks on burst.
  const crystalScale =
    stage === 'forming' ? 0.9 : stage === 'glowing' ? 1.0 : stage === 'peak' ? 1.15 : 0.7;
  const crystalOpacity = stage === 'burst' ? 0 : 1;

  return (
    <div className="flex items-center justify-center h-full relative overflow-hidden">
      {/* Backdrop radial — subtle ambient light in the primary color. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: stage === 'burst' ? 0 : 1,
        }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${primaryColor}2A 0%, transparent 60%)`,
        }}
      />

      {/* Main diamond — standalone, no ring or orb dock around it */}
      <motion.svg
        viewBox="0 0 320 320"
        width={320}
        height={320}
        className="relative overflow-visible"
        animate={{
          scale: crystalScale,
          opacity: crystalOpacity,
        }}
        transition={{
          scale: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.8, ease: 'easeOut' },
        }}
      >
        {/* Halo — grows through stages, floods at peak */}
        <motion.circle
          cx={CX}
          cy={CY}
          fill={gemColors.base}
          animate={{
            r: haloRadius,
            opacity: haloOpacity,
          }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* Secondary breathing halo — only visible in forming/glowing */}
        {(stage === 'forming' || stage === 'glowing') && (
          <motion.circle
            cx={CX}
            cy={CY}
            r={H * 1.2}
            fill={primaryColor}
            animate={{
              opacity: [0.2, 0.45, 0.2],
              r: [H * 1.2, H * 1.5, H * 1.2],
            }}
            transition={{
              duration: stage === 'glowing' ? 1.4 : 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Rotating diamond group — slow Y-axis spin same as S06 */}
        <motion.g
          animate={{ rotateY: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: 'fill-box' }}
        >
          {/* Crown (top half) with rounded joins */}
          <path
            d={`M ${CX} ${CY - H} Q ${CX - W * 0.35} ${CY - H * 0.6} ${CX - W * 0.7} ${CY - H * 0.35} Q ${CX - W * 0.92} ${CY - H * 0.18} ${CX - W} ${CY} L ${CX + W} ${CY} Q ${CX + W * 0.92} ${CY - H * 0.18} ${CX + W * 0.7} ${CY - H * 0.35} Q ${CX + W * 0.35} ${CY - H * 0.6} ${CX} ${CY - H} Z`}
            fill={gemColors.dark}
            stroke={gemColors.light}
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Pavilion (bottom half) */}
          <path
            d={`M ${CX - W} ${CY} Q ${CX - W * 0.55} ${CY + H * 0.9} ${CX} ${CY + H * 1.2} Q ${CX + W * 0.55} ${CY + H * 0.9} ${CX + W} ${CY} Z`}
            fill={gemColors.dark}
            stroke={gemColors.light}
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Crown facet shading */}
          <path
            d={`M ${CX} ${CY - H} L ${CX - W * 0.7} ${CY - H * 0.35} L ${CX - W} ${CY} Z`}
            fill={gemColors.base}
            opacity="0.45"
          />
          <path
            d={`M ${CX} ${CY - H} L ${CX + W * 0.7} ${CY - H * 0.35} L ${CX + W} ${CY} Z`}
            fill={gemColors.light}
            opacity="0.35"
          />

          {/* Pavilion facet shading */}
          <path
            d={`M ${CX - W} ${CY} L ${CX} ${CY + H * 1.2} L ${CX} ${CY} Z`}
            fill={gemColors.base}
            opacity="0.55"
          />
          <path
            d={`M ${CX} ${CY} L ${CX} ${CY + H * 1.2} L ${CX + W} ${CY} Z`}
            fill={gemColors.light}
            opacity="0.4"
          />

          {/* Girdle line */}
          <line
            x1={CX - W}
            y1={CY}
            x2={CX + W}
            y2={CY}
            stroke={gemColors.light}
            strokeWidth="0.8"
            opacity="0.6"
          />

          {/* Sparkle highlight on crown */}
          <ellipse
            cx={CX - W * 0.2}
            cy={CY - H * 0.5}
            rx={W * 0.15}
            ry={H * 0.28}
            fill="white"
            opacity="0.35"
            transform={`rotate(-15 ${CX - W * 0.2} ${CY - H * 0.5})`}
          />

          {/* Three orb accents */}
          {orbColors.map((c, i) => {
            const positions = [
              { x: CX, y: CY - H }, // Dominant at top
              { x: CX - W, y: CY }, // Supporting at girdle-left
              { x: CX + W, y: CY }, // Balancing at girdle-right
            ];
            const p = positions[i];
            if (!p) return null;
            return (
              <g key={`orb-${i}`}>
                <circle cx={p.x} cy={p.y} r="12" fill={c} opacity="0.45" />
                <circle cx={p.x} cy={p.y} r="6" fill={c} />
                <circle cx={p.x - 1.5} cy={p.y - 1.5} r="1.8" fill="white" opacity="0.75" />
              </g>
            );
          })}
        </motion.g>

        {/* Inner white core — pulses faster as we approach peak. Stays
            centered (not inside rotating group) so it reads as a steady
            heartbeat. */}
        <motion.circle
          cx={CX}
          cy={CY}
          fill="white"
          animate={{
            opacity: stage === 'peak' ? [0.8, 1, 0.8] : stage === 'glowing' ? [0.5, 0.85, 0.5] : [0.4, 0.7, 0.4],
            r:
              stage === 'forming'
                ? [3, 5, 3]
                : stage === 'glowing'
                ? [5, 9, 5]
                : stage === 'peak'
                ? [9, 18, 9]
                : [9, 4, 0],
          }}
          transition={{
            duration: stage === 'peak' ? 0.8 : stage === 'glowing' ? 1.2 : 2.0,
            repeat: stage === 'burst' ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.svg>

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
            {orbColors.map((c, i) => {
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
