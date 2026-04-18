'use client';

/**
 * components/ui/Crystal.tsx — the canonical gem.
 *
 * One component, two homes:
 *   - S06 (via CrystalViewport): crystal forms progressively as the user picks
 *     orbs. 1 = seed halo, 2 = shard spine, 3 = full 7-facet bipyramid.
 *   - S08 (direct): full gem with mode='burst' — scale pulse + flash + faster
 *     rotation during the evolution ceremony, then settles back to idle.
 *
 * The trick that sells the 3D read is the COUNTER-ROTATING SPECULAR layer.
 * The outer 3D wrapper rotates Y +360 over 14s; the specular highlights
 * rotate Y -360 over the same 14s inside that preserve-3d space. The two
 * rotations cancel for the specular (it stays pinned in screen-space like a
 * fixed light source) while the gem body visibly turns underneath. If the
 * gem ever reads flat, first thing to check is: same duration on both
 * layers? opposite sign on rotateY? Answer is yes 9/10 times to both.
 *
 * SVG 3D is unreliable (Safari in particular), so we use HTML wrappers for
 * the 3D transforms and SVG only for the 2D geometry.
 *
 * Proportions: "chibi gem" — wider at the girdle than tall. Zelda/Genshin
 * silhouette, not Asscher step-cut. If this reads too sharp/dagger-like
 * again, widen the girdle (±62 → ±70) before making the top taller.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { darken, lighten } from '@/lib/color';
import { easeOvershoot, easeSmooth } from '@/lib/motion';

export interface CrystalProps {
  /** Hex colors, dominant first. Up to 3 used — missing slots fall back to
   *  a warm gold so the gem still reads gracefully. */
  orbs: string[];
  /** Progress through the forming arc. 1 → halo only, 2 → spine, 3 → full gem. */
  count: 1 | 2 | 3;
  /** Container edge in px (square). Geometry scales to fit. */
  size?: number;
  /** Behavioral mode. `idle` is the default — gem floats + rotates. `burst`
   *  adds a scale pulse + flash overlay for the S08 evolution moment.
   *  `forming` is a no-spin alias used while count < 3 so the intermediate
   *  states feel like "gathering" instead of "already a gem". */
  mode?: 'forming' | 'idle' | 'burst';
  /** Idle float amplitude multiplier (0 disables the bob). */
  floatIntensity?: number;
}

const FALLBACK = '#D4A843';

// ── Octahedral bipyramid profile (chibi proportions) ──────────────────────
// ±62 at girdle, ±70 at apex — gem is slightly wider than tall at the
// bulk, giving a friendlier "held by hand" silhouette vs. a sharp dagger.
// Inner rectangle defines the table bowl where light concentrates.
const V = {
  top:  [0, -70] as const,
  bot:  [0,  70] as const,
  gl:   [-62, 0] as const, // girdle-left
  gr:   [ 62, 0] as const, // girdle-right
  tlt:  [-38, -22] as const, // table-left-top
  trt:  [ 38, -22] as const, // table-right-top
  tlb:  [-38,  22] as const, // table-left-bottom
  trb:  [ 38,  22] as const, // table-right-bottom
} as const;

const pt = (v: readonly [number, number]) => `${v[0]},${v[1]}`;
const facet = (verts: (readonly [number, number])[]) => verts.map(pt).join(' ');

/** Full outer silhouette polygon (kite shape through girdle points). */
const SILHOUETTE = facet([V.top, V.gr, V.bot, V.gl]);

/**
 * Seven facets that make up the front-facing gem silhouette. Facet order
 * matters for paint order — later polygons draw on top of earlier ones.
 * `half` tags which stroke color palette the facet's edges borrow from
 * (top → secondary orb, bottom → tertiary orb, girdle → midline).
 */
