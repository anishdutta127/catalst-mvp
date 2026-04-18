'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo } from 'react';

export interface OrbDef {
  id: string;
  icon: string;
  colour: string;
  label: string;
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

  const selectedColors = selectedOrbIds.map(
    (id) => allOrbs.find((o) => o.id === id)?.colour || '#D4A843',
  );
  const primaryColor = selectedColors[0] || '#D4A843';
  const full = count >= 3;

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      data-testid="crystal-viewport"
    >
      {/* Radial vignette — softens outside the ring so attention centers */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(12,14,18,0) 0%, rgba(12,14,18,0.55) 72%, rgba(12,14,18,0.9) 100%)`,
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

        {/* Light trails — selected orbs → center */}
        {orbPositions.map((pos) => {
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
              transition={{
                duration: 0.9,
                delay: selectedIdx * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              filter="url(#cv-glow)"
            />
          );
        })}

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
              {triangleVertices.slice(0, 2).map((v, i) => (
                <motion.circle
                  key={`v2-vtx-${i}`}
                  cx={v.x}
                  cy={v.y}
                  r={12}
                  fill={selectedColors[i]}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  filter="url(#cv-glow)"
                />
              ))}
            </motion.g>
          )}

          {count === 3 && (
            <motion.g
              key="v3"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{
                scale: celebrating ? [1, 1.22, 1.08] : [0.7, 1.15, 1],
                opacity: 1,
                rotate: [0, 360],
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                scale: { duration: celebrating ? 1.4 : 0.9, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.5 },
                rotate: { duration: celebrating ? 10 : 22, repeat: Infinity, ease: 'linear' },
              }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              {/* Base triangle with gradient facet */}
              <polygon
                points={triangleVertices.map((v) => `${v.x},${v.y}`).join(' ')}
                fill="url(#cv-facet)"
                stroke={primaryColor}
                strokeWidth="1.5"
                opacity="0.78"
              />
              {/* Internal facet lines (3 spokes to center) */}
              {triangleVertices.map((v, i) => (
                <line
                  key={`facet-${i}`}
                  x1={v.x}
                  y1={v.y}
                  x2={cx}
                  y2={cy}
                  stroke="white"
                  strokeWidth="0.8"
                  opacity="0.4"
                />
              ))}
              {/* Vertex orbs */}
              {triangleVertices.map((v, i) => (
                <circle
                  key={`vtx-${i}`}
                  cx={v.x}
                  cy={v.y}
                  r={12}
                  fill={selectedColors[i]}
                  filter="url(#cv-glow)"
                />
              ))}
              {/* Pulsing white core */}
              <motion.circle
                cx={cx}
                cy={cy}
                r={5}
                fill="white"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  r: celebrating ? [5, 12, 5] : [4, 8, 4],
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
