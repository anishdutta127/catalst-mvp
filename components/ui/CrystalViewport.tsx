'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo } from 'react';

export interface OrbDef {
  id: string;
  icon: string;
  colour: string;
  label: string;
}

/**
 * Blend 1–3 hex colors into a gem triplet (base/light/dark).
 * Average the RGB channels, lift for `light`, cut for `dark`.
 */
function blendColors(
  hexColors: string[],
): { base: string; light: string; dark: string } {
  const list = hexColors.length > 0 ? hexColors : ['#D4A843'];
  const rgbs = list.map((h) => {
    const hex = h.replace('#', '');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  });
  const avg = rgbs.reduce(
    (acc, c) => ({
      r: acc.r + c.r / rgbs.length,
      g: acc.g + c.g / rgbs.length,
      b: acc.b + c.b / rgbs.length,
    }),
    { r: 0, g: 0, b: 0 },
  );
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  const base = `#${toHex(avg.r)}${toHex(avg.g)}${toHex(avg.b)}`;
  const light = `#${toHex(avg.r + 70)}${toHex(avg.g + 70)}${toHex(avg.b + 70)}`;
  const dark = `#${toHex(avg.r * 0.38)}${toHex(avg.g * 0.38)}${toHex(avg.b * 0.38)}`;
  return { base, light, dark };
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

  // Triangle vertex positions for the crystal.
  const vertexDist = size * 0.14;
  const triangleVertices = useMemo(
    () => [
      { x: cx, y: cy - vertexDist },
      { x: cx - vertexDist * 0.866, y: cy + vertexDist * 0.5 },
      { x: cx + vertexDist * 0.866, y: cy + vertexDist * 0.5 },
    ],
    [cx, cy, vertexDist],
  );

  // Midpoints of each outer edge — used to carve the gem into 6 facets that
  // meet at the center, giving the final crystal a diamond-cut look.
  const edgeMidpoints = useMemo(
    () => [
      {
        x: (triangleVertices[0].x + triangleVertices[1].x) / 2,
        y: (triangleVertices[0].y + triangleVertices[1].y) / 2,
      },
      {
        x: (triangleVertices[1].x + triangleVertices[2].x) / 2,
        y: (triangleVertices[1].y + triangleVertices[2].y) / 2,
      },
      {
        x: (triangleVertices[2].x + triangleVertices[0].x) / 2,
        y: (triangleVertices[2].y + triangleVertices[0].y) / 2,
      },
    ],
    [triangleVertices],
  );

  const selectedColors = selectedOrbIds.map(
    (id) => allOrbs.find((o) => o.id === id)?.colour || '#D4A843',
  );
  const primaryColor = selectedColors[0] || '#D4A843';
  const full = count >= 3;
  const gemColors = blendColors(selectedColors);

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

      {/* SVG layer — decorative geometry only (orbs are DOM buttons overlaid) */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <linearGradient id="cv-facet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.45" />
            <stop offset="50%" stopColor={primaryColor} stopOpacity="0.65" />
            <stop offset="100%" stopColor="white" stopOpacity="0.15" />
          </linearGradient>
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

        {/* CRYSTAL — grows with selections */}
        <AnimatePresence mode="wait">
          {count === 1 && (
            <motion.circle
              key="v1"
              cx={cx}
              cy={cy}
              r={12}
              fill={selectedColors[0]}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.95] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              filter="url(#cv-glow-strong)"
            />
          )}

          {count === 2 && (
            <motion.g
              key="v2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {/* Faint glowing strip between the two vertices — suggests the
                  gem beginning to form before the triangle completes */}
              <motion.line
                x1={triangleVertices[0].x}
                y1={triangleVertices[0].y}
                x2={triangleVertices[1].x}
                y2={triangleVertices[1].y}
                stroke={selectedColors[0]}
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.25"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* Crisp connecting edge */}
              <motion.line
                x1={triangleVertices[0].x}
                y1={triangleVertices[0].y}
                x2={triangleVertices[1].x}
                y2={triangleVertices[1].y}
                stroke={selectedColors[0]}
                strokeWidth="2.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                filter="url(#cv-glow)"
              />
              {/* Vertex orbs — outer halo + solid core + tiny white highlight */}
              {triangleVertices.slice(0, 2).map((v, i) => (
                <motion.g
                  key={`v2-vtx-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.25, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: `${v.x}px ${v.y}px` }}
                >
                  <circle cx={v.x} cy={v.y} r="12" fill={selectedColors[i]} opacity="0.35" />
                  <circle cx={v.x} cy={v.y} r="8" fill={selectedColors[i]} />
                  <circle cx={v.x - 2} cy={v.y - 2} r="2" fill="white" opacity="0.7" />
                </motion.g>
              ))}
            </motion.g>
          )}

          {count === 3 && (
            <motion.g
              key="v3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: celebrating ? [1, 1.22, 1.08] : [0, 1.15, 1],
                opacity: 1,
                rotate: [0, 360],
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                scale: {
                  duration: celebrating ? 1.4 : 0.85,
                  times: [0, 0.6, 1],
                  ease: [0.34, 1.56, 0.64, 1],
                },
                opacity: { duration: 0.4 },
                rotate: { duration: celebrating ? 10 : 22, repeat: Infinity, ease: 'linear' },
              }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              {/* Outer halo — pulses the gem's blended color outward */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={vertexDist * 1.4}
                fill={gemColors.base}
                animate={{
                  r: [vertexDist * 1.4, vertexDist * 1.7, vertexDist * 1.4],
                  opacity: [0.15, 0.35, 0.15],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* GEM BODY — solid dark fill so the gem has weight and depth */}
              <polygon
                points={triangleVertices.map((v) => `${v.x},${v.y}`).join(' ')}
                fill={gemColors.dark}
                stroke={gemColors.base}
                strokeWidth="1.5"
                opacity="0.95"
              />

              {/* SIX FACETS — overlapping triangles (vertex → center → edge-mid),
                  alternating base/light fills and varied opacity to simulate a
                  diamond-cut surface catching light from different angles. */}
              <polygon
                points={`${triangleVertices[0].x},${triangleVertices[0].y} ${cx},${cy} ${edgeMidpoints[0].x},${edgeMidpoints[0].y}`}
                fill={gemColors.base}
                opacity="0.55"
              />
              <polygon
                points={`${triangleVertices[1].x},${triangleVertices[1].y} ${cx},${cy} ${edgeMidpoints[0].x},${edgeMidpoints[0].y}`}
                fill={gemColors.base}
                opacity="0.35"
              />
              <polygon
                points={`${triangleVertices[1].x},${triangleVertices[1].y} ${cx},${cy} ${edgeMidpoints[1].x},${edgeMidpoints[1].y}`}
                fill={gemColors.light}
                opacity="0.40"
              />
              <polygon
                points={`${triangleVertices[2].x},${triangleVertices[2].y} ${cx},${cy} ${edgeMidpoints[1].x},${edgeMidpoints[1].y}`}
                fill={gemColors.base}
                opacity="0.50"
              />
              <polygon
                points={`${triangleVertices[2].x},${triangleVertices[2].y} ${cx},${cy} ${edgeMidpoints[2].x},${edgeMidpoints[2].y}`}
                fill={gemColors.light}
                opacity="0.45"
              />
              <polygon
                points={`${triangleVertices[0].x},${triangleVertices[0].y} ${cx},${cy} ${edgeMidpoints[2].x},${edgeMidpoints[2].y}`}
                fill={gemColors.base}
                opacity="0.35"
              />

              {/* FACET EDGES — thin bright lines along the cut seams */}
              {triangleVertices.map((v, i) => (
                <line
                  key={`facet-edge-${i}`}
                  x1={v.x}
                  y1={v.y}
                  x2={cx}
                  y2={cy}
                  stroke={gemColors.light}
                  strokeWidth="0.7"
                  opacity="0.6"
                />
              ))}
              {edgeMidpoints.map((m, i) => (
                <line
                  key={`edge-mid-${i}`}
                  x1={m.x}
                  y1={m.y}
                  x2={cx}
                  y2={cy}
                  stroke={gemColors.light}
                  strokeWidth="0.4"
                  opacity="0.4"
                />
              ))}

              {/* HIGHLIGHT SHEEN — small bright triangle simulating a
                  specular reflection off the top-left facet */}
              <polygon
                points={`${triangleVertices[0].x},${triangleVertices[0].y} ${
                  cx - vertexDist * 0.15
                },${cy - vertexDist * 0.2} ${cx + vertexDist * 0.1},${
                  cy - vertexDist * 0.1
                }`}
                fill="white"
                opacity="0.32"
              />

              {/* VERTEX ORBS — the three user-selected colors, larger and
                  brighter than the build-up states, each with a tiny white
                  highlight so they read as polished beads, not flat dots. */}
              {triangleVertices.map((v, i) => (
                <g key={`vtx-${i}`}>
                  <circle
                    cx={v.x}
                    cy={v.y}
                    r="14"
                    fill={selectedColors[i]}
                    opacity="0.4"
                    filter="url(#cv-glow)"
                  />
                  <circle cx={v.x} cy={v.y} r="9" fill={selectedColors[i]} />
                  <circle cx={v.x - 2} cy={v.y - 2} r="2.5" fill="white" opacity="0.75" />
                </g>
              ))}

              {/* PULSING WHITE CORE — the gem's inner vitality */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={6}
                fill="white"
                animate={{
                  opacity: [0.7, 1, 0.7],
                  r: celebrating ? [6, 12, 6] : [5, 8, 5],
                }}
                transition={{ duration: celebrating ? 1.0 : 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.g>
          )}
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
        opacity: isFaded ? 0.22 : 1,
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