const FACETS = [
  // 0. Crown-top-center — bright cap between the two upper inner verts.
  { key: 'crown-top', points: facet([V.top, V.trt, V.tlt]), role: 'top' as const, half: 'top' as const },
  // 1. Crown-left slant — apex → upper inner → girdle-left.
  { key: 'crown-l', points: facet([V.top, V.tlt, V.gl]), role: 'girdleL' as const, half: 'top' as const },
  // 2. Crown-right slant — apex → girdle-right → upper inner.
  { key: 'crown-r', points: facet([V.top, V.gr, V.trt]), role: 'girdleR' as const, half: 'top' as const },
  // 3. Table (the big bright center quad the eye lands on).
  { key: 'table', points: facet([V.tlt, V.trt, V.trb, V.tlb]), role: 'table' as const, half: 'girdle' as const },
  // 4. Pavilion-left slant — girdle-left → lower inner → culet.
  { key: 'pav-l', points: facet([V.gl, V.tlb, V.bot]), role: 'girdleL' as const, half: 'bot' as const },
  // 5. Pavilion-bottom — deepest shadow, between the two lower inners + culet.
  { key: 'pav-bot', points: facet([V.tlb, V.trb, V.bot]), role: 'bot' as const, half: 'bot' as const },
  // 6. Pavilion-right slant — lower inner → girdle-right → culet.
  { key: 'pav-r', points: facet([V.trb, V.gr, V.bot]), role: 'girdleR' as const, half: 'bot' as const },
] as const;

