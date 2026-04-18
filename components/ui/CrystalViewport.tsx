'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo } from 'react';

export interface OrbDef {
  id: string;
  icon: string;
  colour: string;
  label: string;
}

/** Parse a hex color (`#rrggbb`) into RGB channel values. */
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

function lighten(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

function darken(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amt), g * (1 - amt), b * (1 - amt));
}

/**
 * Blend 1–3 hex colors into a cohesive gem palette — weighted so the DOMINANT
 * orb (first selected) keeps its voice instead of muddying out. Returns the
 * tints needed for the gem's gradient body + accent beads.
 *
 *   primary        — full-saturation dominant color (for top apex + highlights)
 *   base           — weighted blend (60% dominant, 22% supporting, 18% balancing)
 *   midLight/midDark — base lifted +42% / cut -42% — for top-light/bottom-shadow
 *   lowAccent      — 70% balancing + 30% base — for bottom apex shading
 */
function blendColors(hexColors: string[]): {
  primary: string;
  base: string;
  midLight: string;
  midDark: string;
  lowAccent: string;
} {
  const list = hexColors.length > 0 ? hexColors : ['#D4A843'];
  const weights =
    list.length === 1
      ? [1]
      : list.length === 2
      ? [0.65, 0.35]
      : [0.6, 0.22, 0.18];

  const rgbs = list.map((h) => hexToRgb(h));
  const blended = rgbs.reduce(
    (acc, c, i) => ({
      r: acc.r + c.r * weights[i],
      g: acc.g + c.g * weights[i],
      b: acc.b + c.b * weights[i],
    }),
    { r: 0, g: 0, b: 0 },
  );

  // Warmth bias — averaging opposite hues (e.g. purple + teal) produces cold
  // muddy tones. Pull the base slightly toward warm gold so the gem reads as
  // friendly rather than clinical. Small lift in R, smaller lift in G, B
  // untouched so cool orbs keep their character.
  const warmth = 0.15;
  const warmR = Math.min(255, blended.r + (255 - blended.r) * warmth * 0.3);
  const warmG = Math.min(255, blended.g + (180 - blended.g) * warmth * 0.2);
  const warmB = blended.b;

  const base = rgbToHex(warmR, warmG, warmB);
  const primary = list[0];
  const balancing = list[list.length - 1];

  // 70% balancing + 30% warm base — pulls the bottom of the gem toward the
  // "balancing" orb's hue without losing cohesion.
  const balRgb = hexToRgb(balancing);
  const lowAccent = rgbToHex(
    balRgb.r * 0.7 + warmR * 0.3,
    balRgb.g * 0.7 + warmG * 0.3,
    balRgb.b * 0.7 + warmB * 0.3,
  );

  return {
    primary,
    base,
    midLight: lighten(base, 0.42),
    midDark: darken(base, 0.42),
    lowAccent,
  };
}

/**
 * OrbAccent — small colored bead used to seat an orb's color at a gem
 * vertex. Three-layer for a "polished bead" look: glow halo + solid core
 * + tiny white highlight. Pure SVG, no motion (lives inside a motion.g).
 */
function OrbAccent({
  cx,
  cy,
  color,
  size,
}: {
  cx: number;
  cy: number;
  color?: string;
  size: number;
}) {
  if (!color) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={size * 1.8} fill={color} opacity="0.35" filter="url(#cv-glow)" />
      <circle cx={cx} cy={cy} r={size} fill={color} />
      <circle cx={cx - size * 0.25} cy={cy - size * 0.25} r={size * 0.3} fill="white" opacity="0.75" />
    </g>
  );
}

interface CrystalViewportProps {
  allOrbs: OrbDef[];
  selectedOrbIds: string[]; // in selection order
  size?: number;
  /** Tap handler for orbs — provided when the viewport is interactive. */
  onOrbTap?: (orbId: string, orbIdx: number) => void;
  /** Freezes interaction (used during the confirm/celebration beat). */
  disabled?: boolean;
  /** Celebration flag — on confirm, orbs dim further and the crystal pulses. */
  celebrating?: boolean;
}

