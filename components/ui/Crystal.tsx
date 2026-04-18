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
 */

import { AnimatePresence, motion } from 'framer-motion';
import { memo, useId, useMemo } from 'react';
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

// ── Octahedral bipyramid profile ──────────────────────────────────────────
// 8 vertices laid out in the viewBox [-100 -110 200 220]. Outer apex
// pair drives the tall silhouette; girdle pair is the widest point; inner
// rectangle defines the table + bowl where light concentrates.
const V = {
  top:  [0, -90] as const,
  bot:  [0,  90] as const,
  gl:   [-55, 0] as const, // girdle-left
  gr:   [ 55, 0] as const, // girdle-right
  tlt:  [-35, -25] as const, // table-left-top
  trt:  [ 35, -25] as const, // table-right-top
  tlb:  [-35,  25] as const, // table-left-bottom
  trb:  [ 35,  25] as const, // table-right-bottom
} as const;

const pt = (v: readonly [number, number]) => `${v[0]},${v[1]}`;
const facet = (verts: (readonly [number, number])[]) => verts.map(pt).join(' ');

/**
 * Seven facets that make up the front-facing gem silhouette. Facet order
 * matters for paint order — later polygons draw on top of earlier ones.
 * Edges shared between two facets get drawn by the later one.
 */
const FACETS = [
  // 0. Crown-top-center — bright cap between the two upper inner verts.
  { key: 'crown-top', points: facet([V.top, V.trt, V.tlt]), role: 'top' },
  // 1. Crown-left slant — apex → upper inner → girdle-left.
  { key: 'crown-l', points: facet([V.top, V.tlt, V.gl]), role: 'girdleL' },
  // 2. Crown-right slant — apex → girdle-right → upper inner.
  { key: 'crown-r', points: facet([V.top, V.gr, V.trt]), role: 'girdleR' },
  // 3. Table (the big bright center quad the eye lands on).
  { key: 'table', points: facet([V.tlt, V.trt, V.trb, V.tlb]), role: 'table' },
  // 4. Pavilion-left slant — girdle-left → lower inner → culet.
  { key: 'pav-l', points: facet([V.gl, V.tlb, V.bot]), role: 'girdleL' },
  // 5. Pavilion-bottom — deepest shadow, between the two lower inners + culet.
  { key: 'pav-bot', points: facet([V.tlb, V.trb, V.bot]), role: 'bot' },
  // 6. Pavilion-right slant — lower inner → girdle-right → culet.
  { key: 'pav-r', points: facet([V.trb, V.gr, V.bot]), role: 'girdleR' },
] as const;