function CrystalImpl({
  orbs,
  count,
  size = 280,
  mode = 'idle',
  floatIntensity = 1,
}: CrystalProps) {
  // SSR-safe unique id for SVG gradient/filter references.
  const rawId = useId();
  const uid = rawId.replace(/:/g, '');

  const primary = orbs[0] ?? FALLBACK;
  const secondary = orbs[1] ?? lighten(primary, 30);
  const tertiary = orbs[2] ?? lighten(primary, 30);

  // Derived palette — shading from the primary with per-role deltas.
  const topLift = useMemo(() => lighten(primary, 35), [primary]);
  const topEdge = useMemo(() => lighten(primary, 50), [primary]);
  const topMid = primary;
  const darkMid = useMemo(() => darken(primary, 15), [primary]);
  const darkDeep = useMemo(() => darken(primary, 35), [primary]);
  const girdleDark = useMemo(() => darken(primary, 20), [primary]);
  const girdleBand = useMemo(() => darken(primary, 15), [primary]);
  const coreGlow = useMemo(() => lighten(primary, 55), [primary]);

  const showHalo = count >= 1;
  const showSpine = count >= 2 && count < 3;
  const showGem = count === 3;
  const isBurst = mode === 'burst';
  const isIdle = mode === 'idle' || (mode === 'forming' && count === 3);

  // Rotation windows. Burst ramps short (feels like the gem gets excited);
  // idle is the slow, stately 14s spin. No rotation while forming intermediate
  // states so the seed/spine don't feel like they're "already the gem".
  const rotDuration = isBurst ? 2 : 14;
  const spinning = showGem;

  // Idle float — bob + gentle screen-plane tilt.
  const floatY = isIdle && floatIntensity > 0 ? [0, -6 * floatIntensity, 0] : 0;
  const floatRot = isIdle && floatIntensity > 0 ? [-1.5, 1.5, -1.5] : 0;

  // ── BURST CHOREOGRAPHY ──
  // When count increases, fire a transient burst overlay keyed to the
  // transition (0→1, 1→2, 2→3). Re-keying on each bump remounts the overlay
  // so AnimatePresence plays its one-shot animation every time. The timer
  // clears the burst back to null so it doesn't leak into steady-state.
  const [burstTrigger, setBurstTrigger] = useState<{
    toCount: 1 | 2 | 3;
    key: number;
  } | null>(null);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current && count >= 1 && count <= 3) {
      setBurstTrigger({ toCount: count, key: Date.now() });
      const durations = { 1: 900, 2: 1100, 3: 1400 } as const;
      const t = setTimeout(() => setBurstTrigger(null), durations[count]);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  // Mount-only check so the screen vignette portal doesn't try to reach
  // document on the server.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        // Parent perspective — the whole 3D illusion falls apart without
        // this. 1200px feels like a viewer standing ~1 gem-diameter away.
        perspective: '1200px',
        perspectiveOrigin: 'center center',
      }}
    >
      {/* Float/burst wrapper — lives on top of the rotation so the idle
          bob doesn't compound into the spin axis. */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          y: isBurst ? 0 : floatY,
          rotate: isBurst ? 0 : floatRot,
          scale: isBurst ? [1, 1.4, 1.1] : 1,
        }}
        transition={{
          y: { duration: 3, repeat: isBurst ? 0 : Infinity, ease: 'easeInOut' },
          rotate: { duration: 5, repeat: isBurst ? 0 : Infinity, ease: 'easeInOut' },
          scale: isBurst
            ? { duration: 1.5, times: [0, 0.5, 1], ease: easeSmooth }
            : { duration: 0.3 },
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* HALO — always on when count >= 1. */}
        {showHalo && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size * 0.9,
              height: size * 0.9,
              background: `radial-gradient(circle, ${primary}66 0%, ${primary}14 45%, ${primary}00 75%)`,
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: [0.55, 0.9, 0.55],
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* SEED CORE — count === 1 only. Gets a scale pop on arrival via
            the burst layer below, so no pop-animation here — just the
            steady-state bead. */}
        {count === 1 && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size * 0.26,
              height: size * 0.26,
              background: `radial-gradient(circle at 40% 35%, white 0%, ${topLift} 28%, ${primary} 62%, ${darkMid} 100%)`,
              boxShadow: `0 0 28px ${primary}DD, inset 0 0 10px ${topLift}`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              scale: { duration: 0.5, ease: easeOvershoot },
              opacity: { duration: 0.4 },
            }}
          />
        )}

        {/* SPINE — count === 2. */}
        <AnimatePresence>
          {showSpine && (
            <motion.svg
              key="spine"
              viewBox="-100 -110 200 220"
              width={size * 0.65}
              height={size * 0.72}
              className="absolute"
              style={{ overflow: 'visible' }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.55, ease: easeOvershoot }}
            >
              <defs>
                <linearGradient id={`spine-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={primary} stopOpacity="1" />
                  <stop offset="50%" stopColor={lighten(primary, 20)} stopOpacity="1" />
                  <stop offset="100%" stopColor={secondary} stopOpacity="1" />
                </linearGradient>
                <filter id={`spineglow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
              </defs>
              {/* Outer glow aura */}
              <motion.ellipse
                cx="0" cy="0" rx="16" ry="72"
                fill={primary}
                opacity="0.45"
                filter={`url(#spineglow-${uid})`}
                animate={{ opacity: [0.3, 0.6, 0.3], rx: [14, 20, 14] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Shard body — elongated kite using new proportions */}
              <motion.polygon
                points="0,-70 12,0 0,70 -12,0"
                fill={`url(#spine-${uid})`}
                stroke={topEdge}
                strokeWidth="1.5"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.55, ease: easeOvershoot }}
              />
              {/* Apex + base anchor beads */}
              <circle cx={0} cy={-70} r={5} fill={primary} />
              <circle cx={-1.5} cy={-71.5} r={1.8} fill="white" opacity="0.8" />
              <circle cx={0} cy={70} r={5} fill={secondary} />
              <circle cx={-1.5} cy={68.5} r={1.8} fill="white" opacity="0.8" />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* 3D SPIN WRAPPER — owns the gem body rotation and contains the
            counter-rotating specular layer. Only renders for count === 3. */}
        <AnimatePresence>
          {showGem && (
            <motion.div
              key="gem3d"
              className="absolute flex items-center justify-center"
              style={{
                width: size,
                height: size,
                transformStyle: 'preserve-3d',
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotateY: spinning ? 360 : 0,
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                opacity: { duration: 0.5, ease: easeSmooth },
                scale: { duration: 0.7, ease: easeOvershoot },
                rotateY: {
                  duration: rotDuration,
                  repeat: Infinity,
                  ease: 'linear',
                },
              }}
            >
              {/* ── GEM BODY SVG ── */}
              <svg
                viewBox="-100 -110 200 220"
                width={size * 0.78}
                height={size * 0.72}
                style={{ overflow: 'visible' }}
                aria-hidden
              >
                <defs>
                  {/* Gradient stops control depth; polygon opacity stays at 1
                      so the gem reads as a saturated solid. */}
                  <linearGradient id={`top-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor={topEdge} stopOpacity="1" />
                    <stop offset="70%" stopColor={topLift} stopOpacity="1" />
                    <stop offset="100%" stopColor={topMid} stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id={`bot-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor={darkMid} stopOpacity="1" />
                    <stop offset="100%" stopColor={darkDeep} stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id={`girdleL-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={topMid} stopOpacity="1" />
                    <stop offset="70%" stopColor={darkMid} stopOpacity="1" />
                    <stop offset="100%" stopColor={girdleDark} stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id={`girdleR-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={topMid} stopOpacity="1" />
                    <stop offset="70%" stopColor={darkMid} stopOpacity="1" />
                    <stop offset="100%" stopColor={girdleDark} stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id={`table-${uid}`} x1="30%" y1="0%" x2="70%" y2="100%">
                    <stop offset="0%" stopColor={topEdge} stopOpacity="1" />
                    <stop offset="50%" stopColor={topLift} stopOpacity="1" />
                    <stop offset="100%" stopColor={darkMid} stopOpacity="1" />
                  </linearGradient>
                  <radialGradient id={`core-${uid}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={coreGlow} stopOpacity="0.95" />
                    <stop offset="45%" stopColor={primary} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={primary} stopOpacity="0" />
                  </radialGradient>
                  <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>
                </defs>

                {/* Core glow behind facets — pulses gently. */}
                <motion.circle
                  cx="0"
                  cy="0"
                  fill={`url(#core-${uid})`}
                  filter={`url(#glow-${uid})`}
                  animate={{ r: [40, 56, 40], opacity: [0.55, 0.9, 0.55] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* BACK SILHOUETTE — darker gem mirror offset behind the front
                    facets. Opacity 0.6 per spec — opaque enough to feel
                    solid, translucent enough to hint at depth when the gem
                    rotates and exposes this layer. */}
                <polygon
                  points={SILHOUETTE}
                  fill={darkDeep}
                  opacity="0.6"
                  transform="translate(2,4)"
                />

                {/* SOLID BASE — full silhouette at primary color, 0.92 opacity.
                    Sits BEHIND the gradient facets and ensures the gem reads
                    saturated regardless of gradient-stop opacity. */}
                <polygon
                  points={SILHOUETTE}
                  fill={primary}
                  opacity="0.92"
                />

                {/* FACETS — 7 gradient-filled polygons, opacity 1. Staggered
                    entry gives each one a "click into place" beat. Strokes
                    are bolder and colored by orb slot so the gem visually
                    ties back to the user's picks. */}
                {FACETS.map((f, i) => {
                  const fill =
                    f.role === 'top'
                      ? `url(#top-${uid})`
                      : f.role === 'bot'
                      ? `url(#bot-${uid})`
                      : f.role === 'girdleL'
                      ? `url(#girdleL-${uid})`
                      : f.role === 'girdleR'
                      ? `url(#girdleR-${uid})`
                      : `url(#table-${uid})`;
                  const stroke =
                    f.half === 'top'
                      ? secondary
                      : f.half === 'bot'
                      ? tertiary
                      : girdleBand;
                  const strokeWidth = f.half === 'girdle' ? 1.25 : 2.25;
                  return (
                    <motion.polygon
                      key={f.key}
                      points={f.points}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.1 + i * 0.1,
                        duration: 0.5,
                        ease: easeOvershoot,
                      }}
                      style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                    />
                  );
                })}

                {/* GIRDLE BAND — horizontal line through the widest point. */}
                <line
                  x1={V.gl[0]}
                  y1={V.gl[1]}
                  x2={V.gr[0]}
                  y2={V.gr[1]}
                  stroke={girdleBand}
                  strokeWidth="1.25"
                  opacity="0.85"
                />

                {/* Interior seams — apex/culet to inner rectangle. */}
                <g opacity="0.4" stroke={topEdge} strokeWidth="0.6">
                  <line x1={V.top[0]} y1={V.top[1]} x2={V.tlt[0]} y2={V.tlt[1]} />
                  <line x1={V.top[0]} y1={V.top[1]} x2={V.trt[0]} y2={V.trt[1]} />
                </g>
                <g opacity="0.35" stroke={darkMid} strokeWidth="0.6">
                  <line x1={V.bot[0]} y1={V.bot[1]} x2={V.tlb[0]} y2={V.tlb[1]} />
                  <line x1={V.bot[0]} y1={V.bot[1]} x2={V.trb[0]} y2={V.trb[1]} />
                </g>
              </svg>

              {/* ── COUNTER-ROTATING SPECULAR LAYER ──
                  Outer gem rotates +360Y over rotDuration; this layer rotates
                  -360Y over the same window. The -360 SIGN and matching
                  duration are the make-or-break — don't change one without
                  the other. */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: -360 }}
                transition={{
                  duration: rotDuration,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <svg
                  viewBox="-100 -110 200 220"
                  width={size * 0.78}
                  height={size * 0.72}
                  style={{ overflow: 'visible' }}
                  aria-hidden
                >
                  {/* Upper-left bright smear */}
                  <ellipse
                    cx={V.tlt[0] + 8}
                    cy={V.tlt[1] + 2}
                    rx="16"
                    ry="7"
                    fill="white"
                    opacity="0.65"
                    transform={`rotate(-25 ${V.tlt[0] + 8} ${V.tlt[1] + 2})`}
                  />
                  {/* Apex glint */}
                  <ellipse
                    cx={V.top[0] + 2}
                    cy={V.top[1] + 6}
                    rx="4"
                    ry="3"
                    fill="white"
                    opacity="0.9"
                  />
                  {/* Table sheen */}
                  <ellipse
                    cx="-8"
                    cy="-5"
                    rx="24"
                    ry="5"
                    fill="white"
                    opacity="0.35"
                    transform="rotate(-12 -8 -5)"
                  />
                  {/* Girdle glint */}
                  <circle
                    cx={V.gr[0] - 5}
                    cy={V.gr[1] - 2}
                    r="2.5"
                    fill="white"
                    opacity="0.75"
                  />
                </svg>
              </motion.div>

              {/* SPARKLE MOTES — four twinkles in screen-space offsets. */}
              {[
                { x: -58, y: -48, d: 2.4, delay: 0 },
                { x: 62, y: -42, d: 3.1, delay: 0.6 },
                { x: -52, y: 60, d: 2.8, delay: 1.2 },
                { x: 64, y: 52, d: 3.5, delay: 1.8 },
              ].map((s, i) => (
                <motion.div
                  key={`spark-${i}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 3,
                    height: 3,
                    left: `calc(50% + ${s.x}px)`,
                    top: `calc(50% + ${s.y}px)`,
                    background: 'white',
                    boxShadow: `0 0 6px ${primary}, 0 0 12px ${primary}80`,
                  }}
                  animate={{
                    opacity: [0, 1, 0.4, 0],
                    scale: [0.3, 1.4, 0.9, 0.3],
                  }}
                  transition={{
                    duration: s.d,
                    repeat: Infinity,
                    delay: s.delay,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BURST CHOREOGRAPHY ──
            Each count bump fires a one-shot overlay keyed to the transition.
            Keys differ per fire so AnimatePresence replays from initial
            state. Burst mounts for ~1s, then auto-clears. */}
        <AnimatePresence>
          {burstTrigger && (
            <BurstOverlay
              key={burstTrigger.key}
              toCount={burstTrigger.toCount}
              primary={primary}
              secondary={secondary}
              size={size}
            />
          )}
        </AnimatePresence>

        {/* BURST FLASH (S08 mode) — radial white/primary flash. */}
        <AnimatePresence>
          {isBurst && (
            <motion.div
              key="flash"
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.7, 0], scale: [0.6, 2.0, 2.6] }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.5,
                times: [0, 0.35, 1],
                ease: 'easeOut',
              }}
              style={{
                background: `radial-gradient(circle, white 0%, ${primary}AA 35%, ${primary}00 70%)`,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── SCREEN-LEVEL VIGNETTE PULSE (count === 3 only) ──
          Portaled to document.body to escape the perspective containing
          block — otherwise the fixed positioning would be scoped to this
          Crystal's transformed box and the vignette wouldn't cover the
          page. */}
      {mounted && burstTrigger?.toCount === 3 &&
        createPortal(
          <motion.div
            key={`vignette-${burstTrigger.key}`}
            className="fixed inset-0 pointer-events-none z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background:
                'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 110%)',
            }}
            aria-hidden
          />,
          document.body,
        )}
    </div>
  );
}

/**
 * BurstOverlay — one-shot choreography that plays on count increase.
 * Contents vary by target count:
 *   1: 4 sparkles + shockwave + halo scale pop anchor.
 *   2: 6 sparkles + shockwave + spine completion pop anchor.
 *   3: 10 sparkles + shockwave + radial glow pulse + scale pop anchor.
 */
function BurstOverlay({
  toCount,
  primary,
  secondary,
  size,
}: {
  toCount: 1 | 2 | 3;
  primary: string;
  secondary: string;
  size: number;
}) {
  const sparkleCount = toCount === 1 ? 4 : toCount === 2 ? 6 : 10;
  const shockwaveStart = toCount === 1 ? 30 : toCount === 2 ? 30 : 40;
  const shockwaveEnd = toCount === 1 ? 140 : toCount === 2 ? 160 : 180;
  const shockwaveDuration = toCount === 1 ? 0.8 : toCount === 2 ? 0.9 : 1.0;
  const popScale =
    toCount === 1
      ? ([1, 1.18, 1] as const)
      : toCount === 2
      ? ([1, 1.15, 1] as const)
      : ([0.92, 1.22, 1] as const);
  const popDuration = toCount === 1 ? 0.45 : toCount === 2 ? 0.5 : 0.7;
  const popDelay = toCount === 3 ? 0.2 : 0;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Scale pop anchor — transparent div whose scale pulses; viewer reads
          it through the halo/spine/gem layered above as a brief "squeeze".
          Doesn't render visible content itself. */}
      <motion.div
        className="absolute"
        style={{ width: size * 0.5, height: size * 0.5 }}
        initial={{ scale: popScale[0] }}
        animate={{ scale: [...popScale] as number[] }}
        transition={{
          duration: popDuration,
          delay: popDelay,
          times: [0, 0.5, 1],
          ease: easeOvershoot,
        }}
      />

      {/* Radial glow pulse (count 3 only) — primary-colored circle that
          blooms out behind the gem. */}
      {toCount === 3 && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 100,
            height: 100,
            background: `radial-gradient(circle, ${primary}CC 0%, ${primary}55 45%, ${primary}00 80%)`,
            filter: 'blur(6px)',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 2.4, 2.8] }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      )}

      {/* Shockwave ring — thin colored ring expanding out + fading. */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{
          width: shockwaveStart * 2,
          height: shockwaveStart * 2,
          borderColor: primary,
          boxShadow: `0 0 16px ${primary}80`,
        }}
        initial={{
          width: shockwaveStart * 2,
          height: shockwaveStart * 2,
          opacity: 0.7,
        }}
        animate={{
          width: shockwaveEnd * 2,
          height: shockwaveEnd * 2,
          opacity: 0,
        }}
        transition={{ duration: shockwaveDuration, ease: 'easeOut' }}
      />

      {/* Sparkle particles — radial burst. */}
      {Array.from({ length: sparkleCount }).map((_, i) => {
        const angle = (i / sparkleCount) * Math.PI * 2;
        // Stagger colors so primary + secondary both sparkle.
        const color = i % 2 === 0 ? primary : secondary;
        const distance = 80 + (i % 3) * 24;
        return (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute rounded-full"
            style={{
              width: 5,
              height: 5,
              background: 'white',
              boxShadow: `0 0 10px ${color}, 0 0 20px ${color}80`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: [1, 1, 0],
              scale: [0.6, 1.3, 0.2],
            }}
            transition={{
              duration: 0.9 + (i % 3) * 0.1,
              ease: 'easeOut',
              delay: i * 0.02,
            }}
          />
        );
      })}
    </motion.div>
  );
}

export const Crystal = memo(CrystalImpl);