/**
 * CrystalViewport — the interactive stage where the crystal forms.
 *
 * Visual stack (back to front):
 *   1. Soft radial vignette + central nebula glow
 *   2. Ring guide (dashed circle)
 *   3. Radar polygon (weights current selections)
 *   4. Light trails from selected orbs → center
 *   5. Crystal geometry (vertex → edge → triangle + facets + rotation)
 *   6. Interactive orb buttons on the ring (absolute-positioned DOM, not SVG,
 *      so they can receive taps and render text labels)
 *
 * Orbs live on a ring at ~0.40 * size from center. Tapping an orb selects it
 * and adds its color to the crystal. Tapping a selected orb deselects.
 *
 * Designed as the HERO of S06 — no separate grid below; the viewport is the
 * complete interaction surface.
 */
function CrystalViewportImpl({
  allOrbs,
  selectedOrbIds,
  size = 340,
  onOrbTap,
  disabled = false,
  celebrating = false,
}: CrystalViewportProps) {
  const count = selectedOrbIds.length;
  const cx = size / 2;
  const cy = size / 2;
  const ringRadius = size * 0.40;

  // Angular positions for each orb (8 orbs evenly around the ring, starting
  // at 12 o'clock).
  const orbPositions = useMemo(
    () =>
      allOrbs.map((orb, i) => {
        const angle = (i / allOrbs.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...orb,
          idx: i,
          angle,
          x: cx + Math.cos(angle) * ringRadius,
          y: cy + Math.sin(angle) * ringRadius,
        };
      }),
    [allOrbs, cx, cy, ringRadius],
  );

  // The gem is a vertical diamond (hexagonal-bipyramid silhouette) that GROWS
  // through the selection journey. Same shape family at every stage — just
  // scaled smaller for 1/2 and full at 3 — so the crystal reads as one
  // object forming, not as three disjoint shapes.
  //
  //        T         (top apex — Dominant orb anchors here)
  //       ╱ ╲
  //      ╱   ╲
  //    WL ─── WR     (waist — Supporting / Balancing orbs anchor here)
  //      ╲   ╱
  //       ╲ ╱
  //        B         (bottom apex)
  const W_FULL = size * 0.16;
  const H_FULL = size * 0.26;
  const scaleFactor = count === 1 ? 0.32 : count === 2 ? 0.72 : 1.0;
  const W = W_FULL * scaleFactor;
  const H = H_FULL * scaleFactor;

  const gem = useMemo(
    () => ({
      T: { x: cx, y: cy - H },
      WR: { x: cx + W, y: cy },
      B: { x: cx, y: cy + H },
      WL: { x: cx - W, y: cy },
    }),
    [cx, cy, W, H],
  );

  const outlinePoints = `${gem.T.x},${gem.T.y} ${gem.WR.x},${gem.WR.y} ${gem.B.x},${gem.B.y} ${gem.WL.x},${gem.WL.y}`;
  const leftHalfPoints = `${gem.T.x},${gem.T.y} ${gem.WL.x},${gem.WL.y} ${gem.B.x},${gem.B.y}`;
  const rightHalfPoints = `${gem.T.x},${gem.T.y} ${gem.WR.x},${gem.WR.y} ${gem.B.x},${gem.B.y}`;

  const selectedColors = selectedOrbIds.map(
    (id) => allOrbs.find((o) => o.id === id)?.colour || '#D4A843',
  );
  const primaryColor = selectedColors[0] || '#D4A843';
  const full = count >= 3;
  const gemColors = blendColors(selectedColors);

  // Each orb's light contribution within the gradient. We lift the top of
  // the gem toward the dominant orb and push the bottom toward the balancing
  // orb — so the crystal physically shows the user's selections instead of
  // being a single muddy-averaged tone.
  const orb0Light = selectedColors[0] ? lighten(selectedColors[0], 0.35) : gemColors.midLight;
  const orb2Dark = selectedColors[2]
    ? darken(selectedColors[2], 0.25)
    : selectedColors[1]
    ? darken(selectedColors[1], 0.25)
    : gemColors.midDark;

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      data-testid="crystal-viewport"
    >
      {/* Radial vignette — stronger now so the crystal reads clearly against
          the busy cave background. Cave art stays visible at the edges
          (atmospheric) but doesn't fight the gem for attention. */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(12,14,18,0.95) 0%, rgba(12,14,18,0.75) 50%, rgba(12,14,18,0.1) 95%)`,
        }}
      />

      {/* Nebula glow — colors shift toward the primary selected orb */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          background: [
            `radial-gradient(circle at 50% 50%, ${primaryColor}18 0%, ${primaryColor}08 40%, rgba(12,14,18,0) 75%)`,
            `radial-gradient(circle at 50% 50%, ${primaryColor}22 0%, ${primaryColor}0d 40%, rgba(12,14,18,0) 75%)`,
            `radial-gradient(circle at 50% 50%, ${primaryColor}18 0%, ${primaryColor}08 40%, rgba(12,14,18,0) 75%)`,
          ],
        }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* SVG layer — decorative geometry only (orbs are DOM buttons overlaid).
          perspective + perspectiveOrigin set here so the count === 3 gem's
          rotateX tilt reads as real 3D (top recedes / bottom comes forward)
          instead of flattening to a vertical squish. */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="absolute inset-0"
        style={{
          overflow: 'visible',
          perspective: '1000px',
          perspectiveOrigin: 'center center',
        }}
        aria-hidden
      >
        <defs>
          {/* LEFT-HALF body gradient — lit from upper-left: bright top, deep
              midtone at waist, shadowed base. Orb 0 (Dominant) shows up as
              the warm light at the peak. */}
          <linearGradient id="cv-body-left" x1="30%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={orb0Light} stopOpacity="0.95" />
            <stop offset="48%" stopColor={gemColors.base} stopOpacity="0.95" />
            <stop offset="100%" stopColor={gemColors.midDark} stopOpacity="0.95" />
          </linearGradient>
          {/* RIGHT-HALF body gradient — shadowed side: same top light softened,
              base pulls toward orb 2 (Balancing) so its color seats there. */}
          <linearGradient id="cv-body-right" x1="70%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gemColors.base} stopOpacity="0.95" />
            <stop offset="50%" stopColor={gemColors.midDark} stopOpacity="0.95" />
            <stop offset="100%" stopColor={orb2Dark} stopOpacity="0.95" />
          </linearGradient>
          {/* Clip-path for the shimmer — confines the animated gleam to the
              gem's interior so it reads as a reflection, not a passing line. */}
          <clipPath id="cv-gem-clip">
            <polygon points={outlinePoints} />
          </clipPath>
          <filter id="cv-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cv-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ring guide (dashed circle) */}
        <circle
          cx={cx}
          cy={cy}
          r={ringRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />

        {/* Radar polygon — 8-axis silhouette weighted by current selection */}
        {count > 0 && (
          <motion.polygon
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.25, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            points={orbPositions
              .map((pos) => {
                const isSelected = selectedOrbIds.includes(pos.id);
                const weight = isSelected ? 1 : 0.22;
                const rr = ringRadius * 0.40 * weight;
                const px = cx + Math.cos(pos.angle) * rr;
                const py = cy + Math.sin(pos.angle) * rr;
                return `${px},${py}`;
              })
              .join(' ')}
            fill={primaryColor}
            opacity="0.14"
            stroke={primaryColor}
            strokeWidth="1"
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        )}

        {/* Light trails — selected orbs → center. Only shown during build-up
            (count 1 or 2); once the gem completes the trails would cut through
            the facets and look messy, so they fade out at count === 3. */}
        <AnimatePresence>
          {count > 0 && count < 3 &&
            orbPositions.map((pos) => {
              const selectedIdx = selectedOrbIds.indexOf(pos.id);
              if (selectedIdx < 0) return null;
              return (
                <motion.line
                  key={`trail-${pos.id}`}
                  x1={pos.x}
                  y1={pos.y}
                  x2={cx}
                  y2={cy}
                  stroke={pos.colour}
                  strokeWidth="1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.7 }}
                  exit={{ opacity: 0, transition: { duration: 0.4 } }}
                  transition={{
                    duration: 0.9,
                    delay: selectedIdx * 0.15,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  filter="url(#cv-glow)"
                />
              );
            })}
        </AnimatePresence>

        {/* CRYSTAL — same diamond family at every stage, scales up on each
            selection. Reads as ONE crystal forming, not three disjoint shapes. */}
        <AnimatePresence mode="wait">
          {count === 1 && (
            <motion.g
              key="v1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.25, 1], opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 0.75,
                times: [0, 0.6, 1],
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              {/* Outer pulse halo in the dominant orb's color */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={W * 2}
                fill={primaryColor}
                animate={{
                  r: [W * 2, W * 2.5, W * 2],
                  opacity: [0.18, 0.38, 0.18],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Seed shard — tiny diamond in the dominant orb's tint */}
              <polygon
                points={outlinePoints}
                fill={primaryColor}
                stroke="white"
                strokeWidth="0.5"
                opacity="0.95"
                filter="url(#cv-glow)"
              />
              {/* Tiny specular highlight near top-left */}
              <circle
                cx={cx - W * 0.25}
                cy={cy - H * 0.35}
                r={Math.max(2, W * 0.18)}
                fill="white"
                opacity="0.55"
              />
            </motion.g>
          )}

          {count === 2 && (
            <motion.g
              key="v2-growing-shard"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{
                duration: 0.7,
                times: [0, 0.6, 1],
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              {/* Outer halo */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={W * 1.5}
                fill={gemColors.base}
                animate={{
                  r: [W * 1.5, W * 1.8, W * 1.5],
                  opacity: [0.14, 0.28, 0.14],
                }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Growing crystal shard — elongated ellipse aligned to the axis
                  between the two selected orbs' ring positions. Replaces the
                  earlier broken-triangle attempt which produced a jagged
                  dotted outline in this intermediate state. */}
              <motion.ellipse
                cx={cx}
                cy={cy}
                rx={W * 0.55}
                ry={H * 0.85}
                fill={gemColors.midDark}
                stroke={gemColors.midLight}
                strokeWidth="1"
                animate={{
                  opacity: [0.75, 0.9, 0.75],
                }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.ellipse
                cx={cx}
                cy={cy}
                rx={W * 0.3}
                ry={H * 0.55}
                fill={gemColors.base}
                opacity="0.5"
              />
              {/* Highlight sheen on the shard */}
              <ellipse
                cx={cx - W * 0.1}
                cy={cy - H * 0.25}
                rx={W * 0.12}
                ry={H * 0.2}
                fill="white"
                opacity="0.35"
              />
              {/* Two orb accents — Dominant + Supporting */}
              <OrbAccent cx={gem.T.x} cy={gem.T.y} color={selectedColors[0]} size={6} />
              <OrbAccent cx={gem.WL.x} cy={gem.WL.y} color={selectedColors[1]} size={6} />
            </motion.g>
          )}

          {count === 3 && (() => {
            // Step-cut Asscher gem with Disney-style personality + real 3D:
            //   • Entrance squash+stretch ("anticipation → overshoot → settle")
            //   • Drop shadow beneath that scales with the tilt (gem "floats")
            //   • Back face offset behind the front face = visible thickness
            //   • 8 slow-rotating light rays behind the gem (independent axis)
            //   • 3 sparkles orbiting at different radii + phases
            //   • X-axis rocking tilt (existing) + subtle breathing scale
            //   • Center heartbeat + three orb accents anchored in screen space
            const gemSize = Math.min(W, H) * 1.1;
            const sizes = [1.0, 0.80, 0.60, 0.40] as const;
            const orbPositions = [
              { x: cx, y: cy - gemSize * 1.05 },
              { x: cx - gemSize * 1.05, y: cy },
              { x: cx + gemSize * 1.05, y: cy },
            ] as const;

            return (
              <motion.g
                key="v3-stepcut"
                initial={{ scale: 0, opacity: 0 }}
                // Disney-style entrance: tiny pre-squash → playful overshoot
                // → slight undershoot bounce → settle. Classic squash+stretch
                // cadence that makes the gem feel charmingly alive, not
                // mechanically slotted in.
                animate={{
                  scale: celebrating ? [1, 1.22, 0.97, 1.08, 1.05] : [0, 1.3, 0.92, 1.08, 1],
                  opacity: 1,
                }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{
                  scale: {
                    duration: celebrating ? 1.4 : 1.0,
                    times: [0, 0.4, 0.6, 0.8, 1],
                    ease: 'easeOut',
                  },
                  opacity: { duration: 0.4 },
                }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              >
                {/* DROP SHADOW — elliptical shadow on the "ground" beneath
                    the gem. Scales + fades in sync with the X-tilt so when
                    the gem leans forward the shadow tightens (closer to
                    surface) and when it leans back the shadow spreads. */}
                <motion.ellipse
                  cx={cx}
                  cy={cy + gemSize * 1.6}
                  fill="black"
                  animate={{
                    rx: [
                      gemSize * 0.85,
                      gemSize * 0.6,
                      gemSize * 0.85,
                      gemSize * 0.95,
                      gemSize * 0.85,
                    ],
                    ry: [
                      gemSize * 0.14,
                      gemSize * 0.10,
                      gemSize * 0.14,
                      gemSize * 0.16,
                      gemSize * 0.14,
                    ],
                    opacity: [0.32, 0.22, 0.32, 0.28, 0.32],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    times: [0, 0.25, 0.5, 0.75, 1],
                  }}
                />

                {/* OUTER HALO — soft colored breath */}
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={gemSize * 1.3}
                  fill={gemColors.base}
                  animate={{
                    r: [gemSize * 1.3, gemSize * 1.55, gemSize * 1.3],
                    opacity: [0.1, 0.25, 0.1],
                  }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* LIGHT RAYS — 8 long faint rays emanating from center,
                    rotating on a SEPARATE axis from the gem tilt so the
                    magical "shining" effect isn't locked to the tilt rhythm. */}
                <motion.g
                  style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                >
                  {[...Array(8)].map((_, i) => {
                    const a = (i / 8) * Math.PI * 2;
                    const rInner = gemSize * 1.15;
                    const rOuter = gemSize * 2.3;
                    return (
                      <line
                        key={`ray-${i}`}
                        x1={cx + Math.cos(a) * rInner}
                        y1={cy + Math.sin(a) * rInner}
                        x2={cx + Math.cos(a) * rOuter}
                        y2={cy + Math.sin(a) * rOuter}
                        stroke={gemColors.midLight}
                        strokeWidth="1"
                        strokeLinecap="round"
                        opacity="0.18"
                      />
                    );
                  })}
                </motion.g>

                {/* TILTING GEM GROUP — X-axis rock (top edge recedes / comes
                    forward, 8s cycle) + subtle breathing scale layered on top.
                    Gem group gets preserve-3d so the back layer + front layers
                    sit at different z-depths and the tilt reads as thickness. */}
                <motion.g
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transformBox: 'fill-box',
                    transformStyle: 'preserve-3d',
                  }}
                  animate={{
                    rotateX: [0, 25, 0, -15, 0],
                    scale: [1, 1.02, 1, 1.015, 1],
                  }}
                  transition={{
                    rotateX: {
                      duration: 8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      times: [0, 0.25, 0.5, 0.75, 1],
                    },
                    scale: {
                      duration: 3.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }}
                >
                  {/* BACK FACE — offset duplicate of the outer square sitting
                      slightly below + behind the front. When the gem tilts
                      forward (+25°) this face peeks out from below the top
                      edge, selling the thickness of the gem. */}
                  <g transform={`rotate(45 ${cx} ${cy})`}>
                    <rect
                      x={cx - gemSize * 0.98}
                      y={cy - gemSize * 0.98 + 6}
                      width={gemSize * 1.96}
                      height={gemSize * 1.96}
                      fill={gemColors.midDark}
                      opacity="0.85"
                      stroke={gemColors.base}
                      strokeWidth="0.8"
                      strokeLinejoin="miter"
                    />
                  </g>

                  {/* FRONT FACE — concentric squares */}
                  <g transform={`rotate(45 ${cx} ${cy})`}>
                    {/* Outermost — darkest body */}
                    <rect
                      x={cx - gemSize * sizes[0]}
                      y={cy - gemSize * sizes[0]}
                      width={gemSize * sizes[0] * 2}
                      height={gemSize * sizes[0] * 2}
                      fill={gemColors.midDark}
                      stroke={gemColors.base}
                      strokeWidth="1.5"
                      strokeLinejoin="miter"
                    />
                    {/* Second step — base fill */}
                    <rect
                      x={cx - gemSize * sizes[1]}
                      y={cy - gemSize * sizes[1]}
                      width={gemSize * sizes[1] * 2}
                      height={gemSize * sizes[1] * 2}
                      fill={gemColors.base}
                      opacity="0.75"
                      stroke={gemColors.midLight}
                      strokeWidth="0.8"
                      strokeLinejoin="miter"
                    />
                    {/* Third step — light fill */}
                    <rect
                      x={cx - gemSize * sizes[2]}
                      y={cy - gemSize * sizes[2]}
                      width={gemSize * sizes[2] * 2}
                      height={gemSize * sizes[2] * 2}
                      fill={gemColors.midLight}
                      opacity="0.65"
                      stroke={gemColors.midLight}
                      strokeWidth="0.6"
                      strokeLinejoin="miter"
                    />
                    {/* Fourth step — inner white frost */}
                    <rect
                      x={cx - gemSize * sizes[3]}
                      y={cy - gemSize * sizes[3]}
                      width={gemSize * sizes[3] * 2}
                      height={gemSize * sizes[3] * 2}
                      fill="white"
                      opacity="0.35"
                      stroke={gemColors.midLight}
                      strokeWidth="0.5"
                      strokeLinejoin="miter"
                    />
                    {/* Center table — bright "eye" */}
                    <rect
                      x={cx - gemSize * 0.15}
                      y={cy - gemSize * 0.15}
                      width={gemSize * 0.3}
                      height={gemSize * 0.3}
                      fill="white"
                      opacity="0.7"
                      strokeLinejoin="miter"
                    />

                    {/* Corner-to-inner facet lines */}
                    {[
                      { fx: cx - gemSize, fy: cy - gemSize, tx: cx - gemSize * sizes[3], ty: cy - gemSize * sizes[3] },
                      { fx: cx + gemSize, fy: cy - gemSize, tx: cx + gemSize * sizes[3], ty: cy - gemSize * sizes[3] },
                      { fx: cx + gemSize, fy: cy + gemSize, tx: cx + gemSize * sizes[3], ty: cy + gemSize * sizes[3] },
                      { fx: cx - gemSize, fy: cy + gemSize, tx: cx - gemSize * sizes[3], ty: cy + gemSize * sizes[3] },
                    ].map((ln, i) => (
                      <line
                        key={`corner-${i}`}
                        x1={ln.fx}
                        y1={ln.fy}
                        x2={ln.tx}
                        y2={ln.ty}
                        stroke={gemColors.midLight}
                        strokeWidth="0.8"
                        opacity="0.5"
                      />
                    ))}

                    {/* Specular highlight on upper-left inner step */}
                    <ellipse
                      cx={cx - gemSize * 0.08}
                      cy={cy - gemSize * 0.08}
                      rx={gemSize * 0.1}
                      ry={gemSize * 0.06}
                      fill="white"
                      opacity="0.5"
                    />
                  </g>
                </motion.g>

                {/* ORBITING SPARKLES — three tiny sparkles traveling arcs
                    around the gem at different radii + phases. Classic Disney
                    "secondary action" — their motion is independent of the
                    gem's own rhythm, so the scene feels alive. */}
                {[
                  { radius: gemSize * 1.4, duration: 6.0, phase: 0 },
                  { radius: gemSize * 1.7, duration: 8.5, phase: Math.PI * 0.7 },
                  { radius: gemSize * 1.25, duration: 5.2, phase: Math.PI * 1.4 },
                ].map((spark, i) => (
                  <motion.g
                    key={`spark-${i}`}
                    style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'fill-box' }}
                    animate={{ rotate: [0 + (spark.phase * 180) / Math.PI, 360 + (spark.phase * 180) / Math.PI] }}
                    transition={{ duration: spark.duration, repeat: Infinity, ease: 'linear' }}
                  >
                    <motion.circle
                      cx={cx + spark.radius}
                      cy={cy}
                      r={1.8}
                      fill="white"
                      animate={{
                        opacity: [0.2, 1, 0.9, 0.3, 0.2],
                        r: [1.2, 2.4, 2.0, 1.4, 1.2],
                      }}
                      transition={{
                        duration: spark.duration * 0.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{ filter: `drop-shadow(0 0 4px ${gemColors.midLight})` }}
                    />
                  </motion.g>
                ))}

                {/* PULSING WHITE CORE — stays centered, outside the tilt group */}
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="white"
                  animate={{
                    opacity: [0.8, 1, 0.8],
                    r: celebrating ? [3, 7, 3] : [2.5, 5, 2.5],
                  }}
                  transition={{
                    duration: celebrating ? 1.0 : 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* THREE ORB ACCENTS — Dominant top, Supporting left,
                    Balancing right. OUTSIDE the tilt group so they stay
                    fixed in screen space at the gem's corners. */}
                {orbPositions.map((p, i) => (
                  <g key={`orb-${i}`}>
                    <circle cx={p.x} cy={p.y} r="12" fill={selectedColors[i]} opacity="0.5" filter="url(#cv-glow)" />
                    <circle cx={p.x} cy={p.y} r="7" fill={selectedColors[i]} />
                    <circle cx={p.x - 1.8} cy={p.y - 1.8} r="2" fill="white" opacity="0.75" />
                  </g>
                ))}
              </motion.g>
            );
          })()}
        </AnimatePresence>

        {/* Celebration burst — radial sparkles on confirm */}
        {celebrating && count === 3 && (
          <motion.g key="burst" style={{ transformOrigin: `${cx}px ${cy}px` }}>
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const r = ringRadius * 0.9;
              const x2 = cx + Math.cos(angle) * r;
              const y2 = cy + Math.sin(angle) * r;
              return (
                <motion.line
                  key={`burst-${i}`}
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke={primaryColor}
                  strokeWidth="1.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: [0, 1, 0.7], opacity: [0, 0.75, 0] }}
                  transition={{ duration: 1.4, delay: i * 0.04, ease: 'easeOut' }}
                />
              );
            })}
          </motion.g>
        )}
      </svg>

      {/* Interactive orb buttons — overlaid as DOM so they're tappable */}
      {orbPositions.map((pos) => {
        const isSelected = selectedOrbIds.includes(pos.id);
        const selectedIdx = selectedOrbIds.indexOf(pos.id);
        const isFaded = full && !isSelected;
        return (
          <OrbButton
            key={pos.id}
            orb={pos}
            x={pos.x}
            y={pos.y}
            isSelected={isSelected}
            selectedIdx={selectedIdx}
            isFaded={isFaded}
            disabled={disabled || (isFaded && !isSelected)}
            celebrating={celebrating}
            onTap={() => onOrbTap?.(pos.id, pos.idx)}
          />
        );
      })}

      {/* Empty-state prompt — vanishes on first selection */}
      <AnimatePresence>
        {count === 0 && (
          <motion.div
            key="empty-hint"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <p className="text-[10px] font-mono text-ivory/40 uppercase tracking-[0.25em] text-center leading-relaxed">
              tap an essence<br />to begin
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const CrystalViewport = memo(CrystalViewportImpl);

interface OrbButtonProps {
  orb: OrbDef;
  x: number;
  y: number;
  isSelected: boolean;
  selectedIdx: number;
  isFaded: boolean;
  disabled: boolean;
  celebrating: boolean;
  onTap: () => void;
}

function OrbButtonImpl({
  orb,
  x,
  y,
  isSelected,
  selectedIdx,
  isFaded,
  disabled,
  celebrating,
  onTap,
}: OrbButtonProps) {
  const orbSize = isSelected ? 44 : 38;

  return (
    <motion.button
      onClick={onTap}
      disabled={disabled}
      data-testid={`orb-${orb.id}`}
      aria-label={`${orb.id} — ${orb.label}${isSelected ? ` (selected position ${selectedIdx + 1})` : ''}`}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      animate={{
        // Dim unselected orbs so they don't compete with the crystal — the
        // chosen ones stay bright, unpicked dock orbs recede to a quieter
        // 0.5. Once the crystal is full, unselected fade further (0.22).
        opacity: isFaded ? 0.22 : isSelected ? 1 : 0.5,
      }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute flex flex-col items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
      style={{
        left: x - orbSize / 2,
        // Lift the orb slightly when selected so the label doesn't collide
        // with the ring guide visually.
        top: y - orbSize / 2,
        width: orbSize,
      }}
    >
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: orbSize,
          height: orbSize,
          background: `radial-gradient(circle at 38% 30%, ${orb.colour}c8, ${orb.colour}60 55%, ${orb.colour}22)`,
          fontSize: isSelected ? 20 : 17,
        }}
        animate={{
          scale: celebrating && isSelected ? [1, 1.18, 1] : isSelected ? [1, 1.08, 1] : [1, 1.04, 1],
          boxShadow: isSelected
            ? [
                `0 0 18px ${orb.colour}cc, 0 0 36px ${orb.colour}50`,
                `0 0 24px ${orb.colour}e0, 0 0 44px ${orb.colour}60`,
                `0 0 18px ${orb.colour}cc, 0 0 36px ${orb.colour}50`,
              ]
            : [`0 0 8px ${orb.colour}50`, `0 0 12px ${orb.colour}70`, `0 0 8px ${orb.colour}50`],
        }}
        transition={{
          duration: isSelected ? 2.0 : 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>{orb.icon}</span>

        {/* Selection order badge */}
        <AnimatePresence>
          {isSelected && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                background: orb.colour,
                color: '#0C0E12',
                border: '1.5px solid #0C0E12',
              }}
            >
              {selectedIdx + 1}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Orb name — small caps below the sphere */}
      <span
        className={`text-[9.5px] font-mono uppercase tracking-wider leading-none ${
          isSelected ? 'text-white' : 'text-ivory/65'
        }`}
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
      >
        {orb.id}
      </span>
    </motion.button>
  );
}

const OrbButton = memo(OrbButtonImpl);