function CrystalImpl({
  orbs,
  count,
  size = 280,
  mode = 'idle',
  floatIntensity = 1,
}: CrystalProps) {
  // SSR-safe unique id for SVG gradient/filter references. Without this,
  // React 18 hydration produces mismatched IDs and the gradients fail to
  // resolve on the first paint.
  const rawId = useId();
  const uid = rawId.replace(/:/g, '');

  const primary = orbs[0] ?? FALLBACK;
  const secondary = orbs[1] ?? primary;
  // Tertiary currently unused — reserved for a future low-accent beat on
  // the pavilion facets.

  // Derived palette — the whole gem's shading comes from the primary orb,
  // with per-facet deltas (top lifts, bottom sinks, girdle shades right).
  // Using the primary directly rather than a muddy 3-color blend preserves
  // each user's pick instead of washing it to beige.
  const topLift = useMemo(() => lighten(primary, 35), [primary]);
  const topEdge = useMemo(() => lighten(primary, 50), [primary]);
  const topMid = primary;
  const darkMid = useMemo(() => darken(primary, 15), [primary]);
  const darkDeep = useMemo(() => darken(primary, 35), [primary]);
  const girdleDark = useMemo(() => darken(primary, 20), [primary]);
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

  // Idle float — bob + gentle screen-plane tilt. Disabled during burst so
  // the scale pulse doesn't fight the drift.
  const floatY = isIdle && floatIntensity > 0 ? [0, -6 * floatIntensity, 0] : 0;
  const floatRot =
    isIdle && floatIntensity > 0 ? [-1.5, 1.5, -1.5] : 0;

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
        {/* HALO — always on when count >= 1. Bleeds the primary orb's color
            into ambient light so even the seed state feels "theirs". */}
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

        {/* SEED CORE — count === 1 only. Small bright bead at the center of
            the halo so something is visibly "there" beyond the glow. */}
        {count === 1 && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size * 0.22,
              height: size * 0.22,
              background: `radial-gradient(circle at 40% 35%, white 0%, ${topLift} 30%, ${primary} 65%, ${darkMid} 100%)`,
              boxShadow: `0 0 24px ${primary}CC, inset 0 0 8px ${topLift}`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 0.95] }}
            transition={{
              scale: { duration: 0.7, times: [0, 0.7, 1], ease: easeOvershoot },
              opacity: { duration: 0.4 },
            }}
          />
        )}

        {/* SPINE — count === 2. Tall narrow shard along the vertical axis,
            with the primary color at the top anchor and secondary at the
            bottom. pathLength sweeps it in so it reads as "gathering". */}
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
              transition={{ duration: 0.5, ease: easeOvershoot }}
            >
              <defs>
                <linearGradient id={`spine-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={primary} stopOpacity="1" />
                  <stop offset="50%" stopColor={lighten(primary, 20)} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={secondary} stopOpacity="1" />
                </linearGradient>
                <filter id={`spineglow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
              </defs>
              {/* Outer glow aura */}
              <motion.ellipse
                cx="0" cy="0" rx="14" ry="90"
                fill={primary}
                opacity="0.4"
                filter={`url(#spineglow-${uid})`}
                animate={{ opacity: [0.25, 0.55, 0.25], rx: [14, 18, 14] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Shard body — elongated kite */}
              <motion.polygon
                points="0,-90 10,0 0,90 -10,0"
                fill={`url(#spine-${uid})`}
                stroke={topLift}
                strokeWidth="1"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.98 }}
                transition={{ duration: 0.9, ease: easeOvershoot }}
              />
              {/* Apex + base anchor beads — the two picked orb colors sit
                  here so the user can literally see their choices locked in. */}
              <circle cx={0} cy={-90} r={5} fill={primary} />
              <circle cx={-1.5} cy={-91.5} r={1.8} fill="white" opacity="0.75" />
              <circle cx={0} cy={90} r={5} fill={secondary} />
              <circle cx={-1.5} cy={88.5} r={1.8} fill="white" opacity="0.75" />
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
              {/* ── GEM BODY SVG — static in its own coord space, rotated
                  by the parent 3D wrapper. ── */}
              <svg
                viewBox="-100 -110 200 220"
                width={size * 0.7}
                height={size * 0.77}
                style={{ overflow: 'visible' }}
                aria-hidden
              >
                <defs>
                  {/* Role-keyed gradients — each facet's `role` picks which
                      gradient paints it. Keeps the facet array declarative. */}
                  <linearGradient id={`top-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor={topEdge} stopOpacity="1" />
                    <stop offset="70%" stopColor={topLift} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={topMid} stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id={`bot-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor={darkMid} stopOpacity="1" />
                    <stop offset="100%" stopColor={darkDeep} stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id={`girdleL-${uid}`} x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={topMid} stopOpacity="1" />
                    <stop offset="70%" stopColor={darkMid} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={girdleDark} stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id={`girdleR-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={topMid} stopOpacity="1" />
                    <stop offset="70%" stopColor={darkMid} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={girdleDark} stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id={`table-${uid}`} x1="30%" y1="0%" x2="70%" y2="100%">
                    <stop offset="0%" stopColor={topEdge} stopOpacity="0.95" />
                    <stop offset="50%" stopColor={topLift} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={darkMid} stopOpacity="0.9" />
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

                {/* Core glow — sits behind the facets, pulses gently. Gives
                    the gem the "lit from within" read the spec asks for. */}
                <motion.circle
                  cx="0"
                  cy="0"
                  fill={`url(#core-${uid})`}
                  filter={`url(#glow-${uid})`}
                  animate={{ r: [40, 56, 40], opacity: [0.55, 0.9, 0.55] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Facets — stagger in over ~700ms (100ms each). The
                    easeOvershoot curve makes each one "click" into place
                    instead of fading in flatly. */}
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
                    f.role === 'top'
                      ? topEdge
                      : f.role === 'bot'
                      ? darkDeep
                      : f.role === 'table'
                      ? topEdge
                      : girdleDark;
                  return (
                    <motion.polygon
                      key={f.key}
                      points={f.points}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 0.95, scale: 1 }}
                      transition={{
                        delay: 0.1 + i * 0.1,
                        duration: 0.5,
                        ease: easeOvershoot,
                      }}
                      style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                    />
                  );
                })}

                {/* Interior facet seams — thin edge lines from the apex/culet
                    into the table corners. Sells the cut at any rotation. */}
                <g opacity="0.35" stroke={topEdge} strokeWidth="0.4">
                  <line x1={V.top[0]} y1={V.top[1]} x2={V.tlt[0]} y2={V.tlt[1]} />
                  <line x1={V.top[0]} y1={V.top[1]} x2={V.trt[0]} y2={V.trt[1]} />
                </g>
                <g opacity="0.30" stroke={darkMid} strokeWidth="0.4">
                  <line x1={V.bot[0]} y1={V.bot[1]} x2={V.tlb[0]} y2={V.tlb[1]} />
                  <line x1={V.bot[0]} y1={V.bot[1]} x2={V.trb[0]} y2={V.trb[1]} />
                </g>
              </svg>

              {/* ── COUNTER-ROTATING SPECULAR LAYER ── */}
              {/* This is the 3D-read make-or-break. Outer gem rotates +360Y
                  over rotDuration; this layer rotates -360Y over the same
                  window, inside the parent's preserve-3d. Net effect: the
                  specular highlight stays fixed in screen-space like a
                  real light source while the gem turns underneath.

                  If the crystal ever flattens: (1) confirm the signs are
                  opposite, (2) confirm durations match exactly, (3) confirm
                  preserve-3d is set on BOTH this div and its parent. */}
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
                  width={size * 0.7}
                  height={size * 0.77}
                  style={{ overflow: 'visible' }}
                  aria-hidden
                >
                  {/* Primary specular — upper-left bright smear on the crown.
                      Rotated -25° to hint at a bevel reflection. */}
                  <ellipse
                    cx={V.tlt[0] + 8}
                    cy={V.tlt[1] + 2}
                    rx="14"
                    ry="6"
                    fill="white"
                    opacity="0.55"
                    transform={`rotate(-25 ${V.tlt[0] + 8} ${V.tlt[1] + 2})`}
                  />
                  {/* Apex glint — small bright dot on the top point */}
                  <ellipse
                    cx={V.top[0] + 2}
                    cy={V.top[1] + 6}
                    rx="3.5"
                    ry="2.5"
                    fill="white"
                    opacity="0.8"
                  />
                  {/* Table sheen — soft horizontal on the bright table area */}
                  <ellipse
                    cx="-8"
                    cy="-5"
                    rx="22"
                    ry="4"
                    fill="white"
                    opacity="0.3"
                    transform="rotate(-12 -8 -5)"
                  />
                  {/* Girdle-right tiny glint */}
                  <circle
                    cx={V.gr[0] - 5}
                    cy={V.gr[1] - 2}
                    r="2"
                    fill="white"
                    opacity="0.65"
                  />
                </svg>
              </motion.div>

              {/* SPARKLE MOTES — four twinkles on screen-space offsets (outside
                  the counter-rotation so they drift with the gem). Classic
                  secondary action — gives the scene a pulse beyond the spin. */}
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

        {/* BURST FLASH — radial white/primary flash that fires at the peak
            of the burst scale pulse (~500ms in). Quick on, fade out. */}
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
    </div>
  );
}

export const Crystal = memo(CrystalImpl);
