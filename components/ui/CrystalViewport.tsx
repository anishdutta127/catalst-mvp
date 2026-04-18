'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { memo, useMemo } from 'react';
import { Crystal } from './Crystal';

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
 * CrystalViewport — S06's interaction surface.
 *
 * Responsibilities (now):
 *   1. Radial vignette + nebula glow backdrop
 *   2. Ring guide (dashed circle) + 8-axis radar polygon
 *   3. Light trails from selected orbs → center (count 1/2 only)
 *   4. Interactive orb buttons on the ring (DOM siblings, not SVG, so they
 *      can receive taps + render text labels)
 *   5. Celebration burst on confirm
 *
 * What it DOESN'T own anymore: the crystal geometry itself. The gem lives
 * in <Crystal/>, a standalone DOM component that both S06 (through this
 * viewport) and S08 render directly. This viewport centers Crystal inside
 * the ring; everything else is chrome around it.
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

  const selectedColors = selectedOrbIds.map(
    (id) => allOrbs.find((o) => o.id === id)?.colour || '#D4A843',
  );
  const primaryColor = selectedColors[0] || '#D4A843';
  const full = count >= 3;

  // Crystal render mode — while forming, no spin on intermediate states so
  // the seed/spine read as "gathering". Once the gem completes, idle float
  // + spin take over until the celebration beat.
  const crystalMode: 'forming' | 'idle' = count === 3 ? 'idle' : 'forming';
  const crystalCount: 1 | 2 | 3 = count === 0 ? 1 : (Math.min(count, 3) as 1 | 2 | 3);
  const crystalSize = size * 0.58;

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      data-testid="crystal-viewport"
    >
      {/* Radial vignette — stronger so the crystal reads clearly against the
          busy cave background. Cave art stays visible at the edges (atmospheric)
          but doesn't fight the gem for attention. */}
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

      {/* SVG layer — ring, radar polygon, trails, celebration burst. Crystal
          itself is a DOM sibling below this (rendered after in source order
          so it layers on top of these chrome elements). */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <filter id="cv-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
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

      {/* THE CRYSTAL — centered, DOM-level so it can use CSS 3D transforms
          (which SVG doesn't reliably support). Subtle scale pop on celebrate. */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ scale: celebrating ? [1, 1.12, 1.06] : 1 }}
        transition={{
          duration: celebrating ? 1.3 : 0.4,
          times: celebrating ? [0, 0.5, 1] : undefined,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        <Crystal
          orbs={selectedColors}
          count={crystalCount}
          size={crystalSize}
          mode={crystalMode}
          floatIntensity={count === 3 ? 1 : 0}
        />
      </motion.div>

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

      {/* Empty-state prompt lives in S06Crystal above the viewport now —
          having it here (overlaid on the center) collided with the halo
          orb which sits at the same y-position. */}
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
